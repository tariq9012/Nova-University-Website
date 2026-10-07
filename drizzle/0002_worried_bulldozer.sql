CREATE TABLE "department_research_areas" (
	"department_id" uuid NOT NULL,
	"research_area_id" uuid NOT NULL,
	CONSTRAINT "department_research_areas_department_id_research_area_id_pk" PRIMARY KEY("department_id","research_area_id")
);
--> statement-breakpoint
CREATE TABLE "faculty_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"faculty_id" uuid NOT NULL,
	"title" text NOT NULL,
	"venue" text,
	"publication_year" integer,
	"url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "school_research_areas" (
	"school_id" uuid NOT NULL,
	"research_area_id" uuid NOT NULL,
	CONSTRAINT "school_research_areas_school_id_research_area_id_pk" PRIMARY KEY("school_id","research_area_id")
);
--> statement-breakpoint
ALTER TABLE "departments" ADD COLUMN "head_id" uuid;--> statement-breakpoint
ALTER TABLE "faculty_profiles" ADD COLUMN "faculty_type" varchar(80);--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "application_deadline" date;--> statement-breakpoint
ALTER TABLE "programs" ADD COLUMN "tuition_information" text;--> statement-breakpoint
ALTER TABLE "schools" ADD COLUMN "dean_id" uuid;--> statement-breakpoint
ALTER TABLE "department_research_areas" ADD CONSTRAINT "department_research_areas_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "public"."departments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "department_research_areas" ADD CONSTRAINT "department_research_areas_research_area_id_research_areas_id_fk" FOREIGN KEY ("research_area_id") REFERENCES "public"."research_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "faculty_publications" ADD CONSTRAINT "faculty_publications_faculty_id_faculty_profiles_id_fk" FOREIGN KEY ("faculty_id") REFERENCES "public"."faculty_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_research_areas" ADD CONSTRAINT "school_research_areas_school_id_schools_id_fk" FOREIGN KEY ("school_id") REFERENCES "public"."schools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "school_research_areas" ADD CONSTRAINT "school_research_areas_research_area_id_research_areas_id_fk" FOREIGN KEY ("research_area_id") REFERENCES "public"."research_areas"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "faculty_publications_faculty_idx" ON "faculty_publications" USING btree ("faculty_id");--> statement-breakpoint
CREATE UNIQUE INDEX "faculty_publications_unique" ON "faculty_publications" USING btree ("faculty_id","title");--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_id_faculty_profiles_id_fk" FOREIGN KEY ("head_id") REFERENCES "public"."faculty_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "schools" ADD CONSTRAINT "schools_dean_id_faculty_profiles_id_fk" FOREIGN KEY ("dean_id") REFERENCES "public"."faculty_profiles"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "academic_calendar_events" ADD CONSTRAINT "calendar_dates_order" CHECK ("academic_calendar_events"."end_date" is null or "academic_calendar_events"."end_date" >= "academic_calendar_events"."start_date");--> statement-breakpoint
ALTER TABLE "programs" ADD CONSTRAINT "programs_duration_positive" CHECK ("programs"."duration_years" > 0);