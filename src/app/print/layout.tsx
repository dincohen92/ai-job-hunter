export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout bypasses the root layout's providers and fonts
  // for a clean print-only experience
  return children;
}
