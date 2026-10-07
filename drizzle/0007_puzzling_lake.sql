CREATE TABLE "assignment_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"assignment_id" uuid NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"content" text,
	"storage_key" text,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"marks" numeric(8, 2),
	"feedback" text,
	"graded_at" timestamp with time zone,
	CONSTRAINT "submission_once" UNIQUE("assignment_id","enrollment_id"),
	CONSTRAINT "submission_marks" CHECK ("assignment_submissions"."marks" is null or "assignment_submissions"."marks">=0),
	CONSTRAINT "submission_content" CHECK (("assignment_submissions"."content" is not null) <> ("assignment_submissions"."storage_key" is not null))
);
--> statement-breakpoint
CREATE TABLE "assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"title" text NOT NULL,
	"instructions" text NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"max_marks" numeric(8, 2) NOT NULL,
	"submission_mode" varchar(10) DEFAULT 'disabled' NOT NULL,
	"allow_late" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "assignment_section_title" UNIQUE("section_id","title"),
	CONSTRAINT "assignment_section_identity" UNIQUE("id","section_id"),
	CONSTRAINT "assignment_marks" CHECK ("assignments"."max_marks">0),
	CONSTRAINT "assignment_mode" CHECK ("assignments"."submission_mode" in ('text','file','disabled'))
);
--> statement-breakpoint
CREATE TABLE "attendance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"status" varchar(10) NOT NULL,
	CONSTRAINT "attendance_once" UNIQUE("enrollment_id","session_id"),
	CONSTRAINT "attendance_status" CHECK ("attendance"."status" in ('present','absent','excused'))
);
--> statement-breakpoint
CREATE TABLE "class_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"room" text,
	"building" text,
	"cancelled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "class_section_time" UNIQUE("section_id","starts_at"),
	CONSTRAINT "class_section_identity" UNIQUE("id","section_id"),
	CONSTRAINT "class_chronology" CHECK ("class_sessions"."ends_at">"class_sessions"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "course_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"kind" varchar(20) NOT NULL,
	"published_at" timestamp with time zone,
	CONSTRAINT "course_resource_title" UNIQUE("section_id","title"),
	CONSTRAINT "course_resource_kind" CHECK ("course_resources"."kind" in ('material','announcement'))
);
--> statement-breakpoint
CREATE TABLE "course_sections" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"course_id" uuid NOT NULL,
	"semester_id" uuid NOT NULL,
	"instructor_id" uuid,
	"code" varchar(40) NOT NULL,
	"capacity" integer NOT NULL,
	"is_open" boolean DEFAULT false NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	CONSTRAINT "section_course_semester_code" UNIQUE("course_id","semester_id","code"),
	CONSTRAINT "section_identity" UNIQUE("id","course_id","semester_id"),
	CONSTRAINT "section_capacity" CHECK ("course_sections"."capacity">0)
);
--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"section_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"semester_id" uuid NOT NULL,
	"credits" integer NOT NULL,
	"status" varchar(20) DEFAULT 'enrolled' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "enrollment_student_course_term" UNIQUE("student_id","course_id","semester_id"),
	CONSTRAINT "enrollment_section_identity" UNIQUE("id","section_id"),
	CONSTRAINT "enrollment_credits" CHECK ("enrollments"."credits">=0),
	CONSTRAINT "enrollment_status" CHECK ("enrollments"."status" in ('enrolled','in_progress','completed','withdrawn'))
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"title" text NOT NULL,
	"exam_type" varchar(40) NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"duration_minutes" integer NOT NULL,
	"room" text,
	"published_at" timestamp with time zone,
	CONSTRAINT "exam_section_title" UNIQUE("section_id","title"),
	CONSTRAINT "exam_duration" CHECK ("exams"."duration_minutes">0)
);
--> statement-breakpoint
CREATE TABLE "grade_scale" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"policy_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"points" numeric(6, 3),
	"counts_for_gpa" boolean NOT NULL,
	"earns_credit" boolean NOT NULL,
	CONSTRAINT "grade_scale_code" UNIQUE("policy_id","code"),
	CONSTRAINT "grade_points_valid" CHECK (("grade_scale"."points" is null or "grade_scale"."points">=0) and (not "grade_scale"."counts_for_gpa" or "grade_scale"."points" is not null))
);
--> statement-breakpoint
CREATE TABLE "grades" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"scale_id" uuid NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "grades_enrollment_id_unique" UNIQUE("enrollment_id")
);
--> statement-breakpoint
CREATE TABLE "grading_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"repeat_policy" varchar(20) NOT NULL,
	"description" text NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	CONSTRAINT "grading_policies_name_unique" UNIQUE("name"),
	CONSTRAINT "grading_repeat_policy" CHECK ("grading_policies"."repeat_policy" in ('all','latest','best'))
);
--> statement-breakpoint
CREATE TABLE "student_invoice_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"label" text NOT NULL,
	"category" varchar(40) NOT NULL,
	"amount_minor" integer NOT NULL,
	CONSTRAINT "invoice_item_label" UNIQUE("invoice_id","label"),
	CONSTRAINT "invoice_item_amount" CHECK ("student_invoice_items"."amount_minor">0)
);
--> statement-breakpoint
CREATE TABLE "student_invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"reference" text NOT NULL,
	"semester_id" uuid,
	"currency" varchar(3) NOT NULL,
	"due_on" date NOT NULL,
	"voided_at" timestamp with time zone,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_invoices_reference_unique" UNIQUE("reference"),
	CONSTRAINT "invoice_currency" CHECK ("student_invoices"."currency" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "student_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"invoice_id" uuid NOT NULL,
	"reference" text NOT NULL,
	"amount_minor" integer NOT NULL,
	"method" text NOT NULL,
	"status" varchar(20) NOT NULL,
	"paid_at" timestamp with time zone NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	CONSTRAINT "student_payments_reference_unique" UNIQUE("reference"),
	CONSTRAINT "payment_amount" CHECK ("student_payments"."amount_minor">0),
	CONSTRAINT "payment_status" CHECK ("student_payments"."status" in ('pending','settled','failed','refunded'))
);
--> statement-breakpoint
CREATE TABLE "registration_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"semester_id" uuid NOT NULL,
	"max_credits" integer NOT NULL,
	"eligible_statuses" jsonb NOT NULL,
	"approved_at" timestamp with time zone,
	CONSTRAINT "registration_policy_program_term" UNIQUE("program_id","semester_id"),
	CONSTRAINT "registration_credits" CHECK ("registration_policies"."max_credits">0)
);
--> statement-breakpoint
CREATE TABLE "semesters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"code" varchar(60) NOT NULL,
	"academic_year" varchar(20) NOT NULL,
	"term" varchar(80) NOT NULL,
	"starts_on" date NOT NULL,
	"ends_on" date NOT NULL,
	"registration_starts_at" timestamp with time zone,
	"registration_ends_at" timestamp with time zone,
	"add_drop_deadline" timestamp with time zone,
	"withdrawal_deadline" timestamp with time zone,
	"exam_starts_on" date,
	"exam_ends_on" date,
	"status" varchar(20) DEFAULT 'upcoming' NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "semesters_code_unique" UNIQUE("code"),
	CONSTRAINT "semester_dates" CHECK ("semesters"."ends_on">="semesters"."starts_on" and ("semesters"."registration_ends_at" is null or "semesters"."registration_ends_at">="semesters"."registration_starts_at") and ("semesters"."exam_ends_on" is null or "semesters"."exam_ends_on">="semesters"."exam_starts_on")),
	CONSTRAINT "semester_status" CHECK ("semesters"."status" in ('upcoming','active','completed'))
);
--> statement-breakpoint
CREATE TABLE "student_academic_policies" (
	"student_id" uuid PRIMARY KEY NOT NULL,
	"grading_policy_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "student_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"student_id" uuid NOT NULL,
	"title" text NOT NULL,
	"category" varchar(40) NOT NULL,
	"original_name" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"storage_key" text,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "student_document_title" UNIQUE("student_id","title"),
	CONSTRAINT "student_document_size" CHECK ("student_documents"."size_bytes">0 and "student_documents"."size_bytes"<=10485760)
);
--> statement-breakpoint
CREATE TABLE "student_preferences" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"email_notifications" boolean DEFAULT false NOT NULL,
	"compact_tables" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_notifications" ADD COLUMN "category" varchar(40) DEFAULT 'account' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_notifications" ADD COLUMN "link" text;--> statement-breakpoint
