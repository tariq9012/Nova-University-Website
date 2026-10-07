import {adminPage} from '@/lib/server/admin-auth'
import {listAudit,auditQuery} from '@/db/queries/admin-audit'
import {AdminHeading,AdminFilters,AdminTable,AdminPager} from '@/components/admin-ui'
const one=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v
const redact=(m:string)=>m.length>300?m.slice(0,300)+'…':m
export default async function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){
  await adminPage('audit.view');const parsed=auditQuery.safeParse(Object.fromEntries(Object.entries(await searchParams).map(([k,v])=>[k,one(v)])));if(!parsed.success)return <><h1>Audit logs</h1><p role="alert">Invalid filters.</p></>
  const q=parsed.data;const r=await listAudit(q);const values={actor:q.actor,action:q.action,entity:q.entity,from:q.from,to:q.to}
  return <><AdminHeading title="Audit logs" description="Append-only record of administrative and security-relevant actions. Entries cannot be edited or deleted from the application."/>
   <AdminFilters path="/admin/audit-logs" values={values} filters={[{name:'actor',label:'Actor (name or email)',search:true},{name:'action',label:'Action contains',search:true},{name:'entity',label:'Entity',options:r.entities.map(v=>({value:v,label:v}))},{name:'from',label:'From',date:true},{name:'to',label:'To',date:true}]}/>
   <AdminTable caption="Audit log entries" empty="No audit entries match." rows={r.data.map(x=>({...x,metadata:redact(String(x.metadata))}))} columns={[{key:'createdAt',label:'Time (UTC)'},{key:'actor',label:'Actor'},{key:'action',label:'Action'},{key:'entity',label:'Entity'},{key:'entityId',label:'Entity ID'},{key:'metadata',label:'Details'}]}/>
   <AdminPager path="/admin/audit-logs" params={{...values,pageSize:q.pageSize}} page={q.page} pageSize={q.pageSize} total={r.total}/></>}
