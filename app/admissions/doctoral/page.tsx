import {AdmissionPage} from '@/components/admissions'
import {readAdmission,itemMetadata,publicMetadata} from '@/lib/cms-details'
export const dynamic='force-dynamic'
export async function generateMetadata(){const p=await readAdmission('doctoral');return p?itemMetadata(p,'/admissions/doctoral',p.description):publicMetadata('Admissions','Published admissions information.','/admissions/doctoral')}
export default function Page(){return <AdmissionPage slug="doctoral"/>}
