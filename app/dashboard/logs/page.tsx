"use client"

import { useState } from "react"
import useSWR from "swr"
import { ScrollText, Search, Loader2, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { LogEntry } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function LogsPage() {
  const { data: logs, isLoading } = useSWR<LogEntry[]>("/api/logs", fetcher)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  const filtered = logs?.filter((l) => {
    const matchSearch =
      l.userName.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search) ||
      l.message.toLowerCase().includes(search.toLowerCase()) ||
      l.command.toLowerCase().includes(search.toLowerCase())
    const matchType = typeFilter === "all" || l.type === typeFilter
    return matchSearch && matchType
  }) || []

  const typeVariant = (type: string) => {
    switch (type) {
      case "error":
        return "destructive" as const
      case "payment":
        return "default" as const
      case "ai_chat":
        return "secondary" as const
      default:
        return "outline" as const
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
        <p className="text-muted-foreground">
          {logs?.length || 0} total entries
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search logs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="command">Commands</SelectItem>
            <SelectItem value="ai_chat">AI Chat</SelectItem>
            <SelectItem value="payment">Payments</SelectItem>
            <SelectItem value="system">System</SelectItem>
            <SelectItem value="error">Errors</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Logs List */}
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center gap-2 py-16">
              <ScrollText className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">No logs found</p>
            </CardContent>
          </Card>
        ) : (
          filtered.slice(0, 100).map((log) => (
            <Card key={log.id} className="border-border">
              <CardContent className="flex items-start gap-3 p-3">
                <Badge
                  variant={typeVariant(log.type)}
                  className="mt-0.5 shrink-0 text-xs"
                >
                  {log.type}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {log.userName}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {log.command || "message"}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground">
                    {log.message}
                  </p>
                  {log.response && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground/70">
                      {"-> "}{log.response.slice(0, 100)}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
