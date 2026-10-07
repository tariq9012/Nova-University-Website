import {sql,type SQL} from 'drizzle-orm'
import {db} from '@/db'
import {AppError,NotFoundError,parseParams} from '@/lib/server/api'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {resources,buildWriteSchema,archiveBody,type Resource,type ResourceKey,type ListQuery,type OptionSource,type Field} from '@/lib/admin/resources'

const like=(s:string)=>'%'+s.replace(/[\\%_]/g,'\\$&')+'%'
const person=(alias:string)=>sql`nullif(trim(concat_ws(' ',${sql.raw(alias)}.title,${sql.raw(alias)}.first_name,${sql.raw(alias)}.last_name)),'')`
type Def={from:SQL;select:SQL;search:SQL[];filters:(q:ListQuery)=>SQL[];order:Record<string,SQL>}
const activeFilter=(q:ListQuery,col:string)=>q.status?[q.status==='active'?sql`${sql.raw(col)}`:sql`not ${sql.raw(col)}`]:[]
const defs:Record<ResourceKey,Def>={
 schools:{from:sql`schools t`,select:sql`t.id,t.name,t.slug,(select ${person('f')} from faculty_profiles f where f.id=t.dean_id) as dean,(select count(*)::int from departments d where d.school_id=t.id and d.is_active) as departments,case when t.is_active then 'active' else 'archived' end as status`,search:[sql`t.name`,sql`t.slug`],filters:q=>activeFilter(q,'t.is_active'),order:{name:sql`t.name,t.id`,'-name':sql`t.name desc,t.id`,updated:sql`t.updated_at desc,t.id`}},
 departments:{from:sql`departments t join schools s on s.id=t.school_id`,select:sql`t.id,t.name,s.name as school,(select ${person('f')} from faculty_profiles f where f.id=t.head_id) as head,(select count(*)::int from programs p where p.department_id=t.id and p.is_active) as programs,case when t.is_active then 'active' else 'archived' end as status`,search:[sql`t.name`,sql`t.slug`,sql`s.name`],filters:q=>[...(q.school?[sql`t.school_id=${q.school}::uuid`]:[]),...activeFilter(q,'t.is_active')],order:{name:sql`t.name,t.id`,'-name':sql`t.name desc,t.id`,updated:sql`t.updated_at desc,t.id`}},
 programs:{from:sql`programs t join schools s on s.id=t.school_id join departments d on d.id=t.department_id`,select:sql`t.id,t.name,t.degree_level::text as degree,s.name as school,d.name as department,(select count(*)::int from student_profiles sp where sp.program_id=t.id) as students,case when t.is_active then 'published' else 'archived' end as status`,search:[sql`t.name`,sql`t.slug`,sql`t.degree_title`],filters:q=>[...(q.degree?[sql`t.degree_level::text=${q.degree}`]:[]),...(q.school?[sql`t.school_id=${q.school}::uuid`]:[]),...(q.department?[sql`t.department_id=${q.department}::uuid`]:[]),...activeFilter(q,'t.is_active')],order:{name:sql`t.name,t.id`,'-name':sql`t.name desc,t.id`,updated:sql`t.updated_at desc,t.id`}},
 courses:{from:sql`courses t join departments d on d.id=t.department_id`,select:sql`t.id,t.code,t.title,d.name as department,t.credit_hours as credits,t.course_level as level,case when t.is_active then 'active' else 'archived' end as status`,search:[sql`t.code`,sql`t.title`,sql`t.slug`],filters:q=>[...(q.department?[sql`t.department_id=${q.department}::uuid`]:[]),...(q.level?[sql`t.course_level=${Number(q.level)}::integer`]:[]),...activeFilter(q,'t.is_active')],order:{code:sql`t.code,t.id`,'-code':sql`t.code desc,t.id`,title:sql`t.title,t.id`,'-title':sql`t.title desc,t.id`}},
 semesters:{from:sql`semesters t`,select:sql`t.id,t.code,t.academic_year as year,t.term,concat(t.starts_on::text,' to ',t.ends_on::text) as dates,(select count(*)::int from course_sections cs where cs.semester_id=t.id) as sections,t.status`,search:[sql`t.code`,sql`t.term`,sql`t.academic_year`],filters:q=>q.status?[sql`t.status=${q.status}`]:[],order:{start:sql`t.starts_on,t.id`,'-start':sql`t.starts_on desc,t.id`,code:sql`t.code,t.id`}},
 sections:{from:sql`course_sections t join courses c on c.id=t.course_id join semesters sm on sm.id=t.semester_id left join faculty_profiles f on f.id=t.instructor_id`,select:sql`t.id,concat(c.code,' ',c.title) as course,t.code as section,sm.code as semester,${person('f')} as instructor,concat((select count(*)::int from enrollments e where e.section_id=t.id and e.status<>'withdrawn'),' / ',t.capacity) as enrolled,case when t.is_open then 'open' else 'closed' end as status`,search:[sql`c.code`,sql`c.title`,sql`t.code`],filters:q=>[...(q.semester?[sql`t.semester_id=${q.semester}::uuid`]:[]),...(q.course?[sql`t.course_id=${q.course}::uuid`]:[]),...(q.faculty?[sql`t.instructor_id=${q.faculty}::uuid`]:[]),...(q.status?[q.status==='open'?sql`t.is_open`:sql`not t.is_open`]:[])],order:{course:sql`c.code,t.code,t.id`,'-course':sql`c.code desc,t.code,t.id`,semester:sql`sm.starts_on desc,c.code,t.id`}},
 intakes:{from:sql`admission_intakes t`,select:sql`t.id,t.name,t.academic_year as year,(select count(*)::int from applications a where a.intake_id=t.id) as applications,case when t.is_active then 'active' else 'archived' end as status`,search:[sql`t.name`,sql`t.slug`],filters:q=>activeFilter(q,'t.is_active'),order:{name:sql`t.academic_year desc,t.name,t.id`}},
 deadlines:{from:sql`admission_deadlines t join admission_intakes i on i.id=t.intake_id left join programs p on p.id=t.program_id`,select:sql`t.id,t.slug,i.name as intake,coalesce(p.name,t.degree_level::text,'University-wide') as scope,t.deadline::text as deadline,case when t.is_active then 'active' else 'archived' end as status`,search:[sql`t.slug`,sql`i.name`,sql`p.name`],filters:q=>activeFilter(q,'t.is_active'),order:{deadline:sql`t.deadline desc,t.id`}},
 requirements:{from:sql`admission_requirements t left join programs p on p.id=t.program_id`,select:sql`t.id,t.title,coalesce(p.name,t.degree_level::text,'University-wide') as scope,t.applicant_type::text as "applicantType",case when t.is_active then 'active' else 'archived' end as status`,search:[sql`t.title`,sql`t.slug`],filters:q=>activeFilter(q,'t.is_active'),order:{title:sql`t.title,t.id`}},
 fees:{from:sql`fee_structures t left join programs p on p.id=t.program_id`,select:sql`t.id,t.slug,t.academic_year as year,coalesce(p.name,t.degree_level::text,'University-wide') as scope,coalesce(t.tuition::text||' '||t.currency,'Not published') as tuition,coalesce(t.registration_fee::text||' '||t.currency,'Not published') as registration,case when t.is_active then 'active' else 'archived' end as status`,search:[sql`t.slug`,sql`t.academic_year`,sql`p.name`],filters:q=>activeFilter(q,'t.is_active'),order:{year:sql`t.academic_year desc,t.slug,t.id`}}
}
export function resourceOf(key:string):Resource{const r=(resources as Record<string,Resource|undefined>)[key];if(!r)throw new NotFoundError();return r}

