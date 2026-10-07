/** Pure business rules shared by admin operations and unit tests (no imports). */
export const PRIVILEGED_ROLES=['admin','super_admin'] as const
export const isPrivilegedRole=(r:string)=>(PRIVILEGED_ROLES as readonly string[]).includes(r)
/** Half-open interval overlap: back-to-back bookings do not conflict. */
export const overlaps=(aStart:number,aEnd:number,bStart:number,bEnd:number)=>aStart<bEnd&&bStart<aEnd
export function minutesBetween(startIso:string,endIso:string){const a=Date.parse(startIso),b=Date.parse(endIso);if(Number.isNaN(a)||Number.isNaN(b))return null;const m=Math.round((b-a)/60000);return m>0?m:null}
/** "12000.50" -> 1200050. Rejects floats with >2 decimals, negatives and absurd sizes; avoids binary float rounding. */
export function toMinor(v:string){const m=/^(\d{1,10})(?:\.(\d{1,2}))?$/.exec(v.trim());if(!m)return null;const minor=Number(m[1])*100+Number((m[2]??'').padEnd(2,'0')||'0');return minor>0&&Number.isSafeInteger(minor)?minor:null}
export type InvoiceLine={label:string;category:string;amountMinor:number}
/** One line per item: `Label | 1234.50` or `Label | category | 1234.50`. Labels must be unique (DB constraint mirrors this). */
export function parseInvoiceLines(text:string):{lines:InvoiceLine[]}|{error:string}{
  const raw=text.split(/\r?\n/).map(l=>l.trim()).filter(Boolean);if(!raw.length)return {error:'Add at least one invoice line.'};if(raw.length>30)return {error:'At most 30 lines.'}
  const lines:InvoiceLine[]=[];const seen=new Set<string>()
  for(const l of raw){const parts=l.split('|').map(p=>p.trim());if(parts.length<2||parts.length>3)return {error:`Invalid line: “${l.slice(0,60)}”. Use “Label | amount”.`}
    const amount=toMinor(parts[parts.length-1]);const label=parts[0];const category=parts.length===3?parts[1]:'tuition'
    if(!label||label.length>200)return {error:'Each line needs a label of up to 200 characters.'}
    if(!/^[a-z_]{2,40}$/.test(category))return {error:`Invalid category “${category}”. Use lowercase letters or underscores.`}
    if(amount===null)return {error:`Invalid amount on line “${l.slice(0,60)}”. Use a positive amount with at most two decimals.`}
    const key=label.toLowerCase();if(seen.has(key))return {error:`Duplicate line label “${label}”.`};seen.add(key);lines.push({label,category,amountMinor:amount})}
  return {lines}}
export type InvoiceState='draft'|'cancelled'|'paid'|'overdue'|'partially_paid'|'issued'
export function invoiceState(i:{isDraft:boolean;voided:boolean;totalMinor:number;paidMinor:number;dueOn:string;today:string}):InvoiceState{
  if(i.voided)return 'cancelled';if(i.isDraft)return 'draft';if(i.totalMinor>0&&i.paidMinor>=i.totalMinor)return 'paid';if(i.dueOn<i.today)return 'overdue';if(i.paidMinor>0)return 'partially_paid';return 'issued'}
/** Invoices with any recorded settlement can never be edited or cancelled through the admin portal. */
export const invoiceEditable=(s:InvoiceState)=>s==='draft'
export const invoiceCancellable=(s:InvoiceState,paidMinor:number)=>s!=='cancelled'&&s!=='paid'&&paidMinor===0
export const withdrawableStatus=(s:string)=>s==='enrolled'||s==='in_progress'
export const ATTENDANCE_STATUSES=['present','absent','excused'] as const
/** Enrolment capacity check used for UI hints; the database statement is the authority. */
export const hasCapacity=(enrolled:number,capacity:number)=>enrolled<capacity
