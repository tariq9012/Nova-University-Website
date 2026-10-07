import {searchAcademics} from '@/db/queries/academics'
import {academicFilters,queryFilters} from '@/lib/academic-filters'
import {parseParams,collection,json,withApi} from '@/lib/server/api'
export const GET=withApi(async(req:Request)=>{const sp=new URL(req.url).searchParams;const p=parseParams(academicFilters,{...Object.fromEntries(sp),search:sp.get('search')??sp.get('q')??undefined});const r=await searchAcademics(queryFilters(p));return json(collection(r.data,p.page,p.pageSize,r.total))})
