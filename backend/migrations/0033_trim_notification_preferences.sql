ALTER TABLE "user"
ALTER COLUMN "notification_preferences"
SET DEFAULT '{"eventReminders":true,"marketplaceAlerts":true,"noticeUpdates":true}'::jsonb;

UPDATE "user"
SET "notification_preferences" = coalesce("notification_preferences", '{}'::jsonb)
  - 'inApp'
  - 'emailDigest'
  - 'soundEffects'
WHERE "notification_preferences" ? 'inApp'
   OR "notification_preferences" ? 'emailDigest'
   OR "notification_preferences" ? 'soundEffects';
