# FODMAP Label Check — design tokens

Platform-neutral source of truth for the design system. This file is **not
shipped to the browser** and is deliberately **not listed in `sw.js` ASSETS`**
— it is a review artefact and the thing a future SwiftUI port is transcribed
from by hand.

Hand-transcription is the right call here: a token generator would be a build
step, this project has none by design, and there are only ~90 values. Two
copies kept in sync by a human beat a toolchain that rots.

The browser-facing copy is [`css/tokens.css`](../css/tokens.css). If the two
disagree, `css/tokens.css` is what users see — fix this file to match.

---

## Read this before using any value

### 1. The references are two different design systems. Images 1 and 3 are primary.

`Style refferences/` holds three collages. Images **1** and **3** are one
coherent system: olive/lime brand, generous radii, full-pill controls, stock
iOS type, no shadows. Image **2** is a different system — tighter corners
(10–12pt), a Semibold 15pt subhead style, and a more conventional
card-on-grey layout.

Where they conflict, **1 and 3 win**. Image 2 contributed the
`--type-subhead-weight-strong` variant and is the source of the "tight"
radius alternative documented under Decision 2 below. Nothing else was taken
from it.

Olive is not an accent colour. In image 3 it is **38.9% of all pixels** — it
is the canvas.

### 2. There is no red and no not-recognised colour in the references. Both were designed.

Nothing in any reference image is a warning state. Every sampled hue is
green, lime, olive, cream, white, grey, or one of the three progress-bar
colours (orange / yellow / green).

So the two most consequential colours in a FODMAP traffic light —
`--color-semantic-red` and `--color-semantic-unknown` — are **not
extractions**. They are decisions:

- **Red** defaults to `#E5484D`, the red this codebase already shipped.
  `#D9463C` (desaturated brick) is the alternative under review. Marked
  `PENDING USER DECISION` in `css/tokens.css`; it is a one-line change.
- **Not recognised** is `#8E8F91`, taken from the neutral text ramp so the
  fourth bucket reads as "no answer" rather than as a fourth verdict.

Do not describe either as "sampled from the references".

### 3. The greenish greys on cream are compression artefacts. Never reintroduce them.

Sampling text on the cream surfaces returned greens like `#5D6156`,
`#5F6358`, `#606457`. These are **WebP chroma-subsampling bleed** from the
surrounding green, not a design choice. Treating them as real would give the
system a per-surface text ramp that nobody designed and that would drift.

There is **one neutral grey text ramp** — `#000000` / `#666666` / `#8E8F91`
— and it is used on every surface.

### 4. There are essentially no shadows. Separation is surface contrast.

Every card edge in the references was profiled across its boundary. All of
them transitioned in **2–4px**, which is antialiasing, not a shadow. Depth is
carried by surface-colour contrast (white card on cream page), and the single
"featured" card is marked with a **3px coloured ring**, not elevation.

`--elevation-0: none` is therefore the default for everything. `elevation-1`
and `elevation-2` exist for the two cases the references never had (white on
white, and something floating over content) and need a justification at the
call site.

Filled buttons are a third exception, designed rather than sampled: a soft
elevation (low opacity, large blur, small y-offset) whose colour follows
the fill. White and black/slate fills take a grey shadow; lime/green fills
take a green-tinted one. Encoded as `--elevation-button` and
`--elevation-button-green`.

The same finding applies to dividers: **no hairline rules exist anywhere** in
the references. Lists are separated by whitespace and card edges.
`--border-hairline` is provided, but near-zero use is expected.

---

## Naming

Flat, two-level, `category-role`:

```
--color-text-primary     ->  Color.Text.primary
--color-semantic-red     ->  Color.Semantic.red
--radius-pill            ->  Radius.pill
--type-body-size         ->  TypeScale.Body.size
```

No three-level names, no per-component tokens. A component that needs a value
not in this list gets the value added here first — **no component may use a
colour literal.**

---

## Brand

