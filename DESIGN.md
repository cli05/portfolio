# Immersive shelf study

## Status and reference

An alternative prototype at `/shelf`, based on the user's photograph of a collection arranged across five staggered shelves. The existing homepage remains available for comparison. The earlier daytime mockup is another direction, not a required implementation template.

## Physical scene

A visitor pauses in front of a meaningful corner of Caleb's room in the evening, with warm light falling across wooden shelves and little green figures. The shelf fills the scene; introductions appear only after selecting a section.

Use a mostly frontal perspective with enough angle to show the platforms' depth. Restrict orbiting to comfortable views of the wall-mounted collection. Stagger five thin platforms horizontally, connect selected levels with small green ladders, and use varied figure scales and poses to suggest a collected arrangement.

## Materials and lighting

Warm oak, subtle procedural grain, an imperfect matte plaster wall, soft green resin-like figures, restrained teal figures, linen-colored paper, and miniature personal objects. One warm key light establishes a pool of illumination and shadows against the wall, with quieter fill lighting. A secondary dim setting tests softly emissive figures.

## Typography

Locally hosted Karla in regular, medium, semibold, and bold weights. Its humanist proportions suit small collection labels and readable personal content. Keep on-arrival typography quiet, and reserve larger type for selected content.

## Palette

- Reading surface: `oklch(94% .022 83)`.
- Reading ink: `oklch(28% .029 65)`.
- Secondary reading text: `oklch(48% .034 65)`.
- Rules: `oklch(78% .03 75)`.
- Scene controls: warm pale text over the illuminated wall.

The scene uses physically lit Three.js material colors. UI colors use OKLCH. Object color, shadows, and the pool of light provide the visual emphasis.

## Interaction and layout

The arrival view contains the full collection, an Explore menu, camera reset, and lighting controls. It has no visible header or introductory text. Drag to orbit, scroll or pinch to zoom. Hover or keyboard focus reveals labels beside meaningful groups. Selecting the frame, laptop, cube/ball, or envelope focuses its scene and opens About, Projects, Interests, or Contact.

Desktop reading views occupy the right side, leaving the selected scene on the left. Mobile reading views occupy the full width. Content navigation, Back to shelf, Escape, URL hashes, browser history, and direct links all lead to the same section state.

## Accessibility and rendering

Provide semantic buttons for every content route, visible focus, descriptive labels, reduced-motion handling, and text access if WebGL is unavailable. Keep camera movement bounded. Cap rendering resolution, reuse geometry, and render only when camera or lighting changes. Do not gate content on precise 3D clicking.

## Open art direction

The figures are procedural sculpts for this exploration. A later pass should refine their recognizable shapes, make lighting and contact shadows softer, and replace the illustrative landscape print with Caleb's supplied photography if desired. Mobile scene density and final object placement remain open to visual review.
