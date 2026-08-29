// shared shell: sidebar/nav
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex flex-1">{children}</div>;
}
