import {cache} from 'react'
import type {Metadata} from 'next'
import {getProgramBySlug,getCourseBySlug,getSchoolBySlug,getDepartmentBySlug,getFacultyBySlug} from '@/db/queries/academics'
const valid=(slug:string)=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)&&slug.length<=180
export const programDetail=cache((slug:string)=>valid(slug)?getProgramBySlug(slug):Promise.resolve(null))
export const courseDetail=cache((slug:string)=>valid(slug)?getCourseBySlug(slug):Promise.resolve(null))
export const schoolDetail=cache((slug:string)=>valid(slug)?getSchoolBySlug(slug):Promise.resolve(null))
export const departmentDetail=cache((slug:string)=>valid(slug)?getDepartmentBySlug(slug):Promise.resolve(null))
export const facultyDetail=cache((slug:string)=>valid(slug)?getFacultyBySlug(slug):Promise.resolve(null))
export function academicMetadata(title:string,description:string|null|undefined,path:string):Metadata{return {title,description:description?.slice(0,160)||`${title} at Nova University.`,alternates:{canonical:path},openGraph:{title,description:description?.slice(0,160)||`${title} at Nova University.`,url:path},twitter:{card:'summary',title,description:description?.slice(0,160)||`${title} at Nova University.`}}}
