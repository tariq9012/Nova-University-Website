import {getPrograms} from '@/db/queries/academics'
import {academicFilters,queryFilters} from '@/lib/academic-filters'
import {parseParams,collection,json,withApi} from '@/lib/server/api'
export const GET=withApi(async(req:Request)=>{const p=parseParams(academicFilters,Object.fromEntries(new URL(req.url).searchParams));const r=await getPrograms(queryFilters(p));return json(collection(r.data,p.page,p.pageSize,r.total))})
