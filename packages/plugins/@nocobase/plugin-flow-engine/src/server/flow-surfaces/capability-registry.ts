/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { normalizeFlowSurfaceCapabilityManifestItem } from './capability-manifest';
import { resolveFlowSurfaceCapabilityReadiness } from './capability-readiness';
import { callFlowSurfaceProvider } from './capability-provider-executor';
import { assertJsonInferredPopupHostContractSupported } from './json-inferred-popup-host';
import { resolveFlowSurfaceCapabilityAdmissionRuntimeEvidence } from './admission-report';
import {
  applyFlowSurfaceCapabilityWritePolicy,
  normalizeFlowSurfaceCapabilityPolicyConfig,
  resolveFlowSurfaceVerifiedAutoAdmissionDecision,
  type FlowSurfaceCapabilityPolicyConfig,
  type NormalizedFlowSurfaceCapabilityPolicyConfig,
  type FlowSurfaceVerifiedAutoAdmissionDecision,
} from './capability-policy';
import { deriveFlowSurfaceAutoCapabilityCandidates } from './extractor/snapshot';
import type { FlowSurfaceCapabilityAdmissionIntegrity, FlowSurfaceCapabilityAdmissionReport } from './admission-report';
import type { NormalizedFlowSurfaceProviderCapability } from './capability-manifest';
import type { FlowSurfaceCapabilityProviderRegistry } from './capability-provider';
import {
  FLOW_SURFACE_AUTO_SNAPSHOT_VERSION,
  FLOW_SURFACE_INFERRED_AUTHORING_CONTRACT_VERSION,
  type FlowSurfaceAutoSnapshot,
} from './extractor/types';
import type { FlowSurfaceAutoInferredAuthoringCapability } from './extractor/types';
import type {
  FlowSurfaceCapabilitiesProvider,
  FlowSurfaceCapabilityAvailability,
  FlowSurfaceCapabilityKind,
  FlowSurfaceCapabilityOriginSource,
  FlowSurfaceCapabilityWarning,
  FlowSurfaceCatalogItem,
  FlowSurfacePublicCapabilityItem,
} from './types';

const FLOW_SURFACE_PROVIDER_DISCOVERY_CONCURRENCY = 4;
const AUTO_SNAPSHOT_PUBLIC_CAPABILITY_KINDS = new Set<FlowSurfaceCapabilityKind>(['block', 'action']);
const AUTO_SNAPSHOT_ORIGIN: FlowSurfaceCapabilityOriginSource = 'autoSnapshot';
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
  'node',
  'defaultNode',
  'nodeTemplate',
  'lens',
  'implementation',
]);
const capabilityModelUses = new WeakMap<FlowSurfacePublicCapabilityItem, string[]>();
const capabilityAdmissionIntegrity = new WeakMap<
  FlowSurfacePublicCapabilityItem,
  FlowSurfaceCapabilityAdmissionIntegrity
>();
const capabilityAdmissionCapabilityIds = new WeakMap<FlowSurfacePublicCapabilityItem, string>();
const capabilityInferredAuthoring = new WeakMap<
  FlowSurfacePublicCapabilityItem,
  FlowSurfaceAutoInferredAuthoringCapability
>();
const catalogItemCapabilityModelUses = new WeakMap<FlowSurfaceCatalogItem, string[]>();

export type FlowSurfaceCapabilityRegistryLike = Pick<FlowSurfaceCapabilityProviderRegistry, 'listProviders'>;

type FlowSurfaceProviderRegistryProjectionOptions = {
  providerRegistry?: FlowSurfaceCapabilityRegistryLike;
  enabledPackages: ReadonlySet<string>;
  providerTimeoutMs?: number;
};

type FlowSurfaceAutoSnapshotProjectionOptions = {
  autoSnapshots?: readonly FlowSurfaceAutoSnapshot[];
  enabledPackages: ReadonlySet<string>;
};

type FlowSurfaceVerifiedAutoCatalogProjectionOptions = FlowSurfaceAutoSnapshotProjectionOptions & {
  admissionReports?: readonly FlowSurfaceCapabilityAdmissionReport[];
  capabilityPolicyConfig?: FlowSurfaceCapabilityPolicyConfig | NormalizedFlowSurfaceCapabilityPolicyConfig | null;
};

type FlowSurfaceJsonInferredAutoCatalogProjectionOptions = FlowSurfaceAutoSnapshotProjectionOptions & {
  capabilityPolicyConfig?: FlowSurfaceCapabilityPolicyConfig | NormalizedFlowSurfaceCapabilityPolicyConfig | null;
  placementFilter?: (item: FlowSurfacePublicCapabilityItem) => boolean;
};

