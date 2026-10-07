import {ScholarshipDetail} from '@/components/cms-detail'
import {readScholarship,itemMetadata} from '@/lib/cms-details'
export const dynamic='force-dynamic'
type Props={params:Promise<{slug:string}>}
export async function generateMetadata({params}:Props){const {slug}=await params;const r=await readScholarship(slug);return itemMetadata(r,'/admissions/scholarships/'+slug)}
export default async function Page({params}:Props){return <ScholarshipDetail slug={(await params).slug}/>}
