import {AnnouncementDetail} from '@/components/cms-detail'
import {readAnnouncement,itemMetadata} from '@/lib/cms-details'
export const dynamic='force-dynamic'
type Props={params:Promise<{slug:string}>}
export async function generateMetadata({params}:Props){const {slug}=await params;const r=await readAnnouncement(slug);return itemMetadata(r,'/announcements/'+slug)}
export default async function Page({params}:Props){return <AnnouncementDetail slug={(await params).slug}/>}
