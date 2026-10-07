import {sql} from 'drizzle-orm'
import {db} from '@/db'
import {AppError,NotFoundError,parseParams} from '@/lib/server/api'
import {requireAdminPermission,permissionsForUser} from '@/lib/server/admin-auth'
import {roleChangeInput} from '@/lib/admin/operations'
import {isPrivilegedRole} from '@/lib/admin/rules'

export async function roleOverview(userId:string){await requireAdminPermission('users.view')
 const [roles,mine,perms]=await Promise.all([db.execute(sql`select name,description from roles order by name`),db.execute(sql`select r.name from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=${userId}::uuid order by r.name`),permissionsForUser(userId)])
 return {allRoles:roles.rows as {name:string;description:string|null}[],current:mine.rows.map(r=>String(r.name)),effective:[...perms].sort()}}

/**
 * Add/remove a role for ANOTHER user. One transaction (advisory lock + single statement):
 * - never on yourself; privileged roles need settings.manage and a typed email confirmation;
 * - the last active administrator cannot lose the admin role; a user always keeps at least one role;
 * - granting admin requires an active, verified target; sessions are revoked so privileges refresh immediately;
 * - the audit row is written in the same statement.
 */
export async function changeUserRole(userId:string,input:unknown){const actor=await requireAdminPermission('users.manage');const p=parseParams(roleChangeInput,input)
 if(userId===actor.id)throw new AppError('FORBIDDEN','You cannot change your own roles.',403)
 const privileged=isPrivilegedRole(p.role);if(privileged)await requireAdminPermission('settings.manage')
 const t=await db.execute(sql`select email from users where id=${userId}::uuid`);if(!t.rows[0])throw new NotFoundError()
 if(privileged&&p.confirmEmail?.toLowerCase()!==String(t.rows[0].email).toLowerCase())throw new AppError('VALIDATION_ERROR','Type the target user\'s email address to confirm a privileged role change.',400)
 const lock=db.execute(sql`select pg_advisory_xact_lock(hashtext('nova-admin-roles'))`)
 const audit=(action:string)=>sql`insert into audit_logs(actor_user_id,action,entity_type,entity_id,metadata) select ${actor.id}::uuid,${action},'user',${userId},jsonb_build_object('role',${p.role}::text,'reason',${p.reason}::text,'privileged',${privileged}::boolean) from done`
 const main=p.action==='add'
  ?sql`with role as (select id from roles where name=${p.role}), target as (select u.id from users u where u.id=${userId}::uuid and (${!privileged} or (u.status='active' and u.email_verified_at is not null))), done as (insert into user_roles(user_id,role_id) select target.id,role.id from target cross join role on conflict do nothing returning user_id), bumped as (update users set auth_version=auth_version+1,updated_at=now() where id in (select user_id from done)), ended as (delete from auth_sessions where user_id in (select user_id from done)), logged as (${audit('admin.role_added')}) select user_id from done`
  :sql`with role as (select id,name from roles where name=${p.role}), done as (delete from user_roles ur using role where ur.user_id=${userId}::uuid and ur.role_id=role.id and (select count(*) from user_roles x where x.user_id=ur.user_id)>1 and (role.name<>'admin' or exists(select 1 from users u2 join user_roles r2 on r2.user_id=u2.id join roles rr on rr.id=r2.role_id where rr.name='admin' and u2.status='active' and u2.id<>ur.user_id)) returning ur.user_id), bumped as (update users set auth_version=auth_version+1,updated_at=now() where id in (select user_id from done)), ended as (delete from auth_sessions where user_id in (select user_id from done)), logged as (${audit('admin.role_removed')}) select user_id from done`
 const [,res]=await db.batch([lock,db.execute(main)]) as unknown as [unknown,{rows:unknown[]}]
 if(!res.rows[0]){const r=await db.execute(sql`select exists(select 1 from roles where name=${p.role}) as role_ok,exists(select 1 from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=${userId}::uuid and r.name=${p.role}) as has_role`)
  const x=r.rows[0] as {role_ok:boolean;has_role:boolean};if(!x.role_ok)throw new NotFoundError('Unknown role.')
  if(p.action==='add'&&x.has_role)throw new AppError('CONFLICT','The user already has this role.',409)
  if(p.action==='add')throw new AppError('CONFLICT','Administrator roles can only be granted to active users with a verified email.',409)
  if(!x.has_role)throw new AppError('CONFLICT','The user does not have this role.',409)
  throw new AppError('CONFLICT','This role cannot be removed: the last active administrator must keep admin access and every user needs at least one role.',409)}
 return {changed:true}}
