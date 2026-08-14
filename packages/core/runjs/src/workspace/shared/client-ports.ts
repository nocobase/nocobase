/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { RunJSSurfaceStyle } from '../../index';
import type { RunJSAuthoringSurface } from './authoring-surface-contracts';

export const INLINE_RUNJS_SOURCE_MODE = 'inline';

export type RunJSDisposer = () => void;
export type RunJSMaybePromise<T> = T | Promise<T>;
export type RunJSSourceMode = typeof INLINE_RUNJS_SOURCE_MODE | (string & {});
export type RunJSSourceBinding = Record<string, unknown>;
export type RunJSSourceSettings = Record<string, unknown>;
export type RunJSSourceContext = Record<string, unknown>;
export type RunJSSettingsRecord = Record<string, unknown>;
export type RunJSClientSourceLocator =
  | {
      kind: 'flowModel.step';
      modelUid: string;
      flowKey: string;
      stepKey: string;
      paramPath: readonly string[];
      versionPath?: readonly string[];
    }
  | {
      kind: 'flowModel.flowRegistry.runjs';
      modelUid: string;
      flowKey: string;
      stepKey: string;
      sourcePath: readonly string[];
    };

export interface RunJSContributionPort {
  key: string;
  priority?: number;
}

export interface RunJSValue {
  code: string;
  version?: string;
  sourceRef?: Record<string, unknown>;
  sourceMode?: string;
  sourceBinding?: RunJSSourceBinding;
  settings?: RunJSSourceSettings;
}

export interface RunJSWorkspaceApiRequestOptions {
  url: string;
  method?: string;
  data?: unknown;
}

export interface RunJSWorkspaceApiClientPort {
  request<TResponse>(options: RunJSWorkspaceApiRequestOptions): Promise<TResponse>;
}

export interface RuntimeRunJSInput {
  runJs?: RunJSValue | null;
  sourceMode?: RunJSSourceMode | null;
  sourceBinding?: RunJSSourceBinding | null;
  settings?: RunJSSourceSettings | null;
  context?: RunJSSourceContext;
}

export interface ResolveRunJSSourceBindingInput {
  sourceMode: RunJSSourceMode;
  sourceBinding?: RunJSSourceBinding | null;
  settings?: RunJSSourceSettings | null;
  context?: RunJSSourceContext;
}

export interface RunJSSourceResolverInput extends ResolveRunJSSourceBindingInput {
  sourceMode: string;
}

export interface RunJSSourceResolverResult {
  code: string;
  version?: string;
  sourceMap?: unknown;
  settings?: RunJSSourceSettings | null;
  context?: RunJSSourceContext;
}

export interface ResolvedRuntimeRunJS {
  code: string;
  version: string;
  sourceMode: string;
  sourceBinding?: RunJSSourceBinding;
  sourceMap?: unknown;
  settings: RunJSSourceSettings;
  context?: RunJSSourceContext;
}

export interface RunJSSourceSettingsDescriptor {
  entryId: string;
  settingsSchemaHash: string | null;
  schema?: Record<string, unknown> | null;
  defaults?: Record<string, unknown>;
}

export interface RunJSSourceMenuItem<TParams extends Record<string, unknown> = Record<string, unknown>> {
  key: string;
  label: string;
  children?: RunJSSourceMenuItem<TParams>[];
  disabled?: boolean;
  searchText?: string;
  selected?: boolean;
  onSelect?: (input: RunJSSourceMenuSelectInput<TParams>) => RunJSMaybePromise<TParams | void>;
}

export interface RunJSSourceMenuInput extends RuntimeRunJSInput {
  kind?: string;
  t?: (key: string, options?: Record<string, unknown>) => string;
}

export interface RunJSSourceMenuSelectInput<TParams extends Record<string, unknown> = Record<string, unknown>>
  extends RunJSSourceMenuInput {
  params: TParams;
  defaultParams: TParams;
}

