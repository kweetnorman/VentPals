# VentPals

**VentPals** is a child-centered emotional-literacy experience where children explore feelings, express themselves, and practice skills with a bird companion they choose. The current app is a development preview; secure accounts and live adult connections are not active.

## 🐦 Overview

- **16 VentPal birds** — each with a distinct personality and story. Children choose a companion that stays theirs through every feeling.
- **VentPals World** — 6 emotional zones (Nesting Tree, Feelings Forest, Quiet Caves, Firefly Meadow, Sky Bridge, Rainbow Stream)
- **Calming skills** — Deep Breathing, Butterfly Hug, 5 Senses Grounding, Sip of Water
- **Reflections & Nests** — one personal Nest per child. The current preview stores demo reflections and progress in local browser storage; it is not a secure private account.
- **Grown-up experience** — design preview only; verified adult-child connections are not active.
- **Onboarding flow** — child setup: Welcome → VentPal → Name → Avatar → Privacy → My Nest. Adult connections are not part of child onboarding.

## 📁 Structure

```
/                          ← Public marketing pages (index.html, about.html, how-it-works.html, …)
/onboarding/               ← 6-step child onboarding wizard
/world/                    ← Redirect shim for world page
/assets/images/            ← Bird artwork (baby/nestling/feathered/percher stages) + UI assets
/assets/js/                ← shared character roster, app scripts, and Firebase config
/assets/js/flock-data.js   ← canonical 16-character flock catalogue
```

## 🔑 Key Pages

| Page | Description |
|------|-------------|
| `index.html` | Public landing page |
| `welcome.html` | Combined child sign-in / demo setup |
| `adult-signup.html` / `adult-login.html` | Grown-up access preview (registration disabled) |
| `main-guide-connections.html` | Main Guide invitation and security workflow preview |
| `accept-nest-invitation.html` | Invited adult review, identity-verification handoff, and acceptance preview |
| `confirm-nest-guide.html` | Child's final yes/no confirmation for an invited Nest Guide |
| `onboarding/onboarding.html` | Child onboarding wizard |
| `nest.html` | Child home base: personal bird, growth, feeding, reflection, and app navigation |
| `nest-connections.html` | Child-led Nest Guide request and removal experience preview |
| `dashboard.html` | Legacy route that redirects to the personal Nest |
| `circles-dashboard.html` | Legacy route that redirects to the personal Nest |
| `{birdId}-nest.html` | Legacy routes that redirect to the child's personal Nest |
| `meet-the-flock.html` | Flockopedia: discover all 16 birds |
| `world.html` | VentPals World zones |
| `notifications.html` | Legacy route to the grown-up notifications placeholder (adult access is not active yet) |
| `calming-skills.html` | Calming skills hub |

## 🔐 Auth Model

The app currently uses **localStorage** for development-only demo entry (not production authentication):

- **Child session:** `ventpals_logged_in`, `ventpals_user` (nickname, username, birdId, parentCode, stage…)
- **Development fixtures:** `ventpals_demo_profiles` and `ventpals_development_mode` (fictional local profiles only)
- **Adult accounts:** disabled during development; no adult credentials or child connections are created
- **Onboarding flag:** `ventpals_onboarding_complete`

The child preview stores one fictional demo profile in this browser so we can test the experience. It is not a real account. The five-minute idle timeout is a browser-side preview safeguard only; production must enforce session expiry server-side. Nest Connections demonstrates child-led add/removal requests locally. The Main Guide preview also demonstrates child add/removal request queues, a Nest Guide roster placeholder with no hard cap, invitation lifecycle states, an adult acceptance handoff, child confirmation, activity history, two-key approval, self-withdrawal, and an urgent safeguarding hold. All of these are local design demonstrations only; no secure invitation, adult verification, notification, access grant, or relationship change is created. Adult registration, verified connections, PIN reset, multi-child data isolation, and secure persistence are intentionally deferred until the final implementation phase. Do not enter real personal details, passwords, or shipping addresses.

## 🚀 Running Locally

```bash
git clone https://github.com/kweetnorman/VentPals.git
cd VentPals
python -m http.server 8000   # then open http://localhost:8000 (recommended for shared data files)
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

[app.ventpals.org](https://app.ventpals.org)

<!-- redeploy -->
