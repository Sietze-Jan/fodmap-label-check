/* =====================================================================
 * render.js — TURNS AN ANALYSIS RESULT INTO DOM
 * =====================================================================
 *
 * This is the only module that touches the DOM. It takes the plain object
 * returned by analyse() and builds the result card.
 *
 * Nothing here decides what is safe to eat — that all lives in
 * ingredients.js and analyse.js. If a verdict looks wrong, fix the data,
 * not this file.
 *
 * ===================================================================== */

const VERDICTS = {
  red: {
    className: 'verdict--red',
    icon: '\u25CF',
    title: 'Avoid',
    subtitle: 'Contains high-FODMAP ingredients',
  },
  yellow: {
    className: 'verdict--yellow',
    icon: '\u25CF',
    title: 'Check the portion',
    subtitle: 'Nothing clearly high, but some ingredients depend on quantity',
  },
  green: {
    className: 'verdict--green',
    icon: '\u25CF',
    title: 'Looks fine',
    subtitle: 'No high-FODMAP ingredients recognised',
  },
};

/* Small helper so we never build HTML from label text by concatenation. */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildFlaggedSection(bucketName, items, heading, note) {
  const section = el('section', `bucket bucket--${bucketName}`);
  section.appendChild(el('h2', 'bucket__heading', `${heading} (${items.length})`));

  if (note) section.appendChild(el('p', 'bucket__note', note));

  const list = el('ul', 'bucket__list');
  for (const item of items) {
    const row = el('li', 'ingredient');
    row.appendChild(el('span', 'ingredient__name', item.label));
    if (item.reason) row.appendChild(el('span', 'ingredient__reason', item.reason));
    if (item.trace && item.alwaysFlag) {
      row.appendChild(
        el('span', 'ingredient__tag', 'below 2% but still counts')
      );
    }
    list.appendChild(row);
  }
  section.appendChild(list);
  return section;
}

function buildPlainSection(bucketName, items, heading, note) {
  const section = el('section', `bucket bucket--${bucketName}`);
  section.appendChild(el('h2', 'bucket__heading', `${heading} (${items.length})`));
  if (note) section.appendChild(el('p', 'bucket__note', note));
  const names = items.map((item) => (typeof item === 'string' ? item : item.label));
  section.appendChild(el('p', 'bucket__inline', names.join(' \u00B7 ')));
  return section;
}

/* ---------------------------------------------------------------------
 * The unreadable state. Deliberately grey and colourless: a bad photo
 * must never look like a pass.
 * ------------------------------------------------------------------- */
function renderUnreadable(container) {
  const card = el('div', 'verdict verdict--unknown');
  card.appendChild(el('div', 'verdict__icon', '?'));
  const body = el('div', 'verdict__body');
  body.appendChild(el('p', 'verdict__title', "Can't read the label"));
  body.appendChild(
    el(
      'p',
      'verdict__subtitle',
      'Take the photo again: closer, flatter, and with more light. Aim at the ingredient list on the back, not the front of the pack.'
    )
  );
  card.appendChild(body);
  container.appendChild(card);
}

/* ---------------------------------------------------------------------
 * render(result, container)
 * ------------------------------------------------------------------- */
export function render(result, container) {
  container.textContent = '';
  container.hidden = false;

  if (result.status === 'unreadable') {
    renderUnreadable(container);
    return;
  }

  const verdict = VERDICTS[result.verdict];

  const card = el('div', `verdict ${verdict.className}`);
  card.appendChild(el('div', 'verdict__icon', verdict.icon));
  const body = el('div', 'verdict__body');
  body.appendChild(el('p', 'verdict__title', verdict.title));
  body.appendChild(el('p', 'verdict__subtitle', verdict.subtitle));
  card.appendChild(body);
  container.appendChild(card);

  if (result.verdict === 'yellow') {
    container.appendChild(
      el(
        'p',
        'monash',
        'Check the portion size for the amber ingredients in the Monash FODMAP app \u2014 that is the only place with lab-tested serving limits.'
      )
    );
  }

  if (result.red.length) {
    container.appendChild(
      buildFlaggedSection('red', result.red, 'Triggers')
    );
  }

  if (result.yellow.length) {
    container.appendChild(
      buildFlaggedSection(
        'yellow',
        result.yellow,
        'Worth watching',
        'Moderate, portion-dependent, or a vague term that can hide onion or garlic.'
      )
    );
  }

  if (result.green.length) {
    container.appendChild(
      buildPlainSection('green', result.green, 'Fine')
    );
  }

  if (result.unrecognised.length) {
    container.appendChild(
      buildPlainSection(
        'unknown',
        result.unrecognised,
        'Not recognised',
        'Not in the ingredient list yet \u2014 treat as unknown, not as safe.'
      )
    );
  }

  if (result.traceRuleApplied) {
    container.appendChild(
      el(
        'p',
        'footnote',
        'Some ingredients appeared after a "less than 2%" statement and were downgraded. Onion, garlic, chicory and inulin are never downgraded.'
      )
    );
  }

  if (result.suppressedGroups.includes('dairy-milk')) {
    container.appendChild(
      el(
        'p',
        'footnote',
        'Milk was not flagged because an aged cheese was found \u2014 hard cheeses such as Gruy\u00E8re and Emmental have very little lactose left.'
      )
    );
  }
}
