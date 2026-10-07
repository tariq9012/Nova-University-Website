import {notFound} from 'next/navigation'
import Link from 'next/link'
import {adminPage,adminPermissions} from '@/lib/server/admin-auth'
import {resources,listQuery,isResourceKey,type Resource,type OptionSource} from '@/lib/admin/resources'
import {listResource,readResource,resourceOptions} from '@/db/queries/admin-resources'
import {AdminHeading,AdminFilters,AdminTable,AdminPager,type FilterSpec} from './admin-ui'
import {JsonForm,type FormField} from './admin-forms'
import {Facts} from './academic-ui'
import {AdminCurriculum} from './admin-curriculum'
import {InstructorForm} from './admin-operations'
type SP=Record<string,string|string[]|undefined>
const one=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v
function resourceOr404(key:string):Resource{if(!isResourceKey(key))notFound();return resources[key]}
function optionSources(r:Resource){return [...r.fields.flatMap(f=>f.source?[f.source]:[]),...r.filters.flatMap(f=>f.source?[f.source]:[])] as OptionSource[]}
function formFields(r:Resource,opts:Awaited<ReturnType<typeof resourceOptions>>):FormField[]{return r.fields.map(f=>({name:f.name,label:f.label,type:f.type==='fk'?'select':f.type==='lines'?'textarea':f.type==='money'?'text':f.type,required:f.required,max:f.max,min:f.min,help:f.help,options:f.type==='fk'&&f.source?(opts[f.source]??[]).map(o=>({value:o.id,label:o.label})):f.options?.map(o=>({value:o,label:o}))}))}

export async function ResourceListPage({resource,searchParams}:{resource:string;searchParams:Promise<SP>}){
  const r=resourceOr404(resource);const u=await adminPage(r.view);const canManage=(await adminPermissions(u)).has(r.manage)
  const parsed=listQuery.safeParse(Object.fromEntries(Object.entries(await searchParams).map(([k,v])=>[k,one(v)])))
  if(!parsed.success)return <><h1>{r.title}</h1><p role="alert">Invalid filters.</p><Link href={'/admin/'+r.key}>Reset</Link></>
  const q=parsed.data;const [res,opts]=await Promise.all([listResource(r.key,q),resourceOptions(optionSources(r))])
  const filters:FilterSpec[]=[{name:'search',label:'Search',search:true},...r.filters.map(f=>({name:f.name,label:f.label,options:f.source?(opts[f.source]??[]).map(o=>({value:o.id,label:o.label})):f.options?.map(o=>({value:o,label:o}))}))]
  const values:Record<string,string|number>={search:q.search,status:q.status,school:q.school,department:q.department,degree:q.degree,level:q.level,semester:q.semester,course:q.course,faculty:q.faculty,sort:q.sort}
  return <><AdminHeading title={r.title} description={r.description} action={canManage?{href:`/admin/${r.key}/new`,label:`New ${r.singular.toLowerCase()}`}:undefined}/>
   <AdminFilters filters={filters} values={values} path={'/admin/'+r.key}/>
   <AdminTable caption={r.title} columns={r.columns} rows={res.data} href={row=>`/admin/${r.key}/${String(row.id)}`}/>
   <AdminPager path={'/admin/'+r.key} params={{...values,pageSize:q.pageSize}} page={q.page} pageSize={q.pageSize} total={res.total}/></>}

export async function ResourceCreatePage({resource}:{resource:string}){
  const r=resourceOr404(resource);await adminPage(r.manage);const opts=await resourceOptions(optionSources(r))
  const defaults=Object.fromEntries(r.fields.filter(f=>f.defaultValue!==undefined).map(f=>[f.name,f.defaultValue]))
  return <><p><Link prefetch={false} href={'/admin/'+r.key}>← {r.title}</Link></p><h1>New {r.singular.toLowerCase()}</h1><JsonForm endpoint={`/api/v1/admin/resources/${r.key}`} method="POST" fields={formFields(r,opts)} values={defaults} submitLabel={`Create ${r.singular.toLowerCase()}`} successMessage="Created." redirectTo={'/admin/'+r.key}/></>}

export async function ResourceEditPage({resource,id}:{resource:string;id:string}){
  const r=resourceOr404(resource);const u=await adminPage(r.view);const canManage=(await adminPermissions(u)).has(r.manage)
  if(!/^[0-9a-f-]{36}$/i.test(id))notFound()
  let rec;try{rec=await readResource(r.key,id)}catch{notFound()}
  const opts=await resourceOptions(optionSources(r));const api=`/api/v1/admin/resources/${r.key}/${id}`
  return <><p><Link prefetch={false} href={'/admin/'+r.key}>← {r.title}</Link></p><h1>{r.singular} details</h1>
   <Facts items={[['Status',rec.archived?'Archived / inactive':'Active'],...rec.usage.map(([l,n])=>[l,String(n)] as [string,string])]}/>
   {canManage?<><h2>Edit</h2><JsonForm endpoint={api} method="PUT" fields={formFields(r,opts)} values={rec.values} submitLabel="Save changes"/>
    {r.key==='programs'&&<AdminCurriculum programId={id}/>}
    {r.key==='sections'&&<InstructorForm sectionId={id}/>}
    <h2>{rec.archived?'Restore':r.archive.label}</h2><p>Records are never deleted. A reason is required and is written to the audit log.</p>
    <JsonForm endpoint={api} method="POST" fields={[{name:'reason',label:'Reason',type:'textarea',required:true,max:500}]} extra={{restore:rec.archived}} submitLabel={rec.archived?'Restore':r.archive.label} danger={!rec.archived} confirm={rec.archived?undefined:`This will ${r.archive.label.toLowerCase()} the ${r.singular.toLowerCase()} and hide it from active use. Continue?`} successMessage="Done."/></>
   :<p className="status-note">You have view-only access to this area.</p>}</>}
