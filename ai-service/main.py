"""
AquaPulse AI Service
====================
Microservice FastAPI qui fournit les prédictions IA à l'application Next.js.
Fonctionne avec des données synthétiques maintenant,
prêt à basculer sur données réelles SDE (remplacer le DataProvider).

Démarrage : uvicorn main:app --reload --port 8000
"""


from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import os
import logging


from dotenv import load_dotenv
load_dotenv()

from models.engine import AIEngine
from data.provider import DataProvider

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("aquapulse-ai")

app = FastAPI(
    title="AquaPulse AI Service",
    description="Moteur IA pour la détection de fuites, maintenance prédictive et qualité de l'eau",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", os.getenv("NEXT_APP_URL", "*")],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialisation globale au démarrage
AI_SERVICE_TOKEN = os.getenv("AI_SERVICE_TOKEN", "aquapulse-ai-dev-token")
DB_PATH = os.getenv("AQUAPULSE_DB_PATH", "../aq3/data/aquapulse.db")

engine = AIEngine()
provider = DataProvider(DB_PATH)

@app.on_event("startup")
async def startup():
    logger.info("🚀 Démarrage AquaPulse AI Service...")
    data = provider.load_training_data()
    engine.train(data)
    logger.info(f"✅ Modèles entraînés sur {len(data['sensor_readings'])} lectures")


def verify_token(authorization: Optional[str] = Header(None)):
    """Auth simple par token Bearer — remplacer par JWT en production"""
    if os.getenv("AI_REQUIRE_AUTH", "false") == "true":
        if not authorization or authorization != f"Bearer {AI_SERVICE_TOKEN}":
            raise HTTPException(status_code=401, detail="Token invalide")
    return True


# ─────────────────────────────────────────────────────────────────────────────
# ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {
        "status": "ok",
        "models_ready": engine.is_ready(),
        "db_path": DB_PATH,
        "version": "1.0.0"
    }


@app.get("/anomalies", dependencies=[Depends(verify_token)])
def get_anomalies():
    """
    Retourne les anomalies détectées en temps réel.
    Format compatible avec /api/operateur/alertes de Next.js.
    """
    readings = provider.get_latest_readings()
    anomalies = engine.detect_anomalies(readings)
    return {
        "alerts": anomalies["alerts"],
        "summary": anomalies["summary"],
        "generated_at": anomalies["generated_at"],
        "model_version": engine.model_version,
    }


@app.get("/predict/leaks", dependencies=[Depends(verify_token)])
def predict_leaks():
    """Probabilité de fuite par secteur/segment."""
    readings = provider.get_latest_readings()
    return engine.predict_leaks(readings)


@app.get("/predict/maintenance", dependencies=[Depends(verify_token)])
def predict_maintenance():
    """Score de risque de panne pour chaque pompe et vanne."""
    assets = provider.get_assets()
    return engine.predict_maintenance(assets)


@app.get("/predict/quality", dependencies=[Depends(verify_token)])
def predict_quality():
    """Prédiction qualité eau à H+6 et H+24."""
    history = provider.get_quality_history()
    return engine.predict_quality(history)


@app.get("/dashboard/kpis", dependencies=[Depends(verify_token)])
def get_ai_kpis():
    """
    KPIs enrichis par l'IA pour le dashboard opérateur.
    Remplace les KPIs statiques de /api/operateur/dashboard.
    """
    readings = provider.get_latest_readings()
    assets   = provider.get_assets()
    history  = provider.get_quality_history()

    leaks   = engine.predict_leaks(readings)
    maint   = engine.predict_maintenance(assets)
    quality = engine.predict_quality(history)
    anomalies = engine.detect_anomalies(readings)

    return {
        "leakDetections":  len([l for l in leaks["segments"] if l["risk"] == "high"]),
        "activeAlerts":    anomalies["summary"]["total"],
        "criticalAlerts":  anomalies["summary"]["critique"],
        "networkHealth":   engine.compute_network_health(readings),
        "predictedLeaks24h": leaks["predicted_next_24h"],
        "maintenanceUrgent": len([m for m in maint["assets"] if m["urgency"] == "urgent"]),
        "qualityScore":    quality["current_score"],
        "qualityTrend":    quality["trend_24h"],
    }


