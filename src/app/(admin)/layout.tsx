import { requireAdmin } from "@/lib/auth/guards";
import { AuthProvider } from "@/context/AuthContext";
import { AppShell } from "@/components/layout/Sidebar";

/**
 * Server component: the session is verified here before anything renders, so
 * the shell never shows a "checking access" state. middleware.ts already redirects
 * unauthenticated requests; this is the guarantee behind it.
 */
export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <AuthProvider
      admin={{ id: admin.adminId, email: admin.email, name: admin.name }}
    >
      <AppShell>{children}</AppShell>
    </AuthProvider>
  );
}
