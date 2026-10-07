/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {authInterrupts: true},
  async headers(){return [{source:'/:path*',headers:[...((process.env.AUTH_ORIGIN||process.env.NEXT_PUBLIC_SITE_URL||'').startsWith('https://')?[{key:'Strict-Transport-Security',value:'max-age=31536000'}]:[]),{key:'X-Content-Type-Options',value:'nosniff'},{key:'X-Frame-Options',value:'DENY'},{key:'Referrer-Policy',value:'no-referrer'},{key:'Permissions-Policy',value:'camera=(), microphone=(), geolocation=()'},{key:'Content-Security-Policy',value:"frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'"}]},...['/portal/:path*','/admin/:path*','/login','/register','/forgot-password','/reset-password','/verify-email','/api/auth/:path*','/api/v1/account/:path*','/api/v1/student/:path*','/api/v1/faculty-portal/:path*','/api/v1/applications/:path*','/api/v1/admin/:path*','/api/v1/manage/:path*'].map(source=>({source,headers:[{key:'Cache-Control',value:'private, no-store'},{key:'X-Robots-Tag',value:'noindex, nofollow'}]}))]},
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
