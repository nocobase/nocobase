/**
 * Deployment variables: the environment variables an App runs with. A build declares the ones it reads in its manifest
 * (`dist/variables.json`, stored on the release); values are set per environment and per App, sealed with the
 * secrets service whether they are secrets or not, and resolved for each deployment, strongest first:
 *
 * | source        | what                                                                                          |
 * | ------------- | --------------------------------------------------------------------------------------------- |
 * | `app`         | the App's own value                                                                          |
 * | `environment` | the environment's value                                                                      |
 * | `configFile`  | nothing above, and the App's `config.yml` holds a real value at the variable's path           |
 * | `generated`   | release management made one: a secret kept as an App value, the public origin, sample data |
 * | `default`     | the build's code defaults give the path a value                                              |
 * | `unset`       | nothing: a required variable is then missing, and a deployment is refused                    |
 *
 * Only `app`, `environment` and `generated` reach the App; the runtime reads them over `config.yml`.
 */
import { createHash, randomBytes, randomUUID } from 'node:crypto';

import {
  isExamplePlaceholder,
  isSecretPath,
} from '@nocobase/app-server/config';
import type { DatabaseConnection, DatabaseManager, Row } from '@nocobase/db';
import { generateSecretKey } from '@nocobase/secrets';

import {
  MAX_MANIFEST_VARIABLES,
  MAX_VARIABLE_VALUE_BYTES,
  RESERVED_VARIABLE_NAMES,
  VARIABLE_NAME_PATTERN,
  type AppVariableView,
  type EnvironmentVariableView,
  type ReleaseVariable,
  type ReleaseVariablesManifest,
  type VariableGenerator,
  type VariableSource,
  type VariableValueView,
} from '../../shared/releases.js';
import { ReleasesError } from '../errors.js';
import { decodeDate, isRecord, nullableString } from './codec.js';
import { decryptText, encryptText, type ReleasesSecrets } from './secrets.js';

/** The configuration paths release management fills in itself when a build declares a variable for them. */
export const INITIAL_ADMIN_PATHS = {
  username: 'users.initialAdmin.username',
  email: 'users.initialAdmin.email',
  password: 'users.initialAdmin.password',
} as const;
export const PUBLIC_ORIGIN_PATH = 'app.publicOrigin';
export const SAMPLE_DATA_PATH = 'app.sampleData';

/** The first administrator when the build and its configuration name none: the authentication plugin's defaults. */
export const DEFAULT_INITIAL_ADMIN = {
  username: 'nocobase',
  email: 'admin@nocobase.com',
} as const;

// --- Manifest ---------------------------------------------------------------------------------------------------

const GENERATORS: readonly VariableGenerator[] = [
  'secret',
  'secretKeys',
  'password',
];

function invalidManifest(message: string): ReleasesError {
  return new ReleasesError(
    `Invalid variables manifest: ${message}`,
    'INVALID_VARIABLES_MANIFEST',
    'INVALID_ARGUMENT',
  );
}

function optionalText(
  value: unknown,
  max: number,
  what: string,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string' || value.length > max)
    throw invalidManifest(`${what} must be text of at most ${max} characters.`);
  return value;
}

/**
 * A manifest from an archive or from CI, checked: it comes from the build, which nobody vouched for. Unknown fields
 * are dropped; names, counts and lengths are bounded.
 */
