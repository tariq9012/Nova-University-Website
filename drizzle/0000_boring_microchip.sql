CREATE TYPE "public"."degree_level" AS ENUM('undergraduate', 'graduate', 'doctoral');--> statement-breakpoint
CREATE TYPE "public"."study_mode" AS ENUM('full_time', 'part_time');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'suspended');--> statement-breakpoint
CREATE TABLE "academic_calendar_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text,
	"event_type" varchar(50) NOT NULL,
	"semester_label" varchar(100),
	"start_date" date NOT NULL,
	"end_date" date,
	"is_published" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campuses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"description" text,
	"address" text,
	"city" varchar(100),
	"country" varchar(100),
	"phone" varchar(40),
	"email" varchar(320),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "course_prerequisites" (
	"course_id" uuid NOT NULL,
	"prerequisite_course_id" uuid NOT NULL,
	CONSTRAINT "course_prerequisites_course_id_prerequisite_course_id_pk" PRIMARY KEY("course_id","prerequisite_course_id"),
	CONSTRAINT "course_prerequisite_no_self" CHECK ("course_prerequisites"."course_id" <> "course_prerequisites"."prerequisite_course_id")
);
--> statement-breakpoint
CREATE TABLE "courses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"department_id" uuid NOT NULL,
	"code" varchar(30) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"title" varchar(180) NOT NULL,
	"description" text,
	"credit_hours" integer NOT NULL,
	"course_level" integer NOT NULL,
	"course_type" varchar(50) NOT NULL,
	"learning_outcomes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"major_topics" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "courses_credits_positive" CHECK ("courses"."credit_hours" > 0)
);
--> statement-breakpoint
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"short_name" varchar(60),
	"description" text,
	"email" varchar(320),
	"phone" varchar(40),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faculty_courses" (
	"faculty_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	CONSTRAINT "faculty_courses_faculty_id_course_id_pk" PRIMARY KEY("faculty_id","course_id")
);
--> statement-breakpoint
CREATE TABLE "faculty_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"school_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"slug" varchar(180) NOT NULL,
	"title" varchar(30),
	"first_name" varchar(100) NOT NULL,
	"last_name" varchar(100) NOT NULL,
	"position" varchar(120),
	"biography" text,
	"education" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"research_interests" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"image_url" text,
	"office" varchar(100),
	"public_email" varchar(320),
	"office_hours" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "faculty_programs" (
	"faculty_id" uuid NOT NULL,
	"program_id" uuid NOT NULL,
	CONSTRAINT "faculty_programs_faculty_id_program_id_pk" PRIMARY KEY("faculty_id","program_id")
);
--> statement-breakpoint
CREATE TABLE "faculty_research_areas" (
	"faculty_id" uuid NOT NULL,
	"research_area_id" uuid NOT NULL,
	CONSTRAINT "faculty_research_areas_faculty_id_research_area_id_pk" PRIMARY KEY("faculty_id","research_area_id")
);
--> statement-breakpoint
CREATE TABLE "program_campuses" (
	"program_id" uuid NOT NULL,
	"campus_id" uuid NOT NULL,
	CONSTRAINT "program_campuses_program_id_campus_id_pk" PRIMARY KEY("program_id","campus_id")
);
--> statement-breakpoint
CREATE TABLE "program_curriculum" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"program_id" uuid NOT NULL,
	"course_id" uuid NOT NULL,
	"semester_number" integer NOT NULL,
	"course_type" varchar(50) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "program_curriculum_semester_valid" CHECK ("program_curriculum"."semester_number" between 1 and 12)
);
--> statement-breakpoint
CREATE TABLE "programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"school_id" uuid NOT NULL,
	"department_id" uuid NOT NULL,
	"name" varchar(180) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"degree_title" varchar(180) NOT NULL,
	"degree_level" "degree_level" NOT NULL,
	"description" text,
	"duration_years" integer NOT NULL,
	"total_credit_hours" integer NOT NULL,
	"study_mode" "study_mode" DEFAULT 'full_time' NOT NULL,
	"overview" text,
	"objectives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"learning_outcomes" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"admission_requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"career_opportunities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "programs_credits_positive" CHECK ("programs"."total_credit_hours" > 0)
);
--> statement-breakpoint
CREATE TABLE "research_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(160) NOT NULL,
	"slug" varchar(160) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(80) NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "schools" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(180) NOT NULL,
	"slug" varchar(180) NOT NULL,
	"short_name" varchar(60),
	"description" text,
	"image_url" text,
	"email" varchar(320),
	"phone" varchar(40),
	"is_active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_roles" (
	"user_id" uuid NOT NULL,
	"role_id" uuid NOT NULL,
	CONSTRAINT "user_roles_user_id_role_id_pk" PRIMARY KEY("user_id","role_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(320) NOT NULL,
	"first_name" varchar(100),
	"last_name" varchar(100),
	"display_name" varchar(200),
	"status" "user_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "course_prerequisites" ADD CONSTRAINT "course_prerequisites_prerequisite_course_id_courses_id_fk" FOREIGN KEY ("prerequisite_course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "courses" ADD CONSTRAINT "courses_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_courses" ADD CONSTRAINT "faculty_courses_faculty_id_faculty_profiles_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_courses" ADD CONSTRAINT "faculty_courses_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_profiles" ADD CONSTRAINT "faculty_profiles_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_programs" ADD CONSTRAINT "faculty_programs_faculty_id_faculty_profiles_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_programs" ADD CONSTRAINT "faculty_programs_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_research_areas" ADD CONSTRAINT "faculty_research_areas_faculty_id_faculty_profiles_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_research_areas" ADD CONSTRAINT "faculty_research_areas_research_area_id_research_areas_id_fk" FOREIGN KEY ("research_area_id") REFERENCES "public"."research_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_campuses" ADD CONSTRAINT "program_campuses_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_campuses" ADD CONSTRAINT "program_campuses_campus_id_campuses_id_fk" FOREIGN KEY ("campus_id") REFERENCES "public"."campuses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_curriculum" ADD CONSTRAINT "program_curriculum_program_id_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_curriculum" ADD CONSTRAINT "program_curriculum_course_id_courses_id_fk" FOREIGN KEY ("course_id") REFERENCES "public"."courses"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "academic_calendar_start_date_idx" ON "academic_calendar_events" USING btree ("start_date");--> statement-breakpoint
CREATE UNIQUE INDEX "campuses_slug_idx" ON "campuses" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "courses_code_idx" ON "courses" USING btree ("code");--> statement-breakpoint
CREATE UNIQUE INDEX "courses_slug_idx" ON "courses" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "courses_department_idx" ON "courses" USING btree ("department_id");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_slug_idx" ON "departments" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "departments_school_name_idx" ON "departments" USING btree ("school_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "faculty_profiles_slug_idx" ON "faculty_profiles" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "faculty_profiles_department_idx" ON "faculty_profiles" USING btree ("department_id");--> statement-breakpoint
CREATE UNIQUE INDEX "program_curriculum_placement_idx" ON "program_curriculum" USING btree ("program_id","semester_number","course_id");--> statement-breakpoint
CREATE UNIQUE INDEX "programs_slug_idx" ON "programs" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "programs_school_idx" ON "programs" USING btree ("school_id");--> statement-breakpoint
CREATE UNIQUE INDEX "programs_department_idx" ON "programs" USING btree ("department_id");--> statement-breakpoint
CREATE UNIQUE INDEX "research_areas_slug_idx" ON "research_areas" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "roles_name_idx" ON "roles" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "schools_slug_idx" ON "schools" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");