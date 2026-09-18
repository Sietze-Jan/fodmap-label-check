/* =====================================================================
 * render.js — TURNS AN ANALYSIS RESULT INTO DOM
 * =====================================================================
 *
 * This is the only module that touches the result card. It takes the
 * plain object returned by analyse() and builds design-system markup.
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
import { gaugeDiscrete } from './gauge.js';

const VERDICTS = {
  red: {
    className: 'ds-verdict--red',
    icon: 'close',
    gauge: 'red',
    caption: 'Avoid',
    captionClass: 'ds-text-red',
    title: 'Avoid',
  },
  yellow: {
    className: 'ds-verdict--amber',
    icon: 'warning-triangle',
    gauge: 'amber',
    caption: 'Limit',
    captionClass: 'ds-text-amber',
    title: 'Limit',
  },
  green: {
    className: 'ds-verdict--green',
    icon: 'check',
    gauge: 'green',
    caption: 'Eat',
    captionClass: 'ds-text-green',
    title: 'Eat',
  },
  unknown: {
    className: 'ds-verdict--unknown',
    icon: 'question-circle',
    gauge: 'unknown',
    caption: 'Unknown',
    captionClass: 'ds-text-unknown',
    title: 'Can’t read the label',
    subtitle:
      'Take the photo again: closer, flatter, and with more light. Aim at the ingredient list on the back, not the front of the pack.',
  },
};

const COUNT_BUCKETS = [
  { key: 'red', label: 'Avoid', className: 'ds-text-red' },
  { key: 'yellow', label: 'Limit', className: 'ds-text-amber' },
  { key: 'green', label: 'Eat', className: 'ds-text-green' },
  { key: 'unrecognised', label: 'Unknown', className: 'ds-text-unknown', optional: true },
];

/* Plain-text form of the score-card subtitle. Always includes Avoid /
 * Limit / Eat — even at 0 — and appends Unknown only when that bucket
 * is non-empty. Unreadable results never call this. */
export function bucketCountSubtitle(result) {
  const parts = [];
  for (const bucket of COUNT_BUCKETS) {
    const n = result[bucket.key].length;
    if (bucket.optional && n === 0) continue;
    parts.push(`${n} ${bucket.label}`);
  }
  return parts.join(', ');
}

/* Small helper so we never build HTML from label text by concatenation. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildCountSubtitle(result) {
  const p = el('p', 'ds-verdict__subtitle');
  const visible = COUNT_BUCKETS.filter(
    (bucket) => !bucket.optional || result[bucket.key].length
  );
  visible.forEach((bucket, i) => {
    if (i) p.appendChild(document.createTextNode(', '));
    p.appendChild(
      el('span', bucket.className, `${result[bucket.key].length} ${bucket.label}`)
    );
  });
  return p;
}

function buildVerdict(spec, subtitleNode) {
  const card = el('div', `ds-verdict ${spec.className}`);
  const iconWrap = el('span', 'ds-verdict__icon');
  iconWrap.appendChild(iconElement(spec.icon, { size: 'md' }));
  card.appendChild(iconWrap);

  const body = el('div', 'ds-verdict__body');
  body.appendChild(el('p', 'ds-verdict__title', spec.title));
  body.appendChild(subtitleNode || el('p', 'ds-verdict__subtitle', spec.subtitle));
  card.appendChild(body);
  return card;
}

function buildGauge(spec) {
  const row = el('div', 'results-gauge');
  const wrap = el('div', 'ds-gauge');
  wrap.innerHTML = gaugeDiscrete(spec.gauge, { label: spec.title });

  const centre = el('div', 'ds-gauge__centre');
  const captionClass = spec.captionClass
    ? `ds-gauge__caption ds-headline ${spec.captionClass}`
    : 'ds-gauge__caption ds-headline';
  centre.appendChild(el('span', captionClass, spec.caption));
  wrap.appendChild(centre);

  row.appendChild(wrap);
  return row;
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
    container.appendChild(buildVerdict(spec));
    container.appendChild(buildGauge(spec));
    if (rawText) container.appendChild(buildRawText(rawText));
    return;
  }

  const spec = VERDICTS[result.verdict];
  container.appendChild(buildVerdict(spec, buildCountSubtitle(result)));
  container.appendChild(buildGauge(spec));

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