export function parseVariablesManifest(
  value: unknown,
): ReleaseVariablesManifest {
  if (!isRecord(value)) throw invalidManifest('expected a JSON object.');
  if (value.schemaVersion !== 1)
    throw invalidManifest('schemaVersion must be 1.');
  if (!Array.isArray(value.variables))
    throw invalidManifest('variables must be a list.');
  if (value.variables.length > MAX_MANIFEST_VARIABLES)
    throw invalidManifest(
      `it may declare at most ${MAX_MANIFEST_VARIABLES} variables.`,
    );
  const seen = new Set<string>();
  const variables = value.variables.map((entry: unknown): ReleaseVariable => {
    if (!isRecord(entry)) throw invalidManifest('each variable is an object.');
    const name = entry.name;
    if (typeof name !== 'string' || !VARIABLE_NAME_PATTERN.test(name))
      throw invalidManifest(
        `${JSON.stringify(name)} is not a variable name (upper-case letters, digits and underscores).`,
      );
    if (seen.has(name)) throw invalidManifest(`${name} is declared twice.`);
    seen.add(name);
    const generate = entry.generate ?? null;
    if (
      generate !== null &&
      !GENERATORS.includes(generate as VariableGenerator)
    )
      throw invalidManifest(`${name}: unknown generator.`);
    const path = optionalText(entry.path, 255, `${name}: path`);
    const type = optionalText(entry.type, 32, `${name}: type`);
    const description = optionalText(
      entry.description,
      1000,
      `${name}: description`,
    );
    return {
      name,
      ...(path === undefined ? {} : { path }),
      ...(type === undefined ? {} : { type }),
      ...(description === undefined ? {} : { description }),
      secret: entry.secret === true,
      required: entry.required === true,
      ...(entry.hasDefault === true ? { hasDefault: true } : {}),
      ...(entry.exampleProvided === true ? { exampleProvided: true } : {}),
      firstStartOnly: entry.firstStartOnly === true,
      generate: generate as VariableGenerator | null,
      ...(entry.runtime === true ? { runtime: true } : {}),
    };
  });
  const app = isRecord(value.app)
    ? {
        ...(typeof value.app.name === 'string'
          ? { name: value.app.name.slice(0, 214) }
          : {}),
        ...(typeof value.app.version === 'string'
          ? { version: value.app.version.slice(0, 255) }
          : {}),
      }
    : undefined;
  return {
    schemaVersion: 1,
    ...(app ? { app } : {}),
    ...(typeof value.generatedAt === 'string'
      ? { generatedAt: value.generatedAt.slice(0, 64) }
      : {}),
    variables,
  };
}

/** A stored manifest read back; one that no longer parses counts as none. */
export function decodeVariablesManifest(
  value: unknown,
): ReleaseVariablesManifest | null {
  if (value === null || value === undefined) return null;
  try {
    return parseVariablesManifest(
      typeof value === 'string' ? (JSON.parse(value) as unknown) : value,
    );
  } catch {
    return null;
  }
}

// --- Names and values -------------------------------------------------------------------------------------------

export function assertVariableName(name: string): void {
  if (!VARIABLE_NAME_PATTERN.test(name))
    throw new ReleasesError(
      'A variable name is an upper-case letter followed by upper-case letters, digits and underscores.',
      'INVALID_VARIABLE_NAME',
      'INVALID_ARGUMENT',
    );
  if (RESERVED_VARIABLE_NAMES.includes(name))
    throw new ReleasesError(
      `${name} is set by the runtime and cannot be a variable.`,
      'VARIABLE_RESERVED',
      'INVALID_ARGUMENT',
    );
}

export function assertVariableValue(value: unknown): asserts value is string {
  if (typeof value !== 'string')
    throw new ReleasesError(
      'A variable value is text.',
      'INVALID_VARIABLE_VALUE',
      'INVALID_ARGUMENT',
    );
  if (Buffer.byteLength(value) > MAX_VARIABLE_VALUE_BYTES)
    throw new ReleasesError(
      'A variable value is at most 64 KiB.',
      'INVALID_VARIABLE_VALUE',
      'INVALID_ARGUMENT',
    );
}

/** Whether a variable named so holds a secret, judged as a configuration key would be (`SMTP_PASSWORD`, `API_KEY`). */
export function isSecretName(name: string): boolean {
  return isSecretPath(name);
}

/** A value for a generator: 32 random bytes, a one-key `SECRETS_KEYS` list, or 16 letters and digits. */
export function generateVariable(kind: VariableGenerator): string {
  switch (kind) {
    case 'secretKeys':
      return `1:${generateSecretKey()}`;
    case 'password':
      return randomPassword();
    default:
      return randomBytes(32).toString('base64url');
  }
}

/** A password of letters and digits without look-alikes, so it survives copying. */
export function randomPassword(length: number = 16): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  return [...randomBytes(length)]
    .map((byte) => alphabet[byte % alphabet.length])
    .join('');
}

// --- Storage ----------------------------------------------------------------------------------------------------

export interface StoredEnvironmentVariable {
  readonly id: string;
  readonly environmentId: string;
  readonly name: string;
  readonly value: string | null;
  readonly secret: boolean;
  readonly description: string | null;
  readonly updatedBy: string | null;
  readonly updatedAt: Date;
}

export interface StoredAppVariable {
  readonly id: string;
  readonly appId: string;
  readonly name: string;
  readonly value: string | null;
  readonly secret: boolean;
  readonly generated: boolean;
}

