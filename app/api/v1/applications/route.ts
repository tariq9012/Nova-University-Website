import {withApi,json,parseParams,collection,paginationSchema} from '@/lib/server/api'
import {requireStudent} from '@/lib/server/auth'
import {listApplications,startApplication} from '@/db/queries/applications'
import {newApplicationInput} from '@/lib/auth-validation'
import {requireSameOrigin,readJson} from '@/lib/server/security'
export const dynamic='force-dynamic'
export const GET=withApi(async(req:Request)=>{await requireStudent();const p=parseParams(paginationSchema,Object.fromEntries(new URL(req.url).searchParams));const r=await listApplications(p.page,p.pageSize);return json(collection(r.data,p.page,p.pageSize,r.total),{headers:{'Cache-Control':'no-store'}})})
export const POST=withApi(async(req:Request)=>{await requireStudent();requireSameOrigin(req);return json({success:true,data:await startApplication(parseParams(newApplicationInput,await readJson(req)))},{status:201,headers:{'Cache-Control':'no-store'}})})
