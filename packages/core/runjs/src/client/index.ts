/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  formatRunJSSettingsDotPath,
  getCanonicalRunJSSettings,
  getJsTemplateId,
  getJsTemplateSettingStepKey,
  isSettingsFieldVisible,
  normalizeJsTemplateSelection,
  normalizeJsTemplateSettings,
  normalizeRunJSSettingsSchemaType,
  setJsTemplateTopLevelSetting,
  validateRunJSSettings,
  validateRunJSSettingsValue,
  type RunJSSettingsCondition,
  type RunJSSettingsValidationIssue as SharedRunJSSettingsValidationIssue,
} from '../settings';
import {
  INLINE_RUNJS_SOURCE_MODE,
  type ResolveRunJSSourceBindingInput,
  type ResolvedRuntimeRunJS,
  type RunJSClientHostRegistrationPort,
  type RunJSContributionPort,
  type RunJSEditorRegistryPort,
  type RunJSFlowContextPort,
  type RunJSRegistryHostPort,
  type RunJSRuntimeErrorInfo,
  type RunJSRuntimeHostPort,
  type RunJSSettingsDescriptorProviderInput,
  type RunJSSettingsDescriptorProviderPort,
  type RunJSSettingsDescriptorProviderRegistryPort,
  type RunJSSettingsValidationIssue,
  type RunJSSettingsValidationResult,
  type RunJSSourceResolverContribution,
  type RunJSSourceResolverPort,
  type RunJSSourceResolverRegistryPort,
  type RunJSSourceResolverResult,
  type RunJSSourceSettingsDescriptor,
  type RunJSValue,
  type RuntimeRunJSInput,
} from '../workspace/shared';

export type RunJSSourceResolverErrorCode =
  | 'RUNJS_SOURCE_MODE_REQUIRED'
  | 'RUNJS_SOURCE_RESOLVER_REQUIRED'
  | 'RUNJS_SOURCE_RESOLVER_NOT_FOUND'
  | 'RUNJS_SOURCE_BINDING_REQUIRED'
  | 'RUNJS_SOURCE_CODE_REQUIRED';

export class RunJSSourceResolverError extends Error {
  readonly code: RunJSSourceResolverErrorCode;
  readonly sourceMode?: string;

  constructor(message: string, options: { code: RunJSSourceResolverErrorCode; sourceMode?: string }) {
    super(message);
    this.name = 'RunJSSourceResolverError';
    this.code = options.code;
    this.sourceMode = options.sourceMode;
  }
}

export interface CreateRunJSClientHostsOptions {
  flowContext: Pick<RunJSFlowContextPort, 'createRuntimeContext'>;
}

export interface RunJSClientHosts<
  TEditorProvider extends RunJSContributionPort,
  TSettingsProvider extends RunJSSettingsDescriptorProviderPort,
  TResolver extends RunJSSourceResolverContribution,
> {
  registryHost: RunJSRegistryHostPort<TEditorProvider, TSettingsProvider, TResolver>;
  runtimeHost: RunJSRuntimeHostPort;
}

export function createRunJSClientHosts<
  TEditorProvider extends RunJSContributionPort,
  TSettingsProvider extends RunJSSettingsDescriptorProviderPort,
  TResolver extends RunJSSourceResolverPort,
