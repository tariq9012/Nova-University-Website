import {AdmissionListing} from '@/components/admissions'
import type {SearchParams} from '@/lib/academic-filters'
import {publicMetadata} from '@/lib/cms-details'
export const dynamic='force-dynamic'
export const metadata=publicMetadata('Admissions: requirements','Explore published admissions information.','/admissions/requirements')
export default function Page({searchParams}:{searchParams:Promise<SearchParams>}){return <AdmissionListing kind="requirements" searchParams={searchParams}/>}
