import {withApi,json,parseParams} from '@/lib/server/api'
import {requireAuth,publicIdentity} from '@/lib/server/auth'
import {getOwnProfile,updateOwnProfile} from '@/db/queries/accounts'
import {profileInput} from '@/lib/auth-validation'
import {requireSameOrigin,readJson} from '@/lib/server/security'
export const dynamic='force-dynamic'
export const GET=withApi(async()=>{const u=await requireAuth();return json({success:true,data:{user:publicIdentity(u),...await getOwnProfile()}},{headers:{'Cache-Control':'no-store'}})})
export const PATCH=withApi(async(req:Request)=>{await requireAuth();requireSameOrigin(req);await updateOwnProfile(parseParams(profileInput,await readJson(req)));return json({success:true,data:{message:'Profile saved.'}},{headers:{'Cache-Control':'no-store'}})})
