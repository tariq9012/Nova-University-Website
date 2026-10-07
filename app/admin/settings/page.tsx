import {adminPage,adminPermissions} from '@/lib/server/admin-auth'
import {PortalSettings} from '@/components/portal-pages'
import {listAdminOverrides} from '@/db/queries/admin-permissions'
import {PERMISSIONS} from '@/lib/permissions'
import {JsonForm} from '@/components/admin-forms'
import {AdminTable,ServiceUnavailable} from '@/components/admin-ui'
import {Facts} from '@/components/academic-ui'
export default async function Page(){
  const u=await adminPage();const perms=await adminPermissions(u);const canManage=perms.has('settings.manage');const o=canManage?await listAdminOverrides():null
  return <><PortalSettings role="admin"/>
   <h2>Your administrator permissions</h2><p>{PERMISSIONS.filter(p=>perms.has(p)).join(', ')||'None'}</p>
   <h2>Integrations</h2>
   <Facts items={[['Email delivery',process.env.AUTH_EMAIL_WEBHOOK_URL?'Configured':'Not configured'],['Payment gateway','Not configured (no payment processing exists)'],['Private file storage','Not configured (uploads are unavailable)']]}/>
   <ServiceUnavailable name="Payment processing and private file storage" setup="See PHASE-7-REPORT.md, “Unconfigured integrations”, for the exact setup required. Payment records shown in the portal are read-only bookkeeping entries."/>
   {o&&<><h2>Administrator permission overrides</h2><p>Role grants come from the roles table. Overrides allow or deny a single permission for one administrator; a deny always wins. Every change requires a reason and is audited.</p>
    <JsonForm endpoint="/api/v1/admin/permissions" method="POST" submitLabel="Apply override" successMessage="Override applied." confirm="Change this administrator's permissions?" fields={[{name:'userId',label:'Administrator',type:'select',required:true,options:o.admins.filter(a=>a.id!==u.id).map(a=>({value:a.id,label:a.email}))},{name:'permissionKey',label:'Permission',type:'select',required:true,options:PERMISSIONS.map(v=>({value:v,label:v}))},{name:'effect',label:'Effect',type:'select',required:true,options:['allow','deny','clear'].map(v=>({value:v,label:v}))},{name:'reason',label:'Reason',type:'textarea',required:true,max:500}]}/>
    <AdminTable caption="Permission overrides" empty="No overrides set." rows={o.overrides.map(r=>({...r,id:`${String(r.userId)}:${String(r.permissionKey)}`}))} columns={[{key:'email',label:'Administrator'},{key:'permissionKey',label:'Permission'},{key:'effect',label:'Effect'},{key:'reason',label:'Reason'}]}/></>}</>}
