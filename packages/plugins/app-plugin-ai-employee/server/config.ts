import type {
  EnabledModelsConfig,
  LLMServiceOptions,
  MCPOptions,
} from '@nocobase/ai-employee';
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

export interface AIApplicationConfig {
  readonly storage?: AIStorageConfig;
  readonly aiEmployee?: {
    readonly storage?: AIStorageConfig;
  };
  readonly skills?: AISkillsConfig;
  readonly mcpServers?: Readonly<Record<string, MCPOptions>>;
  readonly aiKnowledgeBase?: AIKnowledgeBaseConfig;
  readonly llmServices: Readonly<Record<string, AIEmployeeLLMServiceConfig>>;
  readonly [key: string]: unknown;
}

export type AIEmployeeConfig = AIApplicationConfig;

/**
 * The rules this plugin holds the `ai` section to. A structural problem in `ai.llmServices`, or an MCP server named
 * like a fixed route segment, is an error, since the plugin refuses to start on it; a service whose provider needs a
 * key and has none is a warning, since the application starts and only that service fails.
 */
export const validateAIConfig: ConfigValidator<AIApplicationConfig> = (
  ai,
  context,
) => {
  // A server named like a fixed segment beside `/api/aiEmployee/mcpServers/{name}` could never be addressed.
  for (const name of findReservedMCPServerNames(ai.mcpServers))
    context.error(`mcpServers.${name}`, reservedMCPServerNameMessage(name));
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
