import {getNewsBySlug} from '@/db/queries/cms'
import {slugSchema,json,withApi,NotFoundError} from '@/lib/server/api'
export const dynamic='force-dynamic'
export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){return withApi(async()=>{const slug=(await params).slug;if(!slugSchema.safeParse(slug).success)throw new NotFoundError();const item=await getNewsBySlug(slug);if(!item)throw new NotFoundError();return json({success:true,data:item},{headers:{'Cache-Control':'no-store'}})})()}
