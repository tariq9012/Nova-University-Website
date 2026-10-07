import {test} from 'node:test'
import assert from 'node:assert/strict'
import {academicFilters} from '../lib/academic-filters'
import {summarizeCurriculum} from '../lib/curriculum'
test('rejects malformed and unbounded academic filters',()=>{for(const bad of [{page:0},{page:1.5},{pageSize:101},{duration:-1},{courseLevel:10},{creditHours:0},{from:'2026-02-30'},{from:'2027-01-01',to:'2026-01-01'},{school:"x' OR 1=1"},{degreeLevel:'other'},{search:'x'.repeat(101)}])assert.equal(academicFilters.safeParse(bad).success,false,JSON.stringify(bad))})
test('empty optional GET controls and valid numeric filters normalize',()=>{const p=academicFilters.parse({school:'',courseLevel:'3',creditHours:'4',page:'2',year:'2026'});assert.equal(p.school,undefined);assert.equal(p.courseLevel,3);assert.equal(p.creditHours,4);assert.equal(p.page,2)})
test('curriculum totals reflect placements and semester order',()=>{const row=(semester:number,id:string,credits:number)=>({semester,courseType:'core',course:{id,slug:id,title:id,code:id,creditHours:credits}});const r=summarizeCurriculum([row(3,'A',4),row(1,'B',3),row(1,'C',2)]);assert.deepEqual(r.semesters.map(s=>[s.semester,s.year,s.creditHours]),[[1,1,5],[3,2,4]]);assert.equal(r.totalCreditHours,9);assert.equal(summarizeCurriculum([]).totalCreditHours,0)})
