/* =====================================================================
 * ingredients.js — THE INGREDIENT TABLE
 * =====================================================================
 *
 * This file is the heart of the tool. It is deliberately the only file you
 * need to touch to improve accuracy. No build step, no dependencies: edit,
 * save, commit, push.
 *
 * ---------------------------------------------------------------------
 * HOW TO ADD AN INGREDIENT
 * ---------------------------------------------------------------------
 *
 * Add one object to the INGREDIENTS array below, in the section that fits:
 *
 *   { pattern: 'sirop de datte', level: 'red', group: 'sweetener',
 *     label: 'Date syrup', reason: 'Excess fructose' },
 *
 * FIELDS
 *
 *   pattern   (required) The text as it is printed on the label. Write it
 *             naturally — with accents, apostrophes and hyphens. It is
 *             normalised automatically (see normalise() in analyse.js), so
 *             'sirop de glucose-fructose' and 'Sirop de Glucose/Fructose'
 *             both work.
 *
 *   level     (required) 'red' | 'yellow' | 'green'
 *               red    = high FODMAP, avoid
 *               yellow = moderate / depends on portion / vague term that
 *                        may be hiding onion or garlic
 *               green  = low FODMAP, fine
 *
 *   label     (required) Short ENGLISH name shown in the results. The UI is
 *             English even though the labels we read are not.
 *
 *   reason    (required for red and yellow) One short line, max ~10 words,
 *             shown under the ingredient. Green entries don't need one —
 *             they are rendered as a plain comma-separated list.
 *
 *   group     (optional) Tag used by the suppression system, e.g. 'lactose'.
 *             Only needed if something else should be able to cancel it.
 *
 *   alwaysFlag (optional, default false)
 *             true  = survives the "less than 2%" downgrade. Reserve this
 *                     for garlic, onion, chicory, inulin and FOS/GOS, which
 *                     trigger symptoms even in trace amounts.
 *
 *   wholeWord (optional, default TRUE)
 *             true  = match whole words only, with an optional plural 's'
 *                     or 'es'. This is what you want for French and
 *                     Italian, and it is what stops 'ail' (garlic) from
 *                     matching inside 'travail', 'détail' or 'volaille'.
 *             false = plain substring match. Use this for GERMAN, where
 *                     compounding means 'Zwiebel' should also match inside
 *                     'Zwiebelpulver'.
 *
 *   priority  (optional, default 0) Higher is checked earlier. You rarely
 *             need this — see ORDERING below.
 *
 *   suppresses (optional) Array of group tags this entry cancels. Used for
 *             'sans lactose' cancelling the lactose group, and for aged
 *             cheeses cancelling the plain-milk flag.
 *
 * ---------------------------------------------------------------------
 * ORDERING: WHY YOU USUALLY DON'T NEED TO THINK ABOUT COLLISIONS
 * ---------------------------------------------------------------------
 *
 * Entries are sorted LONGEST PATTERN FIRST, and once a stretch of text is
 * matched it is "consumed" and cannot be matched again. That single rule
 * resolves every collision automatically:
 *
 *   'pomme de terre' (potato, green)  beats  'pomme' (apple, red)
 *   'poireau'        (leek, red)      beats  'poire' (pear, red)
 *   'sirop de glucose-fructose' (red) beats  'sirop de glucose' (green)
 *   'Milchsäure'     (lactic acid)    beats  'Milch'
 *   'Milchzucker'    (lactose, red)   beats  'Milch'
 *   'Zwiebelpulver'  (onion powder)   beats  'Zwiebel'
 *
 * So to fix a false positive, just add the longer, more specific term with
 * the correct level. You do not need to touch the matching code.
 *
 * ---------------------------------------------------------------------
 * AFTER EDITING
 * ---------------------------------------------------------------------
 *
 *   node test/test.js        <- always run this, it is fast and has no deps
 *
 * If you added a tricky case, add a test for it in test/test.js too.
 *
 * ===================================================================== */

