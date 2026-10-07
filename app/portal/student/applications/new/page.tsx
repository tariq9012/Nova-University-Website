import {portalAuth} from '@/lib/server/portal-auth'
import {getPrograms} from '@/db/queries/academics'
import {getIntakes} from '@/db/queries/cms'
import {StartApplication} from '@/components/application-form'
import type {SearchParams} from '@/lib/academic-filters'
export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){await portalAuth('student');const params=await searchParams;const [p,i]=await Promise.all([getPrograms({offset:0,limit:10000}),getIntakes()]);return <><h1>Start your application</h1><p>Choose a program and intake. Existing applications will open for you to continue.</p><StartApplication programs={p.data.map(x=>({slug:x.slug,name:x.name}))} intakes={i} program={typeof params.program==='string'?params.program:''} intake={typeof params.intake==='string'?params.intake:''}/></>}
