/* =====================================================================
 * test/test.js — run with:  node test/test.js
 * =====================================================================
 *
 * No test framework, no dependencies, no build step — on purpose, so this
 * still runs in three months without an `npm install` that has rotted.
 *
 * The sample texts are written the way real Swiss labels read, including
 * the multilingual panels you get on Migros and Coop packaging.
 *
 * HOW TO ADD A TEST
 *   test('what it checks', 'Ingrédients: ...', (r, t) => {
 *     t.verdict(r, 'red');
 *     t.flagged(r, 'red', 'Onion powder');
 *     t.notFlagged(r, 'Apple');
 *   });
 *
 * ===================================================================== */

import { analyse, normalise, getPreparedEntries } from '../js/analyse.js';
import { groupFoods, filterFoods, FOODS } from '../js/foods.js';
import { INGREDIENTS } from '../js/ingredients.js';
import { bucketCountSubtitle, bucketShares } from '../js/render.js';
import { gaugeShares } from '../js/gauge.js';

let passed = 0;
let failed = 0;
const failures = [];

function labels(result, bucket) {
  return result[bucket].map((item) => item.label);
}

const t = {
  verdict(result, expected) {
    if (result.verdict !== expected) {
      throw new Error(`verdict was "${result.verdict}", expected "${expected}"`);
    }
  },
  status(result, expected) {
    if (result.status !== expected) {
      throw new Error(`status was "${result.status}", expected "${expected}"`);
    }
  },
  flagged(result, bucket, label) {
    if (!labels(result, bucket).includes(label)) {
      throw new Error(
        `expected "${label}" in ${bucket}; got [${labels(result, bucket).join(', ')}]`
      );
    }
  },
  notFlagged(result, label) {
    for (const bucket of ['red', 'yellow']) {
      if (labels(result, bucket).includes(label)) {
        throw new Error(`"${label}" should not be flagged, but was in ${bucket}`);
      }
    }
  },
  notAnywhere(result, label) {
    for (const bucket of ['red', 'yellow', 'green']) {
      if (labels(result, bucket).includes(label)) {
        throw new Error(`"${label}" should not appear at all, but was in ${bucket}`);
      }
    }
  },
  unrecognised(result, fragment) {
    if (!result.unrecognised.some((u) => u.includes(fragment))) {
      throw new Error(
        `expected "${fragment}" in unrecognised; got [${result.unrecognised.join(', ')}]`
      );
    }
  },
  traceApplied(result, expected) {
    if (result.traceRuleApplied !== expected) {
      throw new Error(`traceRuleApplied was ${result.traceRuleApplied}, expected ${expected}`);
    }
  },
};

function test(name, input, assertions) {
  try {
    const result = analyse(input);
    assertions(result, t);
    passed += 1;
    console.log(`  ok    ${name}`);
  } catch (error) {
    failed += 1;
    failures.push({ name, message: error.message });
    console.log(`  FAIL  ${name}`);
    console.log(`        ${error.message}`);
  }
}

console.log('\nFODMAP label scanner — test suite\n');

// =====================================================================
console.log('Normalisation');
// =====================================================================

test('strips accents, hyphens and apostrophes', 'x', () => {
  const cases = [
    ['Sirop de Glucose-Fructose', 'sirop de glucose fructose'],
    ["huile d'olive", 'huile d olive'],
    ['Milchsäure', 'milchsaure'],
    ['Hartweizengrieß', 'hartweizengriess'],
    ['OIGNON   en\n poudre', 'oignon en poudre'],
  ];
  for (const [input, expected] of cases) {
    const actual = normalise(input);
    if (actual !== expected) {
      throw new Error(`normalise("${input}") = "${actual}", expected "${expected}"`);
    }
  }
});

test('ingredient table loads and is sorted longest-first', 'x', () => {
  const entries = getPreparedEntries();
  if (entries.length < 200) {
    throw new Error(`expected 200+ entries, got ${entries.length}`);
  }
  for (let i = 1; i < entries.length; i += 1) {
    const prev = entries[i - 1];
    const curr = entries[i];
    if (prev.priority === curr.priority &&
        prev.normalisedPattern.length < curr.normalisedPattern.length) {
      throw new Error(
        `ordering broken: "${prev.pattern}" before longer "${curr.pattern}"`
      );
    }
  }
});