| Token | Value | Sampled where |
| --- | --- | --- |
| `--color-brand-olive` | `#91A95A` | Ref 3 canvas; 38.9% of all pixels in the image |
| `--color-brand-lime` | `#91BF22` | Ref 1 vivid accent, top of hero gradient |
| `--color-brand-lime-button` | `#92C323` | Ref 1 shutter / CTA circle fill |
| `--color-brand-green-mid` | `#8BC952` | Ref 3 score badge fill |
| `--color-brand-green-soft` | `#8CC570` | Ref 3 selected-card ring |
| `--color-brand-green-deep` | `#265311` | Ref 1 icon strokes drawn on light green. Inverts in dark (strokes then sit on dark). |
| `--color-brand-green-dark` | `#587519` | Ref 1 hero gradient terminus |
| `--color-ink-on-lime` | `#265311` | **Designed.** Ink on a lime fill. Lime-button stays bright in both themes, so this does not invert with `--color-brand-green-deep`. |
| `--gradient-hero` | `linear-gradient(180deg, #91BF22, #587519)` | Ref 1 hero, sampled top and bottom |
| `--gradient-chat` | `linear-gradient(120deg, #EEEFBA, #D2E8C5)` | Ref 2 AI-chat panel, over white |

`--color-brand-lime` and `--color-brand-lime-button` differ by 1–2 per
channel. They are kept apart because they are different components in the
reference, and collapsing them would hide that the shutter was drawn
separately.

## Surfaces

| Token | Value | Sampled where |
| --- | --- | --- |
| `--color-surface-canvas-olive` | `#91A95A` | Ref 3 full-bleed canvas (same ink as brand olive) |
| `--color-surface-page` | `#F6F5F8` | Ref 2 page background — cool grey option |
| `--color-surface-cream` | `#EDF1E5` | Refs 1+3 page background — warm cream option |
| `--color-surface-cream-alt` | `#EAEEDF` | Second cream step, ref 3 nested sections |
| `--color-surface-card` | `#FFFFFF` | All refs, card fill |
| `--color-surface-chip` | `#ECF5E7` | Ref 3 chip / tag fill |
| `--color-surface-canvas-sage` | `#E7ECDF` | Ref 3 sage section background |
| `--color-surface-scrim` | `#BDCB9D` | Ref 1 olive beneath ~55% white overlay |
| `--color-surface-page-default` | → `--color-surface-cream` | **Decision 3 alias.** Not sampled; selects one of the two above |

## Text — one neutral ramp

| Token | Value | Sampled where |
| --- | --- | --- |
| `--color-text-primary` | `#000000` | Glyph cores across all refs are genuinely pure black |
| `--color-text-secondary` | `#666666` | Ref 2 secondary rows |
| `--color-text-tertiary` | `#8E8F91` | Ref 2 captions / metadata |
| `--color-text-on-dark` | `#FFFFFF` | Text on olive and on the near-black buttons |
| `--color-text-lime-on-dark` | `#C9E066` | Ref 1 lime label on near-black |

See finding 3: no per-surface variants.

## Near-blacks

Three values, three jobs. The differences are deliberate and visible side by
side; collapsing them to `#000` loses the blue tint that makes the primary
button read as an object rather than a hole.

| Token | Value | Sampled where |
| --- | --- | --- |
| `--color-ink-button` | `#232830` | Ref 1 primary button fill — blue-tinted slate, **not** black |
| `--color-ink-pill` | `#000000` | Ref 3 badge pills — true black |
| `--color-ink-chip` | `#141316` | Ref 1 chip fill — warm near-black |

## Semantic (traffic light)

The most important colours in the app: they are the answer the user came for,
read at arm's length under supermarket lighting.

| Token | Value | Sampled where |
| --- | --- | --- |
| `--color-semantic-red` | `#E5484D` | **Designed, pending decision.** Existing codebase red; alt `#D9463C` |
| `--color-semantic-orange` | `#E68617` | Exact — 57px stable plateau in the ref 2 Sugar progress bar |
| `--color-semantic-amber` | `#EEB237` | Ref 2 mid-range bar |
| `--color-semantic-yellow` | `#EBDE4E` | Exact — ref 2 progress bar |
| `--color-semantic-green` | `#90C077` | Exact — ref 2 progress bar |
| `--color-semantic-green-vivid` | `#85CF3B` | Ref 3 positive indicator |
| `--color-semantic-blue` | `#4BA0EC` | Ref 2 informational accent (only blue in any ref) |
| `--color-semantic-track` | `#D5D7D4` | Exact — unfilled portion of the ref 2 progress bar |
| `--color-semantic-unknown` | `#8E8F91` | **Designed** — derived from the text ramp; no unknown state exists in the refs |

