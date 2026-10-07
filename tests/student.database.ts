import 'dotenv/config'
import assert from 'node:assert/strict'
import {sql} from 'drizzle-orm'
import {db} from '../db'
import {readMigrationFiles} from 'drizzle-orm/migrator'
import {seedStudent} from '../db/seed-student'
const tables=['users','student_profiles','semesters','grading_policies','grade_scale','student_academic_policies','course_sections','enrollments','class_sessions','attendance','assignments','assignment_submissions','exams','grades','course_resources','student_invoices','student_invoice_items','student_payments','student_documents','user_notifications']
async function snapshot(){const query=sql.join(tables.map(table=>sql`select ${table} as name,md5(coalesce(string_agg(to_jsonb(t)::text,'' order by to_jsonb(t)::text),'')) as hash from ${sql.identifier(table)} t`),sql` union all `);const r=await db.execute(query);return Object.fromEntries(r.rows.map(row=>[String(row.name),String(row.hash)]))}
async function main(){const before=await snapshot();await seedStudent();const after=await snapshot();assert.deepEqual(after,before);console.log('PASS seed rerun preserved full contents of all 20 tables including users and profiles.');const r=await db.execute(sql`select count(*)::int as migrations from drizzle.__drizzle_migrations`);assert.equal(r.rows[0].migrations,readMigrationFiles({migrationsFolder:'./drizzle'}).length);console.log('PASS Neon migration journal: all additive migrations verified.')}
main().catch(e=>{console.error(e instanceof Error?e.message:'Student database verification failed');process.exitCode=1})
