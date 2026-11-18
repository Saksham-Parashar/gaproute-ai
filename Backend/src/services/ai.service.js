const { GoogleGenAI } = require("@google/genai");
const { z } = require("zod");
const { zodToJsonSchema } = require("zod-to-json-schema");
const puppeteer = require("puppeteer");

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY,
});

const MODEL_CHAIN = [
  ...new Set([
    process.env.GEMINI_MODEL || "gemini-4-hydrogen",
    "gemini-3.8-flash",
    "gemini-3.5-flash-lite",
  ]),
];

const interviewReportSchema = z.object({
  matchScore: z
    .number()
    .describe(
      "A score between 0 and 100 indicating how well the candidate's profile matches the job description",
    ),
  technicalQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            "The technical question that can be asked in the interview",
          ),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Technical questions that can be asked in the interview along with their intention and how to answer them",
    ),
  behavioralQuestions: z
    .array(
      z.object({
        question: z
          .string()
          .describe(
            "The behavioral question that can be asked in the interview",
          ),
        intention: z
          .string()
          .describe("The intention of interviewer behind asking this question"),
        answer: z
          .string()
          .describe(
            "How to answer this question, what points to cover, what approach to take etc.",
          ),
      }),
    )
    .describe(
      "Behavioral questions that can be asked in the interview along with their intention and how to answer them",
    ),
  skillGaps: z
    .array(
      z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z
          .enum(["low", "medium", "high"])
          .describe(
            "The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances",
          ),
      }),
    )
    .describe(
      "List of skill gaps in the candidate's profile along with their severity",
    ),
  preparationPlan: z
    .array(
      z.object({
        day: z
          .number()
          .describe("The day number in the preparation plan, starting from 1"),
        focus: z
          .string()
          .describe(
            "The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc.",
          ),
        tasks: z
          .array(z.string())
          .describe(
            "List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.",
          ),
      }),
    )
    .describe(
      "A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively",
    ),
  title: z
    .string()
    .describe(
      "The title of the job for which the interview report is generated",
    ),
});

function formatGeminiError(err) {
  const raw = String(err?.message || "");
  try {
    const parsed = JSON.parse(raw);
    const code = parsed?.error?.code;
    const msg = parsed?.error?.message;
    if (code === 503 || parsed?.error?.status === "UNAVAILABLE") {
      return "AI models are temporarily experiencing high demand. Please try again in a few seconds.";
    }
    if (code === 429 || parsed?.error?.status === "RESOURCE_EXHAUSTED") {
      return "AI rate limit reached. Please wait 30 seconds and try again.";
    }
    if (msg) return msg;
  } catch {
    // Not a JSON-stringified error
  }

  if (
    raw.includes("503") ||
    raw.includes("UNAVAILABLE") ||
    raw.includes("high demand")
  ) {
    return "AI models are temporarily experiencing high demand. Please try again in a few seconds.";
  }
  if (raw.includes("429") || raw.includes("RESOURCE_EXHAUSTED")) {
    return "AI rate limit reached. Please wait 30 seconds and try again.";
  }
  return raw || "Failed to generate AI response.";
}

async function generateContentWithFallback({ prompt, schema }) {
  if (!process.env.GOOGLE_GENAI_API_KEY) {
    throw new Error(
      "GOOGLE_GENAI_API_KEY is missing in server environment variables.",
    );
  }

  const config = {
    responseMimeType: "application/json",
    responseSchema: zodToJsonSchema(schema),
  };

  let lastError = null;

  for (const model of MODEL_CHAIN) {
    try {
      return await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });
    } catch (err) {
      lastError = err;
      const status = err?.status || err?.code;
      const msg = String(err?.message || "");
      const isRetryable =
        status === 503 ||
        status === 502 ||
        status === 500 ||
        status === 429 ||
        status === 404 ||
        msg.includes("503") ||
        msg.includes("UNAVAILABLE") ||
        msg.includes("high demand") ||
        msg.includes("overloaded") ||
        msg.includes("429") ||
        msg.includes("RESOURCE_EXHAUSTED") ||
        msg.includes("not found") ||
        msg.includes("no longer available");

      if (!isRetryable) {
        throw new Error(formatGeminiError(err));
      }
      console.warn(
        `Model ${model} unavailable (${status || "transient"}), trying next model...`,
      );
    }
  }

  throw new Error(formatGeminiError(lastError));
}

function parseJsonResponse(rawText) {
  if (!rawText || typeof rawText !== "string") {
    throw new Error("AI service returned an empty response.");
  }

  const cleaned = rawText
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  return JSON.parse(cleaned);
}

function normalizeInterviewReport(data) {
  const validSeverities = ["low", "medium", "high"];
  const rawScore = Number(data?.matchScore);
  const matchScore = Number.isFinite(rawScore)
    ? Math.min(100, Math.max(0, Math.round(rawScore)))
    : 0;

  const skillGaps = Array.isArray(data?.skillGaps)
    ? data.skillGaps.map((gap) => {
        const sev = String(gap?.severity || "medium")
          .toLowerCase()
          .trim();
        return {
          skill: String(gap?.skill || "Unspecified Skill").trim(),
          severity: validSeverities.includes(sev) ? sev : "medium",
        };
      })
    : [];

  return {
    title: String(data?.title || "Target Role Interview Report").trim(),
    matchScore,
    technicalQuestions: Array.isArray(data?.technicalQuestions)
      ? data.technicalQuestions
      : [],
    behavioralQuestions: Array.isArray(data?.behavioralQuestions)
      ? data.behavioralQuestions
      : [],
    skillGaps,
    preparationPlan: Array.isArray(data?.preparationPlan)
      ? data.preparationPlan
      : [],
  };
}

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  const prompt = `Generate a comprehensive, role-specific interview report for a candidate with the following details:
Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}
`;

  const response = await generateContentWithFallback({
    prompt,
    schema: interviewReportSchema,
  });

  const parsed = parseJsonResponse(response.text);
  return normalizeInterviewReport(parsed);
}

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });

  try {
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      margin: {
        top: "20mm",
        bottom: "20mm",
        left: "15mm",
        right: "15mm",
      },
    });

    return pdfBuffer;
  } finally {
    await browser.close();
  }
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {
  const resumePdfSchema = z.object({
    html: z
      .string()
      .describe(
        "The HTML content of the resume which can be converted to PDF using Puppeteer",
      ),
  });

  const prompt = `Generate a tailored, ATS-friendly resume for a candidate with the following details:
Resume:
${resume}

Self Description:
${selfDescription}

Job Description:
${jobDescription}

Return a JSON object with a single field "html" containing clean, well-structured HTML/CSS for an A4 resume (1-2 pages max) that highlights the candidate's relevant skills and experience for the target job description without sounding robotic.
`;

  const response = await generateContentWithFallback({
    prompt,
    schema: resumePdfSchema,
  });

  const jsonContent = parseJsonResponse(response.text);

  if (!jsonContent?.html) {
    throw new Error("AI service did not return resume HTML content.");
  }

  return await generatePdfFromHtml(jsonContent.html);
}

module.exports = { generateInterviewReport, generateResumePdf };
