import { Request, Response } from "express";
import {
    createClub,
    getClubEvents,
    getClubs,
    getUpcomingevents,
    getClubById,
    getAllEvents,
    addClubAdmin,
    removeClubAdmin,
    getClubAdmins,
    updateClubInfo,
    deleteClubLogo,
    cancelEvent
} from "../services/clubEvents.service.js";
import { createEvent } from "../services/createEvent.service.js";
import {
    cancelEventRegistration,
    getEventRegistrations,
    getStudentActiveRegistration,
    registerStudentForEvent,
    getEventRegistrationsForExport
} from "../services/registerEvent.js";
import { jsonToCsv, generatePdf } from "../lib/export-utils.js";
import { db } from "../lib/db.js";
import { user } from "../models/auth-schema.js";
import { eq } from "drizzle-orm";
import {
    handleClubLogoUrlUpload,
    handleCLubLogoFileUpload,
    handleEventBannerUrlUpload,
    handleEventBannerFileUpload
} from "../services/clubEvents.service.js";
import { uploadEventBannerToCloudinary } from "../services/cloudinary.service.js";

export async function getAdmins(req: Request, res: Response) {
    const { clubId } = req.params;
    const result = await getClubAdmins(parseInt(clubId));
    return res.json(result);
}

export async function addAdmin(req: Request, res: Response) {
    const { clubId, email } = req.body;
    const ownerId = (req as any).user?.id;

    if (!ownerId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const clubIdNumber = Number(clubId);
    if (!clubIdNumber || Number.isNaN(clubIdNumber) || !email) {
        return res.status(400).json({ success: false, message: "clubId and email are required" });
    }

    const result = await addClubAdmin(ownerId, clubIdNumber, email);
    return res.json(result);
}

export async function removeAdmin(req: Request, res: Response) {
    const { clubId, userId } = req.body;
    const ownerId = (req as any).user?.id;

    if (!ownerId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const clubIdNumber = Number(clubId);
    if (!clubIdNumber || Number.isNaN(clubIdNumber) || !userId) {
        return res.status(400).json({ success: false, message: "clubId and userId are required" });
    }

    const result = await removeClubAdmin(ownerId, clubIdNumber, userId);
    return res.json(result);
}

export async function allEvents(req: Request, res: Response) {
    try {
        const result = await getAllEvents();
        return res.json({ data: result });
    } catch (error) {
        return res.json({ message: (error as Error).message });
    }
}

export async function CreateClub(req: Request, res: Response) {
    const { ...clubData } = req.body;

    // Verify email is provided
    if (!clubData.email) {
        return res.status(400).json({ success: false, message: "Email is required to link club to a user" });
    }

    // Look up the user by email to get their ID
    const targetUser = await db.query.user.findFirst({
        where: eq(user.email, clubData.email)
    });

    if (!targetUser) {
        return res.status(404).json({ success: false, message: "User with this email not found. Please ask them to register first." });
    }

    // Use the target user's ID as the authClubId
    const result = await createClub(targetUser.id, clubData);

    return res.json(result);
}

export async function existingClub(req: Request, res: Response) {
    try {
        const { clubId } = req.params;

        if (clubId) {
            const result = await getClubById(parseInt(clubId));
            if (!result) {
                return res.status(404).json({ message: "Club not found" });
            }
            return res.json({ data: result });
        }

        const result = await getClubs();
        return res.json({ data: result })

    } catch (error) {
        return res.json({ message: error.message });
    }

}

export async function UpdateClubInfo(req: Request, res: Response) {
    try {
        const clubId = parseInt(req.params.clubId);
        const clubData = req.body;

        if (!clubId) {
            return res.json({ message: "clubId must be included" });
        }

        const result = await updateClubInfo(clubId, clubData);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message
            });
        }

        return res.json({
            success: true,
            message: result.message
        })

    } catch (error) {
        return res.json({ message: error.message });
    }
}

export async function UploadClubLogo(req: Request, res: Response) {
    try {
        const { clubId } = req.params;

        if (!clubId) {
            return res.json({
                success: false,
                message: "Club Id is required"
            });
        }


        if (req.file) {
            const result = await handleCLubLogoFileUpload(
                parseInt(clubId),
                req.file
            );

            if (!result.success) {
                return res.json(result);
            }

            return res.json(result);
        } else if (req.body.imageUrl) {

            const result = await handleClubLogoUrlUpload(
                parseInt(clubId),
                req.body.imageUrl
            );

            if (!result.success) {
                return res.json(result);
            }

            return res.json(result);
        } else {
            return res.json({
                success: false,
                message: "No file or URL provided"
            });
        }
    } catch (error) {
        console.error("Upload club logo error:", error);

        return res.json({
            success: false,
            message: error.message || "Upload failed"
        });
    }
}

