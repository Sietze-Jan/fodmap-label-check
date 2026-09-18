/* =====================================================================
 * gauge.js — THE DOTTED-ARC SCORE GAUGE
 * =====================================================================
 *
 * The signature element of the reference screens: a score dial drawn not
 * as a stroked ring but as a field of small dots, the colour running
 * orange -> yellow -> green around the arc.
 *
 * Geometry, measured off the reference gauge at 3x:
 *
 *   ring band   24% of the gauge diameter    (r 46 -> r 22.4 on a 100 box)
 *   dot size    2.8% of the diameter         (r 1.4)
 *   6 concentric rings, alternate rings offset by half a step
 *   ~196 dots on the open arc, ~260 on the closed ring
 *
 * The band width is exactly the 24% the spec calls for. Two numbers are
 * deliberately off it: the dot is 2.8% rather than 2.4% and there are
 * ~196 dots rather than ~150, both because the reference field is denser
 * than the written spec and at 2.4%/150 the arc reads as a scatter of
 * spots instead of as a halftone.
 *
 * The half-step offset between neighbouring rings is the whole trick. A
 * dot field with every ring starting at the same angle collapses into
 * radial spokes the moment two rings share a divisor — which at these
 * counts is most of the time. Brick-laying them kills it outright.
 *
 * ---------------------------------------------------------------------
 * WHY AN <svg> OF <circle>s AND NOT DIVS
 * ---------------------------------------------------------------------
 * 150 positioned divs is 150 boxes for the compositor and 150 nodes in
 * the accessibility tree. One <svg> is a single element with 150 cheap
 * children, scales to any size from the same markup, and costs one line
 * of CSS to recolour.
 *
 * ---------------------------------------------------------------------
 * WHY THE DOTS CARRY CLASSES AND NOT FILLS
 * ---------------------------------------------------------------------
 * The colour ramp is a design decision and design decisions live in
 * tokens. If this file wrote `fill="#E68617"` it would have smuggled a
 * colour literal past the token system — the exact drift `tokens.css`
 * exists to prevent. So every dot gets `.ds-gauge__dot--s0` .. `--s11`,
 * and `components.css` interpolates those eleven steps out of
 * --color-semantic-orange / -yellow / -green with color-mix().
 *
 * ---------------------------------------------------------------------
 * USING IT
 * ---------------------------------------------------------------------
 *   import { gauge, gaugeDiscrete, gaugeShares } from './gauge.js';
 *
 *   el.innerHTML =
 *     `<div class="ds-gauge">` +
 *       gaugeShares({ green: 5, amber: 2, red: 1 }, { variant: 'ring' }) +
 *       `<div class="ds-gauge__centre">` +
 *         `<span class="ds-gauge__centre-word ds-text-red">Avoid</span>` +
 *       `</div>` +
 *     `</div>`;
 *
 * The centre label is HTML rather than <text> on purpose: inside the SVG
 * it could not use the type tokens, and a number that ignores the type
 * scale is the one thing on the card you actually read.
 * ===================================================================== */

/** Number of colour steps around the arc. Must match components.css. */
export const GAUGE_STOPS = 12;

const BAND_INNER = 22.4;
const BAND_OUTER = 46;
const RING_COUNT = 6;
const DOT_RADIUS = 1.4;

/* Arc-length between neighbouring dots, inner ring to outer. It grows,
 * so the field thins out toward the rim — the "density falling off
 * outward" in the spec — while staying an even 2D texture rather than a
 * set of spokes. */
const PITCH_INNER = 4.2;
const PITCH_OUTER = 5.6;

/* SVG angles: 0 is 3 o'clock, 90 is 6 o'clock, y pointing down.
 *
 * The open "C" has its gap on the RIGHT, matching the references: the
 * score sits in the notch. It starts at the bottom-right (orange) and
 * runs clockwise along the bottom, up the left and over the top, so the
 * green end of the ramp finishes at the top-right — next to the number,
 * the way the reference C is painted. The closed ring starts at 12
 * o'clock, where a clock would put it. */
const VARIANTS = {
  arc: { start: 45, sweep: 270 },
  ring: { start: -90, sweep: 360 },
};

/* Radius, dot count and half-step offset for each ring of a given
 * sweep. Counts are derived from arc length rather than written down, so
 * the ring and the arc variants have the same texture. */
