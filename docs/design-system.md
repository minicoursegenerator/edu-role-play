# MCG Design System

Visual tokens and component patterns extracted from the Mini Course Generator (MCG) Figma library. This is a living document — seeded from the **LP Header popup** frame and expanded as more frames are shared. Figma is the source of truth; this file captures what downstream code (runtime, CLI output, docs) should render.

Source: [Figma — LP Header popup](https://www.figma.com/design/cGPOpxXKyL4Hq1htzsZ7sh/Mini-Course-Generator?node-id=24917-327143) · tokens pulled 2026-04-20.

## Color tokens

| Token | Hex | Usage |
| --- | --- | --- |
| `mcg-dark` | `#002E47` | Primary text, headings |
| `mcg-white` | `#FFFFFF` | Surfaces, button text on filled CTAs |
| `mcg-bg` | `#F4F6F8` | App background, tile/preview backgrounds |
| `mcg-blue` | `#015FFB` | Primary action, selected borders, active links |
| `mcg-lightblue` | `#E3F3FF` | Active/selected tab background |
| `mcg-gray` | `#919EAB` | Secondary text, input borders, helper copy |
| `gray-dark` | `#ABB2BE` | Muted foreground (preview strokes) |
| `gray-light` | `#DBDEE3` | Divider / subtle fill |
| `gray-lighter` | `#E5E7EB` | Hairline borders on cards and tiles |

## Typography

All text uses **Inter**. Fallback: `system-ui, sans-serif`.

| Style | Size / line-height | Weight | Usage |
| --- | --- | --- | --- |
| Body 2 | 16 / 1.5 | 400 | Modal titles, primary body |
| Body 4 | 14 / 1.5 | 400 | Field labels, section headings, button labels |
| Body 5 | 12 / 1.5 | 400 | Helper text, captions, small button labels |
| Body 6 | 11 / 18px | 400 | Tile captions, micro-labels |

Medium (500) is used for button labels and emphasized inline words. Semi-bold (600) appears on in-preview headings. Bold (700) appears only inside the mini logo mark.

## Spacing

4px base grid. Observed scale: **4, 6, 8, 12, 16, 20**. Use 20 for modal padding, 16 between body sections, 8 between a label and its control, 4 for intra-group gaps.

## Radii

| Radius | Usage |
| --- | --- |
| 16 | Modal / popup shells |
| 12 | Hero image, large media surfaces |
| 8 | Inputs, tile selectors, large buttons, cards |
| 6 | Small buttons (32px height) |
| 4 | In-tile preview chips and inner surfaces |

## Elevation

| Shadow | Usage |
| --- | --- |
| `0 10px 40px rgba(145,158,171,0.32)` | Modal / floating popup |
| `0 2px 6px rgba(145,158,171,0.48)` | Card / tooltip / floating control |

## Components

### Modal

Floating surface for focused settings.

- **Shell:** white, radius 16, 20px padding, modal shadow.
- **Header row:** 40px tall. Title (Body 2, `mcg-dark`) on the left, 20px close icon on the right.
- **Body:** vertical stack, 16px gap, scrolls when content overflows. A 4px-wide scroll indicator in `mcg-gray` at 48% opacity sits inset from the right edge.
- **Footer actions:** right-aligned, 12px gap, 8px vertical padding. Tertiary Cancel + primary Save.

### Tile selector

Picker for variant options (e.g. Header type, Content alignment).

- Row of equal-width tiles, 16px gap.
- Each tile: 120px tall preview box with `mcg-bg` fill, radius 8, 8px padding; caption below in Body 6, centered.
- **Selected state:** 1px `mcg-blue` border on the preview box. Unselected has no border.

### Labeled input with trailing action

Single-line field paired with an inline button (e.g. *Collection Title · Edit Title*).

- Wrapper: white, 1px `mcg-gray` border, radius 8.
- Input text: Body 4; placeholder/empty uses `mcg-gray`.
- Trailing button: 32px tall, radius 6, Body 5 Medium, `mcg-dark` label, transparent fill.
- Label sits above, Body 4, `mcg-dark`, 4px bottom padding.

### Image upload card

Full-width preview with a centered action overlay (e.g. *Header image*).

- 240px tall media, radius 12, dark overlay `rgba(0,0,0,0.1)` on top of the image.
- Centered 32px white button (radius 6, Body 5 Medium) labeled "Change image".
- Helper line below in Body 5 `mcg-gray` describing recommended dimensions.

### Segmented option picker (alignment)

Three equal-width option cards (Left / Center / Right).

- Each card: 1px `gray-lighter` border, radius 8, 16px vertical / 32px horizontal padding, abstract preview inside using `gray-dark`/`gray-light` fills.
- **Selected:** border swaps to `mcg-blue`.
- Caption below each card: Body 5, centered, `mcg-dark`.

### Switch row

Inline toggle with right-aligned secondary action (e.g. *Show Price Tag · Set Display Price*).

- Switch: 42×22, knob slides; active track `mcg-blue`, inactive `mcg-gray`.
- Adjacent label: Body 4, `mcg-dark`.
- Optional trailing outline button: 32px, radius 6, 1px `mcg-blue` border, `mcg-blue` label, transparent fill.

### Collapsible section

Accordion panel for grouped secondary settings (e.g. *Language*).

- Container: white, 1px `gray-lighter` border, radius 8, 12px padding, 16px gap.
- Header row: Body 4 label + 20px chevron on the right. Rotates on open.
- Body stacks labeled inputs using the standard form pattern.

### Buttons

| Variant | Fill | Border | Label | Height / radius |
| --- | --- | --- | --- | --- |
| Primary | `mcg-blue` | — | white, Body 4 Medium | 36 / 8 |
| Secondary outline | transparent | 1px `mcg-blue` | `mcg-blue`, Body 5 Medium | 32 / 6 |
| Tertiary / ghost | transparent | — | `mcg-dark`, Body 4 Medium | 36 / 8 |
| Inline action | transparent | — | `mcg-dark`, Body 5 Medium | 32 / 6 |

Horizontal padding is 16px on 36px buttons and 12px on 32px buttons.

## Expanding this doc

When a new Figma frame is shared, add any **new** tokens to the tables above (don't duplicate), then add a component subsection only if the pattern isn't already covered. Keep each component under ~10 lines.
