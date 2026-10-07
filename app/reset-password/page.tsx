import {AuthForm} from '@/components/auth-form'
import type {SearchParams} from '@/lib/academic-filters'
export const metadata={title:'Choose a new password.',robots:{index:false,follow:false}}
export default async function Page({searchParams}:{searchParams:Promise<SearchParams>}){await searchParams;return <main className="auth-page shell"><section className="auth-intro"><p className="eyebrow">Nova University</p><h1>Choose a new password.</h1><p>Use the recovery code from your private reset link.</p><p className="auth-note">Your university. Your next chapter.</p></section><section className="auth-panel" aria-label="Account access"><AuthForm mode={'reset-password'}/></section></main>}
