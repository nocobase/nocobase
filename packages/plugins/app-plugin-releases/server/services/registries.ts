/**
 * OCI image registries (`relRegistries`): where an App's CI pushes its release images and Docker environments pull
 * them from, by digest. Only the OCI Distribution API is assumed, so GHCR, a cloud registry, Harbor, Zot or a plain
 * `registry` all work. A registry holds pull credentials, write-only like an environment's, which a deployment hands
 * to its driver (`pullAuth`); the username is kept in the clear, the password encrypted under the registry's ID.
 */
import type { DatabaseManager, Row } from '@nocobase/db';

import {
  REGISTRY_SECRET_KEYS,
  type RegistryCheckResult,
  type RegistryInput,
  type RegistryRecord,
  type RegistrySecretKey,
} from '../../shared/releases.js';
import type { AccessGuard, Caller } from '../access/caller.js';
import type { RegistryAuth } from '../drivers/types.js';
import { ReleasesError, notFound } from '../errors.js';
import { decodeDate, isRecord, nullableString } from './codec.js';
import { decryptText, encryptText, type ReleasesSecrets } from './secrets.js';
import { assertEnvironmentId, normalizeName } from './validation.js';

const CHECK_TIMEOUT_MS = 10_000;
const NAMESPACE_PATTERN =
  /^[a-z0-9]+(?:[._-][a-z0-9]+)*(?:\/[a-z0-9]+(?:[._-][a-z0-9]+)*)*$/u;

export interface RegistryServiceOptions {
  readonly database: DatabaseManager;
  readonly guard: AccessGuard;
  /** The application's secrets service, which seals the credentials. */
  readonly secrets?: ReleasesSecrets;
  /** For the connection check; the global `fetch` by default. */
  readonly fetch?: typeof fetch;
}

/** The host images in a registry are named under: `ghcr.io`, `localhost:5000`. */
export function imageHost(url: string): string {
  return new URL(url).host;
}

/**
 * A registry address as stored: an origin. A bare host gets `https://`, except a loopback one, which Docker reaches
 * over plain HTTP (`localhost:5000` is `http://localhost:5000`).
 */
export function normalizeRegistryUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.length > 1024)
    throw new ReleasesError(
      'A registry address is required, such as https://ghcr.io or localhost:5000.',
      'INVALID_REGISTRY_URL',
      'INVALID_ARGUMENT',
    );
  let text = value.trim().replace(/\/+$/u, '');
  if (!/^[a-z][a-z0-9+.-]*:\/\//iu.test(text)) {
    const host = text.split('/')[0] ?? '';
    const loopback = /^(localhost|127\.\d+\.\d+\.\d+|\[::1\])(:\d+)?$/iu.test(
      host,
    );
    text = `${loopback ? 'http' : 'https'}://${text}`;
  }
  let url: URL;
  try {
    url = new URL(text);
  } catch {
    throw new ReleasesError(
      'The registry address is not a valid URL.',
      'INVALID_REGISTRY_URL',
      'INVALID_ARGUMENT',
    );
  }
  if (
    (url.protocol !== 'https:' && url.protocol !== 'http:') ||
    (url.pathname !== '/' && url.pathname !== '') ||
    url.search ||
    url.username ||
    url.password
  )
    throw new ReleasesError(
      'The registry address is its origin only, such as https://ghcr.io (the path goes in the namespace).',
      'INVALID_REGISTRY_URL',
      'INVALID_ARGUMENT',
    );
  return url.origin;
}

function normalizeNamespace(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  const text =
    typeof value === 'string' ? value.trim().replace(/^\/+|\/+$/gu, '') : '';
  if (!text) return null;
  if (text.length > 255 || !NAMESPACE_PATTERN.test(text))
    throw new ReleasesError(
      'The namespace is lowercase path components, such as acme or team/apps.',
      'INVALID_REGISTRY_NAMESPACE',
      'INVALID_ARGUMENT',
    );
  return text;
}

function normalizeUsername(value: unknown): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 255)
    throw new ReleasesError(
      'A username is at most 255 characters.',
      'INVALID_REGISTRY_CREDENTIALS',
      'INVALID_ARGUMENT',
    );
  return value.trim() || null;
}

