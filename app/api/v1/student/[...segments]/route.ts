import {z} from 'zod'
import {withApi,json,success,parseParams,NotFoundError,AppError} from '@/lib/server/api'
import {requireStudent,publicIdentity} from '@/lib/server/auth'
import {requireSameOrigin,readJson,rateLimit} from '@/lib/server/security'
import {studentQuery,submissionInput,preferencesInput,emptyInput,fileInput} from '@/lib/student-validation'
import {profileInput} from '@/lib/auth-validation'
import {updateOwnProfile} from '@/db/queries/accounts'
import {academicRecord,ownStudent,studentList,studentDetail,studentDashboard,studentSettings,savePreferences,revokeOtherSessions,markStudentNotifications,submitAssignment,downloadStudentDocument,payStudentInvoice} from '@/db/queries/student'
import {studentStorage} from '@/lib/server/student-integrations'
type Context={params:Promise<{segments:string[]}>}
export const dynamic='force-dynamic'
export const GET=withApi(async(req:Request,ctx:Context)=>{const u=await requireStudent();const {segments}=await ctx.params;const [area,id,action]=segments;const filter=parseParams(studentQuery,Object.fromEntries(new URL(req.url).searchParams));if(segments.length>3)throw new NotFoundError();if(id)parseParams(z.uuid(),id);if(action){if(area==='documents'&&action==='download')return json(success(await downloadStudentDocument(id)));throw new NotFoundError()}
 if(id)return json(success(await studentDetail(area,id)))
 if(area==='profile')return json(success({user:publicIdentity(u),student:(await ownStudent()).student}))
 if(area==='dashboard')return json(success(await studentDashboard()))
 if(['academics','results','transcript','progress'].includes(area))return json(success(await academicRecord()))
 if(area==='settings')return json(success(await studentSettings()))
 if(area==='registration')return json(success({enabled:false,reason:'Course registration is not open. Registrar approval and published registration rules are required.'}))
 return json(success(await studentList(area,filter)))})
const mutate=withApi(async(req:Request,ctx:Context)=>{const u=await requireStudent();requireSameOrigin(req);await rateLimit('student-write',u.id,60,60);const {segments}=await ctx.params;const [area,id,action]=segments;const body=await readJson(req);if(segments.length>3)throw new NotFoundError();if(id&&id!=='read-all'&&id!=='revoke-others')parseParams(z.uuid(),id)
 if(req.method==='PATCH'&&area==='profile'&&!id){await updateOwnProfile(parseParams(profileInput,body));return json(success({saved:true}))}
 if(req.method==='PATCH'&&area==='settings'&&!id){await savePreferences(parseParams(preferencesInput,body));return json(success({saved:true}))}
 if(req.method==='POST'&&area==='sessions'&&id==='revoke-others'&&!action){parseParams(emptyInput,body);await revokeOtherSessions();return json(success({revoked:true}))}
 if(req.method==='PATCH'&&area==='notifications'&&id&&!action){parseParams(emptyInput,body);await markStudentNotifications(id==='read-all'?undefined:id);return json(success({read:true}))}
 if(req.method==='POST'&&area==='assignments'&&action==='submit'){const p=parseParams(submissionInput,body);return json(success(await submitAssignment(id,p.content)))}
 if(req.method==='POST'&&area==='assignments'&&action==='upload'){parseParams(fileInput,body);const a=await studentDetail('assignments',id);if(a.closedAt||a.submissionMode!=='file'||a.submittedAt||!['enrolled','in_progress'].includes(String(a.enrollmentStatus))||!a.allowLate&&Date.parse(String(a.dueAt))<Date.now())throw new AppError('SUBMISSION_UNAVAILABLE','File submission is not available for this assignment.',409);studentStorage()}
 if(req.method==='POST'&&area==='fees'&&action==='checkout'){parseParams(emptyInput,body);return json(success(await payStudentInvoice(id)))}
 if(area==='registration'){parseParams(emptyInput,body);throw new AppError('REGISTRATION_CLOSED','Course registration is not open. Contact the registrar.',409)}
 throw new NotFoundError()})
export const POST=mutate
export const PATCH=mutate
