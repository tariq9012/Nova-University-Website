import {getCmsSitemap} from '@/db/queries/cms'
import type {MetadataRoute} from 'next'
import {db} from '@/db'
import {schools,departments,programs,courses,facultyProfiles} from '@/db/schema'
import {and,eq} from 'drizzle-orm'
import {publicRoutes} from '@/lib/public-routes'
export const dynamic='force-dynamic'
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const base=process.env.NEXT_PUBLIC_SITE_URL||'http://localhost:3000';const paths:string[]=[...publicRoutes];try{const rows=await Promise.all([
 db.select({slug:schools.slug}).from(schools).where(eq(schools.isActive,true)),
 db.select({slug:departments.slug}).from(departments).innerJoin(schools,eq(departments.schoolId,schools.id)).where(and(eq(departments.isActive,true),eq(schools.isActive,true))),
 db.select({slug:programs.slug}).from(programs).innerJoin(departments,eq(programs.departmentId,departments.id)).innerJoin(schools,eq(programs.schoolId,schools.id)).where(and(eq(programs.isActive,true),eq(departments.isActive,true),eq(schools.isActive,true))),
 db.select({slug:courses.slug}).from(courses).innerJoin(departments,eq(courses.departmentId,departments.id)).innerJoin(schools,eq(departments.schoolId,schools.id)).where(and(eq(courses.isActive,true),eq(departments.isActive,true),eq(schools.isActive,true))),
 db.select({slug:facultyProfiles.slug}).from(facultyProfiles).innerJoin(departments,eq(facultyProfiles.departmentId,departments.id)).innerJoin(schools,eq(facultyProfiles.schoolId,schools.id)).where(and(eq(facultyProfiles.isActive,true),eq(departments.isActive,true),eq(schools.isActive,true)))
 ]);rows.forEach((list,i)=>list.forEach(x=>paths.push(`${['/academics/schools','/academics/departments','/academics/programs','/academics/courses','/faculty'][i]}/${x.slug}`)))}catch{/* Static public routes remain available during a database outage. */}try{const cms=await getCmsSitemap();cms.forEach(x=>paths.push(x.path))}catch{}return [...new Set(paths)].map(path=>({url:new URL(path,base).href}))}
