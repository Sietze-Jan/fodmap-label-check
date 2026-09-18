/* =====================================================================
 * analyse.js — MATCHING AND ANALYSIS LOGIC
 * =====================================================================
 *
 * Pure functions only. No DOM, no browser APIs. That is deliberate: it
 * means test/test.js can import this file directly under plain `node` with
 * no test framework and no build step.
 *
 * You should rarely need to edit this file. To improve accuracy, add
 * entries to js/ingredients.js instead — the ordering rules there resolve
 * collisions automatically.
 *
 * ===================================================================== */

import {
  INGREDIENTS,
  TRACE_MARKERS,
  ADVISORY_MARKERS,
  HEADER_MARKERS,
  NOISE_WORDS,
} from './ingredients.js';

/* ---------------------------------------------------------------------
 * NORMALISATION
 *
 * Applied identically to label text AND to the patterns in
 * ingredients.js, which is why you can write patterns naturally with
 * accents, apostrophes and hyphens.
 *
 *   'Sirop de Glucose-Fructose'  ->  'sirop de glucose fructose'
 *   "huile d'olive"              ->  'huile d olive'
 *   'Milchsäure'                 ->  'milchsaure'
 *   'Hartweizengrieß'            ->  'hartweizengriess'
 *
 * Commas, semicolons, parentheses and percent signs survive, because the
 * unrecognised-ingredient pass needs them as token boundaries.
 * ------------------------------------------------------------------- */
export function normalise(input) {
  if (typeof input !== 'string') return '';
  return input
    .toLowerCase()
    .replace(/ß/g, 'ss')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // strip combining accents
    .replace(/[\u2018\u2019'`´]/g, ' ') // apostrophes become spaces
    .replace(/[-–—_/\\*|]/g, ' ')       // hyphens and slashes become spaces
    .replace(/[^a-z0-9,;().%\s]/g, ' ') // drop anything else
    .replace(/\s+/g, ' ')
    .trim();
}

/* ---------------------------------------------------------------------
 * ENTRY PREPARATION
 *
 * Patterns are normalised once and sorted most-specific-first:
 *   1. explicit `priority` descending (rarely used)
 *   2. normalised pattern length descending
 *
 * Combined with span consumption in findMatches(), this is what makes
 * 'pomme de terre' beat 'pomme' and 'Milchsäure' beat 'Milch'.
 * ------------------------------------------------------------------- */
function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function prepareEntries(list) {
  return list
    .map((entry, index) => {
      const normalisedPattern = normalise(entry.pattern);
      const wholeWord = entry.wholeWord !== false; // default true
      // Whole-word mode allows an optional plural suffix on EVERY word, not
      // just the last one. French pluralises the head noun, so labels read
      // "pommes de terre" and "pois chiches" — matching only a trailing 's'
      // would miss both and, worse, let "pommes" fall through to the red
      // "pomme" (apple) entry.
      const source = wholeWord
        ? `\\b${normalisedPattern
            .split(' ')
            .map((word) => `${escapeRegex(word)}(?:s|es)?`)
            .join('\\s+')}\\b`
        : escapeRegex(normalisedPattern);
      return {
        ...entry,
        normalisedPattern,
        wholeWord,
        regex: new RegExp(source, 'g'),
        priority: entry.priority ?? 0,
        index,
      };
    })
    .filter((entry) => entry.normalisedPattern.length > 0)
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      const lengthDiff = b.normalisedPattern.length - a.normalisedPattern.length;
      if (lengthDiff !== 0) return lengthDiff;
      return a.index - b.index;
    });
}

const PREPARED_ENTRIES = prepareEntries(INGREDIENTS);

/* Exposed for the test file's sanity checks. */
export function getPreparedEntries() {
  return PREPARED_ENTRIES;
}

/* ---------------------------------------------------------------------
 * SPAN-CONSUMING MATCHER
 *
 * Walks the entries in specificity order. A match is only accepted if it
 * does not overlap a stretch of text that a more specific entry already
 * claimed. This is the whole collision-resolution strategy.
 * ------------------------------------------------------------------- */