Tinted pairs, for verdict cards and rows. Each is its semantic colour at
**12% over `--color-surface-card`**, computed rather than sampled — the
references had no tinted verdict cards.

| Token | Value |
| --- | --- |
| `--color-semantic-red-bg` | `#FCE9EA` |
| `--color-semantic-orange-bg` | `#FCF0E3` |
| `--color-semantic-amber-bg` | `#FDF6E7` |
| `--color-semantic-yellow-bg` | `#FDFBEA` |
| `--color-semantic-green-bg` | `#F2F7EF` |
| `--color-semantic-green-vivid-bg` | `#F0F9E8` |
| `--color-semantic-blue-bg` | `#E9F4FD` |
| `--color-semantic-unknown-bg` | `#F1F2F2` |

`--color-semantic-green-bg` (`#F2F7EF`) is close to but not the same as
`--color-surface-chip` (`#ECF5E7`); the chip is a sampled component fill, the
tint is a computed card fill.

## Scanner

| Token | Value | Sampled where |
| --- | --- | --- |
| `--color-scanner-bracket` | `#B0D05E` | Ref 1 viewfinder corner brackets, core of the stroke |

## Type

Every measured element in the references landed within **±1.1pt of a stock
iOS size**, so this is the native scale, not a custom ramp. Nothing in the
references is Light or Thin — the lightest weight anywhere is Regular.

`--type-font-family` stays `-apple-system, BlinkMacSystemFont, "Segoe UI",
system-ui, sans-serif`. That resolves to SF Pro on the target device, which
is why there is no web font — and a web font would need a build step this
project does not have.

1pt ≈ 1px here; rem is relative to a 16px root, so 17pt = 1.0625rem.

| Role | Size | rem | Weight | Line height |
| --- | --- | --- | --- | --- |
| `display` | 64pt | `4rem` | 700 Bold | 1.05 |
| `display-s` | 40pt | `2.5rem` | 700 Bold | 1.1 |
| `large-title` | 34pt | `2.125rem` | 700 Bold | 1.15 |
| `title1` | 28pt | `1.75rem` | 700 Bold | 1.2 |
| `title2` | 22pt | `1.375rem` | 700 Bold | 1.25 |
| `title3` | 20pt | `1.25rem` | 600 Semibold | 1.25 |
| `headline` | 17pt | `1.0625rem` | 600 Semibold | 1.3 |
| `body` | 17pt | `1.0625rem` | 400 Regular | 1.45 |
| `callout` | 16pt | `1rem` | 400 Regular | 1.4 |
| `subhead` | 15pt | `0.9375rem` | 400 Regular (+600 variant) | 1.4 |
| `footnote` | 13pt | `0.8125rem` | 400 Regular | 1.35 |
| `caption1` | 12pt | `0.75rem` | 400 Regular | 1.3 |
| `caption2` | 11pt | `0.6875rem` | 600 Semibold | 1.25 |

Token names follow `--type-<role>-size`, `--type-<role>-weight`,
`--type-<role>-line`, plus the raw weights `--type-weight-regular` /
`-semibold` / `-bold` and `--type-subhead-weight-strong`.

### `--type-input-size: 1rem` — a hard floor, not a preference

| Token | Value |
| --- | --- |
| `--type-input-size` | `1rem` (16px minimum) |
| `--type-input-line` | `1.45` |

iOS Safari zooms the viewport in when a text field smaller than 16px takes
focus, and it does not zoom back out. That turns a one-handed scan in an
aisle into a two-handed pinch-to-fix. `.scanner__input` must use
`--type-input-size` and never a type-role token, because a role token could
legitimately be tuned below 16px later. This preserves the reasoning behind
the bare `font-size: 1rem` comment that was at `styles.css:90`.

## Spacing

4pt base. The measured anchors in the references were 20 / 24 / 32 / 60pt.

| Token | Value | Sampled where |
| --- | --- | --- |
| `--space-1` | `4px` | Base unit |
| `--space-2` | `8px` | |
| `--space-3` | `12px` | |
| `--space-4` | `16px` | |
| `--space-5` | `20px` | Measured: button horizontal inset |
| `--space-6` | `24px` | Measured: card inset from screen edge |
| `--space-8` | `32px` | Measured: sheet content padding |
| `--space-10` | `40px` | |
| `--space-12` | `48px` | |

## Control heights

