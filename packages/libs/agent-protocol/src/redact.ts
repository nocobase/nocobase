/**
 * Secret redaction: the one redactor for what runs and jobs report. A runner redacts before anything leaves it (run
 * events, summaries, failure details, job logs, its own log lines), and the server redacts again before it stores
 * them, which covers runners that do not redact and secrets only the server knows.
 *
 * A redactor removes two things, each replaced with `REDACTED`:
 *
 * - the values of the secrets it was given: the variables and tokens a run or job carries (its run token, the runner
 *   key, API keys among its variables), each at least `MIN_SECRET_LENGTH` characters, also in their JSON-escaped form;
 * - common secret patterns (`SECRET_PATTERNS`): this protocol's own credentials, GitHub, npm, Slack and Google tokens,
 *   `sk-…` API keys, AWS access keys and labelled secret keys, private key blocks, JSON Web Tokens, `Bearer` and
 *   `Basic` credentials, `x-api-key` values, passwords in URLs (`https://user:password@host`, `?password=`),
 *   `password=` assignments and other labelled secrets (`"apiKey": "…"`, `token=…`).
 *
 * It changes only strings: `redactValue` copies a JSON value with every string inside it redacted, so an event that was
 * valid JSON stays valid JSON. Each pattern needs a recognisable shape (a prefix, a label, or a length with a digit), so
 * ordinary text, git commit hashes and UUIDs are left alone.
 *
 * Output a process writes in pieces (a job's log) can split a secret across two pieces; `createStreamRedactor` holds
 * back the unfinished end of a line until the rest arrives.
 */

/** What every removed secret becomes. */
export const REDACTED = '[REDACTED]';

/** Secret values shorter than this are not redacted by value: too likely to be ordinary text. */
export const MIN_SECRET_LENGTH = 6;

/**
 * The prefixes of the credentials an agents server issues (shown once, stored hashed), so a redactor recognises them
 * without knowing their values: runner keys, run tokens, registration tokens and download tokens.
 */
export const CREDENTIAL_PREFIXES = {
  runnerKey: 'fgk_',
  runToken: 'fgr_',
  onlineAgent: 'fgo_',
  registration: 'fgreg_',
  download: 'fgdl_',
} as const;

export interface SecretPattern {
  /** What it finds, for tests and documentation. */
  readonly name: string;
  /** Global. */
  readonly pattern: RegExp;
  /** The replacement (`$1` keeps a group); `REDACTED` when left out. */
  readonly replacement?: string;
}

const PRIVATE_KEY_BEGIN = /-----BEGIN ([A-Z0-9 ]*?)PRIVATE KEY( BLOCK)?-----/u;
const PRIVATE_KEY_END = /-----END [A-Z0-9 ]*?PRIVATE KEY(?: BLOCK)?-----/u;

/**
 * The labels of a labelled secret, at the start of a word (`apiKey`, `x-api-key`, `MY_GATEWAY_TOKEN`, not
 * `max_tokens` or `tokens`). Case-insensitive; no capturing group.
 */
export const SECRET_LABEL =
  '(?<![A-Za-z0-9])(?:api[_-]?key|(?:access|refresh|auth)[_-]?token|client[_-]?secret|secret[_-]?key|secret|token|password|passwd)(?![A-Za-z0-9_])';

/**
 * One character of a quoted secret value whose opening quote is capture group `group`: an escape (a backslash and the
 * character after it, or a lone backslash where the value is cut off at the end of the line or text), or any character
 * but that quote and a line break. An escaped quote never closes the value, even when backtracking. The other kind of quote is an ordinary character. Whole-text redaction and the live preview's scanner share
 * it, so both agree where a quoted value ends.
 */
export function quotedSecretChar(group: number): string {
  const quote = `\\${group}`;
  return String.raw`(?:\\(?:[^\r\n]|(?=[\r\n])|$)|(?!${quote})[^\\\r\n])`;
}

/**
 * A quoted secret value after its opening quote (capture group `group`): 8 or more characters up to the closing quote
 * or the end of the line, or any of it at the end of the text, where the value was cut off before it closed.
 */
function quotedSecretValue(group: number): string {
  const char = quotedSecretChar(group);
  const quote = `\\${group}`;
  return String.raw`(?:${char}{8,}(?=${quote}|[\r\n])|${char}+$)`;
}

/**
 * A labelled secret whose quoted value is still open at the end of the text: a stream holds it back from its label
 * until the closing quote arrives, since spaces and punctuation inside it are not word boundaries.
 */
