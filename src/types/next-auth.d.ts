import "next-auth";
import "next-auth/jwt";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session { user: { id: string; role: "STUDENT" | "TEACHER" | "ADMIN" | "SUPPORT" } & DefaultSession["user"] }
  interface User { role?: "STUDENT" | "TEACHER" | "ADMIN" | "SUPPORT" }
}
declare module "next-auth/jwt" { interface JWT { role?: "STUDENT" | "TEACHER" | "ADMIN" | "SUPPORT" } }