@app.post("/retrain", dependencies=[Depends(verify_token)])
def retrain():
    """
    Relance l'entraînement sur les données actuelles.
    À appeler après import de nouvelles données SDE.
    """
    data = provider.load_training_data()
    engine.train(data)
    return {
        "ok": True,
        "trained_on": len(data["sensor_readings"]),
        "model_version": engine.model_version
    }


class SensorReadingInput(BaseModel):
    sensor_id: str
    sensor_type: str
    value: float
    location: str
    timestamp: Optional[str] = None


@app.post("/ingest/reading", dependencies=[Depends(verify_token)])
def ingest_reading(reading: SensorReadingInput):
    """
    Point d'entrée temps réel pour les nouvelles lectures capteurs.
    En production : connecter ici les MQTT/API capteurs IoT.
    """
    provider.store_reading(reading.dict())
    # Re-score uniquement ce capteur (pas re-entraînement complet)
    score = engine.score_single_reading(reading.dict())
    return {"ok": True, "anomaly_score": score}


@app.get("/anomalies/live")
def get_live_anomalies():
    """Relit la DB à chaque appel pour avoir les données les plus fraîches."""
    readings = provider.get_latest_readings()
    return engine.detect_anomalies(readings)


class IncidentInput(BaseModel):
    id: int
    type: str
    location: str
    description: str
    createdAt: Optional[str] = None


@app.post("/correlate", dependencies=[Depends(verify_token)])
def correlate_incident(incident: IncidentInput):
    """
    Reçoit un signalement citoyen et cherche les alertes IA qui correspondent.
    Compare le type, la zone géographique et la description.
    """
    inc_type     = incident.type.lower().strip()
    inc_location = incident.location.lower().strip()
    inc_desc     = incident.description.lower().strip()

    # Anomalies détectées en temps réel
    readings  = provider.get_latest_readings()
    anomalies = engine.detect_anomalies(readings)

    # Alertes actives dans la DB
    db_alerts = provider.get_active_alerts()

    all_alerts = anomalies["alerts"] + db_alerts

    # Mapping type signalement → types d'alertes correspondants
    TYPE_MAP: dict[str, list[str]] = {
        "fuite":         ["fuite", "débit anormal", "pression"],
        "pression":      ["pression", "fuite", "panne pompe"],
        "qualite":       ["contamination", "qualité", "ph"],
        "contamination": ["contamination", "qualité", "ph"],
        "coupure":       ["panne pompe", "pression", "fuite"],
        "odeur":         ["contamination", "qualité"],
        "autre":         ["débit anormal", "fuite", "pression"],
    }

    location_words = [w for w in inc_location.split() if len(w) > 3]

    matches = []
    for alert in all_alerts:
        alert_type     = alert.get("type", "").lower()
        alert_location = alert.get("location", "").lower()
        score          = 0.0
        reasons        = []

        # Score type (0.0 - 0.50)
        for rt in TYPE_MAP.get(inc_type, [inc_type]):
            if rt in alert_type:
                score += 0.50
                reasons.append(f"Même type de problème ({alert.get('type', '')})")
                break
            elif any(w in alert_type for w in inc_type.split()):
                score += 0.25
                reasons.append(f"Type similaire ({alert.get('type', '')})")
                break

        # Score localisation (0.0 - 0.35)
        loc_hits = sum(1 for w in location_words if w in alert_location)
        if loc_hits > 0:
            score += min(0.35, loc_hits * 0.15)
            reasons.append(f"Zone géographique proche ({alert.get('location', '')})")

        # Score description (0.0 - 0.15)
        alert_desc  = alert.get("description", "").lower()
        desc_hits   = sum(1 for w in inc_desc.split()[:10] if len(w) > 4 and w in alert_desc)
        if desc_hits > 0:
            score += min(0.15, desc_hits * 0.05)
            reasons.append("Description similaire")

        if score >= 0.30:
            matches.append({
                "alertId":    alert.get("id", ""),
                "alertType":  alert.get("type", ""),
                "location":   alert.get("location", ""),
                "severity":   alert.get("severity", "moyen"),
                "confidence": round(min(score, 0.99) * 100),
                "reasons":    reasons,
                "status":     alert.get("status", "En cours"),
                "date":       alert.get("date", alert.get("created_at", "")),
                "source":     "ai" if alert.get("source_type") == "ai_generated" else "db",
            })

    matches.sort(key=lambda x: -x["confidence"])

    return {
        "incidentId":     incident.id,
        "correlations":   matches[:3],
        "hasCorrelation": len(matches) > 0,
        "analyzed":       len(all_alerts),
    }
