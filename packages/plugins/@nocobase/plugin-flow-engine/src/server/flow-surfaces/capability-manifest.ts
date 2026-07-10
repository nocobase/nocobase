/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { resolveFlowSurfaceCapabilityReadiness } from './capability-readiness';
import type {
  FlowSurfaceCapabilitiesProvider,
  FlowSurfaceAvailabilityState,
  FlowSurfaceCapabilityAvailability,
  FlowSurfaceCapabilityConfidence,
  FlowSurfaceCapabilityIdentity,
  FlowSurfaceCapabilityKind,
  FlowSurfaceCapabilityManifestItem,
  FlowSurfaceCapabilityOriginSource,
  FlowSurfaceCapabilitySemantic,
  FlowSurfaceCapabilityWarning,
  FlowSurfaceConfigureOptions,
  FlowSurfaceCatalogItem,
  FlowSurfaceJsonCreateRecipe,
  FlowSurfaceJsonSchema,
  FlowSurfacePublicCapabilityItem,
  FlowSurfacePublicTypeMeta,
  FlowSurfaceReasonCode,
  FlowSurfaceSupportLevel,
} from './types';

// Provider catalog projection is block-only in this first read-only slice. Action and field providers need
// target-scoped placement/filtering before they can be safely exposed through catalog/capabilities.
const PROVIDER_CAPABILITY_KINDS = new Set<FlowSurfaceCapabilityKind>(['block']);
const FLOW_SURFACE_SUPPORT_LEVELS = new Set<FlowSurfaceSupportLevel>([
  'render-only',
  'readback-only',
  'create-only',
  'create-with-settings',
  'configure-only',
  'create-and-configure',
]);
const FLOW_SURFACE_CAPABILITY_CONFIDENCES = new Set<FlowSurfaceCapabilityConfidence>(['high', 'medium', 'low']);
const AVAILABILITY_REASON_CODES = new Set<FlowSurfaceReasonCode>([
  'supported',
  'plugin-disabled',
  'public-type-conflict',
  'target-required',
  'slot-not-supported',
  'scene-not-supported',
  'collection-required',
  'field-interface-required',
  'missing-create-contract',
  'dynamic-create-options-not-projectable',
  'unsafe-auto-discovery',
  'manifest-required',
  'permission-denied',
  'license-required',
  'dependency-missing',
  'provider-error',
  'settings-schema-missing',
  'init-param-required',
  'readback-unsupported',
  'dry-run-failed',
  'readback-parity-failed',
  'snapshot-stale',
  'extractor-runtime-error',
  'contract-not-verified',
  'debug-expand-forbidden',
  'unsupported',
]);
const AVAILABILITY_REASON_SOURCES = new Set<NonNullable<FlowSurfaceAvailabilityState['reasonSource']>>([
  'registry',
  'provider',
  'catalog',
  'builder',
]);
const BLOCKING_WRITE_REASON_CODES = new Set<FlowSurfaceReasonCode>([
  'plugin-disabled',
  'public-type-conflict',
  'provider-error',
  'dry-run-failed',
  'readback-parity-failed',
  'snapshot-stale',
  'extractor-runtime-error',
  'contract-not-verified',
  'unsafe-auto-discovery',
  'permission-denied',
  'license-required',
  'dependency-missing',
]);
const INTERNAL_PUBLIC_PAYLOAD_KEYS = new Set([
  'capabilityId',
  'modelUse',
  'use',
  'props',
  'decoratorProps',
  'stepParams',
  'flowRegistry',
  'resourceInit',
  'resourceSettings',
  'tableSettings',
  'cardSettings',
  'buttonSettings',
  'formModelSettings',
  'eventSettings',
  'pageSettings',
  'pageTabSettings',
  'ganttSettings',
  'formSettings',
  'detailsSettings',
  'calendarSettings',
  'treeSettings',
  'kanbanSettings',
  'listSettings',
  'gridCardSettings',
  'markdownBlockSettings',
  'iframeBlockSettings',
  'chartSettings',
  'commentsSettings',
  'recordHistorySettings',
  'tableColumnSettings',
  'createModelOptions',
  'subModels',
  'defaultNode',
  'nodeTemplate',
  'lens',
  'implementation',
]);

