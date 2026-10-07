'use client'
export default function ErrorPage({reset}:{reset:()=>void}){return <section><h1>Unable to load your account</h1><p>Please try again.</p><button className="button dark" onClick={reset}>Retry</button></section>}