| Token | Value | Sampled where |
| --- | --- | --- |
| `--control-height-primary` | `60px` | Measured 61.4pt in ref 1 |
| `--control-height-min` | `44px` | Apple HIG minimum touch target — not sampled |

The app previously used a 52px minimum. The reference is more generous and
that is the better answer for someone holding a trolley in one hand.

## Radius

Buttons, chips, badges and progress bars are **all full pills** in the
references. Confirmed visually on 3x corner crops: unambiguous stadiums,
radius = height / 2. Not "very rounded rectangles".

| Token | Value |
| --- | --- |
| `--radius-xs` | `8px` |
| `--radius-sm` | `12px` |
| `--radius-md` | `16px` |
| `--radius-lg` | `20px` |
| `--radius-xl` | `28px` |
| `--radius-sheet` | `32px` |
| `--radius-pill` | `9999px` |

Components reference only the aliases, which is what makes Decision 2 a
five-line edit:

| Alias | Generous (current, refs 1+3) | Tight (ref 2) |
| --- | --- | --- |
| `--radius-card` | `--radius-lg` (20) | `--radius-xs` (8) |
| `--radius-card-lg` | `--radius-xl` (28) | `--radius-sm` (12) |
| `--radius-surface-sheet` | `--radius-sheet` (32) | `--radius-md` (16) |
| `--radius-input` | `--radius-md` (16) | `--radius-sm` (12) |
| `--radius-control` | `--radius-pill` | `--radius-pill` |
| `--radius-chip` | `--radius-pill` | `--radius-pill` |

Pills stay pills either way — both reference systems agree on that.

## Elevation

See finding 4. `--elevation-0` is the default for everything.

| Token | Value | Use |
| --- | --- | --- |
| `--elevation-0` | `none` | **Default for everything** |
| `--elevation-1` | `0 1px 3px rgba(35,40,48,0.05)` | Only where white genuinely sits on white |
| `--elevation-2` | `0 4px 16px rgba(35,40,48,0.08)` | Modals and sheets floating over content |
| `--elevation-focus` | `0 0 0 3px #8CC570` | The references' actual "elevated" treatment |
| `--elevation-button` | `0 6px 28px` slate at 18% | Soft grey elevation on white and black/slate button fills |
| `--elevation-button-green` | `0 6px 28px` lime-button at 42% | Soft green elevation on lime/green button fills |

## Borders

| Token | Value | Sampled where |
| --- | --- | --- |
| `--color-border-selected` | `#8CC570` | Ref 3 featured-card ring (same as brand green-soft) |
| `--border-width-selected` | `3px` | Measured as an 8px band at collage scale |
| `--border-selected` | `3px solid #8CC570` | Shorthand |
| `--color-border-hairline` | `rgba(35,40,48,0.08)` | Not sampled — no rules exist in the refs |
| `--border-hairline` | `1px solid rgba(35,40,48,0.08)` | Provided; near-zero use expected |

---

## Dark mode

The system is **light-first**. All three references are light, so every dark
value is **designed, not sampled**: the same hues, dimmed where they would
glow and lifted where they would disappear.

Only colour tokens change. Type, spacing, radii and control heights are
identical in the dark, because the hand holding the phone is the same.

