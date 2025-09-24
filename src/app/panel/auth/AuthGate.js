"use client";
import usePanelAuth from "../hooks/usePanelAuth";

export default function AuthGate({ children }) {
  const authorized = usePanelAuth({ skipPathnames: ["/panel/login"] });
  if (!authorized) {
    return (
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
        <div className="bg-gray-800/90 backdrop-blur-sm text-white rounded-xl shadow-xl px-6 py-5 border border-gray-700 flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-600 border-t-blue-500" aria-hidden="true" />
          <div className="text-gray-300 text-sm">טוען את הפאנל…</div>
        </div>
      </div>
    );
  }
  return <>{children}</>;
}
