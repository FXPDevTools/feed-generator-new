"use client";
import usePanelAuth from "../hooks/usePanelAuth";

export default function AdminLayout({ children }) {
  usePanelAuth({ allowedPanels: ["admin"] });
  return <>{children}</>;
}
