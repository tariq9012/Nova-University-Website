import Link from 'next/link'
import {notFound} from 'next/navigation'
import {adminPage,adminPermissions} from '@/lib/server/admin-auth'
import {gradeDetail} from '@/db/queries/admin-people'
import {Facts} from '@/components/academic-ui'
import {AdminTable} from '@/components/admin-ui'
import {JsonForm} from '@/components/admin-forms'
import {dateLabel} from '@/components/cms-ui'
export default async function Page({params}:{params:Promise<{id:string}>}){
  const me=await adminPage('grades.view');const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))notFound();let d;try{d=await gradeDetail(id)}catch{notFound()}const g=d.grade as Record<string,unknown>
  const canCorrect=(await adminPermissions(me)).has('grades.manage')&&Boolean(g.publishedAt);const codeOf=(sid:unknown)=>String(d.scales.find(s=>s.id===sid)?.code??'—')
  return <><p><Link prefetch={false} href="/admin/grades">← Grades</Link></p><h1>{String(g.course)}</h1>
   <Facts items={[['Student',`${String(g.student)} (${String(g.studentNumber??'no number')})`],['Semester',String(g.semester)],['Current grade',String(g.grade)],['Published',g.publishedAt?dateLabel(String(g.publishedAt),true):'Not published']]}/>
   {canCorrect?<><h2>Correct published grade</h2><p>The previous value, new value, reason, your identity and the time are recorded permanently, and the student is notified.</p>
    <JsonForm endpoint={`/api/v1/admin/grades/${id}`} method="POST" extra={{version:Number(g.version)}} submitLabel="Apply correction" danger confirm="Correct this published grade? This is permanently recorded and visible to the student." successMessage="Grade corrected." fields={[{name:'scaleId',label:'New grade',type:'select',required:true,options:d.scales.filter(s=>s.id!==g.scaleId).map(s=>({value:String(s.id),label:`${String(s.code)}${s.points?` (${String(s.points)})`:''}`}))},{name:'reason',label:'Reason for correction',type:'textarea',required:true,max:500}]}/></>:<p className="status-note">{g.publishedAt?'You do not have permission to correct grades.':'Draft grades belong to the instructor and cannot be corrected here.'}</p>}
   <h2>Change history</h2><AdminTable caption="Grade history" empty="No changes recorded." rows={d.history.map(h=>({...h,previousScale:codeOf(h.previousScale),nextScale:codeOf(h.nextScale),createdAt:dateLabel(String(h.createdAt),true)}))} columns={[{key:'createdAt',label:'When'},{key:'actor',label:'By'},{key:'previousScale',label:'Previous'},{key:'nextScale',label:'New'},{key:'reason',label:'Reason'}]}/></>}