export const INGREDIENTS = [

  // ===================================================================
  // SUPPRESSORS — checked like any other entry, but they cancel groups.
  // These must exist so that "lait sans lactose" doesn't get flagged.
  // ===================================================================
  { pattern: 'sans lactose',      level: 'green', label: 'Lactose-free',  suppresses: ['lactose', 'dairy-milk'] },
  { pattern: 'délactosé',         level: 'green', label: 'Lactose-free',  suppresses: ['lactose', 'dairy-milk'] },
  { pattern: 'laktosefrei',       level: 'green', label: 'Lactose-free',  suppresses: ['lactose', 'dairy-milk'], wholeWord: false },
  { pattern: 'lactosefrei',       level: 'green', label: 'Lactose-free',  suppresses: ['lactose', 'dairy-milk'], wholeWord: false },
  { pattern: 'senza lattosio',    level: 'green', label: 'Lactose-free',  suppresses: ['lactose', 'dairy-milk'] },
  { pattern: 'lactose free',      level: 'green', label: 'Lactose-free',  suppresses: ['lactose', 'dairy-milk'] },
  { pattern: 'sans gluten',       level: 'green', label: 'Gluten-free',   suppresses: ['gluten-grain'] },
  { pattern: 'glutenfrei',        level: 'green', label: 'Gluten-free',   suppresses: ['gluten-grain'], wholeWord: false },
  { pattern: 'senza glutine',     level: 'green', label: 'Gluten-free',   suppresses: ['gluten-grain'] },
  { pattern: 'gluten free',       level: 'green', label: 'Gluten-free',   suppresses: ['gluten-grain'] },

  // ===================================================================
  // RED — ALLIUMS (onion / garlic family)
  // The most common hidden trigger on Swiss labels. All alwaysFlag: they
  // matter even below the 2% line.
  // ===================================================================
  { pattern: 'oignon en poudre',       level: 'red', group: 'allium', alwaysFlag: true, label: 'Onion powder',        reason: 'Fructans — high even in tiny amounts' },
  { pattern: 'poudre d\'oignon',       level: 'red', group: 'allium', alwaysFlag: true, label: 'Onion powder',        reason: 'Fructans — high even in tiny amounts' },
  { pattern: 'oignon déshydraté',      level: 'red', group: 'allium', alwaysFlag: true, label: 'Dried onion',         reason: 'Fructans — high even in tiny amounts' },
  { pattern: 'oignon rôti',            level: 'red', group: 'allium', alwaysFlag: true, label: 'Roasted onion',       reason: 'Fructans — cooking does not remove them' },
  { pattern: 'oignon',                 level: 'red', group: 'allium', alwaysFlag: true, label: 'Onion',               reason: 'Fructans — the classic IBS trigger' },
  { pattern: 'échalote',               level: 'red', group: 'allium', alwaysFlag: true, label: 'Shallot',             reason: 'Fructans — same family as onion' },
  { pattern: 'ciboule',                level: 'red', group: 'allium', alwaysFlag: true, label: 'Spring onion',        reason: 'Fructans in the white bulb' },
  { pattern: 'ail en poudre',          level: 'red', group: 'allium', alwaysFlag: true, label: 'Garlic powder',       reason: 'Fructans — high even in tiny amounts' },
  { pattern: 'poudre d\'ail',          level: 'red', group: 'allium', alwaysFlag: true, label: 'Garlic powder',       reason: 'Fructans — high even in tiny amounts' },
  { pattern: 'ail déshydraté',         level: 'red', group: 'allium', alwaysFlag: true, label: 'Dried garlic',        reason: 'Fructans — high even in tiny amounts' },
  { pattern: 'ail des ours',           level: 'red', group: 'allium', alwaysFlag: true, label: 'Wild garlic',         reason: 'Fructans — same family as garlic' },
  { pattern: 'ail',                    level: 'red', group: 'allium', alwaysFlag: true, label: 'Garlic',              reason: 'Fructans — high even in tiny amounts' },
  { pattern: 'aïoli',                  level: 'red', group: 'allium', alwaysFlag: true, label: 'Aioli',               reason: 'Garlic-based sauce' },
  { pattern: 'poireau',                level: 'red', group: 'allium', alwaysFlag: true, label: 'Leek',                reason: 'Fructans — the bulb is high' },
  // German — substring matching on purpose, so Zwiebelpulver etc. are caught.
  { pattern: 'zwiebelpulver',          level: 'red', group: 'allium', alwaysFlag: true, label: 'Onion powder',        reason: 'Fructans — high even in tiny amounts', wholeWord: false },
  { pattern: 'röstzwiebel',            level: 'red', group: 'allium', alwaysFlag: true, label: 'Fried onion',         reason: 'Fructans — cooking does not remove them', wholeWord: false },
  { pattern: 'zwiebel',                level: 'red', group: 'allium', alwaysFlag: true, label: 'Onion',               reason: 'Fructans — the classic IBS trigger', wholeWord: false },
  { pattern: 'schalotte',              level: 'red', group: 'allium', alwaysFlag: true, label: 'Shallot',             reason: 'Fructans — same family as onion', wholeWord: false },
  { pattern: 'knoblauchpulver',        level: 'red', group: 'allium', alwaysFlag: true, label: 'Garlic powder',       reason: 'Fructans — high even in tiny amounts', wholeWord: false },
  { pattern: 'knoblauch',              level: 'red', group: 'allium', alwaysFlag: true, label: 'Garlic',              reason: 'Fructans — high even in tiny amounts', wholeWord: false },
  { pattern: 'bärlauch',               level: 'red', group: 'allium', alwaysFlag: true, label: 'Wild garlic',         reason: 'Fructans — same family as garlic', wholeWord: false },
  { pattern: 'lauch',                  level: 'red', group: 'allium', alwaysFlag: true, label: 'Leek',                reason: 'Fructans — the bulb is high', wholeWord: false },
  { pattern: 'porree',                 level: 'red', group: 'allium', alwaysFlag: true, label: 'Leek',                reason: 'Fructans — the bulb is high', wholeWord: false },
  // Italian
  { pattern: 'cipolla in polvere',     level: 'red', group: 'allium', alwaysFlag: true, label: 'Onion powder',        reason: 'Fructans — high even in tiny amounts' },
  { pattern: 'cipolla',                level: 'red', group: 'allium', alwaysFlag: true, label: 'Onion',               reason: 'Fructans — the classic IBS trigger' },
  { pattern: 'cipolle',                level: 'red', group: 'allium', alwaysFlag: true, label: 'Onion',               reason: 'Fructans — the classic IBS trigger' },
  { pattern: 'scalogno',               level: 'red', group: 'allium', alwaysFlag: true, label: 'Shallot',             reason: 'Fructans — same family as onion' },
  { pattern: 'aglio in polvere',       level: 'red', group: 'allium', alwaysFlag: true, label: 'Garlic powder',       reason: 'Fructans — high even in tiny amounts' },
  { pattern: 'aglio',                  level: 'red', group: 'allium', alwaysFlag: true, label: 'Garlic',              reason: 'Fructans — high even in tiny amounts' },
  { pattern: 'porro',                  level: 'red', group: 'allium', alwaysFlag: true, label: 'Leek',                reason: 'Fructans — the bulb is high' },

  // ===================================================================
  // RED — ADDED FRUCTANS AND "HEALTHY" FIBRES
  // Also alwaysFlag: inulin and chicory are potent in small doses.
  // ===================================================================
  { pattern: 'racine de chicorée',     level: 'red', group: 'fructan', alwaysFlag: true, label: 'Chicory root',        reason: 'Concentrated fructans' },
  { pattern: 'fibre de chicorée',      level: 'red', group: 'fructan', alwaysFlag: true, label: 'Chicory fibre',       reason: 'Concentrated fructans' },
  { pattern: 'chicorée',               level: 'red', group: 'fructan', alwaysFlag: true, label: 'Chicory',             reason: 'Concentrated fructans' },
  { pattern: 'inuline',                level: 'red', group: 'fructan', alwaysFlag: true, label: 'Inulin',              reason: 'Added fructan — high even in small doses' },
  { pattern: 'oligofructose',          level: 'red', group: 'fructan', alwaysFlag: true, label: 'Oligofructose',       reason: 'Added fructan' },
  { pattern: 'fructo-oligosaccharides', level: 'red', group: 'fructan', alwaysFlag: true, label: 'FOS',               reason: 'Added fructan' },
  { pattern: 'galacto-oligosaccharides', level: 'red', group: 'fructan', alwaysFlag: true, label: 'GOS',              reason: 'Added galacto-oligosaccharide' },
  { pattern: 'fos',                    level: 'red', group: 'fructan', alwaysFlag: true, label: 'FOS',                 reason: 'Added fructan' },
  { pattern: 'gos',                    level: 'red', group: 'fructan', alwaysFlag: true, label: 'GOS',                 reason: 'Added galacto-oligosaccharide' },
  { pattern: 'fibre d\'agave',         level: 'red', group: 'fructan', alwaysFlag: true, label: 'Agave fibre',         reason: 'Concentrated fructans' },
  { pattern: 'topinambour',            level: 'red', group: 'fructan', alwaysFlag: true, label: 'Jerusalem artichoke', reason: 'Very high in fructans' },
  { pattern: 'zichorienwurzel',        level: 'red', group: 'fructan', alwaysFlag: true, label: 'Chicory root',        reason: 'Concentrated fructans', wholeWord: false },
  { pattern: 'zichorie',               level: 'red', group: 'fructan', alwaysFlag: true, label: 'Chicory',             reason: 'Concentrated fructans', wholeWord: false },
  { pattern: 'chicorée-wurzel',        level: 'red', group: 'fructan', alwaysFlag: true, label: 'Chicory root',        reason: 'Concentrated fructans', wholeWord: false },
  { pattern: 'inulin',                 level: 'red', group: 'fructan', alwaysFlag: true, label: 'Inulin',              reason: 'Added fructan — high even in small doses', wholeWord: false },
  { pattern: 'topinambur',             level: 'red', group: 'fructan', alwaysFlag: true, label: 'Jerusalem artichoke', reason: 'Very high in fructans', wholeWord: false },
  { pattern: 'inulina',                level: 'red', group: 'fructan', alwaysFlag: true, label: 'Inulin',              reason: 'Added fructan — high even in small doses' },
  { pattern: 'radice di cicoria',      level: 'red', group: 'fructan', alwaysFlag: true, label: 'Chicory root',        reason: 'Concentrated fructans' },
  { pattern: 'cicoria',                level: 'red', group: 'fructan', alwaysFlag: true, label: 'Chicory',             reason: 'Concentrated fructans' },

  // ===================================================================
  // RED — WHEAT, RYE, BARLEY, SPELT
  // Group 'gluten-grain' so a "sans gluten" claim can cancel them.
  // Note 'froment' — that is the Swiss French word for wheat.
  // ===================================================================
  { pattern: 'farine de blé',          level: 'red', group: 'gluten-grain', label: 'Wheat flour',        reason: 'Fructans — high as a main ingredient' },
  { pattern: 'semoule de blé',         level: 'red', group: 'gluten-grain', label: 'Wheat semolina',     reason: 'Fructans — high as a main ingredient' },
  { pattern: 'son de blé',             level: 'red', group: 'gluten-grain', label: 'Wheat bran',         reason: 'Very concentrated fructans' },
  { pattern: 'gluten de blé',          level: 'red', group: 'gluten-grain', label: 'Wheat gluten',       reason: 'Wheat protein — usually with fructans' },
  { pattern: 'amidon de blé',          level: 'yellow', group: 'gluten-grain', label: 'Wheat starch',    reason: 'Mostly starch — low unless a main ingredient' },
  { pattern: 'farine de froment',      level: 'red', group: 'gluten-grain', label: 'Wheat flour',        reason: 'Fructans — "froment" is wheat' },
  { pattern: 'froment',                level: 'red', group: 'gluten-grain', label: 'Wheat',              reason: 'Fructans — "froment" is wheat' },
  { pattern: 'blé',                    level: 'red', group: 'gluten-grain', label: 'Wheat',              reason: 'Fructans — high as a main ingredient' },
  { pattern: 'petit épeautre',         level: 'red', group: 'gluten-grain', label: 'Einkorn',            reason: 'Fructans' },
  { pattern: 'épeautre',               level: 'red', group: 'gluten-grain', label: 'Spelt',              reason: 'Fructans — less than wheat but still high' },
  { pattern: 'farine de seigle',       level: 'red', group: 'gluten-grain', label: 'Rye flour',          reason: 'Fructans — high' },
  { pattern: 'seigle',                 level: 'red', group: 'gluten-grain', label: 'Rye',                reason: 'Fructans — high' },
  { pattern: 'extrait de malt d\'orge', level: 'red', group: 'gluten-grain', label: 'Barley malt extract', reason: 'Fructans and GOS' },
  { pattern: 'malt d\'orge',           level: 'red', group: 'gluten-grain', label: 'Barley malt',        reason: 'Fructans and GOS' },
  { pattern: 'orge',                   level: 'red', group: 'gluten-grain', label: 'Barley',             reason: 'Fructans and GOS' },
  { pattern: 'couscous',               level: 'red', group: 'gluten-grain', label: 'Couscous',           reason: 'Wheat semolina — fructans' },
  { pattern: 'boulgour',               level: 'red', group: 'gluten-grain', label: 'Bulgur',             reason: 'Cracked wheat — fructans' },
  { pattern: 'vollkornweizenmehl',     level: 'red', group: 'gluten-grain', label: 'Wholemeal wheat flour', reason: 'Fructans — high as a main ingredient', wholeWord: false },
  { pattern: 'hartweizengriess',       level: 'red', group: 'gluten-grain', label: 'Durum wheat semolina', reason: 'Fructans — high as a main ingredient', wholeWord: false },
  { pattern: 'weizenmehl',             level: 'red', group: 'gluten-grain', label: 'Wheat flour',        reason: 'Fructans — high as a main ingredient', wholeWord: false },
  { pattern: 'weizenkleie',            level: 'red', group: 'gluten-grain', label: 'Wheat bran',         reason: 'Very concentrated fructans', wholeWord: false },
  { pattern: 'weizen',                 level: 'red', group: 'gluten-grain', label: 'Wheat',              reason: 'Fructans — high as a main ingredient', wholeWord: false },
  { pattern: 'dinkel',                 level: 'red', group: 'gluten-grain', label: 'Spelt',              reason: 'Fructans — less than wheat but still high', wholeWord: false },
  { pattern: 'roggenmehl',             level: 'red', group: 'gluten-grain', label: 'Rye flour',          reason: 'Fructans — high', wholeWord: false },
  { pattern: 'roggen',                 level: 'red', group: 'gluten-grain', label: 'Rye',                reason: 'Fructans — high', wholeWord: false },
  { pattern: 'gerstenmalzextrakt',     level: 'red', group: 'gluten-grain', label: 'Barley malt extract', reason: 'Fructans and GOS', wholeWord: false },
  { pattern: 'gerstenmalz',            level: 'red', group: 'gluten-grain', label: 'Barley malt',        reason: 'Fructans and GOS', wholeWord: false },
  { pattern: 'gerste',                 level: 'red', group: 'gluten-grain', label: 'Barley',             reason: 'Fructans and GOS', wholeWord: false },
  { pattern: 'farina di frumento',     level: 'red', group: 'gluten-grain', label: 'Wheat flour',        reason: 'Fructans — high as a main ingredient' },
  { pattern: 'frumento',               level: 'red', group: 'gluten-grain', label: 'Wheat',              reason: 'Fructans — high as a main ingredient' },
  { pattern: 'farro',                  level: 'red', group: 'gluten-grain', label: 'Spelt / emmer',      reason: 'Fructans' },
  { pattern: 'segale',                 level: 'red', group: 'gluten-grain', label: 'Rye',                reason: 'Fructans — high' },
  { pattern: 'malto d\'orzo',          level: 'red', group: 'gluten-grain', label: 'Barley malt',        reason: 'Fructans and GOS' },
  { pattern: 'orzo',                   level: 'red', group: 'gluten-grain', label: 'Barley',             reason: 'Fructans and GOS' },
  { pattern: 'semola',                 level: 'red', group: 'gluten-grain', label: 'Semolina',           reason: 'Wheat semolina — fructans' },

  // ===================================================================
  // RED — SWEETENERS AND SYRUPS
  // The glucose / glucose-fructose distinction lives here. Plain glucose
  // syrup is fine and is listed in the GREEN section below; only the
  // fructose-bearing version is red, and it wins because it is longer.
  // ===================================================================
  { pattern: 'sirop de glucose-fructose', level: 'red', group: 'sweetener', label: 'Glucose-fructose syrup', reason: 'Excess fructose' },
  { pattern: 'sirop de fructose-glucose', level: 'red', group: 'sweetener', label: 'Fructose-glucose syrup', reason: 'Excess fructose' },
  { pattern: 'sirop de fructose',      level: 'red', group: 'sweetener', label: 'Fructose syrup',      reason: 'Excess fructose' },
  { pattern: 'sirop de maïs à haute teneur en fructose', level: 'red', group: 'sweetener', label: 'High-fructose corn syrup', reason: 'Excess fructose' },
  { pattern: 'fructose',               level: 'red', group: 'sweetener', label: 'Fructose',            reason: 'Excess fructose' },
  { pattern: 'isoglucose',             level: 'red', group: 'sweetener', label: 'Isoglucose',          reason: 'Excess fructose' },
  { pattern: 'miel',                   level: 'red', group: 'sweetener', label: 'Honey',               reason: 'Excess fructose' },
  { pattern: 'sirop d\'agave',         level: 'red', group: 'sweetener', label: 'Agave syrup',         reason: 'Very high fructose' },
  { pattern: 'glukose-fruktose-sirup', level: 'red', group: 'sweetener', label: 'Glucose-fructose syrup', reason: 'Excess fructose', wholeWord: false },
  { pattern: 'fruktose-glukose-sirup', level: 'red', group: 'sweetener', label: 'Fructose-glucose syrup', reason: 'Excess fructose', wholeWord: false },
  { pattern: 'fruchtzucker',           level: 'red', group: 'sweetener', label: 'Fructose',            reason: 'Excess fructose — "Fruchtzucker" is fructose', wholeWord: false },
  { pattern: 'fruktose',               level: 'red', group: 'sweetener', label: 'Fructose',            reason: 'Excess fructose', wholeWord: false },
  { pattern: 'agavensirup',            level: 'red', group: 'sweetener', label: 'Agave syrup',         reason: 'Very high fructose', wholeWord: false },
  { pattern: 'honig',                  level: 'red', group: 'sweetener', label: 'Honey',               reason: 'Excess fructose', wholeWord: false },
  { pattern: 'sciroppo di glucosio-fruttosio', level: 'red', group: 'sweetener', label: 'Glucose-fructose syrup', reason: 'Excess fructose' },
  { pattern: 'fruttosio',              level: 'red', group: 'sweetener', label: 'Fructose',            reason: 'Excess fructose' },
  { pattern: 'sciroppo d\'agave',      level: 'red', group: 'sweetener', label: 'Agave syrup',         reason: 'Very high fructose' },
  { pattern: 'miele',                  level: 'red', group: 'sweetener', label: 'Honey',               reason: 'Excess fructose' },

  // ===================================================================
  // RED — POLYOLS (sugar alcohols)
  // Both the name and the E-number, since labels use either.
  // ===================================================================
  { pattern: 'sirop de maltitol',      level: 'red', group: 'polyol', label: 'Maltitol syrup',  reason: 'Polyol — laxative effect' },
  { pattern: 'sorbitol',               level: 'red', group: 'polyol', label: 'Sorbitol',        reason: 'Polyol — poorly absorbed' },
  { pattern: 'e420',                   level: 'red', group: 'polyol', label: 'Sorbitol (E420)', reason: 'Polyol — poorly absorbed' },
  { pattern: 'mannitol',               level: 'red', group: 'polyol', label: 'Mannitol',        reason: 'Polyol — poorly absorbed' },
  { pattern: 'e421',                   level: 'red', group: 'polyol', label: 'Mannitol (E421)', reason: 'Polyol — poorly absorbed' },
  { pattern: 'xylitol',                level: 'red', group: 'polyol', label: 'Xylitol',         reason: 'Polyol — laxative effect' },
  { pattern: 'e967',                   level: 'red', group: 'polyol', label: 'Xylitol (E967)',  reason: 'Polyol — laxative effect' },
  { pattern: 'maltitol',               level: 'red', group: 'polyol', label: 'Maltitol',        reason: 'Polyol — laxative effect' },
  { pattern: 'e965',                   level: 'red', group: 'polyol', label: 'Maltitol (E965)', reason: 'Polyol — laxative effect' },
  { pattern: 'isomalt',                level: 'red', group: 'polyol', label: 'Isomalt',         reason: 'Polyol — poorly absorbed' },
  { pattern: 'e953',                   level: 'red', group: 'polyol', label: 'Isomalt (E953)',  reason: 'Polyol — poorly absorbed' },
  { pattern: 'lactitol',               level: 'red', group: 'polyol', label: 'Lactitol',        reason: 'Polyol — poorly absorbed' },
  { pattern: 'e966',                   level: 'red', group: 'polyol', label: 'Lactitol (E966)', reason: 'Polyol — poorly absorbed' },
  { pattern: 'polyols',                level: 'red', group: 'polyol', label: 'Polyols',         reason: 'Polyols — poorly absorbed' },
  { pattern: 'polyole',                level: 'red', group: 'polyol', label: 'Polyols',         reason: 'Polyols — poorly absorbed', wholeWord: false },
  { pattern: 'polioli',                level: 'red', group: 'polyol', label: 'Polyols',         reason: 'Polyols — poorly absorbed' },

  // ===================================================================
  // RED — LACTOSE-RICH DAIRY
  // Group 'lactose'. Plain milk is separately grouped 'dairy-milk' and sits
  // in the YELLOW section, because aged cheeses list milk but are fine.
  // ===================================================================
  { pattern: 'lait écrémé en poudre',  level: 'red', group: 'lactose', label: 'Skimmed milk powder', reason: 'Concentrated lactose' },
  { pattern: 'lait en poudre',         level: 'red', group: 'lactose', label: 'Milk powder',      reason: 'Concentrated lactose' },
  { pattern: 'poudre de lait',         level: 'red', group: 'lactose', label: 'Milk powder',      reason: 'Concentrated lactose' },
  { pattern: 'lait concentré',         level: 'red', group: 'lactose', label: 'Condensed milk',   reason: 'Concentrated lactose' },
  { pattern: 'poudre de lactosérum',   level: 'red', group: 'lactose', label: 'Whey powder',      reason: 'Concentrated lactose' },
  { pattern: 'lactosérum',             level: 'red', group: 'lactose', label: 'Whey',             reason: 'Lactose' },
  { pattern: 'petit-lait',             level: 'red', group: 'lactose', label: 'Whey',             reason: 'Lactose' },
  { pattern: 'lactose',                level: 'red', group: 'lactose', label: 'Lactose',         reason: 'Lactose — added directly' },
  { pattern: 'babeurre',               level: 'red', group: 'lactose', label: 'Buttermilk',       reason: 'Lactose' },
  { pattern: 'fromage à la crème',     level: 'red', group: 'lactose', label: 'Cream cheese',     reason: 'Lactose — unripened cheese' },
  { pattern: 'fromage frais',          level: 'red', group: 'lactose', label: 'Fresh cheese',     reason: 'Lactose — unripened cheese' },
  { pattern: 'ricotta',                level: 'red', group: 'lactose', label: 'Ricotta',          reason: 'Lactose — unripened cheese' },
  { pattern: 'mascarpone',             level: 'red', group: 'lactose', label: 'Mascarpone',       reason: 'Lactose — unripened cheese' },
  { pattern: 'magermilchpulver',       level: 'red', group: 'lactose', label: 'Skimmed milk powder', reason: 'Concentrated lactose', wholeWord: false },
  { pattern: 'milchpulver',            level: 'red', group: 'lactose', label: 'Milk powder',      reason: 'Concentrated lactose', wholeWord: false },
  { pattern: 'milchzucker',            level: 'red', group: 'lactose', label: 'Lactose',          reason: 'Lactose — "Milchzucker" is lactose', wholeWord: false },
  { pattern: 'laktose',                level: 'red', group: 'lactose', label: 'Lactose',          reason: 'Lactose — added directly', wholeWord: false },
  { pattern: 'molkenpulver',           level: 'red', group: 'lactose', label: 'Whey powder',      reason: 'Concentrated lactose', wholeWord: false },
  { pattern: 'molke',                  level: 'red', group: 'lactose', label: 'Whey',             reason: 'Lactose', wholeWord: false },
  { pattern: 'buttermilch',            level: 'red', group: 'lactose', label: 'Buttermilk',       reason: 'Lactose', wholeWord: false },
  { pattern: 'frischkäse',             level: 'red', group: 'lactose', label: 'Fresh cheese',     reason: 'Lactose — unripened cheese', wholeWord: false },
  { pattern: 'magerquark',             level: 'red', group: 'lactose', label: 'Quark',            reason: 'Lactose — unripened cheese', wholeWord: false },
  { pattern: 'quark',                  level: 'red', group: 'lactose', label: 'Quark',            reason: 'Lactose — unripened cheese', wholeWord: false },
  { pattern: 'latte in polvere',       level: 'red', group: 'lactose', label: 'Milk powder',      reason: 'Concentrated lactose' },
  { pattern: 'siero di latte',         level: 'red', group: 'lactose', label: 'Whey',             reason: 'Lactose' },
  { pattern: 'siero del latte',        level: 'red', group: 'lactose', label: 'Whey',             reason: 'Lactose' },
  { pattern: 'lattosio',               level: 'red', group: 'lactose', label: 'Lactose',          reason: 'Lactose — added directly' },

  // ===================================================================
  // RED — LEGUMES
  // ===================================================================
  { pattern: 'farine de pois chiche',  level: 'red', group: 'legume', label: 'Chickpea flour', reason: 'GOS — concentrated' },
  { pattern: 'pois chiches',           level: 'red', group: 'legume', label: 'Chickpeas',       reason: 'GOS' },
  { pattern: 'lentilles',              level: 'red', group: 'legume', label: 'Lentils',         reason: 'GOS' },
  { pattern: 'haricots rouges',        level: 'red', group: 'legume', label: 'Kidney beans',    reason: 'GOS — high' },
  { pattern: 'haricots blancs',        level: 'red', group: 'legume', label: 'White beans',     reason: 'GOS — high' },
  { pattern: 'haricots noirs',         level: 'red', group: 'legume', label: 'Black beans',     reason: 'GOS — high' },
  { pattern: 'fèves',                  level: 'red', group: 'legume', label: 'Broad beans',     reason: 'GOS — high' },
  { pattern: 'farine de lupin',        level: 'red', group: 'legume', label: 'Lupin flour',     reason: 'GOS' },
  { pattern: 'lupin',                  level: 'red', group: 'legume', label: 'Lupin',           reason: 'GOS' },
  { pattern: 'farine de soja',         level: 'red', group: 'legume', label: 'Soy flour',       reason: 'GOS — whole soybean' },
  { pattern: 'kichererbsen',           level: 'red', group: 'legume', label: 'Chickpeas',       reason: 'GOS', wholeWord: false },
  { pattern: 'linsen',                 level: 'red', group: 'legume', label: 'Lentils',         reason: 'GOS', wholeWord: false },
  { pattern: 'kidneybohnen',           level: 'red', group: 'legume', label: 'Kidney beans',    reason: 'GOS — high', wholeWord: false },
  { pattern: 'bohnen',                 level: 'red', group: 'legume', label: 'Beans',           reason: 'GOS — high', wholeWord: false },
  { pattern: 'lupinenmehl',            level: 'red', group: 'legume', label: 'Lupin flour',     reason: 'GOS', wholeWord: false },
  { pattern: 'sojabohnen',             level: 'red', group: 'legume', label: 'Soybeans',        reason: 'GOS — whole soybean', wholeWord: false },
  { pattern: 'sojamehl',               level: 'red', group: 'legume', label: 'Soy flour',       reason: 'GOS — whole soybean', wholeWord: false },
  { pattern: 'ceci',                   level: 'red', group: 'legume', label: 'Chickpeas',       reason: 'GOS' },
  { pattern: 'lenticchie',             level: 'red', group: 'legume', label: 'Lentils',         reason: 'GOS' },
  { pattern: 'fagioli',                level: 'red', group: 'legume', label: 'Beans',           reason: 'GOS — high' },
  { pattern: 'farina di lupini',       level: 'red', group: 'legume', label: 'Lupin flour',     reason: 'GOS' },

  // ===================================================================
  // RED — HIGH-FODMAP FRUIT AND VEGETABLES
  // Watch the collisions here: 'pomme de terre' (potato) and 'poireau'
  // (leek) are separate, longer entries and therefore win.
  // ===================================================================
  { pattern: 'concentré de jus de pomme', level: 'red', group: 'fruit-veg', label: 'Apple juice concentrate', reason: 'Concentrated excess fructose' },
  { pattern: 'jus de pomme concentré',    level: 'red', group: 'fruit-veg', label: 'Apple juice concentrate', reason: 'Concentrated excess fructose' },
  { pattern: 'purée de pomme',         level: 'red', group: 'fruit-veg', label: 'Apple purée',   reason: 'Excess fructose and sorbitol' },
  { pattern: 'jus de poire',           level: 'red', group: 'fruit-veg', label: 'Pear juice',    reason: 'Excess fructose and sorbitol' },
  { pattern: 'jus de fruits concentré', level: 'red', group: 'fruit-veg', label: 'Fruit juice concentrate', reason: 'Usually apple or pear — excess fructose' },
  { pattern: 'pomme',                  level: 'red', group: 'fruit-veg', label: 'Apple',         reason: 'Excess fructose and sorbitol' },
  { pattern: 'poire',                  level: 'red', group: 'fruit-veg', label: 'Pear',          reason: 'Excess fructose and sorbitol' },
  { pattern: 'mangue',                 level: 'red', group: 'fruit-veg', label: 'Mango',         reason: 'Excess fructose' },
  { pattern: 'cerise',                 level: 'red', group: 'fruit-veg', label: 'Cherry',        reason: 'Excess fructose and sorbitol' },
  { pattern: 'pastèque',               level: 'red', group: 'fruit-veg', label: 'Watermelon',    reason: 'Fructans, fructose and mannitol' },
  { pattern: 'pêche',                  level: 'red', group: 'fruit-veg', label: 'Peach',         reason: 'Sorbitol' },
  { pattern: 'nectarine',              level: 'red', group: 'fruit-veg', label: 'Nectarine',     reason: 'Sorbitol' },
  { pattern: 'abricot',                level: 'red', group: 'fruit-veg', label: 'Apricot',       reason: 'Sorbitol' },
  { pattern: 'pruneau',                level: 'red', group: 'fruit-veg', label: 'Prune',         reason: 'Sorbitol — strong laxative effect' },
  { pattern: 'prune',                  level: 'red', group: 'fruit-veg', label: 'Plum',          reason: 'Sorbitol' },
  { pattern: 'figue',                  level: 'red', group: 'fruit-veg', label: 'Fig',           reason: 'Excess fructose' },
  { pattern: 'datte',                  level: 'red', group: 'fruit-veg', label: 'Date',          reason: 'Excess fructose' },
  { pattern: 'asperge',                level: 'red', group: 'fruit-veg', label: 'Asparagus',     reason: 'Fructans and excess fructose' },
  { pattern: 'chou-fleur',             level: 'red', group: 'fruit-veg', label: 'Cauliflower',   reason: 'Mannitol' },
  { pattern: 'champignon de paris',    level: 'red', group: 'fruit-veg', label: 'Button mushroom', reason: 'Mannitol' },
  { pattern: 'champignon',             level: 'red', group: 'fruit-veg', label: 'Mushroom',      reason: 'Mannitol (oyster mushrooms are fine)' },
  { pattern: 'apfelsaftkonzentrat',    level: 'red', group: 'fruit-veg', label: 'Apple juice concentrate', reason: 'Concentrated excess fructose', wholeWord: false },
  { pattern: 'apfel',                  level: 'red', group: 'fruit-veg', label: 'Apple',         reason: 'Excess fructose and sorbitol', wholeWord: false },
  { pattern: 'birne',                  level: 'red', group: 'fruit-veg', label: 'Pear',          reason: 'Excess fructose and sorbitol', wholeWord: false },
  { pattern: 'mango',                  level: 'red', group: 'fruit-veg', label: 'Mango',         reason: 'Excess fructose', wholeWord: false },
  { pattern: 'kirsche',                level: 'red', group: 'fruit-veg', label: 'Cherry',        reason: 'Excess fructose and sorbitol', wholeWord: false },
  { pattern: 'wassermelone',           level: 'red', group: 'fruit-veg', label: 'Watermelon',    reason: 'Fructans, fructose and mannitol', wholeWord: false },
  { pattern: 'pfirsich',               level: 'red', group: 'fruit-veg', label: 'Peach',         reason: 'Sorbitol', wholeWord: false },
  { pattern: 'aprikose',               level: 'red', group: 'fruit-veg', label: 'Apricot',       reason: 'Sorbitol', wholeWord: false },
  { pattern: 'pflaume',                level: 'red', group: 'fruit-veg', label: 'Plum',          reason: 'Sorbitol', wholeWord: false },
  { pattern: 'dattel',                 level: 'red', group: 'fruit-veg', label: 'Date',          reason: 'Excess fructose', wholeWord: false },
  { pattern: 'feige',                  level: 'red', group: 'fruit-veg', label: 'Fig',           reason: 'Excess fructose', wholeWord: false },
  { pattern: 'spargel',                level: 'red', group: 'fruit-veg', label: 'Asparagus',     reason: 'Fructans and excess fructose', wholeWord: false },
  { pattern: 'blumenkohl',             level: 'red', group: 'fruit-veg', label: 'Cauliflower',   reason: 'Mannitol', wholeWord: false },
  { pattern: 'champignons',            level: 'red', group: 'fruit-veg', label: 'Mushroom',      reason: 'Mannitol', wholeWord: false },
  { pattern: 'succo di mela concentrato', level: 'red', group: 'fruit-veg', label: 'Apple juice concentrate', reason: 'Concentrated excess fructose' },
  { pattern: 'mela',                   level: 'red', group: 'fruit-veg', label: 'Apple',         reason: 'Excess fructose and sorbitol' },
  { pattern: 'pera',                   level: 'red', group: 'fruit-veg', label: 'Pear',          reason: 'Excess fructose and sorbitol' },
  { pattern: 'ciliegia',               level: 'red', group: 'fruit-veg', label: 'Cherry',        reason: 'Excess fructose and sorbitol' },
  { pattern: 'anguria',                level: 'red', group: 'fruit-veg', label: 'Watermelon',    reason: 'Fructans, fructose and mannitol' },
  { pattern: 'albicocca',              level: 'red', group: 'fruit-veg', label: 'Apricot',       reason: 'Sorbitol' },
  { pattern: 'dattero',                level: 'red', group: 'fruit-veg', label: 'Date',          reason: 'Excess fructose' },
  { pattern: 'asparagi',               level: 'red', group: 'fruit-veg', label: 'Asparagus',     reason: 'Fructans and excess fructose' },
  { pattern: 'cavolfiore',             level: 'red', group: 'fruit-veg', label: 'Cauliflower',   reason: 'Mannitol' },
  { pattern: 'funghi',                 level: 'red', group: 'fruit-veg', label: 'Mushroom',      reason: 'Mannitol' },

  // ===================================================================
  // RED — HIGH-FODMAP NUTS
  // ===================================================================
  { pattern: 'noix de cajou',          level: 'red', group: 'nuts', label: 'Cashew',    reason: 'GOS and fructans — high' },
  { pattern: 'pistache',               level: 'red', group: 'nuts', label: 'Pistachio', reason: 'GOS and fructans — high' },
  { pattern: 'cashew',                 level: 'red', group: 'nuts', label: 'Cashew',    reason: 'GOS and fructans — high', wholeWord: false },
  { pattern: 'pistazie',               level: 'red', group: 'nuts', label: 'Pistachio', reason: 'GOS and fructans — high', wholeWord: false },
  { pattern: 'anacardi',               level: 'red', group: 'nuts', label: 'Cashew',    reason: 'GOS and fructans — high' },
  { pattern: 'pistacchio',             level: 'red', group: 'nuts', label: 'Pistachio', reason: 'GOS and fructans — high' },

  // ===================================================================
  // YELLOW — VAGUE TERMS THAT MAY BE HIDING ONION OR GARLIC
  // This is the most important yellow group. On a Swiss label you simply
  // cannot tell from the text, so it has to be a "check it" rather than a
  // pass or a fail.
  // ===================================================================
  { pattern: 'arôme naturel',          level: 'yellow', group: 'vague', label: 'Natural flavouring', reason: 'May conceal onion or garlic' },
  { pattern: 'arômes',                 level: 'yellow', group: 'vague', label: 'Flavourings',        reason: 'May conceal onion or garlic' },
  { pattern: 'arôme',                  level: 'yellow', group: 'vague', label: 'Flavouring',         reason: 'May conceal onion or garlic' },
  { pattern: 'mélange d\'épices',      level: 'yellow', group: 'vague', label: 'Spice mix',          reason: 'Often contains onion or garlic powder' },
  { pattern: 'épices',                 level: 'yellow', group: 'vague', label: 'Spices',             reason: 'Often contains onion or garlic powder' },
  { pattern: 'assaisonnement',         level: 'yellow', group: 'vague', label: 'Seasoning',          reason: 'Often contains onion or garlic powder' },
  { pattern: 'bouillon de légumes',    level: 'yellow', group: 'vague', label: 'Vegetable stock',    reason: 'Almost always contains onion' },
  { pattern: 'bouillon',               level: 'yellow', group: 'vague', label: 'Stock',              reason: 'Almost always contains onion' },
  { pattern: 'extrait de levure',      level: 'yellow', group: 'vague', label: 'Yeast extract',      reason: 'Fine in small amounts, check quantity' },
  { pattern: 'extrait de malt',        level: 'yellow', group: 'vague', label: 'Malt extract',       reason: 'Usually barley — check quantity' },
  { pattern: 'natürliches aroma',      level: 'yellow', group: 'vague', label: 'Natural flavouring', reason: 'May conceal onion or garlic', wholeWord: false },
  { pattern: 'gewürzmischung',         level: 'yellow', group: 'vague', label: 'Spice mix',          reason: 'Often contains onion or garlic powder', wholeWord: false },
  { pattern: 'gewürze',                level: 'yellow', group: 'vague', label: 'Spices',             reason: 'Often contains onion or garlic powder', wholeWord: false },
  { pattern: 'gemüsebouillon',         level: 'yellow', group: 'vague', label: 'Vegetable stock',    reason: 'Almost always contains onion', wholeWord: false },
  { pattern: 'hefeextrakt',            level: 'yellow', group: 'vague', label: 'Yeast extract',      reason: 'Fine in small amounts, check quantity', wholeWord: false },
  { pattern: 'aroma',                  level: 'yellow', group: 'vague', label: 'Flavouring',         reason: 'May conceal onion or garlic', wholeWord: false },
  { pattern: 'aroma naturale',         level: 'yellow', group: 'vague', label: 'Natural flavouring', reason: 'May conceal onion or garlic' },
  { pattern: 'spezie',                 level: 'yellow', group: 'vague', label: 'Spices',             reason: 'Often contains onion or garlic powder' },
  { pattern: 'brodo',                  level: 'yellow', group: 'vague', label: 'Stock',              reason: 'Almost always contains onion' },
  { pattern: 'estratto di lievito',    level: 'yellow', group: 'vague', label: 'Yeast extract',      reason: 'Fine in small amounts, check quantity' },

  // ===================================================================
  // YELLOW — PLAIN MILK AND MODERATE DAIRY
  // Group 'dairy-milk' so aged cheeses and "sans lactose" can cancel it.
  // ===================================================================
  { pattern: 'lait',                   level: 'yellow', group: 'dairy-milk', label: 'Milk',          reason: 'Lactose — depends on portion' },
  { pattern: 'crème fraîche',          level: 'yellow', group: 'dairy-milk', label: 'Crème fraîche', reason: 'Lactose — small portions are fine' },
  { pattern: 'crème',                  level: 'yellow', group: 'dairy-milk', label: 'Cream',         reason: 'Lactose — small portions are fine' },
  { pattern: 'yogourt',                level: 'yellow', group: 'dairy-milk', label: 'Yoghurt',       reason: 'Lactose — depends on portion' },
  { pattern: 'yaourt',                 level: 'yellow', group: 'dairy-milk', label: 'Yoghurt',       reason: 'Lactose — depends on portion' },
  { pattern: 'chocolat au lait',       level: 'yellow', group: 'dairy-milk', label: 'Milk chocolate', reason: 'Lactose — about 30 g is tolerated' },
  { pattern: 'mozzarella',             level: 'yellow', group: 'dairy-milk', label: 'Mozzarella',    reason: 'Lactose — moderate' },
  { pattern: 'feta',                   level: 'yellow', group: 'dairy-milk', label: 'Feta',          reason: 'Lactose — moderate' },
  { pattern: 'milchschokolade',        level: 'yellow', group: 'dairy-milk', label: 'Milk chocolate', reason: 'Lactose — about 30 g is tolerated', wholeWord: false },
  { pattern: 'vollmilch',              level: 'yellow', group: 'dairy-milk', label: 'Whole milk',    reason: 'Lactose — depends on portion', wholeWord: false },
  { pattern: 'joghurt',                level: 'yellow', group: 'dairy-milk', label: 'Yoghurt',       reason: 'Lactose — depends on portion', wholeWord: false },
  { pattern: 'sauerrahm',              level: 'yellow', group: 'dairy-milk', label: 'Sour cream',    reason: 'Lactose — small portions are fine', wholeWord: false },
  { pattern: 'rahm',                   level: 'yellow', group: 'dairy-milk', label: 'Cream',         reason: 'Lactose — small portions are fine', wholeWord: false },
  { pattern: 'milch',                  level: 'yellow', group: 'dairy-milk', label: 'Milk',          reason: 'Lactose — depends on portion', wholeWord: false },
  { pattern: 'latte',                  level: 'yellow', group: 'dairy-milk', label: 'Milk',          reason: 'Lactose — depends on portion' },
  { pattern: 'panna',                  level: 'yellow', group: 'dairy-milk', label: 'Cream',         reason: 'Lactose — small portions are fine' },
  { pattern: 'yogurt',                 level: 'yellow', group: 'dairy-milk', label: 'Yoghurt',       reason: 'Lactose — depends on portion' },

  // ===================================================================
  // YELLOW — MODERATE GRAINS, FIBRES, NUTS, FRUIT AND VEG
  // ===================================================================
  { pattern: 'flocons d\'avoine',      level: 'yellow', group: 'other', label: 'Oat flakes',   reason: 'Fructans — about 1/2 cup is fine' },
  { pattern: 'fibre d\'avoine',        level: 'yellow', group: 'other', label: 'Oat fibre',    reason: 'Fructans — depends on quantity' },
  { pattern: 'avoine',                 level: 'yellow', group: 'other', label: 'Oats',         reason: 'Fructans — about 1/2 cup is fine' },
  { pattern: 'fibre de pois',          level: 'yellow', group: 'other', label: 'Pea fibre',    reason: 'GOS — depends on quantity' },
  { pattern: 'gomme de guar',          level: 'yellow', group: 'other', label: 'Guar gum',     reason: 'Fine in small amounts' },
  { pattern: 'e412',                   level: 'yellow', group: 'other', label: 'Guar gum (E412)', reason: 'Fine in small amounts' },
  { pattern: 'polydextrose',           level: 'yellow', group: 'other', label: 'Polydextrose', reason: 'Fermentable fibre — depends on quantity' },
  { pattern: 'érythritol',             level: 'yellow', group: 'other', label: 'Erythritol',   reason: 'Usually well tolerated, but a polyol' },
  { pattern: 'e968',                   level: 'yellow', group: 'other', label: 'Erythritol (E968)', reason: 'Usually well tolerated, but a polyol' },
  { pattern: 'haferflocken',           level: 'yellow', group: 'other', label: 'Oat flakes',   reason: 'Fructans — about 1/2 cup is fine', wholeWord: false },
  { pattern: 'haferfaser',             level: 'yellow', group: 'other', label: 'Oat fibre',    reason: 'Fructans — depends on quantity', wholeWord: false },
  { pattern: 'hafer',                  level: 'yellow', group: 'other', label: 'Oats',         reason: 'Fructans — about 1/2 cup is fine', wholeWord: false },
  { pattern: 'guarkernmehl',           level: 'yellow', group: 'other', label: 'Guar gum',     reason: 'Fine in small amounts', wholeWord: false },
  { pattern: 'erythrit',               level: 'yellow', group: 'other', label: 'Erythritol',   reason: 'Usually well tolerated, but a polyol', wholeWord: false },
  { pattern: 'fiocchi d\'avena',       level: 'yellow', group: 'other', label: 'Oat flakes',   reason: 'Fructans — about 1/2 cup is fine' },
  { pattern: 'avena',                  level: 'yellow', group: 'other', label: 'Oats',         reason: 'Fructans — about 1/2 cup is fine' },

  { pattern: 'noix de coco râpée',     level: 'yellow', group: 'nuts', label: 'Desiccated coconut', reason: 'Sorbitol — about 1/4 cup is fine' },
  { pattern: 'amande',                 level: 'yellow', group: 'nuts', label: 'Almond',        reason: 'GOS — about 10 nuts is fine' },
  { pattern: 'noisette',               level: 'yellow', group: 'nuts', label: 'Hazelnut',      reason: 'Fructans — about 10 nuts is fine' },
  { pattern: 'mandel',                 level: 'yellow', group: 'nuts', label: 'Almond',        reason: 'GOS — about 10 nuts is fine', wholeWord: false },
  { pattern: 'haselnuss',              level: 'yellow', group: 'nuts', label: 'Hazelnut',      reason: 'Fructans — about 10 nuts is fine', wholeWord: false },
  { pattern: 'mandorla',               level: 'yellow', group: 'nuts', label: 'Almond',        reason: 'GOS — about 10 nuts is fine' },
  { pattern: 'nocciola',               level: 'yellow', group: 'nuts', label: 'Hazelnut',      reason: 'Fructans — about 10 nuts is fine' },

  { pattern: 'raisins secs',           level: 'yellow', group: 'fruit-veg', label: 'Raisins',      reason: 'Fructans — about 1 tbsp is fine' },
  { pattern: 'canneberges séchées',    level: 'yellow', group: 'fruit-veg', label: 'Dried cranberries', reason: 'Often sweetened with fruit juice' },
  { pattern: 'petits pois',            level: 'yellow', group: 'fruit-veg', label: 'Green peas',   reason: 'GOS — small portions only' },
  { pattern: 'patate douce',           level: 'yellow', group: 'fruit-veg', label: 'Sweet potato', reason: 'Mannitol — about 1/2 cup is fine' },
  { pattern: 'maïs doux',              level: 'yellow', group: 'fruit-veg', label: 'Sweet corn',   reason: 'Sorbitol — about 1/2 cob is fine' },
  { pattern: 'betterave',              level: 'yellow', group: 'fruit-veg', label: 'Beetroot',     reason: 'Fructans — small portions only' },
  { pattern: 'céleri',                 level: 'yellow', group: 'fruit-veg', label: 'Celery',       reason: 'Mannitol — small portions only' },
  { pattern: 'chou de bruxelles',      level: 'yellow', group: 'fruit-veg', label: 'Brussels sprout', reason: 'Fructans — small portions only' },
  { pattern: 'brocoli',                level: 'yellow', group: 'fruit-veg', label: 'Broccoli',     reason: 'Fructans in the stalk' },
  { pattern: 'courge butternut',       level: 'yellow', group: 'fruit-veg', label: 'Butternut squash', reason: 'Mannitol — about 1/3 cup is fine' },
  { pattern: 'rosinen',                level: 'yellow', group: 'fruit-veg', label: 'Raisins',      reason: 'Fructans — about 1 tbsp is fine', wholeWord: false },
  { pattern: 'erbsen',                 level: 'yellow', group: 'fruit-veg', label: 'Green peas',   reason: 'GOS — small portions only', wholeWord: false },
  { pattern: 'randen',                 level: 'yellow', group: 'fruit-veg', label: 'Beetroot',     reason: 'Fructans — small portions only', wholeWord: false },
  { pattern: 'sellerie',               level: 'yellow', group: 'fruit-veg', label: 'Celery',       reason: 'Mannitol — small portions only', wholeWord: false },
  { pattern: 'rosenkohl',              level: 'yellow', group: 'fruit-veg', label: 'Brussels sprout', reason: 'Fructans — small portions only', wholeWord: false },
  { pattern: 'brokkoli',               level: 'yellow', group: 'fruit-veg', label: 'Broccoli',     reason: 'Fructans in the stalk', wholeWord: false },
  { pattern: 'süsskartoffel',          level: 'yellow', group: 'fruit-veg', label: 'Sweet potato', reason: 'Mannitol — about 1/2 cup is fine', wholeWord: false },
  { pattern: 'uvetta',                 level: 'yellow', group: 'fruit-veg', label: 'Raisins',      reason: 'Fructans — about 1 tbsp is fine' },
  { pattern: 'piselli',                level: 'yellow', group: 'fruit-veg', label: 'Green peas',   reason: 'GOS — small portions only' },
  { pattern: 'barbabietola',           level: 'yellow', group: 'fruit-veg', label: 'Beetroot',     reason: 'Fructans — small portions only' },
  { pattern: 'sedano',                 level: 'yellow', group: 'fruit-veg', label: 'Celery',       reason: 'Mannitol — small portions only' },

  // ===================================================================
  // GREEN — AGED AND HARD CHEESES
  // These suppress the plain-milk flag: Gruyère legitimately lists "lait"
  // but the lactose is gone. This matters a lot on Swiss labels.
  // ===================================================================
  { pattern: 'gruyère',                level: 'green', group: 'aged-cheese', label: 'Gruyère',       suppresses: ['dairy-milk'] },
  { pattern: 'emmental',               level: 'green', group: 'aged-cheese', label: 'Emmental',      suppresses: ['dairy-milk'] },
  { pattern: 'sbrinz',                 level: 'green', group: 'aged-cheese', label: 'Sbrinz',        suppresses: ['dairy-milk'] },
  { pattern: 'appenzeller',            level: 'green', group: 'aged-cheese', label: 'Appenzeller',   suppresses: ['dairy-milk'] },
  { pattern: 'tête de moine',          level: 'green', group: 'aged-cheese', label: 'Tête de Moine', suppresses: ['dairy-milk'] },
  { pattern: 'raclette',               level: 'green', group: 'aged-cheese', label: 'Raclette',      suppresses: ['dairy-milk'] },
  { pattern: 'parmesan',               level: 'green', group: 'aged-cheese', label: 'Parmesan',      suppresses: ['dairy-milk'] },
  { pattern: 'parmigiano',             level: 'green', group: 'aged-cheese', label: 'Parmigiano',    suppresses: ['dairy-milk'] },
  { pattern: 'grana padano',           level: 'green', group: 'aged-cheese', label: 'Grana Padano',  suppresses: ['dairy-milk'] },
  { pattern: 'pecorino',               level: 'green', group: 'aged-cheese', label: 'Pecorino',      suppresses: ['dairy-milk'] },
  { pattern: 'cheddar',                level: 'green', group: 'aged-cheese', label: 'Cheddar',       suppresses: ['dairy-milk'] },
  { pattern: 'brie',                   level: 'green', group: 'aged-cheese', label: 'Brie',          suppresses: ['dairy-milk'] },
  { pattern: 'camembert',              level: 'green', group: 'aged-cheese', label: 'Camembert',     suppresses: ['dairy-milk'] },
  { pattern: 'fromage à raclette',     level: 'green', group: 'aged-cheese', label: 'Raclette cheese', suppresses: ['dairy-milk'] },
  { pattern: 'sauermilchkäse',         level: 'green', group: 'aged-cheese', label: 'Aged cheese',   suppresses: ['dairy-milk'], wholeWord: false },
  { pattern: 'hartkäse',               level: 'green', group: 'aged-cheese', label: 'Hard cheese',   suppresses: ['dairy-milk'], wholeWord: false },
  { pattern: 'bergkäse',               level: 'green', group: 'aged-cheese', label: 'Mountain cheese', suppresses: ['dairy-milk'], wholeWord: false },

  // ===================================================================
  // GREEN — LACTIC ACID AND CULTURES
  // These exist chiefly to stop the German substring 'milch' from matching
  // inside 'Milchsäure', which is lactic acid and perfectly fine.
  // ===================================================================
  { pattern: 'milchsäurekulturen',     level: 'green', label: 'Lactic acid cultures', wholeWord: false },
  { pattern: 'milchsäure',             level: 'green', label: 'Lactic acid',          wholeWord: false },
  { pattern: 'acide lactique',         level: 'green', label: 'Lactic acid' },
  { pattern: 'acido lattico',          level: 'green', label: 'Lactic acid' },
  { pattern: 'ferments lactiques',     level: 'green', label: 'Lactic cultures' },
  { pattern: 'cultures lactiques',     level: 'green', label: 'Lactic cultures' },

  // ===================================================================
  // GREEN — SUGARS AND SWEETENERS THAT ARE FINE
  // 'sirop de glucose' lives here. The red glucose-fructose entry above is
  // longer, so it always wins when both could match.
  // ===================================================================
  { pattern: 'sirop de glucose',       level: 'green', label: 'Glucose syrup' },
  { pattern: 'glukosesirup',           level: 'green', label: 'Glucose syrup', wholeWord: false },
  { pattern: 'sciroppo di glucosio',   level: 'green', label: 'Glucose syrup' },
  { pattern: 'sirop d\'érable',        level: 'green', label: 'Maple syrup' },
  { pattern: 'sirop de riz',           level: 'green', label: 'Rice syrup' },
  { pattern: 'saccharose',             level: 'green', label: 'Sucrose' },
  { pattern: 'dextrose',               level: 'green', label: 'Dextrose' },
  { pattern: 'glucose',                level: 'green', label: 'Glucose' },
  { pattern: 'sucre de canne',         level: 'green', label: 'Cane sugar' },
  { pattern: 'sucre',                  level: 'green', label: 'Sugar' },
  { pattern: 'zucker',                 level: 'green', label: 'Sugar', wholeWord: false },
  { pattern: 'zucchero',               level: 'green', label: 'Sugar' },
  { pattern: 'stévia',                 level: 'green', label: 'Stevia' },
  { pattern: 'sucralose',              level: 'green', label: 'Sucralose' },
  { pattern: 'aspartame',              level: 'green', label: 'Aspartame' },
  { pattern: 'acésulfame',             level: 'green', label: 'Acesulfame-K' },
  { pattern: 'saccharine',             level: 'green', label: 'Saccharin' },

  // ===================================================================
  // GREEN — SAFE STARCHES AND GRAINS
  // 'pomme de terre' is here and is longer than the red 'pomme', so potato
  // never gets mistaken for apple.
  // ===================================================================
  { pattern: 'fécule de pomme de terre', level: 'green', label: 'Potato starch' },
  { pattern: 'pomme de terre',         level: 'green', label: 'Potato' },
  { pattern: 'kartoffelstärke',        level: 'green', label: 'Potato starch', wholeWord: false },
  { pattern: 'kartoffel',              level: 'green', label: 'Potato', wholeWord: false },
  { pattern: 'patata',                 level: 'green', label: 'Potato' },
  { pattern: 'farine de riz',          level: 'green', label: 'Rice flour' },
  { pattern: 'amidon de riz',          level: 'green', label: 'Rice starch' },
  { pattern: 'riz',                    level: 'green', label: 'Rice' },
  { pattern: 'reismehl',               level: 'green', label: 'Rice flour', wholeWord: false },
  { pattern: 'reis',                   level: 'green', label: 'Rice', wholeWord: false },
  { pattern: 'riso',                   level: 'green', label: 'Rice' },
  { pattern: 'amidon de maïs',         level: 'green', label: 'Corn starch' },
  { pattern: 'farine de maïs',         level: 'green', label: 'Corn flour' },
  { pattern: 'maïzena',                level: 'green', label: 'Cornflour' },
  { pattern: 'maïs',                   level: 'green', label: 'Corn' },
  { pattern: 'maisstärke',             level: 'green', label: 'Corn starch', wholeWord: false },
  { pattern: 'maismehl',               level: 'green', label: 'Corn flour', wholeWord: false },
  { pattern: 'mais',                   level: 'green', label: 'Corn', wholeWord: false },
  { pattern: 'amido di mais',          level: 'green', label: 'Corn starch' },
  { pattern: 'amidon modifié',         level: 'green', label: 'Modified starch' },
  { pattern: 'modifizierte stärke',    level: 'green', label: 'Modified starch', wholeWord: false },
  { pattern: 'amidon',                 level: 'green', label: 'Starch' },
  { pattern: 'stärke',                 level: 'green', label: 'Starch', wholeWord: false },
  { pattern: 'quinoa',                 level: 'green', label: 'Quinoa', wholeWord: false },
  { pattern: 'sarrasin',               level: 'green', label: 'Buckwheat' },
  { pattern: 'buchweizen',             level: 'green', label: 'Buckwheat', wholeWord: false },
  { pattern: 'grano saraceno',         level: 'green', label: 'Buckwheat' },
  { pattern: 'millet',                 level: 'green', label: 'Millet' },
  { pattern: 'tapioca',                level: 'green', label: 'Tapioca', wholeWord: false },
  { pattern: 'polenta',                level: 'green', label: 'Polenta', wholeWord: false },

  // ===================================================================
  // GREEN — FATS, OILS, BASIC ADDITIVES
  // ===================================================================
  { pattern: 'huile de tournesol',     level: 'green', label: 'Sunflower oil' },
  { pattern: 'huile de colza',         level: 'green', label: 'Rapeseed oil' },
  { pattern: 'huile d\'olive',         level: 'green', label: 'Olive oil' },
  { pattern: 'huile de palme',         level: 'green', label: 'Palm oil' },
  { pattern: 'huile',                  level: 'green', label: 'Oil' },
  { pattern: 'sonnenblumenöl',         level: 'green', label: 'Sunflower oil', wholeWord: false },
  { pattern: 'rapsöl',                 level: 'green', label: 'Rapeseed oil', wholeWord: false },
  { pattern: 'olivenöl',               level: 'green', label: 'Olive oil', wholeWord: false },
  { pattern: 'olio di oliva',          level: 'green', label: 'Olive oil' },
  { pattern: 'olio di girasole',       level: 'green', label: 'Sunflower oil' },
  { pattern: 'beurre de cacao',        level: 'green', label: 'Cocoa butter' },
  { pattern: 'beurre de cacahuète',    level: 'green', label: 'Peanut butter' },
  { pattern: 'beurre',                 level: 'green', label: 'Butter' },
  { pattern: 'kakaobutter',            level: 'green', label: 'Cocoa butter', wholeWord: false },
  { pattern: 'butter',                 level: 'green', label: 'Butter', wholeWord: false },
  { pattern: 'burro',                  level: 'green', label: 'Butter' },
  { pattern: 'margarine',              level: 'green', label: 'Margarine', wholeWord: false },
  { pattern: 'lécithine de tournesol', level: 'green', label: 'Sunflower lecithin' },
  { pattern: 'lécithine de soja',      level: 'green', label: 'Soy lecithin' },
  { pattern: 'lécithine',              level: 'green', label: 'Lecithin' },
  { pattern: 'lecithin',               level: 'green', label: 'Lecithin', wholeWord: false },
  { pattern: 'lecitina',               level: 'green', label: 'Lecithin' },
  { pattern: 'gomme xanthane',         level: 'green', label: 'Xanthan gum' },
  { pattern: 'e415',                   level: 'green', label: 'Xanthan gum (E415)' },
  { pattern: 'xanthan',                level: 'green', label: 'Xanthan gum', wholeWord: false },
  { pattern: 'carraghénane',           level: 'green', label: 'Carrageenan' },
  { pattern: 'carrageen',              level: 'green', label: 'Carrageenan', wholeWord: false },
  { pattern: 'acide citrique',         level: 'green', label: 'Citric acid' },
  { pattern: 'citronensäure',          level: 'green', label: 'Citric acid', wholeWord: false },
  { pattern: 'acido citrico',          level: 'green', label: 'Citric acid' },
  { pattern: 'acide ascorbique',       level: 'green', label: 'Ascorbic acid' },
  { pattern: 'ascorbinsäure',          level: 'green', label: 'Ascorbic acid', wholeWord: false },
  { pattern: 'tocophérol',             level: 'green', label: 'Tocopherols' },
  { pattern: 'tocopherol',             level: 'green', label: 'Tocopherols', wholeWord: false },
  { pattern: 'bicarbonate',            level: 'green', label: 'Bicarbonate' },
  { pattern: 'poudre à lever',         level: 'green', label: 'Baking powder' },
  { pattern: 'backpulver',             level: 'green', label: 'Baking powder', wholeWord: false },
  { pattern: 'carbonate de calcium',   level: 'green', label: 'Calcium carbonate' },
  { pattern: 'levure',                 level: 'green', label: 'Yeast' },
  { pattern: 'hefe',                   level: 'green', label: 'Yeast', wholeWord: false },
  { pattern: 'lievito',                level: 'green', label: 'Yeast' },

  // ===================================================================
  // GREEN — SALT, WATER, VINEGAR, HERBS
  // ===================================================================
  { pattern: 'eau',                    level: 'green', label: 'Water' },
  { pattern: 'wasser',                 level: 'green', label: 'Water', wholeWord: false },
  { pattern: 'acqua',                  level: 'green', label: 'Water' },
  { pattern: 'sel',                    level: 'green', label: 'Salt' },
  { pattern: 'salz',                   level: 'green', label: 'Salt', wholeWord: false },
  { pattern: 'sale',                   level: 'green', label: 'Salt' },
  { pattern: 'poivre',                 level: 'green', label: 'Pepper' },
  { pattern: 'pfeffer',                level: 'green', label: 'Pepper', wholeWord: false },
  { pattern: 'pepe',                   level: 'green', label: 'Pepper' },
  { pattern: 'vinaigre de cidre',      level: 'yellow', group: 'other', label: 'Cider vinegar', reason: 'Excess fructose — small amounts only' },
  { pattern: 'vinaigre',               level: 'green', label: 'Vinegar' },
  { pattern: 'essig',                  level: 'green', label: 'Vinegar', wholeWord: false },
  { pattern: 'aceto',                  level: 'green', label: 'Vinegar' },
  { pattern: 'basilic',                level: 'green', label: 'Basil' },
  { pattern: 'origan',                 level: 'green', label: 'Oregano' },
  { pattern: 'thym',                   level: 'green', label: 'Thyme' },
  { pattern: 'romarin',                level: 'green', label: 'Rosemary' },
  { pattern: 'persil',                 level: 'green', label: 'Parsley' },
  { pattern: 'paprika',                level: 'green', label: 'Paprika', wholeWord: false },
  { pattern: 'curcuma',                level: 'green', label: 'Turmeric' },
  { pattern: 'cumin',                  level: 'green', label: 'Cumin' },
  { pattern: 'cannelle',               level: 'green', label: 'Cinnamon' },
  { pattern: 'zimt',                   level: 'green', label: 'Cinnamon', wholeWord: false },
  { pattern: 'vanille',                level: 'green', label: 'Vanilla', wholeWord: false },
  { pattern: 'muscade',                level: 'green', label: 'Nutmeg' },

  // ===================================================================
  // GREEN — EGGS, MEAT, FISH
  // ===================================================================
  { pattern: 'blanc d\'oeuf',          level: 'green', label: 'Egg white' },
  { pattern: 'jaune d\'oeuf',          level: 'green', label: 'Egg yolk' },
  { pattern: 'oeuf',                   level: 'green', label: 'Egg' },
  { pattern: 'œuf',                    level: 'green', label: 'Egg' },
  { pattern: 'vollei',                 level: 'green', label: 'Whole egg', wholeWord: false },
  { pattern: 'eigelb',                 level: 'green', label: 'Egg yolk', wholeWord: false },
  { pattern: 'eiweiss',                level: 'green', label: 'Egg white', wholeWord: false },
  { pattern: 'uovo',                   level: 'green', label: 'Egg' },
  { pattern: 'uova',                   level: 'green', label: 'Egg' },
  { pattern: 'poulet',                 level: 'green', label: 'Chicken' },
  { pattern: 'dinde',                  level: 'green', label: 'Turkey' },
  { pattern: 'boeuf',                  level: 'green', label: 'Beef' },
  { pattern: 'bœuf',                   level: 'green', label: 'Beef' },
  { pattern: 'porc',                   level: 'green', label: 'Pork' },
  { pattern: 'jambon',                 level: 'green', label: 'Ham' },
  { pattern: 'poisson',                level: 'green', label: 'Fish' },
  { pattern: 'thon',                   level: 'green', label: 'Tuna' },
  { pattern: 'saumon',                 level: 'green', label: 'Salmon' },
  { pattern: 'hähnchen',               level: 'green', label: 'Chicken', wholeWord: false },
  { pattern: 'poulet',                 level: 'green', label: 'Chicken', wholeWord: false },
  { pattern: 'rindfleisch',            level: 'green', label: 'Beef', wholeWord: false },
  { pattern: 'schweinefleisch',        level: 'green', label: 'Pork', wholeWord: false },
  { pattern: 'schinken',               level: 'green', label: 'Ham', wholeWord: false },
  { pattern: 'fisch',                  level: 'green', label: 'Fish', wholeWord: false },
  { pattern: 'lachs',                  level: 'green', label: 'Salmon', wholeWord: false },
  { pattern: 'thunfisch',              level: 'green', label: 'Tuna', wholeWord: false },
  { pattern: 'pollo',                  level: 'green', label: 'Chicken' },
  { pattern: 'manzo',                  level: 'green', label: 'Beef' },
  { pattern: 'prosciutto',             level: 'green', label: 'Ham' },
  { pattern: 'tonno',                  level: 'green', label: 'Tuna' },
  { pattern: 'salmone',                level: 'green', label: 'Salmon' },

  // ===================================================================
  // GREEN — COCOA AND CHOCOLATE
  // ===================================================================
  { pattern: 'chocolat noir',          level: 'green', label: 'Dark chocolate' },
  { pattern: 'pâte de cacao',          level: 'green', label: 'Cocoa mass' },
  { pattern: 'cacao',                  level: 'green', label: 'Cocoa' },
  { pattern: 'kakaomasse',             level: 'green', label: 'Cocoa mass', wholeWord: false },
  { pattern: 'kakao',                  level: 'green', label: 'Cocoa', wholeWord: false },
  { pattern: 'dunkle schokolade',      level: 'green', label: 'Dark chocolate', wholeWord: false },
  { pattern: 'cioccolato fondente',    level: 'green', label: 'Dark chocolate' },

  // ===================================================================
  // GREEN — LOW-FODMAP FRUIT AND VEGETABLES
  // 'laitue' is here and is longer than the yellow 'lait', so lettuce is
  // never reported as milk.
  // ===================================================================
  { pattern: 'laitue',                 level: 'green', label: 'Lettuce' },
  { pattern: 'fraise',                 level: 'green', label: 'Strawberry' },
  { pattern: 'myrtille',               level: 'green', label: 'Blueberry' },
  { pattern: 'framboise',              level: 'green', label: 'Raspberry' },
  { pattern: 'raisin',                 level: 'green', label: 'Grape' },
  { pattern: 'orange',                 level: 'green', label: 'Orange' },
  { pattern: 'citron',                 level: 'green', label: 'Lemon' },
  { pattern: 'kiwi',                   level: 'green', label: 'Kiwi' },
  { pattern: 'ananas',                 level: 'green', label: 'Pineapple' },
  { pattern: 'mandarine',              level: 'green', label: 'Mandarin' },
  { pattern: 'melon charentais',       level: 'green', label: 'Cantaloupe' },
  { pattern: 'banane',                 level: 'green', label: 'Banana (firm)' },
  { pattern: 'carotte',                level: 'green', label: 'Carrot' },
  { pattern: 'courgette',              level: 'green', label: 'Courgette' },
  { pattern: 'aubergine',              level: 'green', label: 'Aubergine' },
  { pattern: 'poivron',                level: 'green', label: 'Pepper (bell)' },
  { pattern: 'tomate',                 level: 'green', label: 'Tomato' },
  { pattern: 'concombre',              level: 'green', label: 'Cucumber' },
  { pattern: 'épinard',                level: 'green', label: 'Spinach' },
  { pattern: 'radis',                  level: 'green', label: 'Radish' },
  { pattern: 'haricot vert',           level: 'green', label: 'Green bean' },
  { pattern: 'panais',                 level: 'green', label: 'Parsnip' },
  { pattern: 'navet',                  level: 'green', label: 'Turnip' },
  { pattern: 'olive',                  level: 'green', label: 'Olive' },
  { pattern: 'erdbeere',               level: 'green', label: 'Strawberry', wholeWord: false },
  { pattern: 'heidelbeere',            level: 'green', label: 'Blueberry', wholeWord: false },
  { pattern: 'himbeere',               level: 'green', label: 'Raspberry', wholeWord: false },
  { pattern: 'traube',                 level: 'green', label: 'Grape', wholeWord: false },
  { pattern: 'zitrone',                level: 'green', label: 'Lemon', wholeWord: false },
  { pattern: 'karotte',                level: 'green', label: 'Carrot', wholeWord: false },
  { pattern: 'rüebli',                 level: 'green', label: 'Carrot', wholeWord: false },
  { pattern: 'zucchetti',              level: 'green', label: 'Courgette', wholeWord: false },
  { pattern: 'zucchini',               level: 'green', label: 'Courgette', wholeWord: false },
  { pattern: 'aubergine',              level: 'green', label: 'Aubergine', wholeWord: false },
  { pattern: 'tomaten',                level: 'green', label: 'Tomato', wholeWord: false },
  { pattern: 'gurke',                  level: 'green', label: 'Cucumber', wholeWord: false },
  { pattern: 'spinat',                 level: 'green', label: 'Spinach', wholeWord: false },
  { pattern: 'fragola',                level: 'green', label: 'Strawberry' },
  { pattern: 'lampone',                level: 'green', label: 'Raspberry' },
  { pattern: 'limone',                 level: 'green', label: 'Lemon' },
  { pattern: 'carota',                 level: 'green', label: 'Carrot' },
  { pattern: 'pomodoro',               level: 'green', label: 'Tomato' },
  { pattern: 'melanzana',              level: 'green', label: 'Aubergine' },
  { pattern: 'spinaci',                level: 'green', label: 'Spinach' },

  // ===================================================================
  // GREEN — LOW-FODMAP NUTS AND SEEDS
  // ===================================================================
  { pattern: 'noix de grenoble',       level: 'green', label: 'Walnut' },
  { pattern: 'noix',                   level: 'green', label: 'Walnut' },
  { pattern: 'graines de courge',      level: 'green', label: 'Pumpkin seeds' },
  { pattern: 'graines de tournesol',   level: 'green', label: 'Sunflower seeds' },
  { pattern: 'graines de chia',        level: 'green', label: 'Chia seeds' },
  { pattern: 'graines de lin',         level: 'green', label: 'Linseed' },
  { pattern: 'graines de sésame',      level: 'green', label: 'Sesame seeds' },
  { pattern: 'cacahuète',              level: 'green', label: 'Peanut' },
  { pattern: 'arachide',               level: 'green', label: 'Peanut' },
  { pattern: 'walnuss',                level: 'green', label: 'Walnut', wholeWord: false },
  { pattern: 'kürbiskerne',            level: 'green', label: 'Pumpkin seeds', wholeWord: false },
  { pattern: 'sonnenblumenkerne',      level: 'green', label: 'Sunflower seeds', wholeWord: false },
  { pattern: 'leinsamen',              level: 'green', label: 'Linseed', wholeWord: false },
  { pattern: 'sesam',                  level: 'green', label: 'Sesame seeds', wholeWord: false },
  { pattern: 'erdnuss',                level: 'green', label: 'Peanut', wholeWord: false },
  { pattern: 'chiasamen',              level: 'green', label: 'Chia seeds', wholeWord: false },
  { pattern: 'noce',                   level: 'green', label: 'Walnut' },
  { pattern: 'arachidi',               level: 'green', label: 'Peanut' },

  // ===================================================================
  // GREEN — FIRM TOFU AND SOY PRODUCTS THAT ARE FINE
  // Whole soybeans are red (above); these processed forms are not.
  // ===================================================================
  { pattern: 'tofu ferme',             level: 'green', label: 'Firm tofu' },
  { pattern: 'tofu',                   level: 'green', label: 'Tofu (firm)' },
  { pattern: 'sauce soja',             level: 'green', label: 'Soy sauce' },
  { pattern: 'sojasauce',              level: 'green', label: 'Soy sauce', wholeWord: false },
  { pattern: 'protéine de soja',       level: 'yellow', group: 'legume', label: 'Soy protein', reason: 'Depends on the form — check quantity' },
  { pattern: 'sojaprotein',            level: 'yellow', group: 'legume', label: 'Soy protein', reason: 'Depends on the form — check quantity', wholeWord: false },
];

