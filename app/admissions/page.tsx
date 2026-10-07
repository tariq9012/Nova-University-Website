import {AdmissionPage} from '@/components/admissions'
import {readAdmission,itemMetadata,publicMetadata} from '@/lib/cms-details'
export const dynamic='force-dynamic'
export async function generateMetadata(){const p=await readAdmission('overview');return p?itemMetadata(p,'/admissions',p.description):publicMetadata('Admissions','Published admissions information.','/admissions')}
export default function Page(){return <AdmissionPage slug="overview"/>}
