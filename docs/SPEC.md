# Thrivling landing page spec

> Historical first-pass brief. The owner's subsequent full-scene redesign supersedes the boxed hero, WebP animation, automatic looping sky, placeholder external CTA, and wireframes below. The implemented contract and source provenance are in `README.md`: actual procedural Skia/CanvasKit, one shared canvas, local-clock sky with a persistent manual override, app icon/leaf glyphs, responsive glass content, and an honest on-page tester availability notice. Retain the claims table below as background evidence, not as authorization to add claims.

## Surface and mode

A public marketing site for Thrivling, an Android habit and quitting app. Mode: **Persuade**. The first release is not on Google Play; the conversion is joining the closed early-tester group.

## Audience

Two equally welcome mindsets, not two products: people building a ritual they want to keep, and people quietly outgrowing a vice. Both want compassionate daily progress. The second group has a heightened need for discretion because someone else may glance at their phone. Builders need to see that this is a useful habit companion, not a shame-driven streak counter.

## Single message hierarchy

1. **Progress that feels alive.** A tree is the visible, memorable proof of progress.
2. **Grow what nourishes you. Outgrow what doesn't.** Building and quitting are the same act of care.
3. Done marks a day that supported your goal. Skip neutrally records a day that went differently. A Skip leaves a mark on the branches without erasing the tree or its history.
4. A calm grove and codenames let two different goals coexist without telling an onlooker which is which.
5. The product is private on Android: its settings say trees and notes are encrypted and stay on this phone. Be precise about platform scope.
6. Join the early tester group. Do not imply that the Play Store build is available.

## Visitor path

A first-time visitor recognizes their own goal in the two mindsets, understands the tree as a living record rather than a score, believes a difficult day will not erase their progress, sees that private goals can sit beside ordinary ones under codenames, then follows the closed-test CTA. The visual proof is an animated, real Thrivling tree, a live Done/Skip interaction that preserves the tree, and adjacent trees named Sun Sprout and Iron Bark.

## Sections and their one job

| Order | Section | One job |
|---|---|---|
| 1 | Glass navigation | Identify Thrivling and keep the tester action in reach. |
| 2 | Living-window hero | Make the offer, the tree-growth mechanism, and the tester CTA immediately clear. |
| 3 | Two trees, one grove | Show Sun Sprout beside Iron Bark and make their private meanings indistinguishable to an onlooker. |
| 4 | Done or Skip | Let the visitor act and see that Skip records a different kind of day without deleting the living tree. |
| 5 | A protected garden | Explain codenames and Android on-device encryption with evidence-backed language. |
| 6 | Launch pricing | Show the owner-provided Free and Plus launch prices without implying in-app purchases are live. |
| 7 | Tester invitation | Repeat the one conversion action and expose the placeholder destination for replacement. |

## Claims table

| Claim or copy | Status | Evidence and implementation decision |
|---|---|---|
| Trees and notes are encrypted and stay on this phone | **Verified for Android; scoped** | `apps/mobile/components/window/screens/SettingsScreen.tsx:150` states this directly. `apps/mobile/src/db.ts:211-248` opens phone databases through SQLCipher and stores a random key in Expo SecureStore, which uses the Android Keystore on Android. Website wording must say Android and must not imply the web preview database is encrypted; web uses plain SQLite in `db.ts:248`. |
| Nothing is sent anywhere | **Verified as the app's own statement; limited** | Same Settings sentence at `SettingsScreen.tsx:150`. Keep within the Android app context; do not make a blanket claim about the website or third-party tester signup. |
| Goals use codenames so only the user knows what they are | **Verified** | Settings copy at `SettingsScreen.tsx:215`; product definition at `PRODUCT.md:10`. Use Sun Sprout and Iron Bark as illustrative codenames, not real user data. |
| A Skip marks a day without erasing the tree or its history | **Verified in product definition** | App `PRODUCT.md:2,50` says skips show on the tree without erasing it and a fallen tree stays in the grove. Use neutral language for Skip. Do not frame either choice as a failure. |
| Free includes 2–3 active trees, core species, full privacy, stored on your phone | **Owner-supplied launch pricing; not verified as purchase enforcement** | This offer is supplied in the owner brief. Show as **Launch pricing**, with up to 3 active trees, core species, and the evidence-backed Android privacy promise. Do not state that checkout or entitlements are already live. |
| Plus: $1.99/month, $14.99/year, $29.99 lifetime | **Owner-supplied launch pricing; not verified as purchase enforcement** | Supplied in the owner brief. Label it Launch pricing and avoid implying purchases can currently be made. Preserve the lifetime tagline supplied by the owner. |
| App is available on Google Play | **Removed** | Explicitly false for this launch: use a closed-test CTA and no Play badge or install link. |
| Offline operation, no account, an exact species count, any encryption claim beyond Android, or unsupported Plus benefits | **Removed / not stated** | Not needed for the story and not evidenced sufficiently in the reviewed source. Do not infer these from local database code or the product plan. |
| Closed-test signup endpoint | **Placeholder** | Use `https://example.com/replace-with-closed-test-link` as a visibly identified replacement token in code and CTA note. Owner must replace it with the real tester-group URL before publishing. |

