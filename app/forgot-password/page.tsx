import {AuthForm} from '@/components/auth-form'
import type {SearchParams} from '@/lib/academic-filters'
export const metadata={title:'Recover your account.',robots:{index:false,follow:false}}
export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){await searchParams;return <main className="auth-page shell"><section className="auth-intro"><p className="eyebrow">Nova University</p><h1>Recover your account.</h1><p>Request a secure link to set a new password.</p><p className="auth-note">Your university. Your next chapter.</p></section><section className="auth-panel" aria-label="Account access"><AuthForm mode={'forgot-password'}/></section></main>}
