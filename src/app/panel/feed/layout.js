import AuthWrapper from "../hooks/AuthWrapper";

export default function FeedLayout({ children }) {
  return <AuthWrapper allowedPanels={["feed"]}>{children}</AuthWrapper>;
}
