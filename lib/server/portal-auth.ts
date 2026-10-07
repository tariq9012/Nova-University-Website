import {forbidden,redirect} from 'next/navigation'
import {getAuth} from './auth'
export async function portalAuth(role:string){const u=await getAuth();if(!u)redirect('/login');if(!u.roles.includes(role))forbidden();return u}
