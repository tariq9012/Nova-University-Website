import {ApplicationEntry} from '@/components/admissions'
import type {SearchParams} from '@/lib/academic-filters'
import {publicMetadata} from '@/lib/cms-details'
export const dynamic='force-dynamic'
export const metadata=publicMetadata('Admissions: apply','Explore published admissions information.','/admissions/apply')
export default function Page({searchParams}:{searchParams:Promise<SearchParams>}){return <ApplicationEntry searchParams={searchParams}/>}
