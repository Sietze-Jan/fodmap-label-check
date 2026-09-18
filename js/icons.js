/* =====================================================================
 * icons.js — THE ICON SET
 * =====================================================================
 *
 * Hand-authored SVG icons on a 24x24 grid, drawn in the SF Symbols
 * *idiom* (not copied from it): geometric, stroke-based, round caps and
 * joins, one consistent optical weight. Because every icon is a stroke
 * of `currentColor`, a single definition works at any size, any colour
 * and on any background.
 *
    10| * ---------------------------------------------------------------------
 * WHY MARKUP STRINGS AND NOT AN EXTERNAL SPRITE
 * ---------------------------------------------------------------------
 * The obvious alternative is `<use href="css/icons.svg#icon-check">`.
 * WebKit has never supported *external* file references from `<use>`,
 * so that silently renders nothing on iPhone — which is the only device
 * this app has to work on. Inlining the markup sidesteps that entirely,
 * needs no extra network request, and survives the service-worker cache
 * without a second entry to keep in sync.
 *
    20| * `css/icons.svg` still exists as a portable copy of the same geometry
 * for design tools and for any future non-Safari consumer. It is not
 * loaded at runtime.
 *
 * ---------------------------------------------------------------------
 * USING IT
 * ---------------------------------------------------------------------
 *   import { icon, iconElement } from './icons.js';
 *
 *   node.insertAdjacentHTML('afterbegin', icon('leaf'));   // markup
 *   card.appendChild(iconElement('leaf', { size: 'lg' })); // DOM node
    30| *
 * `iconElement` is the one to reach for in render.js, which builds the
 * result card out of real nodes rather than strings.
 *
 * Options (all optional):
 *   size        'sm' | 'md' | 'lg' | 'xl'  — adds .ds-icon--<size>
 *   className   extra classes, appended after the defaults
 *   strokeWidth override the 1.75 default (1.5 reads better above 32px)
 *   label       accessible name; without it the icon is aria-hidden
 *
 * ---------------------------------------------------------------------
    40| * ADDING AN ICON
 * ---------------------------------------------------------------------
 * Add one entry to ICONS below. Draw inside a 24x24 box, keep the live
 * area within 3..21 so the stroke never clips, and do not set `fill` or
 * `stroke` on your shapes — they inherit from the root <svg>. Shapes
 * that are meant to be solid opt in with fill="currentColor"
 * stroke="none".
 *
 * If your icon needs an id (a <mask>, say), write it as __UID__ and it
 * will be rewritten to something unique on every call, so the same icon
    50| * can appear twice on a page without colliding.
 * ===================================================================== */

export const DEFAULT_STROKE_WIDTH = 1.75;

/* Shorthands, so the table below stays readable. `d()` takes path data;
 * `dot()` is the small solid dot that appears in ellipses, i-glyphs and
 * the traffic light. */
const d = (...data) => data.map((s) => `<path d="${s}"/>`).join('');
const dot = (cx, cy, r = 1.25) =>
  `<circle cx="${cx}" cy="${cy}" r="${r}" fill="currentColor" stroke="none"/>`;
const solid = (markup) => markup.replace(/<path d=/g, '<path fill="currentColor" d=');

/* A knockout: `shape` is filled solid, then `cut` is punched back out of
 * it. This is how the .fill variants get their white checkmark or bang
 * without ever naming a background colour.
 *
 * Mask contents inherit the root stroke unless told otherwise, so every
 * element in here states its own stroke. */
const knockout = (shape, cut) =>
  `<mask id="__UID__" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">` +
  `<rect x="0" y="0" width="24" height="24" fill="#fff" stroke="none"/>` +
  `<g fill="none" stroke="#000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${cut}</g>` +
  `</mask>` +
  `<g mask="url(#__UID__)" fill="currentColor" stroke="none">${shape}</g>`;

/* Four rounded corner brackets — the viewfinder, reused by scan and
 * text-recognition. */
const BRACKETS = d(
  'M4 9V7.25A3.25 3.25 0 0 1 7.25 4H9',
  'M15 4h1.75A3.25 3.25 0 0 1 20 7.25V9',
  'M20 15v1.75A3.25 3.25 0 0 1 16.75 20H15',
  'M9 20H7.25A3.25 3.25 0 0 1 4 16.75V15'
);

/* Shapes reused between an outline icon and its .fill twin. */
const HEART = 'M12 20.3 4.6 12.9a5 5 0 0 1 7.4-6.4 5 5 0 0 1 7.4 6.4Z';
const STAR =
  'M12 3.15 14.32 9.15 20.75 9.51 15.76 13.57 17.41 19.79 12 16.3 6.59 19.79 8.24 13.57 3.25 9.51 9.68 9.15Z';
