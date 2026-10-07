ALTER TABLE "exams" ADD CONSTRAINT "exam_section_identity" UNIQUE("id","section_id");--> statement-breakpoint
CREATE TABLE "exam_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"exam_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"marks" numeric(8, 2),
	"draft_marks" numeric(8, 2),
	"feedback" text,
	"draft_feedback" text,
	"published_at" timestamp with time zone,
	"graded_by" uuid,
	"version" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "exam_result_once" UNIQUE("exam_id","enrollment_id"),
	CONSTRAINT "exam_result_marks" CHECK (("exam_results"."marks" is null or "exam_results"."marks">=0) and ("exam_results"."draft_marks" is null or "exam_results"."draft_marks">=0))
);
--> statement-breakpoint
CREATE TABLE "faculty_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"email_notifications" boolean DEFAULT false NOT NULL,
	"attendance_threshold" numeric(5, 2),
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "faculty_attendance_threshold" CHECK ("faculty_preferences"."attendance_threshold" is null or "faculty_preferences"."attendance_threshold" between 0 and 100)
);
--> statement-breakpoint
CREATE TABLE "grade_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"grade_id" uuid,
	"submission_id" uuid,
	"exam_result_id" uuid,
	"changed_by" uuid,
	"previous" jsonb,
	"next" jsonb NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grade_history_one_entity" CHECK (num_nonnulls("grade_history"."grade_id","grade_history"."submission_id","grade_history"."exam_result_id")=1)
);
--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD COLUMN "draft_marks" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD COLUMN "draft_feedback" text;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD COLUMN "graded_by" uuid;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "closed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "assignments" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "course_resources" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "course_resources" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "course_resources" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "max_marks" numeric(8, 2);--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "cancelled_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "exams" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "grades" ADD COLUMN "draft_scale_id" uuid;--> statement-breakpoint
ALTER TABLE "grades" ADD COLUMN "graded_by" uuid;--> statement-breakpoint
ALTER TABLE "grades" ADD COLUMN "version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "grades" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_exam_id_section_id_exams_id_section_id_fk" FOREIGN KEY ("exam_id","section_id") REFERENCES "public"."exams"("id","section_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exam_results" ADD CONSTRAINT "exam_results_enrollment_id_section_id_enrollments_id_section_id_fk" FOREIGN KEY ("enrollment_id","section_id") REFERENCES "public"."enrollments"("id","section_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_preferences" ADD CONSTRAINT "faculty_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_history" ADD CONSTRAINT "grade_history_grade_id_grades_id_fk" FOREIGN KEY ("grade_id") REFERENCES "public"."grades"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_history" ADD CONSTRAINT "grade_history_submission_id_assignment_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."assignment_submissions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_history" ADD CONSTRAINT "grade_history_exam_result_id_exam_results_id_fk" FOREIGN KEY ("exam_result_id") REFERENCES "public"."exam_results"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_history" ADD CONSTRAINT "grade_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "grade_history_grade_idx" ON "grade_history" USING btree ("grade_id","created_at");--> statement-breakpoint
CREATE INDEX "grade_history_submission_idx" ON "grade_history" USING btree ("submission_id","created_at");--> statement-breakpoint
CREATE INDEX "grade_history_exam_idx" ON "grade_history" USING btree ("exam_result_id","created_at");--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_draft_scale_id_grade_scale_id_fk" FOREIGN KEY ("draft_scale_id") REFERENCES "public"."grade_scale"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_graded_by_users_id_fk" FOREIGN KEY ("graded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "sections_instructor_idx" ON "course_sections" USING btree ("instructor_id","semester_id");--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exam_max_marks" CHECK ("exams"."max_marks" is null or "exams"."max_marks">0);