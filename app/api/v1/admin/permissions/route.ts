import {withApi,json} from '@/lib/server/api'
import {requireSameOrigin,readJson,rateLimit} from '@/lib/server/security'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {changePermission,listAdminOverrides} from '@/db/queries/admin-permissions'
export const dynamic='force-dynamic'
export const GET=withApi(async()=>json({success:true,data:await listAdminOverrides()},{headers:{'Cache-Control':'no-store'}}))
export const POST=withApi(async(req:Request)=>{const u=await requireAdminPermission('settings.manage');requireSameOrigin(req);await rateLimit('admin-permission',u.id,30,60);return json({success:true,data:await changePermission(await readJson(req))},{headers:{'Cache-Control':'no-store'}})})
