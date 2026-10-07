import type {
  EnabledModelsConfig,
  LLMServiceOptions,
  MCPOptions,
} from '@nocobase/ai-employee';
import { CronExpressionParser } from 'cron-parser';
import {
  defineAppConfig,
  type AppConfigDefinition,
  type AppConfigFactory,
  type ConfigValidator,
} from '@nocobase/app-server/config';

import {
  findLLMServiceConfigIssues,
  findLLMServicesMissingApiKey,
} from './manager/llm-service-config.js';
import {
  findReservedMCPServerNames,
  reservedMCPServerNameMessage,
} from './route/reserved-names.js';

export interface AIStorageConfig {
  readonly disk?: readonly string[];
}

export interface AIKnowledgeBaseVectorDatabaseConnectionConfig {
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly password?: string;
  readonly database: string;
  readonly tableName: string;
}

/**
 * `key` is the unique identifier of a vector database entry within one
 * configuration, and is what synchronization matches an existing record by.
 * `name` is an optional display title and falls back to `key` when omitted,
 * so two entries may share the same name.
 */
export interface AIKnowledgeBaseVectorDatabaseConfig {
  readonly key: string;
  readonly name?: string;
  readonly provider?: string;
  readonly databaseSpec?: string;
  readonly connection: AIKnowledgeBaseVectorDatabaseConnectionConfig;
  readonly enabled?: boolean;
}

export interface AIKnowledgeBaseManifestConfig {
  readonly disk: string;
  readonly locations: readonly string[];
}

export interface AIKnowledgeBaseConfig {
  readonly storage?: AIStorageConfig;
  readonly vectorDatabases?: readonly AIKnowledgeBaseVectorDatabaseConfig[];
  readonly manifests?: readonly AIKnowledgeBaseManifestConfig[];
}

export interface AIEmployeeEnabledModelConfig {
  readonly label: string;
  readonly value: string;
}

export interface AISkillsConfig {
  readonly paths?: readonly string[];
}
/**
 * One entry of `ai.llmServices`. The service's name is its key in that map, so
 * an entry carries no `name` of its own.
 */
export type AIEmployeeLLMServiceConfig = Omit<
  LLMServiceOptions,
  'name' | 'enabledModels'
> & {
  readonly enabledModels?: readonly AIEmployeeEnabledModelConfig[];
  /**
   * Whether this service's `enabledModels` is reapplied on every configuration
   * load. Off by default, because the model list is normally curated in AI
   * settings and a reload must not discard that. Turn it on to keep the list in
   * `config.yml` instead, and expect edits made in the UI to be overwritten.
   */
  readonly overrideEnabledModels?: boolean;
};

/**
 * `ai.checkpointCleanup`: a recurring job that releases the checkpoints of
 * conversations nobody has used for `retentionDays`. Their messages stay, and
 * the next run of such a conversation rebuilds its context from them.
 */
export interface AICheckpointCleanupConfig {
  /** Whether the job is scheduled. Defaults to `true`. */
  readonly enabled?: boolean;
  /** When the job runs, five or six cron fields. Defaults to `0 3 * * *`. */
  readonly cron?: string;
  /** The time zone `cron` is read in. Defaults to `UTC`. */
  readonly tz?: string;
  /** Days a conversation stays unused before it is released. Defaults to `7`. */
  readonly retentionDays?: number;
  /** Conversations examined, and released, per transaction. Defaults to `100`. */
  readonly batchSize?: number;
  /** The `jobs` configuration the job runs on. Defaults to `jobs.default`. */
  readonly jobs?: string;
}

export interface ResolvedAICheckpointCleanupConfig {
  readonly enabled: boolean;
  readonly cron: string;
  readonly tz: string;
  readonly retentionDays: number;
  readonly batchSize: number;
  readonly jobs?: string;
}

