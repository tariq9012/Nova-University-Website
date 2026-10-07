import {sql,type SQL} from 'drizzle-orm'
import {db} from '@/db'
import {z} from 'zod'
import {NotFoundError} from '@/lib/server/api'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import type {Permission} from '@/lib/permissions'

/** Read-only oversight lists over existing tables. Server-side search, filters, sorting and pagination only. */
export type ListKey='sessions'|'students'|'faculty'|'enrollments'|'attendance'|'assignments'|'submissions'|'exams'|'grades'|'applications'|'invoices'|'payments'
export type Source='programs'|'departments'|'schools'|'semesters'|'courses'|'faculty'|'intakes'
export type ListFilter={name:'program'|'department'|'school'|'semester'|'course'|'faculty'|'intake'|'status'|'from'|'to';label:string;source?:Source;options?:string[];date?:boolean}
export type ListDef={key:ListKey;title:string;description:string;perm:Permission;create?:{href:string;label:string;perm:Permission};columns:{key:string;label:string}[];filters:ListFilter[];from:SQL;select:SQL;search:SQL[];order:Record<string,SQL>;where:(q:ListParams)=>SQL[];detail?:string}
const uuidOrEmpty=z.union([z.uuid(),z.literal('')]).default('')
export const listParams=z.object({page:z.coerce.number().int().min(1).max(10000).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20),search:z.string().trim().max(100).default(''),sort:z.string().max(30).default(''),status:z.string().max(40).default(''),program:uuidOrEmpty,department:uuidOrEmpty,school:uuidOrEmpty,semester:uuidOrEmpty,course:uuidOrEmpty,faculty:uuidOrEmpty,intake:uuidOrEmpty,from:z.union([z.iso.date(),z.literal('')]).default(''),to:z.union([z.iso.date(),z.literal('')]).default('')})
export type ListParams=z.infer<typeof listParams>
const person=(a:string)=>sql`nullif(trim(concat_ws(' ',${sql.raw(a)}.title,${sql.raw(a)}.first_name,${sql.raw(a)}.last_name)),'')`
const eq=(cond:string,val:string)=>val?[sql`${sql.raw(cond)}=${val}::uuid`]:[]
const stu=sql`nullif(trim(concat_ws(' ',su.first_name,su.last_name)),'')`
const sectionJoins=sql`join courses c on c.id=cs.course_id join departments cd on cd.id=c.department_id join semesters sm on sm.id=cs.semester_id left join faculty_profiles f on f.id=cs.instructor_id`
const sectionFilters=(q:ListParams)=>[...eq('cs.semester_id',q.semester),...eq('cs.course_id',q.course),...eq('cs.instructor_id',q.faculty),...eq('cd.id',q.department),...eq('cd.school_id',q.school)]
const paid=sql`coalesce((select sum(p.amount_minor) from student_payments p where p.invoice_id=i.id and p.status='settled'),0)`
const total=sql`coalesce((select sum(x.amount_minor) from student_invoice_items x where x.invoice_id=i.id),0)`
const invStatus=sql`case when i.voided_at is not null then 'cancelled' when i.is_draft then 'draft' when ${total}>0 and ${paid}>=${total} then 'paid' when ${paid}>0 and i.due_on<current_date then 'overdue' when ${paid}>0 then 'partially_paid' when i.due_on<current_date then 'overdue' else 'issued' end`
const sf:ListFilter[]=[{name:'semester',label:'Semester',source:'semesters'},{name:'school',label:'School',source:'schools'},{name:'department',label:'Department',source:'departments'},{name:'course',label:'Course',source:'courses'},{name:'faculty',label:'Faculty',source:'faculty'}]

