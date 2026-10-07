import CmsListing from '@/components/cms-listing'
import type {SearchParams} from '@/lib/academic-filters'
import {publicMetadata} from '@/lib/cms-details'
export const dynamic='force-dynamic'
export const metadata=publicMetadata('News','Browse published news at Nova University.','/news')
export default function Page({searchParams}:{searchParams:Promise<SearchParams>}){return <CmsListing kind="news" searchParams={searchParams}/>}
