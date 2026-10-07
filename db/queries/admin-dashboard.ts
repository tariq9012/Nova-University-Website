import {sql} from 'drizzle-orm'
import {db} from '@/db'
import {adminPermissions} from '@/lib/server/admin-auth'

const n=(v:unknown)=>Number(v??0)
/** Every figure is an aggregate over live tables; nothing is hardcoded. Sections the admin may not see are omitted entirely. */
export async function loadDashboard(user:Parameters<typeof adminPermissions>[0]){
  const perms=await adminPermissions(user)
  const [core,byProgram,facultyByDept,appsByStatus,enrollBySemester,grades,studentsByDept,appsOverTime,attendance,scholarships]=await Promise.all([
   db.execute(sql`select
    (select count(*)::int from student_profiles) as "students",
    (select count(*)::int from student_profiles sp join users u on u.id=sp.user_id where u.status='active' and sp.academic_status='active') as "activeStudents",
    (select count(*)::int from faculty_profiles) as "faculty",(select count(*)::int from faculty_profiles where is_active) as "activeFaculty",
    (select count(*)::int from programs where is_active) as "programs",(select count(*)::int from courses where is_active) as "courses",
    (select count(*)::int from departments where is_active) as "departments",(select count(*)::int from schools where is_active) as "schools",
    (select code from semesters where status='active' order by starts_on desc limit 1) as "currentSemester",
    (select count(*)::int from course_sections cs join semesters sm on sm.id=cs.semester_id where sm.status='active' and cs.is_open) as "activeSections",
    (select count(*)::int from applications where status='submitted') as "submittedApplications",
    (select count(*)::int from applications where status in ('submitted','under_review','additional_information_required')) as "pendingApplications",
    (select count(*)::int from events where status='published' and ends_at>=now()) as "upcomingEvents",
    (select count(*)::int from news where status='published' and (published_at is null or published_at<=now())) as "publishedNews",
    (select count(*)::int from scholarships where status='published' and is_active) as "activeScholarships"`),
   perms.has('students.view')?db.execute(sql`select p.name as label,count(*)::int as value from student_profiles sp join programs p on p.id=sp.program_id group by p.name order by value desc,p.name limit 8`):Promise.resolve({rows:[]}),
   perms.has('faculty.view')?db.execute(sql`select d.name as label,count(*)::int as value from faculty_profiles f join departments d on d.id=f.department_id where f.is_active group by d.name order by value desc,d.name limit 8`):Promise.resolve({rows:[]}),
   perms.has('applications.view')?db.execute(sql`select status::text as label,count(*)::int as value from applications group by status order by value desc`):Promise.resolve({rows:[]}),
   perms.has('academics.view')?db.execute(sql`select sm.code as label,count(e.id)::int as value from semesters sm left join enrollments e on e.semester_id=sm.id and e.status<>'withdrawn' group by sm.id,sm.code,sm.starts_on order by sm.starts_on desc limit 6`):Promise.resolve({rows:[]}),
   perms.has('grades.view')?db.execute(sql`select gs.code as label,count(*)::int as value from grades g join grade_scale gs on gs.id=g.scale_id where g.published_at is not null group by gs.code order by value desc,gs.code`):Promise.resolve({rows:[]}),
   perms.has('students.view')?db.execute(sql`select d.name as label,count(*)::int as value from student_profiles sp join programs p on p.id=sp.program_id join departments d on d.id=p.department_id group by d.name order by value desc,d.name limit 8`):Promise.resolve({rows:[]}),
   perms.has('applications.view')?db.execute(sql`select to_char(date_trunc('month',submitted_at),'YYYY-MM') as label,count(*)::int as value from applications where submitted_at is not null and submitted_at>=date_trunc('month',now())-interval '11 months' group by 1 order by 1`):Promise.resolve({rows:[]}),
   perms.has('academics.view')?db.execute(sql`select status as label,count(*)::int as value from attendance group by status order by value desc`):Promise.resolve({rows:[]}),
   perms.has('cms.view')?db.execute(sql`select case when status='published' and is_active and (deadline is null or deadline>=current_date) then 'Open' when status='published' and is_active then 'Closed (deadline passed)' when status='published' then 'Inactive' else status::text end as label,count(*)::int as value from scholarships group by 1 order by value desc`):Promise.resolve({rows:[]})])
  const finance=perms.has('finance.view')?(await db.execute(sql`with inv as (select i.id,i.currency,coalesce((select sum(amount_minor) from student_invoice_items x where x.invoice_id=i.id),0) as total,coalesce((select sum(amount_minor) from student_payments p where p.invoice_id=i.id and p.status='settled'),0) as paid from student_invoices i where i.voided_at is null and not i.is_draft) select currency,count(*) filter (where total>paid)::int as "count",coalesce(sum(total-paid) filter (where total>paid),0)::bigint as "minor" from inv group by currency order by currency`)).rows:null
  const activity=perms.has('audit.view')?(await db.execute(sql`select a.id,a.action,a.entity_type as "entityType",a.created_at as "createdAt",concat_ws(' ',u.first_name,u.last_name) as actor from audit_logs a left join users u on u.id=a.actor_user_id order by a.created_at desc,a.id limit 8`)).rows:null
  const c=core.rows[0] as Record<string,unknown>
  return {metrics:c,charts:{byProgram:byProgram.rows as {label:string;value:number}[],facultyByDept:facultyByDept.rows as {label:string;value:number}[],appsByStatus:appsByStatus.rows as {label:string;value:number}[],enrollBySemester:enrollBySemester.rows as {label:string;value:number}[],grades:grades.rows as {label:string;value:number}[],studentsByDept:studentsByDept.rows as {label:string;value:number}[],appsOverTime:appsOverTime.rows as {label:string;value:number}[],attendance:attendance.rows as {label:string;value:number}[],scholarships:scholarships.rows as {label:string;value:number}[]},finance:finance?.map(r=>({currency:String(r.currency),count:n(r.count),minor:n(r.minor)}))??null,activity:activity as Record<string,unknown>[]|null,perms}}
