import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim();
  const category = searchParams.get("category")?.trim();
  const courses = await db.course.findMany({ where: { status: "PUBLISHED", ...(category ? { category } : {}), ...(query ? { OR: [{ title: { contains: query, mode: "insensitive" } }, { description: { contains: query, mode: "insensitive" } }] } : {}) }, include: { teacher: { select: { name: true, image: true } }, _count: { select: { lessons: true, enrollments: true } } }, orderBy: { publishedAt: "desc" }, take: 50 });
  return NextResponse.json({ courses });
}
