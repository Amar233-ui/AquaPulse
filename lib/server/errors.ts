export function normalizeServerError(error: unknown): { status: number; message: string; detail?: string } {
  const detail = error instanceof Error ? error.message : String(error)

  if (
    detail.includes("UNIQUE constraint failed: users.email") ||
    detail.includes("SQLITE_CONSTRAINT_UNIQUE") ||
    detail === "Cet email est deja utilise"
  ) {
    return {
      status: 409,
      message: "Cet email est deja utilise. Connectez-vous ou utilisez un autre email.",
      detail,
    }
  }

  if (detail.includes("SQLITE_READONLY") || detail.toLowerCase().includes("readonly database")) {
    return {
      status: 500,
      message:
        "Base de donnees en lecture seule. En production serverless, utilisez une base partagee (Postgres/KV) pour l'authentification.",
      detail,
    }
  }

  if (detail.includes("Shared KV user store is read-only")) {
    return {
      status: 500,
      message:
        "Le store utilisateur KV est en lecture seule. Configurez KV_REST_API_TOKEN (ou UPSTASH_REDIS_REST_TOKEN) pour activer register/login.",
      detail,
    }
  }

  if (detail.includes("Shared user store error")) {
    return {
      status: 503,
      message:
        "Le store utilisateur partage est indisponible. Reessayez dans quelques instants ou verifiez la configuration KV.",
      detail,
    }
  }

  if (detail.includes("SQLITE_CANTOPEN")) {
    return {
      status: 500,
      message:
        "Impossible d'ouvrir la base de donnees. Verifiez AQUAPULSE_DB_PATH et les permissions d'ecriture.",
      detail,
    }
  }

  if (detail.includes("ERR_UNKNOWN_BUILTIN_MODULE") || detail.includes("Cannot find module 'node:sqlite'")) {
    return {
      status: 500,
      message:
        "Runtime incompatible: node:sqlite indisponible. Utilisez Node.js 22+ ou migrez vers une base externe.",
      detail,
    }
  }

  return {
    status: 500,
    message: "Erreur interne du serveur",
    detail,
  }
}
