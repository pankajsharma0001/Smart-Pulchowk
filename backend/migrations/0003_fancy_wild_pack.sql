ALTER TABLE "students" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
TRUNCATE TABLE "event_registrations" CASCADE;--> statement-breakpoint
DROP TABLE "students" CASCADE;--> statement-breakpoint
ALTER TABLE "event_registrations" DROP CONSTRAINT IF EXISTS "event_registrations_student_id_students_id_fk";
--> statement-breakpoint
DROP INDEX "unique_student_event_idx";--> statement-breakpoint
DROP INDEX "event_registrations_student_id_idx";--> statement-breakpoint
ALTER TABLE "event_registrations" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "unique_user_event_idx" ON "event_registrations" USING btree ("user_id","event_id");--> statement-breakpoint
CREATE INDEX "event_registrations_user_id_idx" ON "event_registrations" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "event_registrations" DROP COLUMN "student_id";