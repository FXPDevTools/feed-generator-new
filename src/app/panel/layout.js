"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function PanelLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (pathname === "/panel/login") {
      setChecked(true);
      return;
    }
    const code = sessionStorage.getItem("panelCode");
    if (!code) {
      router.push("/panel/login");
      return;
    }
    (async () => {
  const res = await fetch("/api/panel/admin/access/get");
      const data = await res.json();
      const found = data.find(item => item.code === code);
      if (!found || !found.panels || found.panels.length === 0) {
        router.push("/panel/login");
      } else {
        setChecked(true);
      }
    })();
  }, [router, pathname]);

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-lg text-gray-400">טוען...</div>
    );
  }
  return <>{children}</>;
}
