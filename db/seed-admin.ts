import 'dotenv/config'
import {neon} from '@neondatabase/serverless'
import {PERMISSIONS} from '../lib/permissions'
// Idempotent: re-syncs the permission catalogue and default admin/super_admin grants. Never touches users, credentials or content.
async function main(){
 if(!process.env.DATABASE_URL)throw new Error('DATABASE_URL is required')
 const client=neon(process.env.DATABASE_URL)
 await client.transaction([
  client.query(`insert into permissions(key,description) select k,k from unnest($1::text[]) k on conflict(key) do nothing`,[PERMISSIONS as unknown as string[]]),
  client.query(`insert into role_permissions(role_id,permission_key) select r.id,p.key from roles r cross join permissions p where r.name in ('admin','super_admin') on conflict do nothing`)])
 console.log(`Permission catalogue synced (${PERMISSIONS.length} permissions).`)
}
main().catch(e=>{console.error('Admin seed failed:',e instanceof Error?e.message:'Unknown error');process.exitCode=1})