## Visual and interaction contract

The page is a window onto a small world, not a device mockup or a generic SaaS shell. Reuse the app's Urbanist font files, its four sky phases and exact token values from `apps/mobile/components/window/tokens.ts`, its 24 px glass panels, 16 px inner tiles, pill buttons, soft hill silhouettes, and actual transparent picker-tree WebPs. Keep glass over the sky rather than stacking glass-on-glass. Hero is a real acacia tree growing through its supplied WebP stages while the sky follows dawn, day, dusk, and night. A restrained sway and low-frequency fireflies give the grove life. Done advances its stage; Skip records a day that went differently while preserving the tree. Do not feature water or rain as an action metaphor. Reduced motion renders a still, fully grown tree and a stable day sky. Only transforms and opacity animate continuously; pause decorative motion when offscreen or hidden.

## Accessibility and performance

Semantic landmarks and one h1; AA contrast for normal and large text; visible keyboard focus; every touch target at least 44 px. Tree imagery has concise alt text, decorative wildlife is hidden from assistive technology, and the Done/Skip controls announce their outcome. Honor `prefers-reduced-motion` without hiding content. Load only selected tree stages, use responsive WebP dimensions and lazy-load below-fold imagery. Avoid layout animation and continuous canvas work; keep the page useful with JavaScript disabled and before the tree animation completes.

## CTA

Primary label: **Join the early tester group**. Target: `https://example.com/replace-with-closed-test-link`. This is a clearly marked placeholder, not a real signup. Repeat it in the final invitation. Do not use a Google Play install CTA.

## Mobile-first design and verification

Design phone-first. Inspect 360, 375, 390, and 412 px widths before scaling up. Verify no horizontal scroll, 44 px minimum targets, readable copy, and a short 360 x 640 viewport. Then inspect 768, 1024, and 1440 px. Check tree-stage progression and reduced-motion behavior at phone sizes.

## Mobile wireframe, 375 px

```text
┌───────────────────────────────┐
│ glass nav: Thrivling   [Join] │
├───────────────────────────────┤
│ Progress that                 │
│ feels alive.                  │
│ Whether you’re growing a daily│
│ ritual or quietly outgrowing a │
│ vice, Thrivling turns your days│
│ into a living companion.      │
│ [Join the early tester group] │
│                               │
│      dawn sky, real tree      │
│       growing on a hill       │
│   [Sun Sprout] [Iron Bark]    │
│                               │
├───────────────────────────────┤
│ Grow what nourishes you.      │
│ Outgrow what doesn't.         │
│ Two real tree scenes, codenames│
├───────────────────────────────┤
│ [live tree] [Done]  [Skip]    │
│ Skip leaves the tree and its history │
├───────────────────────────────┤
│ Codenames + on-phone privacy  │
│ glass window / encrypted tree │
├───────────────────────────────┤
│ Launch pricing: Free | Plus   │
│ $1.99/mo · $14.99/yr · $29.99│
│ lifetime                      │
├───────────────────────────────┤
│ Join the early tester group   │
│ [CTA]                         │
└───────────────────────────────┘
```

## Desktop wireframe, 1440 px

```text
┌────────────────────────────────────────────────────────────────────────┐
│ glass nav: Thrivling      How it grows   Privacy   Launch pricing [Join]│
├────────────────────────────────────────────────────────────────────────┤
│ copy, 48% wide                         │ full living window, 52% wide  │
│ Progress that feels alive.             │ dawn-to-night sky              │
│ exact owner subhead                    │ real tree stages on layered hills│
│ unified cultivation line              │ glass labels: Sun Sprout / Iron Bark│
│ [Join the early tester group]          │ subtle wildlife                 │
├────────────────────────────────────────────────────────────────────────┤
│ Grow what nourishes you. Outgrow what doesn't.                         │
│ Sun Sprout tree scene      │ private codename seam │ Iron Bark tree scene│
├────────────────────────────────────────────────────────────────────────┤
│ Done/Skip interaction and its outcome  │ protected-garden explanation  │
├────────────────────────────────────────────────────────────────────────┤
│ Launch pricing: calm editorial price comparison, not a feature-card grid│
├────────────────────────────────────────────────────────────────────────┤
│ Final glass-window invitation, single CTA, replacement endpoint clearly noted│
└────────────────────────────────────────────────────────────────────────┘
```
