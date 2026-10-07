'use client'
export default function ErrorPage({reset}:{reset:()=>void}){return <main className="shell page-content"><h1>Information is temporarily unavailable</h1><p>Please try again.</p><button className="button dark" onClick={reset}>Try again</button></main>}
