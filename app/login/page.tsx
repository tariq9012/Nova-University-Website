import {AuthForm} from '@/components/auth-form'
import type {SearchParams} from '@/lib/academic-filters'
export const metadata={title:'Welcome back.',robots:{index:false,follow:false}}
export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){await searchParams;return <main className="auth-page shell"><section className="auth-intro"><p className="eyebrow">Nova University</p><h1>Welcome back.</h1><p>Sign in to your Nova University account.</p><p className="auth-note">Your university. Your next chapter.</p></section><section className="auth-panel" aria-label="Account access"><AuthForm mode={'login'}/></section></main>}
