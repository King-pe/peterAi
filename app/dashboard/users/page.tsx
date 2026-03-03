"use client"

import { useState } from "react"
import useSWR from "swr"
import { Users, Search, Ban, CheckCircle2, Edit, Loader2, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import type { User } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function UsersPage() {
  const { data: users, isLoading, mutate } = useSWR<User[]>("/api/users", fetcher)
  const [search, setSearch] = useState("")
  const [editUser, setEditUser] = useState<User | null>(null)
  const [editCredits, setEditCredits] = useState(0)
  const [saving, setSaving] = useState(false)

  const filteredUsers = users?.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.phone.includes(search)
  ) || []

  async function toggleBan(user: User) {
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: user.phone, banned: !user.banned }),
      })
      if (res.ok) {
        mutate()
        toast.success(user.banned ? "User unbanned" : "User banned")
      }
    } catch {
      toast.error("Failed to update user")
    }
  }

  async function saveCredits() {
    if (!editUser) return
    setSaving(true)
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: editUser.phone, credits: editCredits }),
      })
      if (res.ok) {
        mutate()
        setEditUser(null)
        toast.success("Credits updated")
      }
    } catch {
      toast.error("Failed to update credits")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground">
          {users?.length || 0} total users
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Users List */}
      <div className="flex flex-col gap-3">
        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center gap-2 py-16">
              <Users className="h-12 w-12 text-muted-foreground/40" />
              <p className="text-muted-foreground">No users found</p>
            </CardContent>
          </Card>
        ) : (
          filteredUsers.map((user) => (
            <Card key={user.phone} className="border-border">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-foreground">{user.name}</p>
                    {user.banned && (
                      <Badge variant="destructive" className="text-xs">Banned</Badge>
                    )}
                    {user.subscription.active && (
                      <Badge className="bg-primary/10 text-primary text-xs">Pro</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{user.phone}</p>
                </div>
                <div className="hidden flex-col items-end md:flex">
                  <p className="text-sm font-medium text-foreground">{user.credits} credits</p>
                  <p className="text-xs text-muted-foreground">{user.totalMessages} messages</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setEditUser(user)
                      setEditCredits(user.credits)
                    }}
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant={user.banned ? "outline" : "destructive"}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => toggleBan(user)}
                  >
                    {user.banned ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Ban className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Credits Dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Credits</DialogTitle>
            <DialogDescription>
              Update credits for {editUser?.name} ({editUser?.phone})
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 py-4">
            <Label className="text-foreground">Credits</Label>
            <Input
              type="number"
              value={editCredits}
              onChange={(e) => setEditCredits(parseInt(e.target.value) || 0)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button onClick={saveCredits} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
