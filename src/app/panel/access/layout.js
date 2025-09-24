"use client";
import usePanelAuth from "../hooks/usePanelAuth";

export default function AccessLayout({ children }) {
  usePanelAuth({ allowedPanels: ["leader", "admin"] });
  return <>{children}</>;
}
