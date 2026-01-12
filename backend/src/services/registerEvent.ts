import { registerStudentForEventInput } from "../types/events.js";
import { db } from "../lib/db.js";
import { eq, sql, desc, and } from "drizzle-orm";
import { eventRegistrations, events, students } from "../models/event-schema.js";

export async function registerStudentForEvent(registerData: registerStudentForEventInput) {
    const { authStudentId, eventId } = registerData;

    try {
        const student = await db.query.students.findFirst({
            where: eq(students.authStudentId, authStudentId),
        });

        if (!student) {
            throw new Error('Student not found in the system');
        }

        const event = await db.query.events.findFirst({
            where: eq(events.id,  eventId),
        })

        if (!event) {
            throw new Error('Event not found');
        }

        if (!event.isRegistrationOpen) {
            throw new Error('Registration is closed for this event');
        }

        if (event.maxParticipants && event.currentParticipants >= event.maxParticipants) {
            throw new Error('Event is full');
        }

        if (event.registrationDeadline && new Date() > event.registrationDeadline) {
            throw new Error('Registration deadline has passed');
        }

        const existingRegistration = await db.query.eventRegistrations.findFirst({
            where: and(
                eq(eventRegistrations.studentId, student.id),
                eq(eventRegistrations.eventId, event.id) 
            )
        });

        let registration;

        if (existingRegistration) {
            if (existingRegistration.status === "cancelled") {
                registration = await db.update(eventRegistrations)
                    .set({
                        status: "registered",
                        registeredAt: new Date(),
                        cancelledAt: null,
                        updatedAt: new Date(),
                    })
                    .where(eq(eventRegistrations.id, existingRegistration.id))
                    .returning();
            } else {
                throw new Error('You are already registered for this event');
            }
        } else {

            registration = await db.insert(eventRegistrations).values({
                studentId: student.id,
                eventId: eventId,
                status: 'registered',
            }).returning();
        }

        await db.update(events)
            .set({
                currentParticipants: sql`${events.currentParticipants} + 1`,
                updatedAt: new Date(),
            })
            .where(eq(events.id, eventId));

        return {
            success: true,
            registration,
            message: 'Successfully registered for event',
        };

    } catch (error) {
        return {
            success: false,
            message: error.message
        }
    }
}

export async function getEventRegistrations(eventId: number) {
    const registrations = await db.query.eventRegistrations.findMany({
        where: eq(eventRegistrations.eventId, eventId),
        with: {
            student: true,
        },
        orderBy: [desc(eventRegistrations.registeredAt)],
    });

    if (registrations.length === 0) {
        return {
            success: true,
            message: "No registrations yet..",
            registrations: []
        }
    }

    return registrations.map(reg => ({
        registrationId: reg.id,
        status: reg.status,
        registeredAt: reg.registeredAt,
        attendedAt: reg.attendedAt,
        student: {
            id: reg.student.id,
            name: reg.student.lastName,
            first_name: reg.student.firstName,
            last_name: reg.student.lastName,
            email: reg.student.email,
        }
    }));
}

export async function cancelEventRegistration(registerData: registerStudentForEventInput) {
    const { authStudentId, eventId } = registerData;

    try {
        const student = await db.query.students.findFirst({
            where: eq(students.authStudentId, authStudentId),
        });

        if (!student) {
            throw new Error('Student not found');
        }

        await db.update(eventRegistrations)
            .set({
                status: 'cancelled',
                cancelledAt: new Date(),
                updatedAt: new Date(),
            })
            .where(
                and(
                    eq(eventRegistrations.studentId, student.id),
                    eq(eventRegistrations.eventId, eventId),
                    eq(eventRegistrations.status, 'registered')
                )
            );

        await db.update(events)
            .set({
                currentParticipants: sql`Greatest(${events.currentParticipants} - 1, 0)`,
                updatedAt: new Date(),
            })
            .where(eq(events.id, eventId));

        return {
            success: true,
            message: 'Registration cancelled successfully'
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        }
    }
}

export async function getStudentActiveRegistration(authStudentId: string) {
    try {
        const student = await db.query.students.findFirst({
            where: eq(students.authStudentId, authStudentId),
        });

        if (!student) {
            return {
                success: false,
                message: "student not found"
            };
        }

        const registration = await db.query.eventRegistrations.findFirst({
            where: and(
                eq(eventRegistrations.studentId, student.id),
                eq(eventRegistrations.status, 'registered')
            ),
            with: {
                event: {
                    with: {
                        club: true,
                    },
                },
            },
        });

        if (!registration) {
            return {
                success: false,
                message: 'No active registration found for this student',
            };
        }

        return {
            success: true,
            registration,
        };

    } catch (error) {
        return {
            success: false,
            message: error.message
        }
    }
}