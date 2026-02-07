# Roast Board

A private, opt-in roast board for tracking who is the absolute worst at plans.

No planning.
No calendars.
No reminders.
Just vibes, memory, and group consensus.

This is a comedy product, not a court of law.

---

## Core Concept

Roast Board is a **friends-only scoreboard** where group members log and roast incidents of flaking, ghosting, being late, or general unreliability.

Everything is:
- Private
- Opt-in
- Group-scoped
- Framed humorously (“allegedly”, “according to sources”)

There are no integrations with messaging apps, calendars, or external platforms.

---

## Core Objects

### User
- Authenticated user
- Can belong to multiple groups
- Has stats per group (not global)

### Group
- Invite-only
- Name + emoji
- Members explicitly opt in
- Leaving a group freezes your stats permanently

### Incident
The atomic unit of the product.

An incident represents a single roast-worthy event.

Fields:
- Target (who flaked)
- Created by (accuser or self)
- Type:
  - ❌ Last-minute cancel
  - 👻 Ghosted
  - 🕰️ Late AF
  - 🤡 “Maybe” merchant
  - 🧢 Weak excuse
- Severity:
  - Mild
  - Bad
  - Criminal
- Date
- Optional note (short, capped, humorous)
- Status (see below)

---

## Incident Lifecycle

### Statuses
- `PENDING` – awaiting action
- `ACCEPTED` – target accepted responsibility (scores immediately)
- `CONFIRMED` – accepted by group quorum (scores)
- `DISPUTED` – denied, awaiting votes
- `REJECTED` – denied and failed confirmation
- `EXPIRED` – timed out without resolution

---

## Self-Reporting Flow

Self-reporting is encouraged and celebrated.

1. User creates an incident targeting themselves
2. Incident enters `PENDING`
3. User must explicitly **Accept**
4. Upon acceptance:
   - Status → `ACCEPTED`
   - Incident scores immediately
   - Labeled as **“Self-owned”**

If not accepted within 48 hours → `EXPIRED` (no score)

---

## Accusation Flow

1. User creates incident about another member
2. Incident enters `PENDING`
3. Target can:
   - **Accept** → instant score (`ACCEPTED`)
   - **Deny** → status becomes `DISPUTED`
4. Disputed incidents go to group confirmation:
   - Requires quorum (default: 2 confirmations)
   - Accuser and target cannot confirm
5. If quorum reached:
   - Status → `CONFIRMED`
   - Incident scores
6. If quorum not reached in 7 days:
   - Status → `EXPIRED`

---

## Voting & Confirmation

- Only group members can vote
- One vote per user per incident
- Votes are for confirmation, not severity
- Severity can be adjusted by majority vote before confirmation

---

## Scoring System

### Weights
- Mild: 1 point
- Bad: 2 points
- Criminal: 3 points

### When points apply
- On `ACCEPTED`
- On `CONFIRMED`

### Score Windows
- Rolling 30 days (current menace)
- Rolling 90 days (season stats)
- Career stats (displayed but de-emphasized)

Incidents decay out of active scoring after 90 days.

---

## Stats Per Member (Per Group)

- Menace Points (30 / 90 days)
- Most common offense
- Flake streak (consecutive incidents)
- Clean streak (days without incidents)
- Self-report rate
- Acceptance rate

No single global “you suck” number.

---

## Roast Feed (Primary UI)

The feed is the product.

Each incident card shows:
- Offense + severity
- “Allegedly” framing
- Status badge (Self-owned, Admitted, Contested)
- Emoji reactions (😂 😭 💀 🤝)

Reactions have no scoring impact.

---

## Tone & Copy Rules

Non-negotiable:
- Always framed as opinion or group consensus
- No absolute or moral language
- No “accountability”, “trust”, or “character” language

Examples:
- “According to the group…”
- “Sources say…”
- “Allegedly cancelled 47 minutes before”

---

## Guardrails & Safety

- Private groups only
- No public profiles or search
- No uploads, screenshots, or links
- Rate limiting on accusations
- Incidents auto-expire
- Easy mute/block within group

This product is a mirror, not a verdict.

---

## Non-Goals

- No planning or scheduling
- No messaging
- No external integrations
- No monetization
- No public sharing or virality

---

## Tech Assumptions (Suggested)

- Frontend: Next.js + Tailwind
- Auth + DB: Supabase (Postgres)
- Hosting: Vercel

Tech choices are intentionally boring.

---

## Philosophy

Roast Board exists because friends already do this in group chats.

This just keeps score.