export type NormalizedFlowSurfaceProviderCapability = {
  publicItem: FlowSurfacePublicCapabilityItem;
  catalogItem: FlowSurfaceCatalogItem;
  implementation: FlowSurfaceCapabilityManifestItem['implementation'];
  createRecipe?: FlowSurfaceJsonCreateRecipe;
};

type FlowSurfaceSemanticExample = NonNullable<FlowSurfaceCapabilitySemantic['examples']>[number];

export function normalizeFlowSurfaceCapabilityManifestItem(input: {
  item: unknown;
  ownerPlugin: string;
  source: FlowSurfaceCapabilityOriginSource;
  provider?: FlowSurfaceCapabilitiesProvider;
}): NormalizedFlowSurfaceProviderCapability | null {
  if (!isPlainRecord(input.item)) {
    return null;
  }
  const item = input.item as unknown as FlowSurfaceCapabilityManifestItem;
  const implementation = isPlainRecord(input.item.implementation)
    ? (input.item.implementation as unknown as FlowSurfaceCapabilityManifestItem['implementation'])
    : undefined;
  const id = normalizeRequiredString(input.item.id);
  const ownerPlugin = normalizeRequiredString(input.ownerPlugin);
  const kind = input.item.kind;
  const modelUse = normalizeRequiredString(implementation?.modelUse);
  if (!id || !ownerPlugin || !modelUse || !PROVIDER_CAPABILITY_KINDS.has(kind as FlowSurfaceCapabilityKind)) {
    return null;
  }
  const capabilityKind = kind as FlowSurfaceCapabilityKind;

  const warnings = normalizeCapabilityWarnings(input.item.warnings);
  const declaredPublicType = normalizePublicType(input.item.publicType);
  const publicType = declaredPublicType || buildNamespacedPublicType(ownerPlugin, id);
  const label = sanitizePublicText(input.item.label, 'label', warnings) || publicType;
  const semantic = sanitizeSemantic(input.item.semantic, warnings, label);
  const declaredAliases = sanitizePublicAliasList(toUnknownArray(input.item.acceptedAliases), warnings);
  const acceptedAliases = declaredAliases.filter((alias) => !isPluginQualifiedPublicTypeAlias(alias));
  const searchAliases = sanitizePublicAliasList([...declaredAliases, id, publicType], warnings);
  const initParamsSchema = sanitizePublicSchema(input.item.initParamsSchema, 'init params schema', warnings);
  const settingsSchema = sanitizePublicSchema(input.item.settingsSchema, 'settings schema', warnings);
  const configureOptions = sanitizePublicConfigureOptions(input.item.configureOptions, warnings);
  const placement = sanitizePlacement(input.item.placement, warnings);
  const replacedBy = sanitizeReplacedBy(input.item.replacedBy, warnings);
  const publicWarnings = sanitizeWarnings(warnings);
  const identity = buildCapabilityIdentity({
    ownerPlugin,
    id,
    capabilityVersion: normalizeOptionalString(input.item.capabilityVersion),
    kind: capabilityKind,
    publicType,
    deprecated: input.item.deprecated === true,
    replacedBy,
  });
  const availability = normalizeAvailability(
    item,
    !!(input.provider as ({ resolveCreate?: unknown } & FlowSurfaceCapabilitiesProvider) | undefined)?.resolveCreate,
    {
      settingsSchema,
      configureOptions,
    },
  );
  const supportLevel = normalizeSupportLevel(input.item.supportLevel) || resolveSupportLevel(availability);
  const publicTypeMeta: FlowSurfacePublicTypeMeta = {
    value: publicType,
    source: declaredPublicType ? (input.source === 'canaryOverlay' ? 'canary' : 'manifest') : 'autoNamespaced',
    searchAliases,
    ...(acceptedAliases.length ? { acceptedAliases } : {}),
  };
  const publicItem: FlowSurfacePublicCapabilityItem = {
    kind: capabilityKind,
    publicType,
    publicTypeMeta,
    label,
    ownerPlugin,
    origin: input.source,
    semantic,
    availability,
    supportLevel,
    confidence: normalizeCapabilityConfidence(input.item.confidence),
    readiness: resolveFlowSurfaceCapabilityReadiness({
      origin: input.source,
      availability,
      warnings: publicWarnings,
    }),
    ...(placement ? { placement } : {}),
    ...(publicWarnings.length ? { warnings: publicWarnings } : {}),
    identity,
    ...(initParamsSchema ? { initParamsSchema } : {}),
    ...(settingsSchema ? { settingsSchema } : {}),
    ...(configureOptions ? { configureOptions } : {}),
  };
  const catalogItem: FlowSurfaceCatalogItem = {
    key: publicType,
    label,
    use: modelUse,
    kind: toCatalogKind(capabilityKind),
    publicType,
    ...(acceptedAliases.length ? { acceptedAliases } : {}),
    semantic,
    ownerPlugin,
    origin: input.source,
    supportLevel,
    confidence: publicItem.confidence,
    ...(placement ? { placement } : {}),
    availability,
    createSupported: availability.create.supported,
    ...(initParamsSchema ? { requiredInitParams: getJsonSchemaRequired(initParamsSchema) } : {}),
    ...(settingsSchema ? { settingsSchema } : {}),
    ...(configureOptions ? { configureOptions } : {}),
    ...(publicWarnings.length ? { warnings: publicWarnings } : {}),
    identity,
  };
  return {
    publicItem,
    catalogItem,
    implementation,
    ...(isPlainRecord(input.item.createRecipe)
      ? { createRecipe: input.item.createRecipe as unknown as FlowSurfaceJsonCreateRecipe }
      : {}),
  };
}

