// EXPLAIN validates the real generated mutation SQL and parameter types without
// executing any write. Authorization is covered separately by HTTP integration.
import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const path='.faculty-sql-plan.ts';let s=fs.readFileSync('db/queries/faculty-actions.ts','utf8');
s=s.replace("import {db} from '@/db'",`import 'dotenv/config'
import {neon} from '@neondatabase/serverless'
import {PgDialect} from 'drizzle-orm/pg-core'
const planner=neon(process.env.DATABASE_URL!),dialect=new PgDialect()
const db={execute:(q:SQL)=>Object.assign(q,{rows:[{section_id:'00000000-0000-4000-8000-000000000003'}]}),batch:async(queries:SQL[])=>{const q=dialect.sqlToQuery(queries[1]);await planner.query('EXPLAIN '+q.sql,q.params);return [{rows:[{id:'planned'}]},{rows:[{id:'planned'}]}]}}`)
.replace("import {ownFaculty,requireFacultySectionAccess} from '@/lib/server/faculty-access'",`const identity={user:{id:'00000000-0000-4000-8000-000000000001'},faculty:{id:'00000000-0000-4000-8000-000000000002'}}
const ownFaculty=async()=>identity
const requireFacultySectionAccess=async()=>identity`)
.replace("import {facultyDetail} from './faculty'",`const facultyDetail=async()=>({sectionId:'00000000-0000-4000-8000-000000000003'})`);
s+=`\nasync function plan(){const id='00000000-0000-4000-8000-000000000004',p={marks:10,feedback:'QA',reason:'SQL planning test',publish:true,version:0};await gradeSubmission(id,p);console.log('PASS submission grade SQL planning');await gradeExam(id,id,p);console.log('PASS exam grade SQL planning');await gradeFinal(id,{scaleId:id,publish:true,reason:'SQL planning test',version:0});console.log('PASS final grade SQL planning')}plan().catch(e=>{const cause=e.cause||e;console.error({code:cause.code,message:cause.message});process.exitCode=1})\n`;
try{fs.writeFileSync(path,s);const r=spawnSync(process.execPath,['--import','tsx',path],{stdio:'inherit',env:process.env});process.exitCode=r.status||0}finally{fs.unlinkSync(path)}
