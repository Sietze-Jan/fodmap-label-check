/* =====================================================================
 * ocr.js — IN-BROWSER TEXT RECOGNITION (Tesseract.js)
 * =====================================================================
 *
 * Reads the label text out of a photo, entirely on the phone. Nothing is
 * uploaded: the CDN below serves code and language models, never the
 * image.
 *
 * ---------------------------------------------------------------------
 * THE LANGUAGES — the one line you are most likely to want to change
 * ---------------------------------------------------------------------
 * Swiss packaging is trilingual FR/DE/IT, but the household this was
 * built for shops in Geneva, so French is the language that matters and
 * it is what the default set is tuned for.
 *
 * Every language added here is another file downloaded the first time
 * the camera is used, and they are not small. Sizes, gzipped:
 *
 *     fra   0.7 MB      deu   1.3 MB
 *     eng   3.0 MB      ita   0.9 MB
 *
 * So fra+eng is already a ~3.7 MB download, and fra+deu+ita+eng would be
 * close to 6 MB before the engine itself. On supermarket 4G that is the
 * difference between a ten-second first run and a minute of staring at a
 * progress bar. Add a language only if labels are actually being missed.
 *
 * If you do change it: `deu` and `ita` are the two worth adding, in that
 * order. The string is a '+'-separated list of Tesseract language codes.
 * ------------------------------------------------------------------- */
export const OCR_LANGUAGES = 'fra+eng';

/* ---------------------------------------------------------------------
 * THE CDN — pinned, deliberately
 *
 * Exact versions, never @latest or @7: this page is cached by a service
 * worker and may not be reloaded for months, and a major version of
 * Tesseract.js changing its API underneath a cached page would break the
 * camera with no way to tell from the phone what happened.
 *
 * workerPath and corePath are pinned for the same reason. Left unset,
 * Tesseract.js derives them itself — correctly, but it is the kind of
 * implicit network dependency that is much easier to reason about when
 * it is written down, and sw.js needs to know these hosts anyway.
 *
 * langPath is the exception: it is left at the library default, because
 * the default resolves a *different* directory per language and there is
 * no way to express that in the single path this option takes. The
 * default is https://cdn.jsdelivr.net/npm/@tesseract.js-data/<lang>/.
 * ------------------------------------------------------------------- */
const TESSERACT_VERSION = '7.0.0';
const CDN = 'https://cdn.jsdelivr.net/npm';

const SCRIPT_URL = `${CDN}/tesseract.js@${TESSERACT_VERSION}/dist/tesseract.min.js`;
const WORKER_URL = `${CDN}/tesseract.js@${TESSERACT_VERSION}/dist/worker.min.js`;
const CORE_PATH = `${CDN}/tesseract.js-core@${TESSERACT_VERSION}`;

/* Generous, because the first run includes a multi-megabyte download on
 * whatever signal a supermarket basement has. They exist only so that a
 * stalled download eventually becomes an error message instead of a
 * spinner that never stops. */
const SETUP_TIMEOUT_MS = 180_000;
const RECOGNISE_TIMEOUT_MS = 90_000;

/* ---------------------------------------------------------------------
 * FAILURE KINDS
 *
 * Every error out of this module carries a `kind`, because the three
 * cases need different advice. Telling someone whose download failed to
 * "try again with more light" is worse than saying nothing: it sends
 * them to re-photograph a label that was never the problem.
 * ------------------------------------------------------------------- */
export const FAILED_DOWNLOAD = 'download';
export const FAILED_TIMEOUT = 'timeout';
export const FAILED_ENGINE = 'engine';

function fail(kind, message) {
  const error = new Error(message);
  error.kind = kind;
  return error;
}

/* ---------------------------------------------------------------------
 * PROGRESS
 *
 * Two phases, reported separately, because they feel completely
 * different to the person holding the phone: 'setup' happens once ever
 * and is a download, 'reading' happens every scan and is computation.
 * Conflating them into one bar makes the first run look broken.
 * ------------------------------------------------------------------- */
