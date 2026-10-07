-- Phase 7 (Admin Portal). Additive only: new tables, one widened check constraint, one trigger.
CREATE TABLE "permissions" (
	"key" varchar(60) PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" uuid NOT NULL,
	"permission_key" varchar(60) NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_key_pk" PRIMARY KEY("role_id","permission_key")
);
--> statement-breakpoint
CREATE TABLE "user_permission_overrides" (
	"user_id" uuid NOT NULL,
	"permission_key" varchar(60) NOT NULL,
	"effect" varchar(5) NOT NULL,
	"reason" text,
	"granted_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_permission_overrides_user_id_permission_key_pk" PRIMARY KEY("user_id","permission_key"),
	CONSTRAINT "permission_override_effect" CHECK ("user_permission_overrides"."effect" in ('allow','deny'))
);
--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_key_permissions_key_fk" FOREIGN KEY ("permission_key") REFERENCES "public"."permissions"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_permission_key_permissions_key_fk" FOREIGN KEY ("permission_key") REFERENCES "public"."permissions"("key") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_permission_overrides" ADD CONSTRAINT "user_permission_overrides_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "permission_override_user_idx" ON "user_permission_overrides" USING btree ("user_id");--> statement-breakpoint
-- Semesters gain an 'archived' status (widening an existing check; no rows change).
ALTER TABLE "semesters" DROP CONSTRAINT "semester_status";--> statement-breakpoint
ALTER TABLE "semesters" ADD CONSTRAINT "semester_status" CHECK ("semesters"."status" in ('upcoming','active','completed','archived'));--> statement-breakpoint
-- Permission catalogue and default grants (idempotent).
INSERT INTO "permissions" ("key","description") VALUES
 ('users.view','View user accounts'),('users.manage','Change account status and revoke sessions'),
 ('students.view','View student records'),('students.manage','Manage student records'),
 ('faculty.view','View faculty records'),('faculty.manage','Manage faculty records'),
 ('academics.view','View academic structure and operations'),('academics.manage','Manage schools, departments, programs, courses, semesters and sections'),
 ('grades.view','View grades and grade history'),('grades.manage','Correct published grades'),
 ('applications.view','View applications'),('applications.manage','Review applications and manage admissions content'),
 ('cms.view','View website content'),('cms.manage','Create, publish and archive website content and notifications'),
 ('finance.view','View fees, invoices and payments'),('finance.manage','Manage fees, invoices and payment records'),
 ('audit.view','View audit logs'),('settings.manage','Manage settings and administrator permissions')
ON CONFLICT ("key") DO NOTHING;--> statement-breakpoint
INSERT INTO "role_permissions" ("role_id","permission_key")
SELECT r."id",p."key" FROM "roles" r CROSS JOIN "permissions" p WHERE r."name" IN ('admin','super_admin')
ON CONFLICT DO NOTHING;--> statement-breakpoint
-- Audit logs are append-only for the application. Only the FK "set null" on actor deletion may update a row,
-- and deletion/truncation requires an explicit controlled maintenance flag set in the same session.
CREATE FUNCTION "audit_logs_guard"() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF current_setting('nova.audit_maintenance', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    IF TG_OP = 'UPDATE' THEN RETURN NEW; END IF;
    RETURN NULL;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.actor_user_id IS NULL AND OLD.actor_user_id IS NOT NULL
       AND NEW.id = OLD.id AND NEW.action = OLD.action
       AND NEW.entity_type IS NOT DISTINCT FROM OLD.entity_type
       AND NEW.entity_id IS NOT DISTINCT FROM OLD.entity_id
       AND NEW.metadata = OLD.metadata AND NEW.created_at = OLD.created_at THEN
      RETURN NEW;
    END IF;
  END IF;
  RAISE EXCEPTION 'audit_logs is append-only' USING ERRCODE = '42501';
END $$;--> statement-breakpoint
CREATE TRIGGER "audit_logs_no_change" BEFORE UPDATE OR DELETE ON "audit_logs" FOR EACH ROW EXECUTE FUNCTION "audit_logs_guard"();--> statement-breakpoint
CREATE TRIGGER "audit_logs_no_truncate" BEFORE TRUNCATE ON "audit_logs" FOR EACH STATEMENT EXECUTE FUNCTION "audit_logs_guard"();
