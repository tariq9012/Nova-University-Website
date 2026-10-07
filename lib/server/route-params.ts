import { paginationSchema, parseParams, searchSchema, sortSchema } from "./api"
export async function listParams(searchParams: Promise<URLSearchParams>) { const sp=await searchParams; return parseParams(paginationSchema.extend({ search: searchSchema, sort: sortSchema }), { page: sp.get("page") ?? undefined, pageSize: sp.get("pageSize") ?? undefined, search: sp.get("search") ?? undefined, sort: sp.get("sort") ?? undefined }) }
export function offset(page:number,pageSize:number){return (page-1)*pageSize}
