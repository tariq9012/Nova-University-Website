import {ResourceListPage} from '@/components/admin-resource-pages'
import {AdminListPage} from '@/components/admin-list-page'
import {CmsListPage} from '@/components/admin-cms'
import {isResourceKey} from '@/lib/admin/resources'
import {isListKey} from '@/db/queries/admin-lists'
import {isCmsKind} from '@/lib/admin/cms'
import {notFound} from 'next/navigation'
export default async function Page({params,searchParams}:{params:Promise<{resource:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){const {resource}=await params
  if(isResourceKey(resource))return <ResourceListPage resource={resource} searchParams={searchParams}/>
  if(isListKey(resource))return <AdminListPage list={resource} searchParams={searchParams}/>
  if(isCmsKind(resource))return <CmsListPage kind={resource} searchParams={searchParams}/>
  notFound()}