function normalizeRequiredString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalString(value: unknown) {
  const normalized = normalizeRequiredString(value);
  return normalized || undefined;
}

function normalizePublicType(value: unknown) {
  const normalized = normalizeRequiredString(value).replace(/^@nocobase\/plugin-/, 'plugin-');
  return isUnsafePublicToken(normalized) ? '' : normalized;
}

function buildNamespacedPublicType(ownerPlugin: string, id: string) {
  const owner = ownerPlugin
    .replace(/^@nocobase\/plugin-/, 'plugin-')
    .replace(/^@/, '')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part, index) => toPublicTypePart(part, index))
    .join('');
  const capability = id
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part, index) => toPublicTypePart(part, index))
    .join('');
  const publicType = [owner || 'plugin', capability || 'capability'].join('.');
  return isUnsafePublicToken(publicType) ? `${owner || 'plugin'}.capability` : publicType;
}

function toPublicTypePart(part: string, index: number) {
  const safePart = part.replace(/Model$/i, '');
  return index === 0 ? _.camelCase(safePart) : _.upperFirst(_.camelCase(safePart));
}

function sanitizePublicAliasList(values: unknown[], warnings: FlowSurfaceCapabilityWarning[]) {
  const aliases: string[] = [];
  values.forEach((value) => {
    const normalized = normalizeRequiredString(value);
    if (!normalized) {
      return;
    }
    if (isUnsafePublicToken(normalized)) {
      addWarningOnce(warnings, {
        code: 'unsafe-semantic-text',
        message: 'Capability alias was dropped because it contained internal implementation tokens.',
      });
      return;
    }
    aliases.push(normalized);
  });
  return Array.from(new Set(aliases));
}

function isPluginQualifiedPublicTypeAlias(value: string) {
  return /^@[^:\s]+\/plugin-[^:\s]+:[^:\s]+$/.test(value);
}

function sanitizePublicStringList(values: unknown[], label: string, warnings: FlowSurfaceCapabilityWarning[]) {
  return Array.from(
    new Set(
      values.map((value) => sanitizePublicText(value, label, warnings)).filter((value): value is string => !!value),
    ),
  );
}

