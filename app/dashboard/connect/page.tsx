"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { QrCode, Smartphone, Loader2, CheckCircle2, XCircle, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

type ConnectionStatus = "disconnected" | "connecting" | "connected" | "error"

export default function ConnectPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("disconnected")
  const [connectedPhone, setConnectedPhone] = useState<string | null>(null)
  const [qrData, setQrData] = useState<string | null>(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [phoneLoading, setPhoneLoading] = useState(false)
  const [phoneCode, setPhoneCode] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/connect/status")
      if (!res.ok) return
      const data = await res.json()
      if (data.connected) {
        setConnectionStatus("connected")
        setConnectedPhone(data.phone || null)
      } else {
        setConnectionStatus("disconnected")
        setConnectedPhone(null)
      }
    } catch {
      setConnectionStatus("error")
    }
  }, [])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  // Poll when connecting
  useEffect(() => {
    if (connectionStatus !== "connecting") return
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/connect/status")
        if (!res.ok) return
        const data = await res.json()
        if (data.connected) {
          setConnectionStatus("connected")
          setConnectedPhone(data.phone || null)
          toast.success("WhatsApp connected!")
          clearInterval(interval)
        }
      } catch { /* ignore */ }
    }, 5000)
    return () => clearInterval(interval)
  }, [connectionStatus])

  async function fetchQR() {
    setQrLoading(true)
    try {
      const res = await fetch("/api/connect/qr")
      const data = await res.json()
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

  // Auto-refresh QR
  useEffect(() => {
    if (connectionStatus !== "connecting" || !qrData) return
    const interval = setInterval(fetchQR, 20000)
    return () => clearInterval(interval)
  }, [connectionStatus, qrData])

  async function handlePhoneLogin() {
    if (!phoneNumber.trim()) {
      toast.error("Enter a phone number")
      return
    }
    setPhoneLoading(true)
    try {
      const res = await fetch("/api/connect/phone", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: phoneNumber.trim() }),
      })
      const data = await res.json()
      if (data.token || data.code) {
        setPhoneCode(data.token || data.code)
        setConnectionStatus("connecting")
        toast.success("Code generated!")
      } else if (data.error) {
        toast.error(data.error)
      }
    } catch {
      toast.error("Failed to generate code")
    } finally {
      setPhoneLoading(false)
    }
  }

  async function handleDisconnect() {
    setDisconnecting(true)
    try {
      const res = await fetch("/api/connect/disconnect", { method: "POST" })
      const data = await res.json()
      if (data.success) {
        setConnectionStatus("disconnected")
        setConnectedPhone(null)
        setQrData(null)
        setPhoneCode(null)
        toast.success("WhatsApp disconnected")
      } else {
        toast.error("Failed to disconnect")
      }
    } catch {
      toast.error("Failed to disconnect")
    } finally {
      setDisconnecting(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Connect WhatsApp</h1>
        <p className="text-muted-foreground">Link your WhatsApp device to PeterAi using Baileys (direct connection)</p>
      </div>

      {/* Status Card */}
      <Card className="border-border">
        <CardContent className="flex items-center gap-4 p-6">
          {connectionStatus === "connected" ? (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <Wifi className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Connected</p>
                {connectedPhone && (
                  <p className="text-sm text-muted-foreground">{connectedPhone}</p>
                )}
              </div>
              <Badge className="bg-primary/10 text-primary">Online</Badge>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDisconnect}
                disabled={disconnecting}
              >
                {disconnecting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Disconnect"
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                <WifiOff className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-foreground">Disconnected</p>
                <p className="text-sm text-muted-foreground">Connect your WhatsApp below</p>
              </div>
              <Badge variant="secondary">Offline</Badge>
            </>
          )}
        </CardContent>
      </Card>

      {/* Connection Methods */}
      {connectionStatus !== "connected" && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Connection Method</CardTitle>
            <CardDescription>Choose QR scan or phone number code</CardDescription>
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

              <TabsContent value="qr" className="mt-6">
                <div className="flex flex-col items-center gap-4">
                  {qrData ? (
                    <div className="rounded-xl border border-border bg-card p-4">
                      <img
                        src={`data:image/png;base64,${qrData}`}
                        alt="WhatsApp QR Code"
                        className="h-64 w-64"
                      />
                      <p className="mt-2 text-xs text-muted-foreground text-center">
                        Open WhatsApp {'>'} Settings {'>'} Linked Devices {'>'} Link a Device
                      </p>
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
                  <Button onClick={fetchQR} disabled={qrLoading} className="w-full max-w-xs">
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
                </div>
              </TabsContent>

              <TabsContent value="phone" className="mt-6">
                <div className="mx-auto flex max-w-sm flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="connectPhone" className="text-foreground">Phone Number</Label>
                    <Input
                      id="connectPhone"
                      type="tel"
                      placeholder="+255712345678"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>

                  {phoneCode && (
                    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
                      <p className="text-sm text-muted-foreground">Enter this code on WhatsApp:</p>
                      <p className="mt-2 font-mono text-2xl font-bold tracking-widest text-primary">
                        {phoneCode}
                      </p>
                      <p className="mt-3 text-xs text-muted-foreground">
                        Go to WhatsApp {'>'} Settings {'>'} Linked Devices {'>'} Link a Device {'>'} Link with Phone Number
                      </p>
                      {connectionStatus === "connecting" && (
                        <div className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Waiting for confirmation...
                        </div>
                      )}
                    </div>
                  )}

                  <Button onClick={handlePhoneLogin} disabled={phoneLoading} className="w-full">
                    {phoneLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Code...
                      </>
                    ) : (
                      "Get Connection Code"
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
