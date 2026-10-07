import {sql,type SQL} from 'drizzle-orm'
import {db} from '@/db'
import {z} from 'zod'
import {NotFoundError,parseParams} from '@/lib/server/api'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {reasonSchema} from '@/lib/admin/resources'
import {cmsKinds,type CmsKind} from '@/lib/admin/cms'
const table:Record<CmsKind,string>={news:'news',events:'events',announcements:'announcements',scholarships:'scholarships'}
export const cmsListQuery=z.object({page:z.coerce.number().int().min(1).max(10000).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20),search:z.string().trim().max(100).default(''),status:z.enum(['','draft','published','archived']).default(''),category:z.union([z.uuid(),z.literal('')]).default(''),featured:z.enum(['','yes']).default('')})
export type CmsListQuery=z.infer<typeof cmsListQuery>
const extra:Record<CmsKind,SQL>={news:sql`t.featured as featured,to_char(t.published_at,'YYYY-MM-DD') as "publishedOn"`,events:sql`t.featured as featured,to_char(t.starts_at,'YYYY-MM-DD HH24:MI') as "publishedOn"`,announcements:sql`t.audience::text as featured,coalesce(to_char(t.expires_at,'YYYY-MM-DD'),'No expiry') as "publishedOn"`,scholarships:sql`t.is_active as featured,coalesce(t.deadline::text,'No deadline') as "publishedOn"`}
export async function listCms(kind:CmsKind,q:CmsListQuery){await requireAdminPermission('cms.view');const t=sql.raw(table[kind]);const like='%'+q.search.replace(/[\\%_]/g,'\\$&')+'%'
 const conds=[sql`true`,...(q.search?[sql`(t.title ilike ${like} or t.slug ilike ${like})`]:[]),...(q.status?[sql`t.status::text=${q.status}`]:[]),...(q.category&&kind!=='scholarships'?[sql`t.category_id=${q.category}::uuid`]:[]),...(q.featured&&(kind==='news'||kind==='events')?[sql`t.featured`]:[])];const where=sql.join(conds,sql` and `)
 const [rows,total]=await Promise.all([db.execute(sql`select t.id,t.title,t.slug,t.status::text as status,${extra[kind]},to_char(t.updated_at,'YYYY-MM-DD') as updated from ${t} t where ${where} order by t.updated_at desc,t.id limit ${q.pageSize} offset ${(q.page-1)*q.pageSize}`),db.execute(sql`select count(*)::int as count from ${t} t where ${where}`)])
 return {data:rows.rows as Record<string,unknown>[],total:Number(total.rows[0].count)}}
export async function readCms(kind:CmsKind,id:string){await requireAdminPermission('cms.view');const r=await db.execute(sql`select to_jsonb(t) as row from ${sql.raw(table[kind])} t where t.id=${id}::uuid`);if(!r.rows[0])throw new NotFoundError();return r.rows[0].row as Record<string,unknown>}
export async function cmsCategories(kind:CmsKind){if(kind==='scholarships')return [];await requireAdminPermission('cms.view');return (await db.execute(sql`select id,name as label from cms_categories where kind=${kind} order by name`)).rows as {id:string;label:string}[]}

export const bulkBody=z.object({kind:z.enum(cmsKinds),ids:z.array(z.uuid()).min(1).max(50),action:z.enum(['publish','archive']),reason:reasonSchema}).strict()
/**
 * Safe bulk action (never a delete). Each id is validated individually in one atomic statement; ids that were not
 * changed (missing, already in that state, or invalid for publishing) are reported back so partial failure is explicit.
 */
export async function bulkCms(input:unknown){const actor=await requireAdminPermission('cms.manage');const b=parseParams(bulkBody,input);const t=sql.raw(table[b.kind]);const target=b.action==='publish'?'published':'archived'
 const guard=b.action==='publish'?(b.kind==='announcements'?sql`and (t.expires_at is null or t.expires_at>now())`:b.kind==='events'?sql`and t.ends_at>=t.starts_at`:sql``):sql``
 const r=await db.execute(sql`with changed as (update ${t} t set status=${target}::publication_status,${b.action==='publish'?sql`published_at=coalesce(t.published_at,now()),`:sql``}updated_at=now() where t.id in (${sql.join(b.ids.map(i=>sql`${i}::uuid`),sql`,`)}) and t.status::text<>${target} ${guard} returning t.id), logged as (insert into audit_logs(actor_user_id,action,entity_type,entity_id,metadata) select ${actor.id}::uuid,${'admin.cms.bulk_'+b.action},${b.kind},id::text,jsonb_build_object('reason',${b.reason}::text,'bulk',true) from changed) select id from changed`)
 const changed=new Set(r.rows.map(x=>String(x.id)));return {changed:[...changed],unchanged:b.ids.filter(i=>!changed.has(i))}}
