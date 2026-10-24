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
  let dropping: RegExp | 'key' | 'rest' | undefined;
  function scan(piece: string): string {
    let text = held + piece;
    held = '';
    if (dropping === 'rest') return '';
    if (dropping === 'key') {
      const end = keyEnd.exec(text);
      if (!end) {
        held = text.slice(-80);
        return '';
      }
      text = text.slice(end.index + end[0].length);
      dropping = undefined;
    } else if (dropping) {
      const at = text.search(dropping);
      if (at < 0) return '';
      text = text.slice(at);
      dropping = undefined;
    }
    const redactor = current();
    // A URL's public scheme may already have been emitted; retain recognition of its credentials.
    const redact = (value: string) =>
      value.startsWith('://')
        ? redactor.text('x' + value).slice(1)
        : redactor.text(value);
    const key = begin.exec(text);
    if (key && !keyEnd.test(text.slice(key.index))) {
      dropping = 'key';
      held = text.slice(-80);
      return redact(text.slice(0, key.index)) + REDACTED;
    }
    // Once a complete variable-length credential is recognized, emit its replacement and discard its continuation.
    for (const { name, pattern } of SECRET_PATTERNS) {
      const match = [...text.matchAll(pattern)].at(-1);
      if (
        !match ||
        match.index + match[0].length !== text.length ||
        name === 'URL credentials' ||
        name === 'private key'
      )
        continue;
      dropping =
        name === 'secret URL parameter'
          ? /[&\s"'#<>]/u
          : name === 'password assignment'
            ? /[\s&"'#;,<>]/u
            : name === 'x-api-key value'
              ? /[\s"',;}]/u
              : /[^A-Za-z0-9._~+/=-]/u;
      return redact(text);
    }
    let cut = text.length;
    for (const pattern of [token, label, password, url]) {
      const match = pattern.exec(text);
      if (match) cut = Math.min(cut, match.index);
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
      const at = text.indexOf(secret);
      if (at >= 0 && at < cut && at + secret.length > cut) cut = at;
    }
    // Never split the recognition context of a complete match across the safe/held boundary.
    const ranges = SECRET_PATTERNS.flatMap(({ pattern }) => [
      ...text.matchAll(pattern),
    ]).sort((a, b) => b.index - a.index);
    for (const match of ranges)
      if (match.index < cut && match.index + match[0].length > cut)
        cut = match.index;
    if (text.startsWith('://')) {
      const match = new RegExp(
        SECRET_PATTERNS.find((item) => item.name === 'URL credentials')!
          .pattern,
      ).exec('x' + text);
      if (match && match[0].length - 1 > cut) cut = 0;
    }
    if (cut === text.length && /[\uD800-\uDBFF]$/.test(text)) cut--;
    const safe = redact(text.slice(0, cut));
    held = text.slice(cut);
    if (held.length >= MAX_OUTPUT_HELD) {
      // An overlong unresolved credential is omitted rather than retaining or releasing an unsafe suffix.
      held = '';
      dropping = 'rest';
    }
    peak = Math.max(peak, held.length);
    return safe;
  }
  return {
    get heldSize(): number {
      return held.length;
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
      if (dropping) {
        dropping = undefined;
        return '';
      }
      if (interrupted)
        for (const secret of current().secrets) {
          if (text.length >= 6 && secret.startsWith(text)) {
            text = REDACTED;
            break;
          }
        }
      return text.startsWith('://')
        ? current()
            .text('x' + text)
            .slice(1)
        : current().text(text);
    },
  };
}
