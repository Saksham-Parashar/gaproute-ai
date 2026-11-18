import React from "react";
import { Navigate } from "react-router";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../../../components/Navbar";

const Protected = ({ children }) => {
  const { loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-400">
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/70 px-5 py-3.5 text-sm font-medium">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-400" />
          <span>Verifying session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50">
      <Navbar />
      {children}
    </div>
  );
};

export default Protected;
