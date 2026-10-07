import {PortalShell} from '@/components/portal-shell'
export const dynamic='force-dynamic'
export const metadata={title:'Faculty portal',robots:{index:false,follow:false}}
export default function Layout({children}:{children:React.ReactNode}){return <PortalShell role="faculty">{children}</PortalShell>}
