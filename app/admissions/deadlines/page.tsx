import {AdmissionListing} from '@/components/admissions'
import type {SearchParams} from '@/lib/academic-filters'
import {publicMetadata} from '@/lib/cms-details'
export const dynamic='force-dynamic'
export const metadata=publicMetadata('Admissions: deadlines','Explore published admissions information.','/admissions/deadlines')
export default function Page({searchParams}:{searchParams:Promise<SearchParams>}){return <AdmissionListing kind="deadlines" searchParams={searchParams}/>}
