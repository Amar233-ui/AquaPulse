import "server-only"

import { getDb } from "@/lib/server/db"
import type { UserRole } from "@/lib/types"

const KV_REST_URL = process.env.KV_REST_API_URL?.trim() || process.env.UPSTASH_REDIS_REST_URL?.trim() || ""
const KV_READ_TOKEN =
  process.env.KV_REST_API_READ_ONLY_TOKEN?.trim() ||
  process.env.KV_REST_API_TOKEN?.trim() ||
  process.env.UPSTASH_REDIS_REST_TOKEN?.trim() ||
  ""
const KV_WRITE_TOKEN = process.env.KV_REST_API_TOKEN?.trim() || process.env.UPSTASH_REDIS_REST_TOKEN?.trim() || ""
const KV_PREFIX = (process.env.AQUAPULSE_USERSTORE_PREFIX?.trim() || "aquapulse:users").replace(/:+$/, "")
const KV_ENABLED = KV_REST_URL !== "" && KV_READ_TOKEN !== ""

export interface StoredUserRow {
  id: number
  name: string
  email: string
  role: UserRole
  passwordHash: string
  isActive: number
  createdAt: string
  lastLoginAt: string | null
}

export function isSharedUserStoreEnabled(): boolean {
  return KV_ENABLED
}

function key(name: string): string {
  return `${KV_PREFIX}:${name}`
}

function normalizeInt(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.trunc(value)
  }

  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number.parseInt(value, 10)
    if (Number.isFinite(parsed)) {
      return parsed
    }
  }

  return fallback
}

function normalizeRole(value: unknown): UserRole {
  if (value === "admin" || value === "operateur") {
    return value
  }
  return "citoyen"
}

function toStoredUser(value: unknown): StoredUserRow | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const source = value as Partial<StoredUserRow>
  const id = normalizeInt(source.id, -1)
  if (!Number.isInteger(id) || id <= 0) {
    return null
  }

  const name = typeof source.name === "string" ? source.name.trim() : ""
  const email = typeof source.email === "string" ? source.email.trim().toLowerCase() : ""
  const passwordHash = typeof source.passwordHash === "string" ? source.passwordHash : ""
  const createdAt = typeof source.createdAt === "string" && source.createdAt ? source.createdAt : new Date().toISOString()
  const lastLoginAt = typeof source.lastLoginAt === "string" ? source.lastLoginAt : null

  if (!name || !email || !passwordHash) {
    return null
  }

  return {
    id,
    name,
    email,
    role: normalizeRole(source.role),
    passwordHash,
    isActive: normalizeInt(source.isActive, 1) === 1 ? 1 : 0,
    createdAt,
    lastLoginAt,
  }
}

async function kvCommand<T>(command: string[], options?: { write?: boolean }): Promise<T> {
  if (!KV_ENABLED) {
    throw new Error("Shared KV user store is not configured")
  }

  const token = options?.write ? KV_WRITE_TOKEN : KV_READ_TOKEN
  if (!token) {
    throw new Error("Shared KV user store is read-only. Configure KV_REST_API_TOKEN for write operations.")
  }

  const response = await fetch(KV_REST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(command),
    cache: "no-store",
  })

  if (!response.ok) {
    throw new Error(`Shared user store error (${response.status})`)
  }

  const payload = (await response.json()) as { result?: T; error?: string }
  if (payload.error) {
    throw new Error(payload.error)
  }

  if (!("result" in payload)) {
    throw new Error("Shared user store returned an invalid response")
  }

  return payload.result as T
}

async function findUserByEmailSqlite(email: string): Promise<StoredUserRow | null> {
  const db = await getDb()
  const row = db
    .prepare(
      `SELECT id,
              name,
              email,
              role,
              password_hash as passwordHash,
              is_active as isActive,
              created_at as createdAt,
              last_login_at as lastLoginAt
       FROM users
       WHERE email = ?
       LIMIT 1`,
    )
    .get(email) as StoredUserRow | undefined

  return row ?? null
}

async function findUserByIdSqlite(id: number): Promise<StoredUserRow | null> {
  const db = await getDb()
  const row = db
    .prepare(
      `SELECT id,
              name,
              email,
              role,
              password_hash as passwordHash,
              is_active as isActive,
              created_at as createdAt,
              last_login_at as lastLoginAt
       FROM users
       WHERE id = ?
       LIMIT 1`,
    )
    .get(id) as StoredUserRow | undefined

  return row ?? null
}