export type FlowSurfaceCollectedProviderCapability = NormalizedFlowSurfaceProviderCapability & {
  provider: FlowSurfaceCapabilitiesProvider;
};

export async function collectProviderPublicCapabilities(
  options: FlowSurfaceProviderRegistryProjectionOptions,
): Promise<FlowSurfacePublicCapabilityItem[]> {
  const normalized = await collectNormalizedProviderCapabilities(options);
  return normalized.map((item) =>
    setFlowSurfacePublicCapabilityModelUse(item.publicItem, [
      item.implementation.modelUse,
      ...(item.implementation.legacyModelUses || []),
    ]),
  );
}

export function setFlowSurfacePublicCapabilityModelUse<T extends FlowSurfacePublicCapabilityItem>(
  item: T,
  modelUse?: string | readonly string[],
): T {
  const normalized = normalizeCapabilityModelUses(modelUse);
  if (normalized.length) {
    capabilityModelUses.set(item, normalized);
  }
  return item;
}

export function getFlowSurfacePublicCapabilityModelUses(item: FlowSurfacePublicCapabilityItem) {
  return capabilityModelUses.get(item) || [];
}

export function setFlowSurfaceCatalogCapabilityModelUse<T extends FlowSurfaceCatalogItem>(
  item: T,
  modelUse?: string | readonly string[],
): T {
  const normalized = normalizeCapabilityModelUses(modelUse);
  if (normalized.length) {
    catalogItemCapabilityModelUses.set(item, normalized);
  }
  return item;
}

export function getFlowSurfaceCatalogCapabilityModelUses(item: FlowSurfaceCatalogItem) {
  return catalogItemCapabilityModelUses.get(item) || [];
}

export function setFlowSurfacePublicCapabilityAdmissionIntegrity<T extends FlowSurfacePublicCapabilityItem>(
  item: T,
  integrity?: FlowSurfaceCapabilityAdmissionIntegrity,
): T {
  const normalized = normalizeFlowSurfaceCapabilityAdmissionIntegrity(integrity);
  if (normalized) {
    capabilityAdmissionIntegrity.set(item, normalized);
  }
  return item;
}

export function getFlowSurfacePublicCapabilityAdmissionIntegrity(item: FlowSurfacePublicCapabilityItem) {
  return capabilityAdmissionIntegrity.get(item);
}

export function setFlowSurfacePublicCapabilityAdmissionCapabilityId<T extends FlowSurfacePublicCapabilityItem>(
  item: T,
  capabilityId?: string,
): T {
  const normalized = normalizeString(capabilityId);
  if (normalized) {
    capabilityAdmissionCapabilityIds.set(item, normalized);
  }
  return item;
}

export function getFlowSurfacePublicCapabilityAdmissionCapabilityId(item: FlowSurfacePublicCapabilityItem) {
  return capabilityAdmissionCapabilityIds.get(item);
}

export function setFlowSurfacePublicCapabilityInferredAuthoring<T extends FlowSurfacePublicCapabilityItem>(
  item: T,
  inferredAuthoring?: FlowSurfaceAutoInferredAuthoringCapability,
): T {
  if (inferredAuthoring) {
    capabilityInferredAuthoring.set(item, inferredAuthoring);
  }
  return item;
}

export function getFlowSurfacePublicCapabilityInferredAuthoring(item: FlowSurfacePublicCapabilityItem) {
  return capabilityInferredAuthoring.get(item);
}

export function collectAutoSnapshotPublicCapabilities(
  options: FlowSurfaceAutoSnapshotProjectionOptions,
): FlowSurfacePublicCapabilityItem[] {
  return (options.autoSnapshots || []).flatMap((snapshot) => {
    const ownerPlugin = normalizeOwnerPlugin(snapshot.plugin);
    if (!ownerPlugin || !options.enabledPackages.has(ownerPlugin)) {
      return [];
    }
    return [
      ...collectInferredAuthoringPublicCapabilities(snapshot, ownerPlugin),
      ...collectRawAutoSnapshotPublicCapabilities(snapshot, ownerPlugin),
    ];
  });
}

