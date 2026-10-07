import {z} from 'zod'
import {withApi,json,parseParams} from '@/lib/server/api'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {changeUserStatus} from '@/db/queries/accounts'
import {requireSameOrigin,readJson,rateLimit} from '@/lib/server/security'
export const dynamic='force-dynamic'
export const PATCH=withApi(async(req:Request,{params}:{params:Promise<{id:string}>})=>{const actor=await requireAdminPermission('users.manage');requireSameOrigin(req);await rateLimit('admin-write',actor.id,60,60);const id=parseParams(z.uuid(),(await params).id);const p=parseParams(z.object({status:z.enum(['active','inactive','suspended']),reason:z.string().trim().min(3).max(500).optional()}).strict().refine(v=>v.status==='active'||Boolean(v.reason),{message:'A reason is required to deactivate or suspend an account',path:['reason']}),await readJson(req));return json({success:true,data:await changeUserStatus(id,p.status,p.reason)},{headers:{'Cache-Control':'no-store'}})})
