import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Trinity Classes · आफ्नो लक्ष्यतर्फ", description: "नेपालका विद्यार्थीका लागि लाइभ कक्षा, अभ्यास र अध्ययन सामग्री।" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="ne"><body>{children}</body></html>; }
