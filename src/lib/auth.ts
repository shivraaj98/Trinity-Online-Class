import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { compare } from "bcryptjs";
import { db } from "./db";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
  })],
  callbacks: {
    async jwt({ token, user }) { if (user) token.role = (user as { role?: "STUDENT" | "TEACHER" | "ADMIN" | "SUPPORT" }).role; return token; },
    async session({ session, token }) { if (session.user) { session.user.id = token.sub ?? ""; session.user.role = token.role as "STUDENT" | "TEACHER" | "ADMIN" | "SUPPORT"; } return session; }
  }
});
