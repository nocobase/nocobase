/**
 * Environments: where Apps are deployed. Each names a registered driver with its connection settings, write-only
 * credentials (encrypted, never returned), a public URL rule, protection and approval settings and a limit of Apps.
 */
import { randomUUID } from 'node:crypto';

import type { DatabaseManager, Row } from '@nocobase/db';

import type {
  DriverSummary,
  EnvironmentCheckInput,
  EnvironmentCheckResult,
  EnvironmentInput,
  EnvironmentRecord,
  EnvironmentVariableView,
  SetEnvironmentVariableInput,
} from '../../shared/releases.js';
import { AccessGuard, type Caller } from '../access/caller.js';
import {
  capabilitiesFor,
  type DeploymentDriver,
  type DriverEnvironment,
  type DriverRegistry,
} from '../drivers/types.js';
import { ReleasesError, notFound } from '../errors.js';
import {
  decodeDate,
  decodeRecord,
  decodeStringArray,
  isRecord,
  nullableNumber,
  nullableString,
} from './codec.js';
import { decryptText, encryptText, type ReleasesSecrets } from './secrets.js';
import {
  assertVariableName,
  assertVariableValue,
  environmentVariableView,
  isSecretName,
  type VariableStore,
} from './variables.js';
import {
  assertEnvironmentId,
  normalizeName,
  normalizeRuntimePolicy,
  positiveInteger,
} from './validation.js';

/** How long trying unsaved settings may take before it is reported as failed. */
const DRAFT_CHECK_TIMEOUT_MS = 20_000;

export interface EnvironmentServiceOptions {
  readonly database: DatabaseManager;
  readonly drivers: DriverRegistry;
  readonly guard: AccessGuard;
  /** The application's secrets service, which seals the credentials. */
  readonly secrets?: ReleasesSecrets;
  /** Called after an environment changed or was removed, so open driver sessions are replaced. */
  readonly onChanged: (environmentId: string) => Promise<void>;
  /** How many Apps an environment holds, to refuse removing one in use. */
  readonly countApps: (environmentId: string) => Promise<number>;
  /** The open session's check, for `check`. */
  readonly check: (
    environmentId: string,
  ) => Promise<{ ok: boolean; message?: string; details?: unknown }>;
  /** Where the environments' variables are kept. */
  readonly variables: VariableStore;
}

export class EnvironmentService {
  public constructor(private readonly options: EnvironmentServiceOptions) {}

  /** Anyone who may see environment settings, create Apps or open the Apps page may list environments. */
  public async list(caller: Caller): Promise<readonly EnvironmentRecord[]> {
    this.requireReader(caller);
    const rows = await this.query()
      .selectFrom('relEnvironments')
      .selectAll()
      .orderBy('name', 'asc')
      .orderBy('id', 'asc')
      .execute<Row>();
    return rows.map((row) => this.decode(row));
  }

  public async get(caller: Caller, id: string): Promise<EnvironmentRecord> {
    this.requireReader(caller);
    return await this.record(id);
  }

  public drivers(caller: Caller): readonly DriverSummary[] {
    this.requireReader(caller);
    return this.options.drivers.list().map(summarizeDriver);
  }

  public async create(
    caller: Caller,
    input: EnvironmentInput,
  ): Promise<EnvironmentRecord> {
    this.options.guard.requireSetting(caller, 'rel.environments', 'manage');
    if (typeof input?.id !== 'string')
      throw new ReleasesError(
        'An environment ID is required.',
        'INVALID_ENVIRONMENT_ID',
        'INVALID_ARGUMENT',
      );
    const id = input.id.trim();
    assertEnvironmentId(id);
    if (await this.find(id))
      throw new ReleasesError(
        'An environment with this ID already exists.',
        'ENVIRONMENT_EXISTS',
        'ALREADY_EXISTS',
      );
    const driver = this.requireDriver(input.driver);
    const config = normalizeObject(input.config, 'INVALID_ENVIRONMENT_CONFIG');
    const secret = mergeSecret(null, input);
    await validateDriver(driver, config, secret);
    const now = new Date();
    const settings = normalizeSettings(input, undefined);
    await this.assertRegistry(settings.registryId);
    await this.query()
      .insertInto('relEnvironments')
      .values({
        id,
        name: normalizeName(input.name, 'INVALID_ENVIRONMENT_NAME'),
        driver: driver.kind,
        config: JSON.stringify(config),
        secret: secret ? this.encrypt(id, secret) : null,
        ...settings,
        approvers: JSON.stringify(settings.approvers),
        createdAt: now,
        updatedAt: now,
      })
      .execute();
    return await this.record(id);
  }

