import {z} from 'zod'
export const emailInput=z.string().trim().toLowerCase().email().max(320)
export const passwordInput=z.string().min(15,'Use at least 15 characters. A long unique passphrase works well.').max(128,'Use at most 128 characters.').refine(s=>!['passwordpassword','123456789012345','qwertyuiopasdfgh'].includes(s.toLowerCase()),'Choose a less common password.')
const names={firstName:z.string().trim().min(1).max(100),lastName:z.string().trim().min(1).max(100)}
export const registrationInput=z.object({...names,email:emailInput,password:passwordInput,confirmPassword:z.string(),terms:z.literal(true)}).strict().refine(x=>x.password===x.confirmPassword,{path:['confirmPassword'],message:'Passwords do not match'})
export const loginInput=z.object({email:emailInput,password:z.string().min(1).max(128),remember:z.boolean().default(false)}).strict()
export const resetInput=z.object({token:z.string().regex(/^[a-f0-9]{64}$/),password:passwordInput,confirmPassword:z.string()}).strict().refine(x=>x.password===x.confirmPassword,{message:'Passwords do not match'})
export const profileInput=z.object({...names,phone:z.string().trim().max(40).regex(/^[+()0-9 .-]*$/)}).strict()
export const passwordChangeInput=z.object({currentPassword:z.string().min(1).max(128),password:passwordInput,confirmPassword:z.string()}).strict().refine(x=>x.password===x.confirmPassword,{message:'Passwords do not match'})
export const applicationDraftInput=z.object({personalStatement:z.string().trim().max(10000),priorEducation:z.string().trim().max(5000),contactPhone:z.string().trim().max(40).regex(/^[+()0-9 .-]*$/),applicantType:z.enum(['domestic','international'])}).strict()
export const newApplicationInput=z.object({program:z.string().max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),intake:z.string().max(180).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)}).strict()
export const userListInput=z.object({page:z.coerce.number().int().min(1).max(10000).default(1),pageSize:z.coerce.number().int().min(1).max(100).default(20),search:z.string().trim().max(100).default(''),role:z.enum(['','student','faculty','admin']).default(''),status:z.enum(['','active','inactive','suspended']).default('')})
export function roleHome(roles:string[]){return roles.includes('admin')?'/admin':roles.includes('faculty')?'/portal/faculty':'/portal/student'}
