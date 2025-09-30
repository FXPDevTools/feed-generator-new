"use client";
import usePanelAuth from "./usePanelAuth";

export default function AuthWrapper({ allowedPanels, children }) {
  usePanelAuth({ allowedPanels });
  return <>{children}</>;
}