const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite');
import fs from 'node:fs';
const db=new PGlite();for(const file of fs.readdirSync('drizzle').filter(x=>x.endsWith('.sql')).sort())await db.exec(fs.readFileSync('drizzle/'+file,'utf8'));
await db.exec(fs.readFileSync('tests/fixtures/student.sql','utf8'));
const checks=[
 ['duplicate enrollment',"insert into enrollments(student_id,section_id,course_id,semester_id,credits) select student_id,section_id,course_id,semester_id,credits from enrollments",'23505'],
 ['cross-section attendance',"insert into attendance(enrollment_id,session_id,section_id,status) values ('80000000-0000-4000-8000-000000000001','90000000-0000-4000-8000-000000000002','70000000-0000-4000-8000-000000000001','present')",'23503'],
 ['duplicate attendance',"insert into attendance(enrollment_id,session_id,section_id,status) select enrollment_id,session_id,section_id,status from attendance",'23505'],
 ['cross-section submission',"insert into assignment_submissions(assignment_id,enrollment_id,section_id,content) values ('a0000000-0000-4000-8000-000000000002','80000000-0000-4000-8000-000000000001','70000000-0000-4000-8000-000000000001','Test')",'23503'],
 ['duplicate submission',"insert into assignment_submissions(assignment_id,enrollment_id,section_id,content) select assignment_id,enrollment_id,section_id,content from assignment_submissions",'23505'],
 ['duplicate grade',"insert into grades(enrollment_id,scale_id) select enrollment_id,scale_id from grades",'23505'],
 ['duplicate invoice',"insert into student_invoices(student_id,reference,currency,due_on) select student_id,reference,currency,due_on from student_invoices",'23505'],
 ['duplicate notification',"insert into user_notifications(user_id,title,message,dedupe_key) select user_id,title,message,dedupe_key from user_notifications",'23505'],
 ['semester chronology',"insert into semesters(code,academic_year,term,starts_on,ends_on) values ('BAD','2026','Bad','2026-12-01','2026-01-01')",'23514'],
 ['grade policy',"insert into grading_policies(name,repeat_policy,description) values ('Bad','unknown','Bad')",'23514'],
 ['negative invoice amount',"insert into student_invoice_items(invoice_id,label,category,amount_minor) select id,'Bad','Bad',-1 from student_invoices",'23514'],
 ['missing GPA points',"insert into grade_scale(policy_id,code,counts_for_gpa,earns_credit) select id,'Bad',true,true from grading_policies",'23514']
];
for(const [name,query,code] of checks){let caught;try{await db.exec(query)}catch(e){caught=e.code}if(caught!==code)throw new Error(name+': expected '+code+', got '+caught);console.log('PASS',name)}
console.log('PASS fresh database: all migrations and twelve Phase 5 integrity constraints');await db.close();
