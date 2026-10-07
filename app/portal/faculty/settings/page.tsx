import {FacultyPage} from '@/components/faculty-portal'
export default function Page({searchParams}:{searchParams:Promise<Record<string,string|string[]|undefined>>}){return <FacultyPage area='settings' searchParams={searchParams}/>}
