import {audit} from '@/lib/server/security'
import {eq,desc,count} from 'drizzle-orm'
import {db} from '../index'
import {news,events,announcements,scholarships,cmsCategories} from '../cms-schema'
import {requireCmsEditor} from '@/lib/server/cms-auth'
import {parseParams,AppError,NotFoundError} from '@/lib/server/api'
import {newsWrite,eventWrite,announcementWrite,scholarshipWrite,type ManagementKind} from '@/lib/cms-management'
const tables={news,events,announcements,scholarships}
export async function listManagedContent(kind:ManagementKind,page:number,pageSize:number){await requireCmsEditor();const t=tables[kind];const [data,total]=await Promise.all([db.select().from(t).orderBy(desc(t.updatedAt)).limit(pageSize).offset((page-1)*pageSize),db.select({value:count()}).from(t)]);return {data,total:Number(total[0]?.value||0)}}
export async function readManagedContent(kind:ManagementKind,id:string){await requireCmsEditor();const t=tables[kind];const row=(await db.select().from(t).where(eq(t.id,id)).limit(1))[0];if(!row)throw new NotFoundError();return row}
/** Full replacement PUT: validation runs against the complete record, not an unsafe partial merge. */
export async function saveManagedContent(kind:ManagementKind,input:unknown,id?:string){await requireCmsEditor();try{
 if(kind!=='scholarships'){const schema=kind==='news'?newsWrite:kind==='events'?eventWrite:announcementWrite;const p=parseParams(schema,input);if(p.categoryId){const category=(await db.select().from(cmsCategories).where(eq(cmsCategories.id,p.categoryId)).limit(1))[0];if(category?.kind!==kind)throw new AppError('VALIDATION_ERROR','Category does not belong to this content type',400)}}
 let rows;
 if(kind==='news'){const v=parseParams(newsWrite,input);rows=id?await db.update(news).set({...v,updatedAt:new Date()}).where(eq(news.id,id)).returning():await db.insert(news).values(v).returning()}
 else if(kind==='events'){const v=parseParams(eventWrite,input);rows=id?await db.update(events).set({...v,updatedAt:new Date()}).where(eq(events.id,id)).returning():await db.insert(events).values(v).returning()}
 else if(kind==='announcements'){const v=parseParams(announcementWrite,input);rows=id?await db.update(announcements).set({...v,updatedAt:new Date()}).where(eq(announcements.id,id)).returning():await db.insert(announcements).values(v).returning()}
 else {const v=parseParams(scholarshipWrite,input);rows=id?await db.update(scholarships).set({...v,updatedAt:new Date()}).where(eq(scholarships.id,id)).returning():await db.insert(scholarships).values(v).returning()}
 if(!rows[0])throw new NotFoundError();await audit((await requireCmsEditor()).id,rows[0].status==='published'?'cms.published':'cms.saved',kind,rows[0].id,{status:String(rows[0].status),created:!id});return rows[0]
 }catch(e){const cause=e instanceof Error&&'cause' in e?e.cause:e;const code=cause&&typeof cause==='object'&&'code' in cause?cause.code:null;if(code==='23505')throw new AppError('CONFLICT','This slug is already in use',409);if(code==='23503'||code==='23514')throw new AppError('VALIDATION_ERROR','Invalid related record or field value',400);throw e}}
export async function archiveManagedContent(kind:ManagementKind,id:string){await requireCmsEditor();const t=tables[kind];const rows=await db.update(t).set({status:'archived',updatedAt:new Date()}).where(eq(t.id,id)).returning({id:t.id});if(!rows[0])throw new NotFoundError();await audit((await requireCmsEditor()).id,'cms.archived',kind,id);return rows[0]}
