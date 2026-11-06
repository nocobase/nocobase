export interface AvatarInitialsOptions {
  /** Disable name-specific rules when displaying an email or another fallback. */
  readonly cjk?: boolean;
  /** Preserve a caller's existing non-CJK abbreviation, when supplied. */
  readonly fallback?: string;
}

/** Text for a person's avatar; CJK names use their last two non-whitespace characters. */
export function getAvatarInitials(
  name: string,
  options: AvatarInitialsOptions = {},
): string {
  if (
    options.cjk !== false &&
    /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(
      name,
    )
  ) {
    return Array.from(name.replace(/\s/gu, '')).slice(-2).join('');
  }
  return (
    options.fallback ??
    (name
      .trim()
      .split(/\s+/u)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0]?.toUpperCase() ?? '')
      .join('') ||
      '?')
  );
}