export async function DeleteClubLogo(req: Request, res: Response) {
    try {
        const { clubId } = req.params;

        if (!clubId) {
            return res.json({
                success: false,
                message: "Club Id is required"
            });
        }

        const result = await deleteClubLogo(parseInt(clubId));

        if (!result.success) {
            return res.json(result);
        }

        return res.json(result);
    } catch (error) {
        console.error('Delete club logo error: ', error);
        return res.json({
            success: false,
            message: error.message || 'Deleted failed'
        });
    }
}

export async function clubEvents(req: Request, res: Response) {
    try {
        const { clubId } = req.params;

        if (!clubId) {

            const { clubId: bodyId } = req.body;
            if (bodyId) {

                const result = await getClubEvents(bodyId);
                return res.json({ data: result });
            }
            throw Error("clubId must be included");
        }

        const result = await getClubEvents(parseInt(clubId));

        if (!result) {
            throw Error("No Events yet..")
        }

        return res.json({ data: result });
    } catch (error) {
        return res.json({ message: error.message });
    }
}

export async function CreateEvent(req: Request, res: Response) {
    try {
        const { clubId, ...eventData } = req.body;
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (!clubId || !eventData) {
            throw Error("ClubId and Data are needed");
        }
        const result = await createEvent(userId, parseInt(clubId), eventData);

        return res.json({ data: result });
    } catch (error) {
        return res.json({ message: error.message });
    }
}

export async function upcomingEvents(req: Request, res: Response) {
    try {
        const result = await getUpcomingevents();

        return res.json({ data: result });
    } catch (error) {
        return res.json({ message: error.message });
    }

}

export async function eventRegistration(req: Request, res: Response) {
    try {
        const { eventId } = req.body;
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const eventIdNumber = Number(eventId);
        if (!eventIdNumber || Number.isNaN(eventIdNumber)) {
            throw Error("Event Id is required");
        }

        const result = await registerStudentForEvent(userId, eventIdNumber);

        return res.json({ data: result });

    } catch (error) {
        return res.json({ message: error.message });
    }
}

export async function registeredStudent(req: Request, res: Response) {
    try {
        const { eventId } = req.body;

        if (!eventId) {
            throw Error("Id is required");
        }

        const result = await getEventRegistrations(eventId);

        return res.json({ data: result });

    } catch (error) {
        return res.json({ message: error.message });
    }
}

export async function cancelRegistration(req: Request, res: Response) {
    try {
        const { eventId } = req.body;
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const eventIdNumber = Number(eventId);
        if (!eventIdNumber || Number.isNaN(eventIdNumber)) {
            throw Error("Event Id is required");
        }

        const result = await cancelEventRegistration(userId, eventIdNumber);

        return res.json({ data: result });

    } catch (error) {
        return res.json({ message: error.message });
    }
}

export async function eventEnrollment(req: Request, res: Response) {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            throw Error("Login First");
        }

        const result = await getStudentActiveRegistration(userId);

        return res.json({ data: result });
    } catch (error) {
        return res.json({ message: error.message });
    }
}

export async function UploadEventBanner(req: Request, res: Response) {
    try {
        const { eventId } = req.params;

        if (!eventId) {
            return res.json({
                success: false,
                message: "Event Id is required"
            });
        }

        if (req.file) {
            const result = await handleEventBannerFileUpload(
                parseInt(eventId),
                req.file
            );

            return res.json(result);
        } else if (req.body.imageUrl) {
            const result = await handleEventBannerUrlUpload(
                parseInt(eventId),
                req.body.imageUrl
            );

            return res.json(result);
        } else {
            return res.json({
                success: false,
                message: "No file or URL provided"
            });
        }
    } catch (error: any) {
        console.error("Upload event banner error:", error);
        return res.json({
            success: false,
            message: error.message || "Upload failed"
        });
    }
}

export async function ExportRegisteredStudents(req: Request, res: Response) {
    try {
        const { eventId } = req.params;
        const format = req.query.format as string || 'csv';

        if (!eventId) {
            return res.status(400).json({ success: false, message: "Event Id is required" });
        }

        const { eventTitle, data } = await getEventRegistrationsForExport(parseInt(eventId));

        if (format === 'pdf') {
            const buffer = await generatePdf(
                `Registered Students - ${eventTitle}`,
                `Exported on ${new Date().toLocaleString()}`,
                data
            );
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="registrations_${eventId}.pdf"`);
            return res.send(buffer);
        } else {
            const csv = jsonToCsv(data);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="registrations_${eventId}.csv"`);
            return res.send(csv);
        }
    } catch (error: any) {
        console.error("Export students error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
}

export async function CancelEvent(req: Request, res: Response) {
    try {
        const { eventId } = req.params;
        const authId = (req as any).user?.id;

        if (!eventId) {
            return res.status(400).json({ success: false, message: "Event Id is required" });
        }

        if (!authId) {
            return res.status(401).json({ success: false, message: "Unauthorized: Please login" });
        }

        const result = await cancelEvent(authId, parseInt(eventId));

        if (!result.success) {
            return res.status(result.message.includes("Unauthorized") ? 403 : 400).json(result);
        }

        return res.json(result);

    } catch (error: any) {
        console.error("Cancel event controller error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "An internal error occurred"
        });
    }
}