function ringsFor(sweepDegrees) {
  const sweep = (Math.abs(sweepDegrees) * Math.PI) / 180;
  const rings = [];

  for (let i = 0; i < RING_COUNT; i += 1) {
    const f = i / (RING_COUNT - 1);
    const r = BAND_INNER + f * (BAND_OUTER - BAND_INNER);
    const pitch = PITCH_INNER + f * (PITCH_OUTER - PITCH_INNER);
    rings.push({
      r,
      count: Math.max(3, Math.round((sweep * r) / pitch)),
      offset: (i % 2) * 0.5,
    });
  }

  return rings;
}

/* Trim to 3 decimals: enough for a 100-unit box scaled to 320px, and it
 * keeps the markup readable when you inspect it. */
const round = (n) => Math.round(n * 1000) / 1000;

/**
 * gauge(value, opts) -> SVG markup as a string.
 *
 * value  0..1, the fraction of the arc that is "reached". Dots past it
 *        are drawn in --color-semantic-track rather than hidden, because
 *        the empty part of the dial is what gives the full part a scale.
 *
 * opts.variant   'arc' (open C, default) | 'ring' (closed)
 * opts.className extra classes on the <svg>
 * opts.label     accessible name; without it the svg is aria-hidden
 * opts.monotone  true to drop the colour ramp and let the dots inherit
 *                currentColor — used by the discrete verdict dials
 */
export function gauge(value = 1, opts = {}) {
  const variant = VARIANTS[opts.variant] || VARIANTS.arc;
  const filled = Math.min(1, Math.max(0, Number(value) || 0));

  const classes = ['ds-gauge__svg'];
  if (opts.monotone) classes.push('ds-gauge__svg--monotone');
  if (opts.className) classes.push(opts.className);

  const dots = [];
  for (const ring of ringsFor(variant.sweep)) {
    for (let i = 0; i < ring.count; i += 1) {
      /* The half-step inset also keeps the first dot off the cut edge of
       * the arc, which would otherwise give the C a comb-tooth end. */
      const t = (i + 0.5 + ring.offset) / ring.count;
      if (t > 1) continue;

      const on = t <= filled;
      const step = Math.round(t * (GAUGE_STOPS - 1));
      const state = on ? `ds-gauge__dot--s${step}` : 'ds-gauge__dot--off';

      dots.push(dot(ring.r, t, variant, state));
    }
  }

  return svgWrap(classes, dots.join(''), opts);
}

/**
 * gaugeDiscrete(level, opts) -> SVG markup as a string.
 *
 * The honest dial for THIS app. See the note in README of the design
 * system page: a continuous 0..10 arc implies a precision the FODMAP
 * classifier does not have — it answers in four buckets, not in scores.
 *
 * level  'red' | 'amber' | 'green' | 'unknown'
 *
 * Three fixed segments of the same arc, all drawn, with the one that
 * applies at full strength and the other two dimmed. The eye reads
 * "second of three" instantly and cannot read a false decimal into it.
 */
const LEVELS = ['red', 'amber', 'green'];

export function gaugeDiscrete(level = 'unknown', opts = {}) {
  const variant = VARIANTS[opts.variant] || VARIANTS.arc;
  const active = LEVELS.indexOf(level);

  const classes = ['ds-gauge__svg', 'ds-gauge__svg--discrete'];
  if (opts.className) classes.push(opts.className);

  /* A 6% gap between segments, in fractions of the sweep. */
  const gap = 0.06;
  const span = (1 - gap * (LEVELS.length - 1)) / LEVELS.length;

  const dots = [];
  const rings = ringsFor(variant.sweep);

  LEVELS.forEach((name, index) => {
    const from = index * (span + gap);
    const state = active === index ? `ds-gauge__dot--${name}` : 'ds-gauge__dot--off';

    for (const ring of rings) {
      /* Same pitch as the continuous gauge, so the two variants can sit
       * side by side without one looking coarser than the other. */
      for (let i = 0; i < ring.count; i += 1) {
        const t = (i + 0.5 + ring.offset) / ring.count;
        if (t < from || t > from + span) continue;
        dots.push(dot(ring.r, t, variant, state));
      }
    }
  });

  return svgWrap(classes, dots.join(''), opts);
}

