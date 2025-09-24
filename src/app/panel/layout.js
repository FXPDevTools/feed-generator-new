"use client";

import { useEffect, useState } from "react";
import AuthGate from "./auth/AuthGate";

import { usePathname } from "next/navigation";

export default function PanelLayoutWrapper({ children }) {
  const [role, setRole] = useState("");

  useEffect(() => {
    const code = typeof window !== 'undefined' ? sessionStorage.getItem('panelCode') : null;
    (async () => {
      try {
        if (!code) return;
        const res = await fetch('/api/panel/admin/access/get');
        const data = await res.json();
        const found = data.find(item => item.code === code);
        setRole(found && found.role ? found.role : '');
      } catch (err) {
        setRole('');
      }
    })();
  }, []);

  if (usePathname() == "/panel/login") {
    return <>{children}</>;
  }

  // Pass role as prop to children (using React.cloneElement for single child)
  return (
    <AuthGate>
      {children}
    </AuthGate>
  );
}
