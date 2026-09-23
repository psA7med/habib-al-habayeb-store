IMPLEMENT A SCROLL-CONTROLLED HERO VIDEO USING THE TWO ATTACHED VIDEOS.

VIDEO SOURCES:

1. Desktop:
Use the attached 16:9 video for desktop screens.

2. Mobile:
Use the attached 9:16 video for mobile screens.

These videos are the FINAL camera-movement animation.
Do NOT generate, reconstruct, interpolate, or modify the videos.

==================================================
CORE BEHAVIOR
==================================================

The videos represent a smooth camera zoom/push into the supermarket.

DO NOT autoplay the video normally.

DO NOT loop the video.

DO NOT use a normal play/pause interaction.

The user's page scroll must control the video's playback position.

Map Hero scroll progress directly to video.currentTime.

At the beginning of the Hero:
currentTime = 0

At the end of the Hero:
currentTime = video.duration

The video should behave like a scroll-controlled camera animation.

==================================================
SCROLL EXPERIENCE
==================================================

While the user scrolls through the Hero:

scroll progress
→ controls video currentTime

Scrolling downward:
video advances smoothly.

Scrolling upward:
video reverses smoothly.

The user should feel that the camera movement is directly connected to their scrolling.

Do NOT create an additional CSS zoom.

Do NOT add another camera animation.

Do NOT add transitions between frames.

The video itself contains the complete camera movement.

==================================================
HERO STRUCTURE
==================================================

Use a sticky viewport for the Hero.

The Hero should have enough vertical scroll distance to allow the 4-second video to be experienced smoothly.

Recommended structure:

outer Hero scroll section:
approximately 250vh–350vh

inner Hero:
position: sticky
height: 100vh
top: 0

The video remains visually pinned while the user scrolls through the Hero section.

Calculate normalized scroll progress from the Hero's position.

Map:

0.0 progress → 0.0 video time
1.0 progress → full video duration

Do NOT let the video continue playing independently.

==================================================
VIDEO BEHAVIOR
==================================================

Set:

muted
playsInline
preload appropriate for smooth scroll seeking
loop = false

Do not show native video controls.

Do not show a play button.

Do not show a progress bar.

Do not show video UI.

The video should fill the Hero viewport without distortion.

Preserve the video's aspect ratio.

Desktop:
use the 16:9 video.

Mobile:
use the 9:16 video.

==================================================
RESPONSIVE SOURCE SELECTION
==================================================

Do NOT download both videos unnecessarily.

Desktop users should load ONLY the desktop video.

Mobile users should load ONLY the mobile video.

Select the correct source based on viewport size.

Do not keep both videos actively loading at the same time.

==================================================
PERFORMANCE
==================================================

This is a performance-sensitive Hero.

Use requestAnimationFrame for currentTime updates.

Do not call React setState on every scroll event.

Do not force layout on every scroll event.

Use refs for:
- video element
- current progress
- animation frame

Avoid unnecessary re-renders.

The Hero must remain smooth on normal mobile devices.

==================================================
VIDEO LOADING
==================================================

Use the FIRST FRAME of each video as the Hero poster/loading state.

The Hero should show the first frame immediately while the video is loading.

Do not show a blank white area.

Do not show a spinner.

Do not flash between image and video.

Load the selected video efficiently.

==================================================
NO OTHER HERO CONTENT
==================================================

The Hero should contain ONLY the video.

No centered logo.

No text.

No CTA.

No cards.

No badges.

No floating elements.

No gradients unless absolutely necessary for video readability.

Keep the Hero visually clean.

==================================================
IMPORTANT
==================================================

Do NOT modify the video files.

Do NOT crop them unnaturally.

Do NOT stretch them.

Do NOT change their colors.

Do NOT add effects.

Do NOT generate alternative frames.

The uploaded videos are the exact final animation.

==================================================
FINAL EXPERIENCE
==================================================

Desktop:
16:9 video
→ scroll
→ camera smoothly moves into the supermarket
→ Hero ends
→ Categories appear.

Mobile:
9:16 video
→ scroll
→ camera smoothly moves into the supermarket
→ Hero ends
→ Categories appear.

The scroll controls the camera movement directly.

No autoplay.
No looping.
No separate zoom animation.
No image morphing.
No AI regeneration.