/* ---------------------------------------------------------------------
 * TRACE-AMOUNT MARKERS ("less than 2%")
 * Anything appearing AFTER one of these phrases is treated as a trace
 * amount: red is downgraded to yellow, yellow to green. Entries marked
 * alwaysFlag are exempt and stay red.
 * Add new wordings here if you spot one on a label.
 * ------------------------------------------------------------------- */
export const TRACE_MARKERS = [
  'moins de 2%',
  'moins de 2 %',
  '2% ou moins',
  '2 % ou moins',
  'en quantité non significative',
  'weniger als 2%',
  'weniger als 2 %',
  '2% oder weniger',
  'meno del 2%',
  'meno del 2 %',
  'less than 2%',
  '2% or less',
];

/* ---------------------------------------------------------------------
 * ALLERGEN ADVISORY MARKERS
 * Everything after one of these is a "may contain traces" warning, not an
 * ingredient list. We cut the text here so cross-contamination notices do
 * not produce false flags — traces are irrelevant for FODMAPs.
 * ------------------------------------------------------------------- */
export const ADVISORY_MARKERS = [
  'peut contenir',
  'peut contenir des traces',
  'traces éventuelles',
  'kann spuren',
  'kann spuren von',
  'può contenere',
  'may contain',
];

/* ---------------------------------------------------------------------
 * INGREDIENT-LIST HEADERS
 * Used two ways: to decide the photo is readable at all, and to skip past
 * the header before listing unrecognised words.
 * ------------------------------------------------------------------- */
export const HEADER_MARKERS = [
  'ingredient',      // matches ingrédients, ingredients, ingredienti
  'zutaten',
  'composition',
  'composizione',
];

/* ---------------------------------------------------------------------
 * NOISE WORDS
 * Connectives and packaging boilerplate that should never be reported as
 * an unrecognised ingredient.
 * ------------------------------------------------------------------- */
export const NOISE_WORDS = new Set([
  'et', 'ou', 'de', 'du', 'des', 'la', 'le', 'les', 'un', 'une', 'avec',
  'dont', 'sans', 'contient', 'total', 'min', 'max', 'env', 'dans',
  'und', 'oder', 'mit', 'ohne', 'davon', 'enthalt', 'enthalten', 'ca',
  'di', 'con', 'senza', 'che', 'del', 'della', 'delle', 'dei',
  'and', 'or', 'with', 'from', 'contains',
  'bio', 'organic', 'naturel', 'naturliche', 'natural',
  'ingredients', 'ingredient', 'zutaten', 'composition', 'composizione',
]);
