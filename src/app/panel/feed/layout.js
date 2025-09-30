
export default function FeedLayout({ children }) {
  return <AuthWrapper allowedPanels={["feed"]}>{children}</AuthWrapper>;
}
