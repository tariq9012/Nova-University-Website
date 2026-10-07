import {withApi,json,parseParams,collection} from '@/lib/server/api'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {listUsers} from '@/db/queries/accounts'
import {userListInput} from '@/lib/auth-validation'
export const dynamic='force-dynamic'
export const GET=withApi(async(req:Request)=>{await requireAdminPermission('users.view');const p=parseParams(userListInput,Object.fromEntries(new URL(req.url).searchParams));const r=await listUsers(p);return json(collection(r.data,p.page,p.pageSize,r.total),{headers:{'Cache-Control':'no-store'}})})
