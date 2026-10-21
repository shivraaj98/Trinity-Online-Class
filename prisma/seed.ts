import { PrismaClient, Role, CourseStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const db = new PrismaClient();
async function main() { const passwordHash = await hash("ChangeMe-Only-For-Local-Seed-123!", 12); const teacher = await db.user.upsert({ where: { email: "teacher@trinity.local" }, update: {}, create: { email: "teacher@trinity.local", name: "Dr. Anika Rao", role: Role.TEACHER, passwordHash } }); const admin = await db.user.upsert({ where: { email: "admin@trinity.local" }, update: {}, create: { email: "admin@trinity.local", name: "Trinity Admin", role: Role.ADMIN, passwordHash } }); void admin; await db.course.upsert({ where: { slug: "foundations-mathematics" }, update: { status: CourseStatus.PUBLISHED }, create: { title: "Foundations of Mathematics", slug: "foundations-mathematics", description: "A clear, practical foundation for confident problem solving.", category: "JEE", level: "Beginner", status: CourseStatus.PUBLISHED, publishedAt: new Date(), teacherId: teacher.id, lessons: { create: Array.from({ length: 24 }, (_, position) => ({ title: `Lesson ${position + 1}`, position: position + 1 })) } } }); }
main().finally(() => db.$disconnect());
