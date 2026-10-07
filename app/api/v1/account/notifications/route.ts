import {z} from 'zod'
import {withApi,json,parseParams,collection,paginationSchema} from '@/lib/server/api'
import {requireAuth} from '@/lib/server/auth'
import {getOwnNotifications,readNotification} from '@/db/queries/accounts'
import {requireSameOrigin,readJson} from '@/lib/server/security'
export const dynamic='force-dynamic'
export const GET=withApi(async(req:Request)=>{await requireAuth();const p=parseParams(paginationSchema,Object.fromEntries(new URL(req.url).searchParams));const r=await getOwnNotifications(p.page,p.pageSize);return json(collection(r.data,p.page,p.pageSize,r.total),{headers:{'Cache-Control':'no-store'}})})
export const PATCH=withApi(async(req:Request)=>{await requireAuth();requireSameOrigin(req);const p=parseParams(z.object({id:z.uuid()}).strict(),await readJson(req));return json({success:true,data:await readNotification(p.id)},{headers:{'Cache-Control':'no-store'}})})