const BOOKMARK = 'M17.75 20.5 12 16.9l-5.75 3.6V5.75A1.75 1.75 0 0 1 8 4h8a1.75 1.75 0 0 1 1.75 1.75Z';
const TRIANGLE =
  'M10.6 5.6 3.6 17.85a1.6 1.6 0 0 0 1.4 2.4h14a1.6 1.6 0 0 0 1.4-2.4L13.4 5.6a1.6 1.6 0 0 0-2.8 0Z';
const BELL =
  'M18.25 16.75H5.75c1.17-1.3 1.75-3 1.75-5.15V10.5a4.5 4.5 0 0 1 9 0v1.1c0 2.15.58 3.85 1.75 5.15Z';
const CLAPPER = 'M9.9 19.5a2.1 2.1 0 0 0 4.2 0';
const BOLT = 'M13.6 2.9 5.6 13.4h5.2l-1.2 7.7 8-10.5h-5.2Z';
const WHEAT_EAR = d(
  'M12 21.5V10',
  'M12 10A4 4 0 0 1 12 3.5 4 4 0 0 1 12 10Z',
  'M12 12A3.2 3.2 0 0 1 8.8 8.8 3.2 3.2 0 0 1 12 12Z',
  'M12 12A3.2 3.2 0 0 0 15.2 8.8 3.2 3.2 0 0 0 12 12Z',
  'M12 16A3.2 3.2 0 0 1 8.8 12.8 3.2 3.2 0 0 1 12 16Z',
  'M12 16A3.2 3.2 0 0 0 15.2 12.8 3.2 3.2 0 0 0 12 16Z',
  'M12 20A3.2 3.2 0 0 1 8.8 16.8 3.2 3.2 0 0 1 12 20Z',
  'M12 20A3.2 3.2 0 0 0 15.2 16.8 3.2 3.2 0 0 0 12 20Z'
);
/* Gable top, not a peak: the flat crimped ridge is the whole difference
 * between reading as a milk carton and reading as a house. */
const MILK_CARTON = d(
  'M7.5 9.25 10.2 4.5h3.6l2.7 4.75v9.25A1.75 1.75 0 0 1 14.75 20.25h-5.5A1.75 1.75 0 0 1 7.5 18.5Z',
  'M7.5 12.75h9'
);

/* The diagonal "not this" slash, plus the gap that keeps it legible.
 * `group` is drawn with a band cut out along the stroke, then the stroke
 * is laid into that band.
 *
 * The slash leans the same way as eye-off, and against the lightning
 * bolt — a slash parallel to what it is cancelling just reads as two
 * stripes. */
const SLASH = 'M4.25 4.25 20.5 20.5';
const crossedOut = (group) =>
  `<mask id="__UID__" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">` +
  `<rect x="0" y="0" width="24" height="24" fill="#fff" stroke="none"/>` +
  `<path d="${SLASH}" fill="none" stroke="#000" stroke-width="3" stroke-linecap="round"/>` +
  `</mask>` +
  `<g mask="url(#__UID__)">${group}</g>` +
  d(SLASH);

/* ---------------------------------------------------------------------
 * THE TABLE
 * ------------------------------------------------------------------- */