function collectRawAutoSnapshotPublicCapabilities(snapshot: FlowSurfaceAutoSnapshot, ownerPlugin: string) {
  return deriveFlowSurfaceAutoCapabilityCandidates(snapshot)
    .map((candidate): FlowSurfacePublicCapabilityItem | undefined => {
      if (!AUTO_SNAPSHOT_PUBLIC_CAPABILITY_KINDS.has(candidate.kind)) {
        return undefined;
      }
      const publicType = normalizeSafeAutoSnapshotPublicType(candidate.publicType);
      if (!publicType) {
        return undefined;
      }
      const warnings = [
        ...(candidate.warnings || []),
        ...(snapshot.warnings || []),
        ...buildAutoSnapshotVersionWarnings(snapshot),
        {
          code: 'auto-discovered-readonly' as const,
          message: 'Auto snapshot discovery is read-only until a manifest or provider declares an authoring contract.',
        },
      ];
      const label = sanitizePublicText(candidate.label, warnings) || publicType;
      const searchAliases = sanitizePublicAliasList([publicType, label], warnings);
      const semanticAliases = sanitizePublicAliasList([publicType], warnings);
      const publicWarnings = sanitizeWarnings(dedupeWarnings(warnings));
      const availability = buildReadOnlyAutoSnapshotAvailability(hasSnapshotStaleWarning(publicWarnings));
      const supportLevel = 'readback-only' as const;
      const capabilityId = [ownerPlugin, 'autoSnapshot', candidate.kind, publicType].join(':');
      return setFlowSurfacePublicCapabilityAdmissionIntegrity(
        setFlowSurfacePublicCapabilityAdmissionCapabilityId(
          setFlowSurfacePublicCapabilityModelUse(
            {
              kind: candidate.kind,
              publicType,
              publicTypeMeta: {
                value: publicType,
                source: 'autoNamespaced',
                searchAliases,
              },
              label,
              ownerPlugin,
              origin: AUTO_SNAPSHOT_ORIGIN,
              semantic: {
                title: label,
                aliases: semanticAliases,
              },
              availability,
              supportLevel,
              confidence: candidate.confidence,
              readiness: resolveFlowSurfaceCapabilityReadiness({
                origin: AUTO_SNAPSHOT_ORIGIN,
                availability,
                warnings: publicWarnings,
              }),
              warnings: publicWarnings,
              identity: {
                capabilityId,
              },
            } satisfies FlowSurfacePublicCapabilityItem,
            candidate.modelUse,
          ),
          capabilityId,
        ),
        buildAutoSnapshotAdmissionIntegrity(snapshot),
      );
    })
    .filter((item): item is FlowSurfacePublicCapabilityItem => !!item);
}

function collectInferredAuthoringPublicCapabilities(
  snapshot: FlowSurfaceAutoSnapshot,
  ownerPlugin: string,
): FlowSurfacePublicCapabilityItem[] {
  return (snapshot.inferredAuthoring?.capabilities || [])
    .map((capability) => toInferredAuthoringPublicCapability(snapshot, ownerPlugin, capability))
    .filter((item): item is FlowSurfacePublicCapabilityItem => !!item);
}