function overlapsConsumed(consumed, start, end) {
  for (const [cStart, cEnd] of consumed) {
    if (start < cEnd && end > cStart) return true;
  }
  return false;
}

function findMatches(text, entries = PREPARED_ENTRIES) {
  const consumed = [];
  const matches = [];

  for (const entry of entries) {
    entry.regex.lastIndex = 0;
    let match;
    while ((match = entry.regex.exec(text)) !== null) {
      if (match[0].length === 0) {
        entry.regex.lastIndex += 1;
        continue;
      }
      const start = match.index;
      const end = start + match[0].length;
      if (!overlapsConsumed(consumed, start, end)) {
        consumed.push([start, end]);
        matches.push({ entry, start, end, matchedText: match[0] });
      }
    }
  }

  matches.sort((a, b) => a.start - b.start);
  return matches;
}

/* ---------------------------------------------------------------------
 * TEXT REGION HELPERS
 * ------------------------------------------------------------------- */
function findEarliestMarker(text, markers) {
  let earliest = -1;
  for (const marker of markers) {
    const normalised = normalise(marker);
    if (!normalised) continue;
    const at = text.indexOf(normalised);
    if (at !== -1 && (earliest === -1 || at < earliest)) earliest = at;
  }
  return earliest;
}

/* Cut off "may contain traces of..." advisories — irrelevant for FODMAPs
 * and a reliable source of false positives. */
function stripAdvisory(text) {
  const at = findEarliestMarker(text, ADVISORY_MARKERS);
  return at === -1 ? text : text.slice(0, at).trim();
}

function hasHeader(text) {
  return HEADER_MARKERS.some((marker) => text.includes(normalise(marker)));
}

function countTokens(text) {
  return text
    .split(/[,;]/)
    .map((t) => t.trim())
    .filter((t) => t.replace(/[^a-z]/g, '').length >= 2).length;
}

/* ---------------------------------------------------------------------
 * READABILITY GATE
 *
 * The single most important safety rule in this tool: a bad photo must
 * never produce a green verdict. If there is no ingredient-list header AND
 * fewer than three comma-separated tokens, we refuse to show a colour.
 * ------------------------------------------------------------------- */
export function isReadable(normalisedText) {
  if (!normalisedText || normalisedText.replace(/[^a-z]/g, '').length < 12) {
    return false;
  }
  return hasHeader(normalisedText) || countTokens(normalisedText) >= 3;
}

/* ---------------------------------------------------------------------
 * UNRECOGNISED INGREDIENTS
 *
 * Any comma-separated token not covered by a match. These are shown in
 * their own bucket and NEVER folded into green — an ingredient we do not
 * know about is not the same as an ingredient we know is fine.
 * ------------------------------------------------------------------- */
const MAX_UNRECOGNISED = 12;

function findUnrecognised(text, matches) {
  // Start after the header, if there is one.
  let searchFrom = 0;
  for (const marker of HEADER_MARKERS) {
    const at = text.indexOf(normalise(marker));
    if (at !== -1) {
      const colon = text.indexOf(':', at);
      searchFrom = Math.max(searchFrom, colon !== -1 ? colon + 1 : at + marker.length);
    }
  }

  const region = text.slice(searchFrom);
  const results = [];
  const seen = new Set();

  let cursor = searchFrom;
  for (const rawToken of region.split(/[,;]/)) {
    const tokenStart = cursor;
    const tokenEnd = cursor + rawToken.length;
    cursor = tokenEnd + 1; // account for the separator

    const covered = matches.some((m) => m.start < tokenEnd && m.end > tokenStart);
    if (covered) continue;

    // Strip percentages and standalone quantities, but keep additive codes:
    // "sucre 15%" becomes "sucre", while "e471" survives intact because the
    // digits there are not preceded by a word boundary.
    const cleaned = rawToken
      .replace(/\([^)]*\)/g, ' ')
      .replace(/\b\d+(?:[.,]\d+)?\s*%/g, ' ')
      .replace(/\b\d+(?:[.,]\d+)?\b/g, ' ')
      .replace(/[()%.]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned.length < 3) continue;
    if (NOISE_WORDS.has(cleaned)) continue;
    // Drop tokens made only of noise words, e.g. "et de la".
    const words = cleaned.split(' ').filter((w) => w.length > 1);
    if (words.length === 0) continue;
    if (words.every((w) => NOISE_WORDS.has(w))) continue;

    if (seen.has(cleaned)) continue;
    seen.add(cleaned);
    results.push(cleaned);
  }

  return results.slice(0, MAX_UNRECOGNISED);
}