export const lists:Record<ListKey,ListDef>={
 sessions:{key:'sessions',title:'Class schedule',description:'Class sessions (room, day and time) that drive student and faculty timetables. Creating or moving a session checks section, room and instructor conflicts.',perm:'academics.view',detail:'/admin/sessions/',create:{href:'/admin/sessions/new',label:'New session',perm:'academics.manage'},
  columns:[{key:'course',label:'Course'},{key:'section',label:'Section'},{key:'day',label:'Day'},{key:'startsAt',label:'Starts'},{key:'endsAt',label:'Ends'},{key:'room',label:'Room'},{key:'faculty',label:'Faculty'},{key:'state',label:'Status'}],
  filters:[...sf,{name:'status',label:'Status',options:['scheduled','cancelled']},{name:'from',label:'From',date:true},{name:'to',label:'To',date:true}],
  from:sql`class_sessions x join course_sections cs on cs.id=x.section_id ${sectionJoins}`,
  select:sql`x.id,concat(c.code,' ',c.title) as course,cs.code as section,trim(to_char(x.starts_at,'Day')) as day,to_char(x.starts_at,'YYYY-MM-DD HH24:MI') as "startsAt",to_char(x.ends_at,'HH24:MI') as "endsAt",concat_ws(', ',x.room,x.building) as room,${person('f')} as faculty,case when x.cancelled then 'cancelled' else 'scheduled' end as state`,
  search:[sql`c.code`,sql`c.title`,sql`x.room`,sql`x.building`],order:{start:sql`x.starts_at desc,x.id`},
  where:q=>[...sectionFilters(q),...(q.status==='cancelled'?[sql`x.cancelled`]:q.status==='scheduled'?[sql`not x.cancelled`]:[]),...(q.from?[sql`x.starts_at>=${q.from}::date`]:[]),...(q.to?[sql`x.starts_at<${q.to}::date+1`]:[])]},

 students:{key:'students',title:'Students',description:'Student profiles and academic status.',perm:'students.view',detail:'/admin/students/',
  columns:[{key:'studentNumber',label:'Student ID'},{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'program',label:'Program'},{key:'department',label:'Department'},{key:'status',label:'Academic status'},{key:'year',label:'Enrollment year'}],
  filters:[{name:'program',label:'Program',source:'programs'},{name:'department',label:'Department',source:'departments'},{name:'school',label:'School',source:'schools'},{name:'semester',label:'Semester',source:'semesters'},{name:'status',label:'Academic status',options:['active','prospective','development','graduated','withdrawn','suspended']}],
  from:sql`student_profiles sp join users u on u.id=sp.user_id left join programs p on p.id=sp.program_id left join departments d on d.id=p.department_id`,
  select:sql`sp.id,sp.student_number as "studentNumber",nullif(trim(concat_ws(' ',u.first_name,u.last_name)),'') as name,u.email,p.name as program,d.name as department,sp.academic_status as status,sp.enrollment_year as year`,
  search:[sql`u.email`,sql`concat_ws(' ',u.first_name,u.last_name)`,sql`sp.student_number`],order:{name:sql`lower(u.last_name),lower(u.first_name),sp.id`,number:sql`sp.student_number,sp.id`,year:sql`sp.enrollment_year desc nulls last,sp.id`},
  where:q=>[...eq('sp.program_id',q.program),...eq('p.department_id',q.department),...eq('p.school_id',q.school),...(q.semester?[sql`exists(select 1 from enrollments e where e.student_id=sp.id and e.semester_id=${q.semester}::uuid)`]:[]),...(q.status?[sql`sp.academic_status=${q.status}`]:[])]},
 faculty:{key:'faculty',title:'Faculty',description:'Faculty profiles and their departments.',perm:'faculty.view',detail:'/admin/faculty/',
  columns:[{key:'slug',label:'Faculty ID'},{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'department',label:'Department'},{key:'school',label:'School'},{key:'position',label:'Title'},{key:'status',label:'Status'}],
  filters:[{name:'department',label:'Department',source:'departments'},{name:'school',label:'School',source:'schools'},{name:'status',label:'Status',options:['active','inactive']}],
  from:sql`faculty_profiles f join departments d on d.id=f.department_id join schools s on s.id=f.school_id left join users u on u.id=f.user_id`,
  select:sql`f.id,f.slug,${person('f')} as name,coalesce(u.email,f.public_email) as email,d.name as department,s.name as school,coalesce(f.position,f.title) as position,case when f.is_active then 'active' else 'inactive' end as status`,
  search:[sql`concat_ws(' ',f.first_name,f.last_name)`,sql`u.email`,sql`f.public_email`,sql`f.slug`],order:{name:sql`lower(f.last_name),lower(f.first_name),f.id`},
  where:q=>[...eq('f.department_id',q.department),...eq('f.school_id',q.school),...(q.status?[q.status==='active'?sql`f.is_active`:sql`not f.is_active`]:[])]},
 enrollments:{key:'enrollments',title:'Enrollments',description:'Enrollment records. Enrolling and withdrawing are audited; withdrawal requires a reason.',perm:'academics.view',detail:'/admin/enrollments/',
  columns:[{key:'student',label:'Student'},{key:'course',label:'Course'},{key:'section',label:'Section'},{key:'semester',label:'Semester'},{key:'status',label:'Status'},{key:'enrolledOn',label:'Enrolled'}],
  filters:[{name:'program',label:'Program',source:'programs'},{name:'course',label:'Course',source:'courses'},{name:'semester',label:'Semester',source:'semesters'},{name:'status',label:'Status',options:['enrolled','in_progress','completed','withdrawn']}],
  from:sql`enrollments e join student_profiles sp on sp.id=e.student_id join users su on su.id=sp.user_id join course_sections cs on cs.id=e.section_id join courses c on c.id=e.course_id join semesters sm on sm.id=e.semester_id`,
  select:sql`e.id,concat_ws(' · ',${stu},sp.student_number) as student,concat(c.code,' ',c.title) as course,cs.code as section,sm.code as semester,e.status,to_char(e.created_at,'YYYY-MM-DD') as "enrolledOn"`,
  search:[sql`su.email`,sql`concat_ws(' ',su.first_name,su.last_name)`,sql`sp.student_number`,sql`c.code`],order:{recent:sql`e.created_at desc,e.id`},
  where:q=>[...eq('sp.program_id',q.program),...eq('e.course_id',q.course),...eq('e.semester_id',q.semester),...(q.status?[sql`e.status=${q.status}`]:[])]},
 attendance:{key:'attendance',title:'Attendance oversight',description:'Aggregated attendance per section. Open a section to correct an individual record (audited).',perm:'academics.view',detail:'/admin/attendance/',
  columns:[{key:'course',label:'Course'},{key:'section',label:'Section'},{key:'semester',label:'Semester'},{key:'faculty',label:'Faculty'},{key:'sessions',label:'Sessions'},{key:'records',label:'Records'},{key:'rate',label:'Present / excused rate'}],filters:sf,
  from:sql`course_sections cs ${sectionJoins}`,
  select:sql`cs.id,concat(c.code,' ',c.title) as course,cs.code as section,sm.code as semester,${person('f')} as faculty,(select count(*)::int from class_sessions x where x.section_id=cs.id and not x.cancelled) as sessions,(select count(*)::int from attendance a where a.section_id=cs.id) as records,coalesce((select round(100.0*count(*) filter (where a.status in ('present','excused'))/nullif(count(*),0))::text||'%' from attendance a where a.section_id=cs.id),'No records') as rate`,
  search:[sql`c.code`,sql`c.title`,sql`cs.code`],order:{course:sql`c.code,cs.code,cs.id`},where:sectionFilters},
 assignments:{key:'assignments',title:'Assignments',description:'Assignments across the university. Admin edits validate the section, protect existing submissions and are audited.',perm:'academics.view',detail:'/admin/assignments/',create:{href:'/admin/assignments/new',label:'New assignment',perm:'academics.manage'},
  columns:[{key:'title',label:'Assignment'},{key:'course',label:'Course'},{key:'section',label:'Section'},{key:'faculty',label:'Faculty'},{key:'due',label:'Due'},{key:'state',label:'State'},{key:'submissions',label:'Submissions'},{key:'graded',label:'Graded'}],
  filters:[...sf,{name:'status',label:'State',options:['published','draft','closed']}],
  from:sql`assignments a join course_sections cs on cs.id=a.section_id ${sectionJoins}`,
  select:sql`a.id,a.title,concat(c.code,' ',c.title) as course,cs.code as section,${person('f')} as faculty,to_char(a.due_at,'YYYY-MM-DD HH24:MI') as due,case when a.closed_at is not null then 'closed' when a.published_at is null then 'draft' else 'published' end as state,(select count(*)::int from assignment_submissions s where s.assignment_id=a.id) as submissions,(select count(*)::int from assignment_submissions s where s.assignment_id=a.id and s.graded_at is not null) as graded`,
  search:[sql`a.title`,sql`c.code`,sql`c.title`],order:{due:sql`a.due_at desc,a.id`},
  where:q=>[...sectionFilters(q),...(q.status==='closed'?[sql`a.closed_at is not null`]:q.status==='draft'?[sql`a.published_at is null and a.closed_at is null`]:q.status==='published'?[sql`a.published_at is not null and a.closed_at is null`]:[])]},
 submissions:{key:'submissions',title:'Submissions',description:'Submission and grading activity. Submitted content is not displayed in this overview.',perm:'academics.view',
  columns:[{key:'assignment',label:'Assignment'},{key:'student',label:'Student'},{key:'course',label:'Course'},{key:'submittedAt',label:'Submitted'},{key:'late',label:'Timing'},{key:'marks',label:'Marks'},{key:'graded',label:'Graded'}],
  filters:[...sf,{name:'status',label:'Grading',options:['graded','ungraded']}],
  from:sql`assignment_submissions sub join assignments a on a.id=sub.assignment_id join course_sections cs on cs.id=sub.section_id ${sectionJoins} join enrollments e on e.id=sub.enrollment_id join student_profiles sp on sp.id=e.student_id join users su on su.id=sp.user_id`,
  select:sql`sub.id,a.title as assignment,concat_ws(' · ',${stu},sp.student_number) as student,concat(c.code,' ',c.title) as course,to_char(sub.submitted_at,'YYYY-MM-DD HH24:MI') as "submittedAt",case when sub.submitted_at>a.due_at then 'late' else 'on time' end as late,case when sub.graded_at is null then null else sub.marks::text||' / '||a.max_marks::text end as marks,case when sub.graded_at is null then 'No' else 'Yes' end as graded`,
  search:[sql`a.title`,sql`su.email`,sql`concat_ws(' ',su.first_name,su.last_name)`,sql`sp.student_number`],order:{recent:sql`sub.submitted_at desc,sub.id`},
  where:q=>[...sectionFilters(q),...(q.status==='graded'?[sql`sub.graded_at is not null`]:q.status==='ungraded'?[sql`sub.graded_at is null`]:[])]},
 exams:{key:'exams',title:'Exams',description:'Exam schedule with room-conflict flags. Edits check section, room and instructor conflicts and are audited.',perm:'academics.view',detail:'/admin/exams/',create:{href:'/admin/exams/new',label:'New exam',perm:'academics.manage'},
  columns:[{key:'title',label:'Exam'},{key:'course',label:'Course'},{key:'section',label:'Section'},{key:'faculty',label:'Faculty'},{key:'startsAt',label:'Starts'},{key:'room',label:'Room'},{key:'marks',label:'Max marks'},{key:'state',label:'Status'},{key:'conflict',label:'Room conflict'}],
  filters:[...sf,{name:'status',label:'Status',options:['scheduled','published','cancelled']}],
  from:sql`exams x join course_sections cs on cs.id=x.section_id ${sectionJoins}`,
  select:sql`x.id,x.title,concat(c.code,' ',c.title) as course,cs.code as section,${person('f')} as faculty,to_char(x.starts_at,'YYYY-MM-DD HH24:MI') as "startsAt",x.room,x.max_marks::text as marks,case when x.cancelled_at is not null then 'cancelled' when x.published_at is null then 'scheduled' else 'published' end as state,case when x.room is not null and exists(select 1 from exams y where y.id<>x.id and y.room=x.room and y.cancelled_at is null and x.cancelled_at is null and y.starts_at<x.starts_at+make_interval(mins=>x.duration_minutes) and x.starts_at<y.starts_at+make_interval(mins=>y.duration_minutes)) then 'Conflict' else 'None' end as conflict`,
  search:[sql`x.title`,sql`c.code`,sql`c.title`,sql`x.room`],order:{start:sql`x.starts_at desc,x.id`},
  where:q=>[...sectionFilters(q),...(q.status==='cancelled'?[sql`x.cancelled_at is not null`]:q.status==='scheduled'?[sql`x.published_at is null and x.cancelled_at is null`]:q.status==='published'?[sql`x.published_at is not null and x.cancelled_at is null`]:[])]},
 grades:{key:'grades',title:'Grades',description:'Final course grades. Published grades are corrected only through an audited correction that records the previous value, new value and reason.',perm:'grades.view',detail:'/admin/grades/',
  columns:[{key:'student',label:'Student'},{key:'course',label:'Course'},{key:'section',label:'Section'},{key:'semester',label:'Semester'},{key:'faculty',label:'Faculty'},{key:'grade',label:'Grade'},{key:'points',label:'Grade point'},{key:'published',label:'Published'}],
  filters:[...sf,{name:'status',label:'Publication',options:['published','unpublished']}],
  from:sql`grades g join enrollments e on e.id=g.enrollment_id join course_sections cs on cs.id=e.section_id ${sectionJoins} join student_profiles sp on sp.id=e.student_id join users su on su.id=sp.user_id join grade_scale gs on gs.id=coalesce(case when g.published_at is null then g.draft_scale_id end,g.scale_id)`,
  select:sql`g.id,concat_ws(' · ',${stu},sp.student_number) as student,concat(c.code,' ',c.title) as course,cs.code as section,sm.code as semester,${person('f')} as faculty,gs.code as grade,gs.points::text as points,case when g.published_at is null then 'No (draft)' else 'Yes' end as published`,
  search:[sql`su.email`,sql`concat_ws(' ',su.first_name,su.last_name)`,sql`sp.student_number`,sql`c.code`],order:{recent:sql`g.updated_at desc,g.id`},
  where:q=>[...sectionFilters(q),...(q.status==='published'?[sql`g.published_at is not null`]:q.status==='unpublished'?[sql`g.published_at is null`]:[])]},
 applications:{key:'applications',title:'Applications',description:'Admission applications across all programs.',perm:'applications.view',detail:'/admin/applications/',
  columns:[{key:'applicant',label:'Applicant'},{key:'program',label:'Program'},{key:'intake',label:'Intake'},{key:'status',label:'Status'},{key:'submitted',label:'Submitted'}],
  filters:[{name:'program',label:'Program',source:'programs'},{name:'intake',label:'Intake',source:'intakes'},{name:'status',label:'Status',options:['draft','submitted','under_review','additional_information_required','accepted','rejected','withdrawn']},{name:'from',label:'Submitted from',date:true},{name:'to',label:'Submitted to',date:true}],
  from:sql`applications a join users u on u.id=a.applicant_id join programs p on p.id=a.program_id join admission_intakes i on i.id=a.intake_id`,
  select:sql`a.id,concat_ws(' · ',nullif(trim(concat_ws(' ',u.first_name,u.last_name)),''),u.email) as applicant,p.name as program,i.name as intake,a.status::text as status,coalesce(to_char(a.submitted_at,'YYYY-MM-DD'),'Not submitted') as submitted`,
  search:[sql`u.email`,sql`concat_ws(' ',u.first_name,u.last_name)`,sql`p.name`],order:{recent:sql`coalesce(a.submitted_at,a.created_at) desc,a.id`},
  where:q=>[...eq('a.program_id',q.program),...eq('a.intake_id',q.intake),...(q.status?[sql`a.status::text=${q.status}`]:[]),...(q.from?[sql`a.submitted_at>=${q.from}::date`]:[]),...(q.to?[sql`a.submitted_at<${q.to}::date+1`]:[])]},
 invoices:{key:'invoices',title:'Invoices',description:'Student invoices. New invoices are drafts until issued. Payment processing is not configured; amounts come from recorded payments only.',perm:'finance.view',detail:'/admin/invoices/',create:{href:'/admin/invoices/new',label:'New invoice',perm:'finance.manage'},
  columns:[{key:'reference',label:'Invoice'},{key:'student',label:'Student'},{key:'amount',label:'Amount'},{key:'paid',label:'Paid'},{key:'due',label:'Due'},{key:'status',label:'Status'}],
  filters:[{name:'semester',label:'Semester',source:'semesters'},{name:'status',label:'Status',options:['draft','issued','partially_paid','paid','overdue','cancelled']}],
  from:sql`student_invoices i join student_profiles sp on sp.id=i.student_id join users su on su.id=sp.user_id`,
  select:sql`i.id,i.reference,concat_ws(' · ',${stu},sp.student_number) as student,(${total}/100.0)::numeric(14,2)::text||' '||i.currency as amount,(${paid}/100.0)::numeric(14,2)::text||' '||i.currency as paid,i.due_on::text as due,${invStatus} as status`,
  search:[sql`i.reference`,sql`su.email`,sql`concat_ws(' ',su.first_name,su.last_name)`,sql`sp.student_number`],order:{due:sql`i.due_on desc,i.id`},
  where:q=>[...eq('i.semester_id',q.semester),...(q.status?[sql`${invStatus}=${q.status}`]:[])]},
 payments:{key:'payments',title:'Payments',description:'Recorded payments. These are bookkeeping records; no payment gateway is connected and this portal cannot process payments.',perm:'finance.view',
  columns:[{key:'reference',label:'Reference'},{key:'student',label:'Student'},{key:'invoice',label:'Invoice'},{key:'amount',label:'Amount'},{key:'paidAt',label:'Date'},{key:'method',label:'Method'},{key:'status',label:'Status'}],
  filters:[{name:'status',label:'Status',options:['pending','settled','failed','refunded']},{name:'from',label:'From',date:true},{name:'to',label:'To',date:true}],
  from:sql`student_payments p join student_invoices i on i.id=p.invoice_id join student_profiles sp on sp.id=i.student_id join users su on su.id=sp.user_id`,
  select:sql`p.id,p.reference,concat_ws(' · ',${stu},sp.student_number) as student,i.reference as invoice,(p.amount_minor/100.0)::numeric(14,2)::text||' '||i.currency as amount,to_char(p.paid_at,'YYYY-MM-DD') as "paidAt",p.method,p.status`,
  search:[sql`p.reference`,sql`i.reference`,sql`su.email`,sql`concat_ws(' ',su.first_name,su.last_name)`],order:{recent:sql`p.paid_at desc,p.id`},
  where:q=>[...(q.status?[sql`p.status=${q.status}`]:[]),...(q.from?[sql`p.paid_at>=${q.from}::date`]:[]),...(q.to?[sql`p.paid_at<${q.to}::date+1`]:[])]}
}
export const isListKey=(k:string):k is ListKey=>k in lists
export async function runList(key:string,q:ListParams){if(!isListKey(key))throw new NotFoundError();const d=lists[key];await requireAdminPermission(d.perm)
 const like='%'+q.search.replace(/[\\%_]/g,'\\$&')+'%';const conds=[sql`true`,...d.where(q),...(q.search?[sql`(${sql.join(d.search.map(c=>sql`${c} ilike ${like}`),sql` or `)})`]:[])];const where=sql.join(conds,sql` and `)
 const order=d.order[q.sort]??Object.values(d.order)[0]
 const [rows,total]=await Promise.all([db.execute(sql`select ${d.select} from ${d.from} where ${where} order by ${order} limit ${q.pageSize} offset ${(q.page-1)*q.pageSize}`),db.execute(sql`select count(*)::int as count from ${d.from} where ${where}`)])
 return {def:d,data:rows.rows as Record<string,unknown>[],total:Number(total.rows[0].count)}}
