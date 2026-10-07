-- Phase 7.1 (additive): invoices can be drafted before being issued. Existing rows default to false, i.e. remain issued.
ALTER TABLE "student_invoices" ADD COLUMN "is_draft" boolean DEFAULT false NOT NULL;
