const LEADING_EMOJI_RE =
  /^[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F1E0}-\u{1F1FF}\u{FE00}-\u{FE0F}\u{200D}]/u;

export function leadingEmoji(value: string): string | null {
  if (!value) return null;
  try {
    const match = value.match(LEADING_EMOJI_RE);
    return match ? match[0] : null;
  } catch {
    return null;
  }
}
