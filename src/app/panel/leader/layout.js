"use client";
import usePanelAuth from "../hooks/usePanelAuth";

export default function LeaderLayout({ children }) {
  usePanelAuth({ allowedPanels: ["leader", "admin"] });
  return <>{children}</>;
}
