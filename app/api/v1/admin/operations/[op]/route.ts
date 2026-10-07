import {withApi,json,NotFoundError} from '@/lib/server/api'
import {requireSameOrigin,readJson,rateLimit} from '@/lib/server/security'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {opsWithoutId} from '@/lib/admin/op-registry'
import {enrollStudent,correctAttendance,saveExam,saveAssignment,saveSession,assignInstructor,createInvoice} from '@/db/queries/admin-operations'
export const dynamic='force-dynamic'
const handlers:Record<keyof typeof opsWithoutId,(body:unknown)=>Promise<unknown>>={'enroll':enrollStudent,'attendance-correction':correctAttendance,'exam-create':b=>saveExam(b),'assignment-create':b=>saveAssignment(b),'session-create':b=>saveSession(b),'instructor-assign':assignInstructor,'invoice-create':createInvoice}
/** POST /api/v1/admin/operations/[op] — operation name selects a fixed permission; identity always comes from the session. */
export const POST=withApi(async(req:Request,{params}:{params:Promise<{op:string}>})=>{const op=(await params).op;if(!Object.hasOwn(opsWithoutId,op))throw new NotFoundError()
 const key=op as keyof typeof opsWithoutId;const u=await requireAdminPermission(opsWithoutId[key]);requireSameOrigin(req);await rateLimit('admin-op',u.id,60,60)
 return json({success:true,data:await handlers[key](await readJson(req))},{status:201,headers:{'Cache-Control':'no-store'}})})