>(options: CreateRunJSClientHostsOptions): RunJSClientHosts<TEditorProvider, TSettingsProvider, TResolver> {
  const editors = new RunJSContributionRegistry<TEditorProvider>();
  const settingsDescriptors = new RunJSSettingsDescriptorRegistry<TSettingsProvider>();
  const sourceResolvers = new RunJSSourceResolverRegistry<TResolver>();

  const registryHost = {
    editors,
    settingsDescriptors,
    sourceResolvers,
  } satisfies RunJSRegistryHostPort<TEditorProvider, TSettingsProvider, TResolver>;

  const runtimeHost: RunJSRuntimeHostPort = {
    getCanonicalRunJSSettings,
    getJsTemplateId,
    getJsTemplateSettingStepKey,
    isSettingsFieldVisible: (condition, input) =>
      isSettingsFieldVisible(condition as RunJSSettingsCondition | undefined, input),
    normalizeJsTemplateSelection,
    normalizeJsTemplateSettings,
    setJsTemplateTopLevelSetting,
    normalizeSchemaType: normalizeRunJSSettingsSchemaType,
    validateSettingValue(validationOptions) {
      return toClientValidationResult(
        validateRunJSSettingsValue({
          schema: validationOptions.schema,
          value: validationOptions.value,
          required: validationOptions.required,
          mode: validationOptions.mode,
          objectIssueOrder: 'client',
          scalarIssueMode: 'first',
          path: validationOptions.path ? [validationOptions.path] : [],
        }),
      );
    },
    validateSettings(validationOptions) {
      return toClientValidationResult(
        validateRunJSSettings({ ...validationOptions, objectIssueOrder: 'client', scalarIssueMode: 'first' }),
      );
    },
    resolveSourceBinding: (input, registry = sourceResolvers) => resolveRunJSSourceBinding(input, registry),
    resolveRuntime: (input, registry = sourceResolvers) => resolveRuntimeRunJS(input, registry),
    createRuntimeContext: options.flowContext.createRuntimeContext,
    evaluateResolvedValue: (input) => evaluateResolvedRunJSValue(input, options.flowContext),
    evaluateInlineValue: (input) => evaluateInlineRunJSValue(input, options.flowContext),
    getModelUse: getRunJSModelUse,
    readRuntimeError: readRunJSRuntimeError,
  };

  return { registryHost, runtimeHost };
}

export function installRunJSClientHosts<
  TEditorProvider extends RunJSContributionPort,
  TSettingsProvider extends RunJSSettingsDescriptorProviderPort,
  TResolver extends RunJSSourceResolverContribution,
>(
  hosts: RunJSClientHosts<TEditorProvider, TSettingsProvider, TResolver>,
  registration: RunJSClientHostRegistrationPort<typeof hosts.runtimeHost, typeof hosts.registryHost>,
): () => void {
  const disposers: Array<() => void> = [];
  try {
    disposers.push(registration.registerRegistryHost(hosts.registryHost));
    disposers.push(registration.registerRuntimeHost(hosts.runtimeHost));
  } catch (error) {
    disposeInReverseOrder(disposers);
    throw error;
  }
  return () => disposeInReverseOrder(disposers);
}

class RunJSContributionRegistry<TProvider extends RunJSContributionPort> implements RunJSEditorRegistryPort<TProvider> {
  protected readonly providers = new Map<string, TProvider>();

  registerProvider(provider: TProvider): () => void {
    const normalizedProvider = { ...provider, key: provider.key.trim() } as TProvider;
    if (!normalizedProvider.key) {
      throw new TypeError('RunJS contribution requires a key');
    }
    this.providers.set(normalizedProvider.key, normalizedProvider);
    return () => {
      if (this.providers.get(normalizedProvider.key) === normalizedProvider) {
        this.providers.delete(normalizedProvider.key);
      }
    };
  }

  getProviders(): TProvider[] {
    return Array.from(this.providers.values())
      .map((provider, registrationIndex) => ({ provider, registrationIndex }))
      .sort(
        (left, right) =>
          (right.provider.priority ?? 0) - (left.provider.priority ?? 0) ||
          right.registrationIndex - left.registrationIndex,
      )
      .map(({ provider }) => provider);
  }

  clear(): void {
    this.providers.clear();
  }
}

class RunJSSettingsDescriptorRegistry<TProvider extends RunJSSettingsDescriptorProviderPort>
  extends RunJSContributionRegistry<TProvider>
  implements RunJSSettingsDescriptorProviderRegistryPort<TProvider>
{
  override registerProvider(provider: TProvider): () => void {
    if (typeof provider?.getSettingsDescriptor !== 'function') {
      throw new TypeError('RunJS settings descriptor provider requires key and getSettingsDescriptor()');
    }
    return super.registerProvider(provider);
  }

  async getSettingsDescriptor(
    input: RunJSSettingsDescriptorProviderInput,
  ): Promise<RunJSSourceSettingsDescriptor | undefined> {
    for (const provider of this.getProviders()) {
      if (!(provider.canHandle?.(input) ?? true)) {
        continue;
      }
      const descriptor = await provider.getSettingsDescriptor(input);
      if (descriptor) {
        return descriptor;
      }
    }
    return undefined;
  }
}

