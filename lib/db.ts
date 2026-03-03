// ============================================
// PeterAi - Neon PostgreSQL Database Client
// Powered by Peter Joram
// ============================================

import { neon } from "@neondatabase/serverless"

function getDbUrl(): string {
  const url = process.env.DATABASE_URL
  if (!url) {
    throw new Error("DATABASE_URL environment variable is not set")
  }
  return url
}

export function getDb() {
  return neon(getDbUrl())
}