export interface RunJSSourceResolverPort<TParams extends Record<string, unknown> = Record<string, unknown>> {
  sourceMode: RunJSSourceMode;
  resolve(input: RunJSSourceResolverInput): RunJSMaybePromise<RunJSSourceResolverResult>;
  getBindingTitle?(input: RunJSSourceResolverInput): RunJSMaybePromise<string | undefined>;
  getSettingsDescriptor?(input: RunJSSourceResolverInput): RunJSMaybePromise<RunJSSourceSettingsDescriptor | undefined>;
  listSourceMenuItems?(input: RunJSSourceMenuInput): RunJSMaybePromise<RunJSSourceMenuItem<TParams>[]>;
}

export interface RunJSSourceResolverContribution {
  sourceMode: RunJSSourceMode;
}

export interface RunJSSourceResolverRegistryPort<
  TResolver extends RunJSSourceResolverContribution = RunJSSourceResolverPort,
> {
  registerResolver(resolver: TResolver): RunJSDisposer;
  getResolver(sourceMode: unknown): TResolver | null;
  getResolvers(): TResolver[];
  clear(): void;
}

export interface RunJSSettingsDescriptorProviderInput {
  sourceMode: string;
  sourceBinding?: RunJSSourceBinding | null;
  sourceRef?: Record<string, unknown> | null;
  settings?: RunJSSourceSettings | null;
  runJs?: RunJSValue | null;
  locator?: RunJSClientSourceLocator;
  context?: RunJSSourceContext;
}

export interface RunJSSettingsDescriptorProviderPort {
  key: string;
  priority?: number;
  canHandle?(input: RunJSSettingsDescriptorProviderInput): boolean;
  getSettingsDescriptor(
    input: RunJSSettingsDescriptorProviderInput,
  ): RunJSMaybePromise<RunJSSourceSettingsDescriptor | undefined>;
}

export interface RunJSSettingsDescriptorProviderRegistryPort<
  TProvider extends RunJSContributionPort = RunJSSettingsDescriptorProviderPort,
> {
  registerProvider(provider: TProvider): RunJSDisposer;
  getProviders(): TProvider[];
  getSettingsDescriptor(
    input: RunJSSettingsDescriptorProviderInput,
  ): Promise<RunJSSourceSettingsDescriptor | undefined>;
  clear(): void;
}

export interface RunJSEditorProviderPort<TProps = unknown, TRendered = unknown> {
  key: string;
  priority?: number;
  canHandle?(props: TProps): boolean;
  renderEditor(props: TProps): TRendered;
}

export interface RunJSEditorRegistryPort<TProvider extends RunJSContributionPort = RunJSEditorProviderPort> {
  registerProvider(provider: TProvider): RunJSDisposer;
  getProviders(): TProvider[];
  clear(): void;
}

export interface LegacyRunJSEditorRegistryPort<
  TProps = unknown,
  TProvider extends RunJSContributionPort = RunJSEditorProviderPort<TProps>,
> extends RunJSEditorRegistryPort<TProvider> {
  getProvider(props: TProps): TProvider | null;
}

export interface RunJSRegistryHostPort<
  TEditorProvider extends RunJSContributionPort = RunJSEditorProviderPort,
  TSettingsProvider extends RunJSContributionPort = RunJSSettingsDescriptorProviderPort,
  TResolver extends RunJSSourceResolverContribution = RunJSSourceResolverPort,
> {
  editors: RunJSEditorRegistryPort<TEditorProvider>;
  settingsDescriptors: RunJSSettingsDescriptorProviderRegistryPort<TSettingsProvider>;
  sourceResolvers: RunJSSourceResolverRegistryPort<TResolver>;
}

export interface RunJSSettingsDescriptorLike {
  entryId: string;
  settingsSchemaHash: string | null;
  schema?: RunJSSettingsRecord | null;
  defaults?: RunJSSettingsRecord;
}

export interface NormalizeJsTemplateSelectionInput {
  currentBinding?: unknown;
  currentSettings?: unknown;
  submittedSettings?: unknown;
  nextBinding: unknown;
  descriptor: RunJSSettingsDescriptorLike;
}