// =====================================================================
console.log('\nBasic verdicts');
// =====================================================================

test(
  'clean green product (FR)',
  'Ingrédients: riz, eau, huile de tournesol, sel, acide citrique.',
  (r, t) => {
    t.status(r, 'ok');
    t.verdict(r, 'green');
    t.flagged(r, 'green', 'Rice');
    t.flagged(r, 'green', 'Water');
    if (r.red.length || r.yellow.length) {
      throw new Error('expected nothing flagged');
    }
  }
);

test(
  'hidden onion powder (FR) — the case this tool exists for',
  'Ingrédients: farine de blé, sel, oignon en poudre, huile de tournesol.',
  (r, t) => {
    t.verdict(r, 'red');
    t.flagged(r, 'red', 'Onion powder');
    t.flagged(r, 'red', 'Wheat flour');
  }
);

test(
  'vague flavourings produce yellow, not green',
  'Ingrédients: riz, sel, arôme naturel, épices.',
  (r, t) => {
    t.verdict(r, 'yellow');
    t.flagged(r, 'yellow', 'Natural flavouring');
    t.flagged(r, 'yellow', 'Spices');
  }
);

// =====================================================================
console.log('\nThe "less than 2%" rule');
// =====================================================================

test(
  '2% rule downgrades a normal red to yellow',
  'Ingrédients: riz, sucre, sel, et moins de 2% de: lactose, acide citrique.',
  (r, t) => {
    t.verdict(r, 'yellow');
    t.traceApplied(r, true);
    t.flagged(r, 'yellow', 'Lactose');
    if (labels(r, 'red').includes('Lactose')) {
      throw new Error('lactose below 2% should have been downgraded');
    }
  }
);

test(
  '2% rule does NOT rescue garlic (alwaysFlag exception)',
  'Ingrédients: riz, sel, moins de 2% de: ail en poudre, arôme.',
  (r, t) => {
    t.verdict(r, 'red');
    t.flagged(r, 'red', 'Garlic powder');
  }
);

test(
  '2% rule does NOT rescue inulin or onion either',
  'Zutaten: Reis, Salz, weniger als 2%: Inulin, Zwiebelpulver.',
  (r, t) => {
    t.verdict(r, 'red');
    t.flagged(r, 'red', 'Inulin');
    t.flagged(r, 'red', 'Onion powder');
  }
);

// =====================================================================
console.log('\nCollision cases');
// =====================================================================

test(
  'pomme de terre is potato, not apple',
  'Ingrédients: pomme de terre, huile de tournesol, sel.',
  (r, t) => {
    t.verdict(r, 'green');
    t.notAnywhere(r, 'Apple');
    t.flagged(r, 'green', 'Potato');
  }
);

test(
  'French plural on the head noun: "pommes de terre" is still potato',
  'Ingrédients: pommes de terre (85%), huile de tournesol, sel.',
  (r, t) => {
    t.verdict(r, 'green');
    t.notAnywhere(r, 'Apple');
    t.flagged(r, 'green', 'Potato');
  }
);

test(
  'French plural on the head noun: "pois chiches" is still chickpeas',
  'Ingrédients: pois chiches, eau, sel, jus de citron.',
  (r, t) => {
    t.verdict(r, 'red');
    t.flagged(r, 'red', 'Chickpeas');
  }
);

test(
  'poireau is leek, not pear',
  'Ingrédients: poireau, eau, sel, carotte.',
  (r, t) => {
    t.verdict(r, 'red');
    t.flagged(r, 'red', 'Leek');
    t.notAnywhere(r, 'Pear');
  }
);

test(
  'plain glucose syrup is green',
  'Ingrédients: sucre, sirop de glucose, eau, arôme de vanille.',
  (r, t) => {
    t.notFlagged(r, 'Glucose-fructose syrup');
    t.flagged(r, 'green', 'Glucose syrup');
  }
);

test(
  'glucose-fructose syrup is red',
  'Ingrédients: sucre, sirop de glucose-fructose, eau.',
  (r, t) => {
    t.verdict(r, 'red');
    t.flagged(r, 'red', 'Glucose-fructose syrup');
    t.notAnywhere(r, 'Glucose syrup');
  }
);

