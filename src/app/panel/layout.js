"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PanelLayout({ children }) {
  const [allowed, setAllowed] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // אל תגביל את דף הלוגין
    if (window.location.pathname === "/panel/login") {
      setAllowed(true);
      return;
    }

    const code = sessionStorage.getItem("panelCode");
    if (!code) {
      router.push("/panel/login");
      return;
    }
    fetch("/api/panel/get-access")
      .then((res) => res.json())
      .then((data) => {
        const found = data.find((item) => item.code === code);
        if (found && found.panels.length > 0) {
          setAllowed(true);
        } else {
          setAllowed(false);
        }
      });
  }, [router]);

  if (allowed === null) {
    return null;
  }
  if (allowed === false) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-8 bg-transparent text-white">
        <div className="max-w-xl w-full bg-gray-800 p-8 rounded-lg shadow-lg flex flex-col gap-8 items-center">
          <h1 className="text-3xl mb-4 font-bold text-red-500">אין לך הרשאה</h1>
          <p className="text-lg text-gray-300">גישה לאזור זה מותרת רק למשתמשים עם גישה לפחות לפאנל אחד.</p>
        </div>
      </main>
    );
  }
  return <>{children}</>;
}