/* ---------------------------------------------------------------------
 * LEVEL ARITHMETIC
 * ------------------------------------------------------------------- */
const DOWNGRADE = { red: 'yellow', yellow: 'green', green: 'green' };

function rollUpVerdict(reds, yellows) {
  if (reds.length > 0) return 'red';
  if (yellows.length > 0) return 'yellow';
  return 'green';
}

/* ---------------------------------------------------------------------
 * MAIN ENTRY POINT
 *
 * analyse(rawText) -> {
 *   status: 'unreadable' | 'ok',
 *   verdict: 'red' | 'yellow' | 'green',
 *   red:    [{ label, reason, trace }],
 *   yellow: [{ label, reason, trace }],
 *   green:  [{ label }],
 *   unrecognised: ['e471', ...],
 *   traceRuleApplied: boolean,
 *   suppressedGroups: ['dairy-milk'],
 *   normalisedText: string,
 * }
 * ------------------------------------------------------------------- */
export function analyse(rawText) {
  const normalisedFull = normalise(rawText);

  if (!isReadable(normalisedFull)) {
    return {
      status: 'unreadable',
      verdict: null,
      red: [],
      yellow: [],
      green: [],
      unrecognised: [],
      traceRuleApplied: false,
      suppressedGroups: [],
      normalisedText: normalisedFull,
    };
  }

  const text = stripAdvisory(normalisedFull);
  const matches = findMatches(text);

  // Pass 1 — collect suppressed groups (e.g. "sans lactose", or an aged
  // cheese cancelling the plain-milk flag).
  const suppressedGroups = new Set();
  for (const { entry } of matches) {
    if (Array.isArray(entry.suppresses)) {
      for (const group of entry.suppresses) suppressedGroups.add(group);
    }
  }

  // Where does the "less than 2%" region begin?
  const traceMarkerAt = findEarliestMarker(text, TRACE_MARKERS);

  // Pass 2 — assign an effective level to every match.
  const red = [];
  const yellow = [];
  const green = [];
  const seenLabels = { red: new Set(), yellow: new Set(), green: new Set() };
  let traceRuleApplied = false;

  for (const match of matches) {
    const { entry, start } = match;

    if (entry.group && suppressedGroups.has(entry.group)) continue;

    const inTraceRegion = traceMarkerAt !== -1 && start >= traceMarkerAt;
    let level = entry.level;

    if (inTraceRegion && !entry.alwaysFlag && level !== 'green') {
      level = DOWNGRADE[level];
      traceRuleApplied = true;
    }

    const bucket = level === 'red' ? red : level === 'yellow' ? yellow : green;
    if (seenLabels[level].has(entry.label)) continue;
    seenLabels[level].add(entry.label);

    bucket.push({
      label: entry.label,
      reason: entry.reason || '',
      trace: inTraceRegion,
      alwaysFlag: Boolean(entry.alwaysFlag),
    });
  }

  // An ingredient promoted to a worse bucket shouldn't also sit in a
  // better one (e.g. 'lait' yellow and Gruyère green is fine, but the same
  // label in two buckets is confusing).
  const worseLabels = new Set([...seenLabels.red, ...seenLabels.yellow]);
  const cleanedGreen = green.filter((item) => !worseLabels.has(item.label));

  return {
    status: 'ok',
    verdict: rollUpVerdict(red, yellow),
    red,
    yellow,
    green: cleanedGreen,
    unrecognised: findUnrecognised(text, matches),
    traceRuleApplied,
    suppressedGroups: [...suppressedGroups],
    normalisedText: text,
  };
}
