export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Bare layout without sidebar for login page
  return <>{children}</>;
}
