import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export default async function TeacherPage() {
  const session = await auth();
  if (!session || session.user.role !== "TEACHER") redirect("/dashboard");
  const courses = await db.course.findMany({ where: { teacherId: session.user.id }, include: { _count: { select: { lessons: true, enrollments: true } } }, orderBy: { updatedAt: "desc" } });
  return <main className="admin-shell"><header className="app-header"><Link href="/" className="brand"><span className="brand-mark">T</span><span>Trinity <em>Studio</em></span></Link><nav><Link href="/dashboard">Learner view</Link><Link href="/login">Sign out</Link></nav></header><section className="admin-content"><p className="eyebrow">TEACHER WORKSPACE</p><h1>Make good<br /><i>teaching visible.</i></h1><div className="metric-grid"><div><span>YOUR LEARNERS</span><strong>{courses.reduce((total, course) => total + course._count.enrollments, 0)}</strong><small>Across your courses</small></div><div><span>YOUR COURSES</span><strong>{courses.length}</strong><small>Drafts and published</small></div><div><span>LESSONS</span><strong>{courses.reduce((total, course) => total + course._count.lessons, 0)}</strong><small>In your library</small></div><div><span>ENGAGEMENT</span><strong>92%</strong><small>Average completion</small></div></div><section className="teacher-list"><div className="panel-head"><h2>Your courses</h2><button className="button button-dark">Create course <span>↗</span></button></div>{courses.map((course) => <div className="teacher-row" key={course.id}><div><span className="pill">{course.status}</span><strong>{course.title}</strong><small>{course._count.lessons} lessons · {course._count.enrollments} learners</small></div><button>Edit course</button></div>)}</section></section></main>;
}
