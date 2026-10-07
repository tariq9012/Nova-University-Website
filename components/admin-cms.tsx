import Link from 'next/link'
import {notFound} from 'next/navigation'
import {adminPage,adminPermissions} from '@/lib/server/admin-auth'
import {listCms,readCms,cmsCategories,cmsListQuery} from '@/db/queries/admin-cms'
import {type CmsKind} from '@/lib/admin/cms'
import {AdminHeading,AdminFilters,AdminTable,AdminPager} from './admin-ui'
import {CmsForm} from './admin-cms-form'
import {JsonForm} from './admin-forms'
const titles:Record<CmsKind,string>={news:'News',events:'Events',announcements:'Announcements',scholarships:'Scholarships'}
const one=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]:v
export async function CmsListPage({kind,searchParams}:{kind:CmsKind;searchParams:Promise<Record<string,string|string[]|undefined>>}){
  const u=await adminPage('cms.view');const canManage=(await adminPermissions(u)).has('cms.manage')
  const parsed=cmsListQuery.safeParse(Object.fromEntries(Object.entries(await searchParams).map(([k,v])=>[k,one(v)])));if(!parsed.success)return <><h1>{titles[kind]}</h1><p role="alert">Invalid filters.</p></>
  const q=parsed.data;const [res,cats]=await Promise.all([listCms(kind,q),cmsCategories(kind)])
  const last=kind==='announcements'?'Audience':kind==='scholarships'?'Active':'Featured'
  return <><AdminHeading title={titles[kind]} description="Only published items appear on the public website. Drafts and archived items are never public." action={canManage?{href:`/admin/${kind}/new`,label:'New '+titles[kind].toLowerCase().replace(/s$/,'')}:undefined}/>
   <AdminFilters path={'/admin/'+kind} values={{search:q.search,status:q.status,category:q.category,featured:q.featured}} filters={[{name:'search',label:'Search title or slug',search:true},{name:'status',label:'Status',options:['draft','published','archived'].map(v=>({value:v,label:v}))},...(cats.length?[{name:'category',label:'Category',options:cats.map(c=>({value:c.id,label:c.label}))}]:[]),...(kind==='news'||kind==='events'?[{name:'featured',label:'Featured',options:[{value:'yes',label:'Featured only'}]}]:[])]}/>
   <AdminTable caption={titles[kind]} rows={res.data.map(r=>({...r,featured:typeof r.featured==='boolean'?(r.featured?'Yes':'No'):r.featured}))} href={r=>`/admin/${kind}/${String(r.id)}`} columns={[{key:'title',label:'Title'},{key:'status',label:'Status'},{key:'publishedOn',label:kind==='events'?'Starts':kind==='announcements'?'Expires':kind==='scholarships'?'Deadline':'Published'},{key:'featured',label:last},{key:'updated',label:'Updated'}]}/>
   <AdminPager path={'/admin/'+kind} params={{search:q.search,status:q.status,category:q.category,featured:q.featured,pageSize:q.pageSize}} page={q.page} pageSize={q.pageSize} total={res.total}/>
   {canManage&&res.data.length>0&&<><h2>Bulk action (current page)</h2><p>Each item is checked individually; items that cannot be changed are reported. Bulk deletion does not exist.</p>
    <JsonForm endpoint="/api/v1/admin/cms" method="POST" extra={{kind,ids:res.data.map(r=>String(r.id))}} submitLabel="Apply to all items on this page" confirm="Apply this action to every item on this page?" successMessage="Bulk action processed." fields={[{name:'action',label:'Action',type:'select',required:true,options:[{value:'publish',label:'Publish'},{value:'archive',label:'Archive'}]},{name:'reason',label:'Reason',type:'textarea',required:true,max:500}]}/></>}</>}
export async function CmsEditPage({kind,id}:{kind:CmsKind;id?:string}){
  const u=await adminPage(id?'cms.view':'cms.manage');const canManage=(await adminPermissions(u)).has('cms.manage')
  let record;if(id){if(!/^[0-9a-f-]{36}$/i.test(id))notFound();try{record=await readCms(kind,id)}catch{notFound()}}
  const cats=await cmsCategories(kind)
  return <><p><Link prefetch={false} href={'/admin/'+kind}>← {titles[kind]}</Link></p><h1>{id?'Edit':'New'} {titles[kind].toLowerCase().replace(/s$/,'')}</h1>
   {canManage?<CmsForm kind={kind} id={id} record={record} categories={cats}/>:<p className="status-note">You have view-only access to content.</p>}
   {id&&canManage&&<><h2>Archive</h2><p>Archiving hides the item publicly. It is recorded in the audit log and can be republished later.</p><JsonForm endpoint="/api/v1/admin/cms" method="POST" extra={{kind,ids:[id],action:'archive'}} submitLabel="Archive" danger confirm="Archive this item? It will no longer be public." successMessage="Archived." fields={[{name:'reason',label:'Reason',type:'textarea',required:true,max:500}]}/></>}</>}