export const PHASE_SETUP = 'setup';
export const PHASE_READING = 'reading';

/* Tesseract's own status strings. Everything that is not recognition is
 * setup — fetching the wasm, fetching traineddata, initialising the API. */
function phaseFor(status) {
  return String(status).includes('recogni') ? PHASE_READING : PHASE_SETUP;
}

/* ---------------------------------------------------------------------
 * Script loading. Lazy, and this is the point of the whole module: a
 * page load that never touches the camera must not pay for any of it.
 * ------------------------------------------------------------------- */
let scriptPromise = null;

function loadTesseractScript() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);

  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        if (window.Tesseract) resolve(window.Tesseract);
        else reject(fail(FAILED_ENGINE, 'Tesseract loaded but did not register itself.'));
      };
      script.onerror = () =>
        reject(fail(FAILED_DOWNLOAD, 'Text recognition could not be downloaded.'));
      document.head.appendChild(script);
    }).catch((error) => {
      /* Drop the cached rejection so a retry can actually retry. */
      scriptPromise = null;
      throw error;
    });
  }

  return scriptPromise;
}

/* ---------------------------------------------------------------------
 * The worker.
 *
 * One per page, kept alive between scans: creating it means re-reading
 * the traineddata into the wasm heap, which is seconds of work for no
 * reason when she scans three packets in a row. It is torn down by the
 * page unloading, which is the only lifetime this app has.
 * ------------------------------------------------------------------- */
let workerPromise = null;
let activeProgress = null;

function report(message) {
  if (!activeProgress || !message || typeof message.progress !== 'number') return;
  activeProgress({
    phase: phaseFor(message.status),
    /* Tesseract occasionally reports slightly over 1. */
    progress: Math.max(0, Math.min(1, message.progress)),
    status: message.status,
  });
}

function getWorker(Tesseract) {
  if (!workerPromise) {
    workerPromise = Tesseract.createWorker(OCR_LANGUAGES.split('+'), 1, {
      workerPath: WORKER_URL,
      corePath: CORE_PATH,
      logger: report,
      /* Default is 'write': traineddata is kept in IndexedDB, so the big
       * download happens once per device rather than once per visit. */
      cacheMethod: 'write',
    }).catch((error) => {
      workerPromise = null;
      /* Almost everything that goes wrong here is a failed fetch of the
       * wasm or the traineddata, so that is the advice to give unless
       * the error already knows better. */
      throw error.kind ? error : fail(FAILED_DOWNLOAD, error.message);
    });
  }
  return workerPromise;
}

function withTimeout(promise, ms, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(fail(FAILED_TIMEOUT, message)), ms);
    }),
  ]).finally(() => clearTimeout(timer));
}

/* ---------------------------------------------------------------------
 * recognise(image, onProgress) -> Promise<string>
 *
 * `image` is anything Tesseract accepts; image-prep.js hands it a
 * canvas. `onProgress` receives { phase, progress, status }.
 *
 * Throws on failure rather than returning empty text, so the caller can
 * tell "the engine broke" apart from "the photo had no words in it" —
 * those need different messages.
 * ------------------------------------------------------------------- */
export async function recognise(image, onProgress) {
  activeProgress = typeof onProgress === 'function' ? onProgress : null;

  try {
    const Tesseract = await withTimeout(
      loadTesseractScript(),
      SETUP_TIMEOUT_MS,
      'Text recognition took too long to download.'
    );

    const worker = await withTimeout(
      getWorker(Tesseract),
      SETUP_TIMEOUT_MS,
      'Text recognition took too long to start up.'
    );

    const result = await withTimeout(
      worker.recognize(image),
      RECOGNISE_TIMEOUT_MS,
      'Reading the photo took too long.'
    );

    return (result && result.data && result.data.text) || '';
  } finally {
    activeProgress = null;
  }
}

/* True once the engine and language data are in place, i.e. the slow
 * first run is behind us. The UI uses this to pick its wording. */
export function isReady() {
  return Boolean(window.Tesseract && workerPromise);
}
