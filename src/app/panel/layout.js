"use client";

import { useEffect, useState } from "react";
import AuthGate from "./auth/AuthGate";
import React from "react";

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

  // Always pass role as prop to all children
  const childrenWithRole = React.Children.map(children, child =>
    React.isValidElement(child)
      ? React.cloneElement(child, { role })
      : child
  );

  if (usePathname() == "/panel/login") {
    return <>{childrenWithRole}</>;
  }

  return (
    <AuthGate>
      {childrenWithRole}
    </AuthGate>
  );
}
