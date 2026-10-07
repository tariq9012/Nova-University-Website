import {withApi,json} from '@/lib/server/api'
import {requireSameOrigin,readJson,rateLimit} from '@/lib/server/security'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {sendNotification} from '@/db/queries/admin-notifications'
export const dynamic='force-dynamic'
export const POST=withApi(async(req:Request)=>{const u=await requireAdminPermission('cms.manage');requireSameOrigin(req);await rateLimit('admin-notify',u.id,10,60);return json({success:true,data:await sendNotification(await readJson(req))},{status:201,headers:{'Cache-Control':'no-store'}})})
