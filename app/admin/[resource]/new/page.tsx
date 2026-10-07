import {ResourceCreatePage} from '@/components/admin-resource-pages'
import {CmsEditPage} from '@/components/admin-cms'
import {isResourceKey} from '@/lib/admin/resources'
import {isCmsKind} from '@/lib/admin/cms'
import {notFound} from 'next/navigation'
import {ExamPage,AssignmentPage,SessionPage,InvoicePage} from '@/components/admin-operations'
export default async function Page({params,searchParams}:{params:Promise<{resource:string}>;searchParams:Promise<{section?:string}>}){const {resource}=await params
  if(resource==='exams')return <ExamPage/>
  if(resource==='assignments')return <AssignmentPage/>
  if(resource==='sessions')return <SessionPage section={(await searchParams).section}/>
  if(resource==='invoices')return <InvoicePage/>
  if(isResourceKey(resource))return <ResourceCreatePage resource={resource}/>
  if(isCmsKind(resource))return <CmsEditPage kind={resource}/>
  notFound()}
