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

const input = document.querySelector('#label-text');
const form = document.querySelector('#scan-form');
const results = document.querySelector('#results');
const clearButton = document.querySelector('#clear');

function run(text) {
  render(analyse(text), results);
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

/* The camera path. It fills the textarea itself so the transcription is
 * visible and correctable, then hands the text back here to go through
 * exactly the same analyse()/render() pair as typed text. */
const capture = initCapture({
  cameraButton: document.querySelector('#capture-camera'),
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

clearButton.addEventListener('click', () => {
  input.value = '';
  results.hidden = true;
  results.textContent = '';
  capture.reset();
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname);
  }
  input.focus();
});

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
 * /repo-name/ subdirectory, not the domain root. */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* Offline mode is a nice-to-have; ignore failures. */
    });
  });
}