| Token | Light | Dark |
| --- | --- | --- |
| `--color-brand-olive` | `#91A95A` | `#6E8143` |
| `--color-brand-lime` | `#91BF22` | `#A7D42F` |
| `--color-brand-lime-button` | `#92C323` | `#A8D830` |
| `--color-brand-green-mid` | `#8BC952` | `#79B345` |
| `--color-brand-green-soft` | `#8CC570` | `#7FB765` |
| `--color-brand-green-deep` | `#265311` | `#CDE8A3` (inverted — strokes now sit on dark) |
| `--color-brand-green-dark` | `#587519` | `#425713` |
| `--color-ink-on-lime` | `#265311` | `#265311` (lime fill stays bright) |
| `--gradient-hero` | `#91BF22 → #587519` | `#6D8F1A → #425713` |
| `--gradient-chat` | `#EEEFBA → #D2E8C5` | `#2A2C1F → #1E2A20` |
| `--color-surface-canvas-olive` | `#91A95A` | `#46522C` |
| `--color-surface-page` | `#F6F5F8` | `#14161A` |
| `--color-surface-cream` | `#EDF1E5` | `#171A15` |
| `--color-surface-cream-alt` | `#EAEEDF` | `#1C1F19` |
| `--color-surface-card` | `#FFFFFF` | `#1E2128` |
| `--color-surface-chip` | `#ECF5E7` | `#20291C` |
| `--color-surface-canvas-sage` | `#E7ECDF` | `#1C211A` |
| `--color-surface-scrim` | `#BDCB9D` | `#2A3120` |
| `--color-text-primary` | `#000000` | `#F6F5F8` |
| `--color-text-secondary` | `#666666` | `#A9ABAF` |
| `--color-text-tertiary` | `#8E8F91` | `#7C7E82` |
| `--color-ink-button` | `#232830` | `#2C323C` |
| `--color-ink-pill` | `#000000` | `#000000` |
| `--color-ink-chip` | `#141316` | `#24232A` |
| `--color-semantic-red` | `#E5484D` | `#FF6369` |
| `--color-semantic-orange` | `#E68617` | `#F59B2B` |
| `--color-semantic-amber` | `#EEB237` | `#F2BE4C` |
| `--color-semantic-yellow` | `#EBDE4E` | `#EFE469` |
| `--color-semantic-green` | `#90C077` | `#A5D189` |
| `--color-semantic-green-vivid` | `#85CF3B` | `#9BDD58` |
| `--color-semantic-blue` | `#4BA0EC` | `#6FB6F2` |
| `--color-semantic-track` | `#D5D7D4` | `#3A3F45` |
| `--color-semantic-unknown` | `#8E8F91` | `#9EA0A4` |
| `--color-semantic-red-bg` | `#FCE9EA` | `#3A1F23` |
| `--color-semantic-orange-bg` | `#FCF0E3` | `#3A2A19` |
| `--color-semantic-amber-bg` | `#FDF6E7` | `#3B321F` |
| `--color-semantic-yellow-bg` | `#FDFBEA` | `#3B3A23` |
| `--color-semantic-green-bg` | `#F2F7EF` | `#2A352B` |
| `--color-semantic-green-vivid-bg` | `#F0F9E8` | `#283720` |
| `--color-semantic-blue-bg` | `#E9F4FD` | `#1E2F40` |
| `--color-semantic-unknown-bg` | `#F1F2F2` | `#2A2C2F` |
| `--elevation-1` | `rgba(35,40,48,0.05)` | `rgba(0,0,0,0.40)` |
| `--elevation-2` | `rgba(35,40,48,0.08)` | `rgba(0,0,0,0.50)` |
| `--elevation-button` | slate at 18% | `rgba(0,0,0,0.50)` |
| `--elevation-button-green` | lime-button at 42% | lime-button at 48% |
| `--color-border-selected` | `#8CC570` | `#7FB765` |
| `--color-border-hairline` | `rgba(35,40,48,0.08)` | `rgba(255,255,255,0.10)` |

Dark tints are each semantic colour at **18% over the dark page** `#14161A`.
The dark page keeps the `#14161A` the app already shipped, which is also the
colour the existing PNG app icons were drawn against.

`--color-text-on-dark` (`#FFFFFF`), `--color-text-lime-on-dark` (`#C9E066`)
and `--color-scanner-bracket` (`#B0D05E`) are unchanged in the dark; they were
already colours meant for a dark ground.

---

## Pending decisions

| # | Question | Default shipped | Where to change it |
| --- | --- | --- | --- |
| 1 | Red: `#E5484D` (existing) vs `#D9463C` (brick) | `#E5484D`, marked `PENDING USER DECISION` | `--color-semantic-red`, one line |
| 2 | Radius: generous (refs 1+3) vs tight (ref 2) | Generous | The six radius aliases |
| 3 | Page background: cream `#EDF1E5` vs cool grey `#F6F5F8` | Cream | `--color-surface-page-default`, one line — **plus** the `theme-color` literal in `index.html` and `background_color`/`theme_color` in `manifest.webmanifest`, which cannot read custom properties |
| 4 | Gauge | Out of scope for this layer | — |

## Known mismatch

`icons/icon-192.png` and `icons/icon-512.png` are dark traffic-light artwork,
drawn to pair with the old `#14161a` splash screen. The manifest's
`background_color` and `theme_color` are now cream, so the PWA splash shows
dark artwork on a light ground. The PNGs were deliberately left alone — they
need regenerating as a separate piece of work.
