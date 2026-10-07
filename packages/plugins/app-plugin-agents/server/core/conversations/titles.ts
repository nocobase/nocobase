/** Conversation titles: the automatic one from the first message, and the limits on the agent's and a person's. */

/** The first `chars` characters of a message without Markdown punctuation, on one line. */
export function autoTitle(content: string, chars: number): string {
  const plain = content
    .replace(/```[\s\S]*?```/gu, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/gu, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/gu, '$1')
    .replace(/^\s*(?:[#>]+|[-*+]\s|\d+\.\s)/gmu, ' ')
    .replace(/[*_`~]+/gu, '')
    .replace(/\|/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
  return [...plain].slice(0, chars).join('').trim();
}

/** A title on one line, trimmed; its length in characters (not UTF-16 units). */
export function cleanTitle(title: string): { text: string; length: number } {
  const text = title.replace(/\s+/gu, ' ').trim();
  return { text, length: [...text].length };
}
