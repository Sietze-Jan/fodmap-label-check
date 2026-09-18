/* =====================================================================
 * capture.js — THE CAMERA PATH
 * =====================================================================
 *
 * Photo in, ingredient text out, and everything the user sees while that
 * is happening. The actual work belongs to two other modules:
 *
 *     image-prep.js   resize, greyscale, contrast
 *     ocr.js          Tesseract.js, lazily downloaded
 *
 * and the verdict belongs to the existing analyse() / render() pair,
 * which this file does not touch. It hands text to a callback and stops.
 *
 * ---------------------------------------------------------------------
 * WHY A FILE INPUT AND NOT getUserMedia
 * ---------------------------------------------------------------------
 * `<input type="file" accept="image/*" capture="environment">` opens the
 * rear camera directly on iOS Safari, in Apple's own full-screen camera
 * UI, with Apple's autofocus, exposure and stabilisation. getUserMedia
 * would mean building a viewfinder, a shutter and a focus affordance by
 * hand, and would still need a permission prompt that a file input does
 * not. For "photograph a thing that is not moving", the file input is
 * strictly better. It also degrades honestly on a desktop browser, where
 * it becomes a file picker.
 *
 * The second, library input is the same control without `capture`, so it
 * opens the photo library — she can photograph a label in the shop and
 * work out what to do about it on the sofa later.
 *
 * ---------------------------------------------------------------------
 * WHAT COMES BACK IS ALWAYS SHOWN
 * ---------------------------------------------------------------------
 * The OCR'd text goes into the textarea whether or not it is any good.
 * An opaque wrong answer is much worse than a visibly wrong transcription
 * she can correct and re-check: if OCR turns "oignon" into "oignen" she
 * can see that, fix the one letter, and press Check.
 * ===================================================================== */

import { icon } from './icons.js';
import { normalise, isReadable } from './analyse.js';
import { prepareForOcr } from './image-prep.js';
import {
  recognise,
  isReady,
  PHASE_READING,
  FAILED_DOWNLOAD,
  FAILED_TIMEOUT,
} from './ocr.js';

/* ---------------------------------------------------------------------
 * THE SAFETY GATE
 *
 * analyse() already refuses to show a colour for text with no
 * ingredient-list header and fewer than three comma-separated tokens.
 * That floor is set for text a human typed. OCR fails differently: a
 * photo of a wall can produce a dozen plausible-looking words, clear the
 * floor, match nothing, and come back green — which is the one outcome
 * this whole app exists to prevent.
 *
 * So the camera path applies a stricter minimum on top. A real
 * ingredient list is never this short. Anything below it is routed to
 * the grey "can't read the label" state instead of a verdict.
 * ------------------------------------------------------------------- */
const MIN_OCR_LETTERS = 40;

function looksLikeIngredientList(text) {
  const normalised = normalise(text);
  const letters = normalised.replace(/[^a-z]/g, '').length;
  return letters >= MIN_OCR_LETTERS && isReadable(normalised);
}

/* Three messages, because three different things go wrong and only one
 * of them is the photo's fault. Every one of them ends by pointing at
 * the textarea, which always works. */
const UNREADABLE_MESSAGE =
  'Couldn\u2019t read that photo \u2014 try again with more light, the label ' +
  'flat, and the text filling the frame. You can also paste the ingredients.';

const MESSAGES = {
  [FAILED_DOWNLOAD]:
    'Couldn\u2019t download the text recogniser. It needs a connection the ' +
    'first time only. Check your signal and try again \u2014 or paste the ' +
    'ingredients.',
  [FAILED_TIMEOUT]:
    'That is taking too long. Try again on a better connection, or paste the ' +
    'ingredients.',
};

function messageFor(error) {
  return (error && MESSAGES[error.kind]) || UNREADABLE_MESSAGE;
}

/* ---------------------------------------------------------------------
 * The status panel.
 *
 * Built in JS rather than sitting in index.html because it does not
 * exist until the camera is used, and because the progress bar needs to
 * be addressable. Same el() helper shape as render.js.
 * ------------------------------------------------------------------- */
