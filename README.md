# VentPals

**VentPals** is a safe, supportive web app for kids to explore big feelings, grow with a personal bird companion, and build emotional skills — with a gentle grown-up portal for families.

## 🐦 Overview

- **16 VentPal birds** — each representing a different emotional style (Aura, Breezy, Clover, Cove, Drift, Echo, Flamez, Flare, Flicker, Guardian, Lumen, Nova, Pebble, Sable, Solace, Twig)
- **VentPals World** — 6 emotional zones (Nesting Tree, Feelings Forest, Quiet Caves, Firefly Meadow, Sky Bridge, Sparkle Stream)
- **Calming skills** — Deep Breathing, Butterfly Hug, 5 Senses Grounding, Sip of Water
- **Reflections & Nests** — per-bird journaling and growth tracking
- **Parent portal** — grown-up account linked via child's VP-XXXXXX parent code
- **Onboarding flow** — 6-step setup: Welcome → Bird → Name → Avatar → Privacy → Parent Code

## 📁 Structure

```
/                          ← Public marketing pages (index.html, about.html, how-it-works.html, …)
/onboarding/               ← 6-step child onboarding wizard
/world/                    ← Redirect shim for world page
/assets/images/            ← Bird artwork (baby/nestling/feathered/percher stages) + UI assets
/assets/js/                ← firebase-config.js, chat.js
/data/                     ← flock.json (bird catalogue)
```

## 🔑 Key Pages

| Page | Description |
|------|-------------|
| `index.html` | Public landing page |
| `signup.html` / `login.html` | Child auth |
| `adult-signup.html` / `adult-login.html` | Parent auth |
| `onboarding/onboarding.html` | Child onboarding wizard |
| `dashboard.html` | Child home dashboard |
| `circles-dashboard.html` | Nests hub (all 16 birds) |
| `{birdId}-nest.html` | Individual bird nest (×16) |
| `world.html` | VentPals World zones |
| `notifications.html` | Parent notifications |
| `calming-skills.html` | Calming skills hub |

## 🔐 Auth Model

The app uses **localStorage** for demo authentication:

- **Child session:** `ventpals_logged_in`, `ventpals_user` (username, birdId, parentCode, stage…)
- **Parent session:** `ventpals_parent_logged_in`, `ventpals_parent_email`, `ventpals_parents[]`
- **Onboarding flag:** `ventpals_onboarding_complete`

> ⚠️ The localStorage auth is intentionally simple for demo/prototype purposes. Production deployment should use Firebase Auth (already configured in `assets/js/firebase-config.js`).

## 🚀 Running Locally

```bash
git clone https://github.com/kweetnorman/VentPals.git
cd VentPals
open index.html   # or serve with any static file server
```

No build step required — the site is plain HTML/CSS/JS with Tailwind CSS loaded via CDN.

## 📱 Mobile App (iOS & Android)

A [Capacitor](https://capacitorjs.com/)-based mobile app lives in the `mobile/` directory.  
It bundles the existing web assets offline and adds native features (haptics, share sheet, local notifications, deep links).

```bash
cd mobile
npm install
npm run cap:sync   # generates ios/ and android/ projects
```

See **[mobile/README.md](mobile/README.md)** for full build and release instructions.

App identifiers: `com.ventpals.app` • Display name: **VentPals**

## 🌐 Live Site

[ventpals.com](https://www.ventpals.com)