ALTER TABLE "user_notifications" ADD COLUMN "dedupe_key" text;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_assignment_id_section_id_assignments_id_section_id_fk" FOREIGN KEY ("assignment_id","section_id") REFERENCES "public"."assignments"("id","section_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignment_submissions" ADD CONSTRAINT "assignment_submissions_enrollment_id_section_id_enrollments_id_section_id_fk" FOREIGN KEY ("enrollment_id","section_id") REFERENCES "public"."enrollments"("id","section_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_section_id_course_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_enrollment_id_section_id_enrollments_id_section_id_fk" FOREIGN KEY ("enrollment_id","section_id") REFERENCES "public"."enrollments"("id","section_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance" ADD CONSTRAINT "attendance_session_id_section_id_class_sessions_id_section_id_fk" FOREIGN KEY ("session_id","section_id") REFERENCES "public"."class_sessions"("id","section_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "class_sessions" ADD CONSTRAINT "class_sessions_section_id_course_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_resources" ADD CONSTRAINT "course_resources_section_id_course_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_sections" ADD CONSTRAINT "course_sections_instructor_id_faculty_profiles_id_fk" FOREIGN KEY ("instructor_id") REFERENCES "public"."faculty_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_section_id_course_id_semester_id_course_sections_id_course_id_semester_id_fk" FOREIGN KEY ("section_id","course_id","semester_id") REFERENCES "public"."course_sections"("id","course_id","semester_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "exams" ADD CONSTRAINT "exams_section_id_course_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."course_sections"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grade_scale" ADD CONSTRAINT "grade_scale_policy_id_grading_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."grading_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grades" ADD CONSTRAINT "grades_scale_id_grade_scale_id_fk" FOREIGN KEY ("scale_id") REFERENCES "public"."grade_scale"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_invoice_items" ADD CONSTRAINT "student_invoice_items_invoice_id_student_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."student_invoices"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_invoices" ADD CONSTRAINT "student_invoices_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_invoices" ADD CONSTRAINT "student_invoices_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_payments" ADD CONSTRAINT "student_payments_invoice_id_student_invoices_id_fk" FOREIGN KEY ("invoice_id") REFERENCES "public"."student_invoices"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_policies" ADD CONSTRAINT "registration_policies_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registration_policies" ADD CONSTRAINT "registration_policies_semester_id_semesters_id_fk" FOREIGN KEY ("semester_id") REFERENCES "public"."semesters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_academic_policies" ADD CONSTRAINT "student_academic_policies_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_academic_policies" ADD CONSTRAINT "student_academic_policies_grading_policy_id_grading_policies_id_fk" FOREIGN KEY ("grading_policy_id") REFERENCES "public"."grading_policies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_documents" ADD CONSTRAINT "student_documents_student_id_student_profiles_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."student_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_preferences" ADD CONSTRAINT "student_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "assignment_due_idx" ON "assignments" USING btree ("section_id","due_at");--> statement-breakpoint
CREATE INDEX "class_time_idx" ON "class_sessions" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "sections_semester_idx" ON "course_sections" USING btree ("semester_id");--> statement-breakpoint
CREATE INDEX "enrollments_student_term_idx" ON "enrollments" USING btree ("student_id","semester_id");--> statement-breakpoint
CREATE INDEX "enrollments_section_idx" ON "enrollments" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "exam_section_time_idx" ON "exams" USING btree ("section_id","starts_at");--> statement-breakpoint
CREATE INDEX "student_invoice_owner_idx" ON "student_invoices" USING btree ("student_id","due_on");--> statement-breakpoint
CREATE INDEX "payment_invoice_idx" ON "student_payments" USING btree ("invoice_id");--> statement-breakpoint
CREATE INDEX "semester_status_idx" ON "semesters" USING btree ("status","starts_on");--> statement-breakpoint
CREATE INDEX "student_document_owner_idx" ON "student_documents" USING btree ("student_id","created_at");--> statement-breakpoint
ALTER TABLE "user_notifications" ADD CONSTRAINT "user_notifications_dedupe_key_unique" UNIQUE("dedupe_key");