import AuthWrapper from "../hooks/AuthWrapper";

export const metadata = {
  title: "לוח בקרה – עריכת הרשאות לפאנל",
  description: "לוח הבקרה לעריכת הרשאות לפאנל",
};

export default function AccessLayout({ children }) {
  return <AuthWrapper allowedPanels={["leader", "admin"]}>{children}</AuthWrapper>;
}
