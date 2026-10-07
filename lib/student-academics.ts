/** Published, completed attempts only. Credit is awarded once per course. GPA repeat
 * treatment is explicitly assigned by the registrar; no policy means no GPA. */
export type Attempt={id:string;courseId:string;semesterId:string;endsOn:string;credits:number;status:string;grade:string;points:number|null;countsForGpa:boolean;earnsCredit:boolean;policyId:string}
export function academicTotals(attempts:Attempt[],policy:{id:string;repeatPolicy:'all'|'latest'|'best'}|null){
 const completed=attempts.filter(a=>a.status==='completed'&&a.credits>0)
 const earned=new Map<string,number>();for(const a of completed)if(a.earnsCredit)earned.set(a.courseId,Math.max(earned.get(a.courseId)||0,Number(a.credits)))
 const applicable=policy?completed.filter(a=>a.policyId===policy.id&&a.countsForGpa&&a.points!==null):[]
 function gpa(rows:Attempt[]){if(!policy)return null;let selected=rows;if(policy.repeatPolicy!=='all'){const byCourse=new Map<string,Attempt>();for(const row of rows){const old=byCourse.get(row.courseId);if(!old||(policy.repeatPolicy==='best'?Number(row.points)>Number(old.points)||Number(row.points)===Number(old.points)&&row.endsOn>old.endsOn:row.endsOn>old.endsOn))byCourse.set(row.courseId,row)}selected=[...byCourse.values()]}
 const credits=selected.reduce((n,r)=>n+Number(r.credits),0);return credits?Math.round(selected.reduce((n,r)=>n+Number(r.credits)*Number(r.points),0)/credits*1000)/1000:null}
 return {completedCredits:[...earned.values()].reduce((n,v)=>n+v,0),completedCourseIds:[...earned.keys()],cgpa:gpa(applicable),semesterGpa:Object.fromEntries([...new Set(attempts.map(a=>a.semesterId))].map(id=>[id,gpa(applicable.filter(a=>a.semesterId===id))]))}
}
export function attendanceTotals(rows:{status:string}[]){const present=rows.filter(r=>r.status==='present').length,absent=rows.filter(r=>r.status==='absent').length,excused=rows.filter(r=>r.status==='excused').length;return {present,absent,excused,total:rows.length,percentage:present+absent?Math.round(present/(present+absent)*1000)/10:null}}
/** Currency amounts remain integer minor units; no floating point sums. */
export function invoiceState(total:number,paid:number,dueOn:string,today:string){return {due:Math.max(0,total-paid),status:paid>=total?'Paid':dueOn<today?'Overdue':paid>0?'Partially paid':'Due'}}
