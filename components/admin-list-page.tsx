import Link from 'next/link'
import {notFound} from 'next/navigation'
import {adminPage,adminPermissions} from '@/lib/server/admin-auth'
import {EnrollmentsToolbar} from './admin-operations'
import {ServiceUnavailable} from './admin-ui'
import {runList,listParams,lists,isListKey} from '@/db/queries/admin-lists'
import {resourceOptions} from '@/db/queries/admin-resources'
import {AdminHeading,AdminFilters,AdminTable,AdminPager,type FilterSpec} from './admin-ui'
const one=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v
export async function AdminListPage({list,searchParams}:{list:string;searchParams:Promise<Record<string,string|string[]|undefined>>}){
  if(!isListKey(list))notFound();const def=lists[list];const me=await adminPage(def.perm);const perms=await adminPermissions(me)
  const parsed=listParams.safeParse(Object.fromEntries(Object.entries(await searchParams).map(([k,v])=>[k,one(v)])))
  if(!parsed.success)return <><h1>{def.title}</h1><p role="alert">Invalid filters.</p><Link href={'/admin/'+def.key}>Reset</Link></>
  const q=parsed.data;const [res,opts]=await Promise.all([runList(list,q),resourceOptions(def.filters.flatMap(f=>f.source?[f.source]:[]))])
  const filters:FilterSpec[]=[{name:'search',label:'Search',search:true},...def.filters.map(f=>f.date?{name:f.name,label:f.label,date:true}:{name:f.name,label:f.label,options:f.source?(opts[f.source]??[]).map(o=>({value:o.id,label:o.label})):f.options?.map(o=>({value:o,label:o}))})]
  const values:Record<string,string|number>={search:q.search,status:q.status,program:q.program,department:q.department,school:q.school,semester:q.semester,course:q.course,faculty:q.faculty,intake:q.intake,from:q.from,to:q.to,sort:q.sort}
  return <><AdminHeading title={def.title} description={def.description} action={def.create&&perms.has(def.create.perm)?{href:def.create.href,label:def.create.label}:undefined}/>{(def.key==='payments'||def.key==='invoices')&&<ServiceUnavailable name="Payment gateway" setup="No payment processing is connected. Recorded payments are shown read-only; nothing here is processed or simulated."/>}{def.key==='enrollments'&&<EnrollmentsToolbar/>}<AdminFilters filters={filters} values={values} path={'/admin/'+def.key}/>
   <AdminTable caption={def.title} columns={def.columns} rows={res.data} href={def.detail?row=>def.detail+String(row.id):undefined}/>
   <AdminPager path={'/admin/'+def.key} params={{...values,pageSize:q.pageSize}} page={q.page} pageSize={q.pageSize} total={res.total}/></>}