test(
  'laitue is lettuce, not milk',
  'Ingrédients: laitue, huile d\'olive, vinaigre, sel.',
  (r, t) => {
    t.verdict(r, 'green');
    t.notAnywhere(r, 'Milk');
    t.flagged(r, 'green', 'Lettuce');
  }
);

test(
  'Milchsäure is lactic acid, not milk',
  'Zutaten: Wasser, Salz, Milchsäure, Reis.',
  (r, t) => {
    t.verdict(r, 'green');
    t.notAnywhere(r, 'Milk');
    t.flagged(r, 'green', 'Lactic acid');
  }
);

test(
  'Milchzucker is lactose',
  'Zutaten: Reismehl, Milchzucker, Salz.',
  (r, t) => {
    t.verdict(r, 'red');
    t.flagged(r, 'red', 'Lactose');
  }
);

test(
  'Fruchtzucker is fructose',
  'Zutaten: Wasser, Fruchtzucker, Zitronensäure.',
  (r, t) => {
    t.verdict(r, 'red');
    t.flagged(r, 'red', 'Fructose');
  }
);

test(
  'froment is wheat (Swiss French)',
  'Ingrédients: farine de froment, eau, sel, levure.',
  (r, t) => {
    t.verdict(r, 'red');
    t.flagged(r, 'red', 'Wheat flour');
  }
);

test(
  'garlic word-boundary: travail / détail / volaille must not match',
  'Ingrédients: viande de volaille, sel, poivre, détail du travail, paille.',
  (r, t) => {
    t.notAnywhere(r, 'Garlic');
  }
);

// =====================================================================
console.log('\nSuppression rules');
// =====================================================================

test(
  'aged cheese suppresses the plain-milk flag (Gruyère)',
  'Ingrédients: gruyère (lait, sel, présure), eau.',
  (r, t) => {
    t.verdict(r, 'green');
    t.notAnywhere(r, 'Milk');
    t.flagged(r, 'green', 'Gruyère');
  }
);

test(
  'sans lactose cancels the lactose flag',
  'Ingrédients: lait sans lactose, sucre, arôme de vanille.',
  (r, t) => {
    t.notFlagged(r, 'Lactose');
    t.notFlagged(r, 'Milk');
  }
);

test(
  'laktosefrei cancels it in German too',
  'Zutaten: Milch (laktosefrei), Zucker, Reis.',
  (r, t) => {
    t.notFlagged(r, 'Lactose');
    t.notFlagged(r, 'Milk');
  }
);

test(
  'plain milk without an aged cheese stays yellow',
  'Ingrédients: lait, sucre, amidon de maïs.',
  (r, t) => {
    t.verdict(r, 'yellow');
    t.flagged(r, 'yellow', 'Milk');
  }
);

// =====================================================================
console.log('\nMultilingual Swiss labels');
// =====================================================================

test(
  'German label with several triggers',
  'Zutaten: Weizenmehl, Zwiebelpulver, Milchzucker, Gerstenmalzextrakt, Salz.',
  (r, t) => {
    t.verdict(r, 'red');
    t.flagged(r, 'red', 'Wheat flour');
    t.flagged(r, 'red', 'Onion powder');
    t.flagged(r, 'red', 'Lactose');
    t.flagged(r, 'red', 'Barley malt extract');
  }
);

test(
  'Italian label',
  'Ingredienti: farina di frumento, cipolla in polvere, sale, olio di oliva.',
  (r, t) => {
    t.verdict(r, 'red');
    t.flagged(r, 'red', 'Wheat flour');
    t.flagged(r, 'red', 'Onion powder');
  }
);

test(
  'trilingual Migros-style panel (FR/DE/IT)',
  `Ingrédients: pommes de terre, huile de tournesol, sel.
   Zutaten: Kartoffeln, Sonnenblumenöl, Salz.
   Ingredienti: patate, olio di girasole, sale.`,
  (r, t) => {
    t.verdict(r, 'green');
    t.notAnywhere(r, 'Apple');
  }
);

