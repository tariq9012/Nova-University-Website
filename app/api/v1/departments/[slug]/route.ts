import { getDepartmentBySlug } from "@/db/queries/academics"
import { json, NotFoundError, slugSchema, parseParams, withApi } from "@/lib/server/api"
export async function GET(_: Request,{params}:{params:Promise<{slug:string}>}){return withApi(async()=>{const slug=parseParams(slugSchema,(await params).slug); const data=await getDepartmentBySlug(slug); if(!data) throw new NotFoundError("Department not found"); return json({success:true,data})})()}
