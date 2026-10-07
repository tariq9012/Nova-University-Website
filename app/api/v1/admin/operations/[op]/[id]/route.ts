import {z} from 'zod'
import {withApi,json,parseParams,NotFoundError} from '@/lib/server/api'
import {requireSameOrigin,readJson,rateLimit} from '@/lib/server/security'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {opsWithId} from '@/lib/admin/op-registry'
import {withdrawEnrollment,saveExam,setExamState,saveAssignment,setAssignmentState,saveSession,setSessionState,updateStudentProfile,updateFacultyProfile,updateInvoiceDraft,invoiceAction} from '@/db/queries/admin-operations'
export const dynamic='force-dynamic'
const handlers:Record<keyof typeof opsWithId,(id:string,body:unknown)=>Promise<unknown>>={'enrollment-withdraw':withdrawEnrollment,'exam-update':(id,b)=>saveExam(b,id),'exam-state':setExamState,'assignment-update':(id,b)=>saveAssignment(b,id),'assignment-state':setAssignmentState,'session-update':(id,b)=>saveSession(b,id),'session-state':setSessionState,'student-profile':updateStudentProfile,'faculty-profile':updateFacultyProfile,'invoice-update':updateInvoiceDraft,'invoice-action':invoiceAction}
export const POST=withApi(async(req:Request,{params}:{params:Promise<{op:string;id:string}>})=>{const p=await params;if(!Object.hasOwn(opsWithId,p.op))throw new NotFoundError()
 const key=p.op as keyof typeof opsWithId;const u=await requireAdminPermission(opsWithId[key]);requireSameOrigin(req);await rateLimit('admin-op',u.id,60,60)
 return json({success:true,data:await handlers[key](parseParams(z.uuid(),p.id),await readJson(req))},{headers:{'Cache-Control':'no-store'}})})
