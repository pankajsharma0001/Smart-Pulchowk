import express from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  GetNotifications,
  GetNotificationPreferences,
  GetUnreadCount,
  MarkAllNotificationsRead,
  MarkNotificationRead,
  UpdateNotificationPreferences,
} from "../controllers/inAppNotification.controller.js";

const router = express.Router();

router.get("/", requireAuth, GetNotifications);
router.get("/unread-count", requireAuth, GetUnreadCount);
router.get("/preferences", requireAuth, GetNotificationPreferences);
router.put("/preferences", requireAuth, UpdateNotificationPreferences);
router.patch("/:id/read", requireAuth, MarkNotificationRead);
router.post("/mark-all-read", requireAuth, MarkAllNotificationsRead);

export default router;
