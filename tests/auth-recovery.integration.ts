/** Mutations in this suite target ONLY a newly registered, random temporary account. */
import 'dotenv/config'
import assert from 'node:assert/strict'
import {randomUUID,randomBytes} from 'node:crypto'
import {readFile} from 'node:fs/promises'
import {sql} from 'drizzle-orm'
import {db} from '../db'
import {issueToken} from '../lib/server/auth-service'
import {tokenHash} from '../lib/server/passwords'
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:3007'
const email='recovery-qa-'+randomUUID()+'@example.test',password='QA-'+randomBytes(20).toString('hex')
let fixtureId:string|undefined,passed=0
async function call(path:string,expected:number,data?:unknown,cookie?:string){const r=await fetch(base+path,{method:data===undefined?'GET':'POST',headers:{Origin:base,'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(data===undefined?{}:{body:JSON.stringify(data)})});const b=await r.json();assert.equal(r.status,expected,path+': '+(b.error?.message||r.status));return {body:b,cookie:r.headers.get('set-cookie')?.split(';')[0]}}
async function login(e:string,p:string){return call('/api/auth/login',200,{email:e,password:p})}
async function status(admin:string,value:string){assert.ok(fixtureId);assert.ok(email.startsWith('recovery-qa-'));const r=await fetch(base+'/api/v1/admin/users/'+fixtureId,{method:'PATCH',headers:{Origin:base,'Content-Type':'application/json',Cookie:admin},body:JSON.stringify({status:value})});assert.equal(r.status,200)}
async function check(name:string,fn:()=>Promise<void>){await fn();passed++;console.log('PASS',name)}
async function main(){const credentials=JSON.parse(await readFile('.auth-dev/accounts.json','utf8'));const [admin]=await Promise.all([login(credentials.admin.email,credentials.admin.password),call('/api/auth/register',202,{email,password,confirmPassword:password,firstName:'Recovery',lastName:'Fixture',terms:true})]);let user=await login(email,password);fixtureId=user.body.data.user.id;assert.notEqual(fixtureId,admin.body.data.user.id)
try{
 await check('verification is hashed and single-use for the new fixture',async()=>{const token=await issueToken(email,'verify');assert.ok(token);const row=await db.execute(sql`select token_hash from auth_tokens where token_hash=${tokenHash(token)}`);assert.equal(row.rows[0].token_hash,tokenHash(token));await call('/api/auth/verify-email',200,{token});await call('/api/auth/verify-email',400,{token})})
 await check('suspended fixture cannot log in or use its prior session',async()=>{await status(admin.cookie!,'suspended');try{await Promise.all([call('/api/auth/session',401,undefined,user.cookie),call('/api/auth/login',401,{email,password})])}finally{await status(admin.cookie!,'active')}user=await login(email,password)})
 const changed='Changed-'+randomBytes(20).toString('hex')
 await check('password change revokes fixture sessions',async()=>{await call('/api/auth/change-password',200,{currentPassword:password,password:changed,confirmPassword:changed},user.cookie);await call('/api/auth/session',401,undefined,user.cookie);user=await login(email,changed)})
 await check('expired reset token is rejected',async()=>{const token=await issueToken(email,'reset');assert.ok(token);await db.execute(sql`update auth_tokens set expires_at=now()-interval '1 second' where token_hash=${tokenHash(token)} and user_id=${fixtureId}::uuid`);await call('/api/auth/reset-password',400,{token,password,confirmPassword:password})})
 const reset='Reset-'+randomBytes(20).toString('hex')
 await check('reset token is single-use and revokes all fixture sessions',async()=>{const token=await issueToken(email,'reset');assert.ok(token);await call('/api/auth/reset-password',200,{token,password:reset,confirmPassword:reset});await Promise.all([call('/api/auth/reset-password',400,{token,password:reset,confirmPassword:reset}),call('/api/auth/session',401,undefined,user.cookie),call('/api/auth/login',401,{email,password:changed})]);user=await login(email,reset)})
 await check('logout invalidates the fixture session on the server',async()=>{await call('/api/auth/logout',200,{},user.cookie);await call('/api/auth/session',401,undefined,user.cookie)})
 await check('expired session cannot be reused',async()=>{user=await login(email,reset);await db.execute(sql`update auth_sessions set expires_at=now()-interval '1 second' where token_hash=${tokenHash(user.cookie!.split('=')[1])} and user_id=${fixtureId}::uuid`);await call('/api/auth/session',401,undefined,user.cookie)})
 await check('audit events contain no fixture credentials or token hashes',async()=>{const r=await db.execute(sql`select action,metadata from audit_logs where actor_user_id=${fixtureId}::uuid`);const text=JSON.stringify(r.rows);for(const action of ['auth.password_reset','auth.password_changed','admin.user_status','auth.logout']){if(action!=='admin.user_status')assert.ok(text.includes(action))}for(const secret of [password,changed,reset])assert.equal(text.includes(secret),false);assert.equal(/password_hash|token_hash/.test(text),false)})
}finally{if(fixtureId)await db.execute(sql`delete from users where id=${fixtureId}::uuid and email=${email} and first_name='Recovery' and last_name='Fixture'`);await call('/api/auth/logout',200,{},admin.cookie)}
console.log('Recovery/security completion: '+passed+' checks passed; temporary fixture removed.')}
main().catch(e=>{console.error(e instanceof Error?e.message:'Recovery verification failed');process.exitCode=1})