class RunJSSourceResolverRegistry<TResolver extends RunJSSourceResolverPort>
  implements RunJSSourceResolverRegistryPort<TResolver>
{
  private readonly resolvers = new Map<string, TResolver>();

  registerResolver(resolver: TResolver): () => void {
    const sourceMode = normalizeSourceMode(resolver?.sourceMode, '');
    if (!sourceMode || sourceMode === INLINE_RUNJS_SOURCE_MODE || typeof resolver?.resolve !== 'function') {
      throw new RunJSSourceResolverError('RunJS source resolver requires a non-inline sourceMode and resolve()', {
        code: 'RUNJS_SOURCE_RESOLVER_REQUIRED',
        sourceMode,
      });
    }
    const normalizedResolver = { ...resolver, sourceMode } as TResolver;
    this.resolvers.set(sourceMode, normalizedResolver);
    return () => {
      if (this.resolvers.get(sourceMode) === normalizedResolver) {
        this.resolvers.delete(sourceMode);
      }
    };
  }

  getResolver(sourceMode: unknown): TResolver | null {
    return this.resolvers.get(normalizeSourceMode(sourceMode, '')) || null;
  }

  getResolvers(): TResolver[] {
    return Array.from(this.resolvers.values());
  }

  clear(): void {
    this.resolvers.clear();
  }
}

async function resolveRunJSSourceBinding(
  input: ResolveRunJSSourceBindingInput,
  registry: RunJSSourceResolverRegistryPort,
): Promise<ResolvedRuntimeRunJS> {
  const sourceMode = normalizeSourceMode(input.sourceMode);
  if (sourceMode === INLINE_RUNJS_SOURCE_MODE) {
    throw new RunJSSourceResolverError('Inline RunJS source does not require a source resolver', {
      code: 'RUNJS_SOURCE_MODE_REQUIRED',
      sourceMode,
    });
  }
  if (!isRecord(input.sourceBinding)) {
    throw new RunJSSourceResolverError(`RunJS source '${sourceMode}' requires sourceBinding`, {
      code: 'RUNJS_SOURCE_BINDING_REQUIRED',
      sourceMode,
    });
  }
  const resolver = registry.getResolver(sourceMode);
  if (!resolver) {
    throw new RunJSSourceResolverError(`RunJS source resolver is not registered for sourceMode '${sourceMode}'`, {
      code: 'RUNJS_SOURCE_RESOLVER_NOT_FOUND',
      sourceMode,
    });
  }
  const normalizedInput = {
    ...input,
    sourceMode,
    sourceBinding: input.sourceBinding,
    settings: normalizeSettings(input.settings),
  };
  return normalizeResolverResult(normalizedInput, await resolver.resolve(normalizedInput));
}

async function resolveRuntimeRunJS(
  input: RuntimeRunJSInput,
  registry: RunJSSourceResolverRegistryPort,
): Promise<ResolvedRuntimeRunJS> {
  const runJs = normalizeRunJSValue(input.runJs);
  const effectiveVersion = resolveEffectiveVersion(input.runJs?.code, input.runJs?.version);
  const sourceMode = normalizeSourceMode(input.sourceMode ?? runJs.sourceMode);
  const sourceBinding = input.sourceBinding ?? runJs.sourceBinding;
  const settings = input.settings ?? runJs.settings;
  if (sourceMode !== INLINE_RUNJS_SOURCE_MODE) {
    try {
      return await resolveRunJSSourceBinding({ sourceMode, sourceBinding, settings, context: input.context }, registry);
    } catch (error) {
      if (!runJs.code.trim() || !canUseLastKnownGood(error)) {
        throw error;
      }
      return {
        code: runJs.code,
        version: effectiveVersion,
        sourceMode,
        ...(sourceBinding ? { sourceBinding } : {}),
        settings: normalizeSettings(settings),
        context: input.context,
      };
    }
  }
  return {
    code: runJs.code,
    version: effectiveVersion,
    sourceMode: INLINE_RUNJS_SOURCE_MODE,
    settings: normalizeSettings(settings),
    context: input.context,
  };
}

