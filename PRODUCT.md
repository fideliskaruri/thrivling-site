# Thrivling

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People on Android who want to build a daily ritual or quietly outgrow a vice. For people quitting a vice, a glance at their phone should not reveal what they are working on.

## Product Purpose

Thrivling turns each goal into a growing tree. Each day can be marked Done or Skip; either way, the tree keeps its history. A grove becomes a living record of attempts.

## Positioning

Building a habit and quitting a vice are the same act of cultivation. The same tree responds to care and weather; codenames let unlike goals coexist privately.

## Operating Context

The product is an Android habit app. The requested site promotes a closed tester group before Google Play availability. No live tester endpoint was provided.

## Capabilities and Constraints

Confirmed in the Android source: goal codenames, paired daily outcomes, a tree that preserves its history after a skip, an on-device encrypted database, optional app PIN, and optional biometric unlock. The current app source still uses older action labels; this site follows the owner's newer Done/Skip wording. The database opens as plain SQLite on web, so Android privacy guarantees must not be generalized to the web preview. Entitlement purchase enforcement is not confirmed. Exact active-tree quota and included species are owner-supplied launch-pricing details, not verified in app code. Exact species count, offline support, account requirements, and Android distribution details remain unclaimed unless separately verified.

## Brand Commitments

The name Thrivling. The owner pins the app's glass-window, living-tree aesthetic and Urbanist typography. Calm, warm, private; consequence without shame. Use the owner's headline and subhead verbatim. Done marks a day that supports your goal. Skip neutrally records a day that went differently. Avoid em dashes in UI copy.

## Evidence on Hand

- Current site: procedural Skia/CanvasKit rendering from the app engine, app brand PNGs and leaf SVG paths, and the app's local-clock phase boundaries. See `README.md` for source provenance and deployment details. Picker images below describe the superseded first pass.

- Read-only Android app source: `D:\code\thrivling-worktrees\launch\apps\mobile\components\window\tokens.ts`, `theme.tsx`, `HillScene.tsx`, `Glass.tsx`, `LifeLayer.tsx`.
- Real transparent picker tree stages: `D:\code\thrivling-worktrees\launch\apps\mobile\assets\picker\`.
- App copy and data security: `apps/mobile/components/window/screens/SettingsScreen.tsx`, `apps/mobile/src/db.ts`.
- No real closed-test invitation link or public app listing was supplied.

## Product Principles

- Grow goals, do not score people.
- Let a skipped day be recorded without judgment.
- Keep private goals private at a glance.
- Preserve the tree and its history through a setback.
- Never invent proof, launch availability, or capabilities.

## Accessibility & Inclusion

The website must meet WCAG AA text contrast, provide keyboard focus, 44 px controls, reduced-motion behavior, and meaningful alternative text. Do not equate quitting with shame or disclose a sensitive goal in promotional examples.

## Assumptions

No structured answer channel was available during this implementation. The audience, app behavior, launch scope, and brand commitments above are inferred only from the owner's explicit brief and the read-only app repository. Verify the closed-test destination and launch-price enforcement before public release.