/** The passwords after `changes`: a value replaces one, `null` removes it, a key left out keeps it. */
function mergeSecret(
  current: Partial<Record<RegistrySecretKey, string>>,
  changes: unknown,
): Partial<Record<RegistrySecretKey, string>> {
  if (changes === undefined) return current;
  if (!isRecord(changes))
    throw new ReleasesError(
      'secretChanges must be an object.',
      'INVALID_REGISTRY_CREDENTIALS',
      'INVALID_ARGUMENT',
    );
  const next = { ...current };
  for (const [key, value] of Object.entries(changes)) {
    if (!(REGISTRY_SECRET_KEYS as readonly string[]).includes(key))
      throw new ReleasesError(
        `Unknown credential ${key}; use ${REGISTRY_SECRET_KEYS.join(' or ')}.`,
        'INVALID_REGISTRY_CREDENTIALS',
        'INVALID_ARGUMENT',
      );
    if (value === null) delete next[key as RegistrySecretKey];
    else if (typeof value === 'string' && value && value.length <= 10_000)
      next[key as RegistrySecretKey] = value;
    else
      throw new ReleasesError(
        'A password is text of at most 10 000 characters.',
        'INVALID_REGISTRY_CREDENTIALS',
        'INVALID_ARGUMENT',
      );
  }
  return next;
}

interface Credentials {
  readonly username?: string;
  readonly password?: string;
}

function basic(credentials: Credentials): string {
  return `Basic ${Buffer.from(`${credentials.username ?? ''}:${credentials.password ?? ''}`).toString('base64')}`;
}

/** The parameters of a `WWW-Authenticate` challenge: `Bearer realm="…",service="…"`. */
function challenge(header: string | null): {
  scheme: string;
  params: Record<string, string>;
} | null {
  if (!header) return null;
  const match = /^(\w+)\s*(.*)$/su.exec(header.trim());
  if (!match) return null;
  const params: Record<string, string> = {};
  for (const part of (match[2] ?? '').matchAll(/(\w+)="([^"]*)"/gu))
    params[part[1].toLowerCase()] = part[2]!;
  return { scheme: match[1].toLowerCase(), params };
}

/**
 * Whether `credentials` are accepted by the registry at `base`: `/v2/` with Basic authentication, or a token from the
 * realm a Bearer challenge names (scoped to pulling from the namespace), then `/v2/` with that token.
 */
async function authenticates(
  base: string,
  first: Response,
  credentials: Credentials,
  namespace: string | null,
  fetchImpl: typeof fetch,
): Promise<boolean> {
  const found = challenge(first.headers.get('www-authenticate'));
  const signal = () => AbortSignal.timeout(CHECK_TIMEOUT_MS);
  if (found?.scheme === 'bearer' && found.params.realm) {
    const realm = new URL(found.params.realm);
    if (found.params.service)
      realm.searchParams.set('service', found.params.service);
    if (namespace)
      realm.searchParams.set('scope', `repository:${namespace}/probe:pull`);
    if (credentials.username)
      realm.searchParams.set('account', credentials.username);
    const answer = await fetchImpl(realm, {
      headers: { authorization: basic(credentials) },
      signal: signal(),
    });
    if (!answer.ok) return false;
    const body = (await answer.json().catch(() => ({}))) as {
      token?: unknown;
      access_token?: unknown;
    };
    const token =
      typeof body.token === 'string'
        ? body.token
        : typeof body.access_token === 'string'
          ? body.access_token
          : null;
    if (!token) return false;
    const again = await fetchImpl(`${base}/v2/`, {
      headers: { authorization: `Bearer ${token}` },
      signal: signal(),
    });
    return again.ok;
  }
  const again = await fetchImpl(`${base}/v2/`, {
    headers: { authorization: basic(credentials) },
    signal: signal(),
  });
  return again.ok;
}

