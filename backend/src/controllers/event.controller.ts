
import { Request, Response } from "express";
import { createClub, getClubEvents, getClubs, getUpcomingevents, getClubById, getAllEvents } from "../services/clubEvents.service.js";
import { createEvent } from "../services/createEvent.service.js";
import { cancelEventRegistration, getEventRegistrations, getStudentActiveRegistration, registerStudentForEvent } from "../services/registerEvent.js";




export async function allEvents(req: Request, res: Response) {
    try {
        const result = await getAllEvents();
        return res.json({ data: result });
    } catch (error) {
        return res.json({ message: (error as Error).message });
    }
}

export async function CreateClub(req: Request, res: Response) {
    const { authClubId, ...clubData } = req.body;

    const result = await createClub(authClubId, clubData);

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
        const { authId, ...eventData } = req.body;

        console.log(eventData);
        if (!authId || !eventData) {
            throw Error("Id and Data are needed");
        }
        const result = await createEvent(authId, eventData);

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
        const registerData = req.body;

        if (!registerData) {
            throw Error("Id's are required");
        }

        const result = await registerStudentForEvent(registerData);

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
        const eventDetail = req.body;

        if (!eventDetail) {
            throw Error("Detail is required");
        }

        const result = await cancelEventRegistration(eventDetail);

        return res.json({ data: result });

    } catch (error) {
        return res.json({ message: error.message });
    }
}

export async function eventEnrollment(req: Request, res: Response) {
    try {
        const { authStudentId } = req.body;

        if (!authStudentId) {
            throw Error("Login First");
        }

        const result = await getStudentActiveRegistration(authStudentId);

        return res.json({ data: result });
    } catch (error) {
        return res.json({ message: error.message });
    }
}


