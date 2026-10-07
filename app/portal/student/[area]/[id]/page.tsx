import {StudentDetailPage} from '@/components/student-portal'
export default async function Page({params}:{params:Promise<{area:string;id:string}>}){return <StudentDetailPage {...await params}/>}
