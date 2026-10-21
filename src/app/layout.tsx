import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Trinity Classes", description: "A modern learning platform for ambitious students." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