test(
  'trilingual panel with a trigger in all three languages',
  `Ingrédients: farine de blé, ail, sel.
   Zutaten: Weizenmehl, Knoblauch, Salz.
   Ingredienti: farina di frumento, aglio, sale.`,
  (r, t) => {
    t.verdict(r, 'red');
    t.flagged(r, 'red', 'Garlic');
    t.flagged(r, 'red', 'Wheat flour');
  }
);

// =====================================================================
console.log('\nSafety behaviour');
// =====================================================================

test('garbage input is unreadable, not green', 'xq8 ;; %% ~~', (r, t) => {
  t.status(r, 'unreadable');
  if (r.verdict !== null) throw new Error('unreadable input must not get a colour');
});

test('empty input is unreadable', '', (r, t) => {
  t.status(r, 'unreadable');
});

test('a couple of stray words is unreadable', 'Migros Bio', (r, t) => {
  t.status(r, 'unreadable');
});

test(
  'a header alone is enough to be considered readable',
  'Ingrédients: riz.',
  (r, t) => {
    t.status(r, 'ok');
  }
);

test(
  'unknown additives go to unrecognised, never to green',
  'Ingrédients: riz, sel, E471, zorblatt de synthèse.',
  (r, t) => {
    t.unrecognised(r, 'e471');
    t.unrecognised(r, 'zorblatt');
    t.notAnywhere(r, 'E471');
  }
);

test(
  'allergen advisory is ignored (traces do not matter for FODMAPs)',
  'Ingrédients: riz, sel, huile de tournesol. Peut contenir des traces de blé et de lait.',
  (r, t) => {
    t.verdict(r, 'green');
    t.notAnywhere(r, 'Wheat');
    t.notAnywhere(r, 'Milk');
  }
);

// =====================================================================
console.log('\nRealistic full labels');
// =====================================================================

test(
  'Coop-style stock cube — multiple hidden triggers',
  `Ingrédients: sel, exhausteur de goût, graisse de palme, oignon en poudre,
   extrait de levure, arôme, légumes déshydratés (carotte, poireau), ail en poudre,
   curcuma, moins de 2% de: sucre.`,
  (r, t) => {
    t.verdict(r, 'red');
    t.flagged(r, 'red', 'Onion powder');
    t.flagged(r, 'red', 'Garlic powder');
    t.flagged(r, 'red', 'Leek');
    t.flagged(r, 'yellow', 'Yeast extract');
  }
);

test(
  'a genuinely safe gluten-free cracker',
  `Ingrédients: farine de riz, fécule de pomme de terre, huile de tournesol,
   graines de sésame, sel, poudre à lever.`,
  (r, t) => {
    t.verdict(r, 'green');
    if (r.red.length || r.yellow.length) {
      throw new Error(
        `expected clean green, got red=[${labels(r, 'red')}] yellow=[${labels(r, 'yellow')}]`
      );
    }
  }
);

test(
  'protein bar — inulin plus polyols',
  `Ingrédients: protéines de lait, inuline, maltitol, cacao, amandes,
   arôme naturel, sel.`,
  (r, t) => {
    t.verdict(r, 'red');
    t.flagged(r, 'red', 'Inulin');
    t.flagged(r, 'red', 'Maltitol');
    t.flagged(r, 'yellow', 'Almond');
  }
);

// =====================================================================
console.log('\nBucket counts');
// =====================================================================

test(
  'bucket counts list Avoid, Limit, Eat and Unknown from analyser buckets',
  `Ingrédients: protéines de lait, inuline, maltitol, cacao, amandes,
   arôme naturel, sel, E471.`,
  (r) => {
    if (!(r.red.length && r.yellow.length && r.green.length && r.unrecognised.length)) {
      throw new Error(
        `fixture must fill every bucket; got red=${r.red.length} yellow=${r.yellow.length} green=${r.green.length} unrecognised=${r.unrecognised.length}`
      );
    }
    const expected = `${r.red.length} Avoid, ${r.yellow.length} Limit, ${r.green.length} Eat, ${r.unrecognised.length} Unknown`;
    const actual = bucketCountSubtitle(r);
    if (actual !== expected) {
      throw new Error(`subtitle was "${actual}", expected "${expected}"`);
    }
  }
);

