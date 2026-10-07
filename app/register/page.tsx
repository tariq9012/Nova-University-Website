import {AuthForm} from '@/components/auth-form'
import type {SearchParams} from '@/lib/academic-filters'
export const metadata={title:'Start your Nova journey.',robots:{index:false,follow:false}}
export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){await searchParams;return <main className="auth-page shell"><section className="auth-intro"><p className="eyebrow">Nova University</p><h1>Start your Nova journey.</h1><p>Create a student account to prepare and submit an admission application.</p><p className="auth-note">Your university. Your next chapter.</p></section><section className="auth-panel" aria-label="Account access"><AuthForm mode={'register'}/></section></main>}
