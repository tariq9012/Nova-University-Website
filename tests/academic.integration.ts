import assert from 'node:assert/strict'
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3000'
let passed=0
async function json(path:string,status=200){const response=await fetch(base+path);assert.equal(response.status,status,path);return response.json()}
const checks:[string,()=>Promise<void>][]=[
 ['database health',async()=>{assert.equal((await json('/api/health')).database,'connected')}],
 ['program degree and school',async()=>{const r=await json('/api/v1/programs?school=computing&degreeLevel=graduate');assert.ok(r.data.length);assert.ok(r.data.every((x:{schoolSlug:string;degreeLevel:string})=>x.schoolSlug==='computing'&&x.degreeLevel==='graduate'))}],
 ['program duration',async()=>{const r=await json('/api/v1/programs?duration=2');assert.ok(r.data.length);assert.ok(r.data.every((x:{durationYears:number})=>x.durationYears===2))}],
 ['study mode',async()=>{const r=await json('/api/v1/programs?studyMode=part_time');assert.ok(r.data.every((x:{studyMode:string})=>x.studyMode==='part_time'))}],
 ['campus filter',async()=>{assert.equal((await json('/api/v1/programs?campus=not-a-campus')).meta.total,0)}],
 ['course filters',async()=>{const r=await json('/api/v1/courses?school=computing&courseLevel=3&creditHours=4');assert.ok(r.data.length);assert.ok(r.data.every((x:{courseLevel:number;creditHours:number;schoolSlug:string})=>x.courseLevel===3&&x.creditHours===4&&x.schoolSlug==='computing'))}],
 ['course type',async()=>{const r=await json('/api/v1/courses?courseType=general_education');assert.ok(r.data.length);assert.ok(r.data.every((x:{courseType:string})=>x.courseType==='general_education'))}],
 ['course sort',async()=>{const a=await json('/api/v1/courses?sort=title&pageSize=100');const b=await json('/api/v1/courses?sort=-title&pageSize=100');assert.deepEqual(a.data.map((x:{slug:string})=>x.slug).reverse(),b.data.map((x:{slug:string})=>x.slug))}],
 ['faculty filters',async()=>{const r=await json('/api/v1/faculty?school=computing&facultyType=full_time&researchArea=artificial-intelligence&position=Professor');assert.ok(r.data.length);assert.ok(r.data.every((x:{facultyType:string;position:string})=>x.facultyType==='full_time'&&x.position==='Professor'))}],
 ['department filter',async()=>{const r=await json('/api/v1/departments?school=computing');assert.equal(r.meta.total,3)}],
 ['school pagination',async()=>{const r=await json('/api/v1/schools?pageSize=2');assert.equal(r.data.length,2);assert.equal(r.meta.total,5)}],
 ['calendar filters',async()=>{const r=await json('/api/v1/calendar?year=2026&semester=Fall%202026&eventType=finals');assert.equal(r.data.length,1);assert.equal(r.data[0].eventType,'finals')}],
 ['calendar date range',async()=>{const r=await json('/api/v1/calendar?from=2026-12-01&to=2026-12-31');assert.equal(r.data.length,3)}],
 ['calendar empty year',async()=>{assert.equal((await json('/api/v1/calendar?year=2099')).meta.total,0)}],
 ['search global pagination',async()=>{const a=await json('/api/v1/search?search=computer&pageSize=2&page=1');const b=await json('/api/v1/search?search=computer&pageSize=2&page=2');assert.equal(a.data.length,2);assert.ok(a.meta.total>2);assert.equal(a.meta.total,b.meta.total);assert.ok(b.data.every((x:{href:string})=>!a.data.some((y:{href:string})=>y.href===x.href)))}],
 ['search category and degree',async()=>{const r=await json('/api/v1/search?category=programs&school=computing&department=computer-science&degreeLevel=doctoral');assert.equal(r.data.length,1);assert.equal(r.data[0].href,'/academics/programs/phd-computer-science')}],
 ['search literal wildcard',async()=>{assert.equal((await json('/api/v1/search?search=%25')).meta.total,0)}],
 ['curriculum sum',async()=>{const r=await json('/api/v1/programs/bs-computer-science/curriculum');const semesters=r.data.semesters;const placements=semesters.flatMap((s:{courses:{course:{id:string;creditHours:number}}[]})=>s.courses);assert.equal(new Set(placements.map((x:{course:{id:string}})=>x.course.id)).size,placements.length);assert.equal(r.data.totalCreditHours,placements.reduce((sum:number,x:{course:{creditHours:number}})=>sum+x.course.creditHours,0));assert.ok(r.data.totalCreditHours>0)}],
 ['program relationships',async()=>{const r=(await json('/api/v1/programs/bs-computer-science')).data;assert.ok(r.faculty.length&&r.campuses.length&&r.related.length)}],
 ['course relationships',async()=>{const r=(await json('/api/v1/courses/programming-fundamentals')).data;assert.ok(r.prerequisites.length&&r.faculty.length&&r.programs.length)}],
 ['school relationships',async()=>{const r=(await json('/api/v1/schools/computing')).data;assert.ok(r.dean&&r.departments.length&&r.researchAreas.length)}],
 ['department relationships',async()=>{const r=(await json('/api/v1/departments/computer-science')).data;assert.ok(r.head&&r.courses.length&&r.researchAreas.length)}],
 ['faculty profile',async()=>{const r=(await json('/api/v1/faculty/leila-okafor')).data;assert.ok(r.courses.length&&r.programs.length&&r.researchAreas.length);assert.ok(Array.isArray(r.publications))}],
 ['missing record',async()=>{const r=await json('/api/v1/programs/no-such-program',404);assert.equal(r.success,false)}],
 ['malformed slug',async()=>{await json('/api/v1/schools/INVALID',400)}],
 ['pagination bounds',async()=>{await json('/api/v1/programs?pageSize=101',400)}],
 ['invalid date',async()=>{await json('/api/v1/calendar?from=2026-02-30',400)}],
 ['reversed dates',async()=>{await json('/api/v1/calendar?from=2026-12-31&to=2026-01-01',400)}],
 ['invalid degree',async()=>{await json('/api/v1/programs?degreeLevel=invalid',400)}],
 ['invalid numeric filter',async()=>{await json('/api/v1/courses?creditHours=-1',400)}],
]
async function main(){for(let i=0;i<checks.length;i+=4){await Promise.all(checks.slice(i,i+4).map(async([name,run])=>{await run();passed++;console.log('PASS',name)}))}console.log(`${passed}/${checks.length} academic API checks passed`)}
main().catch(e=>{console.error(e);process.exitCode=1})