test(
  'bucket counts keep zero Avoid/Limit and omit empty Unknown',
  'Ingrédients: riz, eau, huile de tournesol, sel, acide citrique.',
  (r) => {
    if (r.red.length || r.yellow.length || r.unrecognised.length) {
      throw new Error(
        `fixture should be clean green; got red=${r.red.length} yellow=${r.yellow.length} unrecognised=${r.unrecognised.length}`
      );
    }
    const expected = `0 Avoid, 0 Limit, ${r.green.length} Eat`;
    const actual = bucketCountSubtitle(r);
    if (actual !== expected) {
      throw new Error(`subtitle was "${actual}", expected "${expected}"`);
    }
  }
);

// =====================================================================
console.log('\nShare ring');
// =====================================================================

function wedgeCounts(svg) {
  const count = (name) => (svg.match(new RegExp(`ds-gauge__dot--${name}`, 'g')) || []).length;
  return {
    green: count('green'),
    amber: count('amber'),
    red: count('red'),
    unknown: count('unknown'),
    off: count('off'),
  };
}

test(
  'share ring uses Avoid/Limit/Eat counts and ignores Unknown',
  `Ingrédients: protéines de lait, inuline, maltitol, cacao, amandes,
   arôme naturel, sel, E471.`,
  (r) => {
    if (!(r.red.length && r.yellow.length && r.green.length && r.unrecognised.length)) {
      throw new Error(
        `fixture must fill every bucket; got red=${r.red.length} yellow=${r.yellow.length} green=${r.green.length} unrecognised=${r.unrecognised.length}`
      );
    }
    const shares = bucketShares(r);
    if (shares.red !== r.red.length || shares.amber !== r.yellow.length || shares.green !== r.green.length) {
      throw new Error(`bucketShares ${JSON.stringify(shares)} did not match analyser counts`);
    }
    if ('unknown' in shares) {
      throw new Error('Unknown must not be a share key');
    }
  }
);

test(
  'unreadable results contribute no shares, so the ring stays grey',
  'xyz',
  (r) => {
    const shares = bucketShares(r);
    if (shares.green || shares.amber || shares.red) {
      throw new Error(`expected empty shares, got ${JSON.stringify(shares)}`);
    }
    const svg = gaugeShares(shares, { variant: 'ring' });
    const wedges = wedgeCounts(svg);
    if (wedges.green || wedges.amber || wedges.red || wedges.unknown) {
      throw new Error(`unreadable ring should not paint a fake wedge, got ${JSON.stringify(wedges)}`);
    }
    if (wedges.off < 100) {
      throw new Error(`expected a grey track, got ${wedges.off} off dots`);
    }
  }
);

test(
  'dotted donut paints wedges in proportion',
  'x',
  () => {
    const svg = gaugeShares({ green: 70, amber: 20, red: 10 }, { variant: 'ring' });
    const wedges = wedgeCounts(svg);
    const total = wedges.green + wedges.amber + wedges.red;
    if (total < 100) throw new Error(`expected a dense ring, got ${total} dots`);
    const g = wedges.green / total;
    const a = wedges.amber / total;
    const d = wedges.red / total;
    if (g < 0.62 || g > 0.78) throw new Error(`green wedge ${g} off 0.70`);
    if (a < 0.12 || a > 0.28) throw new Error(`amber wedge ${a} off 0.20`);
    if (d < 0.04 || d > 0.16) throw new Error(`red wedge ${d} off 0.10`);
  }
);

test(
  'ingredient counts fill the ring rather than sitting as percents of 100',
  'x',
  () => {
    const svg = gaugeShares({ green: 2, amber: 1, red: 1 }, { variant: 'ring' });
    const wedges = wedgeCounts(svg);
    const total = wedges.green + wedges.amber + wedges.red;
    if (total < 100) throw new Error(`counts should fill the ring, got ${total} coloured dots`);
    const g = wedges.green / total;
    const a = wedges.amber / total;
    const d = wedges.red / total;
    if (g < 0.40 || g > 0.60) throw new Error(`green count share ${g} off 0.50`);
    if (a < 0.15 || a > 0.35) throw new Error(`amber count share ${a} off 0.25`);
    if (d < 0.15 || d > 0.35) throw new Error(`red count share ${d} off 0.25`);
    if (wedges.unknown) throw new Error('unknown should be omitted unless passed');
  }
);

