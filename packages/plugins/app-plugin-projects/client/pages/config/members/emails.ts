/** Addresses as people type them: one per line, or separated by commas, semicolons or spaces; lower-cased, once each. */
export function parseEmailList(text: string): string[] {
  const seen = new Set<string>();
  for (const part of text.split(/[\s,;，；]+/u)) {
    const email = part.trim().toLowerCase();
    if (email) seen.add(email);
  }
  return [...seen];
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/u;

export function isEmailAddress(value: string): boolean {
  return EMAIL.test(value);
}
