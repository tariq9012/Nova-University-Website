import {cache} from 'react'
import type {Metadata} from 'next'
import {getNewsBySlug,getEventBySlug,getAnnouncementBySlug,getScholarshipBySlug,getAdmissionPage} from '@/db/queries/cms'
import {slugSchema} from './server/api'
import {siteUrl} from './cms'
export const readNews=cache(async(slug:string)=>slugSchema.safeParse(slug).success?getNewsBySlug(slug):null)
export const readEvent=cache(async(slug:string)=>slugSchema.safeParse(slug).success?getEventBySlug(slug):null)
export const readAnnouncement=cache(async(slug:string)=>slugSchema.safeParse(slug).success?getAnnouncementBySlug(slug):null)
export const readScholarship=cache(async(slug:string)=>slugSchema.safeParse(slug).success?getScholarshipBySlug(slug):null)
export const readAdmission=cache(getAdmissionPage)
export function publicMetadata(title:string,description:string,path:string):Metadata{return {title,description,alternates:{canonical:siteUrl(path)},openGraph:{title,description,url:siteUrl(path),type:'website'}}}
export function itemMetadata(item:{title:string;seoTitle:string|null;seoDescription:string|null;isSample:boolean}|null,path:string,description?:string|null):Metadata{if(!item)return {title:'Information not found',robots:{index:false,follow:false}};return publicMetadata(item.seoTitle||item.title,(item.isSample?'Development sample. ':'')+(item.seoDescription||description||item.title),path)}