/** Tries the registry's `/v2/` endpoint and each credential that is set. */
export async function checkRegistry(
  registry: {
    readonly url: string;
    readonly namespace: string | null;
    readonly pull: Credentials | null;
  },
  fetchImpl: typeof fetch = fetch,
): Promise<RegistryCheckResult> {
  let first: Response;
  try {
    first = await fetchImpl(`${registry.url}/v2/`, {
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
  } catch (error) {
    return {
      ok: false,
      message: `Could not reach ${registry.url}: ${error instanceof Error ? (error.cause instanceof Error ? error.cause.message : error.message) : String(error)}`,
    };
  }
  if (first.ok)
    return {
      ok: true,
      message: 'The registry answers without credentials.',
      details: { anonymous: true, pull: registry.pull ? 'ok' : 'notSet' },
    };
  if (first.status !== 401)
    return {
      ok: false,
      message: `${registry.url}/v2/ answered ${first.status}; it does not look like an OCI registry.`,
    };
  const verdict = async (credentials: Credentials | null) =>
    credentials === null
      ? ('notSet' as const)
      : (await authenticates(
            registry.url,
            first,
            credentials,
            registry.namespace,
            fetchImpl,
          ).catch(() => false))
        ? ('ok' as const)
        : ('failed' as const);
  const pull = await verdict(registry.pull);
  const details = { anonymous: false, pull };
  if (pull === 'failed')
    return {
      ok: false,
      message: 'The registry refused the pull credentials.',
      details,
    };
  if (pull === 'notSet')
    return {
      ok: false,
      message: 'The registry asks for credentials; set the pull credentials.',
      details,
    };
  return { ok: true, details };
}

export class RegistryService {
  public constructor(private readonly options: RegistryServiceOptions) {}

  public async list(caller: Caller): Promise<readonly RegistryRecord[]> {
    this.options.guard.requireSetting(caller, 'rel.environments', 'read');
    const rows = await this.query()
      .selectFrom('relRegistries')
      .selectAll()
      .orderBy('name', 'asc')
      .orderBy('id', 'asc')
      .execute<Row>();
    const users = await this.environmentsByRegistry();
    return rows.map((row) => this.decode(row, users.get(String(row.id)) ?? []));
  }

  public async get(caller: Caller, id: string): Promise<RegistryRecord> {
    this.options.guard.requireSetting(caller, 'rel.environments', 'read');
    return await this.record(id);
  }

  public async create(
    caller: Caller,
    input: RegistryInput,
  ): Promise<RegistryRecord> {
    this.options.guard.requireSetting(caller, 'rel.environments', 'manage');
    const id = typeof input?.id === 'string' ? input.id.trim() : '';
    try {
      assertEnvironmentId(id);
    } catch {
      throw new ReleasesError(
        'Registry ID may contain only lowercase letters, numbers, underscores and hyphens, and may not be "check".',
        'INVALID_REGISTRY_ID',
        'INVALID_ARGUMENT',
      );
    }
    if (await this.findRow(id))
      throw new ReleasesError(
        'A registry with this ID already exists.',
        'REGISTRY_EXISTS',
        'ALREADY_EXISTS',
      );
    const secret = mergeSecret({}, input.secretChanges);
    const now = new Date();
    await this.query()
      .insertInto('relRegistries')
      .values({
        id,
        name: normalizeName(input.name, 'INVALID_REGISTRY_NAME'),
        url: normalizeRegistryUrl(input.url),
        namespace: normalizeNamespace(input.namespace),
        pullUsername: normalizeUsername(input.pullUsername),
        secret: this.encrypt(id, secret),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    return await this.record(id);
  }

  public async update(
    caller: Caller,
    id: string,
    input: RegistryInput,
  ): Promise<RegistryRecord> {
    this.options.guard.requireSetting(caller, 'rel.environments', 'manage');
    const row = await this.findRow(id);
    if (!row) throw notFound('Registry', 'REGISTRY_NOT_FOUND', id);
    const values: Row = { updatedAt: new Date() };
    if (input.name !== undefined)
      values.name = normalizeName(input.name, 'INVALID_REGISTRY_NAME');
    if (input.url !== undefined) values.url = normalizeRegistryUrl(input.url);
    if (input.namespace !== undefined)
      values.namespace = normalizeNamespace(input.namespace);
    if (input.pullUsername !== undefined)
      values.pullUsername = normalizeUsername(input.pullUsername);
    if (input.secretChanges !== undefined)
      values.secret = this.encrypt(
        id,
        mergeSecret(this.decryptRow(row), input.secretChanges),
      );
    await this.query()
      .updateTable('relRegistries')
      .set(values)
      .where('id', '=', id)
      .execute();
    return await this.record(id);
  }

  public async remove(caller: Caller, id: string): Promise<void> {
    this.options.guard.requireSetting(caller, 'rel.environments', 'manage');
    await this.record(id);
    const users = await this.query()
      .selectFrom('relEnvironments')
      .select(['name'])
      .where('registryId', '=', id)
      .orderBy('name', 'asc')
      .execute<Row>();
    if (users.length > 0)
      throw new ReleasesError(
        `Environments pull from this registry (${users.map((row) => String(row.name)).join(', ')}); choose another registry for them first.`,
        'REGISTRY_IN_USE',
        'FAILED_PRECONDITION',
      );
    await this.query()
      .deleteFrom('relRegistries')
      .where('id', '=', id)
      .execute();
  }

  /** Tries a stored registry. */
  public async check(caller: Caller, id: string): Promise<RegistryCheckResult> {
    this.options.guard.requireSetting(caller, 'rel.environments', 'read');
    const row = await this.findRow(id);
    if (!row) throw notFound('Registry', 'REGISTRY_NOT_FOUND', id);
    return await this.checkRow(
      {
        url: row.url,
        namespace: row.namespace,
        pullUsername: row.pullUsername,
      },
      this.decryptRow(row),
    );
  }

  /** Tries settings before they are saved; editing a registry, the passwords not changed are its stored ones. */
  public async checkDraft(
    caller: Caller,
    input: RegistryInput,
  ): Promise<RegistryCheckResult> {
    this.options.guard.requireSetting(caller, 'rel.environments', 'manage');
    const existing =
      typeof input?.id === 'string' && input.id.trim()
        ? await this.findRow(input.id.trim())
        : undefined;
    const secret = mergeSecret(
      existing ? this.decryptRow(existing) : {},
      input.secretChanges,
    );
    const pick = <K extends keyof RegistryInput>(key: K): unknown =>
      input[key] === undefined ? existing?.[key] : input[key];
    return await this.checkRow(
      {
        url: normalizeRegistryUrl(pick('url')),
        namespace: normalizeNamespace(pick('namespace')),
        pullUsername: normalizeUsername(pick('pullUsername')),
      },
      secret,
    );
  }

  /** The registry, without access checks: for the other services. */
  public async record(id: string): Promise<RegistryRecord> {
    const row = await this.findRow(id);
    if (!row) throw notFound('Registry', 'REGISTRY_NOT_FOUND', id);
    return this.decode(row, await this.environmentsOf(id));
  }

  public async find(id: string): Promise<RegistryRecord | null> {
    const row = await this.findRow(id);
    return row ? this.decode(row, await this.environmentsOf(id)) : null;
  }

  /** The pull credentials an environment's driver gets, or none for anonymous pulls. */
  public async pullAuth(id: string): Promise<{
    registry: RegistryRecord;
    auth: RegistryAuth | undefined;
  } | null> {
    const row = await this.findRow(id);
    if (!row) return null;
    const registry = this.decode(row, []);
    const password = this.decryptRow(row).pullPassword;
    return {
      registry,
      auth:
        password === undefined
          ? undefined
          : {
              serveraddress: registry.host,
              ...(registry.pullUsername
                ? { username: registry.pullUsername }
                : {}),
              password,
            },
    };
  }

  private async checkRow(
    row: {
      url: unknown;
      namespace: unknown;
      pullUsername: unknown;
    },
    secret: Partial<Record<RegistrySecretKey, string>>,
  ): Promise<RegistryCheckResult> {
    const credentials = (username: unknown, password: string | undefined) =>
      password === undefined
        ? null
        : {
            ...(typeof username === 'string' && username ? { username } : {}),
            password,
          };
    return await checkRegistry(
      {
        url: String(row.url),
        namespace: nullableString(row.namespace),
        pull: credentials(row.pullUsername, secret.pullPassword),
      },
      this.options.fetch ?? fetch,
    );
  }

  private decode(row: Row, environmentIds: readonly string[]): RegistryRecord {
    let secretKeys: readonly string[];
    try {
      secretKeys = Object.keys(this.decryptRow(row)).sort();
    } catch {
      secretKeys = [];
    }
    const url = String(row.url);
    return {
      id: String(row.id),
      name: String(row.name),
      url,
      host: imageHost(url),
      namespace: nullableString(row.namespace),
      pullUsername: nullableString(row.pullUsername),
      secretKeys,
      environmentIds,
      createdAt: decodeDate(row.createdAt).toISOString(),
      updatedAt: decodeDate(row.updatedAt).toISOString(),
    };
  }

  private encrypt(
    id: string,
    secret: Partial<Record<RegistrySecretKey, string>>,
  ): string | null {
    if (Object.keys(secret).length === 0) return null;
    return encryptText(
      JSON.stringify(secret),
      [id],
      this.options.secrets,
      'registry-credentials',
    );
  }

  private decryptRow(row: Row): Partial<Record<RegistrySecretKey, string>> {
    const value = nullableString(row.secret);
    if (!value) return {};
    const parsed = JSON.parse(
      decryptText(
        value,
        [String(row.id)],
        this.options.secrets,
        'registry-credentials',
      ),
    ) as unknown;
    if (!isRecord(parsed)) return {};
    const secret: Partial<Record<RegistrySecretKey, string>> = {};
    for (const key of REGISTRY_SECRET_KEYS)
      if (typeof parsed[key] === 'string') secret[key] = parsed[key];
    return secret;
  }

  private async environmentsOf(id: string): Promise<string[]> {
    const rows = await this.query()
      .selectFrom('relEnvironments')
      .select('id')
      .where('registryId', '=', id)
      .orderBy('id', 'asc')
      .execute<Row>();
    return rows.map((row) => String(row.id));
  }

  private async environmentsByRegistry(): Promise<Map<string, string[]>> {
    const rows = await this.query()
      .selectFrom('relEnvironments')
      .select(['id', 'registryId'])
      .where('registryId', 'is not', null)
      .orderBy('id', 'asc')
      .execute<Row>();
    const users = new Map<string, string[]>();
    for (const row of rows) {
      const key = String(row.registryId);
      users.set(key, [...(users.get(key) ?? []), String(row.id)]);
    }
    return users;
  }

  private async findRow(id: string): Promise<Row | undefined> {
    return await this.query()
      .selectFrom('relRegistries')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst<Row>();
  }

  private query() {
    return this.options.database.connection().query;
  }
}
