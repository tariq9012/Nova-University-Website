import {sql} from 'drizzle-orm'
import {db} from '@/db'
import {NotFoundError} from '@/lib/server/api'
import {requireAdminPermission,adminPermissions} from '@/lib/server/admin-auth'
type Row=Record<string,unknown>
const rows=async(q:ReturnType<typeof sql>)=>(await db.execute(q)).rows as Row[]
const auditFor=(entity:string,id:string)=>rows(sql`select a.id,a.action,a.created_at as "createdAt",concat_ws(' ',u.first_name,u.last_name) as actor,a.metadata->>'reason' as reason from audit_logs a left join users u on u.id=a.actor_user_id where a.entity_type=${entity} and a.entity_id=${id} order by a.created_at desc,a.id limit 25`)

export const studentTabs=['overview','enrollments','attendance','assignments','exams','grades','applications','fees','documents','audit'] as const
export type StudentTab=typeof studentTabs[number]
/** Each tab enforces its own permission so an admin without grades.view or finance.view never receives that data. */
export async function studentDetail(id:string,tab:StudentTab){const me=await requireAdminPermission('students.view');const perms=await adminPermissions(me)
 const s=await rows(sql`select sp.id,sp.user_id as "userId",sp.student_number as "studentNumber",sp.academic_status as "academicStatus",sp.enrollment_year as "enrollmentYear",u.email,concat_ws(' ',u.first_name,u.last_name) as name,u.status::text as "accountStatus",p.name as program,d.name as department,sc.name as school,p.total_credit_hours as "programCredits",(select coalesce(sum(credits),0)::int from enrollments e where e.student_id=sp.id and e.status='completed') as "completedCredits" from student_profiles sp join users u on u.id=sp.user_id left join programs p on p.id=sp.program_id left join departments d on d.id=p.department_id left join schools sc on sc.id=p.school_id where sp.id=${id}::uuid`)
 if(!s[0])throw new NotFoundError()
 const allowed=(p:Parameters<typeof perms.has>[0])=>perms.has(p);let data:Row[]=[];let denied=false
 if(tab==='enrollments')data=await rows(sql`select e.id,concat(c.code,' ',c.title) as course,cs.code as section,sm.code as semester,e.credits,e.status from enrollments e join courses c on c.id=e.course_id join course_sections cs on cs.id=e.section_id join semesters sm on sm.id=e.semester_id where e.student_id=${id}::uuid order by sm.starts_on desc,c.code`)
 else if(tab==='attendance')data=await rows(sql`select concat(c.code,' ',c.title) as course,sm.code as semester,count(*)::int as records,count(*) filter (where a.status='present')::int as present,count(*) filter (where a.status='absent')::int as absent,count(*) filter (where a.status='excused')::int as excused from attendance a join enrollments e on e.id=a.enrollment_id join courses c on c.id=e.course_id join semesters sm on sm.id=e.semester_id where e.student_id=${id}::uuid group by c.code,c.title,sm.code,sm.starts_on order by sm.starts_on desc,c.code`)
 else if(tab==='assignments')data=await rows(sql`select sub.id,a.title as assignment,concat(c.code,' ',c.title) as course,to_char(sub.submitted_at,'YYYY-MM-DD HH24:MI') as submitted,case when sub.graded_at is null then 'Not graded' else sub.marks::text||' / '||a.max_marks::text end as result from assignment_submissions sub join assignments a on a.id=sub.assignment_id join enrollments e on e.id=sub.enrollment_id join courses c on c.id=e.course_id where e.student_id=${id}::uuid order by sub.submitted_at desc limit 100`)
 else if(tab==='exams')data=await rows(sql`select er.id,x.title as exam,concat(c.code,' ',c.title) as course,to_char(x.starts_at,'YYYY-MM-DD HH24:MI') as starts,case when er.published_at is null then 'Not published' else er.marks::text||' / '||coalesce(x.max_marks::text,'—') end as result from exams x join enrollments e on e.section_id=x.section_id and e.student_id=${id}::uuid join courses c on c.id=e.course_id left join exam_results er on er.exam_id=x.id and er.enrollment_id=e.id order by x.starts_at desc limit 100`)
 else if(tab==='grades'){if(!allowed('grades.view'))denied=true;else data=await rows(sql`select g.id,concat(c.code,' ',c.title) as course,sm.code as semester,gs.code as grade,gs.points::text as points,case when g.published_at is null then 'Draft' else 'Published' end as status from grades g join enrollments e on e.id=g.enrollment_id join courses c on c.id=e.course_id join semesters sm on sm.id=e.semester_id join grade_scale gs on gs.id=coalesce(case when g.published_at is null then g.draft_scale_id end,g.scale_id) where e.student_id=${id}::uuid order by sm.starts_on desc,c.code`)}
 else if(tab==='applications'){if(!allowed('applications.view'))denied=true;else data=await rows(sql`select a.id,p.name as program,i.name as intake,a.status::text as status from applications a join programs p on p.id=a.program_id join admission_intakes i on i.id=a.intake_id where a.applicant_id=${String(s[0].userId)}::uuid order by a.created_at desc`)}
 else if(tab==='fees'){if(!allowed('finance.view'))denied=true;else data=await rows(sql`select i.id,i.reference,i.due_on::text as due,(coalesce((select sum(amount_minor) from student_invoice_items x where x.invoice_id=i.id),0)/100.0)::numeric(14,2)::text||' '||i.currency as amount,(coalesce((select sum(amount_minor) from student_payments p where p.invoice_id=i.id and p.status='settled'),0)/100.0)::numeric(14,2)::text||' '||i.currency as paid from student_invoices i where i.student_id=${id}::uuid order by i.due_on desc`)}
 else if(tab==='documents')data=await rows(sql`select id,title,category,mime_type as "mimeType",size_bytes as size from student_documents where student_id=${id}::uuid order by created_at desc`)
 else if(tab==='audit')data=await auditFor('student',id)
 return {student:s[0],tab,data,denied}}

