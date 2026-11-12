# Immersive shelf alternative

## Scope

An interactive Three.js prototype at `/shelf`, using the user's collection photograph as a reference for five thin, staggered wooden platforms, ladders, and a denser arrangement of figures. The existing homepage at `/` remains unchanged.

![Preview of the immersive shelf](immersive-shelf-preview.jpg)

The entrance is the shelf itself. Warm illumination, shadows, real object depth, a constrained orbit camera, and scroll/pinch zoom establish the atmosphere. The small controls at the bottom provide direct navigation, reset, and a dim-light experiment.

## Try it

1. Run `npm ci` and `npm run dev`, then visit `/shelf`.
2. Drag to rotate and scroll or pinch to zoom. Turn on Pan to move across the shelf by dragging. You can also Shift-drag, drag with two fingers, or focus the scene and use the arrow keys.
3. Hover the frame, laptop group, cube/ball group, or envelope for a label. Select the object or use Explore to open its content.
4. Use the section navigation, browser back/forward, Back to shelf, or Escape. Direct links such as `/shelf#projects` open the same content.
5. Use the lighting control to compare warm and dim illumination. Reset returns the camera to the full shelf.

## Rendering and access

The models are procedural geometry, not a flat generated image. Materials include locally generated wood grain and wall textures; the frame contains an illustrative landscape rather than a fabricated personal photograph. The scene is loaded separately from the original homepage. Desktop uses a side reading area; mobile uses full-width content. Semantic scene buttons and a text menu provide keyboard access, and a fallback navigation view appears if scene initialization fails. Without JavaScript, visitors can access the existing portfolio.

Hugging Knees sits beside the frame. Thirteen other sculpts use figures from the official [Museum](https://smiski.com/e/p2020/museum/), [Sunday](https://smiski.com/e/products/sunday-series/), [@Work](https://smiski.com/e/products/work-series/), [Construction](https://smiski.com/e/products/construction-series/), [Moving](https://smiski.com/e/products/moving-series/), [Yoga](https://smiski.com/e/products/yoga-series/), [Exercising](https://smiski.com/e/products/exercising-series/), and [Bed](https://smiski.com/e/products/bed-series/) series as references. Run `node scripts/sculpt-smiski.mjs --shelf` to regenerate the shelf models and mesh report.

The scene caps pixel density, reuses geometry and materials, reuses static shadows, skips drawing when nothing changes, and disposes rendering resources when unmounted. Reduced-motion preferences disable camera transitions.

## Still exploratory

- Improve shadow softness, final camera limits, and mobile density after visual review.
- Existing project data is reused. Screenshots, deeper case studies, current role dates, and detailed interests remain future content work.
- The app build and TypeScript checks validate the prototype; existing dependency audit findings are outside this design exploration.
- This branch is an alternative to the static daytime study in PR #2. Merging both requires reconciling their PRODUCT.md descriptions around the preferred direction.
