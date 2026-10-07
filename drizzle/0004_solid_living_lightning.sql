CREATE TYPE "public"."announcement_audience" AS ENUM('everyone', 'students', 'faculty', 'staff', 'applicants');--> statement-breakpoint
CREATE TYPE "public"."applicant_type" AS ENUM('all', 'domestic', 'international');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('draft', 'submitted', 'under_review', 'additional_information_required', 'accepted', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."publication_status" AS ENUM('draft', 'published', 'archived');--> statement-breakpoint
CREATE TABLE "admission_deadlines" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(180) NOT NULL,
	"program_id" uuid,
	"degree_level" "degree_level",
	"is_active" boolean DEFAULT false NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"intake_id" uuid NOT NULL,
	"opens_on" date NOT NULL,
	"deadline" date NOT NULL,
	"decision_on" date,
	"enrollment_deadline" date,
	CONSTRAINT "admission_deadlines_dates_valid" CHECK ("admission_deadlines"."deadline" >= "admission_deadlines"."opens_on" and ("admission_deadlines"."decision_on" is null or "admission_deadlines"."decision_on">="admission_deadlines"."deadline") and ("admission_deadlines"."enrollment_deadline" is null or "admission_deadlines"."enrollment_deadline">="admission_deadlines"."deadline"))
);
--> statement-breakpoint
CREATE TABLE "admission_intakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(180) NOT NULL,
	"name" varchar(180) NOT NULL,
	"academic_year" varchar(30) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admission_pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(180) NOT NULL,
	"title" varchar(240) NOT NULL,
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"seo_title" varchar(240),
	"seo_description" varchar(320),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "admission_requirements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(180) NOT NULL,
	"program_id" uuid,
	"degree_level" "degree_level",
	"is_active" boolean DEFAULT false NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"title" varchar(240) NOT NULL,
	"applicant_type" "applicant_type" DEFAULT 'all' NOT NULL,
	"description" text,
	"documents" jsonb DEFAULT '[]'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(180) NOT NULL,
	"title" varchar(240) NOT NULL,
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"seo_title" varchar(240),
	"seo_description" varchar(320),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"audience" "announcement_audience" DEFAULT 'everyone' NOT NULL,
	"expires_at" timestamp with time zone,
	"category_id" uuid,
	CONSTRAINT "announcements_priority_range" CHECK ("announcements"."priority" between 0 and 3),
	CONSTRAINT "announcements_expiry_valid" CHECK ("announcements"."expires_at" is null or "announcements"."published_at" is null or "announcements"."expires_at">"announcements"."published_at")
);
--> statement-breakpoint
CREATE TABLE "application_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"requirement_id" uuid,
	"storage_key" text NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(100) NOT NULL,
	"size_bytes" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "application_documents_size_valid" CHECK ("application_documents"."size_bytes">0 and "application_documents"."size_bytes"<=10485760)
);
--> statement-breakpoint
CREATE TABLE "application_status_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"from_status" "application_status",
	"to_status" "application_status" NOT NULL,
	"changed_by" uuid,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"applicant_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	"degree_level" "degree_level" NOT NULL,
	"intake_id" uuid NOT NULL,
	"status" "application_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cms_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" varchar(30) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"name" varchar(160) NOT NULL,
	CONSTRAINT "cms_categories_kind_valid" CHECK ("cms_categories"."kind" in ('news','events','announcements'))
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(180) NOT NULL,
	"title" varchar(240) NOT NULL,
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"seo_title" varchar(240),
	"seo_description" varchar(320),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"timezone" varchar(80) DEFAULT 'UTC' NOT NULL,
	"location" text,
	"campus_id" uuid,
	"organizer" varchar(180),
	"category_id" uuid,
	"registration_url" text,
	"image_url" text,
	"image_alt" text,
	"featured" boolean DEFAULT false NOT NULL,
	"is_cancelled" boolean DEFAULT false NOT NULL,
	CONSTRAINT "events_dates_order" CHECK ("events"."ends_at" >= "events"."starts_at")
);
--> statement-breakpoint
CREATE TABLE "fee_structures" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(180) NOT NULL,
	"program_id" uuid,
	"degree_level" "degree_level",
	"is_active" boolean DEFAULT false NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"academic_year" varchar(30) NOT NULL,
	"tuition" numeric(12, 2),
	"registration_fee" numeric(12, 2),
	"other_fees" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"currency" varchar(3) NOT NULL,
	"payment_schedule" text,
	"notes" text,
	CONSTRAINT "fee_structures_amounts_valid" CHECK (("fee_structures"."tuition" is null or "fee_structures"."tuition">=0) and ("fee_structures"."registration_fee" is null or "fee_structures"."registration_fee">=0) and "fee_structures"."currency" ~ '^[A-Z]{3}$')
);
--> statement-breakpoint
CREATE TABLE "news" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(180) NOT NULL,
	"title" varchar(240) NOT NULL,
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"seo_title" varchar(240),
	"seo_description" varchar(320),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"excerpt" text,
	"content" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_url" text,
	"image_alt" text,
	"category_id" uuid,
	"author_id" uuid,
	"author_name" varchar(180),
	"featured" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scholarships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(180) NOT NULL,
	"title" varchar(240) NOT NULL,
	"status" "publication_status" DEFAULT 'draft' NOT NULL,
	"is_sample" boolean DEFAULT false NOT NULL,
	"published_at" timestamp with time zone,
	"seo_title" varchar(240),
	"seo_description" varchar(320),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"description" text,
	"eligibility" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"coverage" text,
	"application_process" text,
	"required_documents" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"contact_email" varchar(320),
	"degree_level" "degree_level",
	"applicant_type" "applicant_type" DEFAULT 'all' NOT NULL,
	"opens_on" date,
	"deadline" date,
	"is_active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "scholarships_dates_order" CHECK ("scholarships"."deadline" is null or "scholarships"."opens_on" is null or "scholarships"."deadline">="scholarships"."opens_on")
);
--> statement-breakpoint
ALTER TABLE "admission_deadlines" ADD CONSTRAINT "admission_deadlines_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_deadlines" ADD CONSTRAINT "admission_deadlines_intake_id_admission_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."admission_intakes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "admission_requirements" ADD CONSTRAINT "admission_requirements_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_category_id_cms_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."cms_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_documents" ADD CONSTRAINT "application_documents_requirement_id_admission_requirements_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."admission_requirements"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_status_history" ADD CONSTRAINT "application_status_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_applicant_id_users_id_fk" FOREIGN KEY ("applicant_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_intake_id_admission_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."admission_intakes"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_campus_id_campuses_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_category_id_cms_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."cms_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fee_structures" ADD CONSTRAINT "fee_structures_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_category_id_cms_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."cms_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news" ADD CONSTRAINT "news_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "admission_deadlines_slug_idx" ON "admission_deadlines" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "admission_deadlines_scope_idx" ON "admission_deadlines" USING btree ("program_id","intake_id");--> statement-breakpoint
CREATE UNIQUE INDEX "admission_intakes_slug_idx" ON "admission_intakes" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "admission_pages_slug_idx" ON "admission_pages" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "admission_requirements_slug_idx" ON "admission_requirements" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "admission_requirements_scope_idx" ON "admission_requirements" USING btree ("program_id","degree_level","applicant_type");--> statement-breakpoint
CREATE UNIQUE INDEX "announcements_slug_idx" ON "announcements" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "announcements_public_idx" ON "announcements" USING btree ("status","audience","expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "application_documents_storage_key_idx" ON "application_documents" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "application_documents_application_idx" ON "application_documents" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_history_application_idx" ON "application_status_history" USING btree ("application_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_applicant_program_intake_idx" ON "applications" USING btree ("applicant_id","program_id","intake_id");--> statement-breakpoint
CREATE INDEX "applications_applicant_idx" ON "applications" USING btree ("applicant_id");--> statement-breakpoint
CREATE INDEX "applications_status_idx" ON "applications" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "cms_categories_kind_slug_idx" ON "cms_categories" USING btree ("kind","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "events_slug_idx" ON "events" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "events_public_idx" ON "events" USING btree ("status","starts_at");--> statement-breakpoint
CREATE INDEX "events_category_idx" ON "events" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fee_structures_slug_idx" ON "fee_structures" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "fee_structures_scope_idx" ON "fee_structures" USING btree ("program_id","degree_level","academic_year");--> statement-breakpoint
CREATE UNIQUE INDEX "news_slug_idx" ON "news" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "news_public_idx" ON "news" USING btree ("status","published_at");--> statement-breakpoint
CREATE INDEX "news_category_idx" ON "news" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "scholarships_slug_idx" ON "scholarships" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "scholarships_public_idx" ON "scholarships" USING btree ("status","is_active");