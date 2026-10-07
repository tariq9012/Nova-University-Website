import Link from 'next/link'
import {adminPage} from '@/lib/server/admin-auth'
import {loadDashboard} from '@/db/queries/admin-dashboard'
import {AdminHeading,BarList,Stat,AdminTable} from '@/components/admin-ui'
import {dateLabel} from '@/components/cms-ui'
const money=(minor:number,c:string)=>{try{return new Intl.NumberFormat('en',{style:'currency',currency:c}).format(minor/100)}catch{return `${(minor/100).toFixed(2)} ${c}`}}
export default async function Page(){
  const u=await adminPage();const d=await loadDashboard(u);const m=d.metrics as Record<string,unknown>;const p=d.perms
  return <><AdminHeading title="Administration overview" description={`Signed in as ${u.email}. Figures are calculated live from the university database.`}/>
   <dl className="stats-grid" style={{display:'grid',gap:'1rem'}}>
    {p.has('students.view')&&<><Stat label="Students" value={String(m.students)} href="/admin/students"/><Stat label="Active students" value={String(m.activeStudents)}/></>}
    {p.has('faculty.view')&&<><Stat label="Faculty" value={String(m.faculty)} href="/admin/faculty"/><Stat label="Active faculty" value={String(m.activeFaculty)}/></>}
    {p.has('academics.view')&&<><Stat label="Schools" value={String(m.schools)} href="/admin/schools"/><Stat label="Departments" value={String(m.departments)} href="/admin/departments"/><Stat label="Programs" value={String(m.programs)} href="/admin/programs"/><Stat label="Courses" value={String(m.courses)} href="/admin/courses"/><Stat label="Current semester" value={String(m.currentSemester??'None active')} href="/admin/semesters"/><Stat label="Open sections (current)" value={String(m.activeSections)} href="/admin/sections"/></>}
    {p.has('applications.view')&&<><Stat label="Submitted applications" value={String(m.submittedApplications)} href="/admin/applications"/><Stat label="Pending review pipeline" value={String(m.pendingApplications)}/></>}
    {p.has('cms.view')&&<><Stat label="Upcoming events" value={String(m.upcomingEvents)} href="/admin/events"/><Stat label="Published news" value={String(m.publishedNews)} href="/admin/news"/><Stat label="Active scholarships" value={String(m.activeScholarships)} href="/admin/scholarships"/></>}
   </dl>
   {d.finance&&<section aria-labelledby="fin-h"><h2 id="fin-h">Outstanding invoices</h2>{d.finance.length?<ul>{d.finance.map(f=><li key={f.currency}>{f.count} invoice{f.count===1?'':'s'} · {money(f.minor,f.currency)}</li>)}</ul>:<p>No outstanding invoices.</p>}</section>}
   <h2>Analytics</h2><div className="academic-filters" style={{alignItems:'start'}}>
    {p.has('students.view')&&<BarList title="Students by program" rows={d.charts.byProgram}/>}
    {p.has('students.view')&&<BarList title="Students by department" rows={d.charts.studentsByDept}/>}
    {p.has('faculty.view')&&<BarList title="Active faculty by department" rows={d.charts.facultyByDept}/>}
    {p.has('applications.view')&&<BarList title="Applications by status" rows={d.charts.appsByStatus}/>}
    {p.has('applications.view')&&<BarList title="Applications submitted per month (last 12)" rows={d.charts.appsOverTime} empty="No submitted applications in this period."/>}
    {p.has('academics.view')&&<BarList title="Attendance records by status" rows={d.charts.attendance} empty="No attendance recorded yet."/>}
    {p.has('cms.view')&&<BarList title="Scholarships by state" rows={d.charts.scholarships}/>}
    {p.has('academics.view')&&<BarList title="Enrollments by semester" rows={d.charts.enrollBySemester}/>}
    {p.has('grades.view')&&<BarList title="Published grade distribution" rows={d.charts.grades}/>}</div>
   {d.activity&&<><h2>Recent system activity</h2><AdminTable caption="Recent audit activity" empty="No activity recorded yet." rows={d.activity.map(a=>({...a,createdAt:dateLabel(String(a.createdAt),true)}))} columns={[{key:'action',label:'Action'},{key:'entityType',label:'Entity'},{key:'actor',label:'Actor'},{key:'createdAt',label:'When'}]}/><p><Link prefetch={false} href="/admin/audit-logs">All audit logs →</Link></p></>}</>}
