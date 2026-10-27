# Landing page spec v3 (owner feedback, 2026-10-27 15:27)

Feedback updates this spec; the build follows it. Two variants ship from the same source:
- **main (images):** the app picker images, improved.
- **real-tree branch:** the same page, but the tree is the app's real vector tree wherever that performs (live rig sway, live growth where feasible), images only where vectors can't keep up.

## Owner feedback, as requirements
1. **No image tells.** The image tree must not shear or "sway" (it looks like a manipulated picture). Main: no sway on images. Real-tree: sway comes from the app's rig (`bendAngle` per bone), never a whole-image transform.
2. **Smoother, longer growth.** Growth is currently jittery (32 frames in 2.4 s). Render many more frames (target 120+ for the hero species, evenly spaced in tree age) and play over about 6 s, eased, so there is no visible stepping. Because a loader already covers the wait, the growth itself is the show: it starts when the loader leaves.
3. **Detailed critters.** Bees, butterflies, ladybirds, beetles, dragonflies, birds and fireflies are drawn with far more detail (body segments, wing venation and translucency, legs, antennae, subtle shading, wing beat), at the larger scale the hero needs. Same engine API (`createLife`/`createAmbient`), so it can be ported back to the app.
4. **Detailed ground like the app grove.** Replace the plain CSS hills with a painted grove ground: layered hills, grass blades and tufts, flowers, pebbles, soft shadow under each tree, using the app's landscape/envkit painters and palette, matching the sky phase.
5. **Bigger hero tree.** Larger on every size; the trunk sits on the painted ground.
6. **Remove the Done/Skip demo** in "Every kind of day belongs"; rewrite that section in plain, better wording (no demo controls).
7. **Picker: bigger, click and swipe only.** Swipe left/right on touch must change species. No scroll-driven species change and no pinning. A large picker card with arrows, swipe, dots and keyboard; copy says how many trees the app has ("33 trees to grow").
8. **Less glass, and readable.** Owner: "the glass thing is excessive". Use glass only for the nav, the picker card and the hero control pill; story sections become plain text on the sky (with a soft local scrim behind the text block if needed for contrast), not stacked glass cards. Where glass stays: Glass panels must keep text at WCAG AA (4.5:1 body, 3:1 large) against any background behind them, in every sky phase. Raise tint/opacity and blur; verify with measured contrast on real screenshots.
9. **New app icon.** Use the combined wisteria icon from the Graphics session (owner-chosen) for the brand mark and favicon.
10. **Accessibility pass.** Focus order, labels, contrast, reduced motion, 44 px targets, no motion that can't be paused.

## Acceptance checks
- 390x844 and 1440x900: hero tree height ≥ 60% of viewport height; no horizontal overflow; text contrast ≥ 4.5:1 on all glass in dawn/day/dusk/night.
- Growth recorded at 60 fps shows no frame-to-frame jump larger than one stage; total ≥ 5 s.
- Critter close-up screenshot shows legs, antennae and wing detail for bee and butterfly.
- Picker: species change only on user input; arrows, swipe, dots, ←/→ keys all work.

11. **Responsive across many sizes.** Verified with screenshots and overflow checks at 320x568, 360x740, 375x667, 390x844, 412x915, 430x932, 600x960 (small tablet), 768x1024, 820x1180, 1024x768 (landscape tablet), 1280x720, 1440x900, 1920x1080, 2560x1440, plus phone landscape 844x390. No horizontal scroll, no clipped text, tree and copy never collide, controls stay reachable.
