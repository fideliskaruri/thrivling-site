# Thrivling site

A mobile-first landing page for Thrivling. App-generated tree growth frames and ambient life share a Canvas2D landscape. The launch page features native Android captures of Wisteria and the grove, with a Google Play download action.

## Development

```sh
pnpm install
pnpm dev
pnpm build
```

The dev server uses port 5190. The production build targets `/thrivling-site/` on GitHub Pages. `.github/workflows/pages.yml` builds and deploys pushes to `main`. Enable **GitHub Actions** as the repository's Pages source.

## Shared app artwork and animation

The hero and the tree picker preview play the app's own tree picker images: `public/assets/picker/*.webp` and the placements in `src/scene/stages.ts` are copied from Thrivling's `apps/mobile/assets/picker` and `components/window/create/pickerImages.ts` at app commit `290a06f` (rendered by the app's `scripts/render-picker-trees.ts`). Stages crossfade in order on a 2D canvas, the same way the app picker plays them. Regenerate both from the app when its painters change.

`src/tree` is copied from Thrivling's `packages/tree/src` at the same commit. The site uses it for the app's ambient life: falling petals, bees at the blossoms, butterflies, birds and night fireflies are the app's `createAmbient` and `createLife`, drawn on the same canvas through the browser's own 2D context (it satisfies the engine's `Pen`). More life joins as the visitor scrolls into the grove. `appTheme.ts` is copied from the app's `components/window/tokens.ts`.

One fixed canvas draws the whole scene. It pauses when the tab is hidden and draws only on scroll and resize once paused. Reduced motion shows the grown tree with no ambient life. A small inline loader in `index.html` shows until the first tree stage is decoded.

Brand and favicon PNGs are the app assets. `LeafIcon.tsx` preserves the app's exact `LeafCounts.tsx` paths. Urbanist fonts are self-hosted. `GlassSelect.tsx` is a shadcn-style accessible select (listbox pattern) themed as the app's glass.
## Sky

Auto follows the app's local-clock bands: night before 07:00, dawn until 10:00, day until 17:00, dusk until 20:00, then night. It checks every minute and on tab visibility changes. Dawn, Day, Dusk and Night overrides persist locally. Scrolling moves the tree through the landscape but does not override the visitor's time setting.

## Launch presentation

The app section pairs two phone captures, Wisteria first and grove second, with staggered entrance motion. Approved 1440×3120 Samsung captures live in `src/assets/app`; their status and gesture bars are clipped in CSS without changing the source resolution. `src/showcase.css` contains the launch layout refinements. Trees and ground share one world camera; free-flying insects animate independently in a separate canvas. Supporting browsers move the camera using a scroll timeline, with a Canvas2D fallback. The artwork paints at up to 60 FPS and 1.5× pixel density. The official Google Play badge is self-hosted in `public/assets/brand`.

The Pages workflow publishes `main` only. The historical `real-tree` branch is not built or published by this workflow. Download actions use the URL defined in `src/App.tsx`.
