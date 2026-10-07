import {getAnnouncements} from '@/db/queries/cms'
import {cmsFilters} from '@/lib/cms'
import {parseParams,collection,json,withApi} from '@/lib/server/api'
export const dynamic='force-dynamic'
export const GET=withApi(async(req:Request)=>{const p=parseParams(cmsFilters,Object.fromEntries(new URL(req.url).searchParams));const r=await getAnnouncements(p);return json(collection(r.data,p.page,p.pageSize,r.total),{headers:{'Cache-Control':'no-store'}})})
