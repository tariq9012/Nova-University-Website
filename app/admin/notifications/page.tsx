import {randomUUID} from 'node:crypto'
import {adminPage,adminPermissions} from '@/lib/server/admin-auth'
import {recentAdminNotifications} from '@/db/queries/admin-notifications'
import {AdminHeading,AdminTable,ServiceUnavailable} from '@/components/admin-ui'
import {JsonForm} from '@/components/admin-forms'
import {dateLabel} from '@/components/cms-ui'
export default async function Page(){
  const u=await adminPage('cms.view');const can=(await adminPermissions(u)).has('cms.manage');const recent=await recentAdminNotifications()
  return <><AdminHeading title="Notifications" description="In-app notifications to active accounts. Each send has a unique batch key, so submitting twice never delivers duplicates."/>
   <ServiceUnavailable name="Email delivery" setup="Notifications are in-app only. Email delivery requires the transactional email integration documented in PHASE-7-REPORT.md."/>
   {can?<JsonForm endpoint="/api/v1/admin/notifications" method="POST" submitLabel="Send notification" confirm="Send this notification to the selected audience?" successMessage="Notification sent." extra={{batchId:randomUUID()}} fields={[{name:'audience',label:'Audience',type:'select',required:true,options:[{value:'user',label:'One user (by email)'},{value:'students',label:'All students'},{value:'faculty',label:'All faculty'},{value:'applicants',label:'All applicants'},{value:'everyone',label:'Everyone (global)'}]},{name:'email',label:'Recipient email (single user only)',type:'email'},{name:'title',label:'Title',type:'text',required:true,max:160},{name:'message',label:'Message',type:'textarea',required:true,max:2000},{name:'link',label:'Site-relative link (optional, e.g. /portal/student)',type:'text',max:300}]}/>:<p className="status-note">You have view-only access.</p>}
   <h2>Recent admin notifications</h2><AdminTable caption="Recent admin notifications" empty="None sent yet." rows={recent.map(r=>({...r,createdAt:dateLabel(String(r.createdAt),true)}))} columns={[{key:'title',label:'Title'},{key:'recipients',label:'Recipients'},{key:'createdAt',label:'Sent'}]}/></>}
