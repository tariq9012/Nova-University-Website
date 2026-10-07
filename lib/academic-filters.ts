import {z} from 'zod'
const optional = <T extends z.ZodType>(schema:T) => z.preprocess(value=>value===''?undefined:value,schema.optional())
const text=optional(z.string().trim().max(100))
const slug=optional(z.string().max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/))
const date=optional(z.iso.date())
export const academicFilters=z.object({
 page:z.coerce.number().int().min(1).max(10000).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20),
 search:text,school:slug,department:slug,campus:slug,
 degreeLevel:optional(z.enum(['undergraduate','graduate','doctoral'])),studyMode:optional(z.enum(['full_time','part_time'])),
 duration:optional(z.coerce.number().int().min(1).max(20)),courseLevel:optional(z.coerce.number().int().min(1).max(9)),creditHours:optional(z.coerce.number().int().min(1).max(30)),courseType:text,
 position:text,facultyType:text,researchArea:slug,
 eventType:text,semester:text,year:optional(z.coerce.number().int().min(1900).max(2200)),from:date,to:date,
 category:z.enum(['all','programs','courses','schools','departments','faculty','news','events']).default('all'),
 sort:z.enum(['name','-name','code','-code','title','-title','duration','degreeLevel','date','-date']).default('name'),
}).refine(p=>!p.from||!p.to||p.from<=p.to,{message:'Start date must not follow end date',path:['to']})
export type AcademicFilters=z.infer<typeof academicFilters>
export type SearchParams=Record<string,string|string[]|undefined>
export function filterInput(params:SearchParams){return {...params,search:params.search??params.q}}
export function queryFilters(p:AcademicFilters){return {...p,offset:(p.page-1)*p.pageSize,limit:p.pageSize,order:p.sort.startsWith('-')?'desc' as const:'asc' as const}}
