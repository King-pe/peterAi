"use client"

import { useState } from "react"
import useSWR from "swr"
import { CreditCard, Search, Loader2, CheckCircle2, Clock, XCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Payment } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function PaymentsPage() {
  const { data: payments, isLoading } = useSWR<Payment[]>("/api/payments", fetcher)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  const filtered = payments?.filter((p) => {
    const matchSearch =
      p.phone.includes(search) || p.orderId.includes(search)
    const matchStatus = statusFilter === "all" || p.status === statusFilter
    return matchSearch && matchStatus
  }) || []

  const statusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle2 className="h-3.5 w-3.5" />
      case "PENDING":
        return <Clock className="h-3.5 w-3.5" />
      default:
        return <XCircle className="h-3.5 w-3.5" />
    }
  }

  const statusVariant = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "default" as const
      case "PENDING":
        return "secondary" as const
      default:
        return "destructive" as const
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Payments</h1>
        <p className="text-muted-foreground">
          {payments?.length || 0} total payments
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by phone or order ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Payments List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center gap-2 py-16">
              <CreditCard className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">No payments found</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((payment) => (
            <Card key={payment.id} className="border-border">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <CreditCard className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{payment.phone}</p>
                  <p className="text-xs text-muted-foreground">
                    {payment.orderId} - {payment.type}
                  </p>
                </div>
                <div className="hidden flex-col items-end md:flex">
                  <p className="font-semibold text-foreground">
                    {payment.amount.toLocaleString()} {payment.currency}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(payment.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant={statusVariant(payment.status)} className="gap-1">
                  {statusIcon(payment.status)}
                  {payment.status}
                </Badge>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
