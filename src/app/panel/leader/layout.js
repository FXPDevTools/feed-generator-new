"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function LeaderLayout({ children }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const code = sessionStorage.getItem("panelCode");
    if (!code) {
      router.push("/panel/login");
      return;
    }
    (async () => {
  const res = await fetch("/api/panel/admin/access/get");
      const data = await res.json();
      const found = data.find(item => item.code === code);
      if (!found || (!found.panels.includes("leader") && !found.panels.includes("admin"))) {
        router.push("/panel/login");
      } else {
        setChecked(true);
      }
    })();
  }, [router]);

  if (!checked) {
    return (
      <div className="flex items-center justify-center min-h-[200px] text-lg text-gray-400">טוען...</div>
    );
  }
  return <>{children}</>;
}
