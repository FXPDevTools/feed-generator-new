"use client";

import AuthGate from "./auth/AuthGate";
import { usePathname } from "next/navigation";

export default function PanelLayoutWrapper({ children }) {
  if (usePathname() == "/panel/login") {
    return <>{children}</>;
  }

  return (
    <AuthGate>
      {children}
    </AuthGate>
  );
}
