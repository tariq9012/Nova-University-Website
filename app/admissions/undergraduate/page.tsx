import {AdmissionPage} from '@/components/admissions'
import {readAdmission,itemMetadata,publicMetadata} from '@/lib/cms-details'
export const dynamic='force-dynamic'
export async function generateMetadata(){const p=await readAdmission('undergraduate');return p?itemMetadata(p,'/admissions/undergraduate',p.description):publicMetadata('Admissions','Published admissions information.','/admissions/undergraduate')}
export default function Page(){return <AdmissionPage slug="undergraduate"/>}
