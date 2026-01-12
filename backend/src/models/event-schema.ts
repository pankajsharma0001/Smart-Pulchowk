import { pgTable, serial, varchar, text, timestamp, integer, boolean, pgEnum, uniqueIndex, index, check } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';


export const eventStatusEnum = pgEnum('event_status', [
  'draft',
  'published',
  'ongoing',
  'completed',
  'cancelled'
]);

export const registrationStatusEnum = pgEnum('registration_status', [
  'registered',
  'attended',
  'cancelled',
  'waitlisted'
]);


export const clubs = pgTable('clubs', {
  id: serial('id').primaryKey(),

  authClubId: varchar('auth_club_id', { length: 255 }).notNull().unique(),

  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  email: varchar('email', { length: 255 }).notNull(),
  logoUrl: varchar('logo_url', { length: 500 }),
  isActive: boolean('is_active').default(true).notNull(),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: uniqueIndex('clubs_email_idx').on(table.email),
  nameIdx: index('clubs_name_idx').on(table.name),
  authClubIdIdx: uniqueIndex('clubs_auth_club_id_idx').on(table.authClubId),
}));


export const students = pgTable('students', {
  id: serial('id').primaryKey(),


  authStudentId: varchar('auth_student_id', { length: 255 }).notNull().unique(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  authStudentIdIdx: uniqueIndex('students_auth_student_id_idx').on(table.authStudentId),
}));


export const events = pgTable('events', {
  id: serial('id').primaryKey(),
  clubId: integer('club_id').notNull().references(() => clubs.id, { onDelete: 'restrict' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  eventType: varchar('event_type', { length: 50 }).notNull(),
  status: eventStatusEnum('status').default('draft').notNull(),
  venue: varchar('venue', { length: 255 }),
  maxParticipants: integer('max_participants'),
  registrationDeadline: timestamp('registration_deadline', { mode: 'date' }).notNull(),
  eventStartTime: timestamp('event_start_time', { mode: 'date' }).notNull(),
  eventEndTime: timestamp('event_end_time', { mode: 'date' }).notNull(),

  bannerUrl: varchar('banner_url', { length: 500 }),
  currentParticipants: integer('current_participants').default(0).notNull(),
  isRegistrationOpen: boolean('is_registration_open').default(true).notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const eventRegistrations = pgTable('event_registrations', {
  id: serial('id').primaryKey(),

  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),

  status: registrationStatusEnum('status').default('registered').notNull(),

  registeredAt: timestamp('registered_at').defaultNow().notNull(),
  attendedAt: timestamp('attended_at'),
  cancelledAt: timestamp('cancelled_at'),
  
  notes: text('notes'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({

  uniqueStudentEvent: uniqueIndex('unique_student_event_idx').on(table.studentId, table.eventId),

  studentIdIdx: index('event_registrations_student_id_idx').on(table.studentId),
  eventIdIdx: index('event_registrations_event_id_idx').on(table.eventId),
  statusIdx: index('event_registrations_status_idx').on(table.status),
  registeredAtIdx: index('event_registrations_registered_at_idx').on(table.registeredAt),
}));


export const clubsRelations = relations(clubs, ({ many }) => ({
  events: many(events),
}));

export const studentsRelations = relations(students, ({ many }) => ({
  eventRegistrations: many(eventRegistrations),

}));

export const eventsRelations = relations(events, ({ one, many }) => ({
  club: one(clubs, {
    fields: [events.clubId],
    references: [clubs.id],
  }),
  registrations: many(eventRegistrations),
}));

export const eventRegistrationsRelations = relations(eventRegistrations, ({ one }) => ({
  student: one(students, {
    fields: [eventRegistrations.studentId],
    references: [students.id],
  }),
  event: one(events, {
    fields: [eventRegistrations.eventId],
    references: [events.id],
  }),
}));



