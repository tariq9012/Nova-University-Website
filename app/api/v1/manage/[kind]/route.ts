import {requireSameOrigin,readJson} from '@/lib/server/security'
import {NextRequest} from 'next/server'
import {withApi,json,parseParams,collection,paginationSchema} from '@/lib/server/api'
import {requireCmsEditor} from '@/lib/server/cms-auth'
import {managementKind} from '@/lib/cms-management'
import {listManagedContent,saveManagedContent} from '@/db/queries/cms-management'
export const dynamic='force-dynamic'
type Context={params:Promise<{kind:string}>}
export const GET=withApi(async(req:NextRequest,{params}:Context)=>{await requireCmsEditor();if(req.method!=='GET')requireSameOrigin(req);const kind=parseParams(managementKind,(await params).kind);const p=parseParams(paginationSchema,Object.fromEntries(req.nextUrl.searchParams));const r=await listManagedContent(kind,p.page,p.pageSize);return json(collection(r.data,p.page,p.pageSize,r.total),{headers:{'Cache-Control':'no-store'}})})
export const POST=withApi(async(req:NextRequest,{params}:Context)=>{await requireCmsEditor();if(req.method!=='GET')requireSameOrigin(req);const kind=parseParams(managementKind,(await params).kind);const input=await readJson(req);return json({success:true,data:await saveManagedContent(kind,input)},{status:201,headers:{'Cache-Control':'no-store'}})})
