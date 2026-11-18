import React, { useState, useEffect } from "react";
import { useInterview } from "../hooks/useInterview.js";
import { useNavigate, useParams } from "react-router";

const NAV_ITEMS = [
  { id: "technical", label: "Technical Questions" },
  { id: "behavioral", label: "Behavioral Questions" },
  { id: "roadmap", label: "Preparation Road Map" },
];

const getMatchVerdict = (score) => {
  if (score >= 80) return "Strong match for this role";
  if (score >= 60) return "Good match — minor skill gaps to bridge";
  if (score >= 40) return "Moderate match — targeted prep recommended";
  return "Low match — significant skill gaps identified";
};

const getSeverityBadge = (severity) => {
  if (severity === "high")
    return "border-rose-500/30 bg-rose-500/10 text-rose-400";
  if (severity === "medium")
    return "border-amber-500/30 bg-amber-500/10 text-amber-400";
  return "border-zinc-700 bg-zinc-800/80 text-zinc-300";
};

// ── Question Accordion Card ───────────────────────────────────────────────────
const QuestionCard = ({ item, index, forceOpen }) => {
  const [open, setOpen] = useState(index === 0);

  useEffect(() => {
    if (forceOpen !== null) {
      setOpen(forceOpen);
    }
  }, [forceOpen]);

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/70">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-start justify-between gap-3 p-4 text-left transition hover:bg-zinc-900 cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-xs font-semibold text-emerald-400">
            Q{index + 1}
          </span>
          <p className="text-sm font-medium leading-relaxed text-zinc-100">
            {item.question}
          </p>
        </div>
        <span className="mt-0.5 shrink-0 text-xs text-zinc-400">
          {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-zinc-800/80 bg-zinc-950/60 p-4 text-sm leading-relaxed">
          <div className="rounded-lg border-l-2 border-amber-500/70 bg-zinc-900/60 p-3">
            <span className="mb-1 block font-mono text-[11px] font-semibold uppercase tracking-wider text-amber-400">
              Interviewer Intention
            </span>
            <p className="text-zinc-300">{item.intention}</p>
          </div>

          <div className="rounded-lg border-l-2 border-emerald-500/70 bg-zinc-900/60 p-3">
            <span className="mb-1 block font-mono text-[11px] font-semibold uppercase tracking-wider text-emerald-400">
              Model Answer
            </span>
            <p className="whitespace-pre-line text-zinc-200">{item.answer}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const Interview = () => {
  const [activeNav, setActiveNav] = useState("technical");
  const [expandAll, setExpandAll] = useState(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [completedTasks, setCompletedTasks] = useState({});

  const { report, getReportById, loading, error, getResumePdf } =
    useInterview();
  const { interviewId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId);
      setExpandAll(null);
      setCompletedTasks({});
    }
  }, [interviewId]);

  const handleDownloadResume = async () => {
    if (downloadingPdf) return;
    setDownloadingPdf(true);
    try {
      await getResumePdf(interviewId);
    } finally {
      setDownloadingPdf(false);
    }
  };

  const toggleTask = (taskKey) => {
    setCompletedTasks((prev) => ({
      ...prev,
      [taskKey]: !prev[taskKey],
    }));
  };

  // Show full-page loading only during initial report fetch (not PDF export)
  if (loading && !report) {
    return (
      <main className="flex min-h-[calc(100vh-60px)] items-center justify-center px-4">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-3.5 text-sm text-zinc-300">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
          <span>Loading your interview report...</span>
        </div>
      </main>
    );
  }

  if (!report) {
    return (
      <main className="flex min-h-[calc(100vh-60px)] flex-col items-center justify-center px-4 text-center">
        <p className="text-base font-medium text-zinc-200">
          {error || "Interview report not found."}
        </p>
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-4 rounded-lg bg-zinc-50 px-4 py-2 text-sm font-semibold text-zinc-950 hover:bg-zinc-200 cursor-pointer"
        >
          Back to Home
        </button>
      </main>
    );
  }

  const technicalQuestions = report.technicalQuestions || [];
  const behavioralQuestions = report.behavioralQuestions || [];
  const preparationPlan = report.preparationPlan || [];
  const skillGaps = report.skillGaps || [];

  // Calculate roadmap completion percentage
  const totalTasks = preparationPlan.reduce(
    (sum, day) => sum + (day.tasks ? day.tasks.length : 0),
    0,
  );
  const doneTasksCount = Object.values(completedTasks).filter(Boolean).length;
  const progressPercent =
    totalTasks > 0 ? Math.round((doneTasksCount / totalTasks) * 100) : 0;

  const scoreRingStyle =
    report.matchScore >= 80
      ? "border-emerald-500 text-emerald-400"
      : report.matchScore >= 60
        ? "border-amber-500 text-amber-400"
        : "border-rose-500 text-rose-400";

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Report Title Header */}
      <header className="mb-6 flex flex-col justify-between gap-4 rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 sm:flex-row sm:items-center">
        <div>
          <span className="font-mono text-xs font-medium uppercase tracking-wider text-emerald-400">
            Interview Diagnostic Report
          </span>
          <h1 className="mt-1 text-xl font-bold text-zinc-50 sm:text-2xl">
            {report.title || "Target Role Interview Plan"}
          </h1>
          {report.createdAt && (
            <p className="mt-1 text-xs text-zinc-500">
              Generated on {new Date(report.createdAt).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="flex flex-col items-start gap-2 sm:items-end">
          <button
            type="button"
            onClick={handleDownloadResume}
            disabled={downloadingPdf}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-50 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
          >
            {downloadingPdf && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-400 border-t-zinc-950" />
            )}
            <span>
              {downloadingPdf
                ? "Generating PDF..."
                : "Download Tailored Resume"}
            </span>
          </button>

          {error && (
            <p role="alert" className="text-xs text-rose-400">
              {error}
            </p>
          )}
        </div>
      </header>

      {/* 3-Column Workspace */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Section Navigation (3 cols) */}
        <nav className="lg:col-span-3">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-3">
            <p className="mb-2 px-2.5 font-mono text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
              Sections
            </p>
            <div className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const count =
                  item.id === "technical"
                    ? technicalQuestions.length
                    : item.id === "behavioral"
                      ? behavioralQuestions.length
                      : `${preparationPlan.length}d`;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveNav(item.id);
                      setExpandAll(null);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-medium transition cursor-pointer ${
                      activeNav === item.id
                        ? "bg-zinc-800 text-zinc-50"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="rounded bg-zinc-950 px-2 py-0.5 font-mono text-xs text-zinc-400">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Center Main Content (6 cols) */}
        <main className="lg:col-span-6">
          {(activeNav === "technical" || activeNav === "behavioral") && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-100">
                  {activeNav === "technical"
                    ? "Technical Questions"
                    : "Behavioral Questions"}
                </h2>
                <button
                  type="button"
                  onClick={() =>
                    setExpandAll((prev) => (prev === true ? false : true))
                  }
                  className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-700 hover:text-white cursor-pointer"
                >
                  {expandAll === true ? "Collapse All" : "Expand All"}
                </button>
              </div>

              <div className="space-y-3">
                {(activeNav === "technical"
                  ? technicalQuestions
                  : behavioralQuestions
                ).map((q, i) => (
                  <QuestionCard
                    key={`${activeNav}-${i}`}
                    item={q}
                    index={i}
                    forceOpen={expandAll}
                  />
                ))}
              </div>
            </section>
          )}

          {activeNav === "roadmap" && (
            <section>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-zinc-100">
                  Preparation Road Map
                </h2>
                <span className="font-mono text-xs text-zinc-400">
                  {doneTasksCount} / {totalTasks} tasks ({progressPercent}%)
                </span>
              </div>

              {/* Completion Progress Bar */}
              <div className="mb-5 h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="space-y-4">
                {preparationPlan.map((day) => (
                  <div
                    key={day.day}
                    className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4"
                  >
                    <div className="mb-3 flex items-center gap-2.5">
                      <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-xs font-semibold text-emerald-400">
                        Day {day.day}
                      </span>
                      <h3 className="text-sm font-semibold text-zinc-100">
                        {day.focus}
                      </h3>
                    </div>

                    <ul className="space-y-2">
                      {(day.tasks || []).map((task, i) => {
                        const taskKey = `${day.day}-${i}`;
                        const isChecked = !!completedTasks[taskKey];

                        return (
                          <li key={i}>
                            <label className="flex cursor-pointer items-start gap-2.5 rounded-lg p-1.5 text-sm transition hover:bg-zinc-950/60">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleTask(taskKey)}
                                className="mt-1 h-4 w-4 rounded border-zinc-700 bg-zinc-950 accent-emerald-500 cursor-pointer"
                              />
                              <span
                                className={
                                  isChecked
                                    ? "text-zinc-500 line-through"
                                    : "text-zinc-300"
                                }
                              >
                                {task}
                              </span>
                            </label>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        {/* Right Diagnostic Sidebar (3 cols) */}
        <aside className="space-y-4 lg:col-span-3">
          {/* Match Score Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5 text-center">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Match Score
            </p>
            <div
              className={`mx-auto my-4 flex h-24 w-24 items-center justify-center rounded-full border-4 bg-zinc-950 ${scoreRingStyle}`}
            >
              <span className="font-mono text-2xl font-bold">
                {report.matchScore}%
              </span>
            </div>
            <p className="text-xs leading-relaxed text-zinc-300">
              {getMatchVerdict(report.matchScore)}
            </p>
          </div>

          {/* Skill Gaps Card */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-5">
            <p className="mb-3 font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Skill Gaps ({skillGaps.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {skillGaps.map((gap, i) => (
                <span
                  key={i}
                  className={`rounded-md border px-2.5 py-1 text-xs font-medium ${getSeverityBadge(gap.severity)}`}
                >
                  {gap.skill}
                </span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Interview;
