import {z} from 'zod'
import {withApi,json,parseParams} from '@/lib/server/api'
import {requireStudent} from '@/lib/server/auth'
import {submitApplication} from '@/db/queries/applications'
import {requireSameOrigin,readJson} from '@/lib/server/security'
export const dynamic='force-dynamic'
export const POST=withApi(async(req:Request,{params}:{params:Promise<{id:string}>})=>{await requireStudent();requireSameOrigin(req);const id=parseParams(z.uuid(),(await params).id);parseParams(z.object({declaration:z.literal(true)}).strict(),await readJson(req));return json({success:true,data:await submitApplication(id)},{headers:{'Cache-Control':'no-store'}})})
