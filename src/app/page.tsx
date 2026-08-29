import { redirect } from "next/navigation";

// middleware.ts sends unauthenticated visitors to /login before this runs.
export default function Home() {
  redirect("/dashboard");
}
