import {z} from 'zod'
import {withApi,json,success,parseParams,NotFoundError} from '@/lib/server/api'
import {requireFaculty,publicIdentity} from '@/lib/server/auth'
import {requireSameOrigin,readJson,rateLimit} from '@/lib/server/security'
import * as input from '@/lib/faculty-validation'
import {ownFaculty} from '@/lib/server/faculty-access'
import {facultyList,facultyDetail,facultyDashboard,facultySections,attendanceSummary} from '@/db/queries/faculty'
import * as actions from '@/db/queries/faculty-actions'
type Context={params:Promise<{segments:string[]}>}
export const dynamic='force-dynamic'
export const GET=withApi(async(req:Request,ctx:Context)=>{const u=await requireFaculty();const {segments}=await ctx.params;const [area,id,action]=segments;const filter=parseParams(input.facultyFilter,Object.fromEntries(new URL(req.url).searchParams));if(segments.length>3)throw new NotFoundError();if(id)parseParams(z.uuid(),id);if(action){if(area==='submissions'&&action==='download')return json(success(await actions.downloadSubmission(id)));throw new NotFoundError()}
 if(id)return json(success(await facultyDetail(area,id)))
 if(area==='profile')return json(success({user:publicIdentity(u),faculty:(await ownFaculty()).faculty}))
 if(area==='dashboard')return json(success(await facultyDashboard()))
 if(area==='sections')return json(success(await facultySections()))
 if(area==='attendance-summary')return json(success(await attendanceSummary(filter.section,filter.page,filter.course,filter.semester)))
 if(area==='settings')return json(success(await actions.facultySettings()))
 return json(success(await facultyList(area,filter)))})
const mutate=withApi(async(req:Request,ctx:Context)=>{const u=await requireFaculty();requireSameOrigin(req);await rateLimit('faculty-write',u.id,60,60);const {segments}=await ctx.params;const [area,id,action,enrollmentId]=segments;const body=await readJson(req);if(segments.length>4)throw new NotFoundError();if(id&&!['read-all','revoke-others'].includes(id))parseParams(z.uuid(),id);if(enrollmentId)parseParams(z.uuid(),enrollmentId)
 if(req.method==='POST'&&area==='exams'&&id&&action==='grades'&&enrollmentId)return json(success(await actions.gradeExam(id,enrollmentId,parseParams(input.assessmentGradeInput,body))))
 if(segments.length>2)throw new NotFoundError()
 if(area==='assignments'&&(req.method==='POST'&&!id||req.method==='PATCH'&&id))return json(success(await actions.saveAssignment(parseParams(input.assignmentInput,body),id)))
 if(area==='exams'&&(req.method==='POST'&&!id||req.method==='PATCH'&&id))return json(success(await actions.saveExam(parseParams(input.examInput,body),id)))
 if(area==='announcements'&&(req.method==='POST'&&!id||req.method==='PATCH'&&id))return json(success(await actions.saveAnnouncement(parseParams(input.announcementInput,body),id)))
 if(area==='attendance'&&req.method==='POST'&&!id)return json(success(await actions.saveAttendance(parseParams(input.attendanceInput,body))))
 if(area==='submissions'&&req.method==='PATCH'&&id)return json(success(await actions.gradeSubmission(id,parseParams(input.assessmentGradeInput,body))))
 if(area==='grades'&&req.method==='PATCH'&&id)return json(success(await actions.gradeFinal(id,parseParams(input.finalGradeInput,body))))
 if(area==='profile'&&req.method==='PATCH'&&!id){await actions.saveFacultyProfile(parseParams(input.facultyProfileInput,body));return json(success({saved:true}))}
 if(area==='settings'&&req.method==='PATCH'&&!id){await actions.saveFacultySettings(parseParams(input.facultySettingsInput,body));return json(success({saved:true}))}
 if(area==='notifications'&&req.method==='PATCH'&&id){parseParams(z.object({}).strict(),body);await actions.facultyNotification(id==='read-all'?undefined:id);return json(success({read:true}))}
 if(area==='sessions'&&req.method==='POST'&&id==='revoke-others'){parseParams(z.object({}).strict(),body);await actions.revokeFacultySessions();return json(success({revoked:true}))}
 throw new NotFoundError()})
export const POST=mutate
export const PATCH=mutate
