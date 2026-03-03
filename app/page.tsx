"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Bot, QrCode, Smartphone, Loader2, CheckCircle2, ArrowRight, Zap, Shield, MessageSquare, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error"

export default function LandingPage() {
  const router = useRouter()
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected")
  const [qrData, setQrData] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneCode, setPhoneCode] = useState<string | null>(null)

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/connect/status")
      if (res.status === 401) return
      const data = await res.json()
      if (data.connected) {
        setConnectionStatus("connected")
      }
    } catch {
      // silently fail
    }
  }, [])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  // Poll status when connecting
  useEffect(() => {
    if (connectionStatus !== "connecting") return
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/connect/status")
        if (!res.ok) return
        const data = await res.json()
        if (data.connected) {
          setConnectionStatus("connected")
          toast.success("WhatsApp connected successfully!")
          clearInterval(interval)
        }
      } catch {
        // silently fail
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [connectionStatus])

  async function fetchQR() {
    setQrLoading(true)
    try {
      const res = await fetch("/api/connect/qr")
      if (res.status === 401) {
        toast.error("Login required. Redirecting...")
        router.push("/login")
        return
      }
      const data = await res.json()
      if (data.connected) {
        setConnectionStatus("connected")
        toast.success("Already connected!")
        return
      }
      if (data.qr) {
        setQrData(data.qr)
        setConnectionStatus("connecting")
      } else if (data.error) {
        toast.error(data.error)
      }
    } catch {
      toast.error("Failed to fetch QR code")
    } finally {
      setQrLoading(false)
    }
  }

  // Auto-refresh QR every 20 seconds
  useEffect(() => {
    if (connectionStatus !== "connecting" || !qrData) return
    const interval = setInterval(() => {
      fetchQR()
    }, 20000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connectionStatus, qrData])

  async function handlePhoneLogin() {
    if (!phoneNumber.trim()) {
      toast.error("Enter a phone number")
      return
    }
    setPhoneLoading(true)
    setPhoneCode(null)
    try {
      const res = await fetch("/api/connect/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber.trim() }),
      })
      if (res.status === 401) {
        toast.error("Login required. Redirecting...")
        router.push("/login")
        return
      }
      const data = await res.json()
      if (data.connected) {
        setConnectionStatus("connected")
        toast.success("Already connected!")
        return
      }
      if (data.code) {
        setPhoneCode(data.code)
        setConnectionStatus("connecting")
        toast.success("Code generated! Enter it on your WhatsApp.")
      } else if (data.error) {
        toast.error(data.error)
      }
    } catch {
      toast.error("Failed to generate code")
    } finally {
      setPhoneLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Bot className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground font-sans">PeterAi</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => router.push("/login")}>
            Admin Login
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
              <Zap className="h-3.5 w-3.5" />
              Powered by Baileys
            </div>
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl font-sans">
              Connect Your WhatsApp Bot in Seconds
            </h1>
            <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
              Link your WhatsApp number directly using QR code or phone pairing code.
              PeterAi handles conversations, payments, auto-typing, and smart reactions automatically.
            </p>
          </div>

          {/* Features */}
          <div className="mx-auto mt-12 grid max-w-4xl gap-4 sm:grid-cols-2 md:grid-cols-4">
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 text-center">
              <MessageSquare className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-card-foreground">Auto Typing</h3>
              <p className="text-sm text-muted-foreground">
                Shows typing indicator before responding
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 text-center">
              <Zap className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-card-foreground">Smart Reactions</h3>
              <p className="text-sm text-muted-foreground">
                AI-powered contextual emoji reactions
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 text-center">
              <Shield className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-card-foreground">Secure</h3>
              <p className="text-sm text-muted-foreground">
                End-to-end encrypted connections
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card p-6 text-center">
              <Lock className="h-8 w-8 text-primary" />
              <h3 className="font-semibold text-card-foreground">Database</h3>
              <p className="text-sm text-muted-foreground">
                PostgreSQL powered data persistence
              </p>
            </div>
          </div>

          {/* Connection Status Banner */}
          {connectionStatus === "connected" && (
            <div className="mx-auto mt-8 flex max-w-md items-center gap-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-primary" />
              <div className="flex-1">
                <p className="font-semibold text-foreground">WhatsApp Connected</p>
                <p className="text-sm text-muted-foreground">Your bot is live and ready.</p>
              </div>
              <Button size="sm" onClick={() => router.push("/dashboard")}>
                Dashboard
                <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Connection Card */}
          <Card className="mx-auto mt-8 max-w-lg border-border">
            <CardHeader className="text-center">
              <CardTitle className="text-foreground">Connect WhatsApp</CardTitle>
              <CardDescription>
                Choose QR code scan or phone pairing code to link your device.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="qr" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="qr" className="gap-2">
                    <QrCode className="h-4 w-4" />
                    QR Code
                  </TabsTrigger>
                  <TabsTrigger value="phone" className="gap-2">
                    <Smartphone className="h-4 w-4" />
                    Phone Code
                  </TabsTrigger>
                </TabsList>

                {/* QR Code Tab */}
                <TabsContent value="qr" className="mt-6">
                  <div className="flex flex-col items-center gap-4">
                    {qrData ? (
                      <div className="relative rounded-xl border border-border bg-card p-4">
                        <img
                          src={`data:image/png;base64,${qrData}`}
                          alt="WhatsApp QR Code"
                          className="h-64 w-64"
                        />
                        {connectionStatus === "connecting" && (
                          <div className="mt-2 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Waiting for scan...
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex h-64 w-64 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/50">
                        <QrCode className="h-16 w-16 text-muted-foreground/40" />
                      </div>
                    )}
                    <Button
                      onClick={fetchQR}
                      disabled={qrLoading || connectionStatus === "connected"}
                      className="w-full"
                    >
                      {qrLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : qrData ? (
                        "Refresh QR Code"
                      ) : (
                        "Get QR Code"
                      )}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      {'Open WhatsApp on your phone, go to Settings > Linked Devices > Link a Device, then scan this QR code.'}
                    </p>
                  </div>
                </TabsContent>

                {/* Phone Code Tab */}
                <TabsContent value="phone" className="mt-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="phone" className="text-foreground">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="+255712345678"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={connectionStatus === "connected"}
                      />
                      <p className="text-xs text-muted-foreground">
                        Enter the phone number with country code (e.g. +255...)
                      </p>
                    </div>

                    {phoneCode && (
                      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
                        <p className="text-sm text-muted-foreground">Enter this code on WhatsApp:</p>
                        <p className="mt-2 font-mono text-3xl font-bold tracking-[0.3em] text-primary">
                          {phoneCode}
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          {'Go to WhatsApp > Settings > Linked Devices > Link a Device > Link with phone number'}
                        </p>
                        {connectionStatus === "connecting" && (
                          <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            Waiting for confirmation...
                          </div>
                        )}
                      </div>
                    )}

                    <Button
                      onClick={handlePhoneLogin}
                      disabled={phoneLoading || connectionStatus === "connected"}
                      className="w-full"
                    >
                      {phoneLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating Code...
                        </>
                      ) : phoneCode ? (
                        "Regenerate Code"
                      ) : (
                        "Get Pairing Code"
                      )}
                    </Button>
                    <p className="text-center text-xs text-muted-foreground">
                      A pairing code will be generated. Enter it on your WhatsApp to connect without scanning a QR code.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-8">
          <div className="mx-auto max-w-6xl px-4 text-center text-sm text-muted-foreground">
            PeterAi WhatsApp Bot Platform. Powered by <span className="font-semibold text-foreground">Peter Joram</span>
          </div>
        </footer>
      </main>
    </div>
  )
}
