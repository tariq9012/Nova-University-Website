import {sql} from 'drizzle-orm'
import {db} from '@/db'
import {AppError,NotFoundError,parseParams} from '@/lib/server/api'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {z} from 'zod'
import {reasonSchema} from '@/lib/admin/resources'

export const curriculumAction=z.discriminatedUnion('action',[
  z.object({action:z.literal('add'),courseId:z.uuid(),semesterNumber:z.coerce.number().int().min(1).max(12),courseType:z.enum(['core','required','elective','major','general_education'])}).strict(),
  z.object({action:z.literal('remove'),rowId:z.uuid(),reason:reasonSchema}).strict(),
  z.object({action:z.literal('add-prerequisite'),courseId:z.uuid(),prerequisiteCourseId:z.uuid()}).strict(),
  z.object({action:z.literal('remove-prerequisite'),courseId:z.uuid(),prerequisiteCourseId:z.uuid(),reason:reasonSchema}).strict()])

export async function readCurriculum(programId:string){await requireAdminPermission('academics.view')
 const [p,rows,prereq]=await Promise.all([
  db.execute(sql`select name,total_credit_hours as "totalCredits" from programs where id=${programId}::uuid`),
  db.execute(sql`select pc.id,pc.semester_number as "semester",pc.course_type as "type",c.id as "courseId",c.code,c.title,c.credit_hours as credits,c.is_active as "active" from program_curriculum pc join courses c on c.id=pc.course_id where pc.program_id=${programId}::uuid order by pc.semester_number,c.code`),
  db.execute(sql`select cp.course_id as "courseId",cp.prerequisite_course_id as "prerequisiteCourseId",pr.code from course_prerequisites cp join courses pr on pr.id=cp.prerequisite_course_id where cp.course_id in (select course_id from program_curriculum where program_id=${programId}::uuid) order by pr.code`)])
 if(!p.rows[0])throw new NotFoundError()
 const total=(rows.rows as {credits:number}[]).reduce((n,r)=>n+Number(r.credits),0)
 return {program:p.rows[0] as {name:string;totalCredits:number},rows:rows.rows as Record<string,unknown>[],prerequisites:prereq.rows as {courseId:string;prerequisiteCourseId:string;code:string}[],plannedCredits:total}}

/** Every change is one atomic statement that also writes the audit row; duplicate/invalid/circular cases return no row → 409. */
export async function changeCurriculum(programId:string,input:unknown){const actor=await requireAdminPermission('academics.manage');const a=parseParams(curriculumAction,input)
 const audit=(action:string,entity:string,id:string)=>sql`insert into audit_logs(actor_user_id,action,entity_type,entity_id,metadata) select ${actor.id}::uuid,${action},${entity},${id},${JSON.stringify({programId})}::jsonb`
 try{
  if(a.action==='add'){const r=await db.execute(sql`with added as (insert into program_curriculum(program_id,course_id,semester_number,course_type) select p.id,c.id,${a.semesterNumber}::integer,${a.courseType}::text from programs p cross join courses c where p.id=${programId}::uuid and c.id=${a.courseId}::uuid and c.is_active and not exists(select 1 from program_curriculum x where x.program_id=p.id and x.course_id=c.id) returning id), logged as (${audit('admin.curriculum.added','program',programId)} from added) select id from added`);if(!r.rows[0])throw new AppError('CONFLICT','The course is inactive, does not exist, or is already in this curriculum.',409);return r.rows[0]}
  if(a.action==='remove'){const r=await db.execute(sql`with removed as (delete from program_curriculum where id=${a.rowId}::uuid and program_id=${programId}::uuid returning id,course_id), logged as (insert into audit_logs(actor_user_id,action,entity_type,entity_id,metadata) select ${actor.id}::uuid,'admin.curriculum.removed','program',${programId},jsonb_build_object('courseId',course_id,'reason',${a.reason}::text) from removed) select id from removed`);if(!r.rows[0])throw new NotFoundError();return r.rows[0]}
  if(a.action==='add-prerequisite'){const r=await db.execute(sql`with recursive chain as (select prerequisite_course_id as id from course_prerequisites where course_id=${a.prerequisiteCourseId}::uuid union select cp.prerequisite_course_id from course_prerequisites cp join chain on cp.course_id=chain.id), added as (insert into course_prerequisites(course_id,prerequisite_course_id) select c.id,p.id from courses c cross join courses p where c.id=${a.courseId}::uuid and p.id=${a.prerequisiteCourseId}::uuid and c.id<>p.id and p.is_active and not exists(select 1 from chain where id=c.id) on conflict do nothing returning course_id), logged as (${audit('admin.prerequisite.added','course',a.courseId)} from added) select course_id from added`);if(!r.rows[0])throw new AppError('CONFLICT','Invalid prerequisite: the course is missing, inactive, already linked, references itself, or would create a circular chain.',409);return r.rows[0]}
  const r=await db.execute(sql`with removed as (delete from course_prerequisites where course_id=${a.courseId}::uuid and prerequisite_course_id=${a.prerequisiteCourseId}::uuid returning course_id), logged as (insert into audit_logs(actor_user_id,action,entity_type,entity_id,metadata) select ${actor.id}::uuid,'admin.prerequisite.removed','course',${a.courseId},jsonb_build_object('prerequisiteCourseId',${a.prerequisiteCourseId}::text,'reason',${a.reason}::text) from removed) select course_id from removed`);if(!r.rows[0])throw new NotFoundError();return r.rows[0]
 }catch(e){if(e instanceof AppError)throw e;const c=e instanceof Error&&'cause' in e?e.cause:e;const code=c&&typeof c==='object'&&'code' in c?String((c as {code:unknown}).code):'';if(code==='23503')throw new AppError('CONFLICT','This course is referenced by other records and cannot be changed.',409);throw e}}