const ICONS = {
  /* -- navigation & chrome ------------------------------------------ */
  'chevron-left': d('M14.75 5.25 8 12l6.75 6.75'),
  'chevron-right': d('M9.25 5.25 16 12l-6.75 6.75'),
  'chevron-up': d('M5.25 14.75 12 8l6.75 6.75'),
  'chevron-down': d('M5.25 9.25 12 16l6.75-6.75'),
  close: d('M6.25 6.25 17.75 17.75', 'M17.75 6.25 6.25 17.75'),
  plus: d('M12 4.75v14.5', 'M4.75 12h14.5'),
  minus: d('M4.75 12h14.5'),
  ellipsis: dot(5.5, 12) + dot(12, 12) + dot(18.5, 12),
  'ellipsis-circle':
    d('M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z') + dot(7.9, 12, 1.15) + dot(12, 12, 1.15) + dot(16.1, 12, 1.15),
  'back-arrow': d('M19.25 12H4.75', 'M10.75 6 4.75 12l6 6'),
  share: d(
    'M12 3.25v12.5',
    'M7.75 7.5 12 3.25l4.25 4.25',
    'M8.25 10H6.5A2.25 2.25 0 0 0 4.25 12.25v6.5A2.25 2.25 0 0 0 6.5 21h11a2.25 2.25 0 0 0 2.25-2.25v-6.5A2.25 2.25 0 0 0 17.5 10h-1.75'
  ),
  bookmark: d(BOOKMARK),
  'bookmark-filled': solid(d(BOOKMARK)),
  search: d('M17 10.75a6.25 6.25 0 1 1-12.5 0 6.25 6.25 0 0 1 12.5 0Z', 'M15.4 15.4 20 20'),
  filter: d('M3.75 5.5h16.5l-6.5 7.7v5.1l-3.5-2v-3.1Z'),
  sort: d('M7 19.75V4.25', 'M3.5 7.75 7 4.25l3.5 3.5', 'M17 4.25v15.5', 'M13.5 16.25 17 19.75l3.5-3.5'),
  settings: d(
    'M10.25 3.02A9.15 9.15 0 0 1 13.75 3.02L14.25 5.48A6.9 6.9 0 0 1 15.02 5.8A9.15 9.15 0 0 1 19.59 6.88L18.2 8.98A6.9 6.9 0 0 1 18.52 9.75A9.15 9.15 0 0 1 20.98 13.75L18.52 14.25A6.9 6.9 0 0 1 18.2 15.02A9.15 9.15 0 0 1 17.12 19.59L15.02 18.2A6.9 6.9 0 0 1 14.25 18.52A9.15 9.15 0 0 1 10.25 20.98L9.75 18.52A6.9 6.9 0 0 1 8.98 18.2A9.15 9.15 0 0 1 4.41 17.12L5.8 15.02A6.9 6.9 0 0 1 5.48 14.25A9.15 9.15 0 0 1 3.02 10.25L5.48 9.75A6.9 6.9 0 0 1 5.8 8.98A9.15 9.15 0 0 1 6.88 4.41L8.98 5.8A6.9 6.9 0 0 1 9.75 5.48Z',
    'M15.25 12a3.25 3.25 0 1 1-6.5 0 3.25 3.25 0 0 1 6.5 0Z'
  ),
  'info-circle': d('M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M12 11.25v5.25', 'M12 7.9h.01'),
  'question-circle': d(
    'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    'M9.3 9.45a2.85 2.85 0 1 1 3.6 2.75c-.55.17-.9.68-.9 1.26v.54',
    'M12 16.6h.01'
  ),
  'external-link': d(
    'M14.25 4.75h5v5',
    'M19.25 4.75 11 13',
    'M18.5 14.5v3.75A2.25 2.25 0 0 1 16.25 20.5h-9.5A2.25 2.25 0 0 1 4.5 18.25v-9.5A2.25 2.25 0 0 1 6.75 6.5h3.75'
  ),

  /* -- tab bar ------------------------------------------------------- */
  home: d('M3.5 11 12 4.25 20.5 11', 'M6 9v9.75A1.75 1.75 0 0 0 7.75 20.5h8.5A1.75 1.75 0 0 0 18 18.75V9'),
  /* Narrower than the outline version: once the shape is solid it reads
   * heavier, and the wider roof flattened the peak into a tent. */
  'home-filled': solid(
    d('M12 3.5 4.4 10.9v7.85A1.85 1.85 0 0 0 6.25 20.6h11.5a1.85 1.85 0 0 0 1.85-1.85V10.9Z')
  ),
  scan: BRACKETS + d('M6.5 12h11'),
  /* A solid frame rather than four brackets: the fill counterpart of an
   * outline made of gaps has to be the shape those gaps imply.
   * stroke="none" on the mask contents matters — without it they pick up
   * the root stroke and eat into the hole. */
  'scan-filled':
    `<mask id="__UID__" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">` +
    `<g stroke="none">` +
    `<rect x="0" y="0" width="24" height="24" fill="#fff"/>` +
    `<rect x="5.9" y="5.9" width="12.2" height="12.2" rx="2.4" fill="#000"/>` +
    `<rect x="7.6" y="11.1" width="8.8" height="1.8" rx=".9" fill="#fff"/>` +
    `</g>` +
    `</mask>` +
    `<rect x="3" y="3" width="18" height="18" rx="4.5" fill="currentColor" stroke="none" mask="url(#__UID__)"/>`,
  history: d('M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M12 7.25V12l3.25 2'),
  'history-filled': knockout(
    '<circle cx="12" cy="12" r="9.3"/>',
    '<path d="M12 7.4V12l3.1 1.9"/>'
  ),
  list: d('M9 7h10.25', 'M9 12h10.25', 'M9 17h10.25') + dot(4.75, 7) + dot(4.75, 12) + dot(4.75, 17),
  'list-filled':
    dot(4.75, 7, 1.4) +
    dot(4.75, 12, 1.4) +
    dot(4.75, 17, 1.4) +
    '<rect x="8.5" y="5.9" width="11.25" height="2.2" rx="1.1" fill="currentColor" stroke="none"/>' +
    '<rect x="8.5" y="10.9" width="11.25" height="2.2" rx="1.1" fill="currentColor" stroke="none"/>' +
    '<rect x="8.5" y="15.9" width="11.25" height="2.2" rx="1.1" fill="currentColor" stroke="none"/>',
  person: d('M15.75 8.25a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z', 'M4.75 20.25a7.25 7.25 0 0 1 14.5 0'),
  'person-filled': solid(
    d('M16 8.25a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z', 'M4.75 20.35a7.25 7.25 0 0 1 14.5 0Z')
  ),
  heart: d(HEART),
  'heart-filled': solid(d(HEART)),
  star: d(STAR),
  'star-filled': solid(d(STAR)),

  /* -- status & feedback --------------------------------------------- */
  check: d('M5 12.75 9.75 17.5 19 7.5'),
  'check-circle': d('M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M8 12.3 11 15.3 16.4 9.4'),
  'check-circle-filled': knockout(
    '<circle cx="12" cy="12" r="9.3"/>',
    '<path d="M8.1 12.35 11 15.25 16.2 9.6"/>'
  ),
  'warning-triangle': d(TRIANGLE, 'M12 10.4v3.9', 'M12 17.1h.01'),
  'warning-triangle-filled': knockout(
    `<path d="${TRIANGLE}"/>`,
    '<path d="M12 10.5v3.8"/><path d="M12 17.15h.01"/>'
  ),
  'error-circle': d('M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M12 7.6v5.2', 'M12 16.2h.01'),
  'error-circle-filled': knockout(
    '<circle cx="12" cy="12" r="9.3"/>',
    '<path d="M12 7.7v5.1"/><path d="M12 16.25h.01"/>'
  ),
  'x-circle': d('M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M9.1 9.1 14.9 14.9', 'M14.9 9.1 9.1 14.9'),
  spinner:
    '<circle cx="12" cy="12" r="8.75" opacity=".25"/>' +
    d('M20.75 12A8.75 8.75 0 0 0 12 3.25'),
  lock: d(
    'M8.25 10.5V7.75a3.75 3.75 0 0 1 7.5 0v2.75',
    'M19.25 13A2.5 2.5 0 0 0 16.75 10.5h-9.5A2.5 2.5 0 0 0 4.75 13v4.75a2.5 2.5 0 0 0 2.5 2.5h9.5a2.5 2.5 0 0 0 2.5-2.5Z',
    'M12 14.4v2.1'
  ),
  eye: d(
    'M2.75 12c2.3-3.9 5.4-5.85 9.25-5.85S19 8.1 21.25 12c-2.25 3.9-5.4 5.85-9.25 5.85S5.05 15.9 2.75 12Z',
    'M14.9 12a2.9 2.9 0 1 1-5.8 0 2.9 2.9 0 0 1 5.8 0Z'
  ),
  'eye-off': d(
    'M9.9 6.4A10 10 0 0 1 12 6.15c3.85 0 6.95 1.95 9.25 5.85a17.9 17.9 0 0 1-2.75 3.5',
    'M6.4 7.85A16.2 16.2 0 0 0 2.75 12c2.3 3.9 5.4 5.85 9.25 5.85a9.9 9.9 0 0 0 3.6-.65',
    'M10.15 10.15a2.9 2.9 0 0 0 4.05 4.15',
    'M3.75 3.75 20.25 20.25'
  ),
  bell: d(BELL, CLAPPER),
  'bell-badge':
    `<mask id="__UID__" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">` +
    `<rect x="0" y="0" width="24" height="24" fill="#fff" stroke="none"/>` +
    `<circle cx="17.9" cy="5.85" r="3.35" fill="#000" stroke="none"/>` +
    `</mask>` +
    `<g mask="url(#__UID__)">${d(BELL, CLAPPER)}</g>` +
    `<circle cx="17.9" cy="5.85" r="2.15" fill="currentColor" stroke="none"/>`,

  /* -- camera & capture ---------------------------------------------- */
  camera: d(
    'M21.25 10A3 3 0 0 0 18.25 7h-12.5A3 3 0 0 0 2.75 10v7.25a3 3 0 0 0 3 3h12.5a3 3 0 0 0 3-3Z',
    'M8.5 7 9.8 4.7a1.4 1.4 0 0 1 1.2-.7h2a1.4 1.4 0 0 1 1.2.7L15.5 7',
    'M15.9 13.6a3.9 3.9 0 1 1-7.8 0 3.9 3.9 0 0 1 7.8 0Z'
  ),
  'camera-flip': d(
    'M21.25 10A3 3 0 0 0 18.25 7h-12.5A3 3 0 0 0 2.75 10v7.25a3 3 0 0 0 3 3h12.5a3 3 0 0 0 3-3Z',
    'M8.5 7 9.8 4.7a1.4 1.4 0 0 1 1.2-.7h2a1.4 1.4 0 0 1 1.2.7L15.5 7',
    'M15.4 13.7a3.4 3.4 0 1 1-1.7-2.94',
    'M11.5 10.9 13.7 10.75 12.7 8.85'
  ),
  photo: d(
    'M7.5 5.5h10.75A2.75 2.75 0 0 1 21 8.25V16',
    'M18 10.5A2.75 2.75 0 0 0 15.25 7.75h-9.5A2.75 2.75 0 0 0 3 10.5v7A2.75 2.75 0 0 0 5.75 20.25h9.5A2.75 2.75 0 0 0 18 17.5Z',
    'M3.2 18.4 7.6 14l2.9 2.9 2.4-2.1 4.6 4.3',
    'M14.65 11.6a1.35 1.35 0 1 1-2.7 0 1.35 1.35 0 0 1 2.7 0Z'
  ),
  'flash-on': d(BOLT),
  'flash-off': crossedOut(d(BOLT)),
  viewfinder: BRACKETS,
  'document-text': d(
    'M6.5 3.25h6.25L18.25 8.75v10.25A1.75 1.75 0 0 1 16.5 20.75h-10A1.75 1.75 0 0 1 4.75 19V5A1.75 1.75 0 0 1 6.5 3.25Z',
    'M12.75 3.25v3.75a1.75 1.75 0 0 0 1.75 1.75h3.75',
    'M8 12.5h7',
    'M8 16h5'
  ),
  'text-recognition': BRACKETS + d('M8 10.5h8', 'M8 13.75h5'),
  'qr-code': d(
    'M10.25 5.5A1.75 1.75 0 0 0 8.5 3.75h-3A1.75 1.75 0 0 0 3.75 5.5v3A1.75 1.75 0 0 0 5.5 10.25h3A1.75 1.75 0 0 0 10.25 8.5Z',
    'M20.25 5.5A1.75 1.75 0 0 0 18.5 3.75h-3A1.75 1.75 0 0 0 13.75 5.5v3a1.75 1.75 0 0 0 1.75 1.75h3a1.75 1.75 0 0 0 1.75-1.75Z',
    'M10.25 15.5A1.75 1.75 0 0 0 8.5 13.75h-3A1.75 1.75 0 0 0 3.75 15.5v3a1.75 1.75 0 0 0 1.75 1.75h3a1.75 1.75 0 0 0 1.75-1.75Z',
    'M13.75 13.75h2.75v2.75h-2.75Z',
    'M20.25 13.75v2.25',
    'M13.75 20.25h2.25',
    'M20.25 20.25h.01'
  ),
  barcode: d(
    'M4.25 6.5v11',
    'M7 6.5v11',
    'M9.75 6.5v11',
    'M13 6.5v11',
    'M16.25 6.5v11',
    'M19.75 6.5v11'
  ),
  crop: d('M6.5 2.75v13.5a1.5 1.5 0 0 0 1.5 1.5h13.25', 'M2.75 6.5h13.5a1.5 1.5 0 0 1 1.5 1.5v13.25'),
  retake: d('M19.25 12a7.25 7.25 0 1 1-2.12-5.13l3.37 3.38', 'M20.5 5.75v4.5H16'),

  /* -- chat & input --------------------------------------------------- */
  microphone: d(
    'M15.25 6A3.25 3.25 0 0 0 12 2.75 3.25 3.25 0 0 0 8.75 6v5A3.25 3.25 0 0 0 12 14.25 3.25 3.25 0 0 0 15.25 11Z',
    'M5.25 11.75v.75a6.75 6.75 0 0 0 13.5 0v-.75',
    'M12 19.25v2.25',
    'M8.5 21.5h7'
  ),
  paperclip: d(
    'M17.5 11.6 11.3 17.8a3.6 3.6 0 0 1-5.1-5.1l7.6-7.6a2.4 2.4 0 0 1 3.4 3.4l-7.6 7.6a1.2 1.2 0 0 1-1.7-1.7l6.9-6.9'
  ),
  send: d('M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z', 'M12 16.5v-9', 'M8.4 11.1 12 7.5l3.6 3.6'),
  sparkles: d(
    'M10.6 6.1Q12.06 10.74 16.7 12.2Q12.06 13.66 10.6 18.3Q9.14 13.66 4.5 12.2Q9.14 10.74 10.6 6.1Z',
    'M18.4 2.3Q19.14 4.66 21.5 5.4Q19.14 6.14 18.4 8.5Q17.66 6.14 15.3 5.4Q17.66 4.66 18.4 2.3Z',
    'M18.6 15.6Q19.2 17.5 21.1 18.1Q19.2 18.7 18.6 20.6Q18 18.7 16.1 18.1Q18 17.5 18.6 15.6Z'
  ),
  'message-bubble': d(
    'M20.25 8.25v5A3.5 3.5 0 0 1 16.75 16.75h-5.2l-3.85 3.4a.6.6 0 0 1-.95-.45V16.75A3.5 3.5 0 0 1 3.75 13.25v-5A3.5 3.5 0 0 1 7.25 4.75h9.5a3.5 3.5 0 0 1 3.5 3.5Z'
  ),
  keyboard:
    d('M21.25 8.5A2.75 2.75 0 0 0 18.5 5.75h-13A2.75 2.75 0 0 0 2.75 8.5v7A2.75 2.75 0 0 0 5.5 18.25h13a2.75 2.75 0 0 0 2.75-2.75Z', 'M8.5 15.2h7') +
    dot(6.5, 9.4, 0.85) +
    dot(9.5, 9.4, 0.85) +
    dot(12.5, 9.4, 0.85) +
    dot(15.5, 9.4, 0.85) +
    dot(18.5, 9.4, 0.85) +
    dot(7.5, 12.3, 0.85) +
    dot(10.5, 12.3, 0.85) +
    dot(13.5, 12.3, 0.85) +
    dot(16.5, 12.3, 0.85),

  /* -- food & diet ---------------------------------------------------- */
  /* Two arcs of equal radius between the same two points give a blade
   * that is symmetric about its own midrib, so the vein can just be the
   * diagonal. */
  leaf: d('M6 18A10.5 10.5 0 0 1 19 5 10.5 10.5 0 0 1 6 18Z', 'M6.6 17.4 17.3 6.7', 'M3.5 20.5 6.4 17.6'),
  wheat: WHEAT_EAR,
  'wheat-crossed-out': crossedOut(WHEAT_EAR),
  'milk-carton': MILK_CARTON,
  'milk-crossed-out': crossedOut(MILK_CARTON),
  onion: d(
    'M12 7.25c3.4 2.6 6.5 4.6 6.5 8.1a6.5 6.5 0 0 1-13 0c0-3.5 3.1-5.5 6.5-8.1Z',
    'M9.4 10.4C8.4 12 7.9 13.7 7.9 15.5a4.1 4.1 0 0 0 .8 2.5',
    'M14.6 10.4c1 1.6 1.5 3.3 1.5 5.1a4.1 4.1 0 0 1-.8 2.5',
    'M12 7.3V4.2',
    'M12 5.8A2.6 2.6 0 0 1 14.6 3.2 2.6 2.6 0 0 1 12 5.8Z'
  ),
  garlic: d(
    'M12 7.5c3.3 2.4 6.25 4.4 6.25 7.85a6.25 6.25 0 0 1-12.5 0c0-3.45 2.95-5.45 6.25-7.85Z',
    'M9.8 9.9C8.9 12 8.45 13.9 8.45 15.6c0 1.9.5 3.5 1.5 4.8',
    'M14.2 9.9c.9 2.1 1.35 4 1.35 5.7 0 1.9-.5 3.5-1.5 4.8',
    'M12 7.55V4.4'
  ),
  apple: d(
    'M12 8.75C9.6 6.6 4 7.4 4 12.9c0 4.35 3.4 8.35 5.7 8.35 1 0 1.5-.45 2.3-.45s1.3.45 2.3.45c2.3 0 5.7-4 5.7-8.35 0-5.5-5.6-6.3-8-4.15Z',
    'M12 8.5V5.6',
    'M12.6 6.5A3.4 3.4 0 0 1 16.2 3.4 3.4 3.4 0 0 1 12.6 6.5Z'
  ),
  grain:
    '<ellipse cx="12" cy="7.3" rx="2.55" ry="4.4"/>' +
    '<ellipse cx="8.2" cy="15.4" rx="2.55" ry="4.4" transform="rotate(-26 8.2 15.4)"/>' +
    '<ellipse cx="15.8" cy="15.4" rx="2.55" ry="4.4" transform="rotate(26 15.8 15.4)"/>',
  'sugar-cube': d('M12 3.75 20.25 8v8L12 20.25 3.75 16V8Z', 'M3.75 8 12 12.25 20.25 8', 'M12 12.25v8'),
  cheese:
    d(
      'M3.75 11.75 12.4 5.4a3 3 0 0 1 1.8-.6h4.3a1.75 1.75 0 0 1 1.75 1.75v10.7a1.75 1.75 0 0 1-1.75 1.75H5.5a1.75 1.75 0 0 1-1.75-1.75Z'
    ) +
    dot(8.4, 14.6, 1.1) +
    dot(13.4, 11.9, 1) +
    dot(16.5, 15.6, 1.15),
  honey: d('M12 3.5c3.6 4.1 6 7.2 6 10.1a6 6 0 0 1-12 0c0-2.9 2.4-6 6-10.1Z'),
  bread: d(
    'M4 14.25c0-4 3.6-7 8-7s8 3 8 7v2.9A1.85 1.85 0 0 1 18.15 19H5.85A1.85 1.85 0 0 1 4 17.15Z',
    'M4.2 13.9h15.6',
    'M9.3 8 8.2 11.2',
    'M12.6 7.45 11.5 10.65',
    'M15.9 8.05 14.8 11.25'
  ),
  avocado: d(
    'M12 3.9c3.15 0 5.4 2.6 5.4 5.65 0 1.7.85 2.9.85 4.6 0 3.35-2.8 6-6.25 6s-6.25-2.65-6.25-6c0-1.7.85-2.9.85-4.6C6.6 6.5 8.85 3.9 12 3.9Z',
    'M14.6 14.7a2.6 2.6 0 1 1-5.2 0 2.6 2.6 0 0 1 5.2 0Z'
  ),
  'shopping-cart':
    d(
      'M2.75 4.75h1.8a1 1 0 0 1 .98.8L7.9 16.1a1.75 1.75 0 0 0 1.72 1.4h7.7',
      'M6.35 7.5h13.25a.9.9 0 0 1 .88 1.1l-1.3 5.75a1.75 1.75 0 0 1-1.71 1.37H8.4'
    ) +
    d('M11.3 20.1a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0Z', 'M18.4 20.1a1.4 1.4 0 1 1-2.8 0 1.4 1.4 0 0 1 2.8 0Z'),
  'shopping-basket': d(
    'M3.5 9.5h17l-1.55 8.4A2.25 2.25 0 0 1 16.74 19.75H7.26A2.25 2.25 0 0 1 5.05 17.9Z',
    'M8.5 9.5 11.1 4.75',
    'M15.5 9.5 12.9 4.75',
    'M10 12.75v3.5',
    'M14 12.75v3.5'
  ),
  'nutrition-label':
    d(
      'M19.75 5.25A2.5 2.5 0 0 0 17.25 2.75h-10.5A2.5 2.5 0 0 0 4.25 5.25v13.5a2.5 2.5 0 0 0 2.5 2.5h10.5a2.5 2.5 0 0 0 2.5-2.5Z',
      'M7.5 11.5h9',
      'M7.5 14.75h9',
      'M7.5 18h5'
    ) + '<rect x="7.5" y="5.9" width="9" height="2.2" rx="1.1" fill="currentColor" stroke="none"/>',
  'traffic-light':
    d('M17.25 6.75A4 4 0 0 0 13.25 2.75h-2.5A4 4 0 0 0 6.75 6.75v10.5a4 4 0 0 0 4 4h2.5a4 4 0 0 0 4-4Z') +
    dot(12, 7, 1.65) +
    dot(12, 12, 1.65) +
    dot(12, 17, 1.65),
  /* A stomach, and the hardest drawing in the set. Silhouette alone is
   * not enough — a sac with a tube on top is a flask no matter how the
   * curves are tuned. The two rugae inside are what make it read as an
   * organ, and they survive down to 16px. */
  gut: d(
    'M9.3 3.3 10 7.4C9.2 5.4 7.2 4.7 5.9 5.9 4.2 7.3 3.5 9.6 3.5 12.3 3.5 16.1 5.2 18.9 8 20.3 9.3 21 10.6 21.2 11.9 21 13.3 20.8 14.7 20.2 16 19.2A1.5 1.5 0 0 0 14.6 16.6C13.9 16 13.6 14.4 13.5 12.4 13.4 10.2 13.1 8.5 12.6 7.4L13.3 3.3Z',
    'M6.4 13.4c1.7 1.3 3.5 1.3 5.2 0',
    'M6.6 17.1c1.6 1.2 3.3 1.2 4.9 0'
  ),
  pill:
    '<rect x="2.85" y="8.6" width="18.3" height="6.8" rx="3.4" transform="rotate(-45 12 12)"/>' +
    d('M9.6 9.6 14.4 14.4'),

  /* -- data & misc ---------------------------------------------------- */
  'chart-bar': d('M3.75 20.5h16.5', 'M7 18V10.5', 'M12 18V5.75', 'M17 18v-4.25'),
  /* 240 degrees, not 180: a half circle reads as an eyebrow, a dial
   * with its bottom open reads as a gauge. */
  'chart-arc': d('M4.9 18.6A8.2 8.2 0 1 1 19.1 18.6', 'M12 14.5 14.9 9.7') + dot(12, 14.5, 1.15),
  'trending-up': d('M3.5 17 9.75 10.75l3.5 3.5L20.5 7', 'M15.5 7h5v5'),
  calendar: d(
    'M20.75 8.25A3 3 0 0 0 17.75 5.25h-11.5A3 3 0 0 0 3.25 8.25v10a3 3 0 0 0 3 3h11.5a3 3 0 0 0 3-3Z',
    'M3.25 10h17.5',
    'M8 2.75v4',
    'M16 2.75v4'
  ),
  trash: d(
    'M4.5 6.75h15',
    'M9.5 6.75V5.25A1.75 1.75 0 0 1 11.25 3.5h1.5a1.75 1.75 0 0 1 1.75 1.75v1.5',
    'M6.5 6.75l.86 12.1A1.75 1.75 0 0 0 9.1 20.5h5.8a1.75 1.75 0 0 0 1.74-1.65l.86-12.1',
    'M10.25 10.5v6',
    'M13.75 10.5v6'
  ),
  edit: d(
    'M20.03 5.92 18.08 3.97a1.9 1.9 0 0 0-2.68 0L5.32 15.07a1.5 1.5 0 0 0-.42.83l-.65 3.85 3.85-.65a1.5 1.5 0 0 0 .83-.42L20.03 8.6a1.9 1.9 0 0 0 0-2.68Z',
    'M14.8 5.6 18.4 9.2'
  ),
  copy: d(
    'M20.75 11.5A2.75 2.75 0 0 0 18 8.75h-6.5A2.75 2.75 0 0 0 8.75 11.5v6.5A2.75 2.75 0 0 0 11.5 20.75H18a2.75 2.75 0 0 0 2.75-2.75Z',
    'M15.25 8.75V5.5A2.25 2.25 0 0 0 13 3.25H5.5A2.25 2.25 0 0 0 3.25 5.5V13a2.25 2.25 0 0 0 2.25 2.25h3.25'
  ),
  download: d(
    'M12 3.75v11.5',
    'M7.5 10.75 12 15.25l4.5-4.5',
    'M4.25 17.25v1.5a2.25 2.25 0 0 0 2.25 2.25h11a2.25 2.25 0 0 0 2.25-2.25v-1.5'
  ),
  upload: d(
    'M12 15.75V4.25',
    'M7.5 8.75 12 4.25l4.5 4.5',
    'M4.25 17.25v1.5a2.25 2.25 0 0 0 2.25 2.25h11a2.25 2.25 0 0 0 2.25-2.25v-1.5'
  ),
  refresh: d(
    'M5.5 8.25A7.5 7.5 0 0 1 18.5 8.25L20.25 11',
    'M20.25 6.5v4.5h-4.5',
    'M18.5 15.75A7.5 7.5 0 0 1 5.5 15.75L3.75 13',
    'M3.75 17.5V13h4.5'
  ),
  globe: d(
    'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    'M3.2 12h17.6',
    'M12 3a13.5 13.5 0 0 1 0 18 13.5 13.5 0 0 1 0-18Z'
  ),
  moon: d('M20.5 14.9A9 9 0 0 1 9.1 3.5a9.25 9.25 0 1 0 11.4 11.4Z'),
  sun: d(
    'M16.35 12a4.35 4.35 0 1 1-8.7 0 4.35 4.35 0 0 1 8.7 0Z',
    'M12 5.25V3.15',
    'M12 18.75v2.1',
    'M5.25 12H3.15',
    'M18.75 12h2.1',
    'M7.23 7.23 5.74 5.74',
    'M16.77 16.77 18.26 18.26',
    'M16.77 7.23 18.26 5.74',
    'M7.23 16.77 5.74 18.26'
  ),
  sliders:
    d('M3.5 8.25h5', 'M13 8.25h7.5', 'M3.5 15.75h8.5', 'M16.5 15.75h4') +
    d('M13 8.25a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z', 'M16.5 15.75a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z'),
};

