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

12. **Scroll grows the tree, then it lands in the picker.** (Owner idea.) The hero opens on a tiny sapling. Scrolling through the hero grows it stage by stage, so scroll position is the growth. At the end of the hero, the grown tree slides down and shrinks into the tree picker card, where it becomes the picker's first tree (Cherry). From there the visitor taps, swipes or uses the arrows for other trees. Reverse scrolling un-grows and lifts the tree back out. Reduced motion: grown tree, no slide. The day counter follows the growth.

13. **No critters on the cards or the hero tree.** (Owner: "just remove ladybugs from cards.") Ladybirds walk only on the painted ground; butterflies and other flyers roam the sky freely. While the tree slides into the picker it travels behind the glass cards and shows crisp only through the picker window, never over text.
14. **Smooth shadow.** The tree's shadow is not baked into frames; it's drawn live and grows continuously with the scroll-driven growth.

15. **Growth spans the page; order ends picker → app.** (Owner.) The tree keeps growing across the whole scroll from the hero until the picker arrives (it does not finish early); it stands behind the story cards on the back canvas, and only for the final slide moves to the front canvas and into the picker card. Page order: hero → grove → good days → privacy → tree picker (second last) → the app (phone screenshots of Home, the tree page and the grove, Google Play coming soon, early testers) → footer. The growth counter pill stays fixed at the bottom.

16. **Privacy section removed for now** (owner: "remove this section for now"). The nav drops its Privacy link. The grove card no longer lists codenames.
17. **Picker: name, one line, thumbnails.** Under the tree: the tree's name and one line about it (e.g. "Jacaranda: purple in spring"). The dots become a strip of small thumbnails of each grown tree.
18. **App section: copy only for now.** No video and no screenshot (owner removed both); one centred card with the Google Play badge and Join early testers.
19. **Early testers via a Google Group.** "Join early testers" opens the Thrivling testers Google Group (anyone can join with a Google account; the group is the Play Console closed-testing list). The note explains: join the group now, the Google Play install link follows when testing opens. The group URL lives in one constant.
20. **Rhythm.** Cards are not all the same rectangle: the grove card is narrow and tall, good days is a wide two-column card, privacy is a wide card holding the two phones.
21. **Night and dusk.** Night is a deep navy with fireflies; dusk is blue into warm peach, not purple. Greens stay green in both.

22. **The hero tree fades into the picker.** Between the end of growth and the picker being centred, the hero tree travels behind the cards to the picker tree's exact spot and size while fading out; the picker's own tree fades in over it there. Reverses on the way back.

## Round 4 (owner, 27 Oct) — supersedes 13, 18, 19, 22 where they conflict
23. **Hero tree fills the screen** whenever there is room. It never disappears.
24. **Counter:** leaf and day count only (no tree name). Same component, in its own slot in the middle of the nav, shown once you scroll away from the top. Never overlaps the links.
25. **Ladybirds walk on the painted ground's real curve**, feet on it, never floating.
26. **No fade-in for grove trees.** They are part of the world and come into view through the camera.
27. **The page ends on the whole grove**, standing together on the ground, with the footer links on it.
28. **One tester button:** the Google Play badge and "Join early testers" become one button that opens the testers Google Group.
29. **The tree's shadow and soil mound are drawn live**, separate from the tree frames, so they grow smoothly with the tree.
30. **Back to top is a sticky round button** in the bottom-right corner, shown after scrolling, not a footer link.
31. **Move the camera, not the tree.** Ground, hero tree, grove and sky are one world; scroll moves a camera through it. Close at the top (tree fills the screen), pulling back and panning as you scroll so the grove comes into view, a wide shot of the whole grove at the bottom. Far hills move slower than near ground.
32. **Picker focus.** At the picker the card and its own trees take focus; the hero stays rooted in the world behind, softly visible through the glass; the world dims slightly while the card is centred.

33. **Picker card wider but shorter.** On wide screens it is two columns: heading, lead, tree name and line, thumbnails on the left; the tree stage on the right at the same height as before. Phones stay stacked.

34. **Small animals only for now** (owner: "lets stick to small ones"): ladybirds and beetles on the ground; bees, butterflies, dragonflies, fireflies and moths in the air and trees. No birds or squirrels.
35. **Every tree has its own falling leaves and flowers**, not only the hero. Trees are bigger and closer together in the grove.
36. **Counter has a fixed width** so it never shifts as the digits change.

37. **The day counter sits on top of the tree**, just above the crown, following it as it grows; it stays there for the first half screen of scrolling, then fades into the nav.
38. **Picker heading:** "You pick your style."
