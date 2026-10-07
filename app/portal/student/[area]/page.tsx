import {StudentPage} from '@/components/student-portal'
export default async function Page({params,searchParams}:{params:Promise<{area:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){return <StudentPage area={(await params).area} searchParams={searchParams}/>}
