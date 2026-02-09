ALTER TABLE "user"
ADD COLUMN IF NOT EXISTS "notification_preferences" jsonb DEFAULT '{"inApp":true,"emailDigest":false,"eventReminders":true,"marketplaceAlerts":true,"noticeUpdates":true,"soundEffects":false}'::jsonb NOT NULL;
