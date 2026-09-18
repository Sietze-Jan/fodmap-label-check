/* =====================================================================
 * app.js — WIRING
 * =====================================================================
 *
 * Reads the OCR'd text, calls analyse(), hands the result to render().
 *
 * PRIVACY NOTE: the Shortcut passes label text in the URL *fragment*
 * (#t=...), never the query string. Fragments are not sent to the server,
 * so the text never leaves the phone even though the page is hosted
 * publicly on GitHub Pages.
 *
 * ===================================================================== */

import { analyse } from './analyse.js';
import { render } from './render.js';
import { initCapture } from './capture.js';
import { icon } from './icons.js';

const home = document.querySelector('#home');
const input = document.querySelector('#label-text');
const form = document.querySelector('#scan-form');
const results = document.querySelector('#results');
const resultsLayer = document.querySelector('#results-layer');
const resultsSheet = document.querySelector('#results-sheet');
const resultsScrim = document.querySelector('#results-scrim');
const resultsClose = document.querySelector('#results-close');
const resultsGrabber = document.querySelector('#results-grabber');
const scanAnother = document.querySelector('#scan-another');
const cameraButton = document.querySelector('#capture-camera');

resultsClose.insertAdjacentHTML('afterbegin', icon('close', { size: 'md' }));
scanAnother.insertAdjacentHTML('afterbegin', icon('scan', { size: 'md' }));

for (const slot of document.querySelectorAll('[data-icon]')) {
  slot.insertAdjacentHTML('beforeend', icon(slot.dataset.icon, { size: 'md' }));
}

function run(text) {
  render(analyse(text), results, { rawText: text });
  capture.reset();
  openResults();
}

/* Read text handed over by the iOS Shortcut. */
function readFragment() {
  const hash = window.location.hash;
  if (!hash.startsWith('#t=')) return '';
  const encoded = hash.slice(3);
  try {
    // Shortcuts percent-encodes; tolerate '+' for spaces just in case.
    return decodeURIComponent(encoded.replace(/\+/g, ' '));
  } catch {
    return encoded;
  }
}

function clearFragment() {
  if (!window.location.hash) return;
  history.replaceState(null, '', window.location.pathname + window.location.search);
}

/* The camera path. It fills the textarea itself so the transcription is
 * visible and correctable, then hands the text back here to go through
 * exactly the same analyse()/render() pair as typed text. */
const capture = initCapture({
  cameraButton,
  libraryButton: document.querySelector('#capture-library'),
  cameraInput: document.querySelector('#capture-camera-input'),
  libraryInput: document.querySelector('#capture-library-input'),
  statusHost: document.querySelector('#capture-status'),
  textarea: input,
  onText: run,
});

form.addEventListener('submit', (event) => {
  event.preventDefault();
  input.blur();
  run(input.value);
});

/* ---------------------------------------------------------------- results
 *
 * A screen-filling sheet. X, the scrim, Escape, and a downward swipe
 * all return to home. "Scan another label" closes and re-opens the
 * camera input.
 * ------------------------------------------------------------------- */

const DISMISS_PX = 120;
const DISMISS_FLICK = 0.65;

let sheetOpen = false;
let dragging = false;
let dragPointer = null;
let dragStartY = 0;
let lastY = 0;
let lastT = 0;
let velocity = 0;
let leaveTimer = 0;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function setSheetOffset(px) {
  resultsSheet.style.transform = px ? `translateY(${px}px)` : '';
}

function openResults() {
  window.clearTimeout(leaveTimer);
  resultsSheet.classList.remove('is-leaving', 'is-dragging');
  setSheetOffset(0);
  resultsLayer.hidden = false;
  document.body.classList.add('is-results-open');
  home.inert = true;
  sheetOpen = true;
  resultsClose.focus();
}

function finishClose() {
  window.clearTimeout(leaveTimer);
  resultsLayer.hidden = true;
  resultsSheet.classList.remove('is-leaving', 'is-dragging');
  setSheetOffset(0);
  document.body.classList.remove('is-results-open');
  home.inert = false;
  sheetOpen = false;
  clearFragment();
}

