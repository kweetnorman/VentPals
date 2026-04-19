# VentPals — App Store Review Notes

This document contains reviewer credentials and instructions for Apple App Review and Google Play review teams.

---

## App overview

**App name:** VentPals  
**Bundle ID:** com.ventpals.app  
**Category:** Health & Fitness / Family  
**Target audience:** Children (ages 6–12) with parent/guardian involvement  
**Positioning:** Family-guided emotional wellness — NOT Kids Category; adults are co-users

VentPals is an emotional wellness app that helps children explore feelings, develop calming skills, and grow with a personalised bird companion. Trusted grown-ups link to a child's account via a connection code to stay connected to their child's emotional journey.

---

## Demo accounts

### Child account

| Field | Value |
|-------|-------|
| Username | `demo_child` |
| 4-digit PIN | `1234` |

### Parent/guardian account

| Field | Value |
|-------|-------|
| Email | `reviewer@ventpals.com` |
| Password | `ReviewDemo2026!` |

> **Note:** These demo accounts are pre-seeded with sample data (bird companion "Breezy", onboarding complete, parent code `VP-DEMO01`).

---

## How to test the app

### First launch / new child account

1. Open the app.
2. Tap **"I'm a child"** on the App Switcher screen.
3. Tap **"Sign Up"** and follow the 6-step onboarding wizard:
   - Choose a bird companion.
   - Enter a display name.
   - Choose an avatar.
   - Read the privacy overview.
   - Get a connection code.
4. Set a 4-digit PIN when prompted.
5. You will land on the **Dashboard**.

### Returning child — using demo account

1. Open the app.
2. Tap **"I'm a child"**.
3. Tap **"Log In"**.
4. Enter username: `demo_child` and PIN: `1234`.
5. The app will resume where the demo account left off.

### Parent/guardian account

1. From the main screen, tap **"I'm a grown-up"**.
2. Tap **"Log In"**.
3. Enter email `reviewer@ventpals.com` and password `ReviewDemo2026!`.
4. The parent dashboard will show the linked child account.

### Native features to test

| Feature | How to access |
|---------|---------------|
| **Haptics** | Log in with the correct PIN — feel a success vibration. Enter wrong PIN — feel an error vibration. |
| **Native share (Invite Parent)** | Log in as child → Settings → "Invite Grown-Up" → system share sheet appears |
| **Daily reminder toggle** | Settings → "Daily Check-In Reminder" → toggle on → system notification permission prompt appears |
| **Offline banner** | Turn on airplane mode → reopen app → purple offline banner appears at top |
| **Deep links** | Open `ventpals://dashboard` in Safari/Chrome → app opens to Dashboard |

---

## Deep link scheme

The app registers the `ventpals://` custom URL scheme. Supported routes:

| URL | Destination |
|-----|-------------|
| `ventpals://` | Home / index |
| `ventpals://login` | Login screen |
| `ventpals://onboarding` | Onboarding wizard |
| `ventpals://dashboard` | Child dashboard |
| `ventpals://settings` | Settings screen |
| `ventpals://nest` | Nests hub |
| `ventpals://world` | VentPals World |
| `ventpals://calming` | Calming skills |
| `ventpals://feelings` | Start with a feeling |

---

## Notes for reviewers

- **Not a crisis service:** VentPals explicitly states it is not a crisis service. Emergency resources are listed in Settings and Support.
- **No ads:** The app contains no advertising.
- **No in-app purchases:** There are no purchases in v1.
- **External links:** Privacy Policy and Support links open in an in-app browser, not a raw web redirect.
- **Child safety:** Children cannot exit to external sites without a parental prompt. The "Invite Parent" share feature uses the system share sheet and always shows a preview before sending.
- **Offline support:** Core calming tools and navigation work without network connectivity. The app shows a friendly offline banner rather than a blank screen.
- **Data:** All auth data in v1 is stored in device localStorage for demo purposes. No child identifiable data is transmitted to a server in this build.

---

## Support contact for review team

**Email:** [support@ventpals.com](mailto:support@ventpals.com)  
**Response time:** within 24 hours during review period
