import {NextRequest} from 'next/server'
import {z} from 'zod'
import {withApi,json,parseParams} from '@/lib/server/api'
import {requireSameOrigin,readJson,rateLimit} from '@/lib/server/security'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {readResource,saveResource,archiveResource,resourceOf} from '@/db/queries/admin-resources'
export const dynamic='force-dynamic'
type Context={params:Promise<{resource:string;id:string}>}
const headers={'Cache-Control':'no-store'}
async function scope(ctx:Context,write:boolean){const p=await ctx.params;const r=resourceOf(p.resource);const u=await requireAdminPermission(write?r.manage:r.view);return {key:p.resource,id:parseParams(z.uuid(),p.id),u}}
export const GET=withApi(async(_req:NextRequest,ctx:Context)=>{const s=await scope(ctx,false);return json({success:true,data:await readResource(s.key,s.id)},{headers})})
/** Full replacement update: the whole record is validated. */
export const PUT=withApi(async(req:NextRequest,ctx:Context)=>{const s=await scope(ctx,true);requireSameOrigin(req);await rateLimit('admin-write',s.u.id,120,60);return json({success:true,data:await saveResource(s.key,await readJson(req),s.id)},{headers})})
/** POST = archive or restore (never a hard delete). Body: {reason, restore?}. */
export const POST=withApi(async(req:NextRequest,ctx:Context)=>{const s=await scope(ctx,true);requireSameOrigin(req);await rateLimit('admin-write',s.u.id,120,60);return json({success:true,data:await archiveResource(s.key,s.id,await readJson(req))},{headers})})
