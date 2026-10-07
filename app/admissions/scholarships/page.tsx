import CmsListing from '@/components/cms-listing'
import type {SearchParams} from '@/lib/academic-filters'
import {publicMetadata} from '@/lib/cms-details'
export const dynamic='force-dynamic'
export const metadata=publicMetadata('Scholarships','Browse published scholarships at Nova University.','/admissions/scholarships')
export default function Page({searchParams}:{searchParams:Promise<SearchParams>}){return <CmsListing kind="scholarships" searchParams={searchParams}/>}
