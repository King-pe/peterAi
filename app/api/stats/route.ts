import { NextResponse } from "next/server"
import { getUsers, getPayments, getLogs } from "@/lib/storage"
import { requireAdmin } from "@/lib/auth"
import type { DashboardStats } from "@/lib/types"

export async function GET() {
  try {
    await requireAdmin()

    const [users, payments, logs] = await Promise.all([
      getUsers(),
      getPayments(),
      getLogs(),
    ])

    const now = new Date()
    const todayStr = now.toISOString().slice(0, 10)
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    // Messages today
    const messagesToday = logs.filter(
      (l) => l.timestamp.startsWith(todayStr) && (l.type === "command" || l.type === "ai_chat")
    ).length

    // Messages this week
    const messagesThisWeek = logs.filter(
      (l) =>
        new Date(l.timestamp) >= weekAgo && (l.type === "command" || l.type === "ai_chat")
    ).length

    // Active subscriptions
    const activeSubscriptions = users.filter(
      (u) => u.subscription.active && u.subscription.expiresAt && new Date(u.subscription.expiresAt) > now
    ).length

    // Revenue this month
    const revenueThisMonth = payments
      .filter((p) => p.status === "COMPLETED" && new Date(p.createdAt) >= monthStart)
      .reduce((sum, p) => sum + p.amount, 0)

    // Total revenue
    const totalRevenue = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + p.amount, 0)

    // Pending payments
    const pendingPayments = payments.filter((p) => p.status === "PENDING").length

    // Banned users
    const bannedUsers = users.filter((u) => u.banned).length

    // Popular commands
    const commandCounts: Record<string, number> = {}
    logs.forEach((l) => {
      if (l.command && l.command !== "ai_chat" && l.command !== "system") {
        commandCounts[l.command] = (commandCounts[l.command] || 0) + 1
      }
    })
    const popularCommands = Object.entries(commandCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([command, count]) => ({ command, count }))

    // Daily messages (last 7 days)
    const dailyMessages: { date: string; count: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().slice(0, 10)
      const count = logs.filter(
        (l) => l.timestamp.startsWith(dateStr) && (l.type === "command" || l.type === "ai_chat")
      ).length
      dailyMessages.push({ date: dateStr, count })
    }

    // Monthly revenue (last 6 months)
    const monthlyRevenue: { month: string; amount: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthStr = date.toLocaleDateString("en", { month: "short", year: "2-digit" })
      const amount = payments
        .filter(
          (p) =>
            p.status === "COMPLETED" &&
            new Date(p.createdAt) >= date &&
            new Date(p.createdAt) < nextMonth
        )
        .reduce((sum, p) => sum + p.amount, 0)
      monthlyRevenue.push({ month: monthStr, amount })
    }

    const stats: DashboardStats = {
      totalUsers: users.length,
      activeSubscriptions,
      totalRevenue,
      messagesToday,
      messagesThisWeek,
      revenueThisMonth,
      pendingPayments,
      bannedUsers,
      popularCommands,
      recentActivity: logs.slice(0, 10),
      dailyMessages,
      monthlyRevenue,
    }

    return NextResponse.json(stats)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Server error"
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
