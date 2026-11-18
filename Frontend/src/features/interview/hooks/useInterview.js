import { useContext, useState } from "react";
import { InterviewContext } from "../interview.context";
import {
  generateInterviewReport,
  getInterviewReportById,
  getAllInterviewReports,
  generateResumePdf,
} from "../services/interview.api";

export const useInterview = () => {
  const context = useContext(InterviewContext);
  const { loading, setLoading, report, setReport, reports, setReports } =
    context;
  const [error, setError] = useState(null);

  const generateReport = async ({
    jobDescription,
    selfDescription,
    resumeFile,
  }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile,
      });
      setReport(response.interviewReport);
      return response.interviewReport;
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        "Failed to generate interview report. Please try again.";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getReportById = async (interviewId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getInterviewReportById(interviewId);
      setReport(response.interviewReport);
      return response.interviewReport;
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to load interview report.";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllInterviewReports();
      setReports(response.interviewReports || []);
      return response.interviewReports || [];
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to fetch previous reports.";
      setError(message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getResumePdf = async (interviewReportId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await generateResumePdf(interviewReportId);
      const url = window.URL.createObjectURL(
        new Blob([response], { type: "application/pdf" }),
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `resume_${interviewReportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      const message =
        err?.response?.data?.message || "Failed to generate resume PDF.";
      setError(message);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    setError,
    report,
    reports,
    generateReport,
    getReportById,
    getReports,
    getResumePdf,
  };
};
