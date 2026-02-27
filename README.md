# AquaPulse

**Jumeau Numerique Intelligent pour une Gestion Resiliente de l'Eau**

AquaPulse est une plateforme SaaS de jumeau numerique dediee a la supervision intelligente des reseaux d'eau. Elle combine diagnostic IA, maintenance predictive, surveillance en temps reel et gouvernance citoyenne dans une interface moderne et unifiee.

---

## Stack Technique

| Technologie | Version
|-----|-----
| Next.js (App Router) | 16.1
| React | 19.2
| TypeScript | 5.7
| Tailwind CSS | 4.2
| shadcn/ui | derniere
| Recharts | 2.15
| Lucide Icons | 0.564


---

## Structure du Projet

```plaintext
app/
  page.tsx                      # Landing page publique
  layout.tsx                    # Layout racine (FR, Inter font)
  citoyen/                      # Interface Citoyen
    page.tsx                    #   Dashboard citoyen
    qualite/page.tsx            #   Suivi qualite de l'eau
    signaler/page.tsx           #   Signalement d'anomalie
    reseau/page.tsx             #   Etat du reseau
    carte/page.tsx              #   Carte interactive (jumeau numerique)
  operateur/                    # Interface Operateur / Technique
    page.tsx                    #   Dashboard operateur (KPIs, alertes, graphes)
    alertes/page.tsx            #   Gestion des alertes & anomalies
    maintenance/page.tsx        #   Maintenance predictive
    capteurs/page.tsx           #   Monitoring des capteurs IoT
    carte/page.tsx              #   Carte jumeau numerique
    simulateur/page.tsx         #   Simulateur de stress hydrique
  admin/                        # Panel Administrateur
    page.tsx                    #   Vue systeme globale
    utilisateurs/page.tsx       #   Gestion des utilisateurs
    capteurs/page.tsx           #   Gestion des capteurs IoT
    simulations/page.tsx        #   Scenarios de simulation
    parametres/page.tsx         #   Parametres systeme

components/
  aquapulse-logo.tsx            # Logo SVG AquaPulse
  dashboard-layout.tsx          # Layout global dashboard (sidebar + header + contenu)
  dashboard-sidebar.tsx         # Sidebar navigation par role
  dashboard-header.tsx          # Header avec recherche, notifications, profil
  digital-twin-map.tsx          # Composant carte du jumeau numerique
  kpi-card.tsx                  # Carte KPI reutilisable
  status-badge.tsx              # Badge d'etat (Normal / Alerte / Critique)
  landing/
    navbar.tsx                  # Barre de navigation landing
    hero-section.tsx            # Section hero
    features-section.tsx        # Section fonctionnalites
    how-it-works-section.tsx    # Section "Comment ca marche"
    cta-section.tsx             # Call-to-action
    footer.tsx                  # Pied de page
  ui/                           # Composants shadcn/ui
```

---

## Roles Utilisateurs

| Role | Route | Description
|-----|-----
| **Citoyen** | `/citoyen` | Consultation de la qualite de l'eau, etat du reseau, signalement d'anomalies, carte interactive
| **Operateur** | `/operateur` | Dashboard technique avec KPIs, alertes temps reel, maintenance predictive, capteurs IoT, simulateur
| **Administrateur** | `/admin` | Gestion systeme, utilisateurs, capteurs, simulations, parametres


---

## Fonctionnalites Cles

- **Landing page** marketing moderne avec hero futuriste, sections fonctionnalites et CTA
- **Dashboard Citoyen** : indicateurs qualite eau (pH, turbidite, contamination), etat reseau, formulaire de signalement
- **Dashboard Operateur** : KPIs (fuites, alertes, sante reseau), graphiques Recharts, tableau d'alertes avec severite, monitoring capteurs, simulateur de stress hydrique
- **Panel Admin** : gestion utilisateurs (CRUD), gestion capteurs IoT, scenarios de simulation, parametres systeme
- **Jumeau Numerique** : carte interactive SVG avec noeuds/capteurs, etats colores, panneau de details, simulation de flux


---

## Installation

```shellscript
npx shadcn@latest init
```

Ou cloner et installer manuellement :

```shellscript
git clone <repo-url>
cd aquapulse
pnpm install
pnpm dev
```

L'application sera accessible sur `http://localhost:3000`.

---

## Routes Principales

| URL | Page
|-----|-----
| `/` | Landing page
| `/citoyen` | Dashboard citoyen
| `/citoyen/qualite` | Qualite de l'eau
| `/citoyen/signaler` | Signaler un probleme
| `/citoyen/reseau` | Etat du reseau
| `/citoyen/carte` | Carte jumeau numerique
| `/operateur` | Dashboard operateur
| `/operateur/alertes` | Alertes & anomalies
| `/operateur/maintenance` | Maintenance predictive
| `/operateur/capteurs` | Monitoring capteurs
| `/operateur/carte` | Carte jumeau numerique
| `/operateur/simulateur` | Simulateur stress hydrique
| `/admin` | Dashboard admin
| `/admin/utilisateurs` | Gestion utilisateurs
| `/admin/capteurs` | Gestion capteurs IoT
| `/admin/simulations` | Scenarios de simulation
| `/admin/parametres` | Parametres systeme


---

## Design

- Palette : bleu profond, cyan, blanc, accents sombres
- Typographie : Inter (sans-serif)
- Style : SaaS premium, minimaliste, futuriste
- Mode : clair (light mode) par defaut, dark mode supporte
- Composants : shadcn/ui + composants custom (KPI cards, status badges, digital twin map)


---

## Licence

Projet prive - Tous droits reserves.
