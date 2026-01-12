DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS registration_status CASCADE;


CREATE TYPE "public"."event_status" AS ENUM('draft', 'published', 'ongoing', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('registered', 'attended', 'cancelled', 'waitlisted');--> statement-breakpoint
CREATE TABLE "clubs" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_club_id" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"email" varchar(255) NOT NULL,
	"logo_url" varchar(500),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "clubs_auth_club_id_unique" UNIQUE("auth_club_id")
);
--> statement-breakpoint
CREATE TABLE "event_registrations" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"event_id" integer NOT NULL,
	"status" "registration_status" DEFAULT 'registered' NOT NULL,
	"registered_at" timestamp DEFAULT now() NOT NULL,
	"attended_at" timestamp,
	"cancelled_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" serial PRIMARY KEY NOT NULL,
	"club_id" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"event_type" varchar(50) NOT NULL,
	"status" "event_status" DEFAULT 'draft' NOT NULL,
	"venue" varchar(255),
	"max_participants" integer,
	"registration_deadline" timestamp NOT NULL,
	"event_start_time" timestamp NOT NULL,
	"event_end_time" timestamp NOT NULL,
	"banner_url" varchar(500),
	"current_participants" integer DEFAULT 0 NOT NULL,
	"is_registration_open" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_student_id" varchar(255) NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"email" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "students_auth_student_id_unique" UNIQUE("auth_student_id")
);
--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_student_id_students_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_club_id_clubs_id_fk" FOREIGN KEY ("club_id") REFERENCES "public"."clubs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "clubs_email_idx" ON "clubs" USING btree ("email");--> statement-breakpoint
CREATE INDEX "clubs_name_idx" ON "clubs" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "clubs_auth_club_id_idx" ON "clubs" USING btree ("auth_club_id");--> statement-breakpoint
CREATE UNIQUE INDEX "unique_student_event_idx" ON "event_registrations" USING btree ("student_id","event_id");--> statement-breakpoint
CREATE INDEX "event_registrations_student_id_idx" ON "event_registrations" USING btree ("student_id");--> statement-breakpoint
CREATE INDEX "event_registrations_event_id_idx" ON "event_registrations" USING btree ("event_id");--> statement-breakpoint
CREATE INDEX "event_registrations_status_idx" ON "event_registrations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "event_registrations_registered_at_idx" ON "event_registrations" USING btree ("registered_at");--> statement-breakpoint
CREATE UNIQUE INDEX "students_auth_student_id_idx" ON "students" USING btree ("auth_student_id");