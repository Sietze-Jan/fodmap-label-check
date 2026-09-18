/* =====================================================================
 * image-prep.js — WHAT HAPPENS TO A PHOTO BEFORE OCR SEES IT
 * =====================================================================
 *
 * A raw 12-megapixel iPhone photo of a shiny, curved packet is close to
 * the worst input Tesseract can be handed: too large to process quickly,
 * lit unevenly by supermarket strip lights, and with the colour channels
 * disagreeing about where the ink stops. Three cheap canvas operations
 * fix most of that, and they are the difference between this path being
 * usable and being a toy.
 *
 * The three, in order:
 *
 *   1. RESIZE. Recognition time scales with pixel count, and Tesseract
 *      gains nothing above roughly 1600px on the long edge for text this
 *      size — a 4032px photo just costs four times the wait. Small
 *      images are scaled UP to MIN_EDGE instead, because Tesseract is
 *      genuinely bad below ~30px of glyph height and a photo picked out
 *      of the library may already have been shrunk.
 *
 *   2. GREYSCALE. Rec. 601 luma, not a channel average: ink printed in
 *      colour on a coloured background separates far better when the
 *      channels are weighted the way an eye weights them.
 *
 *   3. AUTO-LEVELS. The actual win. A photo taken through cling film
 *      under fluorescent light might only use values 70..190 of the
 *      available 0..255; stretching that range to fill the histogram
 *      makes the glyph edges steep again. Clipping a couple of percent
 *      off each end first stops one glare highlight or one dark fold
 *      from deciding the whole scale.
 *
 * Deliberately NOT done here: binarisation (Otsu thresholding). Tesseract
 * runs its own, tuned to what its recogniser expects, and a second one
 * upstream mostly destroys information it would have used. Also not done:
 * deskew and perspective correction, which are a real further win on
 * curved packaging but need edge detection to be worth anything.
 *
 * ---------------------------------------------------------------------
 * TUNING
 * ---------------------------------------------------------------------
 * The four constants below are the whole tuning surface. If recognition
 * is poor on a particular kind of packaging, change one of them, reload,
 * and try the same photo again — `prepareForOcr` accepts a File and
 * returns a canvas, so it can be exercised from the console:
 *
 *   const c = await prepareForOcr(file);
 *   document.body.appendChild(c);
 *
 * ===================================================================== */

/* Long edge of the image handed to Tesseract. Larger is slower, not
 * better, for 6-point ingredient type shot from 15cm away. */
export const MAX_EDGE = 1600;

/* Below this, scale up rather than down. */
export const MIN_EDGE = 1000;

/* Fraction of pixels ignored at each end of the histogram before
 * stretching. 0.02 = the darkest 2% and the brightest 2%, which is about
 * the size of one specular highlight on a foil packet. */
export const LEVELS_CLIP = 0.02;

/* Extra contrast applied after the stretch, pivoting around mid-grey.
 * 1 is off. Above ~1.6 thin strokes start breaking up. */
export const CONTRAST_BOOST = 1.25;

/* ---------------------------------------------------------------------
 * Decoding.
 *
 * createImageBitmap is the fast path and, importantly, the one that
 * honours the EXIF orientation flag — phone photos are almost always
 * stored rotated with a flag saying which way is up, and OCR on a
 * sideways label returns nothing at all. The <img> fallback exists for
 * browsers without the imageOrientation option; they apply EXIF
 * orientation themselves when rendering, which gets us to the same place.
 * ------------------------------------------------------------------- */
async function decode(file) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, { imageOrientation: 'from-image' });
    } catch {
      /* Fall through: Safari has historically rejected the options bag. */
    }
    try {
      return await createImageBitmap(file);
    } catch {
      /* Fall through to the <img> path. */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error('The image could not be decoded.'));
      image.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function sourceSize(source) {
  return {
    width: source.width || source.naturalWidth || 0,
    height: source.height || source.naturalHeight || 0,
  };
}

/* ---------------------------------------------------------------------
 * Auto-levels, in place on an ImageData buffer that is already grey.
 * ------------------------------------------------------------------- */
function autoLevels(data) {
  const histogram = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 4) histogram[data[i]] += 1;

  const total = data.length / 4;
  const clip = Math.floor(total * LEVELS_CLIP);

  let low = 0;
  for (let seen = 0; low < 255; low += 1) {
    seen += histogram[low];
    if (seen > clip) break;
  }

  let high = 255;
  for (let seen = 0; high > low; high -= 1) {
    seen += histogram[high];
    if (seen > clip) break;
  }

  /* A flat histogram means a blank or hopelessly blown-out photo.
   * Stretching it would amplify sensor noise into fake glyphs, so leave
   * it alone and let the readability gate downstream refuse it. */
  const span = high - low;
  if (span < 16) return;

  /* One 256-entry lookup table beats recomputing the curve per pixel. */
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v += 1) {
    const stretched = ((v - low) / span) * 255;
    const boosted = (stretched - 128) * CONTRAST_BOOST + 128;
    lut[v] = boosted < 0 ? 0 : boosted > 255 ? 255 : boosted;
  }

  for (let i = 0; i < data.length; i += 4) {
    const v = lut[data[i]];
    data[i] = v;
    data[i + 1] = v;
    data[i + 2] = v;
  }
}

/* ---------------------------------------------------------------------
 * prepareForOcr(file) -> Promise<HTMLCanvasElement>
 *
 * A canvas rather than a Blob: Tesseract accepts one directly, so there
 * is no reason to pay for a re-encode to PNG on the way out.
 * ------------------------------------------------------------------- */
export async function prepareForOcr(file) {
  const source = await decode(file);
  const { width, height } = sourceSize(source);
  if (!width || !height) throw new Error('The image could not be decoded.');

  const longEdge = Math.max(width, height);
  const scale = longEdge > MAX_EDGE
    ? MAX_EDGE / longEdge
    : longEdge < MIN_EDGE
      ? MIN_EDGE / longEdge
      : 1;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));

  /* willReadFrequently: this context exists to have getImageData called
   * on it once, which is exactly the case the hint is for. */
  const context = canvas.getContext('2d', { willReadFrequently: true });

  /* A white base matters for any image with transparency — the default
   * is transparent black, which greyscales to a page of solid ink. */
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, canvas.width, canvas.height);

  if (typeof source.close === 'function') source.close();

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  /* Rec. 601 luma. */
  for (let i = 0; i < data.length; i += 4) {
    const luma = (data[i] * 299 + data[i + 1] * 587 + data[i + 2] * 114) / 1000;
    data[i] = luma;
    data[i + 1] = luma;
    data[i + 2] = luma;
    data[i + 3] = 255;
  }

  autoLevels(data);

  context.putImageData(imageData, 0, 0);
  return canvas;
}
