import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SessionProvider } from "next-auth/react"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import FloatingChat from "@/components/chat/FloatingChat"
import FloatingAdenAI from "@/components/chat/FloatingAdenAI"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session) redirect("/login")

  return (
    <SessionProvider session={session}>
      <div style={{ background: "var(--bg-primary)", minHeight: "100dvh" }}>
        <Sidebar />
        <Header />
        <main className="main-content">
          {children}
        </main>
        <FloatingAdenAI />
        <FloatingChat />
      </div>
    </SessionProvider>
  )
}