export async function listResource(key:string,q:ListQuery){const r=resourceOf(key);await requireAdminPermission(r.view);const d=defs[r.key]
 const conds=[sql`true`,...d.filters(q)];if(q.search){const p=like(q.search);conds.push(sql`(${sql.join(d.search.map(c=>sql`${c} ilike ${p}`),sql` or `)})`)}
 const where=sql.join(conds,sql` and `);const order=d.order[q.sort]??Object.values(d.order)[0]
 const [rows,total]=await Promise.all([db.execute(sql`select ${d.select} from ${d.from} where ${where} order by ${order} limit ${q.pageSize} offset ${(q.page-1)*q.pageSize}`),db.execute(sql`select count(*)::int as count from ${d.from} where ${where}`)])
 return {data:rows.rows as Record<string,unknown>[],total:Number(total.rows[0].count)}}

export async function readResource(key:string,id:string){const r=resourceOf(key);await requireAdminPermission(r.view)
 const row=await db.execute(sql`select * from ${sql.identifier(r.table)} where id=${id}::uuid`);if(!row.rows[0])throw new NotFoundError()
 const raw=row.rows[0] as Record<string,unknown>;const values:Record<string,unknown>={};for(const f of r.fields)values[f.name]=f.type==='lines'?(Array.isArray(raw[f.column])?(raw[f.column] as unknown[]).join('\n'):''):raw[f.column]??null
 const usage=await usageCounts(r,id);return {id,values,archived:isArchived(r,raw),usage}}