function toInferredAuthoringPublicCapability(
  snapshot: FlowSurfaceAutoSnapshot,
  ownerPlugin: string,
  capability: FlowSurfaceAutoInferredAuthoringCapability,
): FlowSurfacePublicCapabilityItem | null {
  if (!AUTO_SNAPSHOT_PUBLIC_CAPABILITY_KINDS.has(capability.kind)) {
    return null;
  }
  if (normalizeOwnerPlugin(capability.ownerPlugin) !== ownerPlugin) {
    return null;
  }
  const publicType = normalizeSafeAutoSnapshotPublicType(capability.publicType);
  if (!publicType) {
    return null;
  }
  const warnings = [
    ...(capability.warnings || []),
    ...(snapshot.warnings || []),
    ...buildAutoSnapshotVersionWarnings(snapshot),
  ];
  const initParamsSchema = sanitizePublicSchema(capability.initParamsSchema, 'init params schema', warnings);
  const settingsSchema = sanitizePublicSchema(capability.settingsSchema, 'settings schema', warnings);
  const configureOptions = sanitizePublicSchema(capability.configureOptions, 'configure options', warnings);
  const supportedPopupHostContracts = validateInferredAuthoringPopupHostContracts(capability, warnings);
  const highConfidenceWrite =
    isHighConfidenceInferredAuthoringCapability(capability) &&
    supportedPopupHostContracts &&
    !!initParamsSchema &&
    !!settingsSchema;
  if (!highConfidenceWrite) {
    addWarningOnce(warnings, {
      code: 'contract-not-verified',
      message: 'Inferred authoring contract is not high-confidence enough for automatic writes.',
    });
  }
  const label = sanitizePublicText(capability.label, warnings) || publicType;
  const acceptedAliases = sanitizePublicAliasList(capability.acceptedAliases || [], warnings);
  const searchAliases = sanitizePublicAliasList([publicType, label, ...acceptedAliases], warnings);
  const semanticAliases = sanitizePublicAliasList([publicType, ...acceptedAliases], warnings);
  const publicWarnings = sanitizeWarnings(dedupeWarnings(warnings));
  const availability = buildInferredAuthoringAvailability({
    highConfidenceWrite,
    stale: hasSnapshotStaleWarning(publicWarnings),
    acceptsInitParams: !!initParamsSchema,
    acceptsSettings: !!settingsSchema,
  });
  const supportLevel = resolveSupportLevel(availability);
  const capabilityId = [ownerPlugin, 'autoSnapshot', capability.kind, publicType].join(':');
  return setFlowSurfacePublicCapabilityInferredAuthoring(
    setFlowSurfacePublicCapabilityAdmissionIntegrity(
      setFlowSurfacePublicCapabilityAdmissionCapabilityId(
        setFlowSurfacePublicCapabilityModelUse(
          {
            kind: capability.kind,
            publicType,
            publicTypeMeta: {
              value: publicType,
              source: 'autoNamespaced',
              searchAliases,
              ...(acceptedAliases.length ? { acceptedAliases } : {}),
            },
            label,
            ownerPlugin,
            origin: AUTO_SNAPSHOT_ORIGIN,
            semantic: {
              title: label,
              aliases: semanticAliases,
            },
            availability,
            supportLevel,
            confidence: capability.confidence.write,
            readiness: resolveFlowSurfaceCapabilityReadiness({
              origin: AUTO_SNAPSHOT_ORIGIN,
              availability,
              warnings: publicWarnings,
            }),
            ...(capability.placement ? { placement: capability.placement } : {}),
            ...(publicWarnings.length ? { warnings: publicWarnings } : {}),
            identity: {
              capabilityId,
            },
            ...(initParamsSchema ? { initParamsSchema } : {}),
            ...(settingsSchema ? { settingsSchema } : {}),
            ...(configureOptions ? { configureOptions } : {}),
          } satisfies FlowSurfacePublicCapabilityItem,
          capability.modelUse,
        ),
        capabilityId,
      ),
      buildAutoSnapshotAdmissionIntegrity(snapshot),
    ),
    capability,
  );
}

function isHighConfidenceInferredAuthoringCapability(capability: FlowSurfaceAutoInferredAuthoringCapability) {
  return (
    capability.confidence.discovery === 'high' &&
    capability.confidence.placement === 'high' &&
    capability.confidence.tree === 'high' &&
    capability.confidence.settings === 'high' &&
    capability.confidence.write === 'high' &&
    !!capability.createRecipe &&
    !!capability.initParamsSchema &&
    !!capability.settingsSchema
  );
}

function validateInferredAuthoringPopupHostContracts(
  capability: FlowSurfaceAutoInferredAuthoringCapability,
  warnings: FlowSurfaceCapabilityWarning[],
) {
  let supported = true;
  (capability.popupHosts || []).forEach((popupHost) => {
    if (popupHost.confidence && popupHost.confidence !== 'high') {
      return;
    }
    try {
      assertJsonInferredPopupHostContractSupported(popupHost);
    } catch (error) {
      supported = false;
      addWarningOnce(warnings, {
        code: 'contract-not-verified',
        message:
          error instanceof Error && error.message
            ? error.message
            : 'Inferred popup host contract is not supported for automatic writes.',
      });
    }
  });
  return supported;
}

function buildInferredAuthoringAvailability(input: {
  highConfidenceWrite: boolean;
  stale: boolean;
  acceptsInitParams: boolean;
  acceptsSettings: boolean;
}): FlowSurfaceCapabilityAvailability {
  if (input.stale) {
    return buildReadOnlyAutoSnapshotAvailability(true);
  }
  return {
    render: { supported: true },
    readback: { supported: true },
    create: input.highConfidenceWrite
      ? {
          supported: true,
          acceptsInitParams: input.acceptsInitParams,
          acceptsSettings: input.acceptsSettings,
        }
      : {
          supported: false,
          reasonCode: 'contract-not-verified',
          reasonSource: 'registry',
          acceptsInitParams: input.acceptsInitParams,
          acceptsSettings: input.acceptsSettings,
        },
    configure: {
      supported: false,
      reasonCode: 'contract-not-verified',
      reasonSource: 'registry',
    },
  };
}

