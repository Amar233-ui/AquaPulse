export function normalizeServerError(error: unknown): { status: number; message: string; detail?: string } {
  const detail = error instanceof Error ? error.message : String(error)

  if (detail.includes("UNIQUE constraint failed: users.email") || detail.includes("SQLITE_CONSTRAINT_UNIQUE")) {
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
        "Base de donnees en lecture seule. En production, configurez AQUAPULSE_DB_PATH vers un chemin writable (ex: /tmp/aquapulse.db) ou utilisez une base managée.",
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
