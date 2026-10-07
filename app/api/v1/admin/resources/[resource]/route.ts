import {NextRequest} from 'next/server'
import {withApi,json,parseParams,collection} from '@/lib/server/api'
import {requireSameOrigin,readJson,rateLimit} from '@/lib/server/security'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {listQuery} from '@/lib/admin/resources'
import {listResource,saveResource,resourceOf} from '@/db/queries/admin-resources'
export const dynamic='force-dynamic'
type Context={params:Promise<{resource:string}>}
const headers={'Cache-Control':'no-store'}
export const GET=withApi(async(req:NextRequest,{params}:Context)=>{const key=(await params).resource;const r=resourceOf(key);await requireAdminPermission(r.view);const q=parseParams(listQuery,Object.fromEntries(req.nextUrl.searchParams));const res=await listResource(key,q);return json(collection(res.data,q.page,q.pageSize,res.total),{headers})})
export const POST=withApi(async(req:NextRequest,{params}:Context)=>{const key=(await params).resource;const r=resourceOf(key);const u=await requireAdminPermission(r.manage);requireSameOrigin(req);await rateLimit('admin-write',u.id,120,60);return json({success:true,data:await saveResource(key,await readJson(req))},{status:201,headers})})