/* Second names for the same drawing, so you can reach for whichever word
 * comes to mind first. */
const ALIASES = {
  x: 'close',
  gear: 'settings',
  clock: 'history',
  profile: 'person',
  'image-stack': 'photo',
  'scan-brackets': 'viewfinder',
  'arrow-clockwise': 'retake',
  'arrow-up-circle': 'send',
  pencil: 'edit',
  droplet: 'honey',
  language: 'globe',
  gauge: 'chart-arc',
  stomach: 'gut',
  supplement: 'pill',
  vegetable: 'avocado',
  fruit: 'apple',
};

/* ---------------------------------------------------------------------
 * PUBLIC API
 * ------------------------------------------------------------------- */

/** Every canonical name, sorted. Aliases are not included. */
export const ICON_NAMES = Object.keys(ICONS).sort();

/** Alias -> canonical name. Exposed so the docs page can list them. */
export const ICON_ALIASES = { ...ALIASES };

/** True if `name` resolves to a drawing, alias or not. */
export function hasIcon(name) {
  return resolve(name) !== undefined;
}

function resolve(name) {
  if (Object.prototype.hasOwnProperty.call(ICONS, name)) return name;
  if (Object.prototype.hasOwnProperty.call(ALIASES, name)) return ALIASES[name];
  return undefined;
}

