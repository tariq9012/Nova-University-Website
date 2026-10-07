export type CurriculumRow={semester:number;courseType:string;course:{id:string;slug:string;code:string;title:string;creditHours:number}}
export function summarizeCurriculum<T extends CurriculumRow>(rows:T[]){
 const semesters=[...new Set(rows.map(r=>r.semester))].sort((a,b)=>a-b).map(semester=>{
  const courses=rows.filter(r=>r.semester===semester)
  return {semester,year:Math.ceil(semester/2),courses,creditHours:courses.reduce((sum,r)=>sum+r.course.creditHours,0)}
 })
 return {semesters,totalCreditHours:semesters.reduce((sum,s)=>sum+s.creditHours,0)}
}
