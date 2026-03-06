import type { UserRole } from "@/lib/types"

const encoder = new TextEncoder()
const decoder = new TextDecoder()
const SESSION_ALG = "HS256"
const TOKEN_TYPE = "JWT"

export const SESSION_COOKIE_NAME = "aquapulse_session"

export interface SessionPayload {
  sub: number
  email: string
  name: string
  role: UserRole
  iat: number
  exp: number
}

function toBase64(input: string): string {
  if (typeof btoa === "function") {
    return btoa(input)
  }

  return Buffer.from(input, "binary").toString("base64")
}

function fromBase64(input: string): string {
  if (typeof atob === "function") {
    return atob(input)
  }

  return Buffer.from(input, "base64").toString("binary")
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = ""
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return toBase64(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function base64UrlToBytes(base64Url: string): Uint8Array {
  const normalized = base64Url.replace(/-/g, "+").replace(/_/g, "/")
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4)
  const binary = fromBase64(padded)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function encodeJson(data: unknown): string {
  return bytesToBase64Url(encoder.encode(JSON.stringify(data)))
}

function decodeJson<T>(base64Url: string): T | null {
  try {
    const bytes = base64UrlToBytes(base64Url)
    const raw = decoder.decode(bytes)
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function getSecret(): string {
  return process.env.AQUAPULSE_AUTH_SECRET ?? "aquapulse_dev_secret_change_me"
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    ["sign", "verify"],
  )
}

async function sign(input: string): Promise<string> {
  const key = await getSigningKey()
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(input))
  return bytesToBase64Url(new Uint8Array(signature))
}

export async function createSessionToken(
  payload: Omit<SessionPayload, "iat" | "exp">,
  maxAgeSeconds = 60 * 60 * 8,
): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: SessionPayload = {
    ...payload,
    iat: now,
    exp: now + maxAgeSeconds,
  }

  const header = encodeJson({ alg: SESSION_ALG, typ: TOKEN_TYPE })
  const body = encodeJson(fullPayload)
  const unsignedToken = `${header}.${body}`
  const signature = await sign(unsignedToken)

  return `${unsignedToken}.${signature}`
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const parts = token.split(".")
  if (parts.length !== 3) {
    return null
  }

  const [headerPart, payloadPart, signaturePart] = parts
  const header = decodeJson<{ alg?: string; typ?: string }>(headerPart)
  if (!header || header.alg !== SESSION_ALG || header.typ !== TOKEN_TYPE) {
    return null
  }

  const payload = decodeJson<SessionPayload>(payloadPart)
  if (!payload) {
    return null
  }

  const key = await getSigningKey()
  const verified = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlToBytes(signaturePart),
    encoder.encode(`${headerPart}.${payloadPart}`),
  )

  if (!verified) {
    return null
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp <= now) {
    return null
  }

  return payload
}

export function readCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) {
    return null
  }

  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const pattern = new RegExp(`(?:^|;\\s*)${escapedName}=([^;]+)`)
  const match = cookieHeader.match(pattern)

  if (!match) {
    return null
  }

  return decodeURIComponent(match[1])
}
