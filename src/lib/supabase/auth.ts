import "server-only"
import { redirect } from "next/navigation"
import { createClient } from "./server"
import { db } from "@/db"
import { profiles } from "@/db/schema"
import { eq } from "drizzle-orm"

export type AdminUser = {
  id: string
  email: string
  fullName: string
  role: "superadmin" | "admin" | "staff"
}

/**
 * Gets current authenticated user from Supabase session.
 */
export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

/**
 * Gets current admin profile if user is authenticated and authorized.
 */
export async function getCurrentAdmin(): Promise<AdminUser | null> {
  const user = await getCurrentUser()
  if (!user || !user.email) {
    return null
  }

  // First check Supabase user metadata role
  const metaRole = user.user_metadata?.role
  if (metaRole === "admin" || metaRole === "superadmin") {
    return {
      id: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name || user.email.split("@")[0],
      role: metaRole,
    }
  }

  // Check profiles table in database
  try {
    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, user.id))
      .limit(1)

    if (profile && (profile.role === "admin" || profile.role === "superadmin" || profile.role === "staff")) {
      return {
        id: profile.id,
        email: profile.email,
        fullName: profile.fullName || user.email.split("@")[0],
        role: profile.role as "superadmin" | "admin" | "staff",
      }
    }
  } catch (dbErr) {
    // If DB is offline or querying fails, fallback to user_metadata or allow if user is authenticated admin
    console.warn("Could not query profiles table:", dbErr)
  }

  return null
}

/**
 * Server-side authorization check for Admin mutations and Server Actions.
 * Throws an error if caller is not an admin.
 */
export async function requireAdmin(): Promise<AdminUser> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    throw new Error("Unauthorized: Admin role required for this action.")
  }
  return admin
}

/**
 * Server Component / Page guard that redirects unauthenticated users to /admin/login.
 */
export async function requireAdminPage(): Promise<AdminUser> {
  const admin = await getCurrentAdmin()
  if (!admin) {
    redirect("/admin/login")
  }
  return admin
}
