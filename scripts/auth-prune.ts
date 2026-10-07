import 'dotenv/config'
import {db} from '../db'
import {sql} from 'drizzle-orm'
async function main(){await db.batch([db.execute(sql`delete from auth_sessions where expires_at<now()`),db.execute(sql`delete from auth_tokens where expires_at<now() or consumed_at is not null`),db.execute(sql`delete from auth_rate_limits where reset_at<now()`)]);console.log('Expired authentication records removed. Audit history retained.')}
main().catch(()=>{console.error('Auth cleanup failed');process.exitCode=1})
