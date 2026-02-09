ALTER TABLE "user"
ALTER COLUMN "notification_preferences"
SET DEFAULT '{"eventReminders":true,"marketplaceAlerts":true,"noticeUpdates":true,"classroomAlerts":true,"chatAlerts":true,"adminAlerts":true}'::jsonb;

UPDATE "user"
SET "notification_preferences" = coalesce("notification_preferences", '{}'::jsonb)
  - 'inApp'
  - 'emailDigest'
  - 'soundEffects'
  || '{"classroomAlerts":true,"chatAlerts":true,"adminAlerts":true}'::jsonb
WHERE "notification_preferences" IS NULL
   OR "notification_preferences" ? 'inApp'
   OR "notification_preferences" ? 'emailDigest'
   OR "notification_preferences" ? 'soundEffects'
   OR NOT ("notification_preferences" ? 'classroomAlerts')
   OR NOT ("notification_preferences" ? 'chatAlerts')
   OR NOT ("notification_preferences" ? 'adminAlerts');
