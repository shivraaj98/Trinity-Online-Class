import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true, email: true, role: true, createdAt: true } });
  if (!user) redirect("/login");
  return <main className="admin-shell"><header className="app-header"><Link href="/dashboard" className="brand"><span className="brand-mark">T</span><span>Trinity <em>Profile</em></span></Link><Link href="/dashboard">Back to dashboard</Link></header><section className="admin-content"><p className="eyebrow">YOUR ACCOUNT</p><h1>Your learning<br /><i>identity.</i></h1><div className="auth-card"><ProfileForm name={user.name ?? ""} email={user.email} role={user.role} joined={user.createdAt.toLocaleDateString()} /></div></section></main>;
}
