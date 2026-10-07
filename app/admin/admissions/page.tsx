import Link from 'next/link'
import {adminPage} from '@/lib/server/admin-auth'
import {AdminHeading} from '@/components/admin-ui'
export default async function Page(){await adminPage('applications.view')
  return <><AdminHeading title="Admissions management" description="Manage the existing admissions content that powers the public admissions pages. Only active records are public."/>
   <ul><li><Link prefetch={false} href="/admin/intakes">Intakes</Link></li><li><Link prefetch={false} href="/admin/deadlines">Deadlines</Link></li><li><Link prefetch={false} href="/admin/requirements">Requirements</Link></li><li><Link prefetch={false} href="/admin/fees">Fee structures</Link></li><li><Link prefetch={false} href="/admin/scholarships">Scholarships</Link></li><li><Link prefetch={false} href="/admin/applications">Applications</Link></li></ul></>}
