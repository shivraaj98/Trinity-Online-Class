import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";

const registrationSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(12).max(128),
});

export async function POST(request: Request) {
  const parsed = registrationSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Use a valid name, email, and password of at least 12 characters." }, { status: 400 });
  const existing = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  const user = await db.user.create({ data: { name: parsed.data.name, email: parsed.data.email, passwordHash: await hash(parsed.data.password, 12) }, select: { id: true, name: true, email: true } });
  await db.auditEvent.create({ data: { action: "STUDENT_REGISTERED", resource: "User", resourceId: user.id, actorId: user.id } });
  return NextResponse.json({ user }, { status: 201 });
}
