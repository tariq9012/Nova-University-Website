'use client'
import {useState} from 'react'
import {useRouter} from 'next/navigation'
import {cmsPayload,blocksToText,type CmsKind,type Block} from '@/lib/admin/cms'
type Rec=Record<string,unknown>
const iso=(v:unknown)=>v?new Date(String(v)).toISOString():''
const local=(v:unknown)=>{if(!v)return '';const d=new Date(String(v));const p=(n:number)=>String(n).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`}
const T=({n,l,v,type='text',req,help}:{n:string;l:string;v?:unknown;type?:string;req?:boolean;help?:string})=><div><label htmlFor={'c-'+n}>{l}{req&&<span aria-hidden="true"> *</span>}</label><input id={'c-'+n} name={n} type={type} required={req} defaultValue={v==null?'':String(v)} aria-describedby={help?'c-'+n+'-h':undefined}/>{help&&<p id={'c-'+n+'-h'} className="cms-meta">{help}</p>}</div>
const A=({n,l,v,rows=4,help}:{n:string;l:string;v?:unknown;rows?:number;help?:string})=><div><label htmlFor={'c-'+n}>{l}</label><textarea id={'c-'+n} name={n} rows={rows} defaultValue={v==null?'':String(v)}/>{help&&<p className="cms-meta">{help}</p>}</div>
const S=({n,l,v,o}:{n:string;l:string;v?:unknown;o:{value:string;label:string}[]})=><div><label htmlFor={'c-'+n}>{l}</label><select id={'c-'+n} name={n} defaultValue={v==null?'':String(v)}>{o.map(x=><option key={x.value} value={x.value}>{x.label}</option>)}</select></div>
const C=({n,l,v}:{n:string;l:string;v?:unknown})=><div><label htmlFor={'c-'+n}><input id={'c-'+n} name={n} type="checkbox" defaultChecked={Boolean(v)}/> {l}</label></div>
export function CmsForm({kind,id,record,categories}:{kind:CmsKind;id?:string;record?:Rec;categories:{id:string;label:string}[]}){
  const router=useRouter();const [pending,setPending]=useState(false);const [error,setError]=useState('');const [ok,setOk]=useState('');const r=record??{}
  const listText=(v:unknown)=>Array.isArray(v)?v.join('\n'):''
  async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setError('');setOk('');const fd=Object.fromEntries(new FormData(e.currentTarget)) as Record<string,unknown>
    for(const k of ['featured','isCancelled','isActive'])fd[k]=(e.currentTarget.elements.namedItem(k) as HTMLInputElement|null)?.checked??false
    for(const k of ['publishedAt','expiresAt','startsAt','endsAt'])if(fd[k])fd[k]=iso(fd[k]);
    setPending(true)
    try{const res=await fetch(id?`/api/v1/manage/${kind}/${id}`:`/api/v1/manage/${kind}`,{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(cmsPayload(kind,fd,Boolean(r.isSample)))});const b=await res.json().catch(()=>null);if(!res.ok)throw new Error(b?.error?.message||'Save failed.');setOk('Saved.');if(!id)router.push(`/admin/${kind}/${b.data.id}`);router.refresh()}catch(err){setError(err instanceof Error?err.message:'Save failed.')}finally{setPending(false)}}
  const status=String(r.status??'draft')
  return <form className="faculty-form" onSubmit={submit}><fieldset disabled={pending}>
    <T n="title" l="Title" v={r.title} req/><T n="slug" l="Slug" v={r.slug} req help="Lowercase letters, numbers and hyphens"/>
    <S n="status" l="Status" v={status} o={['draft','published','archived'].map(v=>({value:v,label:v}))}/>
    <T n="publishedAt" l={kind==='announcements'?'Publish from (schedule by choosing a future time)':'Published date'} type="datetime-local" v={local(r.publishedAt)}/>
    {kind==='news'&&<><A n="excerpt" l="Excerpt" v={r.excerpt} rows={3}/><T n="authorName" l="Author" v={r.authorName}/><T n="imageUrl" l="Image URL (https)" type="url" v={r.imageUrl}/><T n="imageAlt" l="Image description" v={r.imageAlt}/><C n="featured" l="Featured" v={r.featured}/></>}
    {kind==='events'&&<><A n="description" l="Description" v={r.description} rows={3}/><T n="startsAt" l="Starts" type="datetime-local" v={local(r.startsAt)} req/><T n="endsAt" l="Ends" type="datetime-local" v={local(r.endsAt)} req/><T n="timezone" l="Time zone (IANA)" v={r.timezone??'UTC'}/><T n="location" l="Location" v={r.location}/><T n="organizer" l="Organizer" v={r.organizer}/><T n="registrationUrl" l="Registration URL" type="url" v={r.registrationUrl}/><T n="imageUrl" l="Image URL (https)" type="url" v={r.imageUrl}/><T n="imageAlt" l="Image description" v={r.imageAlt}/><C n="featured" l="Featured" v={r.featured}/><C n="isCancelled" l="Cancelled" v={r.isCancelled}/></>}
    {kind==='announcements'&&<><S n="audience" l="Audience" v={r.audience??'everyone'} o={['everyone','students','faculty','staff','applicants'].map(v=>({value:v,label:v}))}/><T n="priority" l="Priority (0–3)" type="number" v={r.priority??0}/><T n="expiresAt" l="Expires (hidden publicly afterwards)" type="datetime-local" v={local(r.expiresAt)}/></>}
    {kind==='scholarships'&&<><A n="description" l="Description" v={r.description}/><A n="eligibility" l="Eligibility (one per line)" v={listText(r.eligibility)}/><T n="coverage" l="Coverage" v={r.coverage}/><A n="applicationProcess" l="Application process" v={r.applicationProcess} rows={3}/><A n="requiredDocuments" l="Required documents (one per line)" v={listText(r.requiredDocuments)}/><T n="contactEmail" l="Contact email" type="email" v={r.contactEmail}/><S n="degreeLevel" l="Degree level" v={r.degreeLevel} o={[{value:'',label:'Any'},...['undergraduate','graduate','doctoral'].map(v=>({value:v,label:v}))]}/><S n="applicantType" l="Applicant type" v={r.applicantType??'all'} o={['all','domestic','international'].map(v=>({value:v,label:v}))}/><T n="opensOn" l="Opens on" type="date" v={r.opensOn}/><T n="deadline" l="Deadline" type="date" v={r.deadline}/><C n="isActive" l="Active" v={r.isActive??true}/></>}
    {kind!=='scholarships'&&<><S n="categoryId" l="Category" v={r.categoryId} o={[{value:'',label:'None'},...categories.map(c=>({value:c.id,label:c.label}))]}/><A n="content" l="Content" v={blocksToText(r.content as Block[]|undefined)} rows={12} help="Blank line = new paragraph. “# ” heading, “> ” quote, “- ” list items."/></>}
    <T n="seoTitle" l="SEO title" v={r.seoTitle}/><A n="seoDescription" l="SEO description" v={r.seoDescription} rows={2}/>
    <button className="button dark" disabled={pending}>{pending?'Saving…':id?'Save changes':'Create'}</button></fieldset>
    <p role="status" aria-live="polite">{ok}</p>{error&&<p role="alert">{error}</p>}</form>}
