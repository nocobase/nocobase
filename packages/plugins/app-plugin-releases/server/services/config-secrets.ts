/**
 * Secrets in an App's `config.yml`. The file is stored and handed to the runtime as written; whatever leaves the server
 * (the API, the CLI) sees it masked: every secret value replaced by `CONFIG_SECRET_MASK`, with the list of masked
 * paths. Content sent back with the mask still in place keeps the stored value at that path, and `ConfigSecretChange`s
 * set or remove one secret without showing the others.
 *
 * A value is a secret when
 *
 * - its key (the nearest map key above it) names one: the last word of the key is `password`, `secret`, `token`, `key`,
 *   `dsn`, `credential`, `salt`, `authorization`, … (`auth.secret`, `users.initialAdmin.password`, `agents.secretsKey`,
 *   `clientSecret`, `apiKeys[0]`), except keys that are not secret (`publicKey`, `primaryKey`); a number is masked only
 *   under a password-like key;
 * - it is a URL with a password (`postgres://user:pass@host/db`);
 * - it equals a secret found by the rules above, or contains one, wherever it sits.
 *
 * Over-masking is harmless (the value is kept and can be replaced); a secret under a name none of these rules knows is
 * not masked, so the rules err on the side of masking.
 */
import { isSecretPath } from '@nocobase/app-server/config';
import {
  isPair,
  isScalar,
  isSeq,
  parseDocument,
  Scalar,
  visit,
  type Document,
  type Node,
} from 'yaml';

import {
  CONFIG_SECRET_MASK,
  formatConfigPath,
  type ConfigPath,
  type ConfigSecret,
  type ConfigSecretChange,
} from '../../shared/releases.js';
import { ReleasesError } from '../errors.js';
import { isRecord } from './codec.js';

/** Words whose numeric values are secrets too (`password: 123456`); a number under `maxTokens` is not. */
const NUMERIC_SECRET_WORDS = new Set([
  'password',
  'passwd',
  'pwd',
  'pass',
  'passphrase',
  'pin',
]);

