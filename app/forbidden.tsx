import Link from 'next/link'
export default function Forbidden(){return <main className="shell page-content"><p className="eyebrow">403 · Access denied</p><h1>This area belongs to another role.</h1><p>Your account does not have permission to view this page.</p><Link className="button dark" href="/portal">Return to your portal</Link></main>}
