"use client";
import usePanelAuth from "../hooks/usePanelAuth";

export default function FeedLayout({ children }) {
  usePanelAuth({ allowedPanels: ["feed"] });
  return <>{children}</>;
}