function sanitizePublicText(value: unknown, label: string, warnings: FlowSurfaceCapabilityWarning[]) {
  const normalized = normalizeRequiredString(value);
  if (!normalized) {
    return '';
  }
  if (isUnsafePublicToken(normalized)) {
    addWarningOnce(warnings, {
      code: 'unsafe-semantic-text',
      message: `Capability ${label} was dropped because it contained internal implementation tokens.`,
    });
    return '';
  }
  return normalized;
}

function sanitizeSemantic(
  input: unknown,
  warnings: FlowSurfaceCapabilityWarning[],
  fallbackTitle: string,
): FlowSurfaceCapabilitySemantic {
  const semantic = isPlainRecord(input) ? input : { title: fallbackTitle };
  const { aliases: rawAliases, examples: rawExamples } = semantic;
  const aliases = sanitizePublicAliasList(toUnknownArray(rawAliases), warnings);
  const title = sanitizePublicText(semantic.title, 'semantic title', warnings) || fallbackTitle;
  const description = sanitizePublicText(semantic.description, 'semantic description', warnings);
  const domainTags = sanitizePublicStringList(toUnknownArray(semantic.domainTags), 'semantic domain tag', warnings);
  const intentTags = sanitizePublicStringList(toUnknownArray(semantic.intentTags), 'semantic intent tag', warnings);
  const suitableScenes = sanitizePublicStringList(
    toUnknownArray(semantic.suitableScenes),
    'semantic suitable scene',
    warnings,
  );
  const antiPatterns = sanitizePublicStringList(
    toUnknownArray(semantic.antiPatterns),
    'semantic anti-pattern',
    warnings,
  );
  const locale = sanitizePublicText(semantic.locale, 'semantic locale', warnings);
  const examples = toUnknownArray(rawExamples).filter((example): example is FlowSurfaceSemanticExample => {
    if (!isFlowSurfaceSemanticExample(example)) {
      return false;
    }
    const unsafe = containsUnsafePublicFragment(example);
    if (unsafe) {
      addWarningOnce(warnings, {
        code: 'unsafe-semantic-text',
        message: 'Capability semantic example was dropped because it contained internal payload keys.',
      });
      return false;
    }
    return true;
  });
  return {
    title,
    ...(description ? { description } : {}),
    ...(aliases.length ? { aliases } : {}),
    ...(domainTags.length ? { domainTags } : {}),
    ...(intentTags.length ? { intentTags } : {}),
    ...(suitableScenes.length ? { suitableScenes } : {}),
    ...(antiPatterns.length ? { antiPatterns } : {}),
    ...(locale ? { locale } : {}),
    ...(examples.length ? { examples } : {}),
  };
}

function sanitizePlacement(
  placement: unknown,
  warnings: FlowSurfaceCapabilityWarning[],
): FlowSurfaceCapabilityManifestItem['placement'] | undefined {
  if (!isPlainRecord(placement)) {
    return undefined;
  }
  const scenes = sanitizePublicStringList(toUnknownArray(placement.scenes), 'placement scene', warnings);
  const slots = sanitizePublicStringList(toUnknownArray(placement.slots), 'placement slot', warnings);
  const parentPublicTypes = sanitizePublicStringList(
    toUnknownArray(placement.parentPublicTypes),
    'placement parent type',
    warnings,
  );
  const containerKinds = sanitizePublicStringList(
    toUnknownArray(placement.containerKinds),
    'placement container kind',
    warnings,
  );
  const sanitized: FlowSurfaceCapabilityManifestItem['placement'] = {
    ...(scenes.length
      ? { scenes: scenes as NonNullable<FlowSurfaceCapabilityManifestItem['placement']>['scenes'] }
      : {}),
    ...(slots.length ? { slots: slots as NonNullable<FlowSurfaceCapabilityManifestItem['placement']>['slots'] } : {}),
    ...(parentPublicTypes.length ? { parentPublicTypes } : {}),
    ...(containerKinds.length ? { containerKinds } : {}),
    ...(typeof placement.collectionRequired === 'boolean' ? { collectionRequired: placement.collectionRequired } : {}),
    ...(typeof placement.fieldRequired === 'boolean' ? { fieldRequired: placement.fieldRequired } : {}),
  };
  return Object.keys(sanitized).length ? sanitized : undefined;
}

