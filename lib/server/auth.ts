import {requestScope} from './request-scope'
import {cache} from 'react'
import {cookies} from 'next/headers'
import {sql} from 'drizzle-orm'
import {db} from '@/db'
import {AppError} from './api'
import {tokenHash} from './passwords'
export type AuthUser={id:string;email:string;firstName:string|null;lastName:string|null;phone:string|null;status:string;emailVerifiedAt:string|null;lastLoginAt:string|null;createdAt:string;authVersion:number;roles:string[];sessionId:string}
export function authOrigin(){const u=new URL(process.env.AUTH_ORIGIN||process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000');if(process.env.NODE_ENV==='production'&&u.protocol!=='https:'&&!['localhost','127.0.0.1','[::1]'].includes(u.hostname))throw new Error('Production authentication requires HTTPS');return u.origin}
export function developmentAccountsAllowed(){return process.env.AUTH_ALLOW_DEV_ACCOUNTS==='true'&&['localhost','127.0.0.1','[::1]'].includes(new URL(authOrigin()).hostname)}
export const cookieName=()=>authOrigin().startsWith('https:')?'__Host-nova-session':'nova_session'
export const cookieOptions=()=>({httpOnly:true,secure:authOrigin().startsWith('https:'),sameSite:'lax' as const,path:'/'})
export async function sessionFromToken(token:string|undefined):Promise<AuthUser|null>{if(!token||!/^[a-f0-9]{64}$/.test(token))return null;const r=await db.execute(sql`select u.id,u.email,u.first_name as "firstName",u.last_name as "lastName",u.phone,u.status,u.email_verified_at as "emailVerifiedAt",u.last_login_at as "lastLoginAt",u.created_at as "createdAt",u.auth_version as "authVersion",s.id as "sessionId",coalesce((select json_agg(r.name) from user_roles ur join roles r on r.id=ur.role_id where ur.user_id=u.id),'[]'::json) as roles from auth_sessions s join users u on u.id=s.user_id where s.token_hash=${tokenHash(token)} and s.expires_at>now() and s.auth_version=u.auth_version and u.status='active' and (not u.is_development or ${developmentAccountsAllowed()}) limit 1`);return (r.rows[0] as AuthUser|undefined)??null}
const loadSession=async()=>sessionFromToken((await cookies()).get(cookieName())?.value)
export const getAuth=cache(async()=>{const scope=requestScope.getStore();if(!scope)return loadSession();scope.auth??=loadSession();return scope.auth})
export async function requireAuth(){const u=await getAuth();if(!u)throw new AppError('AUTHENTICATION_REQUIRED','Please sign in. Your session may have expired or your account may be unavailable.',401);return u}
export async function requireRole(...roles:string[]){const u=await requireAuth();if(!roles.some(r=>u.roles.includes(r)))throw new AppError('FORBIDDEN','Your account does not have access to this area.',403);return u}
export const requireStudent=()=>requireRole('student')
export const requireFaculty=()=>requireRole('faculty')
export async function requireAdmin(){const u=await requireRole('admin');requireVerified(u);return u}
export function requireVerified(u:AuthUser){if(!u.emailVerifiedAt)throw new AppError('EMAIL_VERIFICATION_REQUIRED','Verify your email before performing this action.',403)}
export function publicIdentity(u:AuthUser){return {id:u.id,email:u.email,firstName:u.firstName,lastName:u.lastName,phone:u.phone,status:u.status,emailVerified:!!u.emailVerifiedAt,roles:u.roles,createdAt:u.createdAt,lastLoginAt:u.lastLoginAt}}
