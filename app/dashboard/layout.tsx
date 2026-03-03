import { redirect } from "next/navigation"
import { isAdminAuthenticated } from "@/lib/auth"
import { DashboardSidebar } from "@/components/dashboard/sidebar-nav"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const isAuth = await isAdminAuthenticated()
  if (!isAuth) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-6 pt-20 lg:px-8 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