  public async update(
    caller: Caller,
    id: string,
    input: EnvironmentInput,
  ): Promise<EnvironmentRecord> {
    this.options.guard.requireSetting(caller, 'rel.environments', 'manage');
    const row = await this.findRow(id);
    if (!row) throw notFound('Environment', 'ENVIRONMENT_NOT_FOUND', id);
    const current = this.decode(row);
    if (input.driver !== undefined && input.driver !== current.driver)
      throw new ReleasesError(
        'An environment keeps its driver; create another environment instead.',
        'ENVIRONMENT_DRIVER_FIXED',
        'FAILED_PRECONDITION',
      );
    const driver = this.requireDriver(current.driver);
    const config =
      input.config === undefined
        ? current.config
        : normalizeObject(input.config, 'INVALID_ENVIRONMENT_CONFIG');
    // Its Apps run where the variant (the Host driver's run mode) put them, so it stays too.
    const variantKey = driver.variants?.key;
    if (variantKey && config[variantKey] !== current.config[variantKey])
      throw new ReleasesError(
        'An environment keeps its run mode; create another environment instead.',
        'ENVIRONMENT_VARIANT_FIXED',
        'FAILED_PRECONDITION',
      );
    const secretChanged =
      input.secret !== undefined || input.secretChanges !== undefined;
    const secret = secretChanged
      ? mergeSecret(
          input.secret === undefined ? this.decryptRow(row) : null,
          input,
        )
      : this.decryptRow(row);
    await validateDriver(driver, config, secret);
    const settings = normalizeSettings(input, current);
    await this.assertRegistry(settings.registryId);
    await this.query()
      .updateTable('relEnvironments')
      .set({
        ...(input.name === undefined
          ? {}
          : { name: normalizeName(input.name, 'INVALID_ENVIRONMENT_NAME') }),
        config: JSON.stringify(config),
        ...(secretChanged
          ? { secret: secret ? this.encrypt(id, secret) : null }
          : {}),
        ...settings,
        approvers: JSON.stringify(settings.approvers),
        updatedAt: new Date(),
      })
      .where('id', '=', id)
      .execute();
    await this.options.onChanged(id);
    return await this.record(id);
  }

  public async remove(caller: Caller, id: string): Promise<void> {
    this.options.guard.requireSetting(caller, 'rel.environments', 'manage');
    await this.record(id);
    if ((await this.options.countApps(id)) > 0)
      throw new ReleasesError(
        'Remove the environment’s applications first.',
        'ENVIRONMENT_IN_USE',
        'FAILED_PRECONDITION',
      );
    await this.query()
      .deleteFrom('relEnvironments')
      .where('id', '=', id)
      .execute();
    await this.options.variables.removeEnvironment(id);
    await this.options.onChanged(id);
  }

  // --- Variables ----------------------------------------------------------------------------------------------

  /** The environment's variables; a secret's value never leaves the server. */
  public async listVariables(
    caller: Caller,
    id: string,
  ): Promise<readonly EnvironmentVariableView[]> {
    this.options.guard.requireSetting(caller, 'rel.environments', 'read');
    await this.record(id);
    return (await this.options.variables.environmentVariables(id)).map(
      environmentVariableView,
    );
  }

