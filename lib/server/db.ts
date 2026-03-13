import "server-only"

import fs from "node:fs"
import path from "node:path"
import { DatabaseSync } from "node:sqlite"

import { hashPassword } from "@/lib/auth/password"

function resolveDatabasePath(): string {
  const configuredPath = process.env.AQUAPULSE_DB_PATH?.trim()
  if (configuredPath) {
    return configuredPath
  }

  // Serverless platforms (ex: Vercel) only allow writes in /tmp.
  if (process.env.VERCEL === "1") {
    return "/tmp/aquapulse.db"
  }

  return path.join(process.cwd(), "data", "aquapulse.db")
}

const DB_PATH = resolveDatabasePath()
const DATA_DIR = DB_PATH === ":memory:" ? "" : path.dirname(DB_PATH)

declare global {
  var aquapulseDb: DatabaseSync | undefined
  var aquapulseDbReady: Promise<void> | undefined
}

type SeedUser = {
  name: string
  email: string
  role: "citoyen" | "operateur" | "admin"
  password: string
  isActive: number
}

function ensureDataDirectory() {
  if (DB_PATH === ":memory:") {
    return
  }

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function createSchema(db: DatabaseSync) {
  db.exec("PRAGMA foreign_keys = ON;")

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('citoyen', 'operateur', 'admin')),
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS sectors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL CHECK(status IN ('normal', 'alerte', 'critique')),
      health INTEGER NOT NULL,
      pressure REAL NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sensors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      sector_id INTEGER,
      status TEXT NOT NULL CHECK(status IN ('actif', 'alerte', 'inactif')),
      battery INTEGER NOT NULL,
      signal INTEGER NOT NULL,
      enabled INTEGER NOT NULL DEFAULT 1,
      firmware TEXT NOT NULL,
      model TEXT NOT NULL,
      last_update TEXT NOT NULL,
      FOREIGN KEY (sector_id) REFERENCES sectors(id)
    );

    CREATE TABLE IF NOT EXISTS alerts (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      classification TEXT NOT NULL,
      location TEXT NOT NULL,
      severity TEXT NOT NULL CHECK(severity IN ('critique', 'alerte', 'moyen', 'faible')),
      probability INTEGER NOT NULL,
      status TEXT NOT NULL,
      description TEXT,
      source_sensor_id TEXT,
      sector_id INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (source_sensor_id) REFERENCES sensors(id),
      FOREIGN KEY (sector_id) REFERENCES sectors(id)
    );

    CREATE TABLE IF NOT EXISTS maintenance_tasks (
      id TEXT PRIMARY KEY,
      asset TEXT NOT NULL,
      type TEXT NOT NULL,
      priority TEXT NOT NULL CHECK(priority IN ('Haute', 'Moyenne', 'Basse')),
      due_date TEXT NOT NULL,
      confidence INTEGER NOT NULL,
      status TEXT NOT NULL,
      alert_id TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (alert_id) REFERENCES alerts(id)
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reporter_user_id INTEGER,
      type TEXT NOT NULL,
      location TEXT NOT NULL,
      description TEXT NOT NULL,
      photo_url TEXT,
      reporter_name TEXT,
      reporter_email TEXT,
      status TEXT NOT NULL DEFAULT 'Nouveau',
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      FOREIGN KEY (reporter_user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS simulations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      scenario TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('Planifie', 'En cours', 'Termine')),
      result_risk TEXT NOT NULL CHECK(result_risk IN ('Eleve', 'Moyen', 'Faible', '-')),
      duration_hours INTEGER NOT NULL,
      parameters_json TEXT NOT NULL,
      results_json TEXT NOT NULL,
      created_by INTEGER,
      created_at TEXT NOT NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      org_name TEXT NOT NULL,
      timezone TEXT NOT NULL,
      api_key TEXT NOT NULL,
      notifications_json TEXT NOT NULL,
      security_json TEXT NOT NULL,
      database_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS map_nodes (
      id TEXT PRIMARY KEY,
      x REAL NOT NULL,
      y REAL NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('reservoir', 'pump', 'sensor', 'valve', 'junction')),
      label TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('normal', 'alerte', 'critique')),
      data_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS map_connections (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_node_id TEXT NOT NULL,
      to_node_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (from_node_id) REFERENCES map_nodes(id),
      FOREIGN KEY (to_node_id) REFERENCES map_nodes(id)
    );

    CREATE TABLE IF NOT EXISTS quality_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      recorded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS flow_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      metric TEXT NOT NULL CHECK(metric IN ('debit', 'pression')),
      value REAL NOT NULL,
      recorded_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS monthly_user_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      month TEXT NOT NULL,
      users INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS quartier_quality (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quartier TEXT NOT NULL UNIQUE,
      ph REAL NOT NULL DEFAULT 7.0,
      turbidity REAL NOT NULL DEFAULT 1.0,
      chlorine REAL NOT NULL DEFAULT 0.3,
      temperature REAL NOT NULL DEFAULT 27.0,
      coliforms REAL NOT NULL DEFAULT 0,
      is_safe INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_sensors_sector ON sensors(sector_id);
    CREATE INDEX IF NOT EXISTS idx_sensors_status ON sensors(status);
    CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
    CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at);
    CREATE INDEX IF NOT EXISTS idx_quality_metric_time ON quality_readings(metric, recorded_at);
    CREATE INDEX IF NOT EXISTS idx_flow_metric_time ON flow_readings(metric, recorded_at);
  `)
}

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString()
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function seedUsers(db: DatabaseSync) {
  const usersCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number }
  if (usersCount.count > 0) {
    return
  }

  const seedUsers: SeedUser[] = [
    {
      name: "Admin AquaPulse",
      email: "admin@aquapulse.io",
      role: "admin",
      password: "Admin@2026",
      isActive: 1,
    },
    {
      name: "Operateur Principal",
      email: "operateur@aquapulse.io",
      role: "operateur",
      password: "Operateur@2026",
      isActive: 1,
    },
    {
      name: "Citoyen Test",
      email: "citoyen@aquapulse.io",
      role: "citoyen",
      password: "Citoyen@2026",
      isActive: 1,
    },
  ]

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, is_active, created_at, last_login_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  for (const user of seedUsers) {
    const passwordHash = await hashPassword(user.password)
    insertUser.run(
      user.name,
      user.email,
      passwordHash,
      user.role,
      user.isActive,
      new Date().toISOString(),
      isoHoursAgo(randomInRange(1, 48)),
    )
  }
}

function seedSectors(db: DatabaseSync) {
  const sectorCount = db.prepare("SELECT COUNT(*) as count FROM sectors").get() as { count: number }
  if (sectorCount.count > 0) {
    return
  }

  const sectors = [
    { name: "Secteur Nord", status: "normal", health: 96, pressure: 3.2 },
    { name: "Secteur Sud", status: "normal", health: 94, pressure: 3.1 },
    { name: "Secteur Est", status: "alerte", health: 78, pressure: 2.8 },
    { name: "Secteur Ouest", status: "normal", health: 92, pressure: 3.0 },
    { name: "Centre-Ville", status: "normal", health: 97, pressure: 3.4 },
    { name: "Zone Industrielle", status: "alerte", health: 82, pressure: 2.9 },
  ] as const

  const insertSector = db.prepare(`
    INSERT INTO sectors (name, status, health, pressure, created_at)
    VALUES (?, ?, ?, ?, ?)
  `)

  for (const sector of sectors) {
    insertSector.run(sector.name, sector.status, sector.health, sector.pressure, new Date().toISOString())
  }
}

function seedSensors(db: DatabaseSync) {
  const sensorCount = db.prepare("SELECT COUNT(*) as count FROM sensors").get() as { count: number }
  if (sensorCount.count > 0) {
    return
  }

  const sectors = db.prepare("SELECT id, name FROM sectors ORDER BY id ASC").all() as Array<{ id: number; name: string }>
  const models = ["UF-2000", "SP-100", "AQ-500", "TX-300", "ND-800", "MI-400", "NS-200"]
  const sensorTypes = ["Debit", "Pression", "Qualite", "Temperature", "Acoustique"]

  const insertSensor = db.prepare(`
    INSERT INTO sensors (
      id, name, type, location, sector_id, status, battery, signal, enabled, firmware, model, last_update
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (let index = 1; index <= 120; index += 1) {
    const sector = sectors[index % sectors.length]
    const type = sensorTypes[index % sensorTypes.length]
    const model = models[index % models.length]
    const status = index % 19 === 0 ? "inactif" : index % 11 === 0 ? "alerte" : "actif"
    const battery = status === "inactif" ? 0 : randomInRange(28, 100)
    const signal = status === "inactif" ? 0 : randomInRange(55, 100)
    const enabled = status === "inactif" ? 0 : 1
    const id = `SNR-${index.toString().padStart(3, "0")}`

    insertSensor.run(
      id,
      `${type} ${sector.name} #${index}`,
      type,
      `${sector.name} - Point #${200 + index}`,
      sector.id,
      status,
      battery,
      signal,
      enabled,
      `v${2 + (index % 3)}.${index % 10}.${index % 7}`,
      model,
      isoHoursAgo(randomInRange(1, 12)),
    )
  }
}