export function collectVerifiedAutoSnapshotCatalogItems(
  options: FlowSurfaceVerifiedAutoCatalogProjectionOptions,
): FlowSurfaceCatalogItem[] {
  const capabilityPolicyConfig = normalizeFlowSurfaceCapabilityPolicyConfig(options.capabilityPolicyConfig);
  if (
    capabilityPolicyConfig.writePolicy.mode !== 'verifiedAuto' ||
    !hasStrictVerifiedAutoCatalogAllowlists(capabilityPolicyConfig) ||
    !options.admissionReports?.length
  ) {
    return [];
  }
  return collectAutoSnapshotPublicCapabilities(options)
    .map((item) => applyFlowSurfaceCapabilityWritePolicy(item, capabilityPolicyConfig))
    .map((item) =>
      applyVerifiedAutoAdmissionCatalogProjection(item, {
        capabilityPolicyConfig,
        admissionReports: options.admissionReports,
      }),
    )
    .filter((item): item is FlowSurfacePublicCapabilityItem => !!item && item.kind === 'block')
    .filter((item) => item.availability.create.supported)
    .map((item) => toVerifiedAutoSnapshotCatalogItem(item));
}

export function collectJsonInferredAutoSnapshotCatalogItems(
  options: FlowSurfaceJsonInferredAutoCatalogProjectionOptions,
): FlowSurfaceCatalogItem[] {
  return collectAutoSnapshotPublicCapabilities(options)
    .map((item) => applyFlowSurfaceCapabilityWritePolicy(item, options.capabilityPolicyConfig))
    .filter((item) => item.kind === 'block')
    .filter((item) => item.origin === AUTO_SNAPSHOT_ORIGIN)
    .filter((item) => !!getFlowSurfacePublicCapabilityInferredAuthoring(item))
    .filter((item) => (options.placementFilter ? options.placementFilter(item) : true))
    .filter((item) => item.availability.create.supported)
    .map((item) => toVerifiedAutoSnapshotCatalogItem(item));
}

function hasStrictVerifiedAutoCatalogAllowlists(config: NormalizedFlowSurfaceCapabilityPolicyConfig) {
  return !!config.writePolicy.allowedOwners?.length && !!config.writePolicy.allowedPublicTypes?.length;
}

export async function collectProviderCatalogItems(
  options: FlowSurfaceProviderRegistryProjectionOptions,
): Promise<FlowSurfaceCatalogItem[]> {
  const normalized = await collectNormalizedProviderCapabilities(options);
  return normalized.filter((item) => item.catalogItem.createSupported).map((item) => item.catalogItem);
}