export const DEFAULT_AI_CHECKPOINT_CLEANUP: ResolvedAICheckpointCleanupConfig =
  {
    enabled: true,
    cron: '0 3 * * *',
    tz: 'UTC',
    retentionDays: 7,
    batchSize: 100,
  };

/**
 * `ai.checkpointCleanup` with its defaults applied. Throws on a section that
 * `config check` reports as an error, since no job could be scheduled from it.
 */
export function resolveCheckpointCleanupConfig(
  config: AIApplicationConfig,
): ResolvedAICheckpointCleanupConfig {
  const issues = findCheckpointCleanupConfigIssues(config.checkpointCleanup);
  if (issues.length > 0) {
    throw new Error(
      `Invalid AI checkpoint cleanup configuration: ${issues
        .map((issue) => `ai.${issue.path} ${issue.message}`)
        .join(' ')}`,
    );
  }
  const configured = config.checkpointCleanup ?? {};
  const defaults = DEFAULT_AI_CHECKPOINT_CLEANUP;
  return {
    enabled: configured.enabled ?? defaults.enabled,
    cron: configured.cron?.trim() || defaults.cron,
    tz: configured.tz?.trim() || defaults.tz,
    retentionDays: configured.retentionDays ?? defaults.retentionDays,
    batchSize: configured.batchSize ?? defaults.batchSize,
    ...(configured.jobs === undefined ? {} : { jobs: configured.jobs }),
  };
}

interface ConfigIssue {
  readonly path: string;
  readonly message: string;
}

function findCheckpointCleanupConfigIssues(value: unknown): ConfigIssue[] {
  if (value === undefined) return [];
  if (value === null || typeof value !== 'object' || Array.isArray(value))
    return [{ path: 'checkpointCleanup', message: 'must be an object.' }];
  const config = value as Record<string, unknown>;
  const issues: ConfigIssue[] = [];
  const issue = (field: string, message: string): void => {
    issues.push({ path: `checkpointCleanup.${field}`, message });
  };
  for (const field of ['cron', 'tz', 'jobs']) {
    const fieldValue = config[field];
    if (
      fieldValue !== undefined &&
      (typeof fieldValue !== 'string' || !fieldValue.trim())
    )
      issue(field, 'must be a non-empty string.');
  }
  if (config.enabled !== undefined && typeof config.enabled !== 'boolean')
    issue('enabled', 'must be true or false.');
  const retentionDays = config.retentionDays;
  if (
    retentionDays !== undefined &&
    (typeof retentionDays !== 'number' ||
      !Number.isFinite(retentionDays) ||
      retentionDays <= 0)
  )
    issue('retentionDays', 'must be a number of days greater than 0.');
  const batchSize = config.batchSize;
  if (
    batchSize !== undefined &&
    (typeof batchSize !== 'number' ||
      !Number.isInteger(batchSize) ||
      batchSize <= 0)
  )
    issue('batchSize', 'must be an integer greater than 0.');
  if (issues.some((item) => /\.(cron|tz)$/.test(item.path))) return issues;
  const cron =
    typeof config.cron === 'string'
      ? config.cron.trim()
      : DEFAULT_AI_CHECKPOINT_CLEANUP.cron;
  const fields = cron.split(/\s+/).length;
  if (fields !== 5 && fields !== 6) {
    issue('cron', 'must contain five or six fields.');
    return issues;
  }
  try {
    CronExpressionParser.parse(cron, {
      currentDate: new Date('2020-01-01T00:00:00.000Z'),
      tz:
        typeof config.tz === 'string'
          ? config.tz.trim()
          : DEFAULT_AI_CHECKPOINT_CLEANUP.tz,
    });
  } catch {
    issue(
      config.cron === undefined ? 'tz' : 'cron',
      config.cron === undefined
        ? 'is not a valid time zone.'
        : 'is not a valid cron expression in the configured time zone.',
    );
  }
  return issues;
}

