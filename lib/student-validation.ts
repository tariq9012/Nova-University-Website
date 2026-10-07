import {z} from 'zod'
export const studentQuery=z.object({page:z.coerce.number().int().min(1).max(10000).default(1),semester:z.union([z.uuid(),z.literal('')]).default(''),week:z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(v=>Number(v.slice(0,4))>0&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v, 'Invalid week').optional()}).strict()
export const submissionInput=z.object({content:z.string().trim().min(1).max(20000)}).strict()
export const preferencesInput=z.object({timezone:z.string().max(80).refine(v=>{try{new Intl.DateTimeFormat('en',{timeZone:v});return true}catch{return false}},'Choose a valid IANA time zone'),emailNotifications:z.boolean(),compactTables:z.boolean()}).strict()
export const emptyInput=z.object({}).strict()
export const fileInput=z.object({filename:z.string().min(1).max(180).regex(/^[a-zA-Z0-9][a-zA-Z0-9 _.-]*$/).refine(v=>!v.includes('..'),'Invalid filename'),mimeType:z.enum(['application/pdf','image/jpeg','image/png']),size:z.number().int().positive().max(10485760)}).strict().refine(v=>({'application/pdf':/\.pdf$/i,'image/jpeg':/\.jpe?g$/i,'image/png':/\.png$/i}[v.mimeType]).test(v.filename),'Extension must match MIME type')