async function createUserSqlite(input: {
  name: string
  email: string
  role: UserRole
  passwordHash: string
}): Promise<StoredUserRow> {
  const db = await getDb()
  const createdAt = new Date().toISOString()

  const result = db
    .prepare(
      `INSERT INTO users (name, email, password_hash, role, is_active, created_at)
       VALUES (?, ?, ?, ?, 1, ?)`,
    )
    .run(input.name, input.email, input.passwordHash, input.role, createdAt)

  return {
    id: Number(result.lastInsertRowid),
    name: input.name,
    email: input.email,
    role: input.role,
    passwordHash: input.passwordHash,
    isActive: 1,
    createdAt,
    lastLoginAt: null,
  }
}

async function listUsersSqlite(search?: string): Promise<StoredUserRow[]> {
  const db = await getDb()
  const whereClauses: string[] = []
  const params: Array<string | number> = []

  if (search) {
    whereClauses.push("(name LIKE ? OR email LIKE ?)")
    const term = `%${search}%`
    params.push(term, term)
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : ""

  return db
    .prepare(
      `SELECT id,
              name,
              email,
              role,
              password_hash as passwordHash,
              is_active as isActive,
              created_at as createdAt,
              last_login_at as lastLoginAt
       FROM users
       ${whereSql}
       ORDER BY id ASC`,
    )
    .all(...params) as unknown as StoredUserRow[]
}

async function setUserStatusSqlite(userId: number, active: boolean): Promise<void> {
  const db = await getDb()
  db.prepare("UPDATE users SET is_active = ? WHERE id = ?").run(active ? 1 : 0, userId)
}

async function touchUserLoginSqlite(userId: number): Promise<void> {
  const db = await getDb()
  db.prepare("UPDATE users SET last_login_at = ? WHERE id = ?").run(new Date().toISOString(), userId)
}

async function findUserByIdKv(userId: number): Promise<StoredUserRow | null> {
  const raw = await kvCommand<string | null>(["GET", key(`id:${userId}`)])
  if (typeof raw !== "string" || raw.trim() === "") {
    return null
  }

  try {
    return toStoredUser(JSON.parse(raw))
  } catch {
    return null
  }
}

async function findUserByEmailKv(email: string): Promise<StoredUserRow | null> {
  const idRaw = await kvCommand<string | number | null>(["GET", key(`email:${email}`)])
  const userId = normalizeInt(idRaw, -1)
  if (!Number.isInteger(userId) || userId <= 0) {
    return null
  }

  return findUserByIdKv(userId)
}

async function createUserKv(input: {
  name: string
  email: string
  role: UserRole
  passwordHash: string
}): Promise<StoredUserRow> {
  const existingId = await kvCommand<string | number | null>(["GET", key(`email:${input.email}`)])
  if (normalizeInt(existingId, 0) > 0) {
    throw new Error("Cet email est deja utilise")
  }

  const userId = normalizeInt(await kvCommand<string | number>(["INCR", key("seq")], { write: true }), -1)
  if (userId <= 0) {
    throw new Error("Impossible de generer un identifiant utilisateur")
  }

  const createdAt = new Date().toISOString()
  const row: StoredUserRow = {
    id: userId,
    name: input.name,
    email: input.email,
    role: input.role,
    passwordHash: input.passwordHash,
    isActive: 1,
    createdAt,
    lastLoginAt: null,
  }

  const reserved = normalizeInt(
    await kvCommand<string | number>(["SETNX", key(`email:${row.email}`), String(row.id)], { write: true }),
    0,
  )
  if (reserved !== 1) {
    throw new Error("Cet email est deja utilise")
  }

  try {
    await kvCommand(["SET", key(`id:${row.id}`), JSON.stringify(row)], { write: true })
    await kvCommand(["SADD", key("ids"), String(row.id)], { write: true })
    return row
  } catch (error) {
    await kvCommand(["DEL", key(`email:${row.email}`)], { write: true }).catch(() => undefined)
    throw error
  }
}

async function listUsersKv(search?: string): Promise<StoredUserRow[]> {
  const ids = await kvCommand<Array<string | number>>(["SMEMBERS", key("ids")])
  if (!Array.isArray(ids) || ids.length === 0) {
    return []
  }

  const normalizedIds = ids
    .map((id) => normalizeInt(id, -1))
    .filter((id): id is number => Number.isInteger(id) && id > 0)
    .sort((a, b) => a - b)

  if (normalizedIds.length === 0) {
    return []
  }

  const rawValues = await kvCommand<Array<string | null>>(["MGET", ...normalizedIds.map((id) => key(`id:${id}`))])
  const users = (Array.isArray(rawValues) ? rawValues : [])
    .map((value) => {
      if (!value || typeof value !== "string") {
        return null
      }
      try {
        return toStoredUser(JSON.parse(value))
      } catch {
        return null
      }
    })
    .filter((user): user is StoredUserRow => Boolean(user))

  if (!search) {
    return users
  }

  const query = search.trim().toLowerCase()
  if (!query) {
    return users
  }

  return users.filter((user) => user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query))
}

