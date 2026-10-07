 'use client'
export default function ErrorPage({reset}:{error:Error & {digest?:string};reset:()=>void}){return <main className="shell page-content" role="alert"><h1>We couldn’t load this page.</h1><p>Please try again in a moment.</p><button className="button dark" onClick={reset}>Try again</button></main>}
