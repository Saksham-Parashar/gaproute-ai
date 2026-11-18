import React, { useState, useRef, useEffect } from "react";
import { useInterview } from "../hooks/useInterview.js";
import { useNavigate } from "react-router";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3 MB

const formatFileSize = (bytes) => {
  if (!bytes) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const getScoreBadge = (score) => {
  if (score >= 80)
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-400";
  if (score >= 60) return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  return "border-rose-500/30 bg-rose-500/10 text-rose-400";
};

const Home = () => {
  const {
    loading,
    error,
    setError,
    generateReport,
    reports = [],
    getReports,
  } = useInterview();
  const [jobDescription, setJobDescription] = useState("");
  const [selfDescription, setSelfDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);

  const resumeInputRef = useRef(null);
  const navigate = useNavigate();

  // Fetch saved reports when the dashboard loads
  useEffect(() => {
    getReports();
  }, []);

  const handleRemoveFile = () => {
    setResumeFile(null);
    if (resumeInputRef.current) {
      resumeInputRef.current.value = "";
    }
  };

  const validateAndSetFile = (file) => {
    if (!file) return;

    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Invalid file format. Please upload your resume as a PDF file.");
      handleRemoveFile();
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("Resume PDF must be 3 MB or smaller.");
      handleRemoveFile();
      return;
    }

    setError(null);
    setResumeFile(file);
  };

  const handleFileChange = (e) => {
    validateAndSetFile(e.target.files?.[0]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    validateAndSetFile(e.dataTransfer.files?.[0]);
  };

  const handleGenerateReport = async () => {
    if (!jobDescription.trim()) {
      setError("Target job description is required.");
      return;
    }
    if (!resumeFile) {
      setError("Please upload your resume as a PDF file (Max 3MB).");
      return;
    }
    if (!selfDescription.trim()) {
      setError("Self description is required.");
      return;
    }

    const data = await generateReport({
      jobDescription,
      selfDescription,
      resumeFile,
    });
    if (data?._id) {
      navigate(`/interview/${data._id}`);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      {/* Page Header */}
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-50 sm:text-3xl">
          Create Your Custom{" "}
          <span className="text-emerald-400">Interview Plan</span>
        </h1>
        <p className="mt-1 text-sm text-zinc-400">
          Analyze a target job description against your resume to uncover skill
          gaps and build a prep plan.
        </p>
      </header>

      {/* Main 2-Column Card */}
      <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70">
        <div className="grid grid-cols-1 divide-y divide-zinc-800 lg:grid-cols-12 lg:divide-x lg:divide-y-0">
          {/* Left Column: Target Job Description */}
          <div className="flex flex-col p-5 sm:p-6 lg:col-span-7">
            <div className="mb-3 flex items-center justify-between">
              <label
                htmlFor="jobDescription"
                className="text-sm font-semibold text-zinc-100"
              >
                Target Job Description
              </label>
              <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
                Required
              </span>
            </div>

            <textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                if (error) setError(null);
              }}
              maxLength={5000}
              placeholder="Paste the full job description here..."
              className="min-h-[280px] w-full flex-1 resize-y rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/50 focus:outline-none"
            />

            <div className="mt-2 text-right text-xs text-zinc-500">
              {jobDescription.length} / 5000 chars
            </div>
          </div>

          {/* Right Column: Resume PDF + Self Description */}
          <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:col-span-5">
            {/* Resume PDF Upload */}
            <div>
              <div className="mb-2.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-zinc-100">
                  Upload Resume
                </span>
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
                  Required &bull; Max 3MB
                </span>
              </div>

              <input
                ref={resumeInputRef}
                onChange={handleFileChange}
                hidden
                type="file"
                id="resume"
                accept=".pdf,application/pdf"
              />

              {!resumeFile ? (
                <label
                  htmlFor="resume"
                  onDrop={handleDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-zinc-700 bg-zinc-950/70 px-4 py-7 text-center transition hover:border-zinc-500"
                >
                  <p className="text-sm font-medium text-zinc-200">
                    Click to upload or drag &amp; drop
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    PDF only (Max 3MB)
                  </p>
                </label>
              ) : (
                <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-500/30 bg-zinc-950 p-3.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-100">
                      {resumeFile.name}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400">
                      {formatFileSize(resumeFile.size)} &bull; Ready
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button
                      type="button"
                      onClick={() => resumeInputRef.current?.click()}
                      className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-300 hover:text-white cursor-pointer"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="rounded border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Self Description */}
            <div className="flex flex-1 flex-col">
              <div className="mb-2.5 flex items-center justify-between">
                <label
                  htmlFor="selfDescription"
                  className="text-sm font-semibold text-zinc-100"
                >
                  Self-Description
                </label>
                <span className="rounded bg-zinc-800 px-2 py-0.5 text-xs font-medium text-zinc-300">
                  Required
                </span>
              </div>
              <textarea
                id="selfDescription"
                value={selfDescription}
                onChange={(e) => {
                  setSelfDescription(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Briefly describe your experience, key skills, projects, and target role goals..."
                className="min-h-[120px] w-full flex-1 resize-y rounded-lg border border-zinc-800 bg-zinc-950 p-3.5 text-sm text-zinc-100 placeholder-zinc-600 focus:border-emerald-500/50 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Error Alert Banner */}
        {error && (
          <div
            role="alert"
            className="mx-5 mb-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300 sm:mx-6"
          >
            {error}
          </div>
        )}

        {/* Card Footer */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-800 bg-zinc-950/60 px-5 py-4 sm:flex-row sm:px-6">
          <span className="text-xs text-zinc-500">
            All three inputs are required for accurate skill-gap scoring.
          </span>
          <button
            type="button"
            onClick={handleGenerateReport}
            disabled={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-50 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer sm:w-auto"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-950" />
            )}
            <span>
              {loading
                ? "Generating Strategy..."
                : "Generate My Interview Strategy"}
            </span>
          </button>
        </div>
      </div>

      {/* Recent Interview Plans Grid */}
      {reports.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-zinc-100">
            My Recent Interview Plans
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {reports.map((item) => (
              <div
                key={item._id}
                onClick={() => navigate(`/interview/${item._id}`)}
                className="flex cursor-pointer flex-col justify-between rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 transition hover:border-zinc-700 hover:bg-zinc-900"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`rounded border px-2.5 py-0.5 text-xs font-semibold ${getScoreBadge(item.matchScore)}`}
                    >
                      Match: {item.matchScore}%
                    </span>
                    <span className="text-xs text-zinc-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-zinc-100">
                    {item.title || "Untitled Position"}
                  </h3>
                </div>
                <p className="mt-4 text-xs font-medium text-emerald-400">
                  View Report &rarr;
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
