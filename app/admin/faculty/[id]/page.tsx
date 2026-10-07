import Link from 'next/link'
import {notFound} from 'next/navigation'
import {adminPage} from '@/lib/server/admin-auth'
import {facultyDetail} from '@/db/queries/admin-people'
import {Facts} from '@/components/academic-ui'
import {AdminTable} from '@/components/admin-ui'
import {dateLabel} from '@/components/cms-ui'
import {FacultyProfileForm} from '@/components/admin-operations'
export default async function Page({params}:{params:Promise<{id:string}>}){
  await adminPage('faculty.view');const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))notFound();let d;try{d=await facultyDetail(id)}catch{notFound()}const f=d.faculty as Record<string,unknown>;const a=(d.assignments??{}) as Record<string,unknown>;const g=(d.gradeActivity??{}) as Record<string,unknown>
  return <><p><Link prefetch={false} href="/admin/faculty">← Faculty</Link></p><h1>{String(f.name)}</h1>
   <Facts items={[['Email',String(f.email??'Not linked')],['Department',String(f.department)],['School',String(f.school)],['Title',String(f.position??'—')],['Office',String(f.office??'—')],['Status',f.isActive?'Active':'Inactive'],['Distinct students taught',String(d.students)],['Assignments (published)',`${String(a.count??0)} (${String(a.published??0)})`],['Exams',String(d.exams)],['Grade records / last activity',`${String(g.count??0)} / ${g.last?dateLabel(String(g.last),true):'None'}`]]}/>
   <h2>Assigned sections</h2><AdminTable caption="Assigned sections" empty="No sections assigned." rows={d.sections} href={r=>'/admin/sections/'+String(r.id)} columns={[{key:'course',label:'Course'},{key:'section',label:'Section'},{key:'semester',label:'Semester'},{key:'enrolled',label:'Enrolled'}]}/>
   <FacultyProfileForm id={id}/><h2>Audit history</h2><AdminTable caption="Faculty audit history" empty="No audit records." rows={d.audit.map(r=>({...r,createdAt:dateLabel(String(r.createdAt),true)}))} columns={[{key:'action',label:'Action'},{key:'actor',label:'Actor'},{key:'createdAt',label:'When'}]}/></>}
