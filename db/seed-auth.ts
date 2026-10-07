import 'dotenv/config'
import {randomBytes} from 'node:crypto'
import {mkdir,readFile,writeFile,chmod} from 'node:fs/promises'
import {sql} from 'drizzle-orm'
import {db} from './index'
import {hashPassword} from '../lib/server/passwords'
import {developmentAccountsAllowed} from '../lib/server/auth'
export async function seedAuth(){
 if(process.env.ALLOW_DEV_SEED!=='true'||!developmentAccountsAllowed())throw new Error('Development setup requires ALLOW_DEV_SEED=true, AUTH_ALLOW_DEV_ACCOUNTS=true and a localhost AUTH_ORIGIN.')
 await mkdir('.auth-dev',{recursive:true,mode:0o700});await chmod('.auth-dev',0o700)
 let existing:Record<string,{email:string;password:string}>={};try{existing=JSON.parse(await readFile('.auth-dev/accounts.json','utf8'))}catch{}
 for(const role of ['student','faculty','admin']){const email=`${role}.dev@nova.example`;const password='Nova-'+randomBytes(18).toString('base64url');const hash=await hashPassword(password);const result=await db.execute(sql`with created as (insert into users(email,first_name,last_name,display_name,password_hash,email_verified_at,terms_accepted_at,is_development) values (${email},'Development',${role},${'Development '+role},${hash},now(),now(),true) on conflict do nothing returning id), assigned as (insert into user_roles(user_id,role_id) select u.id,r.id from created u cross join roles r where r.name=${role}), student as (insert into student_profiles(user_id,student_number,program_id,enrollment_year,academic_status) select id,'DEMO-001',(select id from programs where slug='bs-computer-science'),2026,'development' from created where ${role}='student'), faculty as (update faculty_profiles set user_id=(select id from created) where slug='leila-okafor' and user_id is null and ${role}='faculty' and exists(select 1 from created)), logged as (insert into audit_logs(actor_user_id,action,entity_type,entity_id) select id,'development.account_seeded','user',id::text from created) select id from created`);if(result.rows[0])existing[role]={email,password}}
 await writeFile('.auth-dev/accounts.json',JSON.stringify(existing,null,2),{mode:0o600});await chmod('.auth-dev/accounts.json',0o600)
 console.log('Development accounts prepared. Credentials are in .auth-dev/accounts.json (private local file). Existing users and passwords were not overwritten.')
}
if(process.argv[1]?.endsWith('seed-auth.ts'))seedAuth().catch(()=>{console.error('Development setup failed. Check the explicit development flags, migration state and localhost origin.');process.exitCode=1})
