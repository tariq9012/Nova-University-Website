import {AcademicListing} from '@/components/academic-listing'
import type {SearchParams} from '@/lib/academic-filters'
export const dynamic='force-dynamic'
export const metadata={title:'Programs',description:'Explore Nova University academic information.'}
export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){return <AcademicListing kind="programs" params={await searchParams}/>}
