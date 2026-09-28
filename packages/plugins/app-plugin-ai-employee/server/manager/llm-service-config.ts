import type {
  EnabledModelsConfig,
  LLMServiceManager,
  LLMServiceOptions,
} from '@nocobase/ai-employee';
import { normalizeEnabledModelsConfig } from '@nocobase/ai-employee';
import type { Logger } from '@nocobase/logging';

import type {
  AIApplicationConfig,
  AIEmployeeLLMServiceConfig,
} from '../config.js';

/** `ai.llmServices`: each configured service, keyed by its name. */
export type LLMServiceConfigMap = AIApplicationConfig['llmServices'];

const DEFAULT_MODEL_OPTIONS: Readonly<Record<string, unknown>> = {
  temperature: 1,
  topP: 1,
  frequencyPenalty: 0,
  presencePenalty: 0,
};

export interface LLMServiceSyncSummary {
  readonly configured: number;
  readonly created: number;
  readonly updated: number;
  readonly deleted: number;
}

/**
 * A configured service plus the one decision the manager does not take: whether
 * `config.yml` reapplies its model list over what an administrator curated.
 */
export type NormalizedLLMServiceConfig = LLMServiceOptions & {
  readonly overrideEnabledModels?: boolean;
};

export class LLMServiceConfigSynchronizer {
  private queue: Promise<unknown> = Promise.resolve();

  public constructor(
    private readonly manager: LLMServiceManager,
    private readonly logger?: Logger,
  ) {}

  public enqueue(
    services: LLMServiceConfigMap | undefined,
  ): Promise<LLMServiceSyncSummary> {
    const operation = this.queue.then(() => this.synchronize(services));
    this.queue = operation.catch(() => undefined);
    return operation;
  }

  public async synchronize(
    services: LLMServiceConfigMap | undefined,
  ): Promise<LLMServiceSyncSummary> {
    const normalized = normalizeLLMServiceConfig(services);
    const existing = await this.manager.listLLMServices();
    const existingByName = new Map(
      existing.map((service) => [service.name, service]),
    );
    const configuredNames = new Set(normalized.map((service) => service.name));
    let created = 0;
    let updated = 0;

    for (const { overrideEnabledModels, ...service } of normalized) {
      const current = existingByName.get(service.name);
      const configuredService = current
        ? {
            ...service,
            title: service.title ?? service.name,
            options: service.options ?? {},
            modelOptions: service.modelOptions ?? DEFAULT_MODEL_OPTIONS,
            sort: service.sort ?? 0,
            // Reapplying the model list must not also reset the enable switch,
            // which is a separate administrator decision.
            ...(overrideEnabledModels === true
              ? { enabled: current.enabled }
              : {}),
          }
        : service;
      await this.manager.registerLLMService(configuredService, {
        preserveUserState: overrideEnabledModels !== true,
      });
      if (current) updated += 1;
      else created += 1;
    }

    let deleted = 0;
    for (const service of existing) {
      if (configuredNames.has(service.name)) continue;
      await this.manager.deleteLLMService(service.name);
      deleted += 1;
    }

    const summary: LLMServiceSyncSummary = {
      configured: normalized.length,
      created,
      updated,
      deleted,
    };
    this.logger?.[created || updated || deleted ? 'info' : 'debug']?.(
      summary,
      'AI LLM services synchronized from application config',
    );
    return summary;
  }
}

/** A problem in `ai.llmServices`, with its path relative to the `ai` section. */
export interface LLMServiceConfigIssue {
  readonly path: string;
  readonly message: string;
}

/**
 * The built-in providers that send `options.apiKey` with every request. `ollama` needs none, and a provider an App
 * registers is left alone, since only it knows what its options require.
 */
const PROVIDERS_REQUIRING_API_KEY: ReadonlySet<string> = new Set([
  'anthropic',
  'dashscope',
  'deepseek',
  'google-genai',
  'kimi',
  'mimo',
  'mistral',
  'openai',
  'openai-completions',
  'orcarouter',
  'shengsuanyun',
  'xai',
]);

