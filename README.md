# Thrivling site

A mobile-first landing page for Thrivling, with the app's procedural tree engine and Skia animation on one CanvasKit canvas. No tree images are used by the scene.

## Development

```sh
pnpm install
pnpm dev
pnpm build
```

The dev server uses port 5190. The production build targets `/thrivling-site/` on GitHub Pages. `.github/workflows/pages.yml` builds and deploys pushes to `main`. Enable **GitHub Actions** as the repository's Pages source.

## Shared app artwork and animation

`src/tree` is copied from Thrivling's `packages/tree/src` at app commit `290a06f`. The only source cleanup is an unused `clamp` import in `fallen.ts`. `appTheme.ts` is copied from the same commit's `components/window/tokens.ts`. Keep this provenance when updating the engine.

The site uses the same procedural skeleton, growth layout, species painters, bone hierarchy, `bendAngle` wind function, and painter ordering as the app's web renderer. `src/scene/SkiaPen.ts` adapts its Pen to CanvasKit 0.41 with explicit WASM resource disposal. Geometry is recorded into SkPictures, not raster images. Tree generation happens at six growth stages, not every animation frame. Soil and grass layers are omitted so the trunk sits on the site's continuous hill.

There is one visible canvas across the page, including the grove. It pauses when the tab is hidden. Pause and reduced motion stop continuous animation callbacks; scroll and resize still redraw. Reduced motion starts with the mature tree. WebGL/CanvasKit loading errors show a retry action rather than silently switching to images. CanvasKit WASM is served from the same GitHub Pages site, with no external CDN dependency.

Brand and favicon PNGs are the app assets. `LeafIcon.tsx` preserves the app's exact `LeafCounts.tsx` paths, including the rotated fallen leaf for Skip. Urbanist fonts are self-hosted.

## Sky

Auto follows the app's local-clock bands: night before 07:00, dawn until 10:00, day until 17:00, dusk until 20:00, then night. It checks every minute and on tab visibility changes. Dawn, Day, Dusk and Night overrides persist locally. Scrolling moves the tree through the landscape but does not override the visitor's time setting.

## Before opening early testing

No real tester invitation URL has been supplied. **Join early testers** currently goes to an honest availability message on this page, not a fake signup endpoint. Replace that destination when the group opens. The page does not claim Google Play availability or accept payments.

Free allowances and Plus launch prices are owner-supplied. Android-only privacy wording must not be generalized to the web app. The Done/Skip controls are an explicitly labeled unsaved demonstration.