function sanitizeReplacedBy(
  replacedBy: unknown,
  warnings: FlowSurfaceCapabilityWarning[],
): FlowSurfaceCapabilityManifestItem['replacedBy'] | undefined {
  if (!isPlainRecord(replacedBy)) {
    return undefined;
  }
  const publicType = normalizePublicType(replacedBy.publicType);
  const ownerPlugin = sanitizePublicText(replacedBy.ownerPlugin, 'replacement owner plugin', warnings);
  const kind = replacedBy.kind as FlowSurfaceCapabilityKind;
  if (!publicType || !PROVIDER_CAPABILITY_KINDS.has(kind)) {
    addWarningOnce(warnings, {
      code: 'unsafe-semantic-text',
      message: 'Capability replacement metadata was dropped because it contained internal implementation tokens.',
    });
    return undefined;
  }
  return {
    kind,
    publicType,
    ...(ownerPlugin ? { ownerPlugin } : {}),
  };
}

function sanitizeWarnings(warnings: FlowSurfaceCapabilityWarning[]) {
  return warnings
    .map((warning) => ({
      code: warning.code,
      message: sanitizeWarningMessage(warning.message),
    }))
    .filter((warning) => !!warning.message);
}

function sanitizeWarningMessage(message: string) {
  return isUnsafePublicToken(message)
    ? 'Capability metadata was partially sanitized.'
    : normalizeRequiredString(message);
}

function sanitizePublicSchema(
  schema: unknown,
  label: string,
  warnings: FlowSurfaceCapabilityWarning[],
): FlowSurfaceJsonSchema | undefined {
  if (!isPlainRecord(schema)) {
    return undefined;
  }
  if (containsUnsafePublicFragment(schema)) {
    addWarningOnce(warnings, {
      code: 'partial-settings-schema',
      message: `Capability ${label} was dropped because it contained internal implementation tokens.`,
    });
    return undefined;
  }
  return schema;
}

function sanitizePublicConfigureOptions(
  configureOptions: unknown,
  warnings: FlowSurfaceCapabilityWarning[],
): FlowSurfaceConfigureOptions | undefined {
  return sanitizePublicSchema(configureOptions, 'configure options', warnings) as
    | FlowSurfaceConfigureOptions
    | undefined;
}

function containsUnsafePublicFragment(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => containsUnsafePublicFragment(item));
  }
  if (_.isPlainObject(value)) {
    return Object.entries(value as Record<string, unknown>).some(
      ([key, item]) => isUnsafePublicKey(key) || containsUnsafePublicFragment(item),
    );
  }
  return typeof value === 'string' && isUnsafePublicToken(value);
}

function isUnsafePublicKey(value: unknown) {
  const normalized = normalizeRequiredString(value);
  return INTERNAL_PUBLIC_PAYLOAD_KEYS.has(normalized) || /Model$/.test(normalized);
}

function isUnsafePublicToken(value: unknown) {
  const normalized = normalizeRequiredString(value);
  if (!normalized) {
    return false;
  }
  if (INTERNAL_PUBLIC_PAYLOAD_KEYS.has(normalized) || /Model$/.test(normalized)) {
    return true;
  }
  return normalized
    .split(/[^a-zA-Z0-9_$]+/)
    .filter(Boolean)
    .some((segment) => INTERNAL_PUBLIC_PAYLOAD_KEYS.has(segment) || /Model$/.test(segment));
}

function addWarningOnce(warnings: FlowSurfaceCapabilityWarning[], warning: FlowSurfaceCapabilityWarning) {
  if (warnings.some((item) => item.code === warning.code && item.message === warning.message)) {
    return;
  }
  warnings.push(warning);
}

