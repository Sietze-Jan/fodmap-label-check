/* =====================================================================
 * foods.js — GROUPED CATALOG FOR THE HOME LIST
 * =====================================================================
 *
 * ingredients.js is a matching table: one row per printed wording, so
 * onion appears a dozen times (oignon, Zwiebel, cipolla, …). The home
 * screen wants one row per food. This module folds those variants
 * together and searches across every language alias.
 *
 * Pure functions only — test/test.js imports this under plain node.
 * ===================================================================== */

import { INGREDIENTS } from './ingredients.js';
import { normalise } from './analyse.js';

const LEVEL_RANK = { red: 0, yellow: 1, green: 2 };

function groupId(label, level) {
  return `${normalise(label)}:${level}`;
}

/**
 * Collapse language variants of the same English label + traffic-light
 * level into one catalog row. Aliases (original patterns plus the
 * English name) are stored already-normalised so search is a substring
 * check with no extra folding at keystroke time.
 */
export function groupFoods(entries = INGREDIENTS) {
  const groups = new Map();

  for (const entry of entries) {
    const label = typeof entry.label === 'string' ? entry.label.trim() : '';
    const level = entry.level;
    if (!label || !level) continue;

    const id = groupId(label, level);
    let group = groups.get(id);
    if (!group) {
      group = {
        id,
        label,
        level,
        reason: entry.reason || '',
        aliasSet: new Set(),
      };
      groups.set(id, group);
    } else if (!group.reason && entry.reason) {
      group.reason = entry.reason;
    }

    if (entry.pattern) group.aliasSet.add(entry.pattern);
    group.aliasSet.add(label);
  }

  return Array.from(groups.values())
    .map(({ aliasSet, ...group }) => {
      const aliases = Array.from(aliasSet);
      const keys = [...new Set(aliases.map(normalise).filter(Boolean))];
      return { ...group, aliases, keys };
    })
    .sort((a, b) => {
      const byName = a.label.localeCompare(b.label, 'en', { sensitivity: 'base' });
      if (byName !== 0) return byName;
      return (LEVEL_RANK[a.level] ?? 9) - (LEVEL_RANK[b.level] ?? 9);
    });
}

/**
 * Filter by traffic-light level first, then substring-match aliases.
 * Empty / whitespace query returns every food at that level. Omitted or
 * `"all"` level is the unfiltered catalog.
 */
export function filterFoods(foods, query, level) {
  const byLevel =
    !level || level === 'all'
      ? foods
      : foods.filter((food) => food.level === level);
  const needle = normalise(query);
  if (!needle) return byLevel;
  return byLevel.filter((food) => food.keys.some((key) => key.includes(needle)));
}

export const FOODS = groupFoods();
