import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function LiveDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const user = await db.user.findUnique({ where: { id: session.user.id }, include: { enrollments: { where: { status: "ACTIVE" }, include: { course: { include: { lessons: { select: { id: true } } } } }, orderBy: { createdAt: "desc" } }, progress: { select: { lessonId: true, completed: true } }, notifications: { where: { readAt: null }, take: 5 } } });
  if (!user) redirect("/login");
  const current = user.enrollments[0];
  const completed = current?.course.lessons.filter((lesson) => user.progress.some((item) => item.lessonId === lesson.id && item.completed)).length ?? 0;
  const total = current?.course.lessons.length ?? 0;
  const completion = total ? Math.round((completed / total) * 100) : 0;
  const firstName = user.name?.split(" ")[0] ?? "learner";
  return <main className="dashboard-shell"><aside className="sidebar"><Link href="/" className="brand"><span className="brand-mark">T</span><span>Trinity <em>Classes</em></span></Link><p className="sidebar-label">YOUR SPACE</p><Link className="active" href="/dashboard">Overview</Link><Link href="/explore">Explore classes</Link><Link href="/profile">My profile</Link><div className="sidebar-bottom"><span className="user-chip">{firstName.slice(0, 1).toUpperCase()}</span><div><strong>{user.name ?? "Learner"}</strong><small>{user.role.toLowerCase()}</small></div></div></aside><section className="dashboard-main"><header className="dash-top"><div><p className="eyebrow">LEARNER DASHBOARD</p><h1>Good morning, {firstName}.</h1></div><Link href="/explore" className="button button-dark">Find a new class <span>↗</span></Link></header><div className="progress-card"><div><p className="eyebrow">YOUR LEARNING LIBRARY</p><h2>{user.enrollments.length ? <>Keep the<br /><i>good streak.</i></> : <>Start your<br /><i>first course.</i></>}</h2><p>{user.enrollments.length} active course{user.enrollments.length === 1 ? "" : "s"} in your library.</p></div><div className="streak"><strong>{String(user.enrollments.length).padStart(2, "0")}</strong><span>active courses</span></div></div><div className="dash-grid"><article className="next-card"><p className="eyebrow">PICK UP WHERE YOU LEFT OFF</p>{current ? <><h2>{current.course.title}</h2><div className="progress-line"><span style={{ width: `${completion}%` }} /></div><footer><span>{completion}% complete</span><Link href={`/courses/${current.course.slug}`}>Continue ↗</Link></footer></> : <><h2>No course yet.</h2><p>Choose your first class to start building momentum.</p><footer><span>Library ready</span><Link href="/explore">Explore ↗</Link></footer></>}</article><article className="today-card"><p className="eyebrow">ACCOUNT</p><span className="time">{user.notifications.length}</span><h2>Unread<br />updates</h2><p>{user.notifications.length ? "New learning updates are waiting." : "You are all caught up."}</p><Link href="/profile" className="text-link">View profile ↗</Link></article></div></section></main>;
}
