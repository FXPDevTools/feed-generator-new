import AuthWrapper from "../hooks/AuthWrapper";

export const metadata = {
  title: "לוח בקרה – ראש צוות פיד",
  description: "לוח הבקרה לראש צוות פיד",
};

export default function LeaderLayout({ children }) {
  return <AuthWrapper allowedPanels={["leader", "admin"]}>{children}</AuthWrapper>;
}
