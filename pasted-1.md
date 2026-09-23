REPLACE THE CURRENT HERO SCROLL-LOCK IMPLEMENTATION COMPLETELY.

The current wheel/touch scroll-lock implementation is not working correctly.
Do NOT try to patch the existing preventDefault-based logic.

Use a robust STICKY SCROLL architecture instead.

REQUIREMENT:

The Hero must remain visually pinned while the user scrolls through the first part of its scroll range.

During this pinned phase:
- the page must NOT visibly move to Categories
- the Hero image zooms smoothly from 1.0 → 1.15
- the user's scroll controls the zoom progress
- the Hero remains fixed in the viewport

After the zoom reaches 1.15:
- the pinned Hero phase ends
- normal page scrolling continues
- Categories naturally comes into view

IMPORTANT:
Do NOT intercept or disable wheel events.
Do NOT use preventDefault().
Do NOT lock document scrolling.
Do NOT attach global wheel-lock logic.
Do NOT cancel native scrolling.

IMPLEMENTATION:

Create a tall Hero scroll section with an inner sticky viewport.

Example concept:

Hero scroll container:
~200vh–250vh

Inside:
sticky element
height: 100vh

The sticky Hero remains visually fixed while the outer section is being scrolled.

Map ONLY the FIRST PART of the Hero scroll progress to the image zoom:

progress 0% → scale 1.00
progress 100% of zoom phase → scale 1.15

The zoom phase should consume approximately the first 35–45% of the Hero's total scroll distance.

After the zoom phase:
keep scale at 1.15
allow the remaining Hero scroll distance to naturally move the page toward the next section.

The Categories section must not appear while the zoom phase is active.

The user experience should feel like:

START
→ Hero visible
→ user scrolls
→ Hero stays pinned
→ image smoothly zooms
→ zoom finishes
→ Hero releases
→ normal page scroll continues
→ Categories appears

REVERSE SCROLL:

When the user scrolls upward:
- Categories moves away
- Hero becomes sticky again
- reverse the zoom smoothly from 1.15 → 1.00
- once scale reaches 1.00, continue normal upward page scrolling

ZOOM:

Use smooth interpolation based on scroll progress.
Start: scale(1)
End: scale(1.15)

The zoom focal point should remain around the storefront sign / center of the supermarket.

Do NOT zoom excessively.

Do NOT move the image sideways.

Do NOT rotate the image.

Do NOT change the image.

LOGO:

Keep the centered Hero logo exactly as it currently exists.
Do not modify the logo asset as part of this task.

PERFORMANCE:

Do not use continuous setState on every scroll event.

Prefer:
- requestAnimationFrame
- CSS transform
- scroll progress calculation

Use transform: scale(...) only.

Do not cause layout reflow.

Do not add heavy animation libraries.

MOBILE:

The same sticky behavior must work naturally with touch scrolling.

Do not disable native touch scrolling.

Do not use preventDefault() for touchmove.

The Hero must remain visually pinned during the zoom phase on mobile.

CRITICAL:

Remove the previous scroll-lock / wheel interception implementation completely.

There should be NO preventDefault-based Hero scroll lock.

The browser's native scrolling remains enabled at all times.

The sticky Hero creates the visual effect of "scrolling being paused" while the zoom happens.

DO NOT MODIFY:

- Header
- Categories content
- Footer
- Product sections
- Hero image
- Logo asset
- Other pages

Only replace the Hero scroll behavior.

VERIFY:

Desktop mouse wheel
Mobile touch scrolling
Forward scroll
Reverse scroll
Zoom smoothness
No jump to Categories during zoom
No stuck scrolling
No scroll deadlock
No layout shift
No horizontal overflow

Run typecheck and build after implementation.