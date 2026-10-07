import {z} from 'zod'
import {withApi,json,parseParams,AppError} from '@/lib/server/api'
import {requireAuth,requireStudent} from '@/lib/server/auth'
import {applicationDocuments,getApplication} from '@/db/queries/applications'
import {requireSameOrigin} from '@/lib/server/security'
export const dynamic='force-dynamic'
export const GET=withApi(async(_req:Request,{params}:{params:Promise<{id:string}>})=>{await requireAuth();return json({success:true,data:await applicationDocuments(parseParams(z.uuid(),(await params).id))},{headers:{'Cache-Control':'no-store'}})})
export const POST=withApi(async(req:Request,{params}:{params:Promise<{id:string}>})=>{await requireStudent();requireSameOrigin(req);await getApplication(parseParams(z.uuid(),(await params).id));throw new AppError('DOCUMENT_STORAGE_UNAVAILABLE','Private document storage is not configured. No file has been uploaded.',503)})
