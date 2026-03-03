"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { Settings, Loader2, Save, MessageSquare, Zap, Bot, CreditCard, Brain } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import type { BotSettings } from "@/lib/types"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function SettingsPage() {
  const { data: settings, mutate } = useSWR<BotSettings>("/api/settings", fetcher)
  const [form, setForm] = useState<Partial<BotSettings>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (settings) {
      setForm(settings)
    }
  }, [settings])

  function updateField<K extends keyof BotSettings>(key: K, value: BotSettings[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const updated = await res.json()
        mutate(updated)
        toast.success("Settings saved")
      } else {
        toast.error("Failed to save settings")
      }
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (!settings) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure your bot</p>
        </div>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure your WhatsApp bot</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>

      {/* Auto Features */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Zap className="h-5 w-5 text-primary" />
            Auto Features
          </CardTitle>
          <CardDescription>
            Control automatic typing indicators and smart reactions
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Auto Typing</p>
                <p className="text-sm text-muted-foreground">
                  Show typing indicator before sending a response
                </p>
              </div>
            </div>
            <Switch
              checked={form.autoTypingEnabled ?? true}
              onCheckedChange={(v) => updateField("autoTypingEnabled", v)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground">Auto Reaction</p>
                <p className="text-sm text-muted-foreground">
                  React with contextual emojis based on message content (AI-powered, not every message)
                </p>
              </div>
            </div>
            <Switch
              checked={form.autoReactionEnabled ?? true}
              onCheckedChange={(v) => updateField("autoReactionEnabled", v)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Bot Identity */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Bot className="h-5 w-5 text-primary" />
            Bot Identity
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-foreground">Bot Name</Label>
            <Input
              value={form.botName || ""}
              onChange={(e) => updateField("botName", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-foreground">Welcome Message</Label>
            <Textarea
              value={form.welcomeMessage || ""}
              onChange={(e) => updateField("welcomeMessage", e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* AI Configuration */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Brain className="h-5 w-5 text-primary" />
            AI Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label className="text-foreground">AI Model</Label>
            <Input
              value={form.aiModel || ""}
              onChange={(e) => updateField("aiModel", e.target.value)}
              placeholder="llama-3.3-70b-versatile"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-foreground">System Prompt</Label>
            <Textarea
              value={form.aiSystemPrompt || ""}
              onChange={(e) => updateField("aiSystemPrompt", e.target.value)}
              rows={4}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-foreground">Max Message Length</Label>
            <Input
              type="number"
              value={form.maxMessageLength || 4096}
              onChange={(e) => updateField("maxMessageLength", parseInt(e.target.value) || 4096)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <CreditCard className="h-5 w-5 text-primary" />
            Pricing
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label className="text-foreground">Credit Pack Price (TZS)</Label>
            <Input
              type="number"
              value={form.creditPrice || 0}
              onChange={(e) => updateField("creditPrice", parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-foreground">Credits Per Pack</Label>
            <Input
              type="number"
              value={form.creditsPerPack || 0}
              onChange={(e) => updateField("creditsPerPack", parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-foreground">Subscription Price (TZS/month)</Label>
            <Input
              type="number"
              value={form.subscriptionPrice || 0}
              onChange={(e) => updateField("subscriptionPrice", parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-foreground">Credits Per AI Message</Label>
            <Input
              type="number"
              value={form.messageCreditCost || 1}
              onChange={(e) => updateField("messageCreditCost", parseInt(e.target.value) || 1)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label className="text-foreground">Credits Per Image</Label>
            <Input
              type="number"
              value={form.imageCreditCost || 3}
              onChange={(e) => updateField("imageCreditCost", parseInt(e.target.value) || 3)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Save button at bottom too */}
      <div className="flex justify-end pb-8">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save All Changes
        </Button>
      </div>
    </div>
  )
}
