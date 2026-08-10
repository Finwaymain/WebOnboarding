// ES5-safe emoji detection (no \\u{...} or \\p{} — older WebViews crash on those).

const SURROGATE_PAIR_RE = /[\uD800-\uDBFF][\uDC00-\uDFFF]/;
const BMP_SYMBOL_RE = /^[\u2600-\u27BF]/;

export function leadingEmoji(value: string): string | null {
  if (!value) return null;
  const pair = value.match(SURROGATE_PAIR_RE);
  if (pair) return pair[0];
  const bmp = value.match(BMP_SYMBOL_RE);
  return bmp ? bmp[0] : null;
}

export function stripEmoji(value: string): string {
  return (value || '')
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '')
    .replace(/[\u2600-\u27BF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