const isArchived=(r:Resource,raw:Record<string,unknown>)=>raw[r.archive.column]===r.archive.off
async function usageCounts(r:Resource,id:string):Promise<[string,number][]>{
 const q:Record<ResourceKey,[string,SQL][]>={
  schools:[['Departments',sql`select count(*) from departments where school_id=${id}::uuid`],['Programs',sql`select count(*) from programs where school_id=${id}::uuid`]],
  departments:[['Programs',sql`select count(*) from programs where department_id=${id}::uuid`],['Courses',sql`select count(*) from courses where department_id=${id}::uuid`],['Faculty',sql`select count(*) from faculty_profiles where department_id=${id}::uuid`]],
  programs:[['Curriculum courses',sql`select count(*) from program_curriculum where program_id=${id}::uuid`],['Student profiles',sql`select count(*) from student_profiles where program_id=${id}::uuid`],['Applications',sql`select count(*) from applications where program_id=${id}::uuid`]],
  courses:[['Sections',sql`select count(*) from course_sections where course_id=${id}::uuid`],['Curriculum placements',sql`select count(*) from program_curriculum where course_id=${id}::uuid`]],
  semesters:[['Sections',sql`select count(*) from course_sections where semester_id=${id}::uuid`],['Enrollments',sql`select count(*) from enrollments where semester_id=${id}::uuid`]],
  sections:[['Enrollments',sql`select count(*) from enrollments where section_id=${id}::uuid`],['Assignments',sql`select count(*) from assignments where section_id=${id}::uuid`],['Exams',sql`select count(*) from exams where section_id=${id}::uuid`]],
  intakes:[['Applications',sql`select count(*) from applications where intake_id=${id}::uuid`],['Deadlines',sql`select count(*) from admission_deadlines where intake_id=${id}::uuid`]],deadlines:[],requirements:[],fees:[]}
 const rows=await Promise.all(q[r.key].map(async([label,s])=>[label,Number((await db.execute(s)).rows[0].count)] as [string,number]));return rows}

const optionSql:Record<OptionSource,SQL>={
 schools:sql`select id,name as label from schools order by is_active desc,name limit 500`,
 departments:sql`select d.id,concat(d.name,' — ',s.name) as label from departments d join schools s on s.id=d.school_id order by d.is_active desc,s.name,d.name limit 1000`,
 faculty:sql`select id,concat_ws(' ',title,first_name,last_name) as label from faculty_profiles order by is_active desc,last_name,first_name limit 2000`,
 courses:sql`select id,concat(code,' ',title) as label from courses order by is_active desc,code limit 2000`,
 semesters:sql`select id,concat(code,' (',status,')') as label from semesters order by starts_on desc limit 200`,
 programs:sql`select id,name as label from programs order by is_active desc,name limit 500`,
 intakes:sql`select id,concat(name,' (',academic_year,')') as label from admission_intakes order by is_active desc,academic_year desc,name limit 200`}
