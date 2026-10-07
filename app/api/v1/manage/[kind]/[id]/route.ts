import {requireSameOrigin,readJson} from '@/lib/server/security'
import {NextRequest} from 'next/server'
import {z} from 'zod'
import {withApi,json,parseParams} from '@/lib/server/api'
import {requireCmsEditor} from '@/lib/server/cms-auth'
import {managementKind} from '@/lib/cms-management'
import {readManagedContent,saveManagedContent,archiveManagedContent} from '@/db/queries/cms-management'
export const dynamic='force-dynamic'
type Context={params:Promise<{kind:string;id:string}>}
async function routeParams(context:Context){await requireCmsEditor();const p=await context.params;return {kind:parseParams(managementKind,p.kind),id:parseParams(z.uuid(),p.id)}}
export const GET=withApi(async(_req:NextRequest,context:Context)=>{const p=await routeParams(context);return json({success:true,data:await readManagedContent(p.kind,p.id)},{headers:{'Cache-Control':'no-store'}})})
export const PUT=withApi(async(req:NextRequest,context:Context)=>{const p=await routeParams(context);requireSameOrigin(req);const input=await readJson(req);return json({success:true,data:await saveManagedContent(p.kind,input,p.id)},{headers:{'Cache-Control':'no-store'}})})
export const DELETE=withApi(async(_req:NextRequest,context:Context)=>{const p=await routeParams(context);requireSameOrigin(_req);return json({success:true,data:await archiveManagedContent(p.kind,p.id)},{headers:{'Cache-Control':'no-store'}})})
