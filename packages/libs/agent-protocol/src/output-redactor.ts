import { REDACTED, SECRET_PATTERNS, type Redactor } from './redact.js';

/** Only the conversation preview uses this bounded scanner; legacy log redaction is unchanged. */
export const MAX_OUTPUT_HELD = 2048;
const STEP = 256;
const prefixes = [
  'fgk_',
  'fgr_',
  'fgo_',
  'fgreg_',
  'fgdl_',
  'ghp_',
  'gho_',
  'ghu_',
  'ghs_',
  'ghr_',
  'github_pat_',
  'npm_',
  'xoxb-',
  'xoxa-',
  'xoxp-',
  'xoxs-',
  'xoxr-',
  'AIza',
  'sk-',
  'rk_live_',
  'rk_test_',
  'sk_live_',
  'sk_test_',
  'AKIA',
  'ASIA',
  'ABIA',
  'ACCA',
  'eyJ',
  'Bearer ',
  'Basic ',
  'x-api-key',
  'password=',
  'passwd=',
  '-----BEGIN ',
];
const partialPrefixes = [
  ...new Set(
    [
      ...prefixes,
      ':',
      '://',
      ...[
        'password',
        'passwd',
        'pwd',
        'access_token',
        'api_key',
        'apikey',
        'client_secret',
        'secret',
        'token',
      ].flatMap((key) => ['?' + key + '=', '&' + key + '=']),
      'aws_secret_access_key = ',
      'secret_access_key = ',
    ].flatMap((prefix) =>
      Array.from({ length: prefix.length - 1 }, (_, i) =>
        prefix.slice(0, i + 1).toLowerCase(),
      ),
    ),
  ),
].sort((a, b) => b.length - a.length);
const token =
  /\b(?:fg(?:k|r|o|reg|dl)_[A-Za-z0-9_-]*|gh[pousr]_[A-Za-z0-9]*|github_pat_[A-Za-z0-9_]*|npm_[A-Za-z0-9]*|xox[abposr]-[A-Za-z0-9-]*|AIza[A-Za-z0-9_-]*|sk-[A-Za-z0-9_-]*|[rs]k_(?:live|test)_[A-Za-z0-9]*|(?:AKIA|ASIA|ABIA|ACCA)[A-Z0-9]*|eyJ[A-Za-z0-9_.-]*)$/u;
