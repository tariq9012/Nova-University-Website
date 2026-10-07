import {ResourceEditPage} from '@/components/admin-resource-pages'
import {CmsEditPage} from '@/components/admin-cms'
import {isResourceKey} from '@/lib/admin/resources'
import {isCmsKind} from '@/lib/admin/cms'
import {notFound} from 'next/navigation'
import {ExamPage,AssignmentPage,SessionPage,InvoicePage,EnrollmentPage,AttendancePage} from '@/components/admin-operations'
export default async function Page({params,searchParams}:{params:Promise<{resource:string;id:string}>;searchParams:Promise<{session?:string}>}){const {resource,id}=await params
  if(resource==='exams')return <ExamPage id={id}/>
  if(resource==='assignments')return <AssignmentPage id={id}/>
  if(resource==='sessions')return <SessionPage id={id}/>
  if(resource==='invoices')return <InvoicePage id={id}/>
  if(resource==='enrollments')return <EnrollmentPage id={id}/>
  if(resource==='attendance')return <AttendancePage id={id} session={(await searchParams).session}/>
  if(isResourceKey(resource))return <ResourceEditPage resource={resource} id={id}/>
  if(isCmsKind(resource))return <CmsEditPage kind={resource} id={id}/>
  notFound()}
