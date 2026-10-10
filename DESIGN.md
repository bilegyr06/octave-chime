---
name: Octave Chime
description: A calm, instrument-like control room for WhatsApp transaction alerts.
colors:
  console-green: "#0a5345"
  console-green-deep: "#073c33"
  console-green-soft: "#dcebe4"
  amber-signal: "#c7851b"
  amber-signal-soft: "#f6ead2"
  whatsapp-green: "#1da851"
  console-mist: "#e9ede8"
  reed: "#e2e8e1"
  instrument-paper: "#fafbf9"
  ink-green-black: "#11201b"
  mute-sage: "#4f625a"
  hairline: "#d5ddd4"
  hairline-strong: "#b7c4ba"
  nominal-green: "#2e7d45"
  nominal-green-soft: "#e1efe2"
  alert-red: "#a03a2e"
  alert-red-soft: "#f7e7e3"
  caution-amber: "#9a6b0f"
  caution-amber-soft: "#f3e8ce"
typography:
  display:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  metric:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Bricolage Grotesque, ui-sans-serif, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Instrument Sans, ui-sans-serif, system-ui, sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.4
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "tabular-nums"
rounded:
  xs: "2px"
  sm: "3px"
  pill: "9999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.console-green}"
    textColor: "{colors.instrument-paper}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "{colors.console-green-deep}"
  button-secondary:
    backgroundColor: "{colors.instrument-paper}"
    textColor: "{colors.ink-green-black}"
    rounded: "{rounded.sm}"
    padding: "6px 12px"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.instrument-paper}"
    textColor: "{colors.ink-green-black}"
    rounded: "{rounded.sm}"
    padding: "20px"
  input:
    backgroundColor: "{colors.instrument-paper}"
    textColor: "{colors.ink-green-black}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    typography: "{typography.body}"
  badge:
    backgroundColor: "{colors.console-green-soft}"
    textColor: "{colors.console-green}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
    typography: "{typography.label}"
  nav-item:
    backgroundColor: "{colors.console-green-deep}"
    textColor: "{colors.instrument-paper}"
    rounded: "{rounded.sm}"
    padding: "8px 12px"
    typography: "{typography.body}"
  stat-tile:
    backgroundColor: "{colors.instrument-paper}"
    textColor: "{colors.ink-green-black}"
    rounded: "{rounded.sm}"
    padding: "20px"
---

# Design System: Octave Chime

## Overview

**Creative North Star: "The Control Room"**

Octave Chime is a calm, always-monitored operations room. Everything on screen answers one question — *is delivery flowing, and where did it break?* — and the interface is built the way a control room is built: quiet surfaces, hairline panels, small status lights, and figures precise enough to trust at a glance. There is no theatre. The product's own principle ("operational truth over decoration") is legible as visual fact: canvas and paper carry the depth, borders do the dividing, and color is spent almost entirely on meaning.

The density is comfortable rather than packed, but it leans operational: tables, panels, and logs are first-class, and the eye is led by a small vocabulary of LEDs and mono figures rather than by size and ornament. Mood is **calm, precise, understated**. The type pairing — a characterful grotesque for headings and figures, a clean humanist sans for prose, and a mono reserved for numbers — reads as considered and technical without ever becoming corporate.

Only one confirmed visual rejection exists, carried from PRODUCT.md: this is **not a marketing landing page**. No oversized hero sections, no decorative gradients as the idea. WhatsApp green is a *status* accent, never the theme.

**Key Characteristics:**
- Flat and tonal: depth from surface value (canvas → paper) plus hairline borders, not shadows.
- Small signal vocabulary: LED dots and colored labels carry state; color never appears alone.
- Mono numerals for anything countable — money, phones, timestamps, counts.
- One radius, everywhere: soft-squared 3px; only true circles and 2px micro-indicators deviate.
- Restrained palette: one deep green identity, one amber attention accent, WhatsApp green for notification status only.

## Colors

A cool, green-biased neutral field with a single deep-green identity and two accents used sparingly and semantically.