/** Where a sealed variable value is bound: its table, owner and name. */
export function variableIdentity(
  kind: 'environment' | 'app',
  ownerId: string,
  name: string,
): readonly string[] {
  return [kind, ownerId, name];
}

export class VariableStore {
  public constructor(
    private readonly options: {
      readonly database: DatabaseManager;
      readonly secrets?: ReleasesSecrets;
    },
  ) {}

  public async environmentVariables(
    environmentId: string,
  ): Promise<StoredEnvironmentVariable[]> {
    const rows = await this.query()
      .selectFrom('relEnvironmentVariables')
      .selectAll()
      .where('environmentId', '=', environmentId)
      .orderBy('name', 'asc')
      .execute<Row>();
    return rows.map((row) => ({
      id: String(row.id),
      environmentId: String(row.environmentId),
      name: String(row.name),
      value: this.open(
        row.value,
        variableIdentity(
          'environment',
          String(row.environmentId),
          String(row.name),
        ),
      ),
      secret: Boolean(row.secret),
      description: nullableString(row.description),
      updatedBy: nullableString(row.updatedBy),
      updatedAt: decodeDate(row.updatedAt),
    }));
  }

  public async appVariables(appId: string): Promise<StoredAppVariable[]> {
    const rows = await this.query()
      .selectFrom('relAppVariables')
      .selectAll()
      .where('appId', '=', appId)
      .orderBy('name', 'asc')
      .execute<Row>();
    return rows.map((row) => ({
      id: String(row.id),
      appId: String(row.appId),
      name: String(row.name),
      value: this.open(
        row.value,
        variableIdentity('app', String(row.appId), String(row.name)),
      ),
      secret: Boolean(row.secret),
      generated: Boolean(row.generated),
    }));
  }

