import { getCourseBySlug } from "@/db/queries/academics"
import { json, NotFoundError, parseParams, slugSchema, withApi } from "@/lib/server/api"
export async function GET(_:Request,{params}:{params:Promise<{slug:string}>}){return withApi(async()=>{const slug=parseParams(slugSchema,(await params).slug);const data=await getCourseBySlug(slug);if(!data)throw new NotFoundError('Course not found');return json({success:true,data})})()}