export async function resourceOptions(sources:OptionSource[]){const out:Partial<Record<OptionSource,{id:string;label:string}[]>>={};await Promise.all([...new Set(sources)].map(async s=>{out[s]=(await db.execute(optionSql[s])).rows as {id:string;label:string}[]}));return out}

function valueSql(f:Field,v:unknown):SQL{if(Array.isArray(v))return sql`${JSON.stringify(v)}::jsonb`;if(v===null||v===undefined)return sql`null`
 if(f.type==='checkbox')return sql`${Boolean(v)}::boolean`;if(f.type==='number')return sql`${Number(v)}::integer`;if(f.type==='fk')return sql`${String(v)}::uuid`
 if(f.cast)return sql`${String(v)}::${sql.raw(f.cast)}`;return sql`${String(v)}::text`}
const facultyOk=(v:unknown)=>v?sql`exists(select 1 from faculty_profiles fp where fp.id=${String(v)}::uuid and fp.is_active)`:sql`true`
function writeRule(r:Resource,v:Record<string,unknown>,id?:string):SQL{switch(r.key){
 case 'schools':return facultyOk(v.deanId)
 case 'departments':return facultyOk(v.headId)
 case 'semesters':return v.status==='active'?sql`not exists(select 1 from semesters o where o.status='active' and o.id is distinct from ${id??null}::uuid)`:id?sql`not (${String(v.status)}<>'active' and exists(select 1 from semesters c where c.id=${id}::uuid and c.status='active' and exists(select 1 from course_sections cs join attendance a on a.section_id=cs.id where cs.semester_id=c.id)))`:sql`true`
 case 'sections':return sql`${facultyOk(v.instructorId)} and exists(select 1 from semesters sm where sm.id=${String(v.semesterId)}::uuid and sm.status in ('upcoming','active')) ${id?sql`and ${Number(v.capacity)}>=(select count(*) from enrollments e where e.section_id=${id}::uuid and e.status<>'withdrawn') and exists(select 1 from course_sections cur where cur.id=${id}::uuid and cur.course_id=${String(v.courseId)}::uuid and cur.semester_id=${String(v.semesterId)}::uuid or not exists(select 1 from enrollments e where e.section_id=${id}::uuid))`:sql``}`
 default:return sql`true`}}
const ruleMessage:Record<ResourceKey,string>={schools:'The selected dean must be an active faculty member.',departments:'The selected head must be an active faculty member.',programs:'Invalid related record.',courses:'Invalid related record.',semesters:'Only one semester can be active at a time, and an active semester with attendance cannot be moved back.',intakes:'Invalid related record.',deadlines:'Invalid related record.',requirements:'Invalid related record.',fees:'Invalid related record.',sections:'The instructor must be active, the semester must be upcoming or active, capacity cannot be below current enrolment, and course/semester cannot change once students are enrolled.'}
function mapDbError(e:unknown):never{if(e instanceof AppError)throw e;const c=e instanceof Error&&'cause' in e?e.cause:e;const code=c&&typeof c==='object'&&'code' in c?String((c as {code:unknown}).code):'';if(code==='23505')throw new AppError('CONFLICT','A record with the same unique value (slug, code or section) already exists.',409);if(code==='23503')throw new AppError('VALIDATION_ERROR','A related record does not exist or the combination is not allowed (for example the department is not in the selected school).',400);if(code==='23514')throw new AppError('VALIDATION_ERROR','A value violates a database rule (check dates, credits and capacity).',400);throw e}

