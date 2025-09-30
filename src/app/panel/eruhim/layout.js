import AuthWrapper from '../hooks/AuthWrapper';

export const metadata = {
  title: "לוח בקרה – מערך האירוחים בצוות פיד",
  description: "לוח הבקרה לניהול מחולל צוות פיד",
};

export default function EruhimLayout({ children }) {
  return (
    <AuthWrapper allowedPanels={["eruhim"]}>
      {children}
    </AuthWrapper>
  );
}
