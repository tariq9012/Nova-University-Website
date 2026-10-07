'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, Search, X, ArrowUpRight } from 'lucide-react'

const links = [['About','/about'],['Academics','/academics'],['Admissions','/admissions'],['Research','/research'],['Campus Life','/campus-life'],['News & Events','/news']]
export function UniversityHeader() {
  const [open, setOpen] = useState(false)
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close) }, [])
  return <>
    <div className="utility"><div className="shell utility-inner"><span>Nova University</span><div className="utility-links"><Link href="/search"><Search size={14}/> Search</Link><Link href="/contact">Give</Link><Link href="/portal">Portal</Link><Link href="/international">International</Link><Link href="/campus-life/library">Library</Link></div></div></div>
    <header className="site-header"><div className="shell header-inner">
      <Link href="/" className="wordmark"><span className="crest">N</span><span>Nova <em>University</em></span></Link>
      <nav className="main-nav" aria-label="Main navigation">{links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
      <Link className="apply-button" href="/admissions">Apply Now <ArrowUpRight size={16}/></Link>
      <button className="menu-button" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'}>{open ? <X/> : <Menu/>}</button>
    </div></header>
    {open && <div className="mobile-menu" id="mobile-navigation"><nav aria-label="Mobile navigation">{links.map(([label, href]) => <Link onClick={() => setOpen(false)} key={href} href={href}>{label}<ArrowUpRight size={15}/></Link>)}</nav><Link className="apply-button" onClick={() => setOpen(false)} href="/admissions">Apply to Nova</Link></div>}
  </>
}
