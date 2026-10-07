import {AdmissionPage} from '@/components/admissions'
import {readAdmission,itemMetadata,publicMetadata} from '@/lib/cms-details'
export const dynamic='force-dynamic'
export async function generateMetadata(){const p=await readAdmission('graduate');return p?itemMetadata(p,'/admissions/graduate',p.description):publicMetadata('Admissions','Published admissions information.','/admissions/graduate')}
export default function Page(){return <AdmissionPage slug="graduate"/>}
