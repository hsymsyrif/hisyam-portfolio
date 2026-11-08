/** Shared by the gallery canvas and the Work section (kept tiny so the page doesn't pull in three.js). */
export const GALLERY_STEP = 0.74; // radians per card, including the gap
const EDGE = 0.95; // how far off-centre the first card starts and the last card ends

/** Wall rotation for scroll progress p (0–1). Card i is centred when the turn equals i × step. */
export function galleryTurn(p: number, count: number) {
  const start = -EDGE;
  const end = (count - 1) * GALLERY_STEP + EDGE;
  return start + (end - start) * p;
}

/** Index of the card nearest the centre. */
export function galleryFocus(p: number, count: number) {
  return Math.min(count - 1, Math.max(0, Math.round(galleryTurn(p, count) / GALLERY_STEP)));
}
