import Link from 'next/link'
import {notFound} from 'next/navigation'
import {adminPage,adminPermissions} from '@/lib/server/admin-auth'
import {applicationDetail} from '@/db/queries/admin-people'
import {applicationTransitions} from '@/lib/cms-management'
import {Facts} from '@/components/academic-ui'
import {AdminTable} from '@/components/admin-ui'
import {JsonForm} from '@/components/admin-forms'
import {dateLabel} from '@/components/cms-ui'
export default async function Page({params}:{params:Promise<{id:string}>}){
  const me=await adminPage('applications.view');const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))notFound();let d;try{d=await applicationDetail(id)}catch{notFound()}
  const a=d.application as Record<string,unknown>;const canManage=(await adminPermissions(me)).has('applications.manage')
  const next=(applicationTransitions[a.status as keyof typeof applicationTransitions]??[]).filter(s=>s!=='submitted')
  return <><p><Link prefetch={false} href="/admin/applications">← Applications</Link></p><h1>{String(a.applicant)}</h1>
   <Facts items={[['Email',String(a.email)],['Program',String(a.program)],['Intake',String(a.intake)],['Degree level',String(a.degreeLevel)],['Applicant type',String(a.applicantType)],['Status',String(a.status)],['Submitted',a.submittedAt?dateLabel(String(a.submittedAt),true):'Not submitted'],['Phone',String(a.contactPhone??'—')]]}/>
   <h2>Application data</h2><h3>Prior education</h3><p className="preserve-lines">{String(a.priorEducation??'Not provided')}</p><h3>Personal statement</h3><p className="preserve-lines">{String(a.personalStatement??'Not provided')}</p>
   <h2>Documents</h2><p className="cms-meta">File contents are protected; only metadata is shown. Private file storage is not configured in this environment.</p><AdminTable caption="Application documents" empty="No documents uploaded." rows={d.documents} columns={[{key:'name',label:'File'},{key:'requirement',label:'Requirement'},{key:'mimeType',label:'Type'},{key:'size',label:'Bytes'}]}/>
   {canManage&&(next.length?<><h2>Change status</h2><p>Only valid workflow transitions are offered. A reason is required to reject or withdraw. The applicant is notified.</p><JsonForm endpoint={`/api/v1/applications/${id}/status`} method="POST" submitLabel="Update status" confirm="Change the application status? The applicant will be notified." successMessage="Status updated." fields={[{name:'status',label:'New status',type:'select',required:true,options:next.map(v=>({value:v,label:v}))},{name:'note',label:'Reason / note',type:'textarea',max:2000}]}/></>:<p className="status-note">This application is in a final state.</p>)}
   <h2>Status history</h2><AdminTable caption="Status history" empty="No history." rows={d.history.map(h=>({...h,createdAt:dateLabel(String(h.createdAt),true)}))} columns={[{key:'createdAt',label:'When'},{key:'from',label:'From'},{key:'to',label:'To'},{key:'actor',label:'By'},{key:'note',label:'Note'}]}/>
   <h2>Audit history</h2><AdminTable caption="Application audit" empty="No audit records." rows={d.audit.map(h=>({...h,createdAt:dateLabel(String(h.createdAt),true)}))} columns={[{key:'action',label:'Action'},{key:'actor',label:'Actor'},{key:'createdAt',label:'When'}]}/></>}
