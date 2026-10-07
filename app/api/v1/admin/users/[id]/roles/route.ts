import {z} from 'zod'
import {withApi,json,parseParams} from '@/lib/server/api'
import {requireSameOrigin,readJson,rateLimit} from '@/lib/server/security'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {changeUserRole} from '@/db/queries/admin-roles'
export const dynamic='force-dynamic'
export const POST=withApi(async(req:Request,{params}:{params:Promise<{id:string}>})=>{const u=await requireAdminPermission('users.manage');requireSameOrigin(req);await rateLimit('admin-role',u.id,20,60);return json({success:true,data:await changeUserRole(parseParams(z.uuid(),(await params).id),await readJson(req))},{headers:{'Cache-Control':'no-store'}})})
