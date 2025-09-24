"use client";

import { useEffect, useState } from "react";
import AuthGate from "./auth/AuthGate";
import PanelLayout from "./hooks/PanelLayout";
import { usePathname } from "next/navigation";

export default function PanelLayoutWrapper({ children }) {
  const [allowedPanels, setAllowedPanels] = useState([]);
  const [role, setRole] = useState("");

  useEffect(() => {
    const code = typeof window !== 'undefined' ? sessionStorage.getItem('panelCode') : null;
    (async () => {
      try {
        if (!code) return;
        const res = await fetch('/api/panel/admin/access/get');
        const data = await res.json();
        const found = data.find(item => item.code === code);
        setAllowedPanels(found && found.panels ? found.panels : []);
        setRole(found && found.role ? found.role : '');
      } catch (err) {
        setAllowedPanels([]);
        setRole('');
      }
    })();
  }, []);

  if (usePathname() == "/panel/login") {
    return <>{children}</>;
  }

  return (
    <AuthGate>
      <PanelLayout title="לוח בקרה" role={role} actions={
        allowedPanels.map(panel => (
          <PanelButton key={panel} panel={panel} />
        ))
      }>
        {children}
      </PanelLayout>
    </AuthGate>
  );
}
