import React, { useContext, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { AuthContext } from "../features/auth/auth.context";
import { logout } from "../features/auth/services/auth.api";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, setUser } = useContext(AuthContext) || {};
  const [loggingOut, setLoggingOut] = useState(false);

  const isReportPage = location.pathname.startsWith("/interview/");
  const displayName = user?.username || user?.name || "";

  const onLogoutClick = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      localStorage.removeItem("token");
      if (typeof setUser === "function") {
        setUser(null);
      }
      setLoggingOut(false);
      navigate("/login");
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800/90 bg-zinc-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-15 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* Brand Wordmark */}
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label="GapRoute AI Home"
          className="group -ml-1.5 flex items-center gap-2.5 rounded-lg px-1.5 py-1 text-left transition hover:opacity-90 cursor-pointer"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-emerald-400 transition group-hover:border-emerald-500/40">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="6" cy="19" r="3" />
              <path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15" />
              <circle cx="18" cy="5" r="3" />
            </svg>
          </span>
          <span className="flex items-center gap-2 text-base font-bold tracking-tight text-zinc-50">
            GapRoute
            <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold tracking-wider text-emerald-400">
              AI
            </span>
          </span>
        </button>

        {/* Right Actions */}
        <div className="flex items-center gap-2.5">
          {isReportPage && (
            <button
              type="button"
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-50 px-3 py-1.5 text-xs font-semibold text-zinc-950 transition hover:bg-zinc-200 cursor-pointer sm:text-sm"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span>New Analysis</span>
            </button>
          )}

          {displayName && (
            <div
              title={displayName}
              className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900/90 p-1 sm:pr-3"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-md bg-zinc-800 text-xs font-bold text-zinc-100">
                {displayName.charAt(0).toUpperCase()}
              </span>
              <span className="hidden max-w-[130px] truncate text-xs font-medium text-zinc-300 sm:inline">
                {displayName}
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={onLogoutClick}
            disabled={loggingOut}
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer sm:text-sm"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>{loggingOut ? "Logging out..." : "Logout"}</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
