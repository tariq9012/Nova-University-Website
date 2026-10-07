import {z} from 'zod'
import {reasonSchema} from './resources'
import {parseInvoiceLines,minutesBetween,ATTENDANCE_STATUSES} from './rules'
const id=z.uuid()
const stamp=z.iso.datetime({offset:true})
const blank=(v:unknown)=>typeof v==='string'&&v.trim()===''?undefined:v
const money=z.coerce.number().positive().max(999999).multipleOf(.01)
export const roleChangeInput=z.object({action:z.enum(['add','remove']),role:z.string().regex(/^[a-z_]{2,40}$/),reason:reasonSchema,confirmEmail:z.preprocess(blank,z.email().max(320).optional())}).strict()
export const enrollInput=z.object({studentNumber:z.string().trim().min(1).max(40),sectionId:id,reason:z.preprocess(blank,reasonSchema.optional())}).strict()
export const withdrawInput=z.object({enrollmentId:id,reason:reasonSchema}).strict()
const U='[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}'
export const attendanceFixInput=z.object({sectionId:id,record:z.string().regex(new RegExp('^'+U+'\\|'+U+'$','i')).transform(v=>{const [sessionId,enrollmentId]=v.split('|');return {sessionId,enrollmentId}}),status:z.enum(ATTENDANCE_STATUSES),reason:reasonSchema}).strict()
const timed=(s:{startsAt:string;endsAt:string})=>minutesBetween(s.startsAt,s.endsAt)!==null
export const examSaveInput=z.object({sectionId:id,title:z.string().trim().min(3).max(240),examType:z.string().trim().min(2).max(40),startsAt:stamp,endsAt:stamp,room:z.string().trim().max(120).default(''),maxMarks:money,state:z.enum(['draft','published']),version:z.coerce.number().int().min(0).default(0),reason:z.preprocess(blank,reasonSchema.optional())}).strict().refine(timed,{message:'End time must be after start time',path:['endsAt']})
export const stateInput=z.object({restore:z.boolean().default(false),reason:reasonSchema}).strict()
export const assignmentSaveInput=z.object({sectionId:id,title:z.string().trim().min(3).max(240),description:z.string().trim().max(3000).default(''),instructions:z.string().trim().min(5).max(15000),dueAt:stamp,maxMarks:money,submissionMode:z.enum(['text','file','disabled']),allowLate:z.boolean(),state:z.enum(['draft','published']),version:z.coerce.number().int().min(0).default(0),reason:z.preprocess(blank,reasonSchema.optional())}).strict()
export const sessionSaveInput=z.object({sectionId:id,startsAt:stamp,endsAt:stamp,room:z.string().trim().min(1).max(120),building:z.preprocess(blank,z.string().trim().max(120).optional()),reason:z.preprocess(blank,reasonSchema.optional())}).strict().refine(timed,{message:'End time must be after start time',path:['endsAt']})
export const studentProfileInput=z.object({firstName:z.string().trim().min(1).max(100),lastName:z.string().trim().min(1).max(100),phone:z.preprocess(blank,z.string().trim().max(40).regex(/^[+0-9 ()\-]{5,40}$/,'Invalid phone number').optional()),programId:z.preprocess(blank,id.optional()),enrollmentYear:z.preprocess(blank,z.coerce.number().int().min(1950).max(2100).optional()),academicStatus:z.enum(['prospective','active','suspended','graduated','withdrawn']),reason:reasonSchema}).strict()
export const facultyProfileInput=z.object({title:z.preprocess(blank,z.string().trim().max(40).optional()),firstName:z.string().trim().min(1).max(100),lastName:z.string().trim().min(1).max(100),position:z.preprocess(blank,z.string().trim().max(160).optional()),biography:z.preprocess(blank,z.string().trim().max(8000).optional()),researchInterests:z.string().max(3000).default('').transform(v=>v.split(/\r?\n/).map(s=>s.trim()).filter(Boolean).slice(0,30)),office:z.preprocess(blank,z.string().trim().max(160).optional()),officeHours:z.preprocess(blank,z.string().trim().max(500).optional()),publicEmail:z.preprocess(blank,z.email().max(320).optional()),departmentId:id,isActive:z.boolean(),reason:reasonSchema}).strict()
export const assignInstructorInput=z.object({sectionId:id,facultyId:z.preprocess(blank,id.optional()),reason:reasonSchema}).strict()
const invoiceBase={studentNumber:z.string().trim().min(1).max(40),reference:z.preprocess(blank,z.string().trim().min(3).max(60).regex(/^[A-Za-z0-9][A-Za-z0-9\-_/]*$/,'Use letters, numbers, - _ /').optional()),semesterId:z.preprocess(blank,id.optional()),currency:z.string().regex(/^[A-Z]{3}$/,'Use a 3-letter ISO code'),dueOn:z.iso.date(),lines:z.string().max(6000).transform((v,ctx)=>{const r=parseInvoiceLines(v);if('error' in r){ctx.addIssue({code:'custom',message:r.error});return z.NEVER}return r.lines})}
export const invoiceCreateInput=z.object(invoiceBase).strict()
export const invoiceUpdateInput=z.object({...invoiceBase}).strict()
export const invoiceActionInput=z.discriminatedUnion('action',[z.object({action:z.literal('issue')}).strict(),z.object({action:z.literal('cancel'),reason:reasonSchema}).strict()])
