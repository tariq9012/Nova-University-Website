import {StudentPage} from '@/components/student-portal'
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <StudentPage area='dashboard' searchParams={searchParams}/> }
