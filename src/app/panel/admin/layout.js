import AuthWrapper from "../hooks/AuthWrapper";

export const metadata = {
  title: "לוח בקרה – מנהל מערכת",
  description: "לוח הבקרה למנהל מערכת",
};

export default function AdminLayout({ children }) {
  return <AuthWrapper allowedPanels={["admin"]}>{children}</AuthWrapper>;
}
