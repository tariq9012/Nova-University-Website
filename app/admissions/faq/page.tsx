import {AdmissionPage} from '@/components/admissions'
import {readAdmission,itemMetadata,publicMetadata} from '@/lib/cms-details'
export const dynamic='force-dynamic'
export async function generateMetadata(){const p=await readAdmission('faq');return p?itemMetadata(p,'/admissions/faq',p.description):publicMetadata('Admissions','Published admissions information.','/admissions/faq')}
export default function Page(){return <AdmissionPage slug="faq"/>}