async function evaluateResolvedRunJSValue(
  input: { ctx: unknown; resolved: ResolvedRuntimeRunJS },
  flowContext: Pick<RunJSFlowContextPort, 'createRuntimeContext'>,
): Promise<unknown> {
  const runtimeContext = flowContext.createRuntimeContext(input.ctx, input.resolved);
  if (!hasRunJSRuntimeExecutor(runtimeContext)) {
    throw new Error('RunJS runtime context does not provide ctx.runjs');
  }
  const result = await runtimeContext.runjs(input.resolved.code, undefined, { version: input.resolved.version });
  if (!result?.success) {
    throw result?.error || new Error('RunJS execution failed');
  }
  return result.value;
}

async function evaluateInlineRunJSValue(
  input: { ctx: unknown; runJs: RunJSValue },
  flowContext: Pick<RunJSFlowContextPort, 'createRuntimeContext'>,
): Promise<unknown> {
  const runJs = normalizeRunJSValue(input.runJs);
  return evaluateResolvedRunJSValue(
    {
      ctx: input.ctx,
      resolved: {
        code: runJs.code,
        version: runJs.version,
        sourceMode: INLINE_RUNJS_SOURCE_MODE,
        settings: runJs.settings || {},
      },
    },
    flowContext,
  );
}

function getRunJSModelUse(model: unknown): string | undefined {
  return (
    getStringProperty(model, 'use') ||
    getStringProperty(getRecordProperty(model, '_options'), 'use') ||
    getStringProperty(getRecordProperty(model, 'options'), 'use') ||
    getStringProperty(getRecordProperty(model, 'createModelOptions'), 'use') ||
    toNonEmptyString((model as { constructor?: { name?: unknown } } | undefined)?.constructor?.name)
  );
}

interface RunJSRuntimeExecutor {
  runjs(
    code: string,
    variables?: Record<string, unknown>,
    options?: { version?: string },
  ): Promise<{ success?: boolean; value?: unknown; error?: unknown } | undefined>;
}

function hasRunJSRuntimeExecutor(value: unknown): value is RunJSRuntimeExecutor {
  return isRecord(value) && typeof value.runjs === 'function';
}

function readRunJSRuntimeError(error: unknown): RunJSRuntimeErrorInfo {
  if (!isRecord(error)) {
    return typeof error === 'string' ? { message: error } : {};
  }
  const response = isRecord(error.response) ? error.response : undefined;
  const serverError = getFirstServerError(response?.data) || getFirstServerError(error);
  const details = isRecord(serverError?.details)
    ? serverError.details
    : isRecord(error.details)
      ? error.details
      : undefined;
  const code = toNonEmptyString(serverError?.code) || toNonEmptyString(error.code);
  const status = serverError
    ? toNumber(serverError.status) ?? toNumber(response?.status) ?? toNumber(error.status)
    : toNumber(error.status) ?? toNumber(response?.status);
  const reasonCode = toNonEmptyString(details?.reasonCode);
  const message = toNonEmptyString(serverError?.message) || toNonEmptyString(error.message);
  const paths = readSettingsPaths(error, details);
  return {
    ...(code ? { code } : {}),
    ...(status !== undefined ? { status } : {}),
    ...(reasonCode ? { reasonCode } : {}),
    ...(message ? { message } : {}),
    ...(details ? { details } : {}),
    ...(paths.length ? { paths } : {}),
  };
}

function normalizeRunJSValue(
  value: RunJSValue | null | undefined,
): Required<Pick<RunJSValue, 'code' | 'version'>> & RunJSValue {
  return {
    code: String(value?.code ?? ''),
    version: String(value?.version ?? 'v1'),
    ...(isRecord(value?.sourceRef) ? { sourceRef: { ...value.sourceRef } } : {}),
    ...(typeof value?.sourceMode === 'string' && value.sourceMode ? { sourceMode: value.sourceMode } : {}),
    ...(isRecord(value?.sourceBinding) ? { sourceBinding: { ...value.sourceBinding } } : {}),
    ...(isRecord(value?.settings) ? { settings: { ...value.settings } } : {}),
  };
}

function normalizeResolverResult(
  input: ResolveRunJSSourceBindingInput,
  result: RunJSSourceResolverResult,
): ResolvedRuntimeRunJS {
  if (typeof result?.code !== 'string') {
    throw new RunJSSourceResolverError(`RunJS source resolver '${input.sourceMode}' must return string code`, {
      code: 'RUNJS_SOURCE_CODE_REQUIRED',
      sourceMode: input.sourceMode,
    });
  }
  return {
    code: result.code,
    version: typeof result.version === 'string' && result.version ? result.version : 'v2',
    sourceMode: input.sourceMode,
    ...(input.sourceBinding ? { sourceBinding: input.sourceBinding } : {}),
    ...(typeof result.sourceMap === 'undefined' ? {} : { sourceMap: result.sourceMap }),
    settings: normalizeSettings(typeof result.settings === 'undefined' ? input.settings : result.settings),
    context: result.context ?? input.context,
  };
}

