import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const enrollmentSchema = z.object({ courseId: z.string().cuid() });

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = enrollmentSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid course" }, { status: 400 });
  const course = await db.course.findFirst({ where: { id: parsed.data.courseId, status: "PUBLISHED" }, select: { id: true } });
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
  const enrollment = await db.enrollment.upsert({ where: { userId_courseId: { userId: session.user.id, courseId: course.id } }, update: { status: "ACTIVE" }, create: { userId: session.user.id, courseId: course.id } });
  await db.auditEvent.create({ data: { action: "ENROLLMENT_CREATED", resource: "Enrollment", resourceId: enrollment.id, actorId: session.user.id } });
  return NextResponse.json({ enrollment }, { status: 201 });
}