export const OPEN_QUOTED_SECRET: RegExp = new RegExp(
  String.raw`${SECRET_LABEL}["']?\s*[:=]\s*(["'])${quotedSecretChar(1)}*$`,
  'iu',
);

/** A secret's label at the end of the text, its value yet to come. */
const PENDING_LABEL = new RegExp(
  String.raw`${SECRET_LABEL}["']?\s*(?:[:=]\s*)?$`,
  'iu',
);

/** The patterns every redactor applies, in order. */
export const SECRET_PATTERNS: readonly SecretPattern[] = [
  {
    // A block cut short (a truncated event, a log split mid-key) is redacted to its end.
    name: 'private key',
    pattern:
      /-----BEGIN ([A-Z0-9 ]*?)PRIVATE KEY( BLOCK)?-----[\s\S]*?(?:-----END \1PRIVATE KEY\2-----|$)/gu,
  },
  {
    name: 'agents credential',
    pattern: /\bfg(?:k|r|o|reg|dl)_[A-Za-z0-9_-]{20,}/gu,
  },
  {
    name: 'GitHub token',
    pattern: /\bgh[pousr]_[A-Za-z0-9]{36,255}\b/gu,
  },
  {
    name: 'GitHub fine-grained token',
    pattern: /\bgithub_pat_[A-Za-z0-9_]{22,255}/gu,
  },
  { name: 'npm token', pattern: /\bnpm_[A-Za-z0-9]{36}\b/gu },
  {
    // A registry credential in an npmrc line: `//registry.example/:_authToken=…`, `_auth`, `_password`.
    name: 'npmrc credential',
    pattern:
      /(:_(?:authToken|auth|password)\s*=\s*["']?)(?!\[REDACTED\])[^\s"']+/giu,
    replacement: `$1${REDACTED}`,
  },
  { name: 'Slack token', pattern: /\bxox[abposr]-[A-Za-z0-9-]{10,}/gu },
  {
    name: 'Google API key',
    pattern: /\bAIza[0-9A-Za-z_-]{35}(?![0-9A-Za-z_-])/gu,
  },
  {
    // OpenAI, Anthropic (`sk-ant-…`) and the like: long, with a digit, so `sk-learn` and prose stay.
    name: 'sk- API key',
    pattern: /\bsk-(?=[A-Za-z0-9_-]{20,})(?=[A-Za-z0-9_-]*\d)[A-Za-z0-9_-]+/gu,
  },
  {
    name: 'Stripe key',
    pattern: /\b[rs]k_(?:live|test)_[A-Za-z0-9]{16,}/gu,
  },
  {
    name: 'AWS access key id',
    pattern: /\b(?:AKIA|ASIA|ABIA|ACCA)[0-9A-Z]{16}\b/gu,
  },
  {
    name: 'AWS secret access key',
    pattern:
      /\b((?:aws_?)?secret_?access_?key["']?\s*[:=]\s*["']?)[A-Za-z0-9/+]{40}(?![A-Za-z0-9/+])/giu,
    replacement: `$1${REDACTED}`,
  },
  {
    name: 'JSON Web Token',
    pattern:
      /\beyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/gu,
  },
  {
    name: 'Bearer credential',
    pattern: /\b(bearer\s+)(?=[A-Za-z0-9._~+/-]*\d)[A-Za-z0-9._~+/-]{16,}=*/giu,
    replacement: `$1${REDACTED}`,
  },
  {
    name: 'Basic credential',
    pattern: /\b(Basic\s+)[A-Za-z0-9+/]{16,}={0,2}(?![A-Za-z0-9+/=])/gu,
    replacement: `$1${REDACTED}`,
  },
  {
    name: 'x-api-key value',
    pattern: new RegExp(
      // A quoted value goes whole (`quotedSecretValue`), including one an earlier version cut short at a space or a
      // comma (`"[REDACTED], rest"`).
      String.raw`\b(x-api-key["']?\s*[:=]\s*)(?:(["'])${quotedSecretValue(2)}|(?!\[REDACTED\])[^\s"',;}]{8,})`,
      'giu',
    ),
    replacement: `$1$2${REDACTED}`,
  },
  {
    // `scheme://user:password@host`, or a long token as the user (`https://<token>@github.com`); `git@host:` and
    // `ssh://git@host` keep their user.
    name: 'URL credentials',
    pattern:
      /\b([a-z][a-z0-9+.-]*:\/\/)(?:[^\s/?#@'"<>:]*:[^\s/?#@'"<>]+|[^\s/?#@'"<>:]{20,})@/giu,
    replacement: `$1${REDACTED}@`,
  },
  {
    name: 'secret URL parameter',
    pattern:
      /([?&](?:password|passwd|pwd|access_token|api_key|apikey|client_secret|secret|token)=)(?!\[REDACTED\])[^&\s"'#<>]+/giu,
    replacement: `$1${REDACTED}`,
  },
  {
    name: 'password assignment',
    pattern: /\b((?:password|passwd)=)(?!\[REDACTED\])[^\s&"'#;,<>]+/giu,
    replacement: `$1${REDACTED}`,
  },
  // A labelled secret of no recognisable shape, such as a private gateway's key in a tool's error or config:
  // `"apiKey":"…"`, `api_key = …`, `MY_GATEWAY_TOKEN=…`. The label keeps; a value of 8 or more characters goes.
  // `max_tokens` and `tokens` are other labels and stay.
  {
    // A quoted value goes whole (`quotedSecretValue`). One an earlier version redacted only in part
    // (`"[REDACTED], rest"`) goes whole too.
    name: 'labelled secret',
    pattern: new RegExp(
      String.raw`(${SECRET_LABEL}["']?\s*[:=]\s*(["']))${quotedSecretValue(2)}`,
      'giu',
    ),
    replacement: `$1${REDACTED}`,
  },
  {
    // An unquoted value, up to a space or a delimiter. A reference to an environment variable
    // (`apiKey = process.env.API_KEY`, `token = $TOKEN`, `os.environ["KEY"]`) names where the secret is kept rather
    // than the secret, and stays; any other value, dotted or not (`demo.example123`), goes.
    name: 'labelled secret (unquoted)',
    pattern: new RegExp(
      String.raw`(${SECRET_LABEL}["']?\s*[:=]\s*)(?!["'])(?!\[REDACTED\])(?!(?:process\.env|import\.meta\.env|Deno\.env)\.[A-Za-z_$][\w$]*(?![\w$.-])|os\.(?:environ\b|getenv\()|\$\{?[A-Za-z_])[^\s"',;}&<>]{8,}`,
      'giu',
    ),
    replacement: `$1${REDACTED}`,
  },
];

/** Redacts the patterns only, for text whose secrets are not known. */
export function redactPatterns(text: string): string {
  let out = text;
  for (const { pattern, replacement } of SECRET_PATTERNS)
    out = out.replace(pattern, replacement ?? REDACTED);
  return out;
}

export interface Redactor {
  /** The secret values it removes, longest first. */
  readonly secrets: readonly string[];
  /** `text` with every secret removed. */
  text(text: string): string;
  /** `text` redacted, or undefined. */
  optional(text: string | undefined): string | undefined;
  /** A copy of a JSON value with every string inside it redacted. Keys, numbers and the shape are kept. */
  value<T>(value: T): T;
  /** A redactor that removes these secrets too. */
  with(secrets: Iterable<string | null | undefined>): Redactor;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
}

/** The values worth redacting, with their JSON-escaped forms, longest first so one containing another goes whole. */
function secretValues(
  secrets: Iterable<string | null | undefined>,
): readonly string[] {
  const values = new Set<string>();
  for (const secret of secrets) {
    if (typeof secret !== 'string') continue;
    const trimmed = secret.trim();
    if (trimmed.length < MIN_SECRET_LENGTH) continue;
    values.add(trimmed);
    const escaped = JSON.stringify(trimmed).slice(1, -1);
    if (escaped !== trimmed) values.add(escaped);
  }
  return [...values].sort((a, b) => b.length - a.length);
}

const MAX_DEPTH = 64;

/** A redactor for these secrets and every pattern. */
export function createRedactor(
  secrets: Iterable<string | null | undefined> = [],
): Redactor {
  const values = secretValues(secrets);
  const known =
    values.length === 0
      ? undefined
      : new RegExp(values.map(escapeRegExp).join('|'), 'gu');
  const text = (input: string): string => {
    if (input === '') return input;
    const out = known ? input.replace(known, REDACTED) : input;
    return redactPatterns(out);
  };
  const value = (input: unknown, depth: number): unknown => {
    if (typeof input === 'string') return text(input);
    if (input === null || typeof input !== 'object') return input;
    if (depth >= MAX_DEPTH) return REDACTED;
    if (Array.isArray(input))
      return input.map((item) => value(item, depth + 1));
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(input))
      out[key] = value(item, depth + 1);
    return out;
  };
  return {
    secrets: values,
    text,
    optional: (input) => (input === undefined ? undefined : text(input)),
    value: <T>(input: T): T => value(input, 0) as T,
    with: (more) => createRedactor([...values, ...more]),
  };
}

/** Redacts output that arrives in pieces, one stream at a time (a job's stdout, say). */
export interface StreamRedactor {
  /**
   * Redacts the next piece and returns what is safe to pass on. `partial` says the piece ends inside a line that
   * continues in the next one: its unfinished last word is held back until the rest arrives.
   */
  write(piece: string, options?: { readonly partial?: boolean }): string;
  /** What is still held back, redacted; the stream ended. */
  end(): string;
}

/** The longest unfinished word held back; a longer one is passed on rather than held for ever. */
const MAX_HELD = 1024;

/** `text` with its end replaced when it is the start of a secret (at least 4 characters of it): a secret cut short. */
function cutShort(text: string, secrets: readonly string[]): string {
  let longest = 0;
  for (const secret of secrets)
    for (
      let length = Math.min(secret.length - 1, text.length);
      length > longest && length >= 4;
      length -= 1
    )
      if (text.endsWith(secret.slice(0, length))) {
        longest = length;
        break;
      }
  return longest === 0
    ? text
    : `${text.slice(0, text.length - longest)}${REDACTED}`;
}

/**
 * A stream redactor over `redactor`. A secret split across two pieces is caught because the unfinished end of a line
 * waits for its continuation; a private key block split across lines is redacted until its end marker arrives.
 */
export function createStreamRedactor(redactor: Redactor): StreamRedactor {
  let held = '';
  let inKey = false;
  /** Inside a quoted secret value too long to hold, already replaced: its quote, and whether a backslash is pending. */
  let skipping: { quote: string; escaped: boolean } | undefined;
  const longestSecret = Math.max(
    0,
    ...redactor.secrets.map((secret) => secret.length),
  );

  /** Redacts whole text; notes a private key block it begins and does not end. */
  const redact = (text: string): string => {
    if (text === '') return text;
    const begins = [...text.matchAll(new RegExp(PRIVATE_KEY_BEGIN, 'gu'))];
    const last = begins.at(-1);
    if (last && !PRIVATE_KEY_END.test(text.slice(last.index))) inKey = true;
    return redactor.text(text);
  };

  return {
    write(piece, options = {}) {
      let text = held + piece;
      held = '';
      if (skipping) {
        // Drop the rest of the value, with the escape rule of `quotedSecretChar`, up to its closing quote or line end.
        let at = 0;
        for (; at < text.length; at += 1) {
          const char = text[at];
          if (char === '\r' || char === '\n') break;
          if (skipping.escaped) skipping.escaped = false;
          else if (char === '\\') skipping.escaped = true;
          else if (char === skipping.quote) break;
        }
        if (at === text.length) {
          // A piece that ends its line ends the value with it.
          if (!options.partial) skipping = undefined;
          return '';
        }
        skipping = undefined;
        text = text.slice(at);
      }
      if (inKey) {
        // Inside a private key block, already replaced where it began: drop it up to its end marker.
        const end = PRIVATE_KEY_END.exec(text);
        if (!end) {
          // The marker may be split across pieces of a line.
          if (options.partial) held = text.slice(-64);
          return '';
        }
        inKey = false;
        text = text.slice(end.index + end[0].length);
      }
      if (!options.partial) return redact(text);
      // The unfinished last word, or from a label still waiting for its value or whose quoted value is still open.
      const word = /[^\s]*$/u.exec(text)?.[0] ?? '';
      let start = text.length - word.length;
      const open = OPEN_QUOTED_SECRET.exec(text) ?? PENDING_LABEL.exec(text);
      if (open) start = Math.min(start, open.index);
      // Never inside a match: a value redacted in part would release the rest of it.
      const matches = SECRET_PATTERNS.flatMap(({ pattern }) =>
        [...text.matchAll(pattern)].map((match) => ({
          start: match.index,
          end: match.index + match[0].length,
        })),
      ).sort((a, b) => b.start - a.start);
      for (const match of matches)
        if (match.start < start && match.end > start) start = match.start;
      const length = text.length - start;
      if (length === 0) return redact(text);
      if (length > Math.max(MAX_HELD, longestSecret)) {
        // Too long to hold. A quoted secret still open is replaced once here and its rest dropped as it arrives.
        const quoted = OPEN_QUOTED_SECRET.exec(text);
        if (quoted)
          skipping = {
            quote: quoted[1],
            escaped: /\\*$/u.exec(text)![0].length % 2 === 1,
          };
        return redact(text);
      }
      const out = redact(text.slice(0, start));
      held = text.slice(start);
      return out;
    },
    end() {
      const text = held;
      held = '';
      skipping = undefined;
      if (inKey) {
        inKey = false;
        return '';
      }
      return text === '' ? '' : cutShort(redactor.text(text), redactor.secrets);
    },
  };
}
