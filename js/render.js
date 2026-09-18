/* =====================================================================
 * render.js — TURNS AN ANALYSIS RESULT INTO DOM
 * =====================================================================
 *
 * This is the only module that fills the results sheet. It takes the
 * plain object returned by analyse() and builds design-system markup:
 * the share gauge first, then grouped ingredient lists.
 *
 * Nothing here decides what is safe to eat — that all lives in
 * ingredients.js and analyse.js. If a verdict looks wrong, fix the data,
 * not this file.
 *
 * Analyser buckets stay red / yellow / green / unrecognised. The design
 * system names the middle state "amber" and paints the high state with
 * the red token (orange is the sampled progress-bar high, used as the
 * amber icon ink). Mapping happens only here.
 *
 * ===================================================================== */

import { iconElement } from './icons.js';
import { gaugeShares } from './gauge.js';

const VERDICTS = {
  red: {
    gauge: 'red',
    caption: 'Avoid',
    captionClass: 'ds-text-red',
    title: 'Avoid',
  },
  yellow: {
    gauge: 'amber',
    caption: 'Limit',
    captionClass: 'ds-text-amber',
    title: 'Limit',
  },
  green: {
    gauge: 'green',
    caption: 'Eat',
    captionClass: 'ds-text-green',
    title: 'Eat',
  },
  unknown: {
    gauge: 'unknown',
    title: 'Can’t read the label',
    subtitle:
      'Take the photo again: closer, flatter, and with more light. Aim at the ingredient list on the back, not the front of the pack.',
  },
};

const COUNT_BUCKETS = [
  { key: 'red', label: 'Avoid' },
  { key: 'yellow', label: 'Limit' },
  { key: 'green', label: 'Eat' },
  { key: 'unrecognised', label: 'Unknown', optional: true },
];

/* Plain-text Avoid / Limit / Eat counts from analyser buckets. Always
 * includes the three main buckets — even at 0 — and appends Unknown
 * only when that bucket is non-empty. Unreadable results never call
 * this. Kept as a helper for tests; the sheet no longer renders it. */
export function bucketCountSubtitle(result) {
  const parts = [];
  for (const bucket of COUNT_BUCKETS) {
    const n = result[bucket.key].length;
    if (bucket.optional && n === 0) continue;
    parts.push(`${n} ${bucket.label}`);
  }
  return parts.join(', ');
}

/* Eat / Limit / Avoid counts for gaugeShares(). Unknown is omitted so
 * unrecognised tokens cannot stretch the ring. Unreadable results are
 * all zeros — the dial then stays on the grey track. */
export function bucketShares(result) {
  return {
    green: result.green.length,
    amber: result.yellow.length,
    red: result.red.length,
  };
}

