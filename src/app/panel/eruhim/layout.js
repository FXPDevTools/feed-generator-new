"use client";
import usePanelAuth from "../hooks/usePanelAuth";

export default function EruhimLayout({ children }) {
  usePanelAuth({ allowedPanels: ["eruhim"] });
  return <>{children}</>;
}
