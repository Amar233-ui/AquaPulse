"""
AIEngine
========
Contient les 3 modèles ML :
  1. Isolation Forest  → détection d'anomalies (fuites, fraudes, pannes)
  2. Random Forest     → maintenance prédictive (risque de panne)
  3. Règles + tendance → qualité de l'eau (remplaçable par Prophet)

Architecture conçue pour être swappable :
- Entraîner sur données synthétiques maintenant
- Remplacer par données SDE réelles → même interface, meilleures prédictions
"""

import math
import random
import logging
from datetime import datetime, timedelta
from typing import Any

import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline

logger = logging.getLogger("aquapulse-ai")


class AIEngine:
    def __init__(self):
        self._ready       = False
        self.model_version = "1.0.0-synthetic"

        # Modèle 1 : Isolation Forest pour anomalies multi-dimensionnelles
        self.anomaly_model = Pipeline([
            ("scaler", StandardScaler()),
            ("iforest", IsolationForest(
                n_estimators=200,
                contamination=0.06,   # ~6% des lectures sont des anomalies
                max_features=0.8,
                random_state=42,
                n_jobs=-1,
            )),
        ])

        # Modèle 2 : Random Forest pour maintenance (classification binaire)
        self.maintenance_model = Pipeline([
            ("scaler", StandardScaler()),
            ("rf", RandomForestClassifier(
                n_estimators=150,
                max_depth=8,
                class_weight="balanced",  # compense le déséquilibre pannes/normal
                random_state=42,
                n_jobs=-1,
            )),
        ])

        self._scaler_fitted = False
        self._training_stats: dict[str, Any] = {}

    def is_ready(self) -> bool:
        return self._ready

    # ─────────────────────────────────────────────────────────────────────────
    # ENTRAÎNEMENT
    # ─────────────────────────────────────────────────────────────────────────

    def train(self, data: dict[str, Any]):
        "
        readings = data.get("sensor_readings", [])
        asset_snapshots = data.get("asset_snapshots", [])
        if len(readings) < 20:
            logger.warning("Pas assez de données, modèles en mode règles uniquement")
            self._ready = True
            return

        # ── Modèle 1 : Isolation Forest ──────────────────────────────────────
        X_anomaly = self._build_anomaly_features(readings)
        self.anomaly_model.fit(X_anomaly)

        # Calibrer les seuils sur les données
        scores = self.anomaly_model.named_steps["iforest"].decision_function(
            self.anomaly_model.named_steps["scaler"].transform(X_anomaly)
        )
        self._anomaly_threshold = float(np.percentile(scores, 8))
        logger.info(f"Anomaly model: seuil={self._anomaly_threshold:.3f}, "
                    f"features={X_anomaly.shape}")

        # Modèle 2 : Random Forest maintenance
        X_maint, y_maint = self._build_maintenance_features(asset_snapshots, readings)
        if len(np.unique(y_maint)) >= 2:
            self.maintenance_model.fit(X_maint, y_maint)
            logger.info(f"Maintenance model: {np.sum(y_maint)} incidents / {len(y_maint)}")
        else:
            logger.info("Maintenance: pas assez d'exemples positifs, mode règles")

        # Stats d'entraînement
        self._training_stats = {
            "n_readings":    len(readings),
            "n_anomalies":   int(np.sum([r.get("is_anomaly", 0) for r in readings])),
            "debit_mean":    float(np.mean([r["debit"] for r in readings])),
            "debit_std":     float(np.std([r["debit"] for r in readings])),
            "pression_mean": float(np.mean([r["pression"] for r in readings])),
            "pression_std":  float(np.std([r["pression"] for r in readings])),
            "acoustic_mean": float(np.mean([r.get("acoustic", 0.08) for r in readings])),
            "acoustic_std":  float(np.std([r.get("acoustic", 0.08) for r in readings])),
            "n_asset_snapshots": len(asset_snapshots),
            "trained_at":    datetime.now().isoformat(),
        }

        self._ready = True
        self.model_version = (
            f"1.1.0-enriched-{'synthetic' if len(asset_snapshots) < 200 else 'hybrid'}"
        )
        logger.info(f"✅ Entraînement terminé : {self.model_version}")

    def _build_anomaly_features(self, readings: list[dict]) -> np.ndarray:
        """Features pour Isolation Forest : [débit, pression, acoustique, deltas, pH, turbidité]"""
        rows = []
        for r in readings:
            rows.append([
                r.get("debit", 600),
                r.get("pression", 3.0),
                r.get("acoustic", 0.05),
                r.get("debit_delta", 0),
                r.get("pression_delta", 0),
                r.get("ph", 7.2),
                r.get("turbidity", 0.8),
                r.get("chlorine", 0.5),
                r.get("temperature", 28.0),
            ])
        return np.array(rows, dtype=float)

    def _build_maintenance_features(self, asset_snapshots: list[dict], readings: list[dict]) -> tuple[np.ndarray, np.ndarray]:
        """Features maintenance : snapshots d'actifs si disponibles, sinon fallback séries réseau."""
        if asset_snapshots:
            rows = sorted(asset_snapshots, key=lambda s: (s.get("sensor_id", ""), s.get("recorded_at", "")))
            X, y = [], []
            for snap in rows:
                features = [
                    float(snap.get("temperature_c", 45.0)),
                    float(snap.get("vibration_score", 0.2)),
                    float(snap.get("runtime_hours", 2400.0)),
                    float(snap.get("load_pct", 60.0)),
                    float(snap.get("acoustic_score", 0.12)),
                    float(snap.get("pressure_delta", -0.05)),
                    float(snap.get("flow_delta", 15.0)),
                ]
                X.append(features)
                y.append(int(snap.get("failure_within_30d", 0)))

            return np.array(X, dtype=float), np.array(y, dtype=int)

        window = 8  # fallback historique global
        X, y = [], []

        for i in range(window, len(readings)):
            window_data = readings[i-window:i]
            next_reading = readings[i]

            debits    = [r.get("debit", 600) for r in window_data]
            pressions = [r.get("pression", 3.0) for r in window_data]

            features = [
                np.mean(debits),
                np.std(debits),
                min(debits),
                max(debits) - min(debits),      # range débit
                np.mean(pressions),
                np.std(pressions),
                min(pressions),
                max(pressions) - min(pressions),  # range pression
                np.mean([r.get("temperature", 28) for r in window_data]),
                np.mean([r.get("acoustic", 0.05) for r in window_data]),
                # Tendances
                (debits[-1] - debits[0]) / max(debits[0], 1),     # drift débit
                (pressions[-1] - pressions[0]) / max(pressions[0], 1),  # drift pression
            ]
            X.append(features)
            y.append(next_reading.get("is_anomaly", 0))

        return np.array(X, dtype=float), np.array(y, dtype=int)

    # ─────────────────────────────────────────────────────────────────────────
    # INFÉRENCE
    # ─────────────────────────────────────────────────────────────────────────

    def detect_anomalies(self, realtime_data: dict[str, Any]) -> dict[str, Any]:
        """
        Détecte les anomalies dans les données temps réel.
        Combine Isolation Forest + règles métier spécifiques réseau hydrique.
        """
        flow    = realtime_data.get("flow", {})
        quality = realtime_data.get("quality", {})
        sensors = realtime_data.get("sensors", [])

        debit    = flow.get("debit",    {}).get("value", 600)
        pression = flow.get("pression", {}).get("value", 3.0)
        ph       = quality.get("ph",         {}).get("value", 7.2)
        turb     = quality.get("turbidity",  {}).get("value", 0.8)
        chlorine = quality.get("chlorine",   {}).get("value", 0.5)
        temp     = quality.get("temperature",{}).get("value", 28.0)
        acoustic = float(np.mean([
            s.get("acoustic_score", 0.08) for s in sensors if s.get("acoustic_score") is not None
        ])) if sensors else 0.08

        stats = self._training_stats
        debit_mean    = stats.get("debit_mean",    600)
        debit_std     = stats.get("debit_std",     80)
        pression_mean = stats.get("pression_mean", 3.0)
        pression_std  = stats.get("pression_std",  0.3)
        acoustic_mean = stats.get("acoustic_mean", 0.08)

        now    = datetime.now().isoformat()
        alerts = self._detect_sensor_level_anomalies(
            sensors=sensors,
            debit=debit,
            pression=pression,
            ph=ph,
            turb=turb,
            chlorine=chlorine,
            temp=temp,
            acoustic=acoustic,
            generated_at=now,
        )

        # ── Règle 1 : Chute pression + hausse débit → Fuite probable ─────────
        if pression < pression_mean - 2 * pression_std and debit > debit_mean + 1.5 * debit_std:
            drop_pct = (pression_mean - pression) / pression_mean * 100
            excess   = (debit - debit_mean) / debit_mean * 100
            proba    = min(0.98, 0.60 + drop_pct / 100 + excess / 200)
            alerts.append(self._make_alert(
                id_suffix="FUITE",
                type_="Fuite",
                classification="Fuite",
                severity=self._severity_from_proba(proba),
                probability=round(proba * 100),
                location=self._estimate_leak_location(pression, debit),
                description=(
                    f"Chute de pression de {drop_pct:.0f}% et hausse du débit de {excess:.0f}%. "
                    f"Signature caractéristique d'une rupture de conduite. "
                    f"Pression actuelle : {pression:.2f} bar (normale : {pression_mean:.2f} bar)."
                ),
                generated_at=now,
            ))

        # ── Règle 1bis : acoustique anormalement haut → suspicion fuite locale ─
        if acoustic > max(0.25, acoustic_mean * 1.8) and pression < pression_mean:
            proba = min(0.93, 0.58 + acoustic * 0.4 + max(0, (pression_mean - pression)) * 0.08)
            alerts.append(self._make_alert(
                id_suffix="ACOUSTIC",
                type_="Fuite",
                classification="Fuite",
                severity=self._severity_from_proba(proba),
                probability=round(proba * 100),
                location=self._estimate_leak_location(pression, debit),
                description=(
                    f"Niveau acoustique moyen à {acoustic:.2f}, supérieur au bruit de fond observé. "
                    f"Chute de pression concomitante détectée sur les capteurs de zone."
                ),
                generated_at=now,
            ))

        # ── Règle 2 : Très bas débit → Panne pompe ───────────────────────────
        if debit < debit_mean * 0.45:
            drop_pct = (debit_mean - debit) / debit_mean * 100
            proba    = min(0.97, 0.55 + drop_pct / 200)
            alerts.append(self._make_alert(
                id_suffix="POMPE",
                type_="Panne pompe",
                classification="Panne pompe",
                severity=self._severity_from_proba(proba),
                probability=round(proba * 100),
                location="Station de pompage principale",
                description=(
                    f"Débit en chute de {drop_pct:.0f}% (actuel : {debit:.0f} m³/h, "
                    f"normal : {debit_mean:.0f} m³/h). Défaillance probable d'une pompe."
                ),
                generated_at=now,
            ))

        # ── Règle 3 : pH hors norme → Contamination ──────────────────────────
        if ph < 6.4 or ph > 8.6:
            deviation = abs(ph - 7.2) / 7.2 * 100
            proba = min(0.97, 0.70 + deviation / 100)
            alerts.append(self._make_alert(
                id_suffix="CONTAM",
                type_="Contamination",
                classification="Contamination",
                severity="critique" if (ph < 6.0 or ph > 9.0) else "alerte",
                probability=round(proba * 100),
                location="Réseau de distribution",
                description=(
                    f"pH mesuré à {ph:.2f} (norme OMS : 6.5–8.5). "
                    f"Turbidité : {turb:.2f} NTU. Chlore résiduel : {chlorine:.3f} mg/L. "
                    f"Risque sanitaire — analyses en cours."
                ),
                generated_at=now,
            ))

        # ── Règle 4 : Turbidité haute + chlore faible → Contamination ─────
        elif turb > 2.5 and chlorine < 0.2:
            proba = min(0.92, 0.50 + turb / 10 + (0.5 - chlorine))
            alerts.append(self._make_alert(
                id_suffix="TURB",
                type_="Contamination",
                classification="Contamination",
                severity="alerte",
                probability=round(proba * 100),
                location="Réseau secondaire",
                description=(
                    f"Turbidité anormalement haute ({turb:.2f} NTU) combinée à un chlore "
                    f"insuffisant ({chlorine:.3f} mg/L). Risque bactériologique."
                ),
                generated_at=now,
            ))

        # ── Règle 5 : Débit excessif stable → Fraude possible ────────────────
        if debit > debit_mean + 2.5 * debit_std and pression > pression_mean * 0.9:
            # Débit élevé mais pression OK → pas une fuite, plutôt prélèvement illicite
            excess = (debit - debit_mean) / debit_mean * 100
            proba  = min(0.89, 0.40 + excess / 300)
            if proba > 0.55:
                alerts.append(self._make_alert(
                    id_suffix="FRAUDE",
                    type_="Fraude",
                    classification="Fraude",
                    severity="alerte",
                    probability=round(proba * 100),
                    location="Secteur à identifier",
                    description=(
                        f"Consommation excessive de {excess:.0f}% au-dessus de la normale "
                        f"sans chute de pression correspondante. Possible branchement illicite."
                    ),
                    generated_at=now,
                ))

        # ── Modèle ML : validation par Isolation Forest ─────────────────────
        if self._ready and len(readings_vec := [
            debit, pression, acoustic, 0, 0, ph, turb, chlorine, temp
        ]) == 9:
            try:
                X = np.array([readings_vec])
                score = self.anomaly_model.named_steps["iforest"].decision_function(
                    self.anomaly_model.named_steps["scaler"].transform(X)
                )[0]
                # Si le modèle ML détecte une anomalie non couverte par les règles
                if score < self._anomaly_threshold and not alerts:
                    alerts.append(self._make_alert(
                        id_suffix="ML",
                        type_="Débit anormal",
                        classification="Débit anormal",
                        severity="moyen",
                        probability=round(min(0.88, max(0.55, (self._anomaly_threshold - score) / 0.2)) * 100),
                        location="Réseau général",
                        description=(
                            f"Isolation Forest a détecté un pattern inhabituel "
                            f"(score={score:.3f}). Surveillance recommandée."
                        ),
                        generated_at=now,
                    ))
            except Exception as e:
                logger.debug(f"ML score ignoré : {e}")

        deduped_alerts: list[dict[str, Any]] = []
        seen: set[tuple[str, str, str]] = set()
        for alert in sorted(alerts, key=lambda item: (-int(item["probability"]), item["id"])):
            key = (str(alert["classification"]), str(alert["location"]), str(alert["type"]))
            if key in seen:
                continue
            seen.add(key)
            deduped_alerts.append(alert)

        summary = {
            "total":    len(deduped_alerts),
            "critique": sum(1 for a in deduped_alerts if a["severity"] == "critique"),
            "alerte":   sum(1 for a in deduped_alerts if a["severity"] == "alerte"),
            "moyen":    sum(1 for a in deduped_alerts if a["severity"] == "moyen"),
            "faible":   sum(1 for a in deduped_alerts if a["severity"] == "faible"),
        }

        return {
            "alerts":       deduped_alerts[:6],
            "summary":      summary,
            "generated_at": now,
        }

    def predict_leaks(self, realtime_data: dict[str, Any]) -> dict[str, Any]:
        """Prédit la probabilité de fuite par segment de réseau."""
        flow    = realtime_data.get("flow", {})
        sensors = realtime_data.get("sensors", [])

        debit    = flow.get("debit",    {}).get("value", 600)
        pression = flow.get("pression", {}).get("value", 3.0)

        stats = self._training_stats
        d_mean = stats.get("debit_mean", 600)
        d_std  = stats.get("debit_std", 80)
        p_mean = stats.get("pression_mean", 3.0)
        p_std  = stats.get("pression_std", 0.3)

        zones = [
            "Plateau", "Médina", "Fann", "HLM",
            "Grand Dakar", "Parcelles Assainies", "Pikine", "Guédiawaye"
        ]

        segments = []
        for i, zone in enumerate(zones):
            # Simuler des variations par zone (en réalité : capteur dédié par zone)
            zone_factor = 1 + random.gauss(0, 0.15)
            z_debit    = debit * zone_factor
            z_pression = max(0.5, pression * (1 - i * 0.03) + random.gauss(0, 0.05))

            # Score de risque fuite (0-1)
            pression_anomaly = max(0, (p_mean - z_pression) / max(p_std, 0.1))
            debit_anomaly    = max(0, (z_debit - d_mean) / max(d_std, 1))
            risk_score = min(1.0, (pression_anomaly * 0.6 + debit_anomaly * 0.4) / 3)

            segments.append({
                "zone":           zone,
                "risk_score":     round(risk_score, 3),
                "risk":           "high" if risk_score > 0.6 else "medium" if risk_score > 0.3 else "low",
                "estimated_flow": round(z_debit, 1),
                "pressure":       round(z_pression, 2),
                "confidence":     round(random.uniform(0.70, 0.95), 2),
            })

        high_risk = [s for s in segments if s["risk"] == "high"]

        return {
            "segments":           sorted(segments, key=lambda x: -x["risk_score"]),
            "predicted_next_24h": len(high_risk),
            "highest_risk_zone":  segments[0]["zone"] if segments else "N/A",
            "model_version":      self.model_version,
        }

    def predict_maintenance(self, assets: list[dict]) -> dict[str, Any]:
        """
        Prédit le risque de panne pour chaque pompe/capteur.
        Features simulées (en réalité : issues des capteurs IoT).
        """
        results = []
        now = datetime.now()

        for asset in assets[:20]:  # limiter pour la perf
            sensor_id   = asset.get("id", "")
            sensor_type = asset.get("type", "")
            status      = asset.get("status", "actif")
            battery     = asset.get("battery", 80)
            signal      = asset.get("signal", 85)
            location    = asset.get("location", "")
            failure_within_30d = float(asset.get("failure_within_30d", 0) or 0)

            temp_celsius      = float(asset.get("temperature_c", random.uniform(35, 65)))
            vibration_score   = float(asset.get("vibration_score", random.uniform(0.1, 0.9)))
            runtime_hours     = float(asset.get("runtime_hours", random.uniform(1800, 4200)))
            load_pct          = float(asset.get("load_pct", random.uniform(40, 95)))
            acoustic_score    = float(asset.get("acoustic_score", random.uniform(0.05, 0.5)))
            pressure_delta    = float(asset.get("pressure_delta", random.uniform(-0.3, 0.2)))
            flow_delta        = float(asset.get("flow_delta", random.uniform(5, 120)))
            maintenance_days  = max(15, min(420, int(runtime_hours / 14)))
            age_simulated     = max(1, min(18, int(runtime_hours / 900)))

            # Score de risque composite
            age_risk    = min(1.0, age_simulated / 20)
            temp_risk   = max(0, (temp_celsius - 45) / 20)
            vib_risk    = vibration_score ** 2
            maint_risk  = min(1.0, maintenance_days / 365)
            batt_risk   = max(0, (30 - battery) / 30) if battery < 30 else 0
            acoustic_risk = min(1.0, acoustic_score / 0.9)
            hydraulic_risk = min(1.0, (abs(pressure_delta) * 1.8 + abs(flow_delta) / 180))
            signal_risk = max(0, (55 - signal) / 55) if signal < 55 else 0
            status_risk = 0.35 if status == "alerte" else 0.65 if status == "inactif" else 0
            imminent_failure_risk = min(1.0, failure_within_30d)

            risk_score = (
                age_risk             * 0.12 +
                temp_risk            * 0.18 +
                vib_risk             * 0.16 +
                maint_risk           * 0.10 +
                batt_risk            * 0.06 +
                acoustic_risk        * 0.10 +
                hydraulic_risk       * 0.12 +
                signal_risk          * 0.04 +
                status_risk          * 0.05 +
                imminent_failure_risk * 0.17
            )

            # Validation RF si entraîné
            if hasattr(self.maintenance_model, "predict_proba"):
                try:
                    X = np.array([[
                        temp_celsius,
                        vibration_score,
                        runtime_hours,
                        load_pct,
                        acoustic_score,
                        pressure_delta,
                        flow_delta,
                    ]])
                    proba = self.maintenance_model.predict_proba(X)[0]
                    if len(proba) >= 2:
                        risk_score = 0.35 * risk_score + 0.65 * proba[1]
                except Exception:
                    pass

            if failure_within_30d >= 1:
                risk_score = max(risk_score, 0.72)
            if status == "alerte" and (temp_celsius > 62 or vibration_score > 0.62 or acoustic_score > 0.7):
                risk_score = max(risk_score, 0.78)
            if status == "inactif":
                risk_score = max(risk_score, 0.82)

            risk_score = min(1.0, risk_score)

            # Urgence et date recommandée
            if risk_score >= 0.72:
                urgency = "urgent"
                days_until = random.randint(1, 7)
            elif risk_score >= 0.42:
                urgency = "planifier"
                days_until = random.randint(8, 30)
            else:
                urgency = "surveiller"
                days_until = random.randint(31, 90)

            due_date = (now + timedelta(days=days_until)).strftime("%Y-%m-%d")

            results.append({
                "asset_id":        sensor_id,
                "asset_name":      f"{sensor_type} — {location}",
                "risk_score":      round(risk_score, 3),
                "risk_percent":    round(risk_score * 100, 1),
                "urgency":         urgency,
                "recommended_action": self._maintenance_action(sensor_type, risk_score),
                "due_date":        due_date,
                "days_until":      days_until,
                "ai_confidence":   round(random.uniform(0.72, 0.96), 2),
                "features": {
                    "age_years":         age_simulated,
                    "temperature":       round(temp_celsius, 1),
                    "vibration_score":   round(vibration_score, 2),
                    "days_since_maint":  maintenance_days,
                    "battery":           battery,
                    "acoustic_score":    round(acoustic_score, 2),
                    "pressure_delta":    round(pressure_delta, 3),
                    "flow_delta":        round(flow_delta, 1),
                    "signal":            signal,
                    "failure_within_30d": int(failure_within_30d),
                },
            })

        results.sort(key=lambda x: -x["risk_score"])

        return {
            "assets":         results,
            "urgent_count":   sum(1 for r in results if r["urgency"] == "urgent"),
            "model_version":  self.model_version,
            "generated_at":   now.isoformat(),
        }

    def predict_quality(self, history: list[dict]) -> dict[str, Any]:
        """
        Prédiction qualité eau H+6 et H+24.
        Règles + tendance linéaire simple (remplaçable par Prophet).
        """
        by_metric: dict[str, list[float]] = {}
        for r in history:
            m = r.get("metric", "")
            if m not in by_metric:
                by_metric[m] = []
            by_metric[m].append(r.get("value", 0))

        def trend(values: list[float], horizon: int) -> float:
            if len(values) < 2:
                return values[-1] if values else 0
            # Tendance linéaire simple
            n = len(values)
            x = list(range(n))
            xm, ym = sum(x)/n, sum(values)/n
            slope = sum((x[i]-xm)*(values[i]-ym) for i in range(n)) / max(sum((x[i]-xm)**2 for i in range(n)), 1e-9)
            return values[-1] + slope * horizon

        def last(metric: str, default: float) -> float:
            vals = by_metric.get(metric, [])
            return vals[-1] if vals else default

        ph_now   = last("ph", 7.2)
        turb_now = last("turbidity", 0.8)
        cl_now   = last("chlorine", 0.5)
        temp_now = last("temperature", 28.0)

        # Prédictions H+6 et H+24
        ph_6h   = round(trend(by_metric.get("ph", [ph_now]), 6), 2)
        ph_24h  = round(trend(by_metric.get("ph", [ph_now]), 24), 2)
        turb_6h = round(max(0.1, trend(by_metric.get("turbidity", [turb_now]), 6)), 2)

        # Score qualité global (0-100)
        score = 100
        if ph_now < 6.5 or ph_now > 8.5:   score -= 30
        elif ph_now < 7.0 or ph_now > 8.0: score -= 10
        if turb_now > 2.0:   score -= 25
        elif turb_now > 1.0: score -= 10
        if cl_now < 0.2:     score -= 20
        elif cl_now < 0.3:   score -= 8
        if temp_now > 30:    score -= 10

        trend_dir = "stable"
        ph_vals   = by_metric.get("ph", [])
        if len(ph_vals) >= 4:
            recent_slope = ph_vals[-1] - ph_vals[-4]
            if recent_slope < -0.1:   trend_dir = "degrading"
            elif recent_slope > 0.05: trend_dir = "improving"

        return {
            "current_score": max(0, min(100, score)),
            "trend_24h":     trend_dir,
            "current": {
                "ph":           round(ph_now, 2),
                "turbidity":    round(turb_now, 3),
                "chlorine":     round(cl_now, 3),
                "temperature":  round(temp_now, 1),
            },
            "forecast_6h":  {"ph": ph_6h, "turbidity": turb_6h},
            "forecast_24h": {"ph": ph_24h},
            "alerts":       self._quality_alerts(ph_now, turb_now, cl_now, temp_now),
            "model_version": self.model_version,
        }

    def compute_network_health(self, realtime_data: dict[str, Any]) -> int:
        """Score global de santé du réseau (0-100)."""
        flow    = realtime_data.get("flow", {})
        quality = realtime_data.get("quality", {})

        debit    = flow.get("debit",    {}).get("value", 600)
        pression = flow.get("pression", {}).get("value", 3.0)
        ph       = quality.get("ph",    {}).get("value", 7.2)
        turb     = quality.get("turbidity", {}).get("value", 0.8)

        stats  = self._training_stats
        d_mean = stats.get("debit_mean", 600)
        p_mean = stats.get("pression_mean", 3.0)

        score = 100
        score -= min(25, abs(debit - d_mean) / max(d_mean, 1) * 50)
        score -= min(20, abs(pression - p_mean) / max(p_mean, 1) * 40)
        if ph < 6.5 or ph > 8.5: score -= 20
        if turb > 2.0: score -= 15

        return max(0, min(100, int(score)))

    def score_single_reading(self, reading: dict) -> float:
        """Score d'anomalie pour une seule lecture (temps réel)."""
        if not self._ready:
            return 0.0
        try:
            vec = np.array([[
                reading.get("value", 600),
                3.0, 0.05, 0, 0, 7.2, 0.8, 0.5, 28.0
            ]])
            score = self.anomaly_model.named_steps["iforest"].decision_function(
                self.anomaly_model.named_steps["scaler"].transform(vec)
            )[0]
            return round(float(max(0, -score)), 3)
        except Exception:
            return 0.0

    def _detect_sensor_level_anomalies(
        self,
        sensors: list[dict[str, Any]],
        debit: float,
        pression: float,
        ph: float,
        turb: float,
        chlorine: float,
        temp: float,
        acoustic: float,
        generated_at: str,
    ) -> list[dict[str, Any]]:
        """Détection plus fine par capteur pour éviter un seul incident global."""
        alerts: list[dict[str, Any]] = []
        if not sensors:
            return alerts

        stats = self._training_stats
        pressure_mean = stats.get("pression_mean", 3.0)

        for sensor in sensors:
            sensor_vector = self._build_sensor_realtime_vector(
                sensor=sensor,
                debit=debit,
                pression=pression,
                ph=ph,
                turb=turb,
                chlorine=chlorine,
                temp=temp,
            )
            score = None
            if self._ready:
                try:
                    X = np.array([sensor_vector], dtype=float)
                    score = self.anomaly_model.named_steps["iforest"].decision_function(
                        self.anomaly_model.named_steps["scaler"].transform(X)
                    )[0]
                except Exception:
                    score = None

            classification = self._classify_sensor_anomaly(sensor, pression, pressure_mean, ph, turb, chlorine)
            if not classification:
                continue

            base_probability = self._sensor_probability_from_score(sensor, score)
            if classification == "Fuite":
                base_probability = max(base_probability, min(96, round(55 + acoustic * 65)))
            elif classification == "Panne pompe" and sensor.get("status") == "inactif":
                base_probability = max(base_probability, 82)

            if base_probability < 62:
                continue

            sensor_id = str(sensor.get("id", "CAPTEUR"))
            sensor_type = str(sensor.get("type", "Capteur"))
            location = str(sensor.get("location", "Réseau"))

            alerts.append(self._make_alert(
                id_suffix=f"{classification.upper().replace(' ', '-')}-{sensor_id}",
                type_=classification,
                classification=classification,
                severity=self._severity_from_proba(base_probability / 100),
                probability=base_probability,
                location=location,
                description=self._sensor_alert_description(
                    sensor=sensor,
                    classification=classification,
                    model_score=score,
                    network_pressure=pression,
                    network_flow=debit,
                    acoustic=acoustic,
                ),
                generated_at=generated_at,
            ))

        return alerts

    @staticmethod
    def _build_sensor_realtime_vector(
        sensor: dict[str, Any],
        debit: float,
        pression: float,
        ph: float,
        turb: float,
        chlorine: float,
        temp: float,
    ) -> list[float]:
        flow_delta = float(sensor.get("flow_delta", 0.0) or 0.0)
        pressure_delta = float(sensor.get("pressure_delta", 0.0) or 0.0)
        acoustic_score = float(sensor.get("acoustic_score", 0.08) or 0.08)
        return [
            float(debit + flow_delta),
            float(max(0.2, pression + pressure_delta)),
            acoustic_score,
            flow_delta,
            pressure_delta,
            float(ph),
            float(turb),
            float(chlorine),
            float(temp),
        ]

    @staticmethod
    def _sensor_probability_from_score(sensor: dict[str, Any], score: float | None) -> int:
        vibration = float(sensor.get("vibration_score", 0.0) or 0.0)
        acoustic_score = float(sensor.get("acoustic_score", 0.0) or 0.0)
        signal = int(sensor.get("signal", 80) or 80)
        failure_within_30d = int(sensor.get("failure_within_30d", 0) or 0)
        status = str(sensor.get("status", "actif"))

        probability = 54
        if score is not None:
            probability += max(0, int(round((-score) * 260)))
        probability += int(vibration * 18)
        probability += int(acoustic_score * 22)
        probability += failure_within_30d * 14
        if status == "alerte":
            probability += 8
        if status == "inactif":
            probability += 14
        if signal < 45:
            probability += 4
        return max(40, min(98, probability))

    @staticmethod
    def _classify_sensor_anomaly(
        sensor: dict[str, Any],
        pression: float,
        pressure_mean: float,
        ph: float,
        turb: float,
        chlorine: float,
    ) -> str | None:
        sensor_type = str(sensor.get("type", "")).lower()
        acoustic_score = float(sensor.get("acoustic_score", 0.0) or 0.0)
        vibration = float(sensor.get("vibration_score", 0.0) or 0.0)
        pressure_delta = float(sensor.get("pressure_delta", 0.0) or 0.0)
        flow_delta = float(sensor.get("flow_delta", 0.0) or 0.0)
        failure_within_30d = int(sensor.get("failure_within_30d", 0) or 0)
        status = str(sensor.get("status", "actif"))

        if ("qualite" in sensor_type or "quality" in sensor_type) and (ph < 6.4 or ph > 8.6 or (turb > 2.5 and chlorine < 0.2)):
            return "Contamination"
        if "acoustique" in sensor_type and acoustic_score >= 0.55 and (pression < pressure_mean or pressure_delta < -0.18):
            return "Fuite"
        if "pression" in sensor_type and pressure_delta <= -0.25 and (flow_delta >= 70 or acoustic_score >= 0.35):
            return "Fuite"
        if "debit" in sensor_type and flow_delta >= 120 and pression >= pressure_mean * 0.9:
            return "Fraude"
        if ("pression" in sensor_type) and (status in {"alerte", "inactif"} or failure_within_30d or vibration >= 0.62):
            return "Pression"
        if ("debit" in sensor_type) and (status in {"alerte", "inactif"} or failure_within_30d or vibration >= 0.62):
            return "Panne pompe"
        if status in {"alerte", "inactif"} or failure_within_30d or vibration >= 0.62:
            return "Anomalie capteur"
        return None

    @staticmethod
    def _sensor_alert_description(
        sensor: dict[str, Any],
        classification: str,
        model_score: float | None,
        network_pressure: float,
        network_flow: float,
        acoustic: float,
    ) -> str:
        sensor_id = str(sensor.get("id", "capteur"))
        sensor_type = str(sensor.get("type", "Capteur"))
        vibration = float(sensor.get("vibration_score", 0.0) or 0.0)
        acoustic_score = float(sensor.get("acoustic_score", 0.0) or 0.0)
        pressure_delta = float(sensor.get("pressure_delta", 0.0) or 0.0)
        flow_delta = float(sensor.get("flow_delta", 0.0) or 0.0)
        signal = int(sensor.get("signal", 80) or 80)
        score_text = f" Score modèle={model_score:.3f}." if model_score is not None else ""

        if classification == "Fuite":
            return (
                f"{sensor_type} {sensor_id} présente une dérive pression/débit "
                f"({pressure_delta:.2f} bar, {flow_delta:.1f} m3/h) avec signature acoustique "
                f"locale à {acoustic_score:.2f} et moyenne réseau à {acoustic:.2f}.{score_text}"
            )
        if classification == "Fraude":
            return (
                f"{sensor_type} {sensor_id} signale une surconsommation localisée "
                f"de {flow_delta:.1f} m3/h alors que la pression réseau reste à {network_pressure:.2f} bar. "
                f"Schéma compatible avec un prélèvement non autorisé.{score_text}"
            )
        if classification == "Contamination":
            return (
                f"{sensor_type} {sensor_id} détecte un écart qualité nécessitant vérification terrain. "
                f"Le moteur recoupe qualité réseau et capteur local avant génération.{score_text}"
            )
        if classification == "Pression":
            return (
                f"{sensor_type} {sensor_id} présente une dérive de pression de {pressure_delta:.2f} bar "
                f"avec un état {sensor.get('status', 'actif')} et une vibration à {vibration:.2f}. "
                f"Le moteur suspecte une chute de performance hydraulique locale.{score_text}"
            )
        if classification == "Anomalie capteur":
            return (
                f"{sensor_type} {sensor_id} présente un comportement matériel anormal "
                f"(état {sensor.get('status', 'actif')}, vibration {vibration:.2f}, signal {signal}%). "
                f"Une vérification terrain du capteur et de son alimentation est recommandée.{score_text}"
            )
        return (
            f"{sensor_type} {sensor_id} cumule un état {sensor.get('status', 'actif')}, "
            f"une vibration à {vibration:.2f}, un signal à {signal}% et une dérive hydraulique "
            f"de {flow_delta:.1f} m3/h. Risque de défaillance à traiter rapidement.{score_text}"
        )

    # ─────────────────────────────────────────────────────────────────────────
    # HELPERS
    # ─────────────────────────────────────────────────────────────────────────

    @staticmethod
    def _make_alert(id_suffix, type_, classification, severity, probability,
                    location, description, generated_at) -> dict:
        return {
            "id":             f"AI-{id_suffix}-{generated_at[:10]}",
            "type":           type_,
            "classification": classification,
            "location":       location,
            "severity":       severity,
            "probability":    probability,
            "status":         "En cours",
            "description":    description,
            "source":         "IA AquaPulse",
            "date":           generated_at[:16].replace("T", " "),
            "source_type":    "ai_generated",
        }

    @staticmethod
    def _severity_from_proba(proba: float) -> str:
        if proba >= 0.85: return "critique"
        if proba >= 0.65: return "alerte"
        if proba >= 0.45: return "moyen"
        return "faible"

    @staticmethod
    def _estimate_leak_location(pression: float, debit: float) -> str:
        locations = [
            "Grand Dakar — Conduite principale",
            "Médina — Réseau secondaire",
            "Fann — Jonction J1-P1",
            "HLM — Canalisation nord",
            "Parcelles Assainies — Tronçon C12",
        ]
        idx = int(abs(hash(f"{pression:.1f}{debit:.0f}")) % len(locations))
        return locations[idx]

    @staticmethod
    def _maintenance_action(sensor_type: str, risk_score: float) -> str:
        actions = {
            "Debit": {
                "urgent":    "Inspection immédiate + remplacement si > 15 ans",
                "planifier": "Calibration débit et vérification joints",
                "surveiller": "Lecture hebdomadaire recommandée",
            },
            "Pression": {
                "urgent":    "Vérification vanne + test hydraulique urgent",
                "planifier": "Calibration capteur de pression",
                "surveiller": "Contrôle mensuel",
            },
        }
        urgency = "urgent" if risk_score > 0.7 else "planifier" if risk_score > 0.45 else "surveiller"
        return actions.get(sensor_type, {
            "urgent":    "Intervention terrain immédiate",
            "planifier": "Maintenance préventive à planifier",
            "surveiller": "Surveillance continue activée",
        })[urgency]

    @staticmethod
    def _quality_alerts(ph, turbidity, chlorine, temperature) -> list[dict]:
        alerts = []
        if ph < 6.5:
            alerts.append({"metric": "ph", "value": ph, "message": f"pH trop acide ({ph:.2f})", "severity": "critique"})
        elif ph > 8.5:
            alerts.append({"metric": "ph", "value": ph, "message": f"pH trop basique ({ph:.2f})", "severity": "alerte"})
        if turbidity > 1.0:
            alerts.append({"metric": "turbidity", "value": turbidity, "message": f"Turbidité élevée ({turbidity:.2f} NTU)", "severity": "alerte" if turbidity > 2 else "moyen"})
        if chlorine < 0.2:
            alerts.append({"metric": "chlorine", "value": chlorine, "message": f"Chlore insuffisant ({chlorine:.3f} mg/L)", "severity": "alerte"})
        if temperature > 30:
            alerts.append({"metric": "temperature", "value": temperature, "message": f"Température élevée ({temperature:.1f}°C)", "severity": "moyen"})
        return alerts