function normalizeAvailability(
  item: FlowSurfaceCapabilityManifestItem,
  providerCanResolveCreate: boolean,
  publicContracts: {
    settingsSchema?: FlowSurfaceJsonSchema;
    configureOptions?: FlowSurfaceJsonSchema;
  },
): FlowSurfaceCapabilityAvailability {
  const createDeclared = !!item.createRecipe || providerCanResolveCreate;
  const createSupported = createDeclared && item.availability?.create?.supported !== false;
  const configureDeclared = !!publicContracts.settingsSchema || !!publicContracts.configureOptions;
  const configureSupported = configureDeclared && item.availability?.configure?.supported !== false;
  const create = normalizeCreateAvailability(item.availability?.create, createSupported, {
    reasonCode: createDeclared ? 'unsupported' : 'missing-create-contract',
    reasonSource: 'registry',
  });
  const configure = normalizeWriteAvailabilityState(item.availability?.configure, configureSupported, {
    reasonCode: configureDeclared ? 'unsupported' : 'settings-schema-missing',
    reasonSource: 'registry',
  });
  return {
    render: normalizeAvailabilityState(item.availability?.render, true),
    readback: normalizeAvailabilityState(item.availability?.readback, true),
    create,
    configure,
  };
}

function normalizeAvailabilityState(
  state: FlowSurfaceCapabilityAvailability[keyof FlowSurfaceCapabilityAvailability] | undefined,
  defaultSupported: boolean,
): FlowSurfaceAvailabilityState {
  const supported = typeof state?.supported === 'boolean' ? state.supported : defaultSupported;
  return {
    supported,
    ...normalizeAvailabilityReason(state),
  };
}

function normalizeCreateAvailability(
  state: FlowSurfaceCapabilityAvailability['create'] | undefined,
  supported: boolean,
  unsupportedDefaults: Pick<FlowSurfaceAvailabilityState, 'reasonCode' | 'reasonSource'>,
): FlowSurfaceCapabilityAvailability['create'] {
  const normalized = normalizeWriteAvailabilityState(state, supported, unsupportedDefaults);
  return {
    ...normalized,
    ...(typeof state?.acceptsInitParams === 'boolean' ? { acceptsInitParams: state.acceptsInitParams } : {}),
    ...(typeof state?.acceptsSettings === 'boolean' ? { acceptsSettings: state.acceptsSettings } : {}),
  };
}

function normalizeWriteAvailabilityState(
  state: FlowSurfaceCapabilityAvailability[keyof FlowSurfaceCapabilityAvailability] | undefined,
  supported: boolean,
  unsupportedDefaults: Pick<FlowSurfaceAvailabilityState, 'reasonCode' | 'reasonSource'>,
): FlowSurfaceAvailabilityState {
  const normalized = normalizeAvailabilityState(state, supported);
  const effectiveSupported =
    supported && !(normalized.reasonCode && BLOCKING_WRITE_REASON_CODES.has(normalized.reasonCode));
  return {
    ...normalized,
    supported: effectiveSupported,
    ...(effectiveSupported
      ? {}
      : {
          reasonCode: normalized.reasonCode || unsupportedDefaults.reasonCode,
          reasonSource: normalized.reasonSource || unsupportedDefaults.reasonSource,
        }),
  };
}

function normalizeAvailabilityReason(
  state: FlowSurfaceCapabilityAvailability[keyof FlowSurfaceCapabilityAvailability] | undefined,
): Pick<FlowSurfaceAvailabilityState, 'reasonCode' | 'reasonSource'> {
  const reasonCode = normalizeAvailabilityReasonCode(state?.reasonCode);
  const reasonSource = normalizeAvailabilityReasonSource(state?.reasonSource);
  return {
    ...(reasonCode ? { reasonCode } : {}),
    ...(reasonSource ? { reasonSource } : {}),
  };
}

function normalizeAvailabilityReasonCode(value: unknown): FlowSurfaceReasonCode | undefined {
  const normalized = normalizeRequiredString(value);
  return AVAILABILITY_REASON_CODES.has(normalized as FlowSurfaceReasonCode)
    ? (normalized as FlowSurfaceReasonCode)
    : undefined;
}

