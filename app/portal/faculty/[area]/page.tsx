import {FacultyPage} from '@/components/faculty-portal'
export default async function Page({params,searchParams}:{params:Promise<{area:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const {area}=await params;return <FacultyPage area={area} searchParams={searchParams}/>}
