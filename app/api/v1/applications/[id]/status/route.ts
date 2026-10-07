import {z} from 'zod'
import {withApi,json,parseParams} from '@/lib/server/api'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {changeApplicationStatus} from '@/db/queries/applications'
import {requireSameOrigin,readJson} from '@/lib/server/security'
export const dynamic='force-dynamic'
export const POST=withApi(async(req:Request,{params}:{params:Promise<{id:string}>})=>{await requireAdminPermission('applications.manage');requireSameOrigin(req);const id=parseParams(z.uuid(),(await params).id);const p=parseParams(z.object({status:z.enum(['under_review','additional_information_required','accepted','rejected','withdrawn']),note:z.string().trim().max(2000).default('')}).strict().refine(v=>v.status!=='rejected'&&v.status!=='withdrawn'||v.note.length>=3,{message:'A reason is required to reject or withdraw an application',path:['note']}),await readJson(req));return json({success:true,data:await changeApplicationStatus(id,p.status,p.note)},{headers:{'Cache-Control':'no-store'}})})
