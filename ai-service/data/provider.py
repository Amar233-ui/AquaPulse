"""
DataProvider
============
Lit les données depuis la DB SQLite d'AquaPulse.
Pour basculer sur données SDE réelles :
  1. Importer les CSV SDE via import_sde_csv()
  2. Les lire ensuite via les mêmes méthodes — le moteur IA ne change pas.
"""

import sqlite3
import json
import math
import random
import logging
from datetime import datetime, timedelta
from typing import Any

logger = logging.getLogger("aquapulse-ai")
random.seed(42)


class DataProvider:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._verify_connection()

    def _get_db(self):
        db = sqlite3.connect(self.db_path)
        db.row_factory = sqlite3.Row
        return db

    def _verify_connection(self):
        try:
            db = self._get_db()
            count = db.execute("SELECT COUNT(*) FROM sensors").fetchone()[0]
            logger.info(f"DB connectée : {count} capteurs")
            db.close()
        except Exception as e:
            logger.warning(f"DB non accessible, mode synthétique : {e}")

    @staticmethod
    def _parse_dt(value: str) -> datetime:
        normalized = value.replace("Z", "+00:00")
        dt = datetime.fromisoformat(normalized)
        if dt.tzinfo is not None:
            return dt.replace(tzinfo=None)
        return dt

    # ─── DONNÉES POUR L'ENTRAÎNEMENT ────────────────────────────────────────

    def load_training_data(self) -> dict[str, Any]:
        """
        Charge les données pour entraîner les modèles.
        Retourne un dict unifié peu importe la source (DB réelle ou synthétique).
        """
        try:
            return self._load_from_db()
        except Exception as e:
            logger.warning(f"Fallback synthétique : {e}")
            return self._generate_synthetic_data()

    def _load_from_db(self) -> dict[str, Any]:
        db = self._get_db()

        # Lectures capteurs (flow + quality)
        flow_rows = db.execute(
            "SELECT metric, value, recorded_at FROM flow_readings ORDER BY recorded_at"
        ).fetchall()

        quality_rows = db.execute(
            "SELECT metric, value, unit, recorded_at FROM quality_readings ORDER BY recorded_at"
        ).fetchall()

        # Alertes historiques (labels pour supervisé)
        alert_rows = db.execute(
            "SELECT id, type, classification, severity, probability, created_at FROM alerts"
        ).fetchall()

        feedback_rows = db.execute(
            """SELECT alert_id, is_validated, false_positive, operator_label, created_at
               FROM alert_feedback
               ORDER BY created_at"""
        ).fetchall()

        asset_snapshot_rows = db.execute(
            """SELECT sensor_id, recorded_at, temperature_c, vibration_score, runtime_hours,
                      load_pct, acoustic_score, pressure_delta, flow_delta, failure_within_30d
               FROM asset_health_snapshots
               ORDER BY recorded_at"""
        ).fetchall()

        intervention_rows = db.execute(
            """SELECT alert_id, task_id, sensor_id, maintenance_type, outcome,
                      root_cause, downtime_hours, created_at
               FROM intervention_reports
               ORDER BY created_at"""
        ).fetchall()

        # Capteurs
        sensor_rows = db.execute(
            "SELECT id, type, location, status, battery, signal FROM sensors"
        ).fetchall()

        db.close()

        # Construire les séries temporelles
        sensor_readings = self._build_sensor_series(flow_rows, quality_rows, alert_rows, feedback_rows, asset_snapshot_rows)

        # Si trop peu de données réelles, enrichir avec synthétique
        if len(sensor_readings) < 50:
            logger.info("Données DB insuffisantes, enrichissement synthétique")
            synth = self._generate_synthetic_data()
            sensor_readings = synth["sensor_readings"] + sensor_readings
            asset_snapshots = synth["asset_snapshots"] + [dict(r) for r in asset_snapshot_rows]
            interventions = synth["interventions"] + [dict(r) for r in intervention_rows]
            alert_feedback = synth["alert_feedback"] + [dict(r) for r in feedback_rows]
        else:
            asset_snapshots = [dict(r) for r in asset_snapshot_rows]
            interventions = [dict(r) for r in intervention_rows]
            alert_feedback = [dict(r) for r in feedback_rows]

        return {
            "sensor_readings": sensor_readings,
            "alerts_history": [dict(r) for r in alert_rows],
            "sensors": [dict(r) for r in sensor_rows],
            "asset_snapshots": asset_snapshots,
            "interventions": interventions,
            "alert_feedback": alert_feedback,
        }

    def _build_sensor_series(self, flow_rows, quality_rows, alert_rows, feedback_rows, asset_snapshot_rows) -> list[dict]:
        """Combine flow + quality en série chronologique unifiée."""
        by_time: dict[str, dict] = {}
        acoustic_by_time: dict[str, list[float]] = {}

        for r in flow_rows:
            t = r["recorded_at"][:16]  # minute précision
            if t not in by_time:
                by_time[t] = {"timestamp": t}
            by_time[t][r["metric"]] = r["value"]

        for r in quality_rows:
            t = r["recorded_at"][:16]
            if t not in by_time:
                by_time[t] = {"timestamp": t}
            by_time[t][r["metric"]] = r["value"]

        for r in asset_snapshot_rows:
            t = r["recorded_at"][:16]
            acoustic_by_time.setdefault(t, []).append(r["acoustic_score"])

        validated_alerts: dict[str, tuple[int, str]] = {}
        for fb in feedback_rows:
            if fb["false_positive"]:
                continue
            validated_alerts[str(fb["alert_id"])] = (int(fb["is_validated"]), str(fb["operator_label"]))

        anomaly_windows: list[tuple[datetime, datetime, str]] = []
        for alert in alert_rows:
            alert_time = self._parse_dt(str(alert["created_at"]))
            feedback = validated_alerts.get(str(alert["id"]))
            if feedback is None:
                feedback = (1, str(alert["classification"]))
            if feedback[0]:
                anomaly_windows.append((
                    alert_time - timedelta(hours=3),
                    alert_time + timedelta(hours=2),
                    feedback[1],
                ))

        readings = []
        prev = None
        for t in sorted(by_time.keys()):
            row = by_time[t]
            ts = self._parse_dt(t)
            acoustic_values = acoustic_by_time.get(t, [])
            is_anomaly = 0
            label = "normal"
            for start, end, window_label in anomaly_windows:
                if start <= ts <= end:
                    is_anomaly = 1
                    label = window_label
                    break

            reading = {
                "timestamp": row["timestamp"],
                "debit":        row.get("debit", 600.0),
                "pression":     row.get("pression", 3.0),
                "ph":           row.get("ph", 7.2),
                "turbidity":    row.get("turbidity", 0.8),
                "chlorine":     row.get("chlorine", 0.5),
                "temperature":  row.get("temperature", 27.0),
                "conductivity": row.get("conductivity", 420.0),
                "acoustic":     round(sum(acoustic_values) / len(acoustic_values), 3) if acoustic_values else 0.08,
                # Deltas (variation par rapport à la lecture précédente)
                "debit_delta":    (row.get("debit", 600.0) - (prev["debit"] if prev else 600.0)),
                "pression_delta": (row.get("pression", 3.0) - (prev["pression"] if prev else 3.0)),
                "is_anomaly": is_anomaly,
                "label":      label,
            }
            readings.append(reading)
            prev = reading

        return readings

    def _generate_synthetic_data(self) -> dict[str, Any]:
        """
        Génère 6 mois de données synthétiques réalistes pour Dakar.
        Modélise : cycles journaliers, variations saisonnières, incidents.
        """
        readings = []
        now = datetime.now()
        start = now - timedelta(days=180)

        # Paramètres climatiques Dakar
        TEMP_BASE = 28.0   # °C
        SAISON_SECHE = True  # mars = saison sèche

        current = start
        step = timedelta(minutes=15)

        # Génération incident aléatoires (fuites, pannes)
        incidents = self._generate_synthetic_incidents(start, now)

        while current < now:
            hour = current.hour
            day_of_year = current.timetuple().tm_yday

            # Cycle journalier réaliste : pics matin (7h) et soir (19h)
            daily_factor = (
                0.6 + 0.4 * math.sin(math.pi * (hour - 3) / 12)
                if 6 <= hour <= 22
                else 0.4
            )

            # Variation hebdomadaire (week-end -15%)
            week_factor = 0.85 if current.weekday() >= 5 else 1.0

            # Base débit
            debit_base = 800 * daily_factor * week_factor
            # Noise réaliste
            debit = debit_base + random.gauss(0, 20)

            # Pression inverse du débit (conservation énergie)
            pression = max(1.0, 3.5 - (debit / 800) * 0.8 + random.gauss(0, 0.05))

            # Température eau suit température ambiante (décalé)
            temp_water = TEMP_BASE + 2 * math.sin(2 * math.pi * day_of_year / 365) + random.gauss(0, 0.3)

            # pH stable autour de 7.2 ± 0.2
            ph = 7.2 + random.gauss(0, 0.08)

            # Turbidité plus haute en saison des pluies (absente ici)
            turbidity = max(0.1, 0.8 + random.gauss(0, 0.15))

            # Chlore consommé à haute température
            chlorine = max(0.1, 0.5 - (temp_water - 28) * 0.02 + random.gauss(0, 0.03))

            # Conductivité stable
            conductivity = 420 + random.gauss(0, 8)

            # Score acoustique (normalement bas, pic lors d'une fuite)
            acoustic = max(0.0, min(1.0, 0.05 + random.gauss(0, 0.02)))

            is_anomaly = 0
            label = "normal"

            # Injecter les incidents synthétiques
            for inc in incidents:
                if inc["start"] <= current <= inc["end"]:
                    if inc["type"] == "leak":
                        debit *= 1.25           # surconsommation
                        pression *= 0.75        # chute pression
                        acoustic = min(1.0, 0.7 + random.gauss(0, 0.1))
                        is_anomaly = 1
                        label = "fuite"
                    elif inc["type"] == "pump_failure":
                        debit *= 0.4            # fort sous-débit
                        pression *= 0.5
                        is_anomaly = 1
                        label = "panne_pompe"
                    elif inc["type"] == "contamination":
                        ph = 6.3 + random.gauss(0, 0.1)
                        turbidity = 3.5 + random.gauss(0, 0.3)
                        chlorine = max(0.0, chlorine - 0.2)
                        is_anomaly = 1
                        label = "contamination"
                    elif inc["type"] == "fraud":
                        debit *= 1.4            # consommation excessive
                        is_anomaly = 1
                        label = "fraude"

            readings.append({
                "timestamp":    current.isoformat(),
                "debit":        round(debit, 1),
                "pression":     round(pression, 3),
                "ph":           round(ph, 2),
                "turbidity":    round(turbidity, 3),
                "chlorine":     round(chlorine, 3),
                "temperature":  round(temp_water, 1),
                "conductivity": round(conductivity, 1),
                "acoustic":     round(acoustic, 3),
                "debit_delta":  round(debit - readings[-1]["debit"] if readings else 0, 1),
                "pression_delta": round(pression - readings[-1]["pression"] if readings else 0, 3),
                "is_anomaly":   is_anomaly,
                "label":        label,
            })

            current += step

        logger.info(f"Synthétique : {len(readings)} lectures, "
                    f"{sum(1 for r in readings if r['is_anomaly'])} anomalies")

        return {
            "sensor_readings": readings,
            "alerts_history":  self._incidents_to_alerts(incidents),
            "sensors":         self._fake_sensors(),
            "asset_snapshots": self._synthetic_asset_snapshots(incidents),
            "interventions":   self._synthetic_interventions(incidents),
            "alert_feedback":  self._synthetic_alert_feedback(incidents),
        }

    def _generate_synthetic_incidents(self, start: datetime, end: datetime) -> list[dict]:
        """Génère ~15 incidents répartis sur 6 mois."""
        incidents = []
        types = [
            ("leak",          0.40, timedelta(hours=random.randint(2, 12))),
            ("pump_failure",  0.25, timedelta(hours=random.randint(1, 6))),
            ("contamination", 0.20, timedelta(hours=random.randint(4, 24))),
            ("fraud",         0.15, timedelta(hours=random.randint(6, 48))),
        ]
        total_days = (end - start).days
        # ~1 incident tous les 12 jours en moyenne
        n_incidents = total_days // 12

        for _ in range(n_incidents):
            r = random.random()
            cumul = 0.0
            chosen_type = "leak"
            chosen_dur = timedelta(hours=4)
            for t, prob, dur in types:
                cumul += prob
                if r <= cumul:
                    chosen_type = t
                    chosen_dur = dur
                    break

            offset_days = random.randint(0, total_days - 1)
            offset_hour = random.randint(0, 23)
            inc_start = start + timedelta(days=offset_days, hours=offset_hour)
            inc_end   = inc_start + chosen_dur

            incidents.append({
                "type":      chosen_type,
                "start":     inc_start,
                "end":       min(inc_end, end),
                "location":  random.choice([
                    "Grand Dakar", "Médina", "Fann", "HLM",
                    "Parcelles Assainies", "Pikine", "Guédiawaye"
                ]),
                "severity": random.choice(["critique", "alerte", "moyen"]),
            })

        return sorted(incidents, key=lambda x: x["start"])

    def _incidents_to_alerts(self, incidents: list[dict]) -> list[dict]:
        type_map = {
            "leak":          "Fuite",
            "pump_failure":  "Panne pompe",
            "contamination": "Contamination",
            "fraud":         "Fraude",
        }
        return [
            {
                "type":       type_map.get(inc["type"], inc["type"]),
                "severity":   inc["severity"],
                "location":   inc["location"],
                "created_at": inc["start"].isoformat(),
                "probability": random.randint(65, 97),
                "status":     "Résolu",
            }
            for inc in incidents
        ]

    def _fake_sensors(self) -> list[dict]:
        return [
            {"id": f"SNR-{i:03d}", "type": t, "location": loc, "status": "actif", "battery": 85, "signal": 90}
            for i, (t, loc) in enumerate([
                ("Pression", "Plateau"), ("Debit", "Médina"), ("Acoustique", "Fann"),
                ("Qualite", "HLM"), ("Pression", "Grand Dakar"), ("Debit", "Parcelles"),
                ("Acoustique", "Pikine"), ("Qualite", "Guédiawaye"),
            ], 1)
        ]

    def _synthetic_asset_snapshots(self, incidents: list[dict]) -> list[dict]:
        snapshots = []
        sensors = self._fake_sensors()
        now = datetime.now()
        high_risk_sensors = {"SNR-003", "SNR-005", "SNR-007"}
        medium_risk_sensors = {"SNR-002", "SNR-006"}

        for sensor in sensors:
            high_risk = sensor["id"] in high_risk_sensors
            medium_risk = sensor["id"] in medium_risk_sensors or sensor["location"] in {"Fann", "Grand Dakar", "Pikine"}
            for day in range(60, -1, -4):
                recorded_at = (now - timedelta(days=day)).isoformat()
                snapshots.append({
                    "sensor_id": sensor["id"],
                    "recorded_at": recorded_at,
                    "temperature_c": round((68 if high_risk else 54 if medium_risk else 44) + random.random() * 8, 1),
                    "vibration_score": round((0.76 if high_risk else 0.40 if medium_risk else 0.18) + random.random() * 0.18, 3),
                    "runtime_hours": round((5200 if high_risk else 3200 if medium_risk else 2100) + random.random() * 1200, 1),
                    "load_pct": round((90 if high_risk else 72 if medium_risk else 52) + random.random() * 12, 1),
                    "acoustic_score": round((0.88 if high_risk else 0.42 if medium_risk else 0.10) + random.random() * 0.14, 3),
                    "pressure_delta": round(((-0.72 if high_risk else -0.30 if medium_risk else -0.05) if sensor["type"] == "Pression" else (-0.38 if high_risk else -0.12 if medium_risk else 0.0)) + random.random() * 0.08, 3),
                    "flow_delta": round(((175 if high_risk else 84 if medium_risk else 15) if sensor["type"] == "Debit" else (88 if high_risk else 34 if medium_risk else 4)) + random.random() * 20, 1),
                    "failure_within_30d": 1 if high_risk and day <= 32 else 1 if medium_risk and day <= 16 else 0,
                })
        return snapshots

    def _synthetic_interventions(self, incidents: list[dict]) -> list[dict]:
        interventions = []
        for idx, inc in enumerate(incidents[:18], 1):
            interventions.append({
                "alert_id": f"SYN-ALT-{idx:03d}",
                "task_id": f"SYN-MT-{idx:03d}",
                "sensor_id": f"SNR-{(idx % 8) + 1:03d}",
                "maintenance_type": "Inspection" if inc["type"] in {"leak", "fraud"} else "Calibration",
                "outcome": "resolved" if inc["type"] != "fraud" else "inspected",
                "root_cause": inc["type"],
                "downtime_hours": 4.0 if inc["type"] == "pump_failure" else 1.5,
                "created_at": (inc["end"] + timedelta(hours=3)).isoformat(),
            })
        return interventions

    def _synthetic_alert_feedback(self, incidents: list[dict]) -> list[dict]:
        feedback = []
        for idx, inc in enumerate(incidents[:24], 1):
            feedback.append({
                "alert_id": f"SYN-ALT-{idx:03d}",
                "is_validated": 1,
                "false_positive": 0,
                "operator_label": inc["type"],
                "created_at": (inc["start"] + timedelta(hours=1)).isoformat(),
            })
        return feedback

    # ─── DONNÉES TEMPS RÉEL ──────────────────────────────────────────────────

    def get_latest_readings(self) -> dict[str, Any]:
        """Lit les dernières valeurs de chaque métrique."""
        try:
            db = self._get_db()

            flow = {}
            for r in db.execute(
                """SELECT metric, value, recorded_at FROM flow_readings
                   WHERE id IN (SELECT MAX(id) FROM flow_readings GROUP BY metric)"""
            ).fetchall():
                flow[r["metric"]] = {"value": r["value"], "at": r["recorded_at"]}

            quality = {}
            for r in db.execute(
                """SELECT metric, value, unit, recorded_at FROM quality_readings
                   WHERE id IN (SELECT MAX(id) FROM quality_readings GROUP BY metric)"""
            ).fetchall():
                quality[r["metric"]] = {"value": r["value"], "unit": r["unit"], "at": r["recorded_at"]}

            sensors = [dict(r) for r in db.execute(
                """SELECT s.id, s.type, s.location, s.status, s.battery, s.signal,
                          ah.temperature_c, ah.vibration_score, ah.runtime_hours,
                          ah.load_pct, ah.acoustic_score, ah.pressure_delta, ah.flow_delta,
                          ah.failure_within_30d, ah.recorded_at as health_recorded_at
                   FROM sensors s
                   LEFT JOIN asset_health_snapshots ah
                     ON ah.sensor_id = s.id
                    AND ah.recorded_at = (
                      SELECT MAX(recorded_at)
                      FROM asset_health_snapshots
                      WHERE sensor_id = s.id
                    )
                   LIMIT 30"""
            ).fetchall()]

            db.close()
            return {"flow": flow, "quality": quality, "sensors": sensors}

        except Exception as e:
            logger.warning(f"get_latest_readings fallback synthétique : {e}")
            return self._synthetic_realtime()

    def _synthetic_realtime(self) -> dict[str, Any]:
        """Valeurs temps réel synthétiques (quand DB inaccessible)."""
        hour = datetime.now().hour
        factor = 0.6 + 0.4 * math.sin(math.pi * max(0, hour - 3) / 12) if 6 <= hour <= 22 else 0.4
        return {
            "flow": {
                "debit":    {"value": round(800 * factor + random.gauss(0, 20), 1)},
                "pression": {"value": round(3.5 - factor * 0.8 + random.gauss(0, 0.05), 2)},
            },
            "quality": {
                "ph":           {"value": round(7.2 + random.gauss(0, 0.05), 2), "unit": ""},
                "turbidity":    {"value": round(0.8 + random.gauss(0, 0.1), 2),  "unit": "NTU"},
                "chlorine":     {"value": round(0.5 + random.gauss(0, 0.02), 2), "unit": "mg/L"},
                "temperature":  {"value": round(28.0 + random.gauss(0, 0.3), 1), "unit": "C"},
                "conductivity": {"value": round(420 + random.gauss(0, 5), 0),    "unit": "uS/cm"},
            },
            "sensors": self._fake_sensors(),
        }

    def get_quality_history(self, hours: int = 168) -> list[dict]:
        """7 jours d'historique qualité pour Prophet."""
        try:
            db = self._get_db()
            rows = db.execute(
                f"""SELECT metric, value, recorded_at FROM quality_readings
                    WHERE recorded_at >= datetime('now', '-{hours} hours')
                    ORDER BY recorded_at"""
            ).fetchall()
            db.close()
            if len(rows) < 10:
                return self._synthetic_quality_history(hours)
            return [dict(r) for r in rows]
        except Exception:
            return self._synthetic_quality_history(hours)

    def _synthetic_quality_history(self, hours: int) -> list[dict]:
        history = []
        now = datetime.now()
        for h in range(hours, 0, -4):  # toutes les 4h
            t = now - timedelta(hours=h)
            history.append({"metric": "ph", "value": round(7.2 + random.gauss(0, 0.08), 2), "recorded_at": t.isoformat()})
            history.append({"metric": "turbidity", "value": round(0.8 + random.gauss(0, 0.15), 3), "recorded_at": t.isoformat()})
            history.append({"metric": "chlorine", "value": round(0.5 + random.gauss(0, 0.03), 3), "recorded_at": t.isoformat()})
        return history

    def get_assets(self) -> list[dict]:
        """Pompes et vannes avec leur état pour la maintenance prédictive."""
        try:
            db = self._get_db()
            sensors = db.execute(
                """SELECT s.id, s.type, s.location, s.status, s.battery, s.signal,
                          ah.temperature_c, ah.vibration_score, ah.runtime_hours,
                          ah.load_pct, ah.acoustic_score, ah.pressure_delta, ah.flow_delta,
                          ah.failure_within_30d, ah.recorded_at as health_recorded_at
                   FROM sensors s
                   LEFT JOIN asset_health_snapshots ah
                     ON ah.sensor_id = s.id
                    AND ah.recorded_at = (
                      SELECT MAX(recorded_at)
                      FROM asset_health_snapshots
                      WHERE sensor_id = s.id
                    )
                   WHERE s.type IN ('Debit','Pression','Acoustique')"""
            ).fetchall()
            db.close()
            return [dict(s) for s in sensors]
        except Exception:
            return self._fake_sensors()

    def get_active_alerts(self) -> list[dict]:
        """Retourne les alertes actives depuis la DB (non résolues)."""
        try:
            db = self._get_db()
            rows = db.execute(
                """SELECT id, type, classification, location, severity,
                          probability, status, description, created_at
                   FROM alerts
                   WHERE status NOT IN ('Résolu', 'Fermé', 'Termine')
                   ORDER BY created_at DESC LIMIT 50"""
            ).fetchall()
            db.close()
            return [
                {
                    "id":             r["id"],
                    "type":           r["type"],
                    "classification": r["classification"],
                    "location":       r["location"],
                    "severity":       r["severity"],
                    "probability":    r["probability"],
                    "status":         r["status"],
                    "description":    r["description"] or "",
                    "date":           r["created_at"][:16].replace("T", " ") if r["created_at"] else "",
                    "source_type":    "db",
                }
                for r in rows
            ]
        except Exception as e:
            logger.warning(f"get_active_alerts error: {e}")
            return []

    def store_reading(self, reading: dict):
        """Stocke une nouvelle lecture en temps réel dans la DB."""
        try:
            db = self._get_db()
            now = datetime.now().isoformat()
            if "debit" in reading or reading.get("sensor_type") == "Debit":
                db.execute(
                    "INSERT INTO flow_readings (metric, value, recorded_at) VALUES (?, ?, ?)",
                    ("debit", reading.get("value", 0), now)
                )
            elif "ph" in reading or reading.get("sensor_type") == "Qualite":
                db.execute(
                    "INSERT INTO quality_readings (metric, value, unit, recorded_at) VALUES (?, ?, ?, ?)",
                    ("ph", reading.get("value", 7.2), "", now)
                )
            db.commit()
            db.close()
        except Exception as e:
            logger.warning(f"store_reading error: {e}")

    # ─── IMPORT DONNÉES RÉELLES SDE ──────────────────────────────────────────

    def import_sde_csv(self, csv_path: str, data_type: str = "flow"):
        """
        Import de données CSV réelles SDE.
        Format attendu : timestamp,sensor_id,metric,value
        
        Appeler via : POST /retrain après l'import
        """
        import csv
        db = self._get_db()
        imported = 0

        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    if data_type == "flow":
                        db.execute(
                            "INSERT OR IGNORE INTO flow_readings (metric, value, recorded_at) VALUES (?, ?, ?)",
                            (row["metric"], float(row["value"]), row["timestamp"])
                        )
                    elif data_type == "quality":
                        db.execute(
                            "INSERT OR IGNORE INTO quality_readings (metric, value, unit, recorded_at) VALUES (?, ?, ?, ?)",
                            (row["metric"], float(row["value"]), row.get("unit", ""), row["timestamp"])
                        )
                    imported += 1
                except (KeyError, ValueError) as e:
                    logger.warning(f"Ligne ignorée : {e}")

        db.commit()
        db.close()
        logger.info(f"Import SDE : {imported} lignes importées depuis {csv_path}")
        return imported
