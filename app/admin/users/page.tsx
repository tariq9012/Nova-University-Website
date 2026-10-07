import {adminPage} from '@/lib/server/admin-auth'
import {listAdminUsers,adminUserQuery} from '@/db/queries/admin-users'
import {AdminHeading,AdminFilters,AdminTable,AdminPager} from '@/components/admin-ui'
const one=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  await adminPage('users.view');const parsed=adminUserQuery.safeParse(Object.fromEntries(Object.entries(await searchParams).map(([k,v])=>[k,one(v)])))
  if(!parsed.success)return <><h1>Users</h1><p role="alert">Invalid filters.</p></>
  const p=parsed.data;const r=await listAdminUsers(p);const roles=['student','faculty','admin','applicant','staff','content_editor','admissions_officer','finance_officer','super_admin']
  return <><AdminHeading title="User management" description="Account status changes revoke active sessions. Public registration can never create administrators; roles are assigned through controlled administration."/>
   <AdminFilters path="/admin/users" values={{search:p.search,role:p.role,status:p.status,verified:p.verified,sort:p.sort}} filters={[{name:'search',label:'Search name or email',search:true},{name:'role',label:'Role',options:roles.map(v=>({value:v,label:v}))},{name:'status',label:'Status',options:['active','inactive','suspended'].map(v=>({value:v,label:v}))},{name:'verified',label:'Email verified',options:[{value:'yes',label:'Verified'},{value:'no',label:'Not verified'}]},{name:'sort',label:'Sort',options:[{value:'-created',label:'Newest'},{value:'created',label:'Oldest'},{value:'name',label:'Name'},{value:'email',label:'Email'},{value:'login',label:'Last login'}]}]}/>
   <AdminTable caption="Users" rows={r.data} href={row=>'/admin/users/'+String(row.id)} columns={[{key:'name',label:'Name'},{key:'email',label:'Email'},{key:'roles',label:'Roles'},{key:'status',label:'Status'},{key:'verified',label:'Verified'},{key:'created',label:'Created'},{key:'lastLogin',label:'Last login'}]}/>
   <AdminPager path="/admin/users" params={{search:p.search,role:p.role,status:p.status,verified:p.verified,sort:p.sort,pageSize:p.pageSize}} page={p.page} pageSize={p.pageSize} total={r.total}/></>}