function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function buildStatus(host) {
  const spinner = el('span', 'capture-status__spinner');
  spinner.innerHTML = icon('spinner', { size: 'md', className: 'ds-icon--spin' });

  const title = el('span', 'capture-status__title');
  const head = el('div', 'capture-status__head');
  head.appendChild(spinner);
  head.appendChild(title);

  const note = el('p', 'capture-status__note');

  const fill = el('div', 'capture-status__bar-fill');
  const bar = el('div', 'capture-status__bar');
  bar.appendChild(fill);

  host.appendChild(head);
  host.appendChild(note);
  host.appendChild(bar);

  return {
    /* A working state: spinner, a heading, an optional note, a bar. */
    busy(headline, noteText, fraction) {
      host.hidden = false;
      host.classList.remove('capture-status--error');
      spinner.hidden = false;
      title.textContent = headline;
      note.textContent = noteText || '';
      note.hidden = !noteText;
      bar.hidden = fraction === undefined;
      fill.style.width = `${Math.round((fraction || 0) * 100)}%`;
    },

    /* A failure: no spinner, no bar, and it stays on screen. */
    error(message) {
      host.hidden = false;
      host.classList.add('capture-status--error');
      spinner.hidden = true;
      title.textContent = message;
      note.textContent = '';
      note.hidden = true;
      bar.hidden = true;
    },

    clear() {
      host.hidden = true;
      host.classList.remove('capture-status--error');
      fill.style.width = '0%';
    },
  };
}

/* ---------------------------------------------------------------------
 * initCapture({ ... }) -> { reset }
 * ------------------------------------------------------------------- */
export function initCapture({
  cameraButton,
  libraryButton,
  cameraInput,
  libraryInput,
  statusHost,
  textarea,
  onText,
}) {
  const status = buildStatus(statusHost);
  let busy = false;

  /* The icons come from the app's own icon set rather than being inlined
   * into index.html, which keeps every icon in the codebase defined in
   * exactly one place. Text labels are in the markup, so a failed module
   * load leaves readable buttons rather than blank ones. */
  cameraButton.insertAdjacentHTML('afterbegin', icon('scan', { size: 'lg' }));
  libraryButton.insertAdjacentHTML('afterbegin', icon('photo', { size: 'lg' }));

  function setBusy(value) {
    busy = value;
    cameraButton.disabled = value;
    libraryButton.disabled = value;
  }

  function onProgress({ phase, progress }) {
    const percent = Math.round(progress * 100);
    if (phase === PHASE_READING) {
      status.busy('Reading label\u2026', `${percent}%`, progress);
    } else {
      status.busy(
        'Preparing text recognition\u2026',
        `This happens once, then it works offline. ${percent}%`,
        progress
      );
    }
  }

  async function handleFile(file) {
    if (!file || busy) return;
    setBusy(true);

    try {
      status.busy('Preparing the photo\u2026', '', undefined);
      const image = await prepareForOcr(file);

      /* Wording for the wait ahead: the first scan of the session has a
       * download in front of it, later ones do not. */
      status.busy(
        isReady() ? 'Reading label\u2026' : 'Preparing text recognition\u2026',
        isReady() ? '' : 'This happens once, then it works offline.',
        0
      );

      const text = (await recognise(image, onProgress)).trim();

      /* Always show what was read, even when it is rubbish — she can see
       * the mistake and fix it. */
      textarea.value = text;

      if (!looksLikeIngredientList(text)) {
        status.error(UNREADABLE_MESSAGE);
        /* Empty string, not `text`: analyse() maps it to the grey
         * "can't read the label" card. Text this thin must never be
         * allowed to roll up to a green verdict. */
        onText('');
        return;
      }

      status.clear();
      onText(text);
    } catch (error) {
      /* The console keeps the detail for whoever is debugging it; the
       * panel gets the version that suggests something to do. */
      console.error('OCR failed:', error);
      status.error(messageFor(error));
    } finally {
      setBusy(false);
    }
  }

  function wire(button, fileInput) {
    button.addEventListener('click', () => {
      if (!busy) fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files && fileInput.files[0];
      /* Reset first: without this, picking the same photo twice in a row
       * fires no change event and the button appears dead. */
      fileInput.value = '';
      handleFile(file);
    });
  }

  wire(cameraButton, cameraInput);
  wire(libraryButton, libraryInput);

  return {
    reset() {
      status.clear();
    },
  };
}