let uid = 0;

const escapeAttr = (value) =>
  String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

/**
 * icon(name, opts) -> SVG markup as a string.
 *
 * Throws on an unknown name rather than rendering an empty box, because
 * a silently missing icon is the kind of thing that ships.
 */
export function icon(name, opts = {}) {
  const key = resolve(name);
  if (key === undefined) {
    throw new Error(`icons.js: no icon named "${name}"`);
  }

  const classes = ['ds-icon'];
  if (opts.size) classes.push(`ds-icon--${opts.size}`);
  if (opts.className) classes.push(opts.className);

  const strokeWidth = opts.strokeWidth === undefined ? DEFAULT_STROKE_WIDTH : opts.strokeWidth;
  const a11y = opts.label
    ? ` role="img" aria-label="${escapeAttr(opts.label)}"`
    : ' aria-hidden="true"';

  const body = ICONS[key].replace(/__UID__/g, `i${(uid += 1).toString(36)}`);

  return (
    `<svg class="${classes.join(' ')}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" ` +
    `focusable="false"${a11y}>${body}</svg>`
  );
}

/**
 * Same thing as a real <svg> element, for code that appends nodes —
 * which is how render.js works.
 */
export function iconElement(name, opts = {}) {
  const holder = document.createElement('template');
  holder.innerHTML = icon(name, opts);
  return holder.content.firstElementChild;
}
