/**
 * An App's `config.yml`: validation, generated secrets and atomic writes. A new App starts from its release's
 * `config.example.yml`; `secrets.keys`, `auth.secret` and `session.secret` are generated when missing or left as
 * placeholders, and an existing value is kept across deployments. Adapted from the Hub plugin.
 */
import { randomBytes, randomUUID } from 'node:crypto';
import { chmod, mkdir, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { isPlaceholderSecret } from '@nocobase/app-server/config';
import { generateSecretKey, validateSecretKeys } from '@nocobase/secrets';
import { parse as parseYaml, parseDocument as parseYamlDocument } from 'yaml';

import { ReleasesError } from '../errors.js';
import { isRecord } from './codec.js';

export const MAX_CONFIG_BYTES: number = 1024 * 1024;

/** The sections whose secret a deployment fills in: `secrets.keys`, `auth.secret`, `session.secret`. */
export type ConfigSecretSection = 'secrets' | 'auth' | 'session';

/** The configuration path of each section's secret. */
export const CONFIG_SECRET_PATHS: Readonly<
  Record<ConfigSecretSection, string>
> = {
  secrets: 'secrets.keys',
  auth: 'auth.secret',
  session: 'session.secret',
};
const AUTH_SECRET_BYTES = 32;

export function validateYamlConfig(content: string): void {
  try {
    const value: unknown =
      content.trim() === '' ? {} : (parseYaml(content) as unknown);
    if (!isRecord(value)) throw new Error('the YAML root must be an object');
  } catch (error) {
    throw new ReleasesError(
      `Invalid config.yml: ${firstLine(error instanceof Error ? error.message : String(error))}`,
      'INVALID_CONFIG_FILE',
      'INVALID_ARGUMENT',
    );
  }
}

/** A YAML error's first line: the rest quotes the offending source line, which may hold a secret. */
function firstLine(message: string): string {
  return message.split('\n')[0] ?? message;
}

export function assertConfigSize(content: string): void {
  if (Buffer.byteLength(content) > MAX_CONFIG_BYTES)
    throw new ReleasesError(
      'Configuration may be at most 1 MiB.',
      'CONFIG_TOO_LARGE',
      'INVALID_ARGUMENT',
    );
}

/**
 * Fills the secrets an App cannot start without, preferring the values `fallbackContent` (what the App uses now) holds:
 * `secrets.keys` when missing, empty or holding the placeholder, and `auth.secret` and `session.secret` when missing or
 * placeholders. An App built from a template older than `secrets.keys` still needs the latter two; a newer one takes
 * `auth.secret` as Better Auth's legacy secret and keeps its session key in `session.secret`.
 */
export function ensureConfigSecrets(
  content: string,
  fallbackContent?: string,
  options: {
    /** Sections whose secret a variable supplies instead (the build declares one for it). */
    readonly skip?: readonly ConfigSecretSection[];
  } = {},
): string {
  const skip = new Set(options.skip ?? []);
  const document = parseYamlDocument(content);
  if (document.errors.length > 0)
    throw new ReleasesError(
      `Invalid config.yml: ${firstLine(document.errors[0]?.message ?? 'Invalid YAML.')}`,
      'INVALID_CONFIG_FILE',
      'INVALID_ARGUMENT',
    );
  const value: unknown =
    content.trim() === '' ? {} : (document.toJS() as unknown);
  if (!isRecord(value))
    throw new ReleasesError(
      'Invalid config.yml: the YAML root must be an object.',
      'INVALID_CONFIG_FILE',
      'INVALID_ARGUMENT',
    );
  const previous: unknown = fallbackContent ? parseYaml(fallbackContent) : {};
  let changed = false;

  const secrets = value.secrets;
  if (!skip.has('secrets') && (secrets === undefined || isRecord(secrets))) {
    const keys = isRecord(secrets) ? secrets.keys : undefined;
    if (needsKeys(keys)) {
      const old = isRecord(previous) ? previous.secrets : undefined;
      const oldKeys = isRecord(old) ? old.keys : undefined;
      document.setIn(
        ['secrets', 'keys'],
        usableKeys(oldKeys)
          ? oldKeys
          : [{ version: 1, key: generateSecretKey() }],
      );
      changed = true;
    }
  }

  for (const key of ['auth', 'session'] as const) {
    if (skip.has(key)) continue;
    const section = value[key];
    const oldSection = isRecord(previous) ? previous[key] : undefined;
    const oldSecret = isRecord(oldSection) ? oldSection.secret : undefined;
    const fallback =
      typeof oldSecret === 'string' &&
      oldSecret.trim().length > 0 &&
      !isPlaceholderSecret(oldSecret)
        ? oldSecret
        : undefined;
    if (section !== undefined && !isRecord(section)) continue;
    const secret = isRecord(section) ? section.secret : undefined;
    if (
      typeof secret === 'string' &&
      secret.trim().length > 0 &&
      !isPlaceholderSecret(secret)
    )
      continue;
    // Keep invalid non-string values for the runtime's own configuration errors.
    if (secret !== undefined && typeof secret !== 'string') continue;
    document.setIn(
      [key, 'secret'],
      fallback ?? randomBytes(AUTH_SECRET_BYTES).toString('base64url'),
    );
    changed = true;
  }
  return changed ? ensureTrailingNewline(document.toString()) : content;
}

/**
 * Whether `secrets.keys` is missing, empty or still at the placeholder. Any other value, a weak key included, is the
 * operator's and is left for the runtime to report.
 */
function needsKeys(keys: unknown): boolean {
  if (keys === undefined || keys === null) return true;
  if (!Array.isArray(keys)) return false;
  return (
    keys.length === 0 ||
    keys.some(
      (entry) => isRecord(entry) && isPlaceholderSecret(String(entry.key)),
    )
  );
}

/** A non-empty key list the runtime accepts, the placeholder excluded. */
function usableKeys(keys: unknown): keys is unknown[] {
  return (
    Array.isArray(keys) &&
    keys.length > 0 &&
    validateSecretKeys(keys, { isPlaceholder: isPlaceholderSecret }).length ===
      0
  );
}

export async function writeTextAtomic(
  filePath: string,
  content: string,
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true, mode: 0o700 });
  await chmod(path.dirname(filePath), 0o700);
  const temporary = `${filePath}.${process.pid}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, ensureTrailingNewline(content), {
      mode: 0o600,
      flag: 'wx',
    });
    await chmod(temporary, 0o600);
    await rename(temporary, filePath);
  } finally {
    await rm(temporary, { force: true });
  }
}

export function ensureTrailingNewline(content: string): string {
  return content.endsWith('\n') ? content : `${content}\n`;
}

/**
 * Sets `app.publicOrigin` from the App's public URL when the configuration does not name one: an App served under
 * another origin than the one it was built for (a preview domain) needs it for links, cookies and redirects. A value
 * already set is kept.
 */
export function ensurePublicOrigin(
  content: string,
  publicUrl: string | null,
): string {
  if (!publicUrl || !/^https?:\/\//i.test(publicUrl)) return content;
  const document = parseYamlDocument(content);
  if (document.errors.length > 0) return content;
  const value: unknown =
    content.trim() === '' ? {} : (document.toJS() as unknown);
  if (!isRecord(value)) return content;
  const app = value.app;
  if (app !== undefined && !isRecord(app)) return content;
  if (isRecord(app) && app.publicOrigin !== undefined) return content;
  document.setIn(['app', 'publicOrigin'], new URL(publicUrl).origin);
  return ensureTrailingNewline(document.toString());
}
