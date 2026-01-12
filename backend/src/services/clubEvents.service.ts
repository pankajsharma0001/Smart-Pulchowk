import { createClubInput } from "../types/events.js";
import { db } from "../lib/db.js";
import { clubs, eventRegistrations, events } from "../models/event-schema.js";
import { desc, eq, sql, and, or, asc } from "drizzle-orm";

export async function createClub(authClubId: string, clubData: createClubInput) {
    try {
        if (!clubData) {
            throw Error('Request body is missing');
        }

        if (!clubData.name || clubData.name.trim().length === 0) {
            throw new Error("Club name is required");
        }

        if (!clubData.email) {
            throw new Error("Valid email is required");
        }

        const existingClub = await db.query.clubs.findFirst({
            where: or(
                eq(clubs.authClubId, authClubId),
                eq(clubs.email, clubData.email)
            ),
        });

        if (existingClub) {
            throw new Error("Club already registered in getSystem")
        }

        const [newclub] = await db.insert(clubs).values({
            authClubId: authClubId,
            name: clubData.name,
            description: clubData.description,
            email: clubData.email,
            logoUrl: clubData.logoUrl,
            isActive: true,
        }).returning();

        return {
            success: true,
            club: newclub,
            message: 'Club creatd successfully',
        };
    } catch (error) {
        return {
            success: false,
            message: error.message
        }
    }
}

export async function getClubs() {
    try {
        const existingClub = await db.query.clubs.findMany({
            where: eq(clubs.isActive, true),
            orderBy: [asc(clubs.name)],
            columns: {
                id: true,
                authClubId: true,
                name: true,
                description: true,
                logoUrl: true,
            },
        });

        return {
            success: true,
            existingClub
        }
    } catch (error) {
        return {
            success: false,
            message: error.message
        }
    }
}

export async function getClubById(clubId: number) {
    try {
        const [clubData] = await db
            .select({
                id: clubs.id,
                authClubId: clubs.authClubId,
                name: clubs.name,
                description: clubs.description,
                email: clubs.email,
                logoUrl: clubs.logoUrl,
                isActive: clubs.isActive,
                createdAt: clubs.createdAt,
                upcomingEvents: sql <number>`
                    COUNT(DISTINCT CASE
                    WHEN ${events.status} = 'draft' 
                    AND ${events.eventStartTime} > NOW()
                    THEN ${events.id}
                    END)`,
                completedEvents: sql<number>`
        COUNT(DISTINCT CASE 
          WHEN ${events.status} = 'completed' 
          THEN ${events.id} 
        END)
      `,
                totalParticipants: sql<number>`
        COALESCE(SUM(${events.currentParticipants}), 0)
      `,
            }).from(clubs)
            .leftJoin(events, eq(events.clubId, clubs.id))
            .where(and(
                eq(clubs.id, clubId),
                eq(clubs.isActive, true)
            ))
            .groupBy(clubs.id)

        if (!clubData) {
            return null;
        }

        return {
            success: true,
            clubData
        }
    } catch (error) {
        return {
            success: false,
            message: error.message
        }
    }
}


export async function getClubEvents(clubId: number) {

    try {
        const club = await db.query.clubs.findFirst({
            where: eq(clubs.id, clubId),
        });

        if (!club) {
            throw new Error('Club not found');
        }

        const clubEvents = await db.query.events.findMany({
            where: eq(events.clubId, club.id),
            orderBy: [desc(events.eventStartTime)]
        });

        if (clubEvents.length === 0) {

            return {
                success: true,
                message: "No events yet",
                clubEvents: [],
            };
        }

        return {
            success: true,
            clubEvents,
            message: "successful"
        }

    } catch (error) {
        return {
            success: false,
            message: error.message
        }
    }
}

export async function getUpcomingevents() {
    try {
        const now = new Date();

        const upcomingEvents = await db.query.events.findMany({
            where: and(
                eq(events.status, 'published'),
                sql`${events.eventStartTime} > ${now}`,
                eq(events.isRegistrationOpen, true)
            ),
            with: {
                club: true,
            },
            orderBy: [events.eventStartTime],
            limit: 20
        });

        if (upcomingEvents.length === 0) {
            return {
                success: true,
                message: "No events yet",
                upcomingEvents: [],
            }
        }

        return {
            success: true,
            upcomingEvents
        }
    } catch (error) {
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

export async function getAllEvents() {
    try {
        const allEvents = await db.query.events.findMany({
            with: {
                club: true,
            },
            orderBy: [desc(events.eventStartTime)],
            limit: 100
        });

        if (allEvents.length === 0) {
            return {
                success: true,
                message: "No events found",
                allEvents: [],
            }
        }

        return {
            success: true,
            allEvents
        }
    } catch (error) {
        return {
            success: false,
            message: (error as Error).message
        }
    }
}