function closeResults() {
  if (!sheetOpen && resultsLayer.hidden) return;
  dragging = false;
  dragPointer = null;
  resultsSheet.classList.remove('is-dragging');
  if (prefersReducedMotion()) {
    finishClose();
    return;
  }
  /* Inline transform has to go to 100% so a mid-swipe continues downward
   * instead of jumping back to 0 and then leaving. */
  resultsSheet.classList.add('is-leaving');
  resultsSheet.style.transform = 'translateY(100%)';
  window.clearTimeout(leaveTimer);
  leaveTimer = window.setTimeout(finishClose, 300);
}

resultsClose.addEventListener('click', () => closeResults());
resultsScrim.addEventListener('click', () => closeResults());
scanAnother.addEventListener('click', () => {
  /* Click the file input inside this gesture. A delayed click after the
   * sheet animation would be ignored by iOS Safari, and the home screen
   * is inert while the sheet is open. */
  document.querySelector('#capture-camera-input').click();
  closeResults();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && sheetOpen) closeResults();
});

function eventOnInteractive(target) {
  return Boolean(target.closest('button, a, textarea, input, summary, label'));
}

function canStartDrag(event) {
  const target = event.target;
  if (eventOnInteractive(target)) return false;
  /* Drag handle and header only, so the ingredient list still scrolls. */
  return resultsGrabber.contains(target) || Boolean(target.closest('.ds-sheet__header'));
}

resultsSheet.addEventListener('pointerdown', (event) => {
  if (!sheetOpen) return;
  if (event.pointerType === 'mouse' && event.button !== 0) return;
  if (!canStartDrag(event)) return;
  dragging = true;
  dragPointer = event.pointerId;
  dragStartY = event.clientY;
  lastY = event.clientY;
  lastT = event.timeStamp;
  velocity = 0;
  resultsSheet.classList.add('is-dragging');
  resultsSheet.classList.remove('is-leaving');
  resultsSheet.setPointerCapture(event.pointerId);
});

resultsSheet.addEventListener('pointermove', (event) => {
  if (!dragging || event.pointerId !== dragPointer) return;
  const dy = event.clientY - dragStartY;
  const now = event.timeStamp;
  velocity = (event.clientY - lastY) / Math.max(1, now - lastT);
  lastY = event.clientY;
  lastT = now;
  setSheetOffset(Math.max(0, dy));
});

function endDrag(event) {
  if (!dragging || event.pointerId !== dragPointer) return;
  dragging = false;
  dragPointer = null;
  resultsSheet.classList.remove('is-dragging');
  const dy = Math.max(0, event.clientY - dragStartY);
  if (dy > DISMISS_PX || (dy > 40 && velocity > DISMISS_FLICK)) {
    closeResults();
    return;
  }
  setSheetOffset(0);
}

resultsSheet.addEventListener('pointerup', endDrag);
resultsSheet.addEventListener('pointercancel', endDrag);

/* Re-analyse if the Shortcut fires again while the page is already open. */
window.addEventListener('hashchange', () => {
  const text = readFragment();
  if (text) {
    input.value = text;
    run(text);
  }
});

const initial = readFragment();
if (initial) {
  input.value = initial;
  run(initial);
}

/* Offline support, so it still works in a shop with no signal.
 * Registered with a relative path because GitHub Pages serves this from a
 * /repo-name/ subdirectory, not the domain root.
 *
 * EXPECTED_CACHE must match CACHE_VERSION in sw.js. If an older worker
 * is still installed, drop it and reload so a cached index.html from
 * before the camera UI cannot hide the Scan button. */
const EXPECTED_CACHE = 'fodmap-v7';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    caches
      .keys()
      .then((keys) => {
        const stale = keys.filter(
          (key) => key.startsWith('fodmap-v') && key !== EXPECTED_CACHE
        );
        if (!stale.length) {
          return navigator.serviceWorker.register('./sw.js');
        }
        return navigator.serviceWorker
          .getRegistrations()
          .then((regs) => Promise.all(regs.map((reg) => reg.unregister())))
          .then(() => Promise.all(stale.map((key) => caches.delete(key))))
          .then(() => {
            location.reload();
          });
      })
      .catch(() => {
        /* Offline mode is a nice-to-have; ignore failures. */
      });
  });
}
