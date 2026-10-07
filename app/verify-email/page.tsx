import {AuthForm} from '@/components/auth-form'
import type {SearchParams} from '@/lib/academic-filters'
export const metadata={title:'Verify your email.',robots:{index:false,follow:false}}
export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){const p=await searchParams;return <main className="auth-page shell"><section className="auth-intro"><p className="eyebrow">Nova University</p><h1>Verify your email.</h1><p>Confirm the email address associated with your account.</p><p className="auth-note">Your university. Your next chapter.</p></section><section className="auth-panel" aria-label="Account access"><AuthForm mode={p.request==='1'?'request-verification':'verify-email'}/></section></main>}
