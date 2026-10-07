import type { Metadata, Viewport } from 'next'
import './globals.css'
import { UniversityHeader } from '@/components/university-header'
import { UniversityFooter } from '@/components/university-footer'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  icons: { icon: '/icon.svg' },
  title: { default: 'Nova University', template: '%s | Nova University' },
  description: 'Nova University — Knowledge. Discovery. Impact.',
  openGraph: { title: 'Nova University', description: 'A university for the curious, the courageous, and the changemakers.', type: 'website' },
}
export const viewport: Viewport = { colorScheme: 'light', themeColor: '#071d36', userScalable: true }

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><a className="skip-link" href="#main-content">Skip to content</a><UniversityHeader /><div id="main-content" tabIndex={-1}>{children}</div><UniversityFooter /></body></html>
}