function toClientValidationResult(
  result: ReturnType<typeof validateRunJSSettingsValue>,
): RunJSSettingsValidationResult {
  return {
    errors: result.issues.map((issue) => ({
      code: toClientIssueCode(issue),
      path: formatRunJSSettingsDotPath(issue.path),
    })),
    missingRequiredPaths: result.missingRequiredPaths.map(formatRunJSSettingsDotPath),
  };
}

function toClientIssueCode(issue: SharedRunJSSettingsValidationIssue): RunJSSettingsValidationIssue['code'] {
  if (issue.code === 'unknownProperty') return 'unknown';
  if (issue.code === 'required' || issue.code === 'type' || issue.code === 'enum') return issue.code;
  return 'constraint';
}

function canUseLastKnownGood(error: unknown): boolean {
  const code = readResolverErrorCode(error);
  if (code === 'RUNJS_SOURCE_RESOLVER_NOT_FOUND' || code === 'JS_TEMPLATE_RUNTIME_UNAVAILABLE') return true;
  if (code && /(DENIED|INVALID|FAILED|CONFLICT|OUTDATED|NOT_FOUND|REQUIRED)$/u.test(code)) return false;
  const status = readResolverErrorStatus(error);
  return status === 404 || status === 502 || status === 503 || status === 504;
}

function readResolverErrorCode(error: unknown): string | undefined {
  if (!isRecord(error)) return undefined;
  if (typeof error.code === 'string') return error.code;
  const response = isRecord(error.response) ? error.response : undefined;
  const data = isRecord(response?.data) ? response.data : isRecord(error.data) ? error.data : undefined;
  const firstError = Array.isArray(data?.errors) ? data.errors[0] : undefined;
  return isRecord(firstError) && typeof firstError.code === 'string' ? firstError.code : undefined;
}

function readResolverErrorStatus(error: unknown): number | undefined {
  if (!isRecord(error)) return undefined;
  if (typeof error.status === 'number') return error.status;
  const response = isRecord(error.response) ? error.response : undefined;
  return typeof response?.status === 'number' ? response.status : undefined;
}

function normalizeSourceMode(sourceMode: unknown, fallback = INLINE_RUNJS_SOURCE_MODE): string {
  return typeof sourceMode === 'string' && sourceMode.trim() ? sourceMode.trim() : fallback;
}

function normalizeSettings(settings: unknown): Record<string, unknown> {
  return isRecord(settings) ? { ...settings } : {};
}

function resolveEffectiveVersion(code: unknown, version: unknown): string {
  if (typeof version === 'string' && version) return version;
  return typeof code === 'string' && code.trim() ? 'v1' : 'v2';
}

function getFirstServerError(value: unknown): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined;
  if (Array.isArray(value.errors) && isRecord(value.errors[0])) return value.errors[0];
  return isRecord(value.error) ? value.error : undefined;
}

function readSettingsPaths(error: Record<string, unknown>, details: Record<string, unknown> | undefined): string[] {
  const paths = [...readStringArray(error.paths), ...readStringArray(details?.paths)];
  if (Array.isArray(details?.issues)) {
    for (const issue of details.issues) {
      const path = isRecord(issue) ? toNonEmptyString(issue.path) : undefined;
      if (path) paths.push(path);
    }
  }
  return Array.from(new Set(paths));
}

function readStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
    : [];
}

function getStringProperty(value: unknown, key: string): string | undefined {
  return isRecord(value) ? toNonEmptyString(value[key]) : undefined;
}

function getRecordProperty(value: unknown, key: string): Record<string, unknown> | undefined {
  if (!isRecord(value)) return undefined;
  const property = value[key];
  return isRecord(property) ? property : undefined;
}

function toNonEmptyString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function disposeInReverseOrder(disposers: Array<() => void>): void {
  while (disposers.length) disposers.pop()?.();
}