/* Small helper so we never build HTML from label text by concatenation. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function shareLabel(spec, shares) {
  return `${spec.title}. ${shares.red} Avoid, ${shares.amber} Limit, ${shares.green} Eat`;
}

function buildCentre(spec) {
  const centre = el('div', 'ds-gauge__centre');
  if (spec.gauge === 'unknown') {
    const dot = el('span', 'ds-gauge__centre-dot');
    dot.setAttribute('aria-hidden', 'true');
    centre.appendChild(dot);
    return centre;
  }
  const wordClass = spec.captionClass
    ? `ds-gauge__centre-word ${spec.captionClass}`
    : 'ds-gauge__centre-word';
  centre.appendChild(el('span', wordClass, spec.caption));
  return centre;
}

function buildGauge(spec, shares) {
  const row = el('div', 'results-gauge');
  const wrap = el('div', 'ds-gauge');
  const painted = shares || { green: 0, amber: 0, red: 0 };

  wrap.innerHTML = gaugeShares(painted, {
    variant: 'ring',
    label: shares ? shareLabel(spec, painted) : spec.title,
  });
  wrap.appendChild(buildCentre(spec));
  row.appendChild(wrap);
  return row;
}

function buildUnreadNote(spec) {
  const note = el('div', 'results-unread');
  note.appendChild(el('p', 'ds-headline', spec.title));
  note.appendChild(el('p', 'ds-footnote ds-text-secondary', spec.subtitle));
  return note;
}

function buildIngredientRow(item, tone) {
  const row = el('li', tone ? `ds-ingredient ds-ingredient--${tone}` : 'ds-ingredient');
  row.appendChild(el('span', 'ds-ingredient__dot'));

  const body = el('span', 'ds-ingredient__body');
  const label = typeof item === 'string' ? item : item.label;
  body.appendChild(el('span', 'ds-ingredient__name', label));

  if (item && item.reason) {
    body.appendChild(el('span', 'ds-ingredient__reason', item.reason));
  }
  if (item && item.trace && item.alwaysFlag) {
    body.appendChild(el('span', 'ds-ingredient__tag', 'below 2% but still counts'));
  }

  row.appendChild(body);
  return row;
}

function buildGroup({ tone, titleClass, heading, items, note }) {
  const group = el('div', 'ds-list-group');
  group.appendChild(el('p', `ds-list-group__title ${titleClass}`, `${heading} (${items.length})`));
  if (note) group.appendChild(el('p', 'ds-list-group__footer', note));

  const list = el('ul', 'ds-list');
  for (const item of items) {
    list.appendChild(buildIngredientRow(item, tone));
  }
  group.appendChild(list);
  return group;
}

function buildRawText(rawText) {
  const details = el('details', 'ds-collapsible');
  const summary = el('summary', 'ds-collapsible__summary', 'What we read');
  details.appendChild(summary);
  details.appendChild(el('div', 'ds-collapsible__body ds-body ds-text-secondary', rawText));
  return details;
}

function appendNotes(container, result) {
  if (result.traceRuleApplied) {
    container.appendChild(
      el(
        'p',
        'ds-footnote ds-text-secondary',
        'Some ingredients appeared after a “less than 2%” statement and were downgraded. Onion, garlic, chicory and inulin are never downgraded.'
      )
    );
  }

  if (result.suppressedGroups.includes('dairy-milk')) {
    container.appendChild(
      el(
        'p',
        'ds-footnote ds-text-secondary',
        'Milk was not flagged because an aged cheese was found — hard cheeses such as Gruyère and Emmental have very little lactose left.'
      )
    );
  }
}

/* ---------------------------------------------------------------------
 * render(result, container, { rawText }?)
 * ------------------------------------------------------------------- */
export function render(result, container, opts = {}) {
  container.textContent = '';
  container.hidden = false;

  const rawText = (opts.rawText || result.normalisedText || '').trim();

  if (result.status === 'unreadable') {
    const spec = VERDICTS.unknown;
    container.appendChild(buildGauge(spec));
    container.appendChild(buildUnreadNote(spec));
    if (rawText) container.appendChild(buildRawText(rawText));
    return;
  }

  const spec = VERDICTS[result.verdict];
  container.appendChild(buildGauge(spec, bucketShares(result)));

  if (result.verdict === 'yellow') {
    const alert = el('div', 'ds-alert ds-alert--amber');
    const iconWrap = el('span', 'ds-alert__icon');
    iconWrap.appendChild(iconElement('warning-triangle', { size: 'md' }));
    alert.appendChild(iconWrap);
    const body = el('div', 'ds-alert__body');
    body.appendChild(
      el(
        'p',
        'ds-alert__text',
        'Check the portion size for the amber ingredients in the Monash FODMAP app — that is the only place with lab-tested serving limits.'
      )
    );
    alert.appendChild(body);
    container.appendChild(alert);
  }

  if (result.red.length) {
    container.appendChild(
      buildGroup({
        tone: 'red',
        titleClass: 'ds-text-red',
        heading: 'Avoid',
        items: result.red,
      })
    );
  }

  if (result.yellow.length) {
    container.appendChild(
      buildGroup({
        tone: 'amber',
        titleClass: 'ds-text-amber',
        heading: 'Limit',
        items: result.yellow,
        note: 'Moderate, portion-dependent, or a vague term that can hide onion or garlic.',
      })
    );
  }

  if (result.green.length) {
    container.appendChild(
      buildGroup({
        tone: 'green',
        titleClass: 'ds-text-green',
        heading: 'Eat',
        items: result.green,
      })
    );
  }

  if (result.unrecognised.length) {
    container.appendChild(
      buildGroup({
        tone: '',
        titleClass: 'ds-text-unknown',
        heading: 'Unknown',
        items: result.unrecognised,
        note: 'Not in the ingredient list yet — treat as unknown, not as safe.',
      })
    );
  }

  appendNotes(container, result);

  if (rawText) container.appendChild(buildRawText(rawText));
}
