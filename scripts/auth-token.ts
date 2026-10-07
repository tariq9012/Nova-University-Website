import 'dotenv/config'
import {mkdir,writeFile,chmod} from 'node:fs/promises'
import {emailInput} from '../lib/auth-validation'
import {issueToken} from '../lib/server/auth-service'
import {authOrigin,developmentAccountsAllowed} from '../lib/server/auth'
async function main(){if(process.env.ALLOW_DEV_SEED!=='true'||!developmentAccountsAllowed())throw new Error('Private development tools require explicit development flags and localhost AUTH_ORIGIN.');const email=emailInput.parse(process.argv[2]);const purpose=process.argv[3];if(purpose!=='reset'&&purpose!=='verify')throw new Error('Usage: npm run auth:dev-token -- email reset|verify');const token=await issueToken(email,purpose);if(!token)throw new Error('No eligible active account.');await mkdir('.auth-dev',{recursive:true,mode:0o700});await chmod('.auth-dev',0o700);await writeFile('.auth-dev/latest-link.txt',authOrigin()+(purpose==='reset'?'/reset-password':'/verify-email')+'#token='+token+'\n',{mode:0o600});await chmod('.auth-dev/latest-link.txt',0o600);console.log('Private link saved to .auth-dev/latest-link.txt. Treat it as a temporary password. No email was sent.')}
main().catch(e=>{console.error(e instanceof Error?e.message:'Development token command failed');process.exitCode=1})
