import {EventDetail} from '@/components/cms-detail'
import {readEvent,itemMetadata} from '@/lib/cms-details'
export const dynamic='force-dynamic'
type Props={params:Promise<{slug:string}>}
export async function generateMetadata({params}:Props){const {slug}=await params;const r=await readEvent(slug);return itemMetadata(r?.item??null,'/events/'+slug)}
export default async function Page({params}:Props){return <EventDetail slug={(await params).slug}/>}
