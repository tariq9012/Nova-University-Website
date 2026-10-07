import {z} from 'zod'
import {withApi,json,parseParams} from '@/lib/server/api'
import {requireSameOrigin,readJson,rateLimit} from '@/lib/server/security'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {readCurriculum,changeCurriculum} from '@/db/queries/admin-curriculum'
export const dynamic='force-dynamic'
type Context={params:Promise<{programId:string}>}
export const GET=withApi(async(_r:Request,{params}:Context)=>json({success:true,data:await readCurriculum(parseParams(z.uuid(),(await params).programId))},{headers:{'Cache-Control':'no-store'}}))
export const POST=withApi(async(req:Request,{params}:Context)=>{const u=await requireAdminPermission('academics.manage');requireSameOrigin(req);await rateLimit('admin-write',u.id,120,60);return json({success:true,data:await changeCurriculum(parseParams(z.uuid(),(await params).programId),await readJson(req))},{headers:{'Cache-Control':'no-store'}})})
