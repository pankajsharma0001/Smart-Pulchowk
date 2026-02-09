import { and, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { db } from "../lib/db.js";
import { assignments, studentProfiles, subjects, submissions } from "../models/classroom-schema.js";
import { events } from "../models/event-schema.js";
import {
  createInAppNotificationForAudience,
  hasNotificationByReminderKey,
} from "./inAppNotification.service.js";
import { sendToUser } from "./notification.service.js";

async function sendEventRegistrationDeadlineReminders() {
  const now = new Date();
  const dayAheadStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const dayAheadEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const candidates = await db.query.events.findMany({
    where: and(
      isNull(events.status),
      eq(events.isRegistrationOpen, true),
      gte(events.registrationDeadline, dayAheadStart),
      lt(events.registrationDeadline, dayAheadEnd),
    ),
    columns: {
      id: true,
      clubId: true,
      title: true,
      registrationDeadline: true,
      bannerUrl: true,
    },
  });

  for (const event of candidates) {
    const reminderKey = `event-registration-deadline:${event.id}:24h`;
    const alreadySent = await hasNotificationByReminderKey({
      type: "event_registration_deadline",
      reminderKey,
    });
    if (alreadySent) continue;

    await createInAppNotificationForAudience({
      audience: "all",
      type: "event_registration_deadline",
      title: "Registration closing soon",
      body: `"${event.title}" closes registration in about 24 hours.`,
      data: {
        eventId: event.id,
        clubId: event.clubId,
        eventTitle: event.title,
        reminderKey,
        iconKey: "event",
        ...(event.bannerUrl ? { thumbnailUrl: event.bannerUrl } : {}),
      },
    });
  }
}

async function sendAssignmentDeadlineReminders() {
  const now = new Date();
  const dayAheadStart = new Date(now.getTime() + 23 * 60 * 60 * 1000);
  const dayAheadEnd = new Date(now.getTime() + 25 * 60 * 60 * 1000);

  const dueSoonAssignments = await db
    .select({
      assignmentId: assignments.id,
      assignmentTitle: assignments.title,
      dueAt: assignments.dueAt,
      subjectId: assignments.subjectId,
      subjectTitle: subjects.title,
      facultyId: subjects.facultyId,
      semesterNumber: subjects.semesterNumber,
    })
    .from(assignments)
    .innerJoin(subjects, eq(subjects.id, assignments.subjectId))
    .where(
      and(
        sql`${assignments.dueAt} is not null`,
        gte(assignments.dueAt, dayAheadStart),
        lt(assignments.dueAt, dayAheadEnd),
      ),
    );

  for (const assignment of dueSoonAssignments) {
    const students = await db.query.studentProfiles.findMany({
      where: and(
        eq(studentProfiles.facultyId, assignment.facultyId),
        eq(studentProfiles.currentSemester, assignment.semesterNumber),
      ),
      columns: { userId: true },
    });

    for (const student of students) {
      const submitted = await db.query.submissions.findFirst({
        where: and(
          eq(submissions.assignmentId, assignment.assignmentId),
          eq(submissions.studentId, student.userId),
        ),
        columns: { id: true },
      });
      if (submitted) continue;

      const reminderKey = `assignment-deadline:${assignment.assignmentId}:${student.userId}:24h`;
      const alreadySent = await hasNotificationByReminderKey({
        type: "assignment_deadline",
        userId: student.userId,
        reminderKey,
      });
      if (alreadySent) continue;

      await sendToUser(student.userId, {
        title: "Assignment due soon",
        body: `"${assignment.assignmentTitle}" is due in about 24 hours.`,
        data: {
          type: "assignment_deadline",
          assignmentId: assignment.assignmentId.toString(),
          subjectId: assignment.subjectId.toString(),
          subjectTitle: assignment.subjectTitle,
          assignmentTitle: assignment.assignmentTitle,
          dueAt: assignment.dueAt?.toISOString() ?? "",
          reminderKey,
          iconKey: "classroom",
        },
      });
    }
  }
}

export async function runNotificationReminderJobs() {
  try {
    await sendEventRegistrationDeadlineReminders();
    await sendAssignmentDeadlineReminders();
  } catch (error) {
    console.error("Notification reminder jobs failed:", error);
  }
}

export function startNotificationReminderJobs() {
  void runNotificationReminderJobs();
  setInterval(() => {
    void runNotificationReminderJobs();
  }, 15 * 60 * 1000);
}
