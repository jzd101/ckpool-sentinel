import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CKPool Sentinel | Bitcoin Solo Mining Live Dashboard",
  description: "Real-time monitoring and analytics for CKPool Bitcoin Solo Mining",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#080C14] text-slate-100 antialiased selection:bg-amber-500/30 selection:text-amber-200">
        {/* Subtle Ambient Background Glows */}
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[128px]" />
          <div className="absolute top-1/3 -right-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />
          <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-[128px]" />
        </div>
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
