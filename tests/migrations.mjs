const {PGlite}=await import(process.env.PGLITE_MODULE||'@electric-sql/pglite');
import fs from 'node:fs';
const root=process.cwd();
const db=new PGlite();
for(const file of fs.readdirSync(root+'/drizzle').filter(x=>x.endsWith('.sql')).sort()){
 try{await db.exec(fs.readFileSync(root+'/drizzle/'+file,'utf8'));console.log('PASS',file)}catch(e){console.log('FAIL',file,e.message);process.exitCode=1;break}
}
const invalid=[
 ["event chronology","insert into events(slug,title,starts_at,ends_at) values ('bad','Bad','2026-09-22T10:00Z','2026-09-22T09:00Z')",'23514'],
 ["announcement priority","insert into announcements(slug,title,priority) values ('bad','Bad',4)",'23514'],
 ["fee amount","insert into fee_structures(slug,academic_year,currency,tuition) values ('bad','2026','PKR',-1)",'23514'],
 ["application foreign keys","insert into applications(applicant_id,program_id,intake_id,degree_level) values ('f47ac10b-58cc-4372-a567-0e02b2c3d479','f47ac10b-58cc-4372-a567-0e02b2c3d479','f47ac10b-58cc-4372-a567-0e02b2c3d479','undergraduate')",'23503'],
 ["document size","insert into application_documents(application_id,storage_key,original_name,mime_type,size_bytes) values ('f47ac10b-58cc-4372-a567-0e02b2c3d479','key','record.pdf','application/pdf',10485761)",'23514'],
 ["scholarship chronology","insert into scholarships(slug,title,opens_on,deadline) values ('bad','Bad','2026-09-22','2026-09-21')",'23514']
];
for(const [label,query,code] of invalid){let rejected=false;try{await db.exec(query)}catch(e){rejected=e.code===code}if(rejected)console.log('PASS constraint:',label);else{console.log('FAIL constraint:',label);process.exitCode=1}}
await db.exec("insert into users(email) values ('unique@example.test')");
for(const [label,query,code] of [
 ['case-insensitive email uniqueness',"insert into users(email) values ('UNIQUE@example.test')",'23505'],
 ['auth token purpose',"insert into auth_tokens(user_id,token_hash,purpose,auth_version,expires_at) select id,repeat('a',64),'invalid',0,now() from users limit 1",'23514'],
 ['session user foreign key',"insert into auth_sessions(user_id,token_hash,auth_version,expires_at) values ('f47ac10b-58cc-4372-a567-0e02b2c3d479',repeat('b',64),0,now())",'23503']
]){let rejected=false;try{await db.exec(query)}catch(e){rejected=e.code===code}if(rejected)console.log('PASS constraint:',label);else{console.log('FAIL constraint:',label);process.exitCode=1}}
await db.close();
