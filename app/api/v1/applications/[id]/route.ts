import {z} from 'zod'
import {withApi,json,parseParams} from '@/lib/server/api'
import {requireAuth,requireStudent} from '@/lib/server/auth'
import {getApplication,saveApplication} from '@/db/queries/applications'
import {applicationDraftInput} from '@/lib/auth-validation'
import {requireSameOrigin,readJson} from '@/lib/server/security'
export const dynamic='force-dynamic'
type Context={params:Promise<{id:string}>}
export const GET=withApi(async(_req:Request,{params}:Context)=>{await requireAuth();const id=parseParams(z.uuid(),(await params).id);return json({success:true,data:await getApplication(id)},{headers:{'Cache-Control':'no-store'}})})
export const PATCH=withApi(async(req:Request,{params}:Context)=>{await requireStudent();requireSameOrigin(req);const id=parseParams(z.uuid(),(await params).id);return json({success:true,data:await saveApplication(id,parseParams(applicationDraftInput,await readJson(req)))},{headers:{'Cache-Control':'no-store'}})})
