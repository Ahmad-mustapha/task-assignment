"use client";

import { createContext, useContext } from "react";

export type AdminUser = {
  id: string;
  email: string;
  name: string;
};

const AuthContext = createContext<AdminUser | null>(null);

/**
 * The admin is resolved server-side in the protected layout and handed down,
 * so the shell never renders a "checking access" flash — by the time this
 * provider mounts the session is already verified.
 */
export function AuthProvider({
  admin,
  children,
}: {
  admin: AdminUser;
  children: React.ReactNode;
}) {
  return <AuthContext.Provider value={admin}>{children}</AuthContext.Provider>;
}

export function useAdmin(): AdminUser {
  const admin = useContext(AuthContext);

  if (!admin) {
    throw new Error("useAdmin must be used inside AuthProvider");
  }

  return admin;
}