export function normalizeLLMServiceConfig(
  services: LLMServiceConfigMap | undefined,
): NormalizedLLMServiceConfig[] {
  const [issue] = findLLMServiceConfigIssues(services);
  if (issue) throw new Error(`Invalid ai.${issue.path}: ${issue.message}`);

  return Object.entries(services ?? {}).map(([name, service]) => ({
    ...service,
    name,
    enabledModels: normalizeConfiguredEnabledModels(service.enabledModels),
  }));
}

/** Every structural problem in `ai.llmServices`, each of which stops the plugin from starting. */
export function findLLMServiceConfigIssues(
  services: unknown,
): LLMServiceConfigIssue[] {
  const values = services ?? {};
  if (Array.isArray(values)) {
    return [
      {
        path: 'llmServices',
        message:
          'expected a map keyed by service name, such as `openai: { provider: openai }`. The list form is no longer read; move each entry under its name and drop the `name` field.',
      },
    ];
  }
  if (!isRecord(values)) {
    return [
      {
        path: 'llmServices',
        message: 'expected a map keyed by service name.',
      },
    ];
  }
  const issues: LLMServiceConfigIssue[] = [];
  for (const [name, service] of Object.entries(values)) {
    collectServiceIssues(service, name, issues);
  }
  return issues;
}

/**
 * The names of services whose built-in provider needs `options.apiKey` and has none. Such a service starts, but every
 * model list and chat it serves fails at the provider.
 */
export function findLLMServicesMissingApiKey(
  services: LLMServiceConfigMap | undefined,
): string[] {
  return Object.entries(services ?? {})
    .filter(([, service]) => {
      if (!PROVIDERS_REQUIRING_API_KEY.has(service.provider)) return false;
      const apiKey = service.options?.apiKey;
      return (
        apiKey === undefined ||
        apiKey === null ||
        (typeof apiKey === 'string' && apiKey.trim().length === 0)
      );
    })
    .map(([name]) => name);
}

function normalizeConfiguredEnabledModels(
  value: AIEmployeeLLMServiceConfig['enabledModels'],
): EnabledModelsConfig | undefined {
  if (value === undefined) return undefined;
  return normalizeEnabledModelsConfig({ mode: 'custom', models: [...value] });
}

function collectServiceIssues(
  value: unknown,
  name: string,
  issues: LLMServiceConfigIssue[],
): void {
  const path = `llmServices.${name}`;
  const add = (field: string, message: string): void => {
    issues.push({ path: field ? `${path}.${field}` : path, message });
  };
  if (name.trim().length === 0) {
    issues.push({
      path: 'llmServices',
      message: 'a service name must not be empty.',
    });
    return;
  }
  if (!isRecord(value)) {
    add('', 'expected an object.');
    return;
  }
  if (value.name !== undefined) {
    add(
      'name',
      'the service name is its key in ai.llmServices; remove this field.',
    );
  }
  if (typeof value.provider !== 'string' || value.provider.trim() === '') {
    add('provider', 'expected a non-empty string.');
  }
  if (value.title !== undefined && typeof value.title !== 'string') {
    add('title', 'expected a string.');
  }
  if (value.options !== undefined && !isRecord(value.options)) {
    add('options', 'expected an object.');
  }
  if (!isEnabledModels(value.enabledModels)) {
    add('enabledModels', 'expected label/value entries.');
  }
  if (value.modelOptions !== undefined && !isRecord(value.modelOptions)) {
    add('modelOptions', 'expected an object.');
  }
  if (value.enabled !== undefined && typeof value.enabled !== 'boolean') {
    add('enabled', 'expected a boolean.');
  }
  if (value.sort !== undefined && typeof value.sort !== 'number') {
    add('sort', 'expected a number.');
  }
  if (
    value.overrideEnabledModels !== undefined &&
    typeof value.overrideEnabledModels !== 'boolean'
  ) {
    add('overrideEnabledModels', 'expected a boolean.');
  }
}

function isEnabledModels(value: unknown): boolean {
  if (value === undefined) return true;
  return (
    Array.isArray(value) &&
    value.every(
      (model) =>
        isRecord(model) &&
        typeof model.label === 'string' &&
        typeof model.value === 'string',
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