### Primary
- **Deep Console Green** (#0a5345): the identity color. Primary actions, active navigation rails, chart fills, focus rings, and the brand sidebar's darker sibling. It colors decisions, not decoration.
- **Console Green Deep** (#073c33): the darkest identity step. Backs the desktop/mobile navigation rail and answers primary-button hover. It is a *ground*, not an action.
- **Console Green Soft** (#dcebe4): the identity tint. Selected rows, brand badges, avatar plates, and text selection. Distinguishes without raising volume.

### Secondary
- **Amber Signal** (#c7851b): the attention accent. Marks the "live edge" of a metric, the active nav LED, and toggles in the on state. Deliberately rare — it means *look here*, so it must not be ambient.
- **Amber Signal Soft** (#f6ead2): the attention tint, for soft amber fills and paired status text.

### Tertiary
- **WhatsApp Green** (#1da851): reserved for **notification and delivery status** — a delivered alert, an enabled channel, the WhatsApp accent in messages. It is a status color, never a surface fill and never the brand.

### Neutral
- **Cool Console Mist** (#e9ede8): the app canvas. Every screen sits on this cool, faintly green ground.
- **Reed** (#e2e8e1): the second ground tone — a half-step deeper than canvas, for recessed bands and subtle alternation.
- **Instrument Paper** (#fafbf9): the surface. Cards, inputs, chips, and any raised panel float on the canvas as warm-white paper.
- **Ink Green-Black** (#11201b): primary text. Near-black with a green cast so it belongs to the field.
- **Mute Sage** (#4f625a): secondary text, labels, and supporting copy.
- **Hairline** (#d5ddd4): the default 1px border and divider between paper surfaces.
- **Hairline Strong** (#b7c4ba): emphasized borders, hover states on outline controls, and the default LED/dot fill.

### Status
- **Nominal Green** (#2e7d45) / **Nominal Green Soft** (#e1efe2): success and healthy delivery.
- **Alert Red** (#a03a2e) / **Alert Red Soft** (#f7e7e3): failures, destructive state, error copy.
- **Caution Amber** (#9a6b0f) / **Caution Amber Soft** (#f3e8ce): warnings and pending/attention states — distinct from the *attention* amber, which highlights rather than warns.

### Named Rules
**The Signal-Only Green Rule.** WhatsApp green appears only where notification or delivery status is being stated. It is never a page background, a button fill, or the brand. Its meaning is the point.

**The One Accent Rule.** On any given screen the identity green does the structural work and amber appears at most as a few marks. If amber is everywhere, it has stopped being a signal.

**The Tonal Depth Rule.** Depth is created by surface value and hairline borders — never by shadow. See Elevation & Depth.

## Typography

**Display Font:** Bricolage Grotesque (with ui-sans-serif, system-ui)
**Body Font:** Instrument Sans (with ui-sans-serif, system-ui)
**Label/Mono Font:** IBM Plex Mono (with ui-monospace)

**Character:** A characterful grotesque sets headings and large figures, a clean humanist sans carries prose, and a mono is kept on a short leash for numerals only. The pairing is technical and editorial at once: confident where it counts (a metric, a page title), plain where it reads (body, labels).

### Hierarchy
- **Display** (600, 26px, 1.15): page titles such as "Overview" and the sticky header date. Tracking tightened (~-0.01em).
- **Metric** (600, 44px, 1.0): the single hero figure at the top of a view (e.g. alerts delivered today). Reserved for the one number that summarizes the screen; sub-stats use Title scale.
- **Title** (600, 15px, 1.3): panel headers and small figures inside cards. The workhorse heading.
- **Body** (400/500, 14px, 1.5): all prose, table cells, and controls.
- **Label** (500, 12px, 1.4): badges, table headers, metadata, and helper text.
- **Mono** (400/500, 12px, tabular-nums): phone numbers, money, account masks, timestamps, and any aligned count.

### Named Rules
**The Mono-for-Numerals Rule.** Anything countable and comparable — amounts, phone numbers, timestamps, counts, account masks — is set in IBM Plex Mono with tabular figures. Prose is never mono, and mono is never used for a heading.

**The Grotesque-for-Headings Rule.** Headings and large figures use Bricolage Grotesque; body copy uses Instrument Sans. Do not set body copy in the display face, and do not set metrics in the body face.

## Layout

A fixed dark rail on the left and a single scrolling content column, centered at a max width of 1152px (`max-w-6xl`) with 16px gutters (24px from `sm`). The rail is 240px (`w-60`) at desktop and collapses to an off-canvas drawer below the `lg` breakpoint; the content column carries `lg:pl-60` to clear it. A sticky, blurred header (56px tall) holds the date and the delivery-mode chip.

Spacing runs on a 4px base unit with a practical rhythm of **8 / 12 / 16 / 20 / 24px**. Cards pad at 20px, list rows at `px-5 py-3`, and sections stack at 24px (`space-y-6`), while multi-column grids use a 16px gap (`gap-4`). Panels that contain lists use `overflow-hidden` with hairline dividers between rows rather than per-row borders, so the card edge stays clean.

Responsive behavior is breakpoint-light and structural: grids move from single column to two at `lg`, stat clusters from 2-up to 4-up at `sm`, and the navigation rail swaps to a drawer at `lg`. Nothing reflows decoratively.

## Elevation & Depth

This system is **flat by default**. There is no shadow vocabulary on cards, headers, or overlays. Depth is conveyed entirely by tonal layering — the cool canvas sits behind warm paper surfaces — plus 1px hairline borders and the occasional `backdrop-blur` on the sticky header. The navigation rail reads as "below" the content because it is a dark ground, not because it floats.

### Shadow Vocabulary
- **Knob only** (`box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`): the single shadow in the codebase, used solely on the toggle-switch knob so it reads as a physical control on its track. Nothing else in the system casts a shadow.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest and stay flat on hover. Separation is achieved with value and borders, not shadows. The only sanctioned shadow is the switch knob's.

## Shapes

One radius, applied consistently: soft-squared **3px** on every surface and control — cards, buttons, inputs, badges, nav items, avatars. Micro-indicators do not round to 3px: the LED dots are **2px** squares and the meter bars are **2px**, kept crisp so they read as lights rather than chips. Only genuinely circular things go fully round: the toggle track and knob, and small 2px circular status points. Borders are always 1px hairlines; there is no heavy border weight and no double-stroke.

### Named Rules
**The 3px Rule.** Every surface and control uses a 3px corner. Only true circles (toggle, status dots) and 2px micro-indicators (LEDs, meter bars) deviate. No `rounded-lg`, no pills on content.

**The Hairline Rule.** Dividers and card borders are 1px in the hairline tones. Never thicken a border to create hierarchy — use value or whitespace instead.

## Components

### Buttons
- **Shape:** soft-squared, 3px radius.
- **Primary:** Deep Console Green fill, Instrument Paper text, 14px medium, `8px 16px` padding. Full-width variants on customer pages are 44px tall (`h-11`).
- **Hover / Focus:** hover moves to Console Green Deep; press uses a 1px downward nudge (`active:translate-y-px`) for tactility; focus shows a 2px identity-green outline with 2px offset. Transitions are color-only and short.
- **Secondary:** paper fill, hairline border, ink text (`6px 12px`) — used for "Try again", pagination, and other low-stakes actions. Border darkens to Hairline Strong on hover.
- **Disabled:** maintained at reduced opacity (40–60%), cursor not-allowed; color never changes to a new tone.

### Chips (if used)
- **Style:** 3px radius, 12px medium text, `2px 8px` padding. Tones map to soft-background + matching-strong-text pairs (brand, ok, danger, warn, whatsapp, mute). The delivery-mode chip in the header is an outline chip: paper fill, hairline border, a colored dot, and Mute Sage text.
- **State:** status chips are read-only indicators; they are not interactive filters in the current build.

### Cards / Containers
- **Corner Style:** 3px.
- **Background:** Instrument Paper on the Cool Console Mist canvas.
- **Shadow Strategy:** none — flat by default (see Elevation & Depth).
- **Border:** 1px Hairline; use `overflow-hidden` when the card holds a list.
- **Internal Padding:** 20px for free content; list rows sit at `px-5 py-3` with hairline dividers between them.

### Inputs / Fields
- **Style:** 3px radius, paper fill, 1px Hairline border, ink text, 14px, `8px 12px` padding. Placeholder text is Mute Sage at 70% opacity.
- **Focus:** border shifts to identity green plus a soft 2px `ring` at 15% identity opacity — the border change is primary, the ring is a halo, not a glow.
- **Error / Disabled:** no dedicated error skin yet; errors surface as Alert Red text (see `ErrorState`) rather than a red input border.

### Navigation
- **Style:** a dark Console Green Deep rail of 3px-radius rows; each row is a 2px LED + a 16px glyph + a 14px medium label. Inactive rows are Instrument Paper at 70%; the active row lifts to `bg-paper/10` with full-opacity text and its LED switches to Amber Signal.
- **Mobile treatment:** below `lg` the rail becomes an off-canvas drawer over an ink scrim, tagged as a modal dialog with Escape-to-close.

### Stat Tile (signature)
A paper card holding a labeled figure: a small LED, a 12px Mute Sage label, a large Bricolage figure (32px), and an optional 12px sub-line. Distinctive because the LED carries the tile's state (mute / signal / danger) and the number is always tabular and always in the display face — the signature "meter reading" of the system.

### Signal Bar (signature)
The overview's delivery meter: one hero metric (44px) beside a 2×4 / 1×4 cluster of sub-stats, over an 8-segment bar of 2px-radius `flex-1` cells that fill left-to-right and animate in with a 45ms stagger (`meter-in`, scaleY 0→1). Delivered segments are identity green; the final segment flips to Amber Signal when a failure exists (the "live edge"). It is the clearest expression of the Control Room idea.

## Do's and Don'ts

### Do:
- **Do** create depth with surface value and 1px hairline borders — canvas behind paper, never a shadow.
- **Do** render every countable value (money, phones, timestamps, counts, account masks) in IBM Plex Mono with `tabular-nums`.
- **Do** use 3px corners on all surfaces and controls, and reserve 2px for LED dots and meter bars.
- **Do** pair every status color with a label or an LED-plus-text; color alone never carries state.
- **Do** reserve WhatsApp green (#1da851) for notification/delivery status and keep the identity green for structure and actions.
- **Do** give primary controls a 1px press nudge (`active:translate-y-px`) and a border/darker-tone hover, not a shadow.

### Don't:
- **Don't** add shadows to cards, headers, dropdowns, or buttons — the switch knob is the only sanctioned shadow.
- **Don't** introduce a second radius scale, pills on content, or `rounded-lg`.
- **Don't** build oversized hero sections, decorative gradients, or marketing-style landing layouts.
- **Don't** let WhatsApp green or Amber Signal become a surface or brand fill; both are signals, not grounds.
- **Don't** set body copy in Bricolage Grotesque or a heading in Instrument Sans.
- **Don't** invent new status colors; map to the existing nominal / alert / caution / WhatsApp set.