  /** Sets one variable every App of the environment gets, unless the App sets its own. */
  public async setVariable(
    caller: Caller,
    id: string,
    name: string,
    input: SetEnvironmentVariableInput,
  ): Promise<EnvironmentVariableView> {
    this.options.guard.requireSetting(caller, 'rel.environments', 'manage');
    await this.record(id);
    assertVariableName(name);
    assertVariableValue(input?.value);
    const description =
      input.description === undefined || input.description === null
        ? input.description
        : input.description.trim().slice(0, 1000) || null;
    await this.options.variables.setEnvironmentVariable(id, name, {
      value: input.value,
      secret: input.secret ?? isSecretName(name),
      ...(description === undefined ? {} : { description }),
      by: caller.userId,
    });
    const stored = (await this.options.variables.environmentVariables(id)).find(
      (variable) => variable.name === name,
    )!;
    return environmentVariableView(stored);
  }

  public async unsetVariable(
    caller: Caller,
    id: string,
    name: string,
  ): Promise<void> {
    this.options.guard.requireSetting(caller, 'rel.environments', 'manage');
    await this.record(id);
    if (!(await this.options.variables.unsetEnvironmentVariable(id, name)))
      throw notFound('Variable', 'VARIABLE_NOT_FOUND', name);
  }

  public async check(
    caller: Caller,
    id: string,
  ): Promise<{ ok: boolean; message?: string; details?: unknown }> {
    this.options.guard.requireSetting(caller, 'rel.environments', 'read');
    await this.record(id);
    try {
      return await this.options.check(id);
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Tries settings before they are saved: the driver validates them, a session is opened on a throwaway environment
   * ID (so it never replaces a running environment's session), checked and closed. Editing an environment, the
   * credentials not changed are its stored ones.
   */
  public async checkDraft(
    caller: Caller,
    input: EnvironmentCheckInput,
  ): Promise<EnvironmentCheckResult> {
    this.options.guard.requireSetting(caller, 'rel.environments', 'manage');
    const existing =
      typeof input?.id === 'string' && input.id.trim()
        ? await this.findRow(input.id.trim())
        : undefined;
    const driver = this.requireDriver(
      existing ? String(existing.driver) : input?.driver,
    );
    const config = normalizeObject(input.config, 'INVALID_ENVIRONMENT_CONFIG');
    const secret = mergeSecret(
      existing ? this.decryptRow(existing) : null,
      input,
    );
    await validateDriver(driver, config, secret);
    const publicUrl =
      input.publicUrl === undefined
        ? existing
          ? nullableString(existing.publicUrl)
          : null
        : normalizePublicUrl(input.publicUrl);
    let session: Awaited<ReturnType<DeploymentDriver['open']>> | undefined;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const check = (async () => {
        session = await driver.open(
          {
            id: `check-${randomUUID().slice(0, 8)}`,
            name: typeof input.name === 'string' ? input.name : '',
            config,
            secret,
            publicUrl,
          },
          { desired: () => Promise.resolve([]) },
        );
        return await session.check();
      })();
      const timeout = new Promise<EnvironmentCheckResult>((resolve) => {
        timer = setTimeout(
          () =>
            resolve({
              ok: false,
              message: `The check did not finish within ${DRAFT_CHECK_TIMEOUT_MS / 1000} seconds.`,
            }),
          DRAFT_CHECK_TIMEOUT_MS,
        );
      });
      const result = await Promise.race([check, timeout]);
      // A check that lost the race still closes its session when it ends.
      void check
        .finally(() => session?.close().catch(() => undefined))
        .catch(() => undefined);
      return {
        ok: result.ok,
        ...(result.message
          ? { message: result.message }
          : result.ok
            ? {}
            : { message: 'The target is not ready yet.' }),
        ...(result.details === undefined ? {} : { details: result.details }),
      };
    } catch (error) {
      await session?.close().catch(() => undefined);
      return {
        ok: false,
        message: error instanceof Error ? error.message : String(error),
      };
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  /** The environment record, without access checks: for the other services. */
  public async record(id: string): Promise<EnvironmentRecord> {
    const row = await this.findRow(id);
    if (!row) throw notFound('Environment', 'ENVIRONMENT_NOT_FOUND', id);
    return this.decode(row);
  }

  public async find(id: string): Promise<EnvironmentRecord | null> {
    const row = await this.findRow(id);
    return row ? this.decode(row) : null;
  }

  /** Whether the environment runs release images (the Docker run mode) rather than archives. */
  public runsImages(environment: EnvironmentRecord): boolean {
    const driver = this.options.drivers.get(environment.driver);
    return driver
      ? capabilitiesFor(driver, environment.config).images === true
      : false;
  }

  /** What a driver session is opened with: settings and decrypted credentials. */
  public async driverEnvironment(id: string): Promise<{
    readonly environment: EnvironmentRecord;
    readonly driver: DeploymentDriver;
    readonly target: DriverEnvironment;
  }> {
    const row = await this.findRow(id);
    if (!row) throw notFound('Environment', 'ENVIRONMENT_NOT_FOUND', id);
    const environment = this.decode(row);
    const driver = this.options.drivers.get(environment.driver);
    if (!driver)
      throw new ReleasesError(
        `The deployment driver "${environment.driver}" is not available in this application.`,
        'DRIVER_UNAVAILABLE',
        'UNAVAILABLE',
      );
    return {
      environment,
      driver,
      target: {
        id: environment.id,
        name: environment.name,
        config: environment.config,
        secret: this.decryptRow(row),
        publicUrl: environment.publicUrl,
      },
    };
  }

  private async assertRegistry(id: string | null): Promise<void> {
    if (id === null) return;
    const row = await this.query()
      .selectFrom('relRegistries')
      .select('id')
      .where('id', '=', id)
      .executeTakeFirst<Row>();
    if (!row)
      throw new ReleasesError(
        `There is no registry ${id}.`,
        'UNKNOWN_REGISTRY',
        'INVALID_ARGUMENT',
        {
          fieldViolations: [
            { field: 'registryId', description: `There is no registry ${id}.` },
          ],
        },
      );
  }

  /** Anyone who may see environment settings, create Apps or open the Apps page reads environments and drivers. */
  public requireReader(caller: Caller): void {
    const { guard } = this.options;
    if (
      guard.hasSetting(caller, 'rel.environments', 'read') ||
      guard.hasPage(caller, 'rel-apps') ||
      guard.scope(caller, 'create') === 'all'
    )
      return;
    guard.requireSetting(caller, 'rel.environments', 'read');
  }

  private requireDriver(kind: unknown): DeploymentDriver {
    const driver =
      typeof kind === 'string' ? this.options.drivers.get(kind) : undefined;
    if (!driver)
      throw new ReleasesError(
        'Choose a deployment driver this application offers.',
        'INVALID_DRIVER',
        'INVALID_ARGUMENT',
      );
    return driver;
  }

  private encrypt(id: string, secret: Record<string, unknown>): string {
    return encryptText(
      JSON.stringify(secret),
      [id],
      this.options.secrets,
      'environment-credentials',
    );
  }

  /** The record with the names of its stored credentials; credentials that no longer decrypt name none. */
  private decode(row: Row): EnvironmentRecord {
    let secretKeys: readonly string[];
    try {
      secretKeys = Object.keys(this.decryptRow(row) ?? {}).sort();
    } catch {
      secretKeys = [];
    }
    const environment = decodeEnvironment(row, secretKeys);
    const driver = this.options.drivers.get(environment.driver);
    if (!driver) return environment;
    const found = capabilitiesFor(driver, environment.config);
    const images = found.images === true;
    return {
      ...environment,
      capabilities: {
        archives: !images,
        images,
        onDemand: found.onDemand === true,
      },
    };
  }

  private decryptRow(row: Row): Record<string, unknown> | null {
    const value = nullableString(row.secret);
    if (!value) return null;
    const plain = decryptText(
      value,
      [String(row.id)],
      this.options.secrets,
      'environment-credentials',
    );
    const parsed = JSON.parse(plain) as unknown;
    return isRecord(parsed) ? parsed : null;
  }

  private async findRow(id: string): Promise<Row | undefined> {
    return await this.query()
      .selectFrom('relEnvironments')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst<Row>();
  }

  private query() {
    return this.options.database.connection().query;
  }
}

export function decodeEnvironment(
  row: Row,
  secretKeys: readonly string[] = [],
): EnvironmentRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    driver: String(row.driver),
    config: decodeRecord(row.config),
    hasSecret: row.secret != null,
    secretKeys,
    publicUrl: nullableString(row.publicUrl),
    protected: Boolean(row.protected),
    approvers: decodeStringArray(row.approvers),
    maxApps: nullableNumber(row.maxApps),
    defaultIdleStopMinutes: nullableNumber(row.defaultIdleStopMinutes),
    defaultDormantAfterHours: nullableNumber(row.defaultDormantAfterHours),
    registryId: nullableString(row.registryId),
    // Filled in from the driver by the service; nothing without one.
    capabilities: { archives: false, images: false, onDemand: false },
    sampleDataOnFirstDeploy: Boolean(row.sampleDataOnFirstDeploy),
    createdAt: decodeDate(row.createdAt).toISOString(),
    updatedAt: decodeDate(row.updatedAt).toISOString(),
  };
}

function summarizeDriver(driver: DeploymentDriver): DriverSummary {
  return {
    kind: driver.kind,
    title: driver.title,
    configSchema: driver.configSchema,
    secretSchema: driver.secretSchema ?? null,
    capabilities: capabilitiesView(driver.capabilities),
    variants: driver.variants
      ? {
          key: driver.variants.key,
          capabilities: Object.fromEntries(
            Object.entries(driver.variants.capabilities).map(
              ([value, capabilities]) => [
                value,
                capabilitiesView(capabilities),
              ],
            ),
          ),
        }
      : null,
    facts: driver.facts ?? null,
  };
}

function capabilitiesView(
  capabilities: DeploymentDriver['capabilities'],
): DriverSummary['capabilities'] {
  return {
    ...capabilities,
    onDemand: capabilities.onDemand === true,
    images: capabilities.images === true,
  };
}

/**
 * The credentials after an input: `secret` replaces them (`null` clears), then `secretChanges` replaces the keys it
 * names and removes the ones set to null. An empty result is no credentials.
 */
function mergeSecret(
  current: Record<string, unknown> | null,
  input: Pick<EnvironmentInput, 'secret' | 'secretChanges'>,
): Record<string, unknown> | null {
  let secret: Record<string, unknown> | null =
    input.secret === undefined
      ? current
      : input.secret === null
        ? null
        : normalizeObject(input.secret, 'INVALID_ENVIRONMENT_SECRET');
  if (input.secretChanges !== undefined) {
    const changes = normalizeObject(
      input.secretChanges,
      'INVALID_ENVIRONMENT_SECRET',
    );
    const next: Record<string, unknown> = { ...secret };
    for (const [key, value] of Object.entries(changes))
      if (value === null) delete next[key];
      else next[key] = value;
    secret = next;
  }
  if (secret && Object.keys(secret).length === 0) return null;
  return secret;
}

async function validateDriver(
  driver: DeploymentDriver,
  config: Record<string, unknown>,
  secret: Record<string, unknown> | null,
): Promise<void> {
  try {
    await driver.validate?.(config, secret);
  } catch (error) {
    throw new ReleasesError(
      error instanceof Error ? error.message : String(error),
      'INVALID_ENVIRONMENT_CONFIG',
      'INVALID_ARGUMENT',
    );
  }
}

function normalizeObject(
  value: unknown,
  code: string,
): Record<string, unknown> {
  if (value === undefined) return {};
  if (!isRecord(value))
    throw new ReleasesError('Expected an object.', code, 'INVALID_ARGUMENT');
  if (JSON.stringify(value).length > 64 * 1024)
    throw new ReleasesError(
      'Settings may be at most 64 KiB.',
      code,
      'INVALID_ARGUMENT',
    );
  return value;
}

function normalizeSettings(
  input: EnvironmentInput,
  current: EnvironmentRecord | undefined,
): {
  publicUrl: string | null;
  protected: boolean;
  approvers: readonly string[];
  maxApps: number | null;
  defaultIdleStopMinutes: number | null;
  defaultDormantAfterHours: number | null;
  registryId: string | null;
  sampleDataOnFirstDeploy: boolean;
} {
  const publicUrl =
    input.publicUrl === undefined
      ? (current?.publicUrl ?? null)
      : normalizePublicUrl(input.publicUrl);
  const approvers =
    input.approvers === undefined
      ? (current?.approvers ?? [])
      : normalizeApprovers(input.approvers);
  return {
    publicUrl,
    protected: optionalBoolean(input.protected, current?.protected ?? false),
    approvers,
    maxApps: optionalLimit(input.maxApps, current?.maxApps ?? null),
    ...appDefaults(input, current),
    registryId: optionalRegistryId(
      input.registryId,
      current?.registryId ?? null,
    ),
    sampleDataOnFirstDeploy: optionalBoolean(
      input.sampleDataOnFirstDeploy,
      current?.sampleDataOnFirstDeploy ?? false,
    ),
  };
}

/** The runtime policy Apps created in the environment take, validated as an App's own. */
function appDefaults(
  input: EnvironmentInput,
  current: EnvironmentRecord | undefined,
): {
  defaultIdleStopMinutes: number | null;
  defaultDormantAfterHours: number | null;
} {
  const policy = normalizeRuntimePolicy(
    {
      idleStopMinutes: input.defaultIdleStopMinutes,
      dormantAfterHours: input.defaultDormantAfterHours,
    },
    {
      activation: 'eager',
      idleStopMinutes: current?.defaultIdleStopMinutes ?? null,
      dormantAfterHours: current?.defaultDormantAfterHours ?? null,
    },
  );
  return {
    defaultIdleStopMinutes: policy.idleStopMinutes,
    defaultDormantAfterHours: policy.dormantAfterHours,
  };
}

function optionalRegistryId(
  value: unknown,
  fallback: string | null,
): string | null {
  if (value === undefined) return fallback;
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || value.length > 64)
    throw new ReleasesError(
      'registryId names a registry.',
      'INVALID_ENVIRONMENT_SETTINGS',
      'INVALID_ARGUMENT',
    );
  return value;
}

function optionalBoolean(value: unknown, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (typeof value !== 'boolean')
    throw new ReleasesError(
      'Expected true or false.',
      'INVALID_ENVIRONMENT_SETTINGS',
      'INVALID_ARGUMENT',
    );
  return value;
}

function optionalLimit(value: unknown, fallback: number | null): number | null {
  if (value === undefined) return fallback;
  if (value === null) return null;
  return positiveInteger(value, 'INVALID_ENVIRONMENT_LIMIT', 100_000);
}

function normalizePublicUrl(value: unknown): string | null {
  if (value === null || value === '') return null;
  if (
    typeof value !== 'string' ||
    value.length > 1024 ||
    !value.includes('{appId}') ||
    !/^(https?:\/\/[^\s]+|\/[^\s]*)$/.test(value)
  )
    throw new ReleasesError(
      'The public URL must be an http(s) URL or an absolute path containing {appId}.',
      'INVALID_PUBLIC_URL',
      'INVALID_ARGUMENT',
    );
  return value;
}

function normalizeApprovers(value: unknown): readonly string[] {
  if (
    !Array.isArray(value) ||
    value.length > 100 ||
    value.some(
      (item) => typeof item !== 'string' || !item.trim() || item.length > 128,
    )
  )
    throw new ReleasesError(
      'Approvers must be a list of at most 100 references.',
      'INVALID_APPROVERS',
      'INVALID_ARGUMENT',
    );
  return [...new Set((value as string[]).map((item) => item.trim()))];
}
