import {FacultyDetailPage} from '@/components/faculty-portal'
export default async function Page({params}:{params:Promise<{area:string;id:string}>}){return <FacultyDetailPage {...await params}/>}
