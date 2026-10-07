DROP INDEX "academic_calendar_start_date_idx";--> statement-breakpoint
DROP INDEX "courses_department_idx";--> statement-breakpoint
DROP INDEX "faculty_profiles_department_idx";--> statement-breakpoint
DROP INDEX "programs_school_idx";--> statement-breakpoint
DROP INDEX "programs_department_idx";--> statement-breakpoint
CREATE INDEX "academic_calendar_start_date_idx" ON "academic_calendar_events" USING btree ("start_date");--> statement-breakpoint
CREATE INDEX "courses_department_idx" ON "courses" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "faculty_profiles_department_idx" ON "faculty_profiles" USING btree ("department_id");--> statement-breakpoint
CREATE INDEX "programs_school_idx" ON "programs" USING btree ("school_id");--> statement-breakpoint
CREATE INDEX "programs_department_idx" ON "programs" USING btree ("department_id");