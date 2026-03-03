// ============================================
// PeterAi - Baileys Auth State (PostgreSQL)
// Stores WhatsApp session in Neon database
// Powered by Peter Joram
// ============================================

import { getDb } from "./db"
import type { AuthenticationCreds, SignalDataTypeMap } from "@whiskeysockets/baileys"
import { proto } from "@whiskeysockets/baileys"
import { initAuthCreds, BufferJSON } from "@whiskeysockets/baileys"

export type AuthState = {
  creds: AuthenticationCreds
  keys: {
    get: <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => Promise<{ [id: string]: SignalDataTypeMap[T] | undefined }>
    set: (data: { [type: string]: { [id: string]: SignalDataTypeMap[keyof SignalDataTypeMap] | null } }) => Promise<void>
  }
  saveCreds: () => Promise<void>
}

async function loadCreds(): Promise<AuthenticationCreds> {
  const sql = getDb()
  try {
    const rows = await sql`SELECT data FROM wa_auth_creds WHERE id = 'creds' LIMIT 1`
    if (rows.length > 0 && rows[0].data && Object.keys(rows[0].data).length > 0) {
      return JSON.parse(JSON.stringify(rows[0].data), BufferJSON.reviver) as AuthenticationCreds
    }
  } catch (err) {
    console.error("Failed to load creds from DB:", err)
  }
  return initAuthCreds()
}

async function saveCreds(creds: AuthenticationCreds): Promise<void> {
  const sql = getDb()
  const data = JSON.parse(JSON.stringify(creds, BufferJSON.replacer))
  await sql`
    INSERT INTO wa_auth_creds (id, data, updated_at) 
    VALUES ('creds', ${JSON.stringify(data)}::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(data)}::jsonb, updated_at = NOW()
  `
}

async function loadKeys<T extends keyof SignalDataTypeMap>(
  type: T,
  ids: string[]
): Promise<{ [id: string]: SignalDataTypeMap[T] | undefined }> {
  const sql = getDb()
  const result: { [id: string]: SignalDataTypeMap[T] | undefined } = {}

  if (ids.length === 0) return result

  const dbIds = ids.map((id) => `${type}-${id}`)
  
  try {
    const rows = await sql`
      SELECT id, data FROM wa_auth_keys WHERE id = ANY(${dbIds})
    `

    for (const row of rows) {
      const originalId = (row.id as string).replace(`${type}-`, "")
      let value = JSON.parse(JSON.stringify(row.data), BufferJSON.reviver)

      if (type === "app-state-sync-key" && value) {
        value = proto.Message.AppStateSyncKeyData.fromObject(value)
      }

      result[originalId] = value as SignalDataTypeMap[T]
    }
  } catch (err) {
    console.error("Failed to load keys:", err)
  }

  return result
}

async function saveKeys(
  data: { [type: string]: { [id: string]: SignalDataTypeMap[keyof SignalDataTypeMap] | null } }
): Promise<void> {
  const sql = getDb()

  for (const [type, entries] of Object.entries(data)) {
    for (const [id, value] of Object.entries(entries)) {
      const dbId = `${type}-${id}`
      
      if (value === null) {
        await sql`DELETE FROM wa_auth_keys WHERE id = ${dbId}`
      } else {
        const serialized = JSON.parse(JSON.stringify(value, BufferJSON.replacer))
        await sql`
          INSERT INTO wa_auth_keys (id, type, data, updated_at)
          VALUES (${dbId}, ${type}, ${JSON.stringify(serialized)}::jsonb, NOW())
          ON CONFLICT (id) DO UPDATE SET data = ${JSON.stringify(serialized)}::jsonb, updated_at = NOW()
        `
      }
    }
  }
}

export async function usePostgresAuthState(): Promise<AuthState> {
  const creds = await loadCreds()

  return {
    creds,
    keys: {
      get: loadKeys,
      set: saveKeys,
    },
    saveCreds: async () => {
      await saveCreds(creds)
    },
  }
}

export async function clearAuthState(): Promise<void> {
  const sql = getDb()
  await sql`DELETE FROM wa_auth_creds WHERE id = 'creds'`
  await sql`DELETE FROM wa_auth_keys`
}
