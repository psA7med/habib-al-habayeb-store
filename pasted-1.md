Fix ONLY the Hero scroll behavior and the centered Hero logo styling.

1. HERO SCROLL LOCK / ZOOM PHASE

Change the Hero behavior so that scrolling does NOT immediately move the page to the Categories section.

When the user first starts scrolling inside the Hero:

- Lock the page's normal vertical scrolling.
- Consume the scroll input inside the Hero.
- Use the scroll input ONLY to control the Hero zoom.
- The Hero image should smoothly zoom from scale 1.0 to approximately 1.15.
- The zoom must be subtle and smooth.
- Keep the Hero fixed/pinned visually while the zoom is happening.
- The Categories section must NOT move into view during this zoom phase.

The zoom phase should require approximately 3–4 deliberate scroll inputs / wheel steps to complete.

Do NOT make one tiny scroll complete the whole zoom.
Do NOT require a huge amount of scrolling.

After the zoom reaches 100%:
- Release the scroll lock.
- Restore normal page scrolling immediately.
- The next scroll should naturally move the user toward the Categories section.

When the user scrolls back upward:
- The same behavior should work in reverse.
- When returning to the Hero, scrolling should reverse the zoom first.
- Only after the zoom returns to its starting position should normal upward page scrolling continue.

IMPORTANT:
Do not create a visible scroll jump.
Do not let the Categories section appear during the locked zoom phase.
The entire zoom phase should feel like the camera is staying in place while the image smoothly moves closer.

2. MOBILE SUPPORT

Implement the same behavior for touch scrolling on mobile.

During the Hero zoom phase:
- Vertical touch movement should control the zoom.
- The page should remain visually pinned.
- Categories should not move into view until the zoom phase is complete.

Keep the behavior responsive and natural.

3. HERO IMAGE

Keep the current Hero image unchanged.
Do not replace it.
Do not crop it unnecessarily.
Do not modify the photograph.

Only change how it responds to scrolling.

4. CENTERED HERO LOGO

Use the UPDATED OFFICIAL SVG logo already provided by the user.

IMPORTANT:
This is the logo displayed in the CENTER OF THE HERO.
Do NOT change the Header logo styling as part of this task.

Create/use a dedicated Hero version of the same SVG so the Header logo remains unchanged.

Hero logo colors:
- Arabic "حبيب الحبايب": dark neutral gray / charcoal
- "MARKET": a second complementary neutral gray tone, slightly different from the Arabic text
- Keep both colors within a premium neutral palette: charcoal, graphite, gray, off-white tones
- Do NOT use the original bright blue Hero logo color
- Preserve the exact logo shape, Arabic lettering, proportions, dots, typography, and aspect ratio
- Do NOT redraw or regenerate the logo

The Hero logo should remain centered and visually prominent.

Do not make it excessively large.

Do not distort it.

Maintain its aspect ratio.

5. CONTRAST

Make sure the new neutral Hero logo remains clearly visible against the supermarket photograph.

Use only a very subtle natural shadow/contrast treatment if necessary for readability.

Do not add a glowing effect.
Do not add a colorful outline.
Do not redesign the logo.

6. DO NOT CHANGE

Do not modify:
- Header structure
- Header logo
- Categories
- Footer
- Hero image
- Hero layout
- typography outside the Hero logo
- other pages
- unrelated components

Only modify:
- Hero scroll/zoom interaction
- centered Hero logo styling

7. FINAL BEHAVIOR

Expected behavior:

Page loads
→ Hero image is static at scale 1.0
→ first scroll starts zoom
→ next few scrolls continue zoom
→ approximately 3–4 scroll inputs complete the zoom
→ page remains pinned during this phase
→ zoom reaches approximately 1.15
→ scroll lock releases
→ next scroll moves normally to Categories

Scrolling upward should reverse the process naturally.

8. VERIFY

Test:
- Desktop mouse wheel
- Mobile touch scrolling
- Hero zoom smoothness
- No accidental jump to Categories
- No scroll chaining during zoom
- Correct reverse behavior
- Hero logo colors
- Hero logo remains undistorted

Run typecheck/build after the change.