export async function saveResource(key:string,input:unknown,id?:string){const r=resourceOf(key);const actor=await requireAdminPermission(r.manage)
 const v=parseParams(buildWriteSchema(r),input) as Record<string,unknown>;const rule=writeRule(r,v,id);const t=sql.identifier(r.table)
 try{
  if(!id){const cols=sql.join(r.fields.map(f=>sql.identifier(f.column)),sql`,`);const vals=sql.join(r.fields.map(f=>valueSql(f,v[f.name])),sql`,`)
   const res=await db.execute(sql`with created as (insert into ${t}(${cols}) select ${vals} where ${rule} returning id), logged as (insert into audit_logs(actor_user_id,action,entity_type,entity_id,metadata) select ${actor.id}::uuid,${'admin.'+r.entity+'.created'},${r.entity},id::text,jsonb_build_object('fields',${JSON.stringify(Object.keys(v))}::jsonb) from created) select id from created`)
   if(!res.rows[0])throw new AppError('CONFLICT',ruleMessage[r.key],409);return res.rows[0]}
  const sets=sql.join([...r.fields.map(f=>sql`${sql.identifier(f.column)}=${valueSql(f,v[f.name])}`),...(r.updatedAt?[sql`updated_at=now()`]:[])],sql`,`)
  const res=await db.execute(sql`with old as materialized (select * from ${t} where id=${id}::uuid for update), changed as (update ${t} set ${sets} where id=${id}::uuid and exists(select 1 from old) and ${rule} returning *), logged as (insert into audit_logs(actor_user_id,action,entity_type,entity_id,metadata) select ${actor.id}::uuid,${'admin.'+r.entity+'.updated'},${r.entity},changed.id::text,jsonb_build_object('before',(select to_jsonb(old) from old),'after',to_jsonb(changed)) from changed) select id from changed`)
  if(!res.rows[0]){const exists=await db.execute(sql`select 1 from ${t} where id=${id}::uuid`);if(!exists.rows[0])throw new NotFoundError();throw new AppError('CONFLICT',ruleMessage[r.key],409)}
  return res.rows[0]
 }catch(e){return mapDbError(e)}}

const archiveGuard=(r:Resource,id:string,restore:boolean):SQL=>{if(restore)return sql`true`;switch(r.key){
 case 'schools':return sql`not exists(select 1 from departments d where d.school_id=${id}::uuid and d.is_active)`
 case 'departments':return sql`not exists(select 1 from programs p where p.department_id=${id}::uuid and p.is_active) and not exists(select 1 from courses c where c.department_id=${id}::uuid and c.is_active) and not exists(select 1 from faculty_profiles f where f.department_id=${id}::uuid and f.is_active)`
 case 'courses':return sql`not exists(select 1 from course_sections cs join semesters sm on sm.id=cs.semester_id where cs.course_id=${id}::uuid and sm.status in ('upcoming','active') and cs.is_open)`
 case 'semesters':return sql`(select status from semesters where id=${id}::uuid) in ('upcoming','completed')`
 default:return sql`true`}}
const guardMessage:Record<ResourceKey,string>={schools:'Archive or move the active departments of this school first.',departments:'Archive or move the active programs, courses and faculty of this department first.',programs:'',courses:'Close the open sections of this course in upcoming or active semesters first.',semesters:'Only upcoming or completed semesters can be archived; an active semester must be completed first.',sections:'',intakes:'',deadlines:'',requirements:'',fees:''}
/** Archive/restore never deletes rows. A reason is mandatory and stored in the audit log. */
export async function archiveResource(key:string,id:string,input:unknown){const r=resourceOf(key);const actor=await requireAdminPermission(r.manage);const b=parseParams(archiveBody,input);const t=sql.identifier(r.table);const col=sql.identifier(r.archive.column)
 const target=b.restore?r.archive.on:r.archive.off;const val=typeof target==='boolean'?sql`${target}::boolean`:sql`${String(target)}::text`
 const res=await db.execute(sql`with changed as (update ${t} set ${col}=${val}${r.updatedAt?sql`,updated_at=now()`:sql``} where id=${id}::uuid and ${col} is distinct from ${val} and ${archiveGuard(r,id,b.restore)} returning id), logged as (insert into audit_logs(actor_user_id,action,entity_type,entity_id,metadata) select ${actor.id}::uuid,${'admin.'+r.entity+(b.restore?'.restored':'.archived')},${r.entity},id::text,jsonb_build_object('reason',${b.reason}::text) from changed) select id from changed`)
 if(!res.rows[0]){const e=await db.execute(sql`select 1 from ${t} where id=${id}::uuid`);if(!e.rows[0])throw new NotFoundError();throw new AppError('CONFLICT',guardMessage[r.key]||'Nothing to change.',409)}
 return res.rows[0]}
