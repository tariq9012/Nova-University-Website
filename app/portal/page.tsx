import {redirect} from 'next/navigation'
import {getAuth} from '@/lib/server/auth'
import {roleHome} from '@/lib/auth-validation'
export const dynamic='force-dynamic'
export const metadata={title:'University portal',robots:{index:false,follow:false}}
export default async function Page(){const u=await getAuth();redirect(u?roleHome(u.roles):'/login')}
