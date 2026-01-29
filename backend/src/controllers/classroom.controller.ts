import { Request, Response } from "express";
import {
  addTeacherSubject,
  createAssignmentForSubject,
  getStudentProfile,
  getStudentSubjects,
  listFaculties,
  listSubjectsByFaculty,
  listSubmissionsForAssignment,
  listTeacherSubjects,
  submitAssignmentWork,
  upsertStudentProfile,
  gradeSubmission,
  getSubmissionsForExport,
} from "../services/classroom.service.js";
import { jsonToCsv, generatePdf } from "../lib/export-utils.js";

export async function getFaculties(req: Request, res: Response) {
  try {
    const result = await listFaculties();
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getSubjects(req: Request, res: Response) {
  try {
    const facultyId = Number(req.query.facultyId);
    const semester = req.query.semester
      ? Number(req.query.semester)
      : undefined;

    if (!facultyId || Number.isNaN(facultyId)) {
      return res
        .status(400)
        .json({ success: false, message: "facultyId is required" });
    }

    const result = await listSubjectsByFaculty(facultyId, semester);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMyProfile(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const profile = await getStudentProfile(user.id);
    return res.json({ success: true, profile });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function upsertMyProfile(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { facultyId, currentSemester, semesterStartDate, autoAdvance } =
      req.body || {};

    if (!facultyId) {
      return res
        .status(400)
        .json({ success: false, message: "facultyId is required" });
    }

    const result = await upsertStudentProfile(user.id, {
      facultyId: Number(facultyId),
      currentSemester: currentSemester ? Number(currentSemester) : undefined,
      semesterStartDate,
      autoAdvance,
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getMySubjects(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const result = await getStudentSubjects(user.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getTeacherSubjects(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const result = await listTeacherSubjects(user.id);
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function addSubjectForTeacher(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { subjectId, teacherId } = req.body || {};

    if (!subjectId) {
      return res
        .status(400)
        .json({ success: false, message: "subjectId is required" });
    }

    const result = await addTeacherSubject(
      user.id,
      Number(subjectId)
    );
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function createAssignment(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { subjectId, title, description, type, dueAt } = req.body || {};

    if (!subjectId || !title) {
      return res.status(400).json({
        success: false,
        message: "subjectId and title are required",
      });
    }

    const result = await createAssignmentForSubject(
      user.id,
      Number(subjectId),
      { title, description, type, dueAt }
    );

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function submitAssignment(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { assignmentId } = req.params;
    const { comment } = req.body || {};

    if (user.role !== "student") {
      return res.status(403).json({
        success: false,
        message: "Only students can submit assignments",
      });
    }

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: "assignmentId is required",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Submission file is required",
      });
    }

    const result = await submitAssignmentWork(
      Number(assignmentId),
      user.id,
      req.file as Express.Multer.File,
      comment
    );

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function getAssignmentSubmissions(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { assignmentId } = req.params;

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: "assignmentId is required",
      });
    }

    const result = await listSubmissionsForAssignment(
      Number(assignmentId),
      user.id,
      user.role === "admin"
    );
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function gradeStudentSubmission(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { submissionId } = req.params;
    const { status, feedback } = req.body || {};

    if (!submissionId || !status) {
      return res.status(400).json({
        success: false,
        message: "submissionId and status are required",
      });
    }

    const result = await gradeSubmission(
      Number(submissionId),
      user.id,
      { status, feedback }
    );

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

export async function ExportAssignmentSubmissions(req: Request, res: Response) {
  try {
    const user = (req as any).user;
    const { assignmentId } = req.params;
    const format = req.query.format as string || 'csv';

    if (!assignmentId) {
      return res.status(400).json({
        success: false,
        message: "assignmentId is required",
      });
    }

    const { assignmentTitle, subjectTitle, data } = await getSubmissionsForExport(
      Number(assignmentId),
      user.id
    );

    if (format === 'pdf') {
      const buffer = await generatePdf(
        `Submissions: ${assignmentTitle}`,
        `Subject: ${subjectTitle} | Exported on ${new Date().toLocaleString()}`,
        data
      );
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="submissions_${assignmentId}.pdf"`);
      return res.send(buffer);
    } else {
      const csv = jsonToCsv(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="submissions_${assignmentId}.csv"`);
      return res.send(csv);
    }
  } catch (error: any) {
    console.error("Export submissions error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}
