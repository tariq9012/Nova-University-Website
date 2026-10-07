import {z} from 'zod'
import {withApi,json,parseParams} from '@/lib/server/api'
import {requireSameOrigin,readJson,rateLimit} from '@/lib/server/security'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {correctGrade} from '@/db/queries/admin-grades'
export const dynamic='force-dynamic'
/** POST = audited correction of a published final grade. */
export const POST=withApi(async(req:Request,{params}:{params:Promise<{id:string}>})=>{const u=await requireAdminPermission('grades.manage');requireSameOrigin(req);await rateLimit('admin-grade',u.id,30,60);return json({success:true,data:await correctGrade(parseParams(z.uuid(),(await params).id),await readJson(req))},{headers:{'Cache-Control':'no-store'}})})
