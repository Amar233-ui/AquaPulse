const encoder = new TextEncoder()

const DEFAULT_ITERATIONS = 160_000
const SALT_LENGTH = 16
const HASH_LENGTH = 32

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

function encodeBytes(bytes: Uint8Array): string {
  let binary = ""
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return toBase64(binary)
}

function decodeBytes(base64: string): Uint8Array {
  const binary = fromBase64(base64)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

async function deriveHash(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"])
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      iterations,
      salt,
    },
    keyMaterial,
    HASH_LENGTH * 8,
  )

  return new Uint8Array(bits)
}

function constantTimeEquals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) {
    return false
  }

  let diff = 0
  for (let index = 0; index < a.length; index += 1) {
    diff |= a[index] ^ b[index]
  }

  return diff === 0
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH))
  const hash = await deriveHash(password, salt, DEFAULT_ITERATIONS)

  return `${DEFAULT_ITERATIONS}:${encodeBytes(salt)}:${encodeBytes(hash)}`
}

export async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
  const [iterationsRaw, saltRaw, hashRaw] = encodedHash.split(":")
  if (!iterationsRaw || !saltRaw || !hashRaw) {
    return false
  }

  const iterations = Number.parseInt(iterationsRaw, 10)
  if (!Number.isInteger(iterations) || iterations <= 0) {
    return false
  }

  const salt = decodeBytes(saltRaw)
  const expectedHash = decodeBytes(hashRaw)
  const computedHash = await deriveHash(password, salt, iterations)

  return constantTimeEquals(expectedHash, computedHash)
}
