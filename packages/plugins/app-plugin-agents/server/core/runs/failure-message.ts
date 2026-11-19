/**
 * A failed run's message, as people read it (`Run.failureDetail`): the one message the coding tool gave when the run
 * ended ("Reconnect OpenCode Console to continue."), a whole string. After the run's own secrets are removed
 * (`redactorOf(run.id)`), this removes what a tool may quote of a credential nobody gave the run, such as a private
 * gateway's key: `sk-…` keys, `Bearer …` credentials, the value after `key=`, `token=` or `apiKey:`, and any long,
 * random-looking string. It works on the whole message only; streamed output keeps the protocol's own redactor.
 */
import { REDACTED } from '@nocobase/agent-protocol';

const RULES: readonly (readonly [RegExp, string])[] = [
  [/\bsk-[A-Za-z0-9_-]{8,}/gu, REDACTED],
  [/\b(bearer\s+)(?!\[REDACTED\])[^\s"',;)\]]+/giu, `$1${REDACTED}`],
  // A quoted value goes whole, spaces and punctuation included, up to its closing quote or the end of the line.
  [
    /\b((?:api[_-]?key|key|access[_-]?token|token|secret|password)["']?\s*[:=]\s*(["']))(?:\\.|(?!\2)[^\\\r\n])+/giu,
    `$1${REDACTED}`,
  ],
  [
    /\b((?:api[_-]?key|key|access[_-]?token|token|secret|password)["']?\s*[:=]\s*)(?!["'])(?!\[REDACTED\])[^\s"',;})\]]+/giu,
    `$1${REDACTED}`,
  ],
];

/**
 * At least 20 characters of a key alphabet, outside paths, model ids and hostnames (no `/`, `-` or `.` inside it); a
 * full stop or other punctuation that ends the sentence after it does not hide it.
 */
const CANDIDATE =
  /(?<![A-Za-z0-9+_=./-])[A-Za-z0-9+_=]{20,}(?![A-Za-z0-9+_=/-]|\.[A-Za-z0-9])/gu;

/** Shannon entropy per character, in bits. */
function entropy(text: string): number {
  const counts = new Map<string, number>();
  for (const char of text) counts.set(char, (counts.get(char) ?? 0) + 1);
  let bits = 0;
  for (const count of counts.values()) {
    const p = count / text.length;
    bits -= p * Math.log2(p);
  }
  return bits;
}

/** Whether a string looks like a random credential: upper case, lower case and digits mixed (not a hex hash), varied. */
function looksRandom(text: string): boolean {
  return (
    /[0-9]/u.test(text) &&
    /[a-z]/u.test(text) &&
    /[A-Z]/u.test(text) &&
    !text.includes(REDACTED) &&
    entropy(text) >= 3.5
  );
}

/** `message` with the credentials it may quote replaced by `[REDACTED]`. */
export function redactFailureMessage(message: string): string {
  let out = message;
  for (const [pattern, replacement] of RULES)
    out = out.replace(pattern, replacement);
  return out.replace(CANDIDATE, (candidate) =>
    looksRandom(candidate) ? REDACTED : candidate,
  );
}
