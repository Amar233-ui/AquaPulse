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
  // Sur Vercel /tmp, la DB repart de zéro à chaque cold start
  // Les FK causent des erreurs si les tables référencées sont vides
  // On les désactive en production serverless
  const isServerless = process.env.VERCEL === "1" || process.env.VERCEL_ENV !== undefined
  if (!isServerless) {
    db.exec("PRAGMA foreign_keys = ON;")
  }

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

    CREATE TABLE IF NOT EXISTS eah_facilities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('latrine_publique', 'point_eau_gratuit', 'borne_fontaine', 'bloc_hygiene', 'station_lavage_mains')),
      quartier TEXT NOT NULL,
      address TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('operationnel', 'degradé', 'hors_service')),
      gender_accessible INTEGER NOT NULL DEFAULT 0,
      disabled_accessible INTEGER NOT NULL DEFAULT 0,
      school_nearby INTEGER NOT NULL DEFAULT 0,
      last_inspection TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
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
      assigned_operator_id INTEGER,
      assigned_operator_name TEXT,
      assigned_at TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (alert_id) REFERENCES alerts(id),
      FOREIGN KEY (assigned_operator_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS asset_health_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sensor_id TEXT NOT NULL,
      recorded_at TEXT NOT NULL,
      temperature_c REAL NOT NULL,
      vibration_score REAL NOT NULL,
      runtime_hours REAL NOT NULL,
      load_pct REAL NOT NULL,
      acoustic_score REAL NOT NULL,
      pressure_delta REAL NOT NULL,
      flow_delta REAL NOT NULL,
      failure_within_30d INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (sensor_id) REFERENCES sensors(id)
    );

    CREATE TABLE IF NOT EXISTS intervention_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id TEXT,
      task_id TEXT,
      sensor_id TEXT,
      maintenance_type TEXT NOT NULL,
      outcome TEXT NOT NULL CHECK(outcome IN ('resolved', 'mitigated', 'false_alarm', 'replaced', 'inspected')),
      root_cause TEXT,
      downtime_hours REAL NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (alert_id) REFERENCES alerts(id),
      FOREIGN KEY (task_id) REFERENCES maintenance_tasks(id),
      FOREIGN KEY (sensor_id) REFERENCES sensors(id)
    );

    CREATE TABLE IF NOT EXISTS alert_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      alert_id TEXT NOT NULL,
      source_type TEXT NOT NULL CHECK(source_type IN ('db', 'ai_generated', 'manual')),
      is_validated INTEGER NOT NULL DEFAULT 1,
      false_positive INTEGER NOT NULL DEFAULT 0,
      operator_label TEXT NOT NULL,
      notes TEXT,
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
      assigned_operator_id INTEGER,
      assigned_operator_name TEXT,
      assigned_at TEXT,
      created_at TEXT NOT NULL,
      resolved_at TEXT,
      eah_facility_id INTEGER
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

    CREATE TABLE IF NOT EXISTS notification_reads (
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('alertes', 'signalements', 'maintenance', 'eah')),
      last_seen_at TEXT NOT NULL,
      PRIMARY KEY (user_id, category),
      FOREIGN KEY (user_id) REFERENCES users(id)
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
    CREATE INDEX IF NOT EXISTS idx_eah_quartier ON eah_facilities(quartier);
    CREATE INDEX IF NOT EXISTS idx_eah_status ON eah_facilities(status);
    CREATE INDEX IF NOT EXISTS idx_quality_metric_time ON quality_readings(metric, recorded_at);
    CREATE INDEX IF NOT EXISTS idx_flow_metric_time ON flow_readings(metric, recorded_at);
    CREATE INDEX IF NOT EXISTS idx_asset_snapshots_sensor_time ON asset_health_snapshots(sensor_id, recorded_at);
    CREATE INDEX IF NOT EXISTS idx_interventions_sensor_time ON intervention_reports(sensor_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_alert_feedback_alert_time ON alert_feedback(alert_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_notification_reads_user_category ON notification_reads(user_id, category);
  `)
}

function applyMigrations(db: DatabaseSync) {
  const maintenanceColumns = db
    .prepare("PRAGMA table_info(maintenance_tasks)")
    .all() as Array<{ name: string }>

  if (!maintenanceColumns.some((column) => column.name === "eah_facility_id")) {
    db.exec("ALTER TABLE maintenance_tasks ADD COLUMN eah_facility_id INTEGER REFERENCES eah_facilities(id);")
  }
  if (!maintenanceColumns.some((column) => column.name === "assigned_operator_id")) {
    db.exec("ALTER TABLE maintenance_tasks ADD COLUMN assigned_operator_id INTEGER REFERENCES users(id);")
  }
  if (!maintenanceColumns.some((column) => column.name === "assigned_operator_name")) {
    db.exec("ALTER TABLE maintenance_tasks ADD COLUMN assigned_operator_name TEXT;")
  }
  if (!maintenanceColumns.some((column) => column.name === "assigned_at")) {
    db.exec("ALTER TABLE maintenance_tasks ADD COLUMN assigned_at TEXT;")
  }

  const incidentColumns = db
    .prepare("PRAGMA table_info(incidents)")
    .all() as Array<{ name: string }>

  if (!incidentColumns.some((column) => column.name === "eah_facility_id")) {
    db.exec("ALTER TABLE incidents ADD COLUMN eah_facility_id INTEGER REFERENCES eah_facilities(id);")
  }
  if (!incidentColumns.some((column) => column.name === "assigned_operator_id")) {
    db.exec("ALTER TABLE incidents ADD COLUMN assigned_operator_id INTEGER REFERENCES users(id);")
  }
  if (!incidentColumns.some((column) => column.name === "assigned_operator_name")) {
    db.exec("ALTER TABLE incidents ADD COLUMN assigned_operator_name TEXT;")
  }
  if (!incidentColumns.some((column) => column.name === "assigned_at")) {
    db.exec("ALTER TABLE incidents ADD COLUMN assigned_at TEXT;")
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS notification_reads (
      user_id INTEGER NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('alertes', 'signalements', 'maintenance', 'eah')),
      last_seen_at TEXT NOT NULL,
      PRIMARY KEY (user_id, category),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_notification_reads_user_category ON notification_reads(user_id, category);
  `)

  // ── Migration système de points ───────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS citizen_points (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      incident_id INTEGER,
      points INTEGER NOT NULL,
      reason TEXT NOT NULL,
      quartier TEXT,
      awarded_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_citizen_points_user ON citizen_points(user_id);
    CREATE INDEX IF NOT EXISTS idx_citizen_points_quartier ON citizen_points(quartier);

    CREATE TABLE IF NOT EXISTS citizen_badges (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      badge_code TEXT NOT NULL,
      awarded_at TEXT NOT NULL,
      UNIQUE(user_id, badge_code),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IF NOT EXISTS idx_citizen_badges_user ON citizen_badges(user_id);
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

function seedEahFacilities(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) as count FROM eah_facilities").get() as { count: number }
  if (count.count > 0) {
    return
  }

  const now = new Date().toISOString()
  const insert = db.prepare(`
    INSERT INTO eah_facilities (
      name, type, quartier, address, status, gender_accessible,
      disabled_accessible, school_nearby, last_inspection, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const rows = [
    ["Latrine Marché Médina", "latrine_publique", "Médina", "Marché central Médina", "hors_service", 1, 0, 0, isoDaysAgo(16), "Bloc sanitaire fermé, fuite sur la chasse et absence d'eau.", now, now],
    ["Borne Fontaine Fann 2", "borne_fontaine", "Fann", "Avenue Cheikh Anta Diop, Fann", "degradé", 1, 1, 1, isoDaysAgo(9), "Pression intermittente aux heures de pointe.", now, now],
    ["Point Eau Gratuit HLM Est", "point_eau_gratuit", "HLM", "HLM 5, terrain communal", "operationnel", 1, 1, 1, isoDaysAgo(4), null, now, now],
    ["Bloc Hygiène Grand Dakar Sud", "bloc_hygiene", "Grand Dakar", "Rue 14 x Avenue Bourguiba", "degradé", 1, 0, 1, isoDaysAgo(12), "Lavabo bouché et savon indisponible.", now, now],
    ["Station Lavage Mains École Pikine 3", "station_lavage_mains", "Pikine", "École élémentaire Pikine 3", "hors_service", 1, 1, 1, isoDaysAgo(21), "Réservoir vide et pédale cassée.", now, now],
    ["Borne Fontaine Parcelles U17", "borne_fontaine", "Parcelles Assainies", "Unité 17, place publique", "operationnel", 1, 1, 0, isoDaysAgo(5), null, now, now],
    ["Latrine Publique Guédiawaye Plage", "latrine_publique", "Guédiawaye", "Front de mer Guédiawaye", "degradé", 1, 0, 0, isoDaysAgo(14), "Nettoyage insuffisant et éclairage hors service.", now, now],
    ["Point Eau Gratuit Plateau Gare", "point_eau_gratuit", "Plateau", "Esplanade gare routière", "operationnel", 1, 1, 0, isoDaysAgo(6), null, now, now],
    ["Bloc Hygiène Pikine Centre", "bloc_hygiene", "Pikine", "Marché Pikine Centre", "operationnel", 1, 0, 0, isoDaysAgo(3), null, now, now],
    ["Station Lavage Mains École Grand Dakar", "station_lavage_mains", "Grand Dakar", "École Grand Dakar 2", "degradé", 1, 1, 1, isoDaysAgo(11), "Débit faible et réapprovisionnement savon à faire.", now, now],
    ["Borne Fontaine Médina Santhiaba", "borne_fontaine", "Médina", "Quartier Santhiaba", "operationnel", 1, 0, 0, isoDaysAgo(7), null, now, now],
    ["Latrine Publique Parcelles Unité 8", "latrine_publique", "Parcelles Assainies", "Terminus Unité 8", "degradé", 1, 0, 0, isoDaysAgo(19), "Porte endommagée et chasse irrégulière.", now, now],
  ] as const

  for (const row of rows) {
    insert.run(...row)
  }
}

function seedAiTrainingSignals(db: DatabaseSync) {
  const snapshotCount = db.prepare("SELECT COUNT(*) as count FROM asset_health_snapshots").get() as { count: number }
  if (snapshotCount.count === 0) {
    const monitoredSensors = db.prepare(`
      SELECT id, type, location, status, battery
      FROM sensors
      WHERE type IN ('Debit', 'Pression', 'Acoustique')
      ORDER BY id ASC
      LIMIT 36
    `).all() as Array<{ id: string; type: string; location: string; status: string; battery: number }>

    const insertSnapshot = db.prepare(`
      INSERT INTO asset_health_snapshots (
        sensor_id, recorded_at, temperature_c, vibration_score, runtime_hours,
        load_pct, acoustic_score, pressure_delta, flow_delta, failure_within_30d
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

    const highRiskSensors = new Set(["SNR-011", "SNR-022", "SNR-029", "SNR-033", "SNR-044", "SNR-055"])
    const mediumRiskSensors = new Set(["SNR-006", "SNR-015", "SNR-027", "SNR-038", "SNR-049"])

    for (const sensor of monitoredSensors) {
      const sensorIndex = Number(sensor.id.split("-")[1] ?? "0")
      const highRisk = highRiskSensors.has(sensor.id)
      const mediumRisk = mediumRiskSensors.has(sensor.id) || sensor.status === "alerte" || sensorIndex % 7 === 0

      for (let day = 75; day >= 0; day -= 3) {
        const ageFactor = day / 75
        const vibrationBase = highRisk ? 0.74 : mediumRisk ? 0.42 : 0.18
        const temperatureBase = highRisk ? 69 : mediumRisk ? 58 : 44
        const loadBase = highRisk ? 91 : sensor.type === "Debit" ? 72 : sensor.type === "Pression" ? 65 : 54
        const acousticBase = sensor.type === "Acoustique"
          ? (highRisk ? 0.92 : mediumRisk ? 0.68 : 0.22)
          : (highRisk ? 0.55 : mediumRisk ? 0.31 : 0.12)
        const pressureDelta = sensor.type === "Pression"
          ? (highRisk ? -0.78 : mediumRisk ? -0.42 : -0.08)
          : (highRisk ? -0.46 : mediumRisk ? -0.24 : -0.03)
        const flowDelta = sensor.type === "Debit"
          ? (highRisk ? 185 : mediumRisk ? 112 : 24)
          : (highRisk ? 96 : mediumRisk ? 58 : 12)

        const failureSoon = highRisk ? (day <= 36 ? 1 : 0) : mediumRisk && day <= 18 ? 1 : 0

        insertSnapshot.run(
          sensor.id,
          isoDaysAgo(day),
          Number((temperatureBase + Math.random() * (highRisk ? 7 : 4) - ageFactor * 3).toFixed(1)),
          Number((vibrationBase + Math.random() * (highRisk ? 0.24 : 0.18)).toFixed(3)),
          Number(((highRisk ? 4800 : 2800) + (75 - day) * (highRisk ? 13 : 7) + Math.random() * 120).toFixed(1)),
          Number((loadBase + Math.random() * 18 - ageFactor * 4).toFixed(1)),
          Number((acousticBase + Math.random() * (highRisk ? 0.22 : 0.15)).toFixed(3)),
          Number((pressureDelta + (Math.random() * 0.12 - 0.06)).toFixed(3)),
          Number((flowDelta + (Math.random() * (highRisk ? 34 : 20) - (highRisk ? 12 : 10))).toFixed(1)),
          failureSoon,
        )
      }
    }
  }

  const interventionCount = db.prepare("SELECT COUNT(*) as count FROM intervention_reports").get() as { count: number }
  if (interventionCount.count === 0) {
    const rows = db.prepare(`
      SELECT mt.id as taskId, mt.type as taskType, mt.alert_id as alertId, a.source_sensor_id as sensorId,
             a.classification as classification, mt.status as taskStatus
      FROM maintenance_tasks mt
      LEFT JOIN alerts a ON a.id = mt.alert_id
      ORDER BY mt.id ASC
    `).all() as Array<{
      taskId: string
      taskType: string
      alertId: string | null
      sensorId: string | null
      classification: string | null
      taskStatus: string
    }>

    const insertIntervention = db.prepare(`
      INSERT INTO intervention_reports (
        alert_id, task_id, sensor_id, maintenance_type, outcome, root_cause, downtime_hours, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)

    for (const row of rows) {
      const outcome =
        row.taskStatus === "Termine" ? "resolved"
        : row.classification === "Fuite" ? "mitigated"
        : row.classification === "Panne pompe" ? "replaced"
        : "inspected"

      const rootCause =
        row.classification === "Fuite" ? "microfissure canalisation fonte"
        : row.classification === "Panne pompe" ? "usure palier pompe"
        : row.classification === "Contamination" ? "chloration insuffisante"
        : row.classification === "Fraude" ? "branchements illicites"
        : "anomalie réseau confirmée"

      insertIntervention.run(
        row.alertId,
        row.taskId,
        row.sensorId,
        row.taskType,
        outcome,
        rootCause,
        row.classification === "Panne pompe" ? 4.5 : row.classification === "Fuite" ? 2.0 : 1.0,
        isoDaysAgo(randomInRange(3, 35)),
      )
    }
  }

  const feedbackCount = db.prepare("SELECT COUNT(*) as count FROM alert_feedback").get() as { count: number }
  if (feedbackCount.count === 0) {
    const alerts = db.prepare(`
      SELECT id, classification, severity, status
      FROM alerts
      ORDER BY created_at DESC
      LIMIT 30
    `).all() as Array<{ id: string; classification: string; severity: string; status: string }>

    const insertFeedback = db.prepare(`
      INSERT INTO alert_feedback (
        alert_id, source_type, is_validated, false_positive, operator_label, notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    for (const alert of alerts) {
      const falsePositive = alert.classification === "Fraude" && alert.severity === "faible" ? 1 : 0
      const validated = falsePositive ? 0 : 1
      const label =
        falsePositive ? "fausse_alerte"
        : alert.status === "Surveillance" ? "surveillance"
        : alert.status === "En cours" ? "confirmee_critique"
        : "confirmee"

      insertFeedback.run(
        alert.id,
        "db",
        validated,
        falsePositive,
        label,
        falsePositive
          ? "Signal faible non confirmé au terrain."
          : "Alerte confirmée par équipe terrain et prise en compte dans l'historique opérateur.",
        isoDaysAgo(randomInRange(1, 20)),
      )
    }
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

function seedEahIncidents(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) as count FROM incidents WHERE eah_facility_id IS NOT NULL").get() as { count: number }
  if (row.count > 0) {
    return
  }

  const citoyen = db.prepare("SELECT id FROM users WHERE role = 'citoyen' LIMIT 1").get() as { id: number } | undefined
  const facilities = db.prepare("SELECT id, name, quartier FROM eah_facilities ORDER BY id ASC").all() as Array<{
    id: number
    name: string
    quartier: string
  }>

  if (facilities.length === 0) {
    return
  }

  const byId = new Map(facilities.map((facility) => [facility.id, facility]))
  const insertIncident = db.prepare(`
    INSERT INTO incidents (
      reporter_user_id, type, location, description, reporter_name, reporter_email, status, created_at, eah_facility_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const eahIncidents = [
    { facilityId: 1, type: "autre", status: "Nouveau", hoursAgo: 5, reporterName: "Awa N.", reporterEmail: "awa@example.com", description: "La latrine est fermée et il n'y a pas d'eau sur place." },
    { facilityId: 1, type: "autre", status: "Nouveau", hoursAgo: 3, reporterName: "Moussa D.", reporterEmail: "moussa@example.com", description: "Le site EAH reste inaccessible ce matin, odeur forte et aucun service." },
    { facilityId: 1, type: "autre", status: "En cours", hoursAgo: 2, reporterName: "Fatou S.", reporterEmail: "fatou@example.com", description: "Toujours fermé au marché Médina, besoin d'intervention rapide." },
    { facilityId: 5, type: "autre", status: "Nouveau", hoursAgo: 7, reporterName: "Khadija B.", reporterEmail: "khadija@example.com", description: "La station de lavage à l'école Pikine 3 ne fonctionne plus." },
    { facilityId: 5, type: "autre", status: "Nouveau", hoursAgo: 4, reporterName: "Abdou C.", reporterEmail: "abdou@example.com", description: "Les enfants n'ont plus accès au lavage des mains, réservoir vide." },
    { facilityId: 2, type: "pression", status: "Nouveau", hoursAgo: 9, reporterName: "Seynabou T.", reporterEmail: "seynabou@example.com", description: "La borne-fontaine de Fann a une pression très faible." },
  ] as const

  for (const incident of eahIncidents) {
    const facility = byId.get(incident.facilityId)
    if (!facility) continue
    insertIncident.run(
      citoyen?.id ?? null,
      incident.type,
      `${facility.quartier} — ${facility.name}`,
      incident.description,
      incident.reporterName,
      incident.reporterEmail,
      incident.status,
      isoHoursAgo(incident.hoursAgo),
      incident.facilityId,
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
    ["Pikine",            7.1, 1.1, 0.38, 27.6, 0, 1],
  ] as const

  for (const [quartier, ph, turbidity, chlorine, temperature, coliforms, is_safe] of data) {
    insert.run(quartier, ph, turbidity, chlorine, temperature, coliforms, is_safe, now)
  }
}


function seedPoints(db: DatabaseSync) {
  const count = db.prepare("SELECT COUNT(*) as c FROM citizen_points").get() as { c: number }
  if (count.c > 0) return

  const citizens = db.prepare("SELECT id FROM users WHERE role = 'citoyen'").all() as Array<{ id: number }>
  if (citizens.length === 0) return

  const citizen = citizens[0]
  const now = new Date()

  const demoPoints: Array<{ points: number; reason: string; quartier: string | null; daysAgo: number }> = [
    { points: 10, reason: "premier_signalement",  quartier: "Médina",  daysAgo: 14 },
    { points: 10, reason: "signalement_confirme", quartier: "Médina",  daysAgo: 13 },
    { points: 5,  reason: "signalement_resolu",   quartier: "Plateau", daysAgo: 12 },
    { points: 10, reason: "signalement_confirme", quartier: "Plateau", daysAgo: 10 },
    { points: 10, reason: "signalement_confirme", quartier: "Fann",    daysAgo: 8  },
    { points: 15, reason: "signalement_valide_ia",quartier: "Fann",    daysAgo: 7  },
    { points: 10, reason: "signalement_confirme", quartier: "HLM",     daysAgo: 5  },
    { points: 5,  reason: "signalement_resolu",   quartier: "HLM",     daysAgo: 4  },
    { points: 20, reason: "badge_vigilant",        quartier: null,      daysAgo: 3  },
    { points: 10, reason: "signalement_confirme", quartier: "Médina",  daysAgo: 1  },
  ]

  const ins = db.prepare(
    "INSERT INTO citizen_points (user_id, points, reason, quartier, awarded_at) VALUES (?, ?, ?, ?, ?)"
  )
  for (const p of demoPoints) {
    const d = new Date(now.getTime() - p.daysAgo * 86400000)
    ins.run(citizen.id, p.points, p.reason, p.quartier, d.toISOString())
  }

  const insBadge = db.prepare(
    "INSERT OR IGNORE INTO citizen_badges (user_id, badge_code, awarded_at) VALUES (?, ?, ?)"
  )
  insBadge.run(citizen.id, "premier_pas", isoDaysAgo(14))
  insBadge.run(citizen.id, "vigilant",    isoDaysAgo(3))
}

async function seedDatabase(db: DatabaseSync) {
  await seedUsers(db)
  seedSectors(db)
  seedSensors(db)
  seedMap(db)
  seedAlerts(db)
  seedEahFacilities(db)
  seedMaintenance(db)
  seedQuartierQuality(db)
  seedReadings(db)
  seedIncidents(db)
  seedEahIncidents(db)
  seedAiTrainingSignals(db)
  seedSimulations(db)
  seedSettings(db)
  seedMonthlyActivity(db)
  seedPoints(db)
}

async function initializeDatabase(db: DatabaseSync) {
  createSchema(db)
  applyMigrations(db)
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
