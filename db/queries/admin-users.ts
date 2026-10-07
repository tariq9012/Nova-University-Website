import {sql} from 'drizzle-orm'
import {db} from '@/db'
import {z} from 'zod'
import {AppError,NotFoundError,parseParams} from '@/lib/server/api'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {reasonSchema} from '@/lib/admin/resources'

export const adminUserQuery=z.object({page:z.coerce.number().int().min(1).max(10000).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20),search:z.string().trim().max(100).default(''),role:z.string().max(40).regex(/^[a-z_]*$/).default(''),status:z.enum(['','active','inactive','suspended']).default(''),verified:z.enum(['','yes','no']).default(''),sort:z.enum(['created','-created','name','email','login']).default('-created')})
const order={created:sql`u.created_at,u.id`,'-created':sql`u.created_at desc,u.id`,name:sql`lower(concat_ws(' ',u.last_name,u.first_name)),u.id`,email:sql`lower(u.email),u.id`,login:sql`u.last_login_at desc nulls last,u.id`}
/** Only whitelisted columns are selected: password hashes, session data and tokens are never read here. */
export async function listAdminUsers(p:z.infer<typeof adminUserQuery>){await requireAdminPermission('users.view')
 const like='%'+p.search.replace(/[\\%_]/g,'\\$&')+'%'
 const conds=[sql`true`,...(p.search?[sql`(u.email ilike ${like} or concat_ws(' ',u.first_name,u.last_name) ilike ${like})`]:[]),...(p.status?[sql`u.status::text=${p.status}`]:[]),...(p.verified?[p.verified==='yes'?sql`u.email_verified_at is not null`:sql`u.email_verified_at is null`]:[]),...(p.role?[sql`exists(select 1 from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=u.id and r.name=${p.role})`]:[])]
 const where=sql.join(conds,sql` and `)
 const [rows,total]=await Promise.all([db.execute(sql`select u.id,concat_ws(' ',u.first_name,u.last_name) as name,u.email,u.status::text as status,case when u.email_verified_at is null then 'No' else 'Yes' end as verified,coalesce((select string_agg(r.name,', ' order by r.name) from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=u.id),'') as roles,to_char(u.created_at,'YYYY-MM-DD') as created,coalesce(to_char(u.last_login_at,'YYYY-MM-DD HH24:MI'),'Never') as "lastLogin" from users u where ${where} order by ${order[p.sort]} limit ${p.pageSize} offset ${(p.page-1)*p.pageSize}`),db.execute(sql`select count(*)::int as count from users u where ${where}`)])
 return {data:rows.rows as Record<string,unknown>[],total:Number(total.rows[0].count)}}

export async function getAdminUser(id:string){await requireAdminPermission('users.view')
 const u=await db.execute(sql`select u.id,u.email,concat_ws(' ',u.first_name,u.last_name) as name,u.phone,u.status::text as status,u.email_verified_at as "verifiedAt",u.created_at as "createdAt",u.last_login_at as "lastLoginAt",coalesce((select json_agg(r.name order by r.name) from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=u.id),'[]'::json) as roles,(select count(*)::int from auth_sessions s where s.user_id=u.id and s.expires_at>now() and s.auth_version=u.auth_version) as "activeSessions" from users u where u.id=${id}::uuid`)
 if(!u.rows[0])throw new NotFoundError()
 const [student,faculty,activity]=await Promise.all([
  db.execute(sql`select sp.id,sp.student_number as "studentNumber",sp.academic_status as "academicStatus",p.name as program from student_profiles sp left join programs p on p.id=sp.program_id where sp.user_id=${id}::uuid`),
  db.execute(sql`select f.id,concat_ws(' ',f.title,f.first_name,f.last_name) as name,d.name as department from faculty_profiles f join departments d on d.id=f.department_id where f.user_id=${id}::uuid`),
  db.execute(sql`select a.id,a.action,a.entity_type as "entityType",a.created_at as "createdAt",concat_ws(' ',ua.first_name,ua.last_name) as actor from audit_logs a left join users ua on ua.id=a.actor_user_id where (a.entity_type='user' and a.entity_id=${id}) or a.actor_user_id=${id}::uuid order by a.created_at desc,a.id limit 15`)])
 return {user:u.rows[0] as Record<string,unknown>,student:student.rows[0]??null,faculty:faculty.rows[0]??null,activity:activity.rows as Record<string,unknown>[]}}

export const revokeBody=z.object({reason:reasonSchema}).strict()
/** Ends every session of another user. An administrator cannot revoke their own sessions here (use logout). */
export async function revokeUserSessions(id:string,input:unknown){const actor=await requireAdminPermission('users.manage');const b=parseParams(revokeBody,input)
 if(id===actor.id)throw new AppError('FORBIDDEN','You cannot revoke your own sessions here. Use sign out instead.',403)
 const r=await db.execute(sql`with target as (select id from users where id=${id}::uuid), revoked as (delete from auth_sessions where user_id in (select id from target) returning id), bumped as (update users set auth_version=auth_version+1,updated_at=now() where id in (select id from target)), logged as (insert into audit_logs(actor_user_id,action,entity_type,entity_id,metadata) select ${actor.id}::uuid,'admin.user_sessions_revoked','user',id::text,jsonb_build_object('reason',${b.reason}::text,'sessions',(select count(*) from revoked)) from target) select id from target`)
 if(!r.rows[0])throw new NotFoundError();return {revoked:true}}
