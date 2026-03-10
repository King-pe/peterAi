// ============================================
// PeterAi - PeterPay API Client
// ============================================

const PETERPAY_BASE = "https://www.peterpay.link/api/v1"

function getApiKey(): string {
  const key = process.env.PETERPAY_API_KEY
  if (!key) {
    console.warn("PETERPAY_API_KEY is not set, using default")
    return "pk_e0bc3294452ecd11c0343b3f"
  }
  return key
}

export interface CreateOrderResponse {
  status: string
  message: string
  data?: {
    order_id: string
    payment_status: string
  }
}

export interface OrderPayResponse {
  status: string
  message: string
  data?: {
    order_id: string
    network: string
    gross_amount: number
    fee: number
    net_amount: number
    payment_status: string
  }
}

export interface OrderStatusResponse {
  status: string
  data?: {
    order_id: string
    payment_status: "PENDING" | "COMPLETED" | "FAILED"
    amount: number
    reference: string
  }
}

// ---- Create Order (Push USSD to customer) ----
export async function createOrder(
  amount: number,
  buyerPhone: string,
  buyerName: string,
  buyerEmail?: string
): Promise<CreateOrderResponse> {
  try {
    const response = await fetch(`${PETERPAY_BASE}/create_order`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": getApiKey(),
      },
      body: JSON.stringify({
        amount,
        buyer_phone: buyerPhone,
        buyer_name: buyerName,
        buyer_email: buyerEmail || `${buyerPhone}@peterai.bot`,
      }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error creating PeterPay order:", error)
    return {
      status: "error",
      message: "Failed to create order",
    }
  }
}

// ---- Direct Pay (8% fee deducted automatically) ----
export async function orderPay(
  amount: number,
  buyerPhone: string,
  buyerName: string,
  network?: "Vodacom" | "Tigo" | "Airtel"
): Promise<OrderPayResponse> {
  try {
    const body: Record<string, unknown> = {
      amount,
      buyer_phone: buyerPhone,
      buyer_name: buyerName,
    }

    if (network) {
      body.network = network
    }

    const response = await fetch(`${PETERPAY_BASE}/order_pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": getApiKey(),
      },
      body: JSON.stringify(body),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error creating PeterPay direct pay:", error)
    return {
      status: "error",
      message: "Failed to initiate payment",
    }
  }
}

// ---- Check Order Status ----
export async function checkOrderStatus(
  orderId: string
): Promise<OrderStatusResponse> {
  try {
    const response = await fetch(`${PETERPAY_BASE}/order_status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": getApiKey(),
      },
      body: JSON.stringify({
        order_id: orderId,
      }),
    })

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Error checking order status:", error)
    return {
      status: "error",
    }
  }
}

// ---- Detect Mobile Provider from Phone ----
export function detectProvider(
  phone: string
): "Vodacom" | "Tigo" | "Airtel" {
  const cleaned = phone.replace(/[^0-9]/g, "")
  const last9 = cleaned.slice(-9)
  const prefix = last9.substring(0, 2)

  switch (prefix) {
    case "65":
    case "67":
    case "71":
      return "Tigo"
    case "68":
    case "69":
    case "78":
      return "Airtel"
    default:
      // Vodacom/M-Pesa: 74, 75, 76, 77
      return "Vodacom"
  }
}

// ---- Calculate credits from amount ----
export function calculateCredits(amount: number): number {
  if (amount >= 6000) return 100
  if (amount >= 3500) return 50
  if (amount >= 2000) return 25
  if (amount >= 1000) return 10
  return Math.floor(amount / 100) // 1 credit per 100 TZS for smaller amounts
}