export async function facultyDetail(id:string){await requireAdminPermission('faculty.view')
 const f=await rows(sql`select f.id,f.slug,concat_ws(' ',f.title,f.first_name,f.last_name) as name,coalesce(u.email,f.public_email) as email,f.position,f.office,f.is_active as "isActive",d.name as department,s.name as school,u.status::text as "accountStatus" from faculty_profiles f join departments d on d.id=f.department_id join schools s on s.id=f.school_id left join users u on u.id=f.user_id where f.id=${id}::uuid`)
 if(!f[0])throw new NotFoundError()
 const [sections,students,assignments,exams,gradeActivity,audit]=await Promise.all([
  rows(sql`select cs.id,concat(c.code,' ',c.title) as course,cs.code as section,sm.code as semester,(select count(*)::int from enrollments e where e.section_id=cs.id and e.status<>'withdrawn') as enrolled from course_sections cs join courses c on c.id=cs.course_id join semesters sm on sm.id=cs.semester_id where cs.instructor_id=${id}::uuid order by sm.starts_on desc,c.code`),
  rows(sql`select count(distinct e.student_id)::int as count from enrollments e join course_sections cs on cs.id=e.section_id where cs.instructor_id=${id}::uuid and e.status<>'withdrawn'`),
  rows(sql`select count(*)::int as count,count(*) filter (where published_at is not null)::int as published from assignments a join course_sections cs on cs.id=a.section_id where cs.instructor_id=${id}::uuid`),
  rows(sql`select count(*)::int as count from exams x join course_sections cs on cs.id=x.section_id where cs.instructor_id=${id}::uuid`),
  rows(sql`select count(*)::int as count,max(g.updated_at) as last from grades g join enrollments e on e.id=g.enrollment_id join course_sections cs on cs.id=e.section_id where cs.instructor_id=${id}::uuid`),
  auditFor('faculty',id)])
 return {faculty:f[0],sections,students:Number(students[0]?.count??0),assignments:assignments[0],exams:Number(exams[0]?.count??0),gradeActivity:gradeActivity[0],audit}}

export async function applicationDetail(id:string){await requireAdminPermission('applications.view')
 const a=await rows(sql`select a.id,a.status::text as status,a.degree_level::text as "degreeLevel",a.applicant_type::text as "applicantType",a.personal_statement as "personalStatement",a.prior_education as "priorEducation",a.contact_phone as "contactPhone",a.submitted_at as "submittedAt",a.created_at as "createdAt",concat_ws(' ',u.first_name,u.last_name) as applicant,u.email,p.name as program,i.name as intake from applications a join users u on u.id=a.applicant_id join programs p on p.id=a.program_id join admission_intakes i on i.id=a.intake_id where a.id=${id}::uuid`)
 if(!a[0])throw new NotFoundError()
 const [history,documents,audit]=await Promise.all([
  rows(sql`select h.id,h.from_status::text as "from",h.to_status::text as "to",h.note,h.created_at as "createdAt",concat_ws(' ',u.first_name,u.last_name) as actor from application_status_history h left join users u on u.id=h.changed_by where h.application_id=${id}::uuid order by h.created_at desc,h.id`),
  rows(sql`select d.id,d.original_name as name,d.mime_type as "mimeType",d.size_bytes as size,r.title as requirement from application_documents d left join admission_requirements r on r.id=d.requirement_id where d.application_id=${id}::uuid order by d.created_at`),
  auditFor('application',id)])
 return {application:a[0],history,documents,audit}}

export async function gradeDetail(id:string){await requireAdminPermission('grades.view')
 const g=await rows(sql`select g.id,g.version,g.published_at as "publishedAt",g.scale_id as "scaleId",concat_ws(' ',su.first_name,su.last_name) as student,sp.student_number as "studentNumber",concat(c.code,' ',c.title) as course,sm.code as semester,gs.code as grade,gs.policy_id as "policyId" from grades g join enrollments e on e.id=g.enrollment_id join student_profiles sp on sp.id=e.student_id join users su on su.id=sp.user_id join courses c on c.id=e.course_id join semesters sm on sm.id=e.semester_id join grade_scale gs on gs.id=g.scale_id where g.id=${id}::uuid`)
 if(!g[0])throw new NotFoundError()
 const [scales,history]=await Promise.all([
  rows(sql`select id,code,points::text as points from grade_scale where policy_id=${String(g[0].policyId)}::uuid order by points desc nulls last,code`),
  rows(sql`select h.id,h.created_at as "createdAt",h.reason,h.previous->>'scale_id' as "previousScale",h.next->>'scale_id' as "nextScale",concat_ws(' ',u.first_name,u.last_name) as actor from grade_history h left join users u on u.id=h.changed_by where h.grade_id=${id}::uuid order by h.created_at desc,h.id`)])
 return {grade:g[0],scales,history}}
