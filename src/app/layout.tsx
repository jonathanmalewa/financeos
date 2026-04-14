import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "FinanceOS — Platform Manajemen Keuangan",
  description: "Platform manajemen keuangan enterprise dengan fitur task management, arsip digital, AI assistant, dan real-time collaboration.",
  keywords: ["finance", "keuangan", "manajemen", "task", "arsip", "AI"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#111827",
              color: "#f9fafb",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: "10px",
              fontSize: "14px",
              fontFamily: "Inter, sans-serif",
            },
            success: {
              iconTheme: { primary: "#22c55e", secondary: "#111827" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#111827" },
            },
          }}
        />
      </body>
    </html>
  );
}
