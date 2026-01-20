"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

/**
 * usePanelAuth - validates session and permissions for panel routes.
 *
 * Options:
 * - allowedPanels?: string[]  // require at least one of these permissions; omit to accept any non-empty panels
 * - loginPath?: string        // redirect target when unauthorized (default: '/panel/login')
 * - skipPathnames?: string[]  // paths to skip auth check (e.g., ['/panel/login'])
 *
 * Returns: boolean 'checked' indicating the UI can render.
 */
export default function usePanelAuth(options = {}) {
  const { allowedPanels, loginPath = "/panel/login", skipPathnames = [] } = options;
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Skip auth on paths marked to skip (e.g., login page)
    if (skipPathnames.includes(pathname)) {
      setChecked(true);
      return () => {
        cancelled = true;
      };
    }

    const code = typeof window !== 'undefined' ? sessionStorage.getItem("panelCode") : null;
    if (!code) {
      router.replace(loginPath);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        const res = await fetch("/api/auth/access");
        if (!res.ok) throw new Error("access get failed");
        const data = await res.json();
        const found = data.find((item) => item.code === code);
        const panels = found?.panels || [];

        let authorized = false;
        if (!found) authorized = false;
        else if (!allowedPanels || allowedPanels.length === 0) authorized = panels.length > 0;
        else authorized = allowedPanels.some((p) => panels.includes(p));

        if (cancelled) return;
        if (!authorized) {
          router.replace(loginPath);
        } else {
          setChecked(true);
        }
      } catch (e) {
        if (!cancelled) router.replace(loginPath);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [allowedPanels, loginPath, pathname, router, skipPathnames]);

  return checked;
}