const URL_WITH_PASSWORD = /^[a-z][a-z0-9+.-]*:\/\/[^\s/?#@]*:[^\s/?#@]+@/iu;

/** A secret contained in a longer value is masked there too when it is at least this long. */
const MIN_CONTAINED_SECRET = 6;

const MAX_CHANGES = 100;
const MAX_PATH_SEGMENTS = 32;
const MAX_SECRET_BYTES = 64 * 1024;

/**
 * How a secret key is matched: `'any'` masks strings and numbers, `'string'` strings only, `null` is no secret. Which
 * keys name a secret is `isSecretPath`'s rule, the one a build's variables manifest is made with.
 */
export function secretKeyKind(key: string): 'any' | 'string' | null {
  if (!isSecretPath(key)) return null;
  const last = key
    .replace(/([a-z0-9])([A-Z])/gu, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/u)
    .filter(Boolean)
    .at(-1);
  return last && NUMERIC_SECRET_WORDS.has(last) ? 'any' : 'string';
}

/**
 * `content` with every secret value replaced by the mask, and the masked paths in document order. Comments, order and
 * the rest of the formatting are kept. Content that is not valid YAML is masked whole.
 */
export function maskConfig(content: string): {
  readonly content: string;
  readonly secrets: readonly ConfigSecret[];
} {
  if (content.trim() === '') return { content, secrets: [] };
  const document = parseDocument(content);
  if (document.errors.length > 0)
    return { content: `# ${CONFIG_SECRET_MASK}\n`, secrets: [] };
  const masked = secretNodes(document);
  if (masked.size === 0) return { content, secrets: [] };
  const secrets: ConfigSecret[] = [];
  visit(document, {
    Scalar(key, node, ancestors) {
      if (!masked.has(node)) return undefined;
      const path = pathOf(ancestors, node, key);
      if (path) secrets.push({ path });
      return replaceValue(node, CONFIG_SECRET_MASK);
    },
  });
  return { content: withNewline(document.toString()), secrets };
}

/**
 * Turns content a client sent back into what is stored: each masked value takes the stored value at its path (a mask
 * where nothing is stored is refused), then `changes` set or remove secrets. Content without masks and changes is
 * returned unchanged.
 */
export function restoreConfigSecrets(
  content: string,
  stored: string | null,
  secretChanges?: unknown,
): string {
  const changes = normalizeChanges(secretChanges);
  if (!content.includes(CONFIG_SECRET_MASK) && changes.length === 0)
    return content;
  const document = parseDocument(content);
  if (document.errors.length > 0)
    throw new ReleasesError(
      `Invalid config.yml: ${firstLine(document.errors[0]?.message)}`,
      'INVALID_CONFIG_FILE',
      'INVALID_ARGUMENT',
    );
  const storedValue: unknown =
    stored && stored.trim() !== '' ? parseDocument(stored).toJS() : {};
  visit(document, {
    Scalar(key, node, ancestors) {
      if (node.value !== CONFIG_SECRET_MASK) return undefined;
      const path = pathOf(ancestors, node, key);
      if (!path) return undefined;
      const value = valueAt(storedValue, path);
      if (
        (typeof value !== 'string' &&
          typeof value !== 'number' &&
          typeof value !== 'bigint') ||
        value === CONFIG_SECRET_MASK
      )
        throw new ReleasesError(
          `No secret is stored at ${formatConfigPath(path)}; enter its value instead of the mask.`,
          'CONFIG_SECRET_NOT_STORED',
          'INVALID_ARGUMENT',
        );
      return replaceValue(node, value);
    },
  });
  for (const change of changes) {
    if (change.value === null) document.deleteIn(change.path);
    else document.setIn(change.path, change.value);
  }
  return withNewline(document.toString());
}

/** Validates `secretChanges` from a request. */
export function normalizeChanges(
  value: unknown,
): readonly ConfigSecretChange[] {
  if (value === undefined) return [];
  const invalid = (message: string) =>
    new ReleasesError(message, 'INVALID_CONFIG_SECRET', 'INVALID_ARGUMENT');
  if (!Array.isArray(value) || value.length > MAX_CHANGES)
    throw invalid(`Secret changes must be a list of at most ${MAX_CHANGES}.`);
  return value.map((item: unknown): ConfigSecretChange => {
    if (!isRecord(item)) throw invalid('Each secret change is an object.');
    const { path, value: secret } = item;
    if (
      !Array.isArray(path) ||
      path.length === 0 ||
      path.length > MAX_PATH_SEGMENTS ||
      !path.every(
        (segment: unknown) =>
          (typeof segment === 'string' &&
            segment.length > 0 &&
            segment.length <= 256) ||
          (typeof segment === 'number' &&
            Number.isInteger(segment) &&
            segment >= 0 &&
            segment <= 100_000),
      )
    )
      throw invalid('A secret path is a list of keys and indexes.');
    if (
      secret !== null &&
      (typeof secret !== 'string' ||
        secret === '' ||
        secret === CONFIG_SECRET_MASK ||
        Buffer.byteLength(secret) > MAX_SECRET_BYTES)
    )
      throw invalid(
        'A secret is replaced by a non-empty text and removed by null.',
      );
    return { path: path as (string | number)[], value: secret };
  });
}

/** The scalars to mask: secrets by key or form, then values equal to or containing one of them. */
function secretNodes(document: Document): Set<Scalar> {
  const nodes = new Set<Scalar>();
  visit(document, {
    Scalar(key, node, ancestors) {
      const path = pathOf(ancestors, node, key);
      if (!path) return;
      if (isSecretValue(path, node.value)) nodes.add(node);
    },
    Alias(key, node, ancestors) {
      const path = pathOf(ancestors, node, key);
      if (!path || !secretKeyOf(path)) return;
      // A secret key whose value is an alias: the anchored value is the secret.
      const source = node.resolve(document);
      if (isScalar(source) && isSecretValue(path, source.value))
        nodes.add(source);
    },
  });
  const values = [...nodes]
    .map((node) => String(node.value))
    .filter((value) => value.length > 0);
  if (values.length === 0) return nodes;
  visit(document, {
    Scalar(key, node, ancestors) {
      if (nodes.has(node) || typeof node.value !== 'string') return;
      if (!pathOf(ancestors, node, key)) return;
      const text = node.value;
      if (
        values.some(
          (secret) =>
            text === secret ||
            (secret.length >= MIN_CONTAINED_SECRET && text.includes(secret)),
        )
      )
        nodes.add(node);
    },
  });
  return nodes;
}

function isSecretValue(path: ConfigPath, value: unknown): boolean {
  if (typeof value === 'string') {
    if (value === '') return false;
    return secretKeyOf(path) !== null || URL_WITH_PASSWORD.test(value);
  }
  if (typeof value === 'number' || typeof value === 'bigint')
    return secretKeyOf(path) === 'any';
  return false;
}

/** The secret kind of the nearest map key on the path (a sequence item belongs to the key holding the sequence). */
function secretKeyOf(path: ConfigPath): 'any' | 'string' | null {
  for (let index = path.length - 1; index >= 0; index -= 1) {
    const segment = path[index];
    if (typeof segment === 'string') {
      const kind = secretKeyKind(segment);
      // A number inside a list is a list item, not a password.
      return kind === 'any' && index !== path.length - 1 ? 'string' : kind;
    }
  }
  return null;
}

/**
 * The path of a value node from its ancestors as `visit` reports them; null for a map key (keys are not values) or a
 * key that is not a scalar.
 */
function pathOf(
  ancestors: readonly unknown[],
  node: Node,
  key: number | 'key' | 'value' | null,
): (string | number)[] | null {
  if (key === 'key') return null;
  const path: (string | number)[] = [];
  for (let index = 0; index < ancestors.length; index += 1) {
    const ancestor = ancestors[index];
    const child = ancestors[index + 1] ?? node;
    if (isSeq(ancestor)) path.push(ancestor.items.indexOf(child));
    else if (isPair(ancestor)) {
      if (child === ancestor.key) return null;
      const name = isScalar(ancestor.key) ? ancestor.key.value : ancestor.key;
      if (typeof name !== 'string' && typeof name !== 'number') return null;
      path.push(String(name));
    }
  }
  return path;
}

/** A scalar holding `value` in place of `node`, with its anchor and comments. */
function replaceValue(node: Scalar, value: unknown): Scalar {
  const replacement = new Scalar(value);
  if (node.anchor) replacement.anchor = node.anchor;
  if (node.comment) replacement.comment = node.comment;
  if (node.commentBefore) replacement.commentBefore = node.commentBefore;
  if (node.spaceBefore) replacement.spaceBefore = node.spaceBefore;
  return replacement;
}

function valueAt(value: unknown, path: ConfigPath): unknown {
  let current = value;
  for (const segment of path) {
    if (typeof segment === 'number') {
      if (!Array.isArray(current)) return undefined;
      current = current[segment];
    } else {
      if (!isRecord(current)) return undefined;
      current = current[segment];
    }
  }
  return current;
}

function firstLine(message: string | undefined): string {
  return (message ?? 'Invalid YAML.').split('\n')[0] ?? 'Invalid YAML.';
}

function withNewline(content: string): string {
  return content.endsWith('\n') ? content : `${content}\n`;
}
