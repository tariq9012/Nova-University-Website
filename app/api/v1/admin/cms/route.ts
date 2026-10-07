import {withApi,json} from '@/lib/server/api'
import {requireSameOrigin,readJson,rateLimit} from '@/lib/server/security'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {bulkCms} from '@/db/queries/admin-cms'
export const dynamic='force-dynamic'
/** Bulk publish/archive with per-record results. No bulk deletion exists. */
export const POST=withApi(async(req:Request)=>{const u=await requireAdminPermission('cms.manage');requireSameOrigin(req);await rateLimit('admin-bulk',u.id,20,60);return json({success:true,data:await bulkCms(await readJson(req))},{headers:{'Cache-Control':'no-store'}})})
