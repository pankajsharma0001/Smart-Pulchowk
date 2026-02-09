CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint

-- Legacy indexes referencing dropped columns from old notice schema.
DROP INDEX IF EXISTS "notice_section_subsection_created_idx";--> statement-breakpoint
DROP INDEX IF EXISTS "notice_content_trgm_idx";--> statement-breakpoint

-- Fast category feed and cursor pagination scans.
CREATE INDEX IF NOT EXISTS "notice_category_created_id_idx"
ON "notice" USING btree ("category", "created_at" DESC, "id" DESC);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "notice_category_level_created_id_idx"
ON "notice" USING btree ("category", "level", "created_at" DESC, "id" DESC);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "notice_created_id_idx"
ON "notice" USING btree ("created_at" DESC, "id" DESC);--> statement-breakpoint

-- Accelerate ILIKE title search.
CREATE INDEX IF NOT EXISTS "notice_title_trgm_idx"
ON "notice" USING gin ("title" gin_trgm_ops);
