import {NewsDetail} from '@/components/cms-detail'
import {readNews,itemMetadata} from '@/lib/cms-details'
export const dynamic='force-dynamic'
type Props={params:Promise<{slug:string}>}
export async function generateMetadata({params}:Props){const {slug}=await params;const r=await readNews(slug);return itemMetadata(r?.item??null,'/news/'+slug)}
export default async function Page({params}:Props){return <NewsDetail slug={(await params).slug}/>}
