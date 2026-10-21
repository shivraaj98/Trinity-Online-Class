import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import CourseActions from "./course-actions";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await db.course.findFirst({ where: { slug, status: "PUBLISHED" }, include: { teacher: { select: { name: true } }, lessons: { orderBy: { position: "asc" }, select: { id: true, title: true, type: true, position: true, durationMin: true } } } });
  if (!course) notFound();
  const session = await auth();
  const enrolled = session?.user?.id ? Boolean(await db.enrollment.findUnique({ where: { userId_courseId: { userId: session.user.id, courseId: course.id } }, select: { id: true, status: true } })) : false;
  return <main className="admin-shell"><header className="app-header"><Link href="/explore" className="brand"><span className="brand-mark">T</span><span>Trinity <em>Classes</em></span></Link><Link href={session ? "/dashboard" : "/login"}>{session ? "Dashboard" : "Sign in"}</Link></header><section className="admin-content"><p className="eyebrow">{course.category} · {course.level}</p><h1>{course.title}</h1><p className="hero-lede">{course.description}</p><p>With {course.teacher.name ?? "a Trinity educator"} · {course.lessons.length} lessons</p><CourseActions courseId={course.id} enrolled={enrolled} signedIn={Boolean(session)} /><section className="teacher-list"><div className="panel-head"><h2>Course lessons</h2><span>{course.lessons.length} lessons</span></div>{course.lessons.map((lesson) => <div className="teacher-row" key={lesson.id}><div><span className="pill">{lesson.type}</span><strong>{lesson.position}. {lesson.title}</strong><small>{lesson.durationMin ? `${lesson.durationMin} minutes` : "Self-paced"}</small></div></div>)}</section></section></main>;
}
