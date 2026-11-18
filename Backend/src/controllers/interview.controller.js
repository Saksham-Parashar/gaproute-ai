const mongoose = require("mongoose");
const pdfParse = require("pdf-parse");
const {
  generateInterviewReport,
  generateResumePdf,
} = require("../services/ai.service");
const interviewReportModel = require("../models/interviewReport.model");

/**
 * Helper to safely extract plain text from an uploaded PDF buffer
 * (supports both pdf-parse v2 PDFParse class and v1 function exports)
 */
async function extractTextFromPdfBuffer(buffer) {
  if (pdfParse.PDFParse) {
    const parser = new pdfParse.PDFParse(Uint8Array.from(buffer));
    try {
      const data = await parser.getText();
      return data?.text || "";
    } finally {
      if (typeof parser.destroy === "function") {
        await parser.destroy();
      }
    }
  }

  if (typeof pdfParse === "function") {
    const data = await pdfParse(buffer);
    return data?.text || "";
  }

  throw new Error("Unsupported pdf-parse module format");
}

/**
 * @description Controller to generate interview report based on required resume PDF, job description, and self description.
 */
async function generateInterViewReportController(req, res) {
  try {
    const { selfDescription, jobDescription } = req.body;

    if (!req.file) {
      return res.status(400).json({
        message: "Please upload your resume as a PDF file.",
      });
    }

    if (req.file.mimetype !== "application/pdf") {
      return res.status(400).json({
        message: "Invalid file format. Only PDF files are allowed.",
      });
    }

    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({
        message: "Job description is required.",
      });
    }

    if (!selfDescription || !selfDescription.trim()) {
      return res.status(400).json({
        message: "Self description is required.",
      });
    }

    const resumeText = await extractTextFromPdfBuffer(req.file.buffer);

    if (!resumeText.trim()) {
      return res.status(400).json({
        message:
          "Could not extract text from the uploaded PDF. Please upload a text-based PDF (not a scanned image).",
      });
    }

    const interViewReportByAi = await generateInterviewReport({
      resume: resumeText,
      selfDescription: selfDescription.trim(),
      jobDescription: jobDescription.trim(),
    });

    const interviewReport = await interviewReportModel.create({
      user: req.user.id,
      resume: resumeText,
      selfDescription: selfDescription.trim(),
      jobDescription: jobDescription.trim(),
      ...interViewReportByAi,
    });

    return res.status(201).json({
      message: "Interview report generated successfully.",
      interviewReport,
    });
  } catch (error) {
    console.error("Error in generateInterViewReportController:", error);
    return res.status(500).json({
      message: error.message || "Failed to generate interview report.",
    });
  }
}

/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {
  try {
    const interviewId = req.params.interviewId || req.params.id;

    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      return res.status(400).json({
        message: "Invalid interview report ID.",
      });
    }

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewId,
      user: req.user.id,
    });

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found.",
      });
    }

    return res.status(200).json({
      message: "Interview report fetched successfully.",
      interviewReport,
    });
  } catch (error) {
    console.error("Error in getInterviewReportByIdController:", error);
    return res.status(500).json({
      message: "Failed to fetch interview report.",
    });
  }
}

/**
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
  try {
    const interviewReports = await interviewReportModel
      .find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select(
        "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan",
      );

    return res.status(200).json({
      message: "Interview reports fetched successfully.",
      interviewReports,
    });
  } catch (error) {
    console.error("Error in getAllInterviewReportsController:", error);
    return res.status(500).json({
      message: "Failed to fetch interview reports.",
    });
  }
}

/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
  try {
    const interviewReportId =
      req.params.interviewReportId || req.params.interviewId || req.params.id;

    if (!mongoose.Types.ObjectId.isValid(interviewReportId)) {
      return res.status(400).json({
        message: "Invalid interview report ID.",
      });
    }

    const interviewReport = await interviewReportModel.findOne({
      _id: interviewReportId,
      user: req.user.id,
    });

    if (!interviewReport) {
      return res.status(404).json({
        message: "Interview report not found.",
      });
    }

    const { resume, jobDescription, selfDescription } = interviewReport;

    const pdfBuffer = await generateResumePdf({
      resume,
      jobDescription,
      selfDescription,
    });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`,
    });

    return res.send(pdfBuffer);
  } catch (error) {
    console.error("Error in generateResumePdfController:", error);
    return res.status(500).json({
      message: error.message || "Failed to generate resume PDF.",
    });
  }
}

module.exports = {
  generateInterViewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController,
  generateResumePdfController,
};