// =====================================================================
console.log('\nFood catalog');
// =====================================================================

function findFood(foods, label, level) {
  return foods.find((food) => food.label === label && food.level === level);
}

test('folds language variants of onion into one Avoid row', 'x', () => {
  const onion = findFood(FOODS, 'Onion', 'red');
  if (!onion) throw new Error('expected an Onion / red row');
  const onions = FOODS.filter((food) => food.label === 'Onion' && food.level === 'red');
  if (onions.length !== 1) {
    throw new Error(`expected 1 Onion/red row, got ${onions.length}`);
  }
  const blob = onion.keys.join(' ');
  for (const alias of ['oignon', 'zwiebel', 'cipolla', 'onion']) {
    if (!blob.includes(alias)) {
      throw new Error(`Onion keys missing "${alias}": ${blob}`);
    }
  }
  const powder = findFood(FOODS, 'Onion powder', 'red');
  if (!powder) throw new Error('expected Onion powder to stay a separate row');
});

test('catalog is derived from the ingredient table, not a second copy', 'x', () => {
  const grouped = groupFoods(INGREDIENTS);
  if (grouped.length >= INGREDIENTS.length) {
    throw new Error(
      `expected grouping to collapse variants (${INGREDIENTS.length} entries -> ${grouped.length} foods)`
    );
  }
  if (grouped.length < 50) {
    throw new Error(`expected a full catalog, got ${grouped.length} foods`);
  }
  if (FOODS.length !== grouped.length) {
    throw new Error('FOODS cache does not match groupFoods()');
  }
});

test('search matches any language alias while the row stays English', 'x', () => {
  const cases = [
    ['oignon', 'Onion'],
    ['Zwiebel', 'Onion'],
    ['cipolla', 'Onion'],
    ['ail', 'Garlic'],
    ['échalote', 'Shallot'],
  ];
  for (const [query, label] of cases) {
    const hits = filterFoods(FOODS, query);
    if (!hits.some((food) => food.label === label)) {
      throw new Error(`"${query}" should find ${label}; got [${hits.map((f) => f.label).join(', ')}]`);
    }
  }
  const empty = filterFoods(FOODS, '   ');
  if (empty.length !== FOODS.length) {
    throw new Error(`empty query should return the full list (${FOODS.length}), got ${empty.length}`);
  }
});

test('search is live and accent-insensitive', 'x', () => {
  const a = filterFoods(FOODS, 'AIL').map((f) => f.label);
  const b = filterFoods(FOODS, 'aïl').map((f) => f.label);
  if (!a.includes('Garlic') || !b.includes('Garlic')) {
    throw new Error(`expected Garlic for AIL/aïl, got ${a.join(', ')} / ${b.join(', ')}`);
  }
  const miss = filterFoods(FOODS, 'zzzz-not-a-food');
  if (miss.length !== 0) {
    throw new Error(`expected no hits, got [${miss.map((f) => f.label).join(', ')}]`);
  }
});

test('Avoid filter hides Eat items', 'x', () => {
  const hits = filterFoods(FOODS, '', 'red');
  if (!hits.length) throw new Error('expected Avoid items');
  if (hits.some((food) => food.level !== 'red')) {
    throw new Error(
      `Avoid filter should hide Eat/Limit; got [${[...new Set(hits.map((f) => f.level))].join(', ')}]`
    );
  }
  const garlic = filterFoods(FOODS, 'ail', 'red');
  if (!garlic.some((food) => food.label === 'Garlic')) {
    throw new Error('Avoid + alias search should still find Garlic');
  }
  if (garlic.some((food) => food.level !== 'red')) {
    throw new Error('Avoid + search should not leak Eat items');
  }
});

// =====================================================================
// Summary
// =====================================================================
console.log(`\n${'='.repeat(52)}`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log('='.repeat(52));

if (failed > 0) {
  console.log('\nFailures:');
  for (const f of failures) console.log(`  - ${f.name}\n    ${f.message}`);
  console.log('');
  process.exit(1);
}
console.log('');
