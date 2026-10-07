import {sql} from 'drizzle-orm'
import {db} from '@/db'
import {z} from 'zod'
import {requireAdminPermission} from '@/lib/server/admin-auth'
export const auditQuery=z.object({page:z.coerce.number().int().min(1).max(100000).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(25),actor:z.string().trim().max(100).default(''),action:z.string().trim().max(80).regex(/^[a-z0-9_.:\-]*$/i).default(''),entity:z.string().trim().max(60).regex(/^[a-z0-9_\-]*$/i).default(''),from:z.union([z.iso.date(),z.literal('')]).default(''),to:z.union([z.iso.date(),z.literal('')]).default('')})
/** Read-only. There is intentionally no update or delete function for audit logs anywhere in the application. */
export async function listAudit(q:z.infer<typeof auditQuery>){await requireAdminPermission('audit.view');const like=(s:string)=>'%'+s.replace(/[\\%_]/g,'\\$&')+'%'
 const conds=[sql`true`,...(q.actor?[sql`(u.email ilike ${like(q.actor)} or concat_ws(' ',u.first_name,u.last_name) ilike ${like(q.actor)})`]:[]),...(q.action?[sql`a.action ilike ${like(q.action)}`]:[]),...(q.entity?[sql`a.entity_type=${q.entity}`]:[]),...(q.from?[sql`a.created_at>=${q.from}::date`]:[]),...(q.to?[sql`a.created_at<${q.to}::date+1`]:[])];const where=sql.join(conds,sql` and `)
 const [rows,total,entities]=await Promise.all([
  db.execute(sql`select a.id,to_char(a.created_at,'YYYY-MM-DD HH24:MI:SS') as "createdAt",coalesce(u.email,'system') as actor,a.action,a.entity_type as entity,a.entity_id as "entityId",coalesce(a.metadata::text,'') as metadata from audit_logs a left join users u on u.id=a.actor_user_id where ${where} order by a.created_at desc,a.id limit ${q.pageSize} offset ${(q.page-1)*q.pageSize}`),
  db.execute(sql`select count(*)::int as count from audit_logs a left join users u on u.id=a.actor_user_id where ${where}`),
  db.execute(sql`select distinct entity_type as e from audit_logs where entity_type is not null order by 1 limit 100`)])
 return {data:rows.rows as Record<string,unknown>[],total:Number(total.rows[0].count),entities:entities.rows.map(r=>String(r.e))}}
