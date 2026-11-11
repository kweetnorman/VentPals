# Nest Connections — product and security implementation notes

This document records the intended VentPals relationship model. It is a product specification, not an implemented authentication service.

## Language
- Use **Nest** and **Nest Guide** consistently.
- Do not use “Village.”
- A child's personal Nest remains theirs; adults provide support without owning the child's relationships.

## Relationship types
1. **Main Guides**: up to two primary adult connections. Each adult has an individual verified adult account. Main Guide status is not inferred from knowing a code.
2. **Nest Guides**: additional trusted adults requested by the child. No fixed numeric cap is imposed in the product model. Use abuse controls, invitation limits/cooldowns, duplicate prevention, pending-request management, and audit logs instead.
3. **Vent Buddies**: peer connections are a separate future feature with stricter age-appropriate safeguards and are not included in the adult invitation flow.

## Child-led addition flow
1. Child asks to add a person and supplies a display name/relationship category. Avoid collecting contact details from the child.
2. The request is visible to the authorized Main Guides for facilitation, but a Main Guide must not silently nominate a different person or override the child's stated choice.
3. An authenticated Main Guide generates a short-lived, one-use invitation token for that specific pending request.
4. The QR code is rendered only in the authenticated Main Guide interface. It contains only an opaque random token, never a child ID, Nest Code, parent code, email, or other personal information.
5. Invitee scans the QR, creates/verifies their own adult account, reviews the requested role and child-facing explanation, and accepts.
6. Child is shown the identity/display name of the adult who accepted and confirms that this is the person they requested. No access to child data until all required authorization, identity, and consent checks pass.
7. Notify the primary parent/Main Guides of the attempt and outcome. Log issuance, scan, verification, approval, denial, expiry, and revocation events.

## Invitation token requirements
- Generate cryptographically random tokens server-side; store only a hash server-side.
- Bind token to one child, one pending request, one intended purpose, and an expiry (10 minutes proposed).
- Single redemption; revoke on cancellation, expiry, account-risk event, or successful use.
- Rate-limit token creation and redemption; prevent enumeration and replay.
- QR code is an invitation mechanism, not an authorization credential by itself.
- Never put the permanent child Nest Code or a Main Guide's Parent Code into the QR.

## Main Guide protections
- Main Guide 1 and Main Guide 2 cannot ordinarily remove the other unilaterally.
- Ordinary removal of either Main Guide requires both verified Main Guides to approve.
- An adult may always withdraw their own access.
- Two-key protection must not block urgent safeguarding action, account compromise response, court/legal obligations, or a child's private safety request. Use a restricted, documented, auditable safeguarding suspension/review path.
- Do not require a child to confront an adult or obtain permission from the adult they are asking to remove.

## Nest Guide removal
- Child can privately request removal of an additional Nest Guide.
- The request is processed by a trusted, safeguarded workflow; the adult being removed cannot approve or veto their own removal.
- Adult can independently withdraw their access.
- Notify affected parties only in a way that does not expose a child to retaliation or disclose a confidential safety report.
- Maintain audit history without preserving unnecessary private content.

## Sessions
- Desired child inactivity timeout: five minutes.
- Browser timer is defense-in-depth only. Production enforcement must be server-side with revocable sessions, secure cookies, expiry/idle timestamps, and refresh rules. Do not treat localStorage as authentication.
- Save drafts safely before expiry where feasible; do not extend a session simply because a page is open.

## Production prerequisites
The current repository is a static HTML/JavaScript development preview using localStorage. It has no Firebase Auth, backend API, Firestore rules, or server-side invitation service. Therefore the QR and relationship flows must not be represented as real or secure until the backend, adult identity verification, parental-consent/legal-authority model, data access rules, audit logging, abuse controls, and child-safety review are implemented and tested.

## Main Guide interface preview
- `main-guide-connections.html` is a front-end design preview linked from the grown-up sign-in placeholder.
- It displays fictional Main Guide identities, child-originated add requests from the same browser's local preview storage, and an invitation preparation state.
- The QR area is intentionally a nonfunctional placeholder. No QR image, invitation token, adult identity check, parent notification, or access grant is produced by this static page.
- A Main Guide may prepare an invitation only for a request initiated by the child. The real service must enforce this relationship server-side, not trust the browser's localStorage.
- Production invitation sequence: child request → authenticated Main Guide issues scoped one-use QR → invitee verifies identity and accepts → child confirms the invited adult → authorization and policy checks → connection becomes active → Main Guides receive the appropriate security event.