export function filterProviderCatalogItemsForCatalog(input: {
  providerItems: FlowSurfaceCatalogItem[];
  existingItems: FlowSurfaceCatalogItem[];
}) {
  const seen = new Set(input.existingItems.map((item) => getCatalogPublicTypeConflictKey(item)).filter(Boolean));
  return input.providerItems.filter((item) => {
    const key = getCatalogPublicTypeConflictKey(item);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export async function collectNormalizedProviderCapabilities(
  options: FlowSurfaceProviderRegistryProjectionOptions,
): Promise<FlowSurfaceCollectedProviderCapability[]> {
  const providers = options.providerRegistry?.listProviders() || [];
  const results: FlowSurfaceCollectedProviderCapability[] = [];
  const enabledProviders = providers.flatMap((provider) => {
    const ownerPlugin = normalizeOwnerPlugin(provider.ownerPlugin);
    if (!ownerPlugin || !options.enabledPackages.has(ownerPlugin)) {
      return [];
    }
    return [
      {
        ownerPlugin,
        provider,
      },
    ];
  });
  for (let index = 0; index < enabledProviders.length; index += FLOW_SURFACE_PROVIDER_DISCOVERY_CONCURRENCY) {
    const batch = enabledProviders.slice(index, index + FLOW_SURFACE_PROVIDER_DISCOVERY_CONCURRENCY);
    const batchResults = await Promise.all(
      batch.map(({ provider, ownerPlugin }) => collectOneProviderCapabilities(provider, ownerPlugin, options)),
    );
    results.push(...batchResults.flat());
  }
  return results;
}

function applyVerifiedAutoAdmissionCatalogProjection(
  item: FlowSurfacePublicCapabilityItem,
  options: {
    capabilityPolicyConfig: NormalizedFlowSurfaceCapabilityPolicyConfig;
    admissionReports?: readonly FlowSurfaceCapabilityAdmissionReport[];
  },
): FlowSurfacePublicCapabilityItem | null {
  if (item.origin !== 'autoSnapshot') {
    return null;
  }
  const capabilityId = getFlowSurfacePublicCapabilityAdmissionCapabilityId(item);
  const evidence = resolveFlowSurfaceCapabilityAdmissionRuntimeEvidence({
    reports: options.admissionReports || [],
    capability: {
      kind: item.kind,
      publicType: item.publicType,
      ownerPlugin: item.ownerPlugin,
      ...(capabilityId ? { capabilityId } : {}),
    },
    expectedIntegrity: getFlowSurfacePublicCapabilityAdmissionIntegrity(item),
  });
  const decision = resolveFlowSurfaceVerifiedAutoAdmissionDecision({
    item,
    config: options.capabilityPolicyConfig,
    admissionEvidence: evidence,
  });
  if (!decision.ok) {
    return null;
  }
  return enableVerifiedAutoCatalogCreate(item, decision);
}

function enableVerifiedAutoCatalogCreate(
  item: FlowSurfacePublicCapabilityItem,
  decision: FlowSurfaceVerifiedAutoAdmissionDecision,
): FlowSurfacePublicCapabilityItem {
  const availability: FlowSurfaceCapabilityAvailability = {
    ...item.availability,
    create: {
      supported: true,
      ...(typeof item.availability.create.acceptsInitParams === 'boolean'
        ? { acceptsInitParams: item.availability.create.acceptsInitParams }
        : {}),
      ...(typeof item.availability.create.acceptsSettings === 'boolean'
        ? { acceptsSettings: item.availability.create.acceptsSettings }
        : {}),
    },
  };
  const warnings = (item.warnings || []).filter((warning) => warning.code !== 'auto-discovered-readonly');
  const projected: FlowSurfacePublicCapabilityItem = {
    ...item,
    availability,
    supportLevel: resolveSupportLevel(availability),
    readiness: decision.readiness,
  };
  if (warnings.length) {
    projected.warnings = warnings;
  } else {
    delete projected.warnings;
  }
  return copyAutoCapabilityProjectionMetadata(projected, item);
}

function copyAutoCapabilityProjectionMetadata(
  target: FlowSurfacePublicCapabilityItem,
  source: FlowSurfacePublicCapabilityItem,
) {
  return setFlowSurfacePublicCapabilityInferredAuthoring(
    setFlowSurfacePublicCapabilityAdmissionIntegrity(
      setFlowSurfacePublicCapabilityAdmissionCapabilityId(
        setFlowSurfacePublicCapabilityModelUse(target, getFlowSurfacePublicCapabilityModelUses(source)),
        getFlowSurfacePublicCapabilityAdmissionCapabilityId(source),
      ),
      getFlowSurfacePublicCapabilityAdmissionIntegrity(source),
    ),
    getFlowSurfacePublicCapabilityInferredAuthoring(source),
  );
}

function toVerifiedAutoSnapshotCatalogItem(item: FlowSurfacePublicCapabilityItem): FlowSurfaceCatalogItem {
  return setFlowSurfaceCatalogCapabilityModelUse(
    {
      key: item.publicType,
      label: item.label,
      use: item.publicType,
      kind: 'block',
      publicType: item.publicType,
      ...(item.publicTypeMeta.acceptedAliases?.length ? { acceptedAliases: item.publicTypeMeta.acceptedAliases } : {}),
      semantic: item.semantic,
      ownerPlugin: item.ownerPlugin,
      origin: item.origin,
      supportLevel: item.supportLevel,
      confidence: item.confidence,
      availability: item.availability,
      createSupported: item.availability.create.supported,
      ...(getCatalogRequiredInitParams(item.initParamsSchema).length
        ? { requiredInitParams: getCatalogRequiredInitParams(item.initParamsSchema) }
        : {}),
      ...(item.settingsSchema ? { settingsSchema: item.settingsSchema } : {}),
      ...(item.configureOptions ? { configureOptions: item.configureOptions } : {}),
      ...(item.warnings?.length ? { warnings: item.warnings } : {}),
      ...(item.identity ? { identity: item.identity } : {}),
    },
    getFlowSurfacePublicCapabilityModelUses(item),
  );
}

function getCatalogRequiredInitParams(schema: FlowSurfacePublicCapabilityItem['initParamsSchema']) {
  if (!schema || !Array.isArray(schema.required)) {
    return [];
  }
  return schema.required.map((item) => String(item || '').trim()).filter(Boolean);
}

function normalizeCapabilityModelUses(modelUse?: string | readonly string[]) {
  return Array.from(
    new Set(
      (Array.isArray(modelUse) ? modelUse : [modelUse]).map((value) => String(value || '').trim()).filter(Boolean),
    ),
  );
}

async function collectOneProviderCapabilities(
  provider: FlowSurfaceCapabilitiesProvider,
  ownerPlugin: string,
  options: FlowSurfaceProviderRegistryProjectionOptions,
): Promise<FlowSurfaceCollectedProviderCapability[]> {
  const capabilities = await loadProviderCapabilities(provider, options.enabledPackages, options.providerTimeoutMs);
  return capabilities.flatMap((item) => {
    const normalized = normalizeFlowSurfaceCapabilityManifestItem({
      item,
      ownerPlugin,
      source: ownerPlugin === '@nocobase/plugin-gantt' ? 'canaryOverlay' : 'provider',
      provider,
    });
    if (!normalized) {
      return [];
    }
    return [
      {
        ...normalized,
        provider,
      },
    ];
  });
}

async function loadProviderCapabilities(
  provider: FlowSurfaceCapabilitiesProvider,
  enabledPlugins: ReadonlySet<string>,
  timeoutMs?: number,
) {
  const result = await callFlowSurfaceProvider({
    provider,
    method: 'getCapabilities',
    timeoutMs,
    run: () =>
      provider.getCapabilities({
        enabledPlugins,
      }),
  });
  if (result.ok === false) {
    return [];
  }
  return result.value;
}

function normalizeOwnerPlugin(ownerPlugin: string) {
  return String(ownerPlugin || '').trim();
}

function buildReadOnlyAutoSnapshotAvailability(stale: boolean): FlowSurfaceCapabilityAvailability {
  return {
    render: stale
      ? {
          supported: false,
          reasonCode: 'snapshot-stale',
          reasonSource: 'registry',
        }
      : { supported: true },
    readback: { supported: true },
    create: {
      supported: false,
      reasonCode: 'manifest-required',
      reasonSource: 'registry',
    },
    configure: {
      supported: false,
      reasonCode: 'manifest-required',
      reasonSource: 'registry',
    },
  };
}

function buildAutoSnapshotAdmissionIntegrity(
  snapshot: FlowSurfaceAutoSnapshot,
): FlowSurfaceCapabilityAdmissionIntegrity | undefined {
  const integrity: FlowSurfaceCapabilityAdmissionIntegrity = {};
  const capabilityVersion = normalizeString(snapshot.pluginVersion);
  const snapshotHash = buildAutoSnapshotAdmissionSnapshotHash(snapshot);
  if (capabilityVersion) {
    integrity.capabilityVersion = capabilityVersion;
  }
  if (snapshotHash) {
    integrity.snapshotHash = snapshotHash;
  }
  return Object.keys(integrity).length ? integrity : undefined;
}

function buildAutoSnapshotVersionWarnings(snapshot: FlowSurfaceAutoSnapshot): FlowSurfaceCapabilityWarning[] {
  const warnings: FlowSurfaceCapabilityWarning[] = [];
  if (snapshot.version !== FLOW_SURFACE_AUTO_SNAPSHOT_VERSION) {
    warnings.push({
      code: 'snapshot-stale',
      message: `Auto snapshot version is incompatible with current version ${FLOW_SURFACE_AUTO_SNAPSHOT_VERSION}.`,
    });
  }
  if (isInferredAuthoringContractStale(snapshot)) {
    warnings.push({
      code: 'snapshot-stale',
      message: `Auto snapshot inferred authoring contract is incompatible with current version ${FLOW_SURFACE_INFERRED_AUTHORING_CONTRACT_VERSION}.`,
    });
  }
  return warnings;
}

function isInferredAuthoringContractStale(snapshot: FlowSurfaceAutoSnapshot) {
  if (!snapshot.inferredAuthoring?.capabilities?.length) {
    return false;
  }
  return snapshot.inferredAuthoring.contractVersion !== FLOW_SURFACE_INFERRED_AUTHORING_CONTRACT_VERSION;
}

function buildAutoSnapshotAdmissionSnapshotHash(snapshot: FlowSurfaceAutoSnapshot) {
  const sourceHash = normalizeString(snapshot.sourceHash);
  if (!sourceHash) {
    return undefined;
  }
  return `v${snapshot.version}:${sourceHash}`;
}

function normalizeFlowSurfaceCapabilityAdmissionIntegrity(
  integrity?: FlowSurfaceCapabilityAdmissionIntegrity,
): FlowSurfaceCapabilityAdmissionIntegrity | undefined {
  if (!integrity) {
    return undefined;
  }
  const normalized: FlowSurfaceCapabilityAdmissionIntegrity = {};
  const capabilityVersion = normalizeString(integrity.capabilityVersion);
  const manifestHash = normalizeString(integrity.manifestHash);
  const snapshotHash = normalizeString(integrity.snapshotHash);
  const dryRunFixtureHash = normalizeString(integrity.dryRunFixtureHash);
  if (capabilityVersion) {
    normalized.capabilityVersion = capabilityVersion;
  }
  if (manifestHash) {
    normalized.manifestHash = manifestHash;
  }
  if (snapshotHash) {
    normalized.snapshotHash = snapshotHash;
  }
  if (dryRunFixtureHash) {
    normalized.dryRunFixtureHash = dryRunFixtureHash;
  }
  return Object.keys(normalized).length ? normalized : undefined;
}

function hasSnapshotStaleWarning(warnings: FlowSurfaceCapabilityWarning[]) {
  return warnings.some((warning) => warning.code === 'snapshot-stale');
}

function dedupeWarnings(warnings: FlowSurfaceCapabilityWarning[]) {
  const seen = new Set<string>();
  return warnings.filter((warning) => {
    const key = [warning.code, warning.message].join('::');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function sanitizeWarnings(warnings: FlowSurfaceCapabilityWarning[]) {
  const sanitized: FlowSurfaceCapabilityWarning[] = [];
  warnings.forEach((warning) => {
    const message = sanitizeWarningMessage(warning.message);
    if (!message) {
      return;
    }
    if (message !== normalizeString(warning.message)) {
      addWarningOnce(sanitized, {
        code: 'unsafe-semantic-text',
        message: 'Capability metadata was partially sanitized.',
      });
    }
    addWarningOnce(sanitized, {
      code: warning.code,
      message,
    });
  });
  return sanitized;
}

function normalizeSafeAutoSnapshotPublicType(value: unknown) {
  const publicType = normalizeString(value);
  if (!publicType || isUnsafePublicToken(publicType) || looksLikeFilePath(publicType)) {
    return '';
  }
  return publicType;
}

function sanitizeWarningMessage(message: string) {
  return isUnsafePublicToken(message) || looksLikeFilePath(message)
    ? 'Capability metadata was partially sanitized.'
    : normalizeString(message);
}

function sanitizePublicAliasList(values: unknown[], warnings: FlowSurfaceCapabilityWarning[]) {
  const aliases: string[] = [];
  values.forEach((value) => {
    const normalized = normalizeString(value);
    if (!normalized) {
      return;
    }
    if (isUnsafePublicToken(normalized) || looksLikeFilePath(normalized)) {
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

function sanitizePublicText(value: unknown, warnings: FlowSurfaceCapabilityWarning[]) {
  const normalized = normalizeString(value);
  if (!normalized) {
    return '';
  }
  if (isUnsafePublicToken(normalized) || looksLikeFilePath(normalized)) {
    addWarningOnce(warnings, {
      code: 'unsafe-semantic-text',
      message: 'Capability metadata was partially sanitized.',
    });
    return '';
  }
  return normalized;
}

function sanitizePublicSchema<T extends Record<string, unknown> | undefined>(
  schema: T,
  label: string,
  warnings: FlowSurfaceCapabilityWarning[],
): T | undefined {
  if (!schema) {
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
  const normalized = normalizeString(value);
  return INTERNAL_PUBLIC_PAYLOAD_KEYS.has(normalized) || /Model$/.test(normalized);
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isUnsafePublicToken(value: unknown) {
  const normalized = normalizeString(value);
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

function looksLikeFilePath(value: string) {
  return /(?:^|[\s'"`])(?:\/|[A-Za-z]:\\|(?:packages|src|storage|node_modules)[\\/])/.test(value);
}

function addWarningOnce(warnings: FlowSurfaceCapabilityWarning[], warning: FlowSurfaceCapabilityWarning) {
  if (warnings.some((item) => item.code === warning.code && item.message === warning.message)) {
    return;
  }
  warnings.push(warning);
}

function getCatalogPublicTypeConflictKey(item: FlowSurfaceCatalogItem) {
  const publicType = String(item.publicType || item.type || item.key || '').trim();
  if (!publicType) {
    return '';
  }
  return [toCapabilityKind(item.kind), publicType].join('::');
}

function toCapabilityKind(kind: FlowSurfaceCatalogItem['kind']): FlowSurfaceCapabilityKind {
  switch (kind) {
    case 'action':
    case 'block':
      return kind;
    case 'field':
      return 'fieldComponent';
    default:
      return 'block';
  }
}

function resolveSupportLevel(availability: FlowSurfaceCapabilityAvailability) {
  if (availability.create.supported && availability.configure.supported) {
    return 'create-and-configure' as const;
  }
  if (availability.create.supported) {
    return availability.create.acceptsSettings ? ('create-with-settings' as const) : ('create-only' as const);
  }
  if (availability.configure.supported) {
    return 'configure-only' as const;
  }
  if (availability.readback.supported) {
    return 'readback-only' as const;
  }
  return 'render-only' as const;
}
