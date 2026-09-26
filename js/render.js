/* =====================================================================
 * render.js — TURNS AN ANALYSIS RESULT INTO DOM
 * =====================================================================
 *
 * This is the only module that fills the results sheet. It takes the
 * plain object returned by analyse() and builds design-system markup:
 * a .ds-verdict card first (High risk / Watch / Low risk), then grouped
 * ingredient lists.
 *
 * Nothing here decides what is safe to eat — that all lives in
 * ingredients.js and analyse.js. If a verdict looks wrong, fix the data,
 * not this file.
 *
 * Analyser buckets stay red / yellow / green / unrecognised. The design
 * system names the middle state "amber" and paints the high state with
 * the red token. Mapping happens only here.
 *
 * The overall card is a presence rating, not a serving-size rating.
 * Unknown tokens block a Low risk call. Gram limits stay in Monash.
 *
 * ===================================================================== */

import { iconElement } from './icons.js';

const VERDICTS = {
  red: {
    tone: 'red',
    icon: 'close',
    title: 'High risk',
    subtitle: 'Contains high-FODMAP ingredients.',
  },
  yellow: {
    tone: 'amber',
    icon: 'warning-triangle',
    title: 'Watch',
    subtitle: 'Check the green serve in the Monash app.',
  },
  green: {
    tone: 'green',
    icon: 'check',
    title: 'Low risk',
    subtitle: 'No high-FODMAP ingredients recognised.',
  },
  incomplete: {
    tone: 'unknown',
    icon: 'question-circle',
    title: 'Not sure yet',
    subtitle: 'Some ingredients aren’t in the list — treat them as unknown.',
  },
  unreadable: {
    tone: 'unknown',
    icon: 'question-circle',
    title: 'Can’t read the label',
    subtitle: 'Take the photo again: closer, flatter, and with more light.',
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

/* Overall card state. Unknown tokens must not look like a pass, even
 * when every recognised ingredient is green. */
export function displayVerdict(result) {
  if (!result || result.status === 'unreadable') return 'unreadable';
  if (result.red.length) return 'red';
  if (result.yellow.length) return 'yellow';
  if (result.unrecognised.length) return 'incomplete';
  return 'green';
}

/* Red is two different pieces of advice: concentrated triggers versus
 * foods that are high in a typical serve but may be fine in a smaller
 * amount. alwaysFlag is the analyser’s existing pinch-amount marker. */
export function splitRed(items) {
  const pinch = [];
  const serve = [];
  for (const item of items || []) {
    if (item.alwaysFlag) pinch.push(item);
    else serve.push(item);
  }
  return { pinch, serve };
}

/* Small helper so we never build HTML from label text by concatenation. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildVerdict(spec) {
  const card = el('div', `ds-verdict ds-verdict--${spec.tone}`);
  card.setAttribute('role', 'status');

  const iconWrap = el('span', 'ds-verdict__icon');
  iconWrap.setAttribute('aria-hidden', 'true');
  iconWrap.appendChild(iconElement(spec.icon, { size: 'md' }));
  card.appendChild(iconWrap);

  const body = el('div', 'ds-verdict__body');
  body.appendChild(el('p', 'ds-verdict__title', spec.title));
  body.appendChild(el('p', 'ds-verdict__subtitle', spec.subtitle));
  card.appendChild(body);
  return card;
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
  const key = displayVerdict(result);
  const spec = VERDICTS[key];

  container.appendChild(buildVerdict(spec));

  if (key === 'unreadable') {
    if (rawText) container.appendChild(buildRawText(rawText));
    return;
  }

  const { pinch, serve } = splitRed(result.red);

  if (pinch.length) {
    container.appendChild(
      buildGroup({
        tone: 'red',
        titleClass: 'ds-text-red',
        heading: 'Triggers in tiny amounts',
        items: pinch,
        note: 'Skip during elimination — even a pinch still counts.',
      })
    );
  }

  if (serve.length) {
    container.appendChild(
      buildGroup({
        tone: 'red',
        titleClass: 'ds-text-red',
        heading: 'High in a normal serve',
        items: serve,
        note: 'Look it up in Monash for a smaller green serve.',
      })
    );
  }

  if (result.yellow.length) {
    container.appendChild(
      buildGroup({
        tone: 'amber',
        titleClass: 'ds-text-amber',
        heading: 'Watch the portion',
        items: result.yellow,
        note: 'Check the green serve in the Monash app — the only place with lab-tested limits.',
      })
    );
  }

  if (result.green.length) {
    container.appendChild(
      buildGroup({
        tone: 'green',
        titleClass: 'ds-text-green',
        heading: 'Typically fine',
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
