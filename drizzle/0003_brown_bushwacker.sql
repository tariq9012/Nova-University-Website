CREATE UNIQUE INDEX "departments_id_school_idx" ON "departments" USING btree ("id","school_id");--> statement-breakpoint
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_department_school_fk" FOREIGN KEY ("department_id","school_id") REFERENCES "public"."departments"("id","school_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_department_school_fk" FOREIGN KEY ("department_id","school_id") REFERENCES "public"."departments"("id","school_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "departments_head_idx" ON "departments" USING btree ("head_id");--> statement-breakpoint
CREATE INDEX "faculty_courses_course_idx" ON "faculty_courses" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "faculty_programs_program_idx" ON "faculty_programs" USING btree ("program_id");--> statement-breakpoint
CREATE INDEX "program_curriculum_course_idx" ON "program_curriculum" USING btree ("course_id");--> statement-breakpoint
CREATE INDEX "schools_dean_idx" ON "schools" USING btree ("dean_id");
