import AuthGate from "./auth/AuthGate";

export const metadata = {
  title: "לוח בקרה – מחולל צוות פיד",
  description: "לוח הבקרה לניהול מחולל צוות פיד",
};

export default function PanelLayoutWrapper({ children }) {
  return (
    <AuthGate>
      {children}
    </AuthGate>
  );
}
