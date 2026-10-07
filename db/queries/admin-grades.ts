import {sql} from 'drizzle-orm'
import {db} from '@/db'
import {z} from 'zod'
import {AppError,NotFoundError,parseParams} from '@/lib/server/api'
import {requireAdminPermission} from '@/lib/server/admin-auth'
import {reasonSchema} from '@/lib/admin/resources'
export const gradeCorrection=z.object({scaleId:z.uuid(),version:z.coerce.number().int().min(0),reason:reasonSchema}).strict()
/**
 * Corrects a PUBLISHED final grade. One atomic statement: locks the row, checks optimistic version and that the new
 * grade belongs to the student's own grading policy, updates, appends grade_history (previous/new/reason/actor/time),
 * writes an audit row and notifies the student once. Nothing is overwritten silently.
 */
export async function correctGrade(id:string,input:unknown){const actor=await requireAdminPermission('grades.manage');const p=parseParams(gradeCorrection,input)
 const r=await db.execute(sql`with old as materialized (select * from grades where id=${id}::uuid for update), allowed as (select gs.id from old join enrollments e on e.id=old.enrollment_id join student_academic_policies sap on sap.student_id=e.student_id join grade_scale gs on gs.policy_id=sap.grading_policy_id where gs.id=${p.scaleId}::uuid), changed as (update grades g set scale_id=${p.scaleId}::uuid,draft_scale_id=null,graded_by=${actor.id}::uuid,version=g.version+1,updated_at=now() where g.id=${id}::uuid and g.version=${p.version} and g.published_at is not null and g.scale_id<>${p.scaleId}::uuid and exists(select 1 from allowed) returning g.*), history as (insert into grade_history(grade_id,changed_by,previous,next,reason) select changed.id,${actor.id}::uuid,(select to_jsonb(old) from old),to_jsonb(changed),${p.reason} from changed), logged as (insert into audit_logs(actor_user_id,action,entity_type,entity_id,metadata) select ${actor.id}::uuid,'admin.grade.corrected','grade',changed.id::text,jsonb_build_object('reason',${p.reason}::text,'previous',(select code from grade_scale where id=(select scale_id from old)),'new',(select code from grade_scale where id=changed.scale_id),'version',changed.version) from changed), notified as (insert into user_notifications(user_id,title,message,category,link,dedupe_key) select sp.user_id,'Grade corrected','A published grade on your record was corrected by the university.','grade','/portal/student/results','grade-correction:'||changed.id::text||':'||changed.version::text from changed join enrollments e on e.id=changed.enrollment_id join student_profiles sp on sp.id=e.student_id on conflict(dedupe_key) do nothing) select id,version from changed`)
 if(!r.rows[0]){const e=await db.execute(sql`select published_at,version from grades where id=${id}::uuid`);if(!e.rows[0])throw new NotFoundError()
  if(!e.rows[0].published_at)throw new AppError('CONFLICT','Only published grades are corrected here; draft grades belong to the instructor.',409)
  if(Number(e.rows[0].version)!==p.version)throw new AppError('CONFLICT','This grade changed since you opened it. Reload and try again.',409)
  throw new AppError('CONFLICT','The new grade must differ from the current grade and belong to the student\'s grading policy.',409)}
 return r.rows[0]}
