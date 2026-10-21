import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const profileSchema = z.object({ name: z.string().trim().min(2).max(80) });

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = profileSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Name must be between 2 and 80 characters." }, { status: 400 });
  const user = await db.user.update({ where: { id: session.user.id }, data: { name: parsed.data.name }, select: { id: true, name: true, email: true, role: true } });
  await db.auditEvent.create({ data: { action: "PROFILE_UPDATED", resource: "User", resourceId: user.id, actorId: user.id } });
  return NextResponse.json({ user });
}