const label =
  /\b(?:bearer|basic|x-api-key|(?:aws_?)?secret_?access_?key)["']?\s*(?:[:=]\s*["']?)?[^\s]*$/iu;
const password =
  /(?:\b(?:password|passwd)=|[?&](?:password|passwd|pwd|access_token|api_key|apikey|client_secret|secret|token)=)[^&\s"'#<>]*$/iu;
const url = /(?:\b[a-z][a-z0-9+.-]*)?:\/\/[^\s/?#@'"<>]*$/iu;
const begin = /-----BEGIN [A-Z0-9 ]*PRIVATE KEY(?: BLOCK)?-----/u;
const keyEnd = /-----END [A-Z0-9 ]*PRIVATE KEY(?: BLOCK)?-----/u;

export interface OutputRedactor {
  readonly heldSize: number;
  readonly peakHeld: number;
  write(piece: string): string;
  end(interrupted?: boolean): string;
}
export function createOutputRedactor(current: () => Redactor): OutputRedactor {
  let held = '';
  let peak = 0;
  let dropping: 'key' | 'rest' | undefined;
  let left = ' ';
  let keyTail = '';
  let keyClose = '';
  const publish = (text: string): string => {
    if (text) left = text.slice(-1);
    return text;
  };
  function scan(piece: string): string {
    let text = held + piece;
    if (dropping === 'rest') return '';
    if (dropping === 'key') {
      const keyText = keyTail + piece;
      const end = keyText.indexOf(keyClose);
      if (end < 0) {
        keyTail = keyText.slice(-80);
        if (held.length + keyTail.length >= MAX_OUTPUT_HELD) {
          held = keyTail = '';
          dropping = 'rest';
        }
        peak = Math.max(peak, held.length + keyTail.length);
        return '';
      }
      text = held + keyText.slice(end + keyClose.length);
      keyTail = '';
      dropping = undefined;
    }
    held = '';
    const redactor = current();
    // A URL's public scheme may already have been emitted; retain recognition of its credentials.
    const redact = (value: string): string =>
      redactor.text((value.startsWith('://') ? 'x' : left) + value).slice(1);
    if (begin.test(text)) {
      for (const secret of redactor.secrets)
        text = text.split(secret).join(REDACTED);
      // Normalize complete keys before looking for token delimiters: their embedded newlines
      // disappear in canonical redaction and must not release an adjacent labelled value.
      text = text.replace(
        /-----BEGIN ([A-Z0-9 ]*?)PRIVATE KEY( BLOCK)?-----[\s\S]*?-----END \1PRIVATE KEY\2-----/gu,
        REDACTED,
      );
    }
    const key = begin.exec(text);
    if (key) {
      dropping = 'key';
      // An unusually long header cannot fit the bounded terminator window; defer to the snapshot.
      if (key[0].length > 80) {
        dropping = 'rest';
        return '';
      }
      keyClose = key[0].replace('BEGIN', 'END');
      keyTail = text.slice(-80);
      // Apply later patterns to the private-key replacement in the same order as canonical redaction.
      // In particular a short labelled value can become sensitive when adjacent to this marker.
      text = text.slice(0, key.index) + REDACTED;
    }
    // A write boundary is not a token boundary. Retain the complete candidate until its real delimiter arrives.
    const contexts = [{ value: left + text, offset: -1 }];
    const known: { start: number; end: number }[] = [];
    for (const secret of redactor.secrets)
      for (
        let at = text.indexOf(secret);
        at >= 0;
        at = text.indexOf(secret, at + 1)
      ) {
        const end = at + secret.length;
        known.push({ start: at, end });
        // Known-value replacement can introduce a word boundary before a following token.
        contexts.push({ value: ']' + text.slice(end), offset: end - 1 });
      }
    let cut = text.length;
    for (const { value, offset } of contexts)
      for (const pattern of [token, label, password, url]) {
        const match = pattern.exec(value);
        if (match) cut = Math.min(cut, Math.max(0, match.index + offset));
      }
    const header = text.lastIndexOf('-----BEGIN');
    if (header >= 0 && !keyEnd.test(text.slice(header)))
      cut = Math.min(cut, header);
    const lower = text.toLowerCase();
    for (const prefix of partialPrefixes)
      if (lower.endsWith(prefix)) {
        cut = Math.min(cut, text.length - prefix.length);
        break;
      }
    for (const secret of redactor.secrets) {
      // Search only this bounded window, never an accumulated output or an unbounded credential prefix.
      for (
        let at = text.indexOf(secret[0]);
        at >= 0;
        at = text.indexOf(secret[0], at + 1)
      ) {
        if (
          secret.startsWith(text.slice(at)) &&
          text.length - at < secret.length
        ) {
          cut = Math.min(cut, at);
          break;
        }
      }
    }
    // Keep whole matches on one side of the output boundary, including newly introduced word boundaries.
    const ranges = [
      ...known,
      ...contexts.flatMap(({ value, offset }) =>
        SECRET_PATTERNS.flatMap(({ pattern }) =>
          [...value.matchAll(pattern)].map((match) => ({
            start: Math.max(0, match.index + offset),
            end: match.index + offset + match[0].length,
          })),
        ),
      ),
    ].sort((a, b) => b.start - a.start);
    for (const match of ranges)
      if (match.start < cut && match.end > cut) cut = match.start;
    if (cut === text.length && /[\uD800-\uDBFF]$/.test(text)) cut--;
    let safe = redact(text.slice(0, cut));
    // Cutting can invent a right boundary (\b or a negative lookahead) that does not exist in the window.
    // The complete context is authoritative: publish only a prefix of its redacted result. Keep an unsafe
    // proposal intact until more input or end() resolves it; the same bounded-tail policy still applies.
    if (cut < text.length && !redact(text).startsWith(safe)) {
      cut = 0;
      safe = '';
    }
    held = text.slice(cut);
    if (held.length + keyTail.length >= MAX_OUTPUT_HELD) {
      // An overlong unresolved credential is omitted rather than retaining or releasing an unsafe suffix.
      held = '';
      keyTail = '';
      dropping = 'rest';
    }
    peak = Math.max(peak, held.length + keyTail.length);
    return publish(safe);
  }
  return {
    get heldSize(): number {
      return held.length + keyTail.length;
    },
    get peakHeld(): number {
      return peak;
    },
    write(piece: string): string {
      const result: string[] = [];
      for (let at = 0; at < piece.length; at += STEP)
        result.push(scan(piece.slice(at, at + STEP)));
      return result.join('');
    },
    end(interrupted = false): string {
      let text = held;
      held = '';
      const stopped = dropping === 'rest';
      dropping = undefined;
      keyTail = '';
      if (stopped) return '';
      if (interrupted)
        for (const secret of current().secrets) {
          if (text.length >= 6 && secret.startsWith(text)) {
            text = REDACTED;
            break;
          }
        }
      return publish(
        current()
          .text((text.startsWith('://') ? 'x' : left) + text)
          .slice(1),
      );
    },
  };
}
