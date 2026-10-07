import {sql} from 'drizzle-orm'
import {db} from '@/db'
import {z} from 'zod'
import {AppError,NotFoundError,parseParams} from '@/lib/server/api'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {PERMISSIONS,type Permission} from '@/lib/permissions'
import {reasonSchema} from '@/lib/admin/resources'
export const permissionChange=z.object({userId:z.uuid(),permissionKey:z.enum(PERMISSIONS),effect:z.enum(['allow','deny','clear']),reason:reasonSchema}).strict()
export async function listAdminOverrides(){await requireAdminPermission('settings.manage')
 const r=await db.execute(sql`select o.user_id as "userId",u.email,o.permission_key as "permissionKey",o.effect,o.reason,o.created_at as "createdAt" from user_permission_overrides o join users u on u.id=o.user_id order by u.email,o.permission_key`)
 const admins=await db.execute(sql`select u.id,u.email from users u join user_roles ur on ur.user_id=u.id join roles r on r.id=ur.role_id where r.name='admin' order by u.email`)
 return {overrides:r.rows as Record<string,unknown>[],admins:admins.rows as {id:string;email:string}[]}}
/** Changing what another administrator may do is a high-risk action: settings.manage, a reason, never on yourself, always audited. */
export async function changePermission(input:unknown){const actor=await requireAdminPermission('settings.manage');const p=parseParams(permissionChange,input)
 if(p.userId===actor.id)throw new AppError('FORBIDDEN','You cannot change your own permissions.',403)
 const key:Permission=p.permissionKey
 const r=await db.execute(sql`with target as (select u.id from users u join user_roles ur on ur.user_id=u.id join roles r on r.id=ur.role_id where u.id=${p.userId}::uuid and r.name='admin' limit 1), removed as (delete from user_permission_overrides where user_id in (select id from target) and permission_key=${key} and ${p.effect}='clear' returning user_id), upserted as (insert into user_permission_overrides(user_id,permission_key,effect,reason,granted_by) select id,${key},${p.effect},${p.reason},${actor.id}::uuid from target where ${p.effect}<>'clear' on conflict(user_id,permission_key) do update set effect=excluded.effect,reason=excluded.reason,granted_by=excluded.granted_by,created_at=now() returning user_id), logged as (insert into audit_logs(actor_user_id,action,entity_type,entity_id,metadata) select ${actor.id}::uuid,'admin.permission_changed','user',id::text,jsonb_build_object('permission',${key}::text,'effect',${p.effect}::text,'reason',${p.reason}::text) from target) select id from target`)
 if(!r.rows[0])throw new NotFoundError('Target must be an existing administrator.');return {changed:true}}
