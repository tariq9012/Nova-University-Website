import {tokenHash} from '@/lib/server/passwords'
import {cookies} from 'next/headers'
import {z} from 'zod'
import {withApi,json,parseParams,NotFoundError} from '@/lib/server/api'
import {requireAuth,publicIdentity,cookieName,cookieOptions,sessionFromToken} from '@/lib/server/auth'
import {register,login,logout,requestEmail,resetPassword,verifyEmail,changePassword} from '@/lib/server/auth-service'
import {requireSameOrigin,readJson,authRateLimit} from '@/lib/server/security'
import {registrationInput,loginInput,emailInput,resetInput,passwordChangeInput,roleHome} from '@/lib/auth-validation'
export const dynamic='force-dynamic'
export const runtime='nodejs'
export const POST=withApi(async(req:Request,{params}:{params:Promise<{action:string}>})=>{requireSameOrigin(req);const {action}=await params;const response=(data:unknown,status=200)=>json({success:true,data},{status,headers:{'Cache-Control':'no-store'}})
 if(action==='logout'){await logout((await cookies()).get(cookieName())?.value);(await cookies()).set(cookieName(),'',{...cookieOptions(),maxAge:0});return response({message:'Signed out.'})}
 const input=await readJson(req)
 if(action==='register'){const p=parseParams(registrationInput,input);await register(p);return response({message:'Registration request processed. Sign in if your account is ready, or use password recovery for an existing account. Email verification is required before submitting applications.'},202)}
 if(action==='login'){const p=parseParams(loginInput,input);const s=await login(p);const u=await sessionFromToken(s.token);if(!u)throw new NotFoundError();(await cookies()).set(cookieName(),s.token,{...cookieOptions(),...(p.remember?{maxAge:s.lifetime}:{})});return response({user:publicIdentity(u),redirect:roleHome(u.roles)})}
 if(action==='forgot-password'||action==='request-verification'){const p=parseParams(z.object({email:emailInput}).strict(),input);await requestEmail(p.email,action==='forgot-password'?'reset':'verify');return response({message:'If the account is eligible, an email has been requested. Check your inbox.'},202)}
 if(action==='reset-password'){const p=parseParams(resetInput,input);await authRateLimit('reset',tokenHash(p.token));await resetPassword(p.token,p.password);(await cookies()).set(cookieName(),'',{...cookieOptions(),maxAge:0});return response({message:'Password reset. Sign in with your new password.'})}
 if(action==='verify-email'){const p=parseParams(z.object({token:z.string().regex(/^[a-f0-9]{64}$/)}).strict(),input);await authRateLimit('verify',tokenHash(p.token));await verifyEmail(p.token);return response({message:'Email verified. You can now submit applications.'})}
 if(action==='change-password'){const u=await requireAuth();const p=parseParams(passwordChangeInput,input);await changePassword(u,p.currentPassword,p.password);(await cookies()).set(cookieName(),'',{...cookieOptions(),maxAge:0});return response({message:'Password changed. All sessions were revoked. Sign in again.'})}
 throw new NotFoundError()
})
export const GET=withApi(async(_req:Request,{params}:{params:Promise<{action:string}>})=>{if((await params).action!=='session')throw new NotFoundError();return json({success:true,data:publicIdentity(await requireAuth())},{headers:{'Cache-Control':'no-store'}})})
