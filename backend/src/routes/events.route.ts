import express from "express";
import { CreateClub, CreateEvent, allEvents, cancelRegistration, clubEvents, eventEnrollment, eventRegistration, existingClub, registeredStudent, upcomingEvents } from "../controllers/event.controller.js";


const router = express.Router();

router.post("/create-club", CreateClub);
router.get("/clubs", existingClub);
router.get("/clubs/:clubId", existingClub);
router.get("/events/:clubId", clubEvents);
router.post("/create-event", CreateEvent)
router.get("/get-upcoming-events", upcomingEvents);
router.get("/all-events", allEvents);
router.post("/register-event", eventRegistration);
router.post("/registered-student", registeredStudent);
router.post("/cancel-registration", cancelRegistration);
router.post("/enrollment", eventEnrollment);


export default router;