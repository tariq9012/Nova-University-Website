import {notFound} from 'next/navigation'
import Link from 'next/link'
import {adminPage,adminPermissions} from '@/lib/server/admin-auth'
import {getAdminUser} from '@/db/queries/admin-users'
import {roleOverview} from '@/db/queries/admin-roles'
import {Facts} from '@/components/academic-ui'
import {AdminTable} from '@/components/admin-ui'
import {JsonForm} from '@/components/admin-forms'
import {dateLabel} from '@/components/cms-ui'
export default async function Page({params}:{params:Promise<{id:string}>}){
  const me=await adminPage('users.view');const {id}=await params;if(!/^[0-9a-f-]{36}$/i.test(id))notFound()
  let d;try{d=await getAdminUser(id)}catch{notFound()}
  const canManage=(await adminPermissions(me)).has('users.manage');const u=d.user as Record<string,unknown>;const self=u.id===me.id;const status=String(u.status)
  const api='/api/v1/admin/users/'+id;const ro=await roleOverview(id)
  return <><p><Link prefetch={false} href="/admin/users">← Users</Link></p><h1>{String(u.name||u.email)}</h1>
   <Facts items={[['Email',String(u.email)],['Roles',(u.roles as string[]).join(', ')||'None'],['Status',status],['Email verified',u.verifiedAt?dateLabel(String(u.verifiedAt)):'Not verified'],['Created',dateLabel(String(u.createdAt))],['Last login',u.lastLoginAt?dateLabel(String(u.lastLoginAt),true):'Never'],['Active sessions',String(u.activeSessions)]]}/>
   <h2>Roles and effective permissions</h2><p>Roles: {ro.current.join(', ')||'None'}</p><p>Effective permissions: {ro.effective.join(', ')||'None (not an administrator or no grants)'}</p>
   {canManage&&!self&&<><JsonForm endpoint={api+'/roles'} method="POST" extra={{action:'add'}} submitLabel="Add role" confirm="Add this role? The user will be signed out so the change applies immediately." successMessage="Role added." fields={[{name:'role',label:'Role to add',type:'select',required:true,options:ro.allRoles.filter(r=>!ro.current.includes(r.name)).map(r=>({value:r.name,label:r.name}))},{name:'reason',label:'Reason',type:'textarea',required:true,max:500},{name:'confirmEmail',label:'Confirm by typing the user email (required for admin roles)',type:'email'}]}/>
    <JsonForm endpoint={api+'/roles'} method="POST" extra={{action:'remove'}} submitLabel="Remove role" danger confirm="Remove this role? The user will be signed out." successMessage="Role removed." fields={[{name:'role',label:'Role to remove',type:'select',required:true,options:ro.current.map(r=>({value:r,label:r}))},{name:'reason',label:'Reason',type:'textarea',required:true,max:500},{name:'confirmEmail',label:'Confirm by typing the user email (required for admin roles)',type:'email'}]}/></>}
   {d.student&&<><h2>Student profile</h2><Facts items={[['Student number',String((d.student as Record<string,unknown>).studentNumber??'Not assigned')],['Program',String((d.student as Record<string,unknown>).program??'Not assigned')],['Academic status',String((d.student as Record<string,unknown>).academicStatus)]]}/><p><Link prefetch={false} href={'/admin/students/'+String((d.student as Record<string,unknown>).id)}>Student record →</Link></p></>}
   {d.faculty&&<><h2>Faculty profile</h2><Facts items={[['Name',String((d.faculty as Record<string,unknown>).name)],['Department',String((d.faculty as Record<string,unknown>).department)]]}/><p><Link prefetch={false} href={'/admin/faculty/'+String((d.faculty as Record<string,unknown>).id)}>Faculty record →</Link></p></>}
   {canManage&&(self?<p className="status-note">You cannot change your own status or revoke your own sessions. Ask another administrator.</p>:<>
    <h2>Account status</h2><p>Deactivating or suspending signs the user out everywhere. The last active administrator can never be disabled.</p>
    <JsonForm endpoint={api} method="PATCH" submitLabel="Update status" successMessage="Status updated." confirm="Change this account's status? Active sessions will be revoked." fields={[{name:'status',label:'Status',type:'select',required:true,options:['active','inactive','suspended'].map(v=>({value:v,label:v==='active'?(status==='active'?'active':'active (restore)'):v}))},{name:'reason',label:'Reason',type:'textarea',required:true,max:500}]} values={{status}}/>
    <h2>Revoke sessions</h2><JsonForm endpoint={api+'/sessions'} method="POST" submitLabel="Revoke all sessions" danger confirm="Sign this user out everywhere?" successMessage="Sessions revoked." fields={[{name:'reason',label:'Reason',type:'textarea',required:true,max:500}]}/></>)}
   <h2>Recent audit activity</h2><AdminTable caption="Audit activity for this user" empty="No audit activity yet." rows={d.activity.map(a=>({...a,createdAt:dateLabel(String(a.createdAt),true)}))} columns={[{key:'action',label:'Action'},{key:'entityType',label:'Entity'},{key:'actor',label:'Actor'},{key:'createdAt',label:'When'}]}/></>}
