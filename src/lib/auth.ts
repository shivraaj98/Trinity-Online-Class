import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import Nodemailer from "next-auth/providers/nodemailer";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { db } from "./db";

const authConfig = {
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 },
  pages: { signIn: "/login" },
  providers: [Credentials({
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      const email = String(credentials?.email ?? "").trim().toLowerCase();
      const password = String(credentials?.password ?? "");
      if (!email || !password) return null;
      const user = await db.user.findUnique({ where: { email } });
      if (!user?.passwordHash || !user.isActive || !(await compare(password, user.passwordHash))) return null;
      return { id: user.id, name: user.name, email: user.email, role: user.role };
    }
  }), Credentials({
    id: "otp-session",
    name: "OTP session",
    credentials: { userId: {} },
    async authorize(credentials) {
      const userId = String(credentials?.userId ?? "");
      if (!userId) return null;
      const user = await db.user.findUnique({ where: { id: userId } });
      if (!user?.isActive) return null;
      return { id: user.id, name: user.name, email: user.email, role: user.role };
    },
  }),
  Google({ clientId: process.env.AUTH_GOOGLE_ID ?? "", clientSecret: process.env.AUTH_GOOGLE_SECRET ?? "" }),
  ...(process.env.EMAIL_SERVER && process.env.EMAIL_FROM ? [Nodemailer({ server: process.env.EMAIL_SERVER, from: process.env.EMAIL_FROM })] : [])],
  callbacks: {
    async jwt({ token, user }) { if (user) token.role = (user as { role?: "STUDENT" | "TEACHER" | "ADMIN" | "SUPPORT" }).role; return token; },
    async session({ session, token }) { if (session.user) { session.user.id = token.sub ?? ""; session.user.role = token.role as "STUDENT" | "TEACHER" | "ADMIN" | "SUPPORT"; } return session; }
  }
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

let testOtpSession: ((userId: string) => Promise<void>) | undefined;

export function __setOtpSessionForTests(createSession: (userId: string) => Promise<void>): void {
  testOtpSession = createSession;
}

export function __resetOtpSessionForTests(): void {
  testOtpSession = undefined;
}

export async function createOtpSession(userId: string): Promise<void> {
  if (testOtpSession) return testOtpSession(userId);
  await signIn("otp-session", { userId, redirect: false });
}