function seedMap(db: DatabaseSync) {
  const mapCount = db.prepare("SELECT COUNT(*) as count FROM map_nodes").get() as { count: number }
  if (mapCount.count > 0) {
    return
  }

  const nodes = [
    { id: "R1", x: 15, y: 12, type: "reservoir", label: "Reservoir Nord", status: "normal", data: { niveau: "82%", capacite: "50,000 m3" } },
    { id: "R2", x: 80, y: 75, type: "reservoir", label: "Reservoir Sud", status: "normal", data: { niveau: "74%", capacite: "35,000 m3" } },
    { id: "P1", x: 30, y: 25, type: "pump", label: "Station Pompage Nord", status: "normal", data: { debit: "1,200 m3/h", pression: "3.4 bar" } },
    { id: "P2", x: 65, y: 60, type: "pump", label: "Station Est", status: "critique", data: { debit: "450 m3/h", pression: "2.1 bar" } },
    { id: "S1", x: 45, y: 18, type: "sensor", label: "Capteur Debit #112", status: "normal", data: { valeur: "1,050 m3/h", batterie: "92%" } },
    { id: "S2", x: 50, y: 45, type: "sensor", label: "Capteur Qualite #89", status: "alerte", data: { pH: "6.8", turbidite: "1.2 NTU" } },
    { id: "S3", x: 25, y: 55, type: "sensor", label: "Capteur Pression #45", status: "normal", data: { valeur: "3.1 bar", batterie: "78%" } },
    { id: "V1", x: 38, y: 35, type: "valve", label: "Vanne V-12", status: "normal", data: { ouverture: "100%", debit: "800 m3/h" } },
    { id: "V2", x: 58, y: 50, type: "valve", label: "Vanne V-28", status: "alerte", data: { ouverture: "45%", debit: "320 m3/h" } },
    { id: "J1", x: 42, y: 42, type: "junction", label: "Noeud Central", status: "normal", data: { connexions: "6", debit: "2,400 m3/h" } },
    { id: "J2", x: 70, y: 30, type: "junction", label: "Noeud Est", status: "normal", data: { connexions: "4", debit: "1,100 m3/h" } },
    { id: "S4", x: 72, y: 45, type: "sensor", label: "Capteur Acoustique #7", status: "normal", data: { valeur: "Stable", batterie: "85%" } },
    { id: "P3", x: 20, y: 70, type: "pump", label: "Station Ouest", status: "normal", data: { debit: "980 m3/h", pression: "3.2 bar" } },
  ] as const

  const connections: Array<[string, string]> = [
    ["R1", "P1"], ["P1", "V1"], ["V1", "J1"], ["J1", "S2"],
    ["S1", "J1"], ["J1", "V2"], ["V2", "P2"], ["P2", "R2"],
    ["J1", "J2"], ["J2", "S4"], ["S3", "P3"], ["P3", "J1"],
    ["R1", "S1"],
  ]

  const insertNode = db.prepare(`
    INSERT INTO map_nodes (id, x, y, type, label, status, data_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertConnection = db.prepare(`
    INSERT INTO map_connections (from_node_id, to_node_id, created_at)
    VALUES (?, ?, ?)
  `)

  for (const node of nodes) {
    insertNode.run(
      node.id,
      node.x,
      node.y,
      node.type,
      node.label,
      node.status,
      JSON.stringify(node.data),
      new Date().toISOString(),
    )
  }

  for (const [fromNode, toNode] of connections) {
    insertConnection.run(fromNode, toNode, new Date().toISOString())
  }
}

function seedAlerts(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) as count FROM alerts").get() as { count: number }
  if (count.count > 0) {
    return
  }

  const sectors = db.prepare("SELECT id, name FROM sectors ORDER BY id ASC").all() as Array<{ id: number; name: string }>
  const sensors = db.prepare("SELECT id, location FROM sensors ORDER BY id ASC LIMIT 20").all() as Array<{ id: string; location: string }>

  const baseAlerts = [
    { id: "ALT-001", type: "Fuite", classification: "Fuite", location: "Grand Dakar - Noeud #247", severity: "critique", probability: 94, status: "En cours", hoursAgo: 1 },
    { id: "ALT-002", type: "Panne pompe", classification: "Panne pompe", location: "Station Pompage Fann - Pompe #3", severity: "critique", probability: 91, status: "En cours", hoursAgo: 2 },
    { id: "ALT-003", type: "Contamination", classification: "Contamination", location: "Reservoir Pikine - Zone C", severity: "alerte", probability: 87, status: "Analyse", hoursAgo: 3 },
    { id: "ALT-004", type: "Fraude", classification: "Fraude", location: "Guediawaye - Compteur #891", severity: "alerte", probability: 72, status: "Investigation", hoursAgo: 5 },
    { id: "ALT-005", type: "Fuite", classification: "Fuite", location: "Medina - Vanne Nord #12", severity: "moyen", probability: 65, status: "Planifie", hoursAgo: 7 },
    { id: "ALT-006", type: "Pression", classification: "Panne pompe", location: "Station Pompage HLM - Vanne #45", severity: "moyen", probability: 58, status: "Planifie", hoursAgo: 9 },
    { id: "ALT-007", type: "Debit anormal", classification: "Fuite", location: "Parcelles Assainies - Canalisation C12", severity: "faible", probability: 45, status: "Surveillance", hoursAgo: 12 },
    { id: "ALT-008", type: "Temperature", classification: "Contamination", location: "Reservoir Parcelles - Zone A", severity: "faible", probability: 38, status: "Surveillance", hoursAgo: 16 },
  ] as const

  const insertAlert = db.prepare(`
    INSERT INTO alerts (
      id, type, classification, location, severity, probability, status, description, source_sensor_id, sector_id, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const alert of baseAlerts) {
    const sector = sectors[randomInRange(0, sectors.length - 1)]
    const sensor = sensors[randomInRange(0, sensors.length - 1)]
    insertAlert.run(
      alert.id,
      alert.type,
      alert.classification,
      alert.location,
      alert.severity,
      alert.probability,
      alert.status,
      `${alert.type} detecte automatiquement par l'IA AquaPulse`,
      sensor.id,
      sector.id,
      isoHoursAgo(alert.hoursAgo),
    )
  }

  const severities = ["critique", "alerte", "moyen", "faible"] as const
  const types = ["Fuite", "Panne pompe", "Contamination", "Fraude", "Pression", "Debit anormal"]

  for (let index = 9; index <= 30; index += 1) {
    const sector = sectors[index % sectors.length]
    const sensor = sensors[index % sensors.length]
    const severity = severities[index % severities.length]
    const type = types[index % types.length]
    const classification = type === "Pression" ? "Panne pompe" : type
    const status = severity === "critique" ? "En cours" : severity === "alerte" ? "Analyse" : "Surveillance"

    insertAlert.run(
      `ALT-${index.toString().padStart(3, "0")}`,
      type,
      classification,
      sensor.location,
      severity,
      randomInRange(35, 96),
      status,
      `${type} detecte sur ${sector.name}`,
      sensor.id,
      sector.id,
      isoHoursAgo(randomInRange(18, 140)),
    )
  }
}

function seedMaintenance(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) as count FROM maintenance_tasks").get() as { count: number }
  if (count.count > 0) {
    return
  }

  const tasks = [
    { id: "MT-001", asset: "Pompe #3 - Station Pompage Fann", type: "Remplacement joint", priority: "Haute", dueDays: 1, confidence: 94, status: "Urgent", alertId: "ALT-002" },
    { id: "MT-002", asset: "Vanne #45 - Station Pompage HLM", type: "Calibration", priority: "Moyenne", dueDays: 3, confidence: 87, status: "Planifie", alertId: "ALT-006" },
    { id: "MT-003", asset: "Capteur #112 - Reservoir Pikine", type: "Nettoyage", priority: "Basse", dueDays: 5, confidence: 72, status: "Planifie", alertId: "ALT-003" },
    { id: "MT-004", asset: "Canalisation C12 - Parcelles Assainies", type: "Inspection", priority: "Haute", dueDays: 7, confidence: 68, status: "Planifie", alertId: "ALT-007" },
    { id: "MT-005", asset: "Pompe #7 - Station Pompage Guediawaye", type: "Remplacement filtre", priority: "Moyenne", dueDays: 10, confidence: 62, status: "Planifie", alertId: "ALT-005" },
  ] as const

  const insertTask = db.prepare(`
    INSERT INTO maintenance_tasks (id, asset, type, priority, due_date, confidence, status, alert_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const task of tasks) {
    const dueDate = new Date(Date.now() + task.dueDays * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    insertTask.run(
      task.id,
      task.asset,
      task.type,
      task.priority,
      dueDate,
      task.confidence,
      task.status,
      task.alertId,
      new Date().toISOString(),
    )
  }
}

function seedReadings(db: DatabaseSync) {
  const qualityCount = db.prepare("SELECT COUNT(*) as count FROM quality_readings").get() as { count: number }
  if (qualityCount.count === 0) {
    const insertQuality = db.prepare(`
      INSERT INTO quality_readings (metric, value, unit, recorded_at)
      VALUES (?, ?, ?, ?)
    `)

    const phValues = [7.1, 7.2, 7.3, 7.2, 7.1, 7.2, 7.2]
    const turbidityValues = [0.7, 0.8, 0.9, 0.8, 0.7, 0.8, 0.8]

    for (let index = 0; index < phValues.length; index += 1) {
      const hoursAgo = (phValues.length - index - 1) * 4
      const recordedAt = isoHoursAgo(hoursAgo)
      insertQuality.run("ph", phValues[index], "", recordedAt)
      insertQuality.run("turbidity", turbidityValues[index], "NTU", recordedAt)
      insertQuality.run("chlorine", 0.5 + ((index % 3) - 1) * 0.05, "mg/L", recordedAt)
      insertQuality.run("temperature", 27.0 + ((index % 2) - 0.5) * 0.8, "C", recordedAt)
      insertQuality.run("conductivity", 420 + (index % 4) * 8, "uS/cm", recordedAt)
      insertQuality.run("coliform", 0, "CFU/100mL", recordedAt)
    }
  }

  const flowCount = db.prepare("SELECT COUNT(*) as count FROM flow_readings").get() as { count: number }
  if (flowCount.count === 0) {
    const insertFlow = db.prepare(`
      INSERT INTO flow_readings (metric, value, recorded_at)
      VALUES (?, ?, ?)
    `)

    const debitValues = [480, 320, 240, 360, 600, 720, 800, 760, 680, 640, 560, 440]
    const pressionValues = [2.4, 2.3, 2.2, 2.3, 2.5, 2.6, 2.4, 2.5, 2.4, 2.3, 2.4, 2.3]

    for (let index = 0; index < debitValues.length; index += 1) {
      const hoursAgo = (debitValues.length - index - 1) * 2
      const recordedAt = isoHoursAgo(hoursAgo)
      insertFlow.run("debit", debitValues[index], recordedAt)
      insertFlow.run("pression", pressionValues[index], recordedAt)
    }
  }
}

function seedIncidents(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) as count FROM incidents").get() as { count: number }
  if (count.count > 0) {
    return
  }

  const citoyen = db.prepare("SELECT id FROM users WHERE role = 'citoyen' LIMIT 1").get() as { id: number } | undefined
  const insertIncident = db.prepare(`
    INSERT INTO incidents (
      reporter_user_id, type, location, description, reporter_name, reporter_email, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const incidents = [
    {
      type: "fuite",
      location: "Rue de la Paix",
      description: "Fuite visible sur la conduite principale depuis 30 minutes.",
      status: "Nouveau",
      hoursAgo: 2,
    },
    {
      type: "pression",
      location: "Secteur Est - Avenue des Lilas",
      description: "Pression tres faible dans les habitations depuis ce matin.",
      status: "Analyse",
      hoursAgo: 8,
    },
  ]

  for (const incident of incidents) {
    insertIncident.run(
      citoyen?.id ?? null,
      incident.type,
      incident.location,
      incident.description,
      "Citoyen Test",
      "citoyen@aquapulse.io",
      incident.status,
      isoHoursAgo(incident.hoursAgo),
    )
  }
}

function seedSimulations(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) as count FROM simulations").get() as { count: number }
  if (count.count > 0) {
    return
  }

  const operator = db.prepare("SELECT id FROM users WHERE role IN ('operateur', 'admin') ORDER BY id ASC LIMIT 1").get() as { id: number } | undefined

  const simulations = [
    {
      id: "SIM-001",
      name: "Saison Seche Dakar 2026",
      scenario: "Secheresse",
      status: "Termine",
      resultRisk: "Moyen",
      duration: 24,
      createdAt: isoDaysAgo(14),
    },
    {
      id: "SIM-002",
      name: "Inondation Hivernage - Zone Pikine",
      scenario: "Inondation",
      status: "Termine",
      resultRisk: "Eleve",
      duration: 48,
      createdAt: isoDaysAgo(18),
    },
    {
      id: "SIM-003",
      name: "Contamination Reservoir Parcelles",
      scenario: "Contamination",
      status: "En cours",
      resultRisk: "-",
      duration: 12,
      createdAt: isoDaysAgo(1),
    },
    {
      id: "SIM-004",
      name: "Delestage Prolonge - SENELEC",
      scenario: "Panne",
      status: "Planifie",
      resultRisk: "-",
      duration: 6,
      createdAt: isoDaysAgo(0),
    },
    {
      id: "SIM-005",
      name: "Pic Demande Saison Seche",
      scenario: "Surcharge",
      status: "Termine",
      resultRisk: "Faible",
      duration: 72,
      createdAt: isoDaysAgo(23),
    },
  ] as const

  const defaultResults = [
    { hour: "0h", demand: 100, supply: 120, stress: 10 },
    { hour: "4h", demand: 60, supply: 120, stress: 5 },
    { hour: "8h", demand: 140, supply: 120, stress: 25 },
    { hour: "12h", demand: 180, supply: 150, stress: 40 },
    { hour: "16h", demand: 160, supply: 140, stress: 30 },
    { hour: "20h", demand: 130, supply: 130, stress: 15 },
    { hour: "24h", demand: 90, supply: 120, stress: 8 },
  ]

  const insertSimulation = db.prepare(`
    INSERT INTO simulations (
      id, name, scenario, status, result_risk, duration_hours, parameters_json, results_json, created_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (const simulation of simulations) {
    insertSimulation.run(
      simulation.id,
      simulation.name,
      simulation.scenario,
      simulation.status,
      simulation.resultRisk,
      simulation.duration,
      JSON.stringify({ drought: 30, population: 15, duration: `${simulation.duration}h` }),
      JSON.stringify(defaultResults),
      operator?.id ?? null,
      simulation.createdAt,
    )
  }
}

function seedSettings(db: DatabaseSync) {
  const row = db.prepare("SELECT id FROM settings WHERE id = 1").get() as { id: number } | undefined
  if (row) {
    return
  }

  db.prepare(`
    INSERT INTO settings (
      id, org_name, timezone, api_key, notifications_json, security_json, database_json, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1,
    "SDE - Senegalaise Des Eaux, Dakar",
    "africa-dakar",
    "aqp_sk_9f2ce1d0bd9f87d2f45f11",
    JSON.stringify({
      criticalEmail: true,
      dailyReport: true,
      predictiveMaintenance: true,
      citizenReports: false,
    }),
    JSON.stringify({
      require2FA: true,
      sessionExpiry: "8h",
      auditLogs: true,
    }),
    JSON.stringify({
      autoBackup: true,
      retentionPeriod: "1y",
    }),
    new Date().toISOString(),
  )
}

function seedMonthlyActivity(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) as count FROM monthly_user_activity").get() as { count: number }
  if (count.count > 0) {
    return
  }

  const months = [
    { month: "Sep", users: 120 },
    { month: "Oct", users: 145 },
    { month: "Nov", users: 168 },
    { month: "Dec", users: 190 },
    { month: "Jan", users: 210 },
    { month: "Feb", users: 235 },
  ]

  const insertActivity = db.prepare(`
    INSERT INTO monthly_user_activity (month, users, created_at)
    VALUES (?, ?, ?)
  `)

  for (const item of months) {
    insertActivity.run(item.month, item.users, new Date().toISOString())
  }
}


function seedQuartierQuality(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) as count FROM quartier_quality").get() as { count: number }
  if (count.count > 0) return

  const now = new Date().toISOString()
  const insert = db.prepare(`
    INSERT INTO quartier_quality (quartier, ph, turbidity, chlorine, temperature, coliforms, is_safe, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const data = [
    ["Plateau",             7.2, 0.5, 0.52, 27.1, 0, 1],
    ["Médina",              7.1, 0.7, 0.48, 27.4, 0, 1],
    ["Fann",                7.3, 0.6, 0.50, 26.9, 0, 1],
    ["HLM",                 7.0, 1.8, 0.22, 28.2, 1, 0],
    ["Grand Dakar",         6.9, 2.1, 0.18, 28.5, 2, 0],
    ["Parcelles Assainies", 7.2, 0.9, 0.45, 27.3, 0, 1],
    ["Pikine",              7.0, 2.6, 0.15, 28.8, 3, 0],
    ["Guédiawaye",          6.8, 3.0, 0.12, 29.1, 4, 0],
    ["Rufisque",            7.1, 1.1, 0.38, 27.6, 0, 1],
  ] as const

  for (const [quartier, ph, turbidity, chlorine, temperature, coliforms, is_safe] of data) {
    insert.run(quartier, ph, turbidity, chlorine, temperature, coliforms, is_safe, now)
  }
}

async function seedDatabase(db: DatabaseSync) {
  await seedUsers(db)
  seedSectors(db)
  seedSensors(db)
  seedMap(db)
  seedAlerts(db)
  seedMaintenance(db)
  seedQuartierQuality(db)
  seedReadings(db)
  seedIncidents(db)
  seedSimulations(db)
  seedSettings(db)
  seedMonthlyActivity(db)
}

async function initializeDatabase(db: DatabaseSync) {
  createSchema(db)
  await seedDatabase(db)
}

export async function getDb(): Promise<DatabaseSync> {
  if (!global.aquapulseDb) {
    ensureDataDirectory()
    global.aquapulseDb = new DatabaseSync(DB_PATH)
  }

  if (!global.aquapulseDbReady) {
    global.aquapulseDbReady = initializeDatabase(global.aquapulseDb)
  }

  await global.aquapulseDbReady
  return global.aquapulseDb
}