export interface AIApplicationConfig {
  readonly storage?: AIStorageConfig;
  readonly aiEmployee?: {
    readonly storage?: AIStorageConfig;
  };
  readonly skills?: AISkillsConfig;
  readonly mcpServers?: Readonly<Record<string, MCPOptions>>;
  readonly aiKnowledgeBase?: AIKnowledgeBaseConfig;
  readonly llmServices: Readonly<Record<string, AIEmployeeLLMServiceConfig>>;
  readonly checkpointCleanup?: AICheckpointCleanupConfig;
  readonly [key: string]: unknown;
}

export type AIEmployeeConfig = AIApplicationConfig;

/**
 * The rules this plugin holds the `ai` section to. A structural problem in `ai.llmServices`, an MCP server named
 * like a fixed route segment, or an invalid `ai.checkpointCleanup`, is an error, since the plugin refuses to start on it; a service whose provider needs a
 * key and has none is a warning, since the application starts and only that service fails.
 */
export const validateAIConfig: ConfigValidator<AIApplicationConfig> = (
  ai,
  context,
) => {
  // A server named like a fixed segment beside `/api/aiEmployee/mcpServers/{name}` could never be addressed.
  for (const name of findReservedMCPServerNames(ai.mcpServers))
    context.error(`mcpServers.${name}`, reservedMCPServerNameMessage(name));
  // No cleanup job can be scheduled from an invalid section, so the plugin refuses to start on it.
  for (const issue of findCheckpointCleanupConfigIssues(ai.checkpointCleanup))
    context.error(issue.path, issue.message);
  const issues = findLLMServiceConfigIssues(ai.llmServices);
  for (const issue of issues) context.error(issue.path, issue.message);
  if (issues.length > 0) return;
  for (const name of findLLMServicesMissingApiKey(ai.llmServices)) {
    const path = `llmServices.${name}.options.apiKey`;
    context.warning(
      path,
      'is not set, so every model list and chat of this service fails at its provider.',
      {
        fix: `Set it with pnpm nocobase config set --from-env ai.${path}=<VARIABLE>, or map a variable onto it in env of server/config/ai.ts.`,
      },
    );
  }
};

/**
 * Declares the `ai` section with this plugin's validation, in place of `defineAppConfig`.
 *
 * An application that keeps a plain `defineAppConfig` still starts, but `config check` cannot report a malformed or
 * keyless service before it fails. A `validate` given here runs after the plugin's own.
 */
export function defineAIConfig(
  definition: AppConfigDefinition<AIApplicationConfig>,
): AppConfigFactory<AIApplicationConfig> {
  const extra =
    definition.validate === undefined
      ? []
      : Array.isArray(definition.validate)
        ? (definition.validate as readonly ConfigValidator<AIApplicationConfig>[])
        : [definition.validate as ConfigValidator<AIApplicationConfig>];
  return defineAppConfig<AIApplicationConfig>({
    ...definition,
    validate: [validateAIConfig, ...extra],
  });
}
export type AIEmployeeEnabledModelsConfig = EnabledModelsConfig;

export function normalizeDisks(
  disks: readonly string[] | undefined,
): readonly string[] {
  if (!disks) return [];
  return [...new Set(disks.map((disk) => disk.trim()).filter(Boolean))];
}

export function resolveAIEmployeeStorageDisk(
  config: AIApplicationConfig,
  defaultDisk: string,
): string {
  const employee = normalizeDisks(config.aiEmployee?.storage?.disk);
  const configured =
    employee.length > 0 ? employee : normalizeDisks(config.storage?.disk);
  return configured[0] ?? defaultDisk;
}

export function resolveAIKnowledgeBaseStorageDisks(
  config: AIApplicationConfig,
  defaultDisk: string,
): readonly string[] {
  const knowledgeBase = normalizeDisks(config.aiKnowledgeBase?.storage?.disk);
  if (knowledgeBase.length > 0) return knowledgeBase;
  const shared = normalizeDisks(config.storage?.disk);
  return shared.length > 0 ? shared : [defaultDisk];
}
