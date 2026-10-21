import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path === "/") return NextResponse.redirect(new URL("/nepali", request.url));
  if (path === "/dashboard") return NextResponse.redirect(new URL("/dashboard-live", request.url));
  if (path === "/admin") return NextResponse.redirect(new URL("/admin-live", request.url));
  return NextResponse.next();
}

export const config = { matcher: ["/", "/dashboard", "/admin"] };