export type RunJSSettingsValidationMode = 'binding' | 'runtime';

export interface RunJSSettingsValidationIssue {
  code: 'required' | 'type' | 'enum' | 'constraint' | 'unknown';
  path: string;
}

export interface RunJSSettingsValidationResult {
  errors: RunJSSettingsValidationIssue[];
  missingRequiredPaths: string[];
}

export interface RunJSRuntimeErrorInfo {
  code?: string;
  status?: number;
  reasonCode?: string;
  message?: string;
  details?: Record<string, unknown>;
  paths?: string[];
}

export interface RunJSFlowContextPort {
  createRuntimeContext(baseContext: unknown, resolved: ResolvedRuntimeRunJS): unknown;
  evaluateResolvedValue(input: { ctx: unknown; resolved: ResolvedRuntimeRunJS }): Promise<unknown>;
  evaluateInlineValue(input: { ctx: unknown; runJs: RunJSValue }): Promise<unknown>;
}

export interface RunJSRuntimeHostPort extends RunJSFlowContextPort {
  getCanonicalRunJSSettings(runJs: unknown): RunJSSettingsRecord;
  getJsTemplateId(binding: unknown): string | undefined;
  getJsTemplateSettingStepKey(entryId: string, propertyPath: string): string;
  isSettingsFieldVisible(
    condition: unknown,
    input: { defaults?: RunJSSettingsRecord; settings?: RunJSSettingsRecord },
  ): boolean;
  normalizeJsTemplateSelection(input: NormalizeJsTemplateSelectionInput): RunJSSettingsRecord;
  normalizeJsTemplateSettings(
    descriptor: Pick<RunJSSettingsDescriptorLike, 'schema' | 'defaults'>,
    settings: unknown,
  ): RunJSSettingsRecord;
  setJsTemplateTopLevelSetting(settings: unknown, propertyName: string, value: unknown): RunJSSettingsRecord;
  normalizeSchemaType(schema: RunJSSettingsRecord): string | undefined;
  validateSettingValue(options: {
    schema: RunJSSettingsRecord;
    value: unknown;
    required: boolean;
    mode: RunJSSettingsValidationMode;
    path?: string;
  }): RunJSSettingsValidationResult;
  validateSettings(options: {
    schema: RunJSSettingsRecord;
    settings: unknown;
    mode: RunJSSettingsValidationMode;
  }): RunJSSettingsValidationResult;
  resolveSourceBinding(
    input: ResolveRunJSSourceBindingInput,
    registry?: RunJSSourceResolverRegistryPort,
  ): Promise<ResolvedRuntimeRunJS>;
  resolveRuntime(input: RuntimeRunJSInput, registry?: RunJSSourceResolverRegistryPort): Promise<ResolvedRuntimeRunJS>;
  getModelUse(model: unknown): string | undefined;
  readRuntimeError(error: unknown): RunJSRuntimeErrorInfo;
}

export interface RunJSClientHostRegistrationPort<
  TRuntimeHost = RunJSRuntimeHostPort,
  TRegistryHost = RunJSRegistryHostPort,
> {
  registerRuntimeHost(host: TRuntimeHost): RunJSDisposer;
  registerRegistryHost(host: TRegistryHost): RunJSDisposer;
}

export interface RunJSAuthoringSurfaceRegistryPort<TSurface extends RunJSAuthoringSurface = RunJSAuthoringSurface> {
  register(surface: TSurface): RunJSDisposer;
}

export interface RunJSClientLifecyclePort<TRuntimeContext = void, TAuthoringContext = unknown> {
  installRuntime(context: TRuntimeContext): RunJSDisposer;
  installAuthoring(context: TAuthoringContext): RunJSDisposer;
}

export interface RunJSStudioContext {
  locator: RunJSClientSourceLocator;
  value: RunJSValue;
  surfaceStyle?: RunJSSurfaceStyle;
  readOnly?: boolean;
  disabled?: boolean;
  sourceMetadata?: Record<string, unknown>;
}
