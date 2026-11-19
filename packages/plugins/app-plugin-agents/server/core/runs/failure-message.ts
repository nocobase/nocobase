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
 * At least 20 characters of a key alphabet, hyphens included as URL-safe Base64 writes them, outside paths and
 * hostnames (no `/` or `.` inside it); a full stop or other punctuation that ends the sentence after it does not hide it.
 */
const CANDIDATE =
  /(?<![A-Za-z0-9+_=./-])[A-Za-z0-9+_=-]{20,}(?![A-Za-z0-9+_=/-]|\.[A-Za-z0-9])/gu;

/** Upper case, lower case and digits mixed. */
function mixed(text: string): boolean {
  return /[0-9]/u.test(text) && /[a-z]/u.test(text) && /[A-Z]/u.test(text);
}

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

/**
 * How broken up a hyphenated string is, judged on the whole string: the runs of a word (`Instruct`, `Seek`), capitals
 * (`OSS`) or digits (`120`) its pieces split into, per character. Model names and hyphenated words read as a few long
 * runs (`GPT-OSS-120B-Instruct` 0.28, `DeepSeek-V4-Flash-Free2` 0.35); a random credential changes case and digits
 * almost every character however short its pieces are (`Zq81mN0-pL4kTx7-Rw2Vb9Y` over 0.6).
 */
function brokenUp(text: string): number {
  let runs = 0;
  let length = 0;
  for (const piece of text.split('-')) {
    length += piece.length;
    runs +=
      piece.match(/[A-Z]?[a-z]+|[A-Z]+(?![a-z])|\d+|[^A-Za-z0-9]/gu)?.length ??
      0;
  }
  return length ? runs / length : 0;
}

/**
 * Whether a string looks like a random credential: upper case, lower case and digits mixed (not a hex hash or a
 * lower-case UUID), varied, judged on the whole string. One with hyphens must also be broken up as random text is
 * (`brokenUp`), so model names (`GPT-OSS-120B-Instruct`, `claude-sonnet-4-5-20250929`) stay, whatever the length of
 * its pieces.
 */
function looksRandom(text: string): boolean {
  return (
    mixed(text) &&
    !text.includes(REDACTED) &&
    entropy(text) >= 3.5 &&
    (!text.includes('-') || brokenUp(text) >= 0.4)
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