function normalizeAvailabilityReasonSource(
  value: unknown,
): NonNullable<FlowSurfaceAvailabilityState['reasonSource']> | undefined {
  const normalized = normalizeRequiredString(value);
  return AVAILABILITY_REASON_SOURCES.has(normalized as NonNullable<FlowSurfaceAvailabilityState['reasonSource']>)
    ? (normalized as NonNullable<FlowSurfaceAvailabilityState['reasonSource']>)
    : undefined;
}

function resolveSupportLevel(availability: FlowSurfaceCapabilityAvailability): FlowSurfaceSupportLevel {
  if (availability.create.supported && availability.configure.supported) {
    return 'create-and-configure';
  }
  if (availability.create.supported) {
    return availability.create.acceptsSettings ? 'create-with-settings' : 'create-only';
  }
  if (availability.configure.supported) {
    return 'configure-only';
  }
  if (availability.readback.supported) {
    return 'readback-only';
  }
  return 'render-only';
}

function normalizeSupportLevel(value: unknown): FlowSurfaceSupportLevel | undefined {
  return FLOW_SURFACE_SUPPORT_LEVELS.has(value as FlowSurfaceSupportLevel)
    ? (value as FlowSurfaceSupportLevel)
    : undefined;
}

function normalizeCapabilityConfidence(value: unknown): FlowSurfaceCapabilityConfidence {
  return FLOW_SURFACE_CAPABILITY_CONFIDENCES.has(value as FlowSurfaceCapabilityConfidence)
    ? (value as FlowSurfaceCapabilityConfidence)
    : 'high';
}

function normalizeCapabilityWarnings(value: unknown): FlowSurfaceCapabilityWarning[] {
  return toUnknownArray(value).flatMap((warning) => {
    if (!isPlainRecord(warning)) {
      return [];
    }
    const code = normalizeRequiredString(warning.code);
    const message = normalizeRequiredString(warning.message);
    if (!code || !message) {
      return [];
    }
    return [
      {
        code: code as FlowSurfaceCapabilityWarning['code'],
        message,
      },
    ];
  });
}

function isFlowSurfaceSemanticExample(value: unknown): value is FlowSurfaceSemanticExample {
  if (!isPlainRecord(value) || typeof value.userIntent !== 'string' || !isPlainRecord(value.publicPayloadSnippet)) {
    return false;
  }
  if (typeof value.title !== 'undefined' && typeof value.title !== 'string') {
    return false;
  }
  if (typeof value.safety === 'undefined') {
    return true;
  }
  return isPlainRecord(value.safety) && typeof value.safety.validatedPublicPayload === 'boolean';
}

function toUnknownArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return _.isPlainObject(value);
}

function buildCapabilityIdentity(input: {
  ownerPlugin: string;
  id: string;
  capabilityVersion?: string;
  kind: FlowSurfaceCapabilityKind;
  publicType: string;
  deprecated?: boolean;
  replacedBy?: FlowSurfaceCapabilityIdentity['replacedBy'];
}): FlowSurfaceCapabilityIdentity {
  return {
    capabilityId: `plugin:${encodeURIComponent(input.ownerPlugin)}#${encodeURIComponent(input.id)}`,
    ...(input.capabilityVersion ? { capabilityVersion: input.capabilityVersion } : {}),
    ...(input.deprecated ? { deprecated: true } : {}),
    ...(input.replacedBy ? { replacedBy: input.replacedBy } : {}),
  };
}

function toCatalogKind(kind: FlowSurfaceCapabilityKind): FlowSurfaceCatalogItem['kind'] {
  if (kind === 'action') {
    return 'action';
  }
  if (kind === 'fieldComponent') {
    return 'field';
  }
  return 'block';
}

function getJsonSchemaRequired(schema: FlowSurfaceJsonSchema) {
  return Array.isArray(schema.required)
    ? schema.required.filter((item): item is string => typeof item === 'string')
    : [];
}
