import { isSecretPath } from '@nocobase/app-server/config';
import { isMap, isScalar, isSeq, parseDocument, Scalar, type Node } from 'yaml';

import { MASK, REDACTED } from '../shared/snapshot.js';

/** Key words, besides what `isSecretPath` recognizes, whose values are credentials by nature. */
const SENSITIVE_KEY = /(webhook|dsn|connectionstring|credential|privatekey)/iu;
/** Query parameters that carry a credential in a URL. */
const SENSITIVE_PARAM =
  /^(access_?token|token|auth|key|api_?key|sig|signature|secret|password|pass|pwd|code)$/iu;
/** Keys that hold settings of their own when they are not a leaf, such as `auth.emailAndPassword` or `session.cookie.name`. */
const GROUP_KEYS = new Set(['auth', 'authorization', 'cookie']);
const URL_PATTERN = /\b[a-z][a-z0-9+.-]*:\/\/[^\s'"<>]+/giu;
/** A credential passed inline, such as `--password=…` or `token: …` inside a longer string. */
const INLINE_CREDENTIAL =
  /(?:^|[\s;,&?])-{0,2}(?:password|passwd|pwd|pass|secret|token|api[-_]?key|access[-_]?key)\s*[=:]\s*\S/iu;

/**
 * Decides what may leave the process. A path is sensitive when the application declares a secret at it or above it,
 * or when any segment of it names a credential, so a whole `secrets` or `password` subtree is hidden.
 */
export class Redactor {
  constructor(private readonly secretPaths: ReadonlySet<string> = new Set()) {}

  /** `leaf` is false for a path that holds a map or a list, which a group key such as `auth` may name. */
  isSensitive(path: string, leaf = true): boolean {
    const segments = path.split('.').filter(Boolean);
    for (let index = 1; index <= segments.length; index += 1) {
      const prefix = segments.slice(0, index).join('.');
      const key = segments[index - 1];
      if (this.secretPaths.has(prefix)) return true;
      if (/^\d+$/u.test(key)) continue;
      const group = index < segments.length || !leaf;
      // A parent such as `auth` or `emailAndPassword` groups settings; one named only for a secret, such as
      // `secrets`, `apiKeys` or `credentials`, hides everything below it.
      if (
        group
          ? !GROUP_KEYS.has(key) && wordCount(key) <= 2 && isSecretPath(key)
          : isSecretPath(key) || SENSITIVE_KEY.test(key)
      )
        return true;
    }
    return false;
  }

  /**
   * Whether a text value at a path may be a credential although its key does not end in one: any word of the key
   * names a credential (`accessTokenEnc`, `smtpPwdValue`), or the text holds a credential URL or an inline one.
   */
  isSensitiveText(path: string, text: string): boolean {
    if (hasCredentialUrl(text) || INLINE_CREDENTIAL.test(text)) return true;
    const key = path.split('.').at(-1) ?? '';
    // `key` counts only as the last word, as `isSecretPath` judges it, and a group word such as `authorization`
    // not at all, so `keyPrefix` and `authorizationTimeoutMs` stay readable.
    return (
      isSecretPath(key) ||
      splitWords(key).some(
        (word) =>
          !/^keys?$/u.test(word) && !GROUP_KEYS.has(word) && isSecretPath(word),
      )
    );
  }

  /** A copy of a value with every credential replaced by {@link REDACTED}. */
  value(path: string, value: unknown): unknown {
    if (value === undefined || value === null || value === '') return value;
    // A switch cannot be a credential, such as `auth.account.encryptOAuthTokens`.
    if (typeof value === 'boolean' || isCount(path, value)) return value;
    if (this.isSensitive(path, typeof value !== 'object')) return REDACTED;
    if (typeof value === 'string')
      return this.isSensitiveText(path, value) ? REDACTED : value;
    if (Array.isArray(value))
      return value.map((item, index) =>
        this.value(join(path, String(index)), item),
      );
    if (typeof value === 'object')
      return Object.fromEntries(
        Object.entries(value).map(([key, child]) => [
          key,
          this.value(join(path, key), child),
        ]),
      );
    return value;
  }

  /**
   * A YAML file's text with every credential replaced by {@link MASK}, comments kept. Commented-out settings are
   * masked too, since a real credential is often left behind in one. Text that does not parse is not shown at all.
   */
  yaml(text: string): string {
    const document = parseDocument(text, { keepSourceTokens: false });
    if (document.errors.length > 0)
      return `# ${MASK} The file could not be parsed, so it is not shown.\n`;
    // A file of comments only has no contents, and would print as `null`.
    if (document.contents === null) return maskComments(text, this);
    this.mask(document.contents, '');
    try {
      return maskComments(document.toString({ lineWidth: 0 }), this);
    } catch {
      return `# ${MASK} The file could not be shown with its credentials masked.\n`;
    }
  }

  private mask(node: Node | null, path: string): void {
    if (isMap(node)) {
      for (const pair of node.items) {
        const key = isScalar(pair.key)
          ? String(pair.key.value)
          : String(pair.key);
        const childPath = join(path, key);
        const value = pair.value as Node | null;
        if (isScalar(value) && isCount(childPath, value.value)) continue;
        if (this.isSensitive(childPath, isLeafNode(value)) && !isEmpty(value)) {
          pair.value = maskedScalar(value);
        } else if (
          isScalar(value) &&
          typeof value.value === 'string' &&
          this.isSensitiveText(childPath, value.value)
        ) {
          pair.value = maskedScalar(value);
        } else this.mask(value, childPath);
      }
    } else if (isSeq(node)) {
      node.items.forEach((item, index) => {
        const childPath = join(path, String(index));
        if (
          this.isSensitive(childPath, isLeafNode(item as Node)) &&
          !isEmpty(item as Node)
        )
          node.items[index] = maskedScalar(item as Node);
        else this.mask(item as Node, childPath);
      });
    } else if (
      isScalar(node) &&
      typeof node.value === 'string' &&
      this.isSensitiveText(path, node.value)
    ) {
      node.value = MASK;
      node.type = Scalar.PLAIN;
    }
  }
}

/**
 * Whether a number is only a count or a limit: its key ends in a group word, such as
 * `maxConcurrentAuthorizations`, which `isSecretPath` reads as a secret.
 */
function isCount(path: string, value: unknown): boolean {
  if (
    typeof value !== 'number' &&
    !(typeof value === 'string' && /^\d+(\.\d+)?$/u.test(value))
  )
    return false;
  const last = splitWords(path.split('.').at(-1) ?? '').at(-1) ?? '';
  return GROUP_KEYS.has(last) || GROUP_KEYS.has(last.replace(/s$/u, ''));
}

function splitWords(key: string): string[] {
  return key
    .replace(/([a-z0-9])([A-Z])/gu, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter(Boolean);
}

function wordCount(key: string): number {
  return splitWords(key).length;
}

function join(path: string, key: string): string {
  return path ? `${path}.${key}` : key;
}

function isLeafNode(node: Node | null | undefined): boolean {
  return !isMap(node) && !isSeq(node);
}

/** Nothing to hide: no value, or a switch, which cannot be a credential. */
function isEmpty(node: Node | null | undefined): boolean {
  return (
    node === null ||
    node === undefined ||
    (isScalar(node) &&
      (node.value === null ||
        node.value === '' ||
        typeof node.value === 'boolean'))
  );
}

function maskedScalar(previous: Node | null): Scalar {
  const scalar = new Scalar(MASK);
  scalar.type = Scalar.PLAIN;
  if (previous && 'comment' in previous && previous.comment)
    scalar.comment = previous.comment;
  // An alias elsewhere may refer to the value; it then refers to the mask.
  if (previous && 'anchor' in previous && previous.anchor)
    scalar.anchor = previous.anchor;
  return scalar;
}

/** Whether text holds a URL with a user name, a password or a credential in its query or path. */
export function hasCredentialUrl(text: string): boolean {
  for (const match of text.matchAll(URL_PATTERN)) {
    let url: URL;
    try {
      url = new URL(match[0]);
    } catch {
      continue;
    }
    if (url.username || url.password) return true;
    for (const key of url.searchParams.keys())
      if (SENSITIVE_PARAM.test(key) || isSecretPath(key)) return true;
    if (/\/(hook|hooks|webhook|webhooks)\//iu.test(url.pathname)) return true;
  }
  return false;
}

/** Text with every URL that carries a credential replaced by {@link MASK}. */
export function maskUrls(text: string): string {
  return text.replace(URL_PATTERN, (url) =>
    hasCredentialUrl(url) ? MASK : url,
  );
}

const COMMENTED_SETTING = /^(\s*#+(\s*)-?\s*)([\w.-]+)(\s*:)(\s*)(.*)$/u;
const BLOCK_INDICATOR = /^[|>][-+0-9]*\s*(#.*)?$/u;

/**
 * Masks commented-out settings that name a credential, including what a commented-out block below one holds, such
 * as a private key under `# key: |` or the entries under `# secrets:`, and credential URLs anywhere in a comment.
 */
function maskComments(text: string, redactor: Redactor): string {
  let hiddenBelow: number | undefined;
  return text
    .split('\n')
    .map((line) => {
      const hash = commentStart(line);
      if (hash < 0) {
        if (line.trim() !== '') hiddenBelow = undefined;
        return line;
      }
      const code = line.slice(0, hash);
      const comment = line.slice(hash);
      const indent = /^#+(\s*)/u.exec(comment)![1].length;
      if (code.trim() === '' && hiddenBelow !== undefined) {
        if (indent > hiddenBelow && comment.replace(/^#+\s*/u, '') !== '')
          return `${code}${comment.slice(0, comment.length - comment.replace(/^#+\s*/u, '').length)}${MASK}`;
        hiddenBelow = undefined;
      }
      const setting = COMMENTED_SETTING.exec(comment);
      if (setting) {
        const [, lead, , key, colon, space, value] = setting;
        const opensBlock = value === '' || BLOCK_INDICATOR.test(value);
        if (isCount(key, value)) return code + comment;
        if (redactor.isSensitive(key, !opensBlock)) {
          if (opensBlock) {
            if (code.trim() === '') hiddenBelow = indent;
            return code + comment;
          }
          if (value !== MASK)
            return `${code}${lead}${key}${colon}${space}${MASK}`;
        } else if (value && redactor.isSensitiveText(key, value)) {
          return `${code}${lead}${key}${colon}${space}${MASK}`;
        }
      }
      return code + maskUrls(comment);
    })
    .join('\n');
}

/** The index of the `#` that starts a YAML comment on a line, ignoring one inside quotes; -1 when there is none. */
function commentStart(line: string): number {
  let quote: string | undefined;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quote) {
      if (char === quote) quote = undefined;
    } else if (char === '"' || char === "'") quote = char;
    else if (char === '#' && (index === 0 || /\s/u.test(line[index - 1])))
      return index;
  }
  return -1;
}
