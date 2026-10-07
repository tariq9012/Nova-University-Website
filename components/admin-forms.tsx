'use client'
import {useRef,useState} from 'react'
import {useRouter} from 'next/navigation'

export type FormField={name:string;label:string;type:'text'|'textarea'|'number'|'checkbox'|'select'|'date'|'datetime'|'email'|'url';required?:boolean;max?:number;min?:number;help?:string;options?:{value:string;label:string}[];optional?:boolean}
type Props={endpoint:string;method:'POST'|'PUT'|'PATCH';fields:FormField[];values?:Record<string,unknown>;submitLabel:string;successMessage?:string;redirectTo?:string;confirm?:string;danger?:boolean;extra?:Record<string,unknown>}
const pad=(n:number)=>String(n).padStart(2,'0')
function localInput(v:unknown){if(!v)return '';const d=new Date(String(v));if(Number.isNaN(d.getTime()))return '';return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`}
const dateInput=(v:unknown)=>v?String(v).slice(0,10):''
/**
 * Generic JSON form for admin mutations. It only sends what the user typed; identity, role and permissions are never sent —
 * the server derives them from the session. Destructive actions use a native modal <dialog> for confirmation.
 */
export function JsonForm({endpoint,method,fields,values={},submitLabel,successMessage='Saved.',redirectTo,confirm,danger,extra={}}:Props){
  const router=useRouter();const formRef=useRef<HTMLFormElement>(null);const dialog=useRef<HTMLDialogElement>(null)
  const [pending,setPending]=useState(false);const [error,setError]=useState('');const [message,setMessage]=useState('')
  async function send(){
    const form=formRef.current;if(!form)return;const fd=new FormData(form);const body:Record<string,unknown>={...extra}
    for(const f of fields){const raw=fd.get(f.name)
      if(f.type==='checkbox')body[f.name]=raw==='on'
      else if(f.type==='number')body[f.name]=raw===''||raw===null?'':Number(raw)
      else if(f.type==='datetime')body[f.name]=raw?new Date(String(raw)).toISOString():''
      else body[f.name]=raw===null?'':String(raw)}
    setPending(true);setError('');setMessage('')
    try{const r=await fetch(endpoint,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const b=await r.json().catch(()=>null);if(!r.ok)throw new Error(b?.error?.message||'The request failed.')
      setMessage(successMessage);if(redirectTo)router.push(redirectTo);router.refresh()}
    catch(e){setError(e instanceof Error?e.message:'The request failed.')}finally{setPending(false)}}
  return <form ref={formRef} className="faculty-form" method="post" onSubmit={e=>{e.preventDefault();if(confirm)dialog.current?.showModal();else void send()}}>
    <fieldset disabled={pending}>
      {fields.map(f=>{const id='f-'+f.name;const v=values[f.name];const common={id,name:f.name,required:f.required,'aria-describedby':f.help?id+'-help':undefined}
        return <div key={f.name}>{f.type==='checkbox'?<label htmlFor={id}><input {...common} type="checkbox" defaultChecked={Boolean(v)}/> {f.label}</label>:<><label htmlFor={id}>{f.label}{f.required&&<span aria-hidden="true"> *</span>}</label>
          {f.type==='textarea'?<textarea {...common} rows={4} maxLength={f.max} defaultValue={v==null?'':String(v)}/>
          :f.type==='select'?<select {...common} defaultValue={v==null?'':String(v)}>{!f.required&&<option value="">—</option>}{f.options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
          :<input {...common} type={f.type==='datetime'?'datetime-local':f.type} maxLength={f.max} min={f.min} defaultValue={f.type==='datetime'?localInput(v):f.type==='date'?dateInput(v):v==null?'':String(v)}/>}</>}
          {f.help&&<p id={id+'-help'} className="cms-meta">{f.help}</p>}</div>})}
      <button className={danger?'button':'button dark'} disabled={pending}>{pending?'Working…':submitLabel}</button>
    </fieldset>
    <p role="status" aria-live="polite">{message}</p>{error&&<p role="alert">{error}</p>}
    {confirm&&<dialog ref={dialog} aria-labelledby="confirm-title" onClose={()=>undefined}><h2 id="confirm-title">Please confirm</h2><p>{confirm}</p><div><button type="button" className="button dark" onClick={()=>{dialog.current?.close();void send()}}>Confirm</button> <button type="button" className="button" onClick={()=>dialog.current?.close()}>Cancel</button></div></dialog>}
  </form>}