  public async setEnvironmentVariable(
    environmentId: string,
    name: string,
    input: {
      readonly value: string;
      readonly secret: boolean;
      readonly description?: string | null;
      readonly by: string | null;
    },
  ): Promise<void> {
    const sealed = this.seal(
      input.value,
      variableIdentity('environment', environmentId, name),
    );
    const now = new Date();
    const existing = await this.query()
      .selectFrom('relEnvironmentVariables')
      .select('id')
      .where('environmentId', '=', environmentId)
      .where('name', '=', name)
      .executeTakeFirst<Row>();
    if (existing)
      await this.query()
        .updateTable('relEnvironmentVariables')
        .set({
          value: sealed,
          secret: input.secret,
          ...(input.description === undefined
            ? {}
            : { description: input.description }),
          updatedBy: input.by,
          updatedAt: now,
        })
        .where('id', '=', String(existing.id))
        .execute();
    else
      await this.query()
        .insertInto('relEnvironmentVariables')
        .values({
          id: randomUUID(),
          environmentId,
          name,
          value: sealed,
          secret: input.secret,
          description: input.description ?? null,
          createdBy: input.by,
          updatedBy: input.by,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
  }

  public async unsetEnvironmentVariable(
    environmentId: string,
    name: string,
  ): Promise<boolean> {
    const result = await this.query()
      .deleteFrom('relEnvironmentVariables')
      .where('environmentId', '=', environmentId)
      .where('name', '=', name)
      .execute();
    return Number(result.deletedCount ?? 0) > 0;
  }

  /** Sets the App's value. */
  public async setAppVariable(
    appId: string,
    name: string,
    input: {
      readonly value: string;
      readonly secret: boolean;
      readonly generated?: boolean;
      readonly by: string | null;
    },
    connection?: DatabaseConnection,
  ): Promise<void> {
    const query = connection?.query ?? this.query();
    const sealed = this.seal(input.value, variableIdentity('app', appId, name));
    const now = new Date();
    const existing = await query
      .selectFrom('relAppVariables')
      .select('id')
      .where('appId', '=', appId)
      .where('name', '=', name)
      .executeTakeFirst<Row>();
    if (existing)
      await query
        .updateTable('relAppVariables')
        .set({
          value: sealed,
          secret: input.secret,
          generated: input.generated === true,
          updatedBy: input.by,
          updatedAt: now,
        })
        .where('id', '=', String(existing.id))
        .execute();
    else
      await query
        .insertInto('relAppVariables')
        .values({
          id: randomUUID(),
          appId,
          name,
          value: sealed,
          secret: input.secret,
          generated: input.generated === true,
          createdBy: input.by,
          updatedBy: input.by,
          createdAt: now,
          updatedAt: now,
        })
        .execute();
  }

  /** Removes an App's variable; answers whether it had a value. */
  public async unsetAppVariable(appId: string, name: string): Promise<boolean> {
    const row = await this.query()
      .selectFrom('relAppVariables')
      .select(['id', 'value'])
      .where('appId', '=', appId)
      .where('name', '=', name)
      .executeTakeFirst<Row>();
    if (!row) return false;
    await this.query()
      .deleteFrom('relAppVariables')
      .where('id', '=', String(row.id))
      .execute();
    return row.value != null;
  }

  public async removeApp(
    appId: string,
    connection: DatabaseConnection,
  ): Promise<void> {
    await connection.query
      .deleteFrom('relAppVariables')
      .where('appId', '=', appId)
      .execute();
  }

  public async removeEnvironment(environmentId: string): Promise<void> {
    await this.query()
      .deleteFrom('relEnvironmentVariables')
      .where('environmentId', '=', environmentId)
      .execute();
  }

  public seal(value: string, identity: readonly string[]): string {
    return encryptText(value, identity, this.options.secrets, 'variables');
  }

  /** A sealed value opened; one that no longer opens (another key, damaged) reads as unset. */
  private open(value: unknown, identity: readonly string[]): string | null {
    if (typeof value !== 'string' || value === '') return null;
    try {
      return decryptText(value, identity, this.options.secrets, 'variables');
    } catch {
      return null;
    }
  }

  private query(): DatabaseConnection['query'] {
    return this.options.database.connection().query;
  }
}

export function environmentVariableView(
  variable: StoredEnvironmentVariable,
): EnvironmentVariableView {
  return {
    name: variable.name,
    secret: variable.secret,
    description: variable.description,
    ...valueView(variable.value, variable.secret),
    updatedBy: variable.updatedBy,
    updatedAt: variable.updatedAt.toISOString(),
  };
}

function valueView(value: string | null, secret: boolean): VariableValueView {
  return { set: value !== null, value: secret ? null : value };
}

// --- Resolution -------------------------------------------------------------------------------------------------

export interface ResolveVariablesInput {
  /** The release's manifest; without one nothing is required and only values someone set reach the App. */
  readonly manifest: ReleaseVariablesManifest | null;
  readonly environment: readonly StoredEnvironmentVariable[];
  readonly app: readonly StoredAppVariable[];
  /** The configuration the App runs with, parsed. */
  readonly configFile: unknown;
  /** Values release management makes for this deployment (the public origin, sample data, the first password). */
  readonly generated?: Readonly<Record<string, string>>;
  /** Variables release management would generate if they were deployed now; shown as `generated`, never missing. */
  readonly generatable?: ReadonlySet<string>;
  /** What the running deployment got, to say what changed. */
  readonly running?: Readonly<Record<string, string>> | null;
}

export interface ResolvedVariable {
  readonly name: string;
  readonly declaration: ReleaseVariable | null;
  readonly source: VariableSource;
  readonly secret: boolean;
  readonly firstStartOnly: boolean;
  readonly required: boolean;
  /** What the App gets, when a variable gives it one. */
  readonly value: string | undefined;
  readonly missing: boolean;
  readonly changed: boolean;
  readonly app: StoredAppVariable | null;
  readonly environment: StoredEnvironmentVariable | null;
}

export interface ResolvedVariables {
  /** What the App's environment holds. */
  readonly env: Record<string, string>;
  readonly variables: readonly ResolvedVariable[];
  readonly missing: readonly ReleaseVariable[];
  /** Of `env` without what is read only on the first start: what tells a later change. */
  readonly fingerprint: string;
  /** Some variable that counts differs from `running`. */
  readonly changed: boolean;
}

/** Resolves the variables of one deployment; nothing here reads or writes the database. */
export function resolveVariables(
  input: ResolveVariablesInput,
): ResolvedVariables {
  const declared = new Map<string, ReleaseVariable>();
  for (const variable of input.manifest?.variables ?? [])
    if (!RESERVED_VARIABLE_NAMES.includes(variable.name))
      declared.set(variable.name, variable);
  const environment = new Map(input.environment.map((v) => [v.name, v]));
  const app = new Map(input.app.map((v) => [v.name, v]));
  const generated = input.generated ?? {};
  const names = new Set<string>([
    ...declared.keys(),
    ...environment.keys(),
    ...[...app.values()].filter((v) => v.value !== null).map((v) => v.name),
    ...Object.keys(generated),
  ]);
  const variables: ResolvedVariable[] = [];
  const env: Record<string, string> = {};
  for (const name of [...names].sort()) {
    if (RESERVED_VARIABLE_NAMES.includes(name)) continue;
    const declaration = declared.get(name) ?? null;
    const own = app.get(name) ?? null;
    const shared = environment.get(name) ?? null;
    let source: VariableSource;
    let value: string | undefined;
    if (own?.value != null) {
      source = own.generated ? 'generated' : 'app';
      value = own.value;
    } else if (shared?.value != null) {
      source = 'environment';
      value = shared.value;
    } else if (
      declaration?.path &&
      hasRealValue(input.configFile, declaration.path)
    ) {
      source = 'configFile';
    } else if (generated[name] !== undefined) {
      source = 'generated';
      value = generated[name];
    } else if (input.generatable?.has(name)) {
      source = 'generated';
    } else if (declaration?.hasDefault) {
      source = 'default';
    } else {
      source = 'unset';
    }
    if (value !== undefined) env[name] = value;
    const firstStartOnly = declaration?.firstStartOnly ?? false;
    const required = declaration?.required ?? false;
    const missing = required && source === 'unset';
    const changed =
      !firstStartOnly &&
      input.running !== undefined &&
      input.running !== null &&
      input.running[name] !== value;
    variables.push({
      name,
      declaration,
      source,
      secret:
        (declaration?.secret ?? false) ||
        Boolean(own?.secret || shared?.secret),
      firstStartOnly,
      required,
      value,
      missing,
      changed,
      app: own,
      environment: shared,
    });
  }
  // A variable the running deployment had and nothing gives any more changed too.
  const removed =
    input.running !== undefined && input.running !== null
      ? Object.keys(input.running).some(
          (name) =>
            !names.has(name) && !(declared.get(name)?.firstStartOnly ?? false),
        )
      : false;
  return {
    env,
    variables,
    missing: variables
      .filter((variable) => variable.missing && variable.declaration)
      .map((variable) => variable.declaration!),
    fingerprint: fingerprintOf(env, input.manifest),
    changed: removed || variables.some((variable) => variable.changed),
  };
}

/** The fingerprint of what a deployment's variables give, leaving out what is read only on the first start. */
export function fingerprintOf(
  env: Readonly<Record<string, string>>,
  manifest: ReleaseVariablesManifest | null,
): string {
  const firstStartOnly = new Set(
    (manifest?.variables ?? [])
      .filter((variable) => variable.firstStartOnly)
      .map((variable) => variable.name),
  );
  const entries = Object.entries(env)
    .filter(([name]) => !firstStartOnly.has(name))
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return createHash('sha256').update(JSON.stringify(entries)).digest('hex');
}

/** How the App variables page shows a resolved variable. */
export function appVariableView(variable: ResolvedVariable): AppVariableView {
  const { secret } = variable;
  return {
    name: variable.name,
    declared: variable.declaration !== null,
    description:
      variable.declaration?.description ??
      variable.environment?.description ??
      null,
    secret,
    required: variable.required,
    firstStartOnly: variable.firstStartOnly,
    generate: variable.declaration?.generate ?? null,
    source: variable.source,
    value: secret ? null : (variable.value ?? null),
    missing: variable.missing,
    changed: variable.changed,
    app: variable.app
      ? {
          ...valueView(variable.app.value, secret),
          generated: variable.app.generated,
        }
      : null,
    environment: variable.environment
      ? valueView(variable.environment.value, secret)
      : null,
  };
}

// --- Configuration file -----------------------------------------------------------------------------------------

/** The value at a dotted path of a parsed configuration. */
export function configValueAt(config: unknown, path: string): unknown {
  let value: unknown = config;
  for (const segment of path.split('.')) {
    if (!isRecord(value)) return undefined;
    value = value[segment];
  }
  return value;
}

/** Whether the configuration holds a value at the path that is not an example's placeholder. */
export function hasRealValue(config: unknown, path: string): boolean {
  const value = configValueAt(config, path);
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return !isExamplePlaceholder(value) && !isPlaceholderText(value);
}

function isPlaceholderText(value: unknown): boolean {
  return typeof value === 'string' && /^replace-with-/u.test(value.trim());
}
