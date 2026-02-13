import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/src/components/ui/sonner";
import AuthHydration from "@/src/components/auth/auth-hydration";
import Dashboard from "./page";
import DashboardShell from "./DashboardShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard-Builder",
  description: "Build Ur dashboards with a single Prompt",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthHydration />
      {children}
        <Toaster richColors position="top-center" />
      </body>
    </html>
  );
}
