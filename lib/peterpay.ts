// ============================================
// PeterAi - PeterPay API Client
// ============================================

import crypto from "crypto"
import type {
  PeterPayCreateOrderResponse,
  PeterPayDirectPayResponse,
  PeterPayStatusResponse,
} from "./types"

const PETERPAY_BASE = "https://api.peterpay.co.tz/v1"

function getApiKey(): string {
  const key = process.env.PETERPAY_API_KEY
  if (!key) throw new Error("PETERPAY_API_KEY is not set")
  return key
}

function getApiSecret(): string {
  const secret = process.env.PETERPAY_API_SECRET
  if (!secret) throw new Error("PETERPAY_API_SECRET is not set")
  return secret
}

async function peterpayRequest(
  endpoint: string,
  body: Record<string, unknown>
): Promise<unknown> {
  const url = `${PETERPAY_BASE}${endpoint}`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": getApiKey(),
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error(`PeterPay API error [${res.status}]: ${text}`)
    throw new Error(`PeterPay API error: ${res.status} - ${text}`)
  }

  return res.json()
}

// ---- Create Order ----
export async function createOrder(
  amount: number,
  phone: string,
  name: string,
  description: string,
  webhookUrl: string
): Promise<PeterPayCreateOrderResponse> {
  return (await peterpayRequest("/create_order", {
    amount,
    buyer_name: name,
    buyer_phone: phone,
    buyer_email: `${phone}@peterpay.bot`,
    description,
    webhook_url: webhookUrl,
    redirect_url: webhookUrl,
  })) as PeterPayCreateOrderResponse
}

// ---- Direct Pay (USSD Push) ----
export async function directPay(
  orderId: string,
  phone: string,
  provider: "Mpesa" | "TigoPesa" | "Airtel" | "Halopesa" = "Mpesa"
): Promise<PeterPayDirectPayResponse> {
  return (await peterpayRequest("/order_pay.php", {
    order_id: orderId,
    phone,
    provider,
  })) as PeterPayDirectPayResponse
}

// ---- Check Order Status ----
export async function checkOrderStatus(
  orderId: string
): Promise<PeterPayStatusResponse> {
  return (await peterpayRequest("/order_status", {
    order_id: orderId,
  })) as PeterPayStatusResponse
}

// ---- Verify Webhook Signature ----
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  try {
    const secret = getApiSecret()
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex")
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  } catch {
    return false
  }
}

// ---- Detect Mobile Provider from Phone ----
export function detectProvider(
  phone: string
): "Mpesa" | "TigoPesa" | "Airtel" | "Halopesa" {
  const cleaned = phone.replace(/[^0-9]/g, "")
  // Tanzania mobile providers by prefix
  const last9 = cleaned.slice(-9)
  const prefix = last9.substring(0, 2)

  switch (prefix) {
    case "65":
    case "67":
    case "68":
      return "TigoPesa"
    case "69":
    case "78":
      return "Airtel"
    case "62":
      return "Halopesa"
    default:
      // Vodacom/M-Pesa: 74, 75, 76
      return "Mpesa"
  }
}