async function setUserStatusKv(userId: number, active: boolean): Promise<boolean> {
  const user = await findUserByIdKv(userId)
  if (!user) {
    return false
  }

  const updated: StoredUserRow = {
    ...user,
    isActive: active ? 1 : 0,
  }
  await kvCommand(["SET", key(`id:${userId}`), JSON.stringify(updated)], { write: true })
  return true
}

async function touchUserLoginKv(userId: number): Promise<boolean> {
  const user = await findUserByIdKv(userId)
  if (!user) {
    return false
  }

  const updated: StoredUserRow = {
    ...user,
    lastLoginAt: new Date().toISOString(),
  }
  await kvCommand(["SET", key(`id:${userId}`), JSON.stringify(updated)], { write: true })
  return true
}

async function safeSqlite<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation()
  } catch {
    return fallback
  }
}

export async function findStoredUserByEmail(email: string): Promise<StoredUserRow | null> {
  const normalizedEmail = email.trim().toLowerCase()
  if (!normalizedEmail) {
    return null
  }

  if (!KV_ENABLED) {
    return findUserByEmailSqlite(normalizedEmail)
  }

  const kvUser = await findUserByEmailKv(normalizedEmail)
  if (kvUser) {
    return kvUser
  }

  return safeSqlite(() => findUserByEmailSqlite(normalizedEmail), null)
}

export async function findStoredUserById(userId: number): Promise<StoredUserRow | null> {
  if (!Number.isInteger(userId) || userId <= 0) {
    return null
  }

  if (!KV_ENABLED) {
    return findUserByIdSqlite(userId)
  }

  const kvUser = await findUserByIdKv(userId)
  if (kvUser) {
    return kvUser
  }

  return safeSqlite(() => findUserByIdSqlite(userId), null)
}

export async function createStoredUser(input: {
  name: string
  email: string
  role: UserRole
  passwordHash: string
}): Promise<StoredUserRow> {
  const normalized = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    role: input.role,
    passwordHash: input.passwordHash,
  }

  const existing = await findStoredUserByEmail(normalized.email)
  if (existing) {
    throw new Error("Cet email est deja utilise")
  }

  if (KV_ENABLED) {
    return createUserKv(normalized)
  }

  return createUserSqlite(normalized)
}

export async function listStoredUsers(search?: string): Promise<StoredUserRow[]> {
  if (!KV_ENABLED) {
    return listUsersSqlite(search)
  }

  const [kvUsers, sqliteUsers] = await Promise.all([
    listUsersKv(search),
    safeSqlite(() => listUsersSqlite(search), [] as StoredUserRow[]),
  ])

  const byEmail = new Map<string, StoredUserRow>()
  for (const user of sqliteUsers) {
    byEmail.set(user.email.toLowerCase(), user)
  }

  for (const user of kvUsers) {
    byEmail.set(user.email.toLowerCase(), user)
  }

  return Array.from(byEmail.values()).sort((a, b) => a.id - b.id)
}

export async function setStoredUserActive(userId: number, active: boolean): Promise<void> {
  if (!KV_ENABLED) {
    await setUserStatusSqlite(userId, active)
    return
  }

  const [kvUpdated] = await Promise.all([
    setUserStatusKv(userId, active).catch(() => false),
    safeSqlite(() => setUserStatusSqlite(userId, active), undefined),
  ])

  if (!kvUpdated) {
    return
  }
}

export async function touchStoredUserLogin(userId: number): Promise<void> {
  if (!KV_ENABLED) {
    await touchUserLoginSqlite(userId)
    return
  }

  await Promise.all([
    touchUserLoginKv(userId).catch(() => false),
    safeSqlite(() => touchUserLoginSqlite(userId), undefined),
  ])
}
