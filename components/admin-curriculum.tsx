import {readCurriculum} from '@/db/queries/admin-curriculum'
import {resourceOptions} from '@/db/queries/admin-resources'
import {JsonForm} from './admin-forms'
import {AdminTable} from './admin-ui'
export async function AdminCurriculum({programId}:{programId:string}){
  const [c,opts]=await Promise.all([readCurriculum(programId),resourceOptions(['courses'])]);const courses=(opts.courses??[]).map(o=>({value:o.id,label:o.label}));const api='/api/v1/admin/curriculum/'+programId
  return <section aria-labelledby="curriculum-h"><h2 id="curriculum-h">Curriculum</h2>
   <p>Planned credits: {c.plannedCredits} of {c.program.totalCredits} required.{c.plannedCredits!==c.program.totalCredits&&' The planned total does not match the program credit requirement.'}</p>
   <AdminTable caption="Program curriculum" columns={[{key:'semester',label:'Semester'},{key:'code',label:'Code'},{key:'title',label:'Title'},{key:'type',label:'Type'},{key:'credits',label:'Credits'},{key:'prereq',label:'Prerequisites'},{key:'remove',label:'Remove'}]} empty="No courses in this curriculum yet."
    rows={c.rows.map(r=>({...r,prereq:c.prerequisites.filter(p=>p.courseId===r.courseId).map(p=>p.code).join(', ')||'None',remove:''}))}/>
   <h3>Add course</h3><JsonForm endpoint={api} method="POST" extra={{action:'add'}} submitLabel="Add to curriculum" successMessage="Course added." fields={[{name:'courseId',label:'Course',type:'select',required:true,options:courses},{name:'semesterNumber',label:'Recommended semester (1–12)',type:'number',required:true,min:1,max:12},{name:'courseType',label:'Required / elective',type:'select',required:true,options:['core','required','elective','major','general_education'].map(v=>({value:v,label:v}))}]}/>
   <h3>Remove course</h3><JsonForm endpoint={api} method="POST" extra={{action:'remove'}} submitLabel="Remove" danger confirm="Remove this course from the curriculum? The course itself is not deleted." successMessage="Removed." fields={[{name:'rowId',label:'Curriculum entry',type:'select',required:true,options:c.rows.map(r=>({value:String(r.id),label:`S${String(r.semester)} · ${String(r.code)} ${String(r.title)}`}))},{name:'reason',label:'Reason',type:'textarea',required:true,max:500}]}/>
   <h3>Add prerequisite</h3><JsonForm endpoint={api} method="POST" extra={{action:'add-prerequisite'}} submitLabel="Add prerequisite" successMessage="Prerequisite added." fields={[{name:'courseId',label:'Course',type:'select',required:true,options:courses},{name:'prerequisiteCourseId',label:'Requires',type:'select',required:true,options:courses}]}/>
  </section>}