/**
 * gaugeShares(shares, opts) -> SVG markup as a string.
 *
 * A dotted donut of the same geometry as gauge(). Each share paints a
 * wedge; together they fill the ring. Values are relative weights —
 * ingredient counts, grams, or percents — and are normalised so the
 * painted wedges sum to the full sweep. Zero shares are omitted.
 * If every share is 0 the dots stay on the grey track: that is the
 * can't-read state, not a fake unknown wedge.
 *
 * shares.green / .amber / .red / .unknown
 *        (`.yellow` is accepted as an alias of `.amber`)
 * opts.variant  'arc' | 'ring'  (default 'ring')
 * opts.gap      dark fraction between wedges (default 0.02)
 *
 * The centre label is HTML (Eat / Limit / Avoid), not part of this SVG.
 */
const SHARE_KEYS = [
  { key: 'green', state: 'ds-gauge__dot--green' },
  { key: 'amber', state: 'ds-gauge__dot--amber' },
  { key: 'red', state: 'ds-gauge__dot--red' },
  { key: 'unknown', state: 'ds-gauge__dot--unknown' },
];

function shareValue(shares, key) {
  const raw = key === 'amber' ? (shares.amber ?? shares.yellow) : shares[key];
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function shareRanges(shares, gap) {
  const values = SHARE_KEYS.map((entry) => ({
    ...entry,
    value: shareValue(shares, entry.key),
  }));
  const painted = values.filter((entry) => entry.value > 0);
  if (painted.length === 0) return [];

  const total = painted.reduce((sum, entry) => sum + entry.value, 0);
  if (total <= 0) return [];

  const parts = painted.map((entry) => ({
    ...entry,
    frac: entry.value / total,
  }));

  const gapCount = parts.length > 1 ? parts.length : 0;
  const gapTotal = Math.min(0.4, gap * gapCount);
  const available = 1 - gapTotal;
  const scale = available;

  const ranges = [];
  let t = 0;
  parts.forEach((part, i) => {
    const span = part.frac * scale;
    ranges.push({ state: part.state, from: t, to: t + span });
    t += span;
    if (i < gapCount) t += gapTotal / gapCount;
  });
  return ranges;
}

function stateAt(t, ranges) {
  for (const range of ranges) {
    if (t >= range.from && t < range.to) return range.state;
  }
  return 'ds-gauge__dot--off';
}

export function gaugeShares(shares = {}, opts = {}) {
  const variant = VARIANTS[opts.variant] || VARIANTS.ring;
  const gap = opts.gap == null ? 0.02 : Math.max(0, Number(opts.gap) || 0);
  const ranges = shareRanges(shares, gap);

  const classes = ['ds-gauge__svg', 'ds-gauge__svg--shares'];
  if (opts.className) classes.push(opts.className);

  const dots = [];
  for (const ring of ringsFor(variant.sweep)) {
    for (let i = 0; i < ring.count; i += 1) {
      const t = (i + 0.5 + ring.offset) / ring.count;
      if (t > 1) continue;
      const state = ranges.length ? stateAt(t, ranges) : 'ds-gauge__dot--off';
      if (state === 'ds-gauge__dot--off' && ranges.length) continue;
      dots.push(dot(ring.r, t, variant, state));
    }
  }

  return svgWrap(classes, dots.join(''), opts);
}

/* One dot, placed at fraction `t` along the variant's sweep. */
function dot(r, t, variant, state) {
  const angle = ((variant.start + t * variant.sweep) * Math.PI) / 180;
  const cx = round(50 + r * Math.cos(angle));
  const cy = round(50 + r * Math.sin(angle));
  return `<circle class="ds-gauge__dot ${state}" cx="${cx}" cy="${cy}" r="${DOT_RADIUS}"/>`;
}

const escapeAttr = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function svgWrap(classes, body, opts) {
  const a11y = opts.label
    ? ` role="img" aria-label="${escapeAttr(opts.label)}"`
    : ' aria-hidden="true"';

  return (
    `<svg class="${classes.join(' ')}" viewBox="0 0 100 100" ` +
    `fill="currentColor" stroke="none" focusable="false"${a11y}>${body}</svg>`
  );
}

/**
 * Same thing as a real <svg> element, for code that appends nodes.
 * Mirrors iconElement() in icons.js so the two helpers are interchangeable
 * at the call site.
 */
export function gaugeElement(value, opts = {}) {
  const holder = document.createElement('template');
  holder.innerHTML = gauge(value, opts);
  return holder.content.firstElementChild;
}
