/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { resolveFlowSurfaceCapabilityAdmissionRuntimeEvidence } from './admission-report';
import {
  applyFlowSurfaceCapabilityWritePolicy,
  normalizeFlowSurfaceCapabilityPolicyConfig,
  resolveFlowSurfaceVerifiedAutoAdmissionDecision,
  type FlowSurfaceCapabilityPolicyConfig,
  type NormalizedFlowSurfaceCapabilityPolicyConfig,
  type FlowSurfaceVerifiedAutoAdmissionDecision,
} from './capability-policy';
import {
  collectAutoSnapshotPublicCapabilities,
  collectNormalizedProviderCapabilities,
  collectProviderPublicCapabilities,
  getFlowSurfaceCatalogCapabilityModelUses,
  getFlowSurfacePublicCapabilityAdmissionCapabilityId,
  getFlowSurfacePublicCapabilityAdmissionIntegrity,
  getFlowSurfacePublicCapabilityInferredAuthoring,
  getFlowSurfacePublicCapabilityModelUses,
  setFlowSurfacePublicCapabilityAdmissionCapabilityId,
  setFlowSurfacePublicCapabilityAdmissionIntegrity,
  setFlowSurfacePublicCapabilityInferredAuthoring,
  setFlowSurfacePublicCapabilityModelUse,
  type FlowSurfaceCapabilityRegistryLike,
  type FlowSurfaceCollectedProviderCapability,
} from './capability-registry';
import { resolveFlowSurfaceCapabilityReadiness } from './capability-readiness';
import { FlowSurfaceBadRequestError } from './errors';
import type { FlowSurfaceCapabilityAdmissionReport } from './admission-report';
import type { FlowSurfaceAutoSnapshot } from './extractor/types';
import type {
  FlowSurfaceCapabilityAvailability,
  FlowSurfaceCapabilitiesResponse,
  FlowSurfaceCapabilitiesValues,
  FlowSurfaceCapabilityKind,
  FlowSurfaceCapabilityOriginSource,
  FlowSurfaceCatalogItem,
  FlowSurfaceCatalogResponse,
  FlowSurfaceCatalogSection,
  FlowSurfaceCatalogValues,
  FlowSurfaceDescribeCapabilityResponse,
  FlowSurfaceDescribeCapabilityValues,
  FlowSurfacePublicCapabilityItem,
} from './types';

const DEFAULT_CAPABILITY_KINDS = new Set<FlowSurfaceCapabilityKind>(['block', 'action', 'fieldComponent']);
const FLOW_SURFACE_CAPABILITY_KIND_SET = new Set<FlowSurfaceCapabilityKind>(DEFAULT_CAPABILITY_KINDS);
const FLOW_SURFACE_CAPABILITY_EXPAND_SET = new Set([
  'item.identity',
  'item.semantic',
  'item.settings',
  'item.warnings',
]);
const CAPABILITIES_REQUEST_FIELDS = new Set([
  'kinds',
  'publicTypes',
  'ownerPlugins',
  'query',
  'target',
  'includeUnavailable',
  'includeWarnings',
  'limit',
  'expand',
]);
const CAPABILITIES_TARGET_FIELDS = new Set(['targetUid', 'uid']);
const DESCRIBE_CAPABILITY_REQUEST_FIELDS = new Set([
  'capabilityId',
  'kind',
  'publicType',
  'ownerPlugin',
  'target',
  'includeUnavailable',
  'includeWarnings',
  'expand',
]);
const DEFAULT_OWNER_PLUGIN = '@nocobase/core/client';
const CAPABILITY_ORIGIN_PRECEDENCE: Record<FlowSurfaceCapabilityOriginSource, number> = {
  builtInStatic: 50,
  officialManifest: 40,
  pluginManifest: 30,
  provider: 30,
  canaryOverlay: 20,
  autoSnapshot: 10,
};
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
  'nodeTemplate',
  'defaultNode',
  'lens',
  'implementation',
]);

type BuildFlowSurfaceCapabilitiesOptions = {
  enabledPackages: ReadonlySet<string>;
  providerRegistry?: FlowSurfaceCapabilityRegistryLike;
  autoSnapshots?: readonly FlowSurfaceAutoSnapshot[];
  admissionReports?: readonly FlowSurfaceCapabilityAdmissionReport[];
  capabilityPolicyConfig?: FlowSurfaceCapabilityPolicyConfig | NormalizedFlowSurfaceCapabilityPolicyConfig;
  providerCapabilities?: readonly FlowSurfaceCollectedProviderCapability[];
  catalog: (
    values: FlowSurfaceCatalogValues,
    providerCapabilities: readonly FlowSurfaceCollectedProviderCapability[],
  ) => Promise<FlowSurfaceCatalogResponse>;
  generatedAt?: string;
  includeCatalogSettingsSchema?: boolean;
};

type NormalizedCapabilitiesRequest = {
  kinds: Set<FlowSurfaceCapabilityKind>;
  publicTypes: Set<string>;
  ownerPlugins: Set<string>;
  query: string;
  includeUnavailable: boolean;
  includeWarnings: boolean;
  includeCatalogSettingsSchema: boolean;
  limit?: number;
  expand: Set<string>;
  targetHintUsed: boolean;
  catalogTargetUid?: string;
  catalogValues: FlowSurfaceCatalogValues;
};

export async function buildFlowSurfaceCapabilitiesResponse(
  input: FlowSurfaceCapabilitiesValues = {},
  options: BuildFlowSurfaceCapabilitiesOptions,
): Promise<FlowSurfaceCapabilitiesResponse> {
  const request = normalizeCapabilitiesRequest(input, {
    includeCatalogSettingsSchema: options.includeCatalogSettingsSchema === true,
  });
  const capabilityPolicyConfig = normalizeFlowSurfaceCapabilityPolicyConfig(options.capabilityPolicyConfig);
  const providerCapabilities =
    options.providerCapabilities ||
    (request.kinds.has('block')
      ? await collectNormalizedProviderCapabilities({
          providerRegistry: options.providerRegistry,
          enabledPackages: options.enabledPackages,
          providerTimeoutMs: capabilityPolicyConfig.providerTimeoutMs,
        })
      : []);
  const catalog = await options.catalog(request.catalogValues, providerCapabilities);
  const providerItems = request.targetHintUsed
    ? []
    : await collectProviderPublicCapabilities({
        providerRegistry: options.providerRegistry,
        enabledPackages: options.enabledPackages,
        providerTimeoutMs: capabilityPolicyConfig.providerTimeoutMs,
        providerCapabilities,
      });
  const autoSnapshotItems = request.targetHintUsed
    ? []
    : collectAutoSnapshotPublicCapabilities({
        autoSnapshots: options.autoSnapshots,
        enabledPackages: options.enabledPackages,
      });
  const projectedItems = [
    ...collectCatalogCapabilityItems(catalog)
      .map((item) => projectCatalogCapabilityItem(item, request))
      .filter((item): item is FlowSurfacePublicCapabilityItem => !!item),
    ...providerItems.map((item) => projectProviderCapabilityItem(item, request)),
    ...autoSnapshotItems.map((item) => projectProviderCapabilityItem(item, request)),
  ].filter((item): item is FlowSurfacePublicCapabilityItem => !!item);
  const data = arbitratePublicTypeConflicts(dedupeCapabilityItems(projectedItems))
    .map((item) => applyFlowSurfaceCapabilityWritePolicy(item, capabilityPolicyConfig))
    .map((item) =>
      applyVerifiedAutoAdmissionProjection(item, {
        capabilityPolicyConfig,
        admissionReports: options.admissionReports,
      }),
    )
    .filter((item) => filterCapabilityItem(item, request));
  const limitedData = typeof request.limit === 'number' ? data.slice(0, request.limit) : data;

  return {
    data: limitedData,
    meta: {
      version: 1,
      generatedAt: options.generatedAt || new Date().toISOString(),
      enabledPlugins: buildVisiblePluginOwners(limitedData),
      registrySources: buildRegistrySources(limitedData),
      targetHintUsed: request.targetHintUsed,
    },
  };
}

export async function buildFlowSurfaceDescribeCapabilityResponse(
  input: FlowSurfaceDescribeCapabilityValues = {},
  options: BuildFlowSurfaceCapabilitiesOptions,
): Promise<FlowSurfaceDescribeCapabilityResponse> {
  const request = normalizeDescribeCapabilityRequest(input);
  const capabilityPolicyConfig = normalizeFlowSurfaceCapabilityPolicyConfig(options.capabilityPolicyConfig);
  const providerCapabilities =
    options.providerCapabilities ||
    (!request.kind || request.kind === 'block'
      ? await collectNormalizedProviderCapabilities({
          providerRegistry: options.providerRegistry,
          enabledPackages: options.enabledPackages,
          providerTimeoutMs: capabilityPolicyConfig.providerTimeoutMs,
        })
      : []);
  const sharedOptions = { ...options, providerCapabilities };
  const response = await buildDescribeCapabilityListResponse(request, sharedOptions, request.target);
  let data = findBestDescribeCapabilityMatch(response.data, request);
  if (!data && request.target) {
    const globalResponse = await buildDescribeCapabilityListResponse(request, sharedOptions, undefined, {
      includeAutoSnapshots: false,
    });
    data = findBestDescribeCapabilityMatch(globalResponse.data, request);
  }
  if (!data || shouldHideUnavailableCapability(data, request.includeUnavailable)) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces describeCapability did not find a matching capability`,
      undefined,
      {
        details: {
          reasonCode: 'unsupported',
          reasonSource: 'registry',
          ...(request.capabilityId ? { capabilityId: request.capabilityId } : {}),
          ...(request.publicType ? { publicType: request.publicType } : {}),
          ...(request.ownerPlugin ? { ownerPlugin: request.ownerPlugin } : {}),
        },
      },
    );
  }

  return {
    data,
    meta: {
      version: 1,
      generatedAt: response.meta.generatedAt,
      targetHintUsed: !!request.target,
    },
  };
}

function buildDescribeCapabilityListResponse(
  request: NormalizedDescribeCapabilityRequest,
  options: BuildFlowSurfaceCapabilitiesOptions,
  target?: FlowSurfaceCapabilitiesValues['target'],
  extraOptions: { includeAutoSnapshots?: boolean } = {},
) {
  return buildFlowSurfaceCapabilitiesResponse(
    {
      ...(request.kind ? { kinds: [request.kind] } : {}),
      ...(request.publicType ? { publicTypes: [request.publicType] } : {}),
      ...(request.ownerPlugin ? { ownerPlugins: [request.ownerPlugin] } : {}),
      ...(target ? { target } : {}),
      includeUnavailable: true,
      includeWarnings: true,
      expand: request.expand,
    },
    {
      ...options,
      ...(extraOptions.includeAutoSnapshots === false ? { autoSnapshots: undefined } : {}),
      includeCatalogSettingsSchema: request.expand?.includes('item.settings') === true,
    },
  );
}

function findBestDescribeCapabilityMatch(
  items: FlowSurfacePublicCapabilityItem[],
  request: NormalizedDescribeCapabilityRequest,
) {
  const matches = items.filter((item) => matchesDescribeCapabilityRequest(item, request));
  if (!matches.length) {
    return undefined;
  }
  if (request.publicType) {
    return [...matches].sort((left, right) => {
      const leftScore = getDescribeCapabilityMatchPriority(left, request.publicType);
      const rightScore = getDescribeCapabilityMatchPriority(right, request.publicType);
      return rightScore - leftScore;
    })[0];
  }
  return matches[0];
}

function getDescribeCapabilityMatchPriority(item: FlowSurfacePublicCapabilityItem, requestedPublicType: string) {
  const exactBonus = item.publicType === requestedPublicType ? 5 : 0;
  const originPriority =
    item.origin === 'builtInStatic'
      ? 50
      : item.origin === 'officialManifest' ||
          item.origin === 'pluginManifest' ||
          item.origin === 'provider' ||
          item.origin === 'canaryOverlay'
        ? 40
        : getFlowSurfacePublicCapabilityInferredAuthoring(item)
          ? 30
          : 10;
  return originPriority + exactBonus;
}

function matchesDescribeCapabilityRequest(
  item: FlowSurfacePublicCapabilityItem,
  request: NormalizedDescribeCapabilityRequest,
) {
  if (request.capabilityId && item.identity?.capabilityId !== request.capabilityId) {
    return false;
  }
  if (request.kind && item.kind !== request.kind) {
    return false;
  }
  if (request.publicType && !matchesCapabilityPublicType(item, request.publicType)) {
    return false;
  }
  if (request.ownerPlugin && item.ownerPlugin !== request.ownerPlugin) {
    return false;
  }
  return true;
}

function projectProviderCapabilityItem(
  item: FlowSurfacePublicCapabilityItem,
  request: NormalizedCapabilitiesRequest,
): FlowSurfacePublicCapabilityItem | null {
  if (!request.kinds.has(item.kind)) {
    return null;
  }
  const { identity, initParamsSchema, settingsSchema, configureOptions, warnings, semantic, ...baseItem } = item;
  const projected: FlowSurfacePublicCapabilityItem = {
    ...baseItem,
    semantic: request.expand.has('item.semantic')
      ? semantic
      : {
          title: semantic.title,
          ...(semantic.aliases?.length ? { aliases: semantic.aliases } : {}),
        },
  };
  if (request.expand.has('item.identity') && identity) {
    projected.identity = identity;
  }
  if (request.expand.has('item.settings')) {
    if (initParamsSchema) {
      projected.initParamsSchema = initParamsSchema;
    }
    if (settingsSchema) {
      projected.settingsSchema = settingsSchema;
    }
    if (configureOptions) {
      projected.configureOptions = configureOptions;
    }
  }
  if (request.includeWarnings && warnings?.length) {
    projected.warnings = warnings;
  }
  return copyProjectedCapabilityMetadata(projected, item);
}

function applyVerifiedAutoAdmissionProjection(
  item: FlowSurfacePublicCapabilityItem,
  options: {
    capabilityPolicyConfig: NormalizedFlowSurfaceCapabilityPolicyConfig;
    admissionReports?: readonly FlowSurfaceCapabilityAdmissionReport[];
  },
): FlowSurfacePublicCapabilityItem {
  if (item.origin !== 'autoSnapshot' || options.capabilityPolicyConfig.writePolicy.mode !== 'verifiedAuto') {
    return item;
  }
  if (!options.admissionReports?.length) {
    return item;
  }

  const capabilityId = getFlowSurfacePublicCapabilityAdmissionCapabilityId(item);
  const evidence = resolveFlowSurfaceCapabilityAdmissionRuntimeEvidence({
    reports: options.admissionReports,
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
  if (decision.ok) {
    return enableVerifiedAutoAdmissionCreate(item);
  }
  if (!evidence.reportPlugin) {
    return item;
  }
  return blockVerifiedAutoAdmissionCreate(item, decision);
}

function enableVerifiedAutoAdmissionCreate(item: FlowSurfacePublicCapabilityItem): FlowSurfacePublicCapabilityItem {
  const availability: FlowSurfaceCapabilityAvailability = {
    ...item.availability,
    create: buildVerifiedAutoAdmissionCreateAvailability(item.availability.create),
  };
  const warnings = (item.warnings || []).filter((warning) => warning.code !== 'auto-discovered-readonly');
  const projected = {
    ...item,
    availability,
    supportLevel: resolveSupportLevel(availability),
    readiness: 'createEnabled' as const,
  };
  if (warnings.length) {
    return copyProjectedCapabilityMetadata({ ...projected, warnings }, item);
  }
  const { warnings: _warnings, ...projectedWithoutWarnings } = projected;
  return copyProjectedCapabilityMetadata(projectedWithoutWarnings, item);
}

function blockVerifiedAutoAdmissionCreate(
  item: FlowSurfacePublicCapabilityItem,
  decision: FlowSurfaceVerifiedAutoAdmissionDecision,
): FlowSurfacePublicCapabilityItem {
  const reasonCode = decision.reasonCode || 'contract-not-verified';
  const availability: FlowSurfaceCapabilityAvailability = {
    ...item.availability,
    create: blockVerifiedAutoAdmissionCreateAvailability(item.availability.create, reasonCode),
    configure: blockVerifiedAutoAdmissionConfigureAvailability(item.availability.configure, reasonCode),
  };
  return copyProjectedCapabilityMetadata(
    {
      ...item,
      availability,
      supportLevel: resolveSupportLevel(availability),
      readiness: decision.readiness,
    },
    item,
  );
}

function buildVerifiedAutoAdmissionCreateAvailability(
  state: FlowSurfaceCapabilityAvailability['create'],
): FlowSurfaceCapabilityAvailability['create'] {
  return {
    supported: true,
    ...(typeof state.acceptsInitParams === 'boolean' ? { acceptsInitParams: state.acceptsInitParams } : {}),
    ...(typeof state.acceptsSettings === 'boolean' ? { acceptsSettings: state.acceptsSettings } : {}),
  };
}

function blockVerifiedAutoAdmissionCreateAvailability(
  state: FlowSurfaceCapabilityAvailability['create'],
  reasonCode: NonNullable<FlowSurfaceVerifiedAutoAdmissionDecision['reasonCode']>,
): FlowSurfaceCapabilityAvailability['create'] {
  return {
    ...state,
    supported: false,
    reasonCode,
    reasonSource: 'registry',
  };
}

function blockVerifiedAutoAdmissionConfigureAvailability(
  state: FlowSurfaceCapabilityAvailability['configure'],
  reasonCode: NonNullable<FlowSurfaceVerifiedAutoAdmissionDecision['reasonCode']>,
): FlowSurfaceCapabilityAvailability['configure'] {
  return {
    ...state,
    supported: false,
    reasonCode,
    reasonSource: 'registry',
  };
}

function copyProjectedCapabilityMetadata(
  target: FlowSurfacePublicCapabilityItem,
  source: FlowSurfacePublicCapabilityItem,
): FlowSurfacePublicCapabilityItem {
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

type NormalizedDescribeCapabilityRequest = {
  capabilityId: string;
  kind?: FlowSurfaceCapabilityKind;
  publicType: string;
  ownerPlugin: string;
  includeUnavailable: boolean;
  expand: FlowSurfaceCapabilitiesValues['expand'];
  target?: FlowSurfaceCapabilitiesValues['target'];
};

function normalizeDescribeCapabilityRequest(
  input: FlowSurfaceDescribeCapabilityValues,
): NormalizedDescribeCapabilityRequest {
  validateSupportedDescribeCapabilityRequestShape(input);
  const kind = normalizeDescribeCapabilityKind(input.kind);
  const capabilityId = normalizeOptionalDescribeCapabilityString(input.capabilityId, 'capabilityId');
  const publicType = normalizeOptionalDescribeCapabilityString(input.publicType, 'publicType');
  const ownerPlugin = normalizeOptionalDescribeCapabilityString(input.ownerPlugin, 'ownerPlugin');
  if (!capabilityId && !publicType) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces describeCapability requires capabilityId or publicType`,
      undefined,
      {
        details: {
          reasonCode: 'target-required',
          reasonSource: 'registry',
          path: 'capabilityId',
        },
      },
    );
  }
  if (
    !input.target &&
    (kind === 'fieldComponent' || isFieldComponentCapabilityId(capabilityId)) &&
    !isAutoSnapshotFieldComponentCapabilityId(capabilityId)
  ) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces describeCapability fieldComponent lookup requires target.uid or target.targetUid`,
      undefined,
      {
        details: {
          reasonCode: 'target-required',
          reasonSource: 'catalog',
          path: 'target',
        },
      },
    );
  }

  return {
    capabilityId,
    kind,
    publicType,
    ownerPlugin,
    includeUnavailable: input.includeUnavailable === true,
    expand: normalizeDescribeCapabilityExpand(input.expand),
    target: input.target,
  };
}

function validateSupportedDescribeCapabilityRequestShape(input: FlowSurfaceDescribeCapabilityValues) {
  if (!_.isPlainObject(input)) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces describeCapability request must be an object`);
  }
  const rawInput = input as Record<string, unknown>;
  Object.keys(rawInput).forEach((key) => {
    if (!DESCRIBE_CAPABILITY_REQUEST_FIELDS.has(key)) {
      throw new FlowSurfaceBadRequestError(`flowSurfaces describeCapability ${key} is not supported`, undefined, {
        details: {
          reasonCode: 'unsupported',
          reasonSource: 'registry',
          path: key,
        },
      });
    }
  });
}

function normalizeDescribeCapabilityKind(input: unknown) {
  if (_.isUndefined(input)) {
    return undefined;
  }
  if (typeof input !== 'string') {
    throw new FlowSurfaceBadRequestError(`flowSurfaces describeCapability kind must be a string`, undefined, {
      details: {
        reasonCode: 'unsupported',
        reasonSource: 'registry',
        path: 'kind',
      },
    });
  }
  const kind = String(input || '').trim() as FlowSurfaceCapabilityKind;
  if (!FLOW_SURFACE_CAPABILITY_KIND_SET.has(kind)) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces describeCapability kind '${String(input || '')}' is not supported`,
    );
  }
  return kind;
}

function normalizeOptionalDescribeCapabilityString(input: unknown, path: string) {
  if (_.isUndefined(input)) {
    return '';
  }
  if (typeof input !== 'string') {
    throw new FlowSurfaceBadRequestError(`flowSurfaces describeCapability ${path} must be a string`, undefined, {
      details: {
        reasonCode: 'unsupported',
        reasonSource: 'registry',
        path,
      },
    });
  }
  return input.trim();
}

function isFieldComponentCapabilityId(capabilityId: string) {
  return capabilityId.split(':').includes('fieldComponent');
}

function isAutoSnapshotFieldComponentCapabilityId(capabilityId: string) {
  const [, origin, kind] = capabilityId.split(':');
  return origin === 'autoSnapshot' && kind === 'fieldComponent';
}

function normalizeDescribeCapabilityExpand(input: FlowSurfaceDescribeCapabilityValues['expand']) {
  const requestedExpand = normalizeCapabilityExpand(input);
  return Array.from(new Set(['item.identity', 'item.semantic', 'item.warnings', ...requestedExpand])) as NonNullable<
    FlowSurfaceCapabilitiesValues['expand']
  >;
}

function dedupeCapabilityItems(items: FlowSurfacePublicCapabilityItem[]) {
  const byPublicIdentity = new Map<string, FlowSurfacePublicCapabilityItem>();
  items.forEach((item) => {
    const key = [item.kind, item.ownerPlugin, item.publicType].join('::');
    const current = byPublicIdentity.get(key);
    if (!current) {
      byPublicIdentity.set(key, item);
      return;
    }
    if (getCapabilityOriginPrecedence(item) >= getCapabilityOriginPrecedence(current)) {
      byPublicIdentity.set(key, mergeAutoSnapshotDiagnostics(item, current));
      return;
    }
    byPublicIdentity.set(key, mergeAutoSnapshotDiagnostics(current, item));
  });
  return mergeAutoSnapshotDiagnosticsByModelUse(Array.from(byPublicIdentity.values()));
}

function mergeAutoSnapshotDiagnosticsByModelUse(items: FlowSurfacePublicCapabilityItem[]) {
  const winnersByModelUse = new Map<string, FlowSurfacePublicCapabilityItem>();
  items.forEach((item) => {
    if (item.origin === 'autoSnapshot') {
      return;
    }
    const keys = getCapabilityModelUseKeys(item);
    if (!keys.length) {
      return;
    }
    keys.forEach((key) => {
      const current = winnersByModelUse.get(key);
      if (!current || getCapabilityOriginPrecedence(item) >= getCapabilityOriginPrecedence(current)) {
        winnersByModelUse.set(key, item);
      }
    });
  });

  const replacements = new Map<FlowSurfacePublicCapabilityItem, FlowSurfacePublicCapabilityItem>();
  const originalWinners = new Map<FlowSurfacePublicCapabilityItem, FlowSurfacePublicCapabilityItem>();
  const absorbedAutoSnapshots = new Set<FlowSurfacePublicCapabilityItem>();
  items.forEach((item) => {
    if (item.origin !== 'autoSnapshot') {
      return;
    }
    const matchedWinner = getCapabilityModelUseKeys(item)
      .map((key) => winnersByModelUse.get(key))
      .find(Boolean);
    if (!matchedWinner) {
      return;
    }
    const originalWinner = originalWinners.get(matchedWinner) || matchedWinner;
    const mergedWinner = mergeAutoSnapshotDiagnostics(replacements.get(originalWinner) || originalWinner, item);
    replacements.set(originalWinner, mergedWinner);
    originalWinners.set(mergedWinner, originalWinner);
    getCapabilityModelUseKeys(mergedWinner).forEach((key) => winnersByModelUse.set(key, mergedWinner));
    absorbedAutoSnapshots.add(item);
  });

  return items.flatMap((item) => {
    if (absorbedAutoSnapshots.has(item)) {
      return [];
    }
    return [replacements.get(item) || item];
  });
}

function getCapabilityModelUseKeys(item: FlowSurfacePublicCapabilityItem) {
  const ownerPlugin = item.ownerPlugin === '@nocobase/client-v2' ? DEFAULT_OWNER_PLUGIN : item.ownerPlugin;
  return getFlowSurfacePublicCapabilityModelUses(item).map((modelUse) => [item.kind, ownerPlugin, modelUse].join('::'));
}

function mergeAutoSnapshotDiagnostics(
  winner: FlowSurfacePublicCapabilityItem,
  supplemental: FlowSurfacePublicCapabilityItem,
): FlowSurfacePublicCapabilityItem {
  if (winner.origin === 'autoSnapshot' || supplemental.origin !== 'autoSnapshot') {
    return winner;
  }
  const supplementalStale = supplemental.availability.render.reasonCode === 'snapshot-stale';
  const searchAliases = Array.from(
    new Set(
      supplementalStale
        ? winner.publicTypeMeta.searchAliases || []
        : [
            ...(winner.publicTypeMeta.searchAliases || []),
            ...(supplemental.publicTypeMeta.searchAliases || []),
            supplemental.publicType,
            supplemental.label,
          ].filter((value): value is string => typeof value === 'string' && value.length > 0),
    ),
  );
  const supplementalWarnings = (supplemental.warnings || []).filter(
    (warning) => warning.code !== 'auto-discovered-readonly',
  );
  const warnings = dedupeCapabilityWarnings([...(winner.warnings || []), ...supplementalWarnings]);
  return setFlowSurfacePublicCapabilityModelUse(
    {
      ...winner,
      publicTypeMeta: {
        ...winner.publicTypeMeta,
        ...(searchAliases.length ? { searchAliases } : {}),
      },
      readiness: resolveFlowSurfaceCapabilityReadiness({
        ...winner,
        warnings,
      }),
      ...(warnings.length ? { warnings } : {}),
    },
    getFlowSurfacePublicCapabilityModelUses(winner),
  );
}

function dedupeCapabilityWarnings(warnings: FlowSurfacePublicCapabilityItem['warnings']) {
  const seen = new Set<string>();
  return (warnings || []).filter((warning) => {
    const key = [warning.code, warning.message].join('::');
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function arbitratePublicTypeConflicts(items: FlowSurfacePublicCapabilityItem[]) {
  const winners = new Map<string, FlowSurfacePublicCapabilityItem>();
  items.forEach((item) => {
    const key = getPublicTypeConflictKey(item);
    const current = winners.get(key);
    if (!current || getCapabilityOriginPrecedence(item) > getCapabilityOriginPrecedence(current)) {
      winners.set(key, item);
    }
  });

  return items.map((item) =>
    winners.get(getPublicTypeConflictKey(item)) === item ? item : markPublicTypeConflict(item),
  );
}

function getPublicTypeConflictKey(item: Pick<FlowSurfacePublicCapabilityItem, 'kind' | 'publicType'>) {
  return [item.kind, item.publicType].join('::');
}

function getCapabilityOriginPrecedence(item: Pick<FlowSurfacePublicCapabilityItem, 'origin'>) {
  return CAPABILITY_ORIGIN_PRECEDENCE[item.origin] || 0;
}

function markPublicTypeConflict(item: FlowSurfacePublicCapabilityItem): FlowSurfacePublicCapabilityItem {
  const availability: FlowSurfacePublicCapabilityItem['availability'] = {
    ...item.availability,
    create: {
      ...item.availability.create,
      supported: false,
      reasonCode: 'public-type-conflict',
      reasonSource: 'registry',
    },
  };
  const warnings = [
    ...(item.warnings || []),
    ...(item.warnings?.some((warning) => warning.code === 'public-type-conflict')
      ? []
      : [
          {
            code: 'public-type-conflict' as const,
            message: `Capability publicType '${item.publicType}' is hidden because a higher-priority capability owns the same publicType.`,
          },
        ]),
  ];
  return setFlowSurfacePublicCapabilityModelUse(
    {
      ...item,
      availability,
      supportLevel: resolveSupportLevel(availability),
      readiness: 'blocked',
      warnings,
    },
    getFlowSurfacePublicCapabilityModelUses(item),
  );
}

function resolveSupportLevel(availability: FlowSurfacePublicCapabilityItem['availability']) {
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

function normalizeCapabilitiesRequest(
  input: FlowSurfaceCapabilitiesValues,
  options: { includeCatalogSettingsSchema?: boolean } = {},
): NormalizedCapabilitiesRequest {
  validateSupportedCapabilitiesRequestShape(input);
  const expand = normalizeCapabilityExpand(input.expand);
  const kinds = normalizeCapabilityKinds(input.kinds);
  const publicTypes = normalizeStringSet(input.publicTypes);
  const ownerPlugins = normalizeStringSet(input.ownerPlugins);
  const query = String(input.query || '')
    .trim()
    .toLowerCase();
  const catalogTargetUid = getCatalogTargetUid(input.target);
  const targetHintUsed = !!catalogTargetUid;
  const catalogExpand = [
    ...(expand.has('item.settings')
      ? ((options.includeCatalogSettingsSchema
          ? ['item.configureOptions', 'item.contracts']
          : ['item.configureOptions']) as FlowSurfaceCatalogValues['expand'])
      : []),
    ...(expand.has('item.identity') ? (['item.identity'] as const) : []),
  ];
  const catalogValues: FlowSurfaceCatalogValues = {
    ...(catalogTargetUid ? { target: { uid: catalogTargetUid } } : {}),
    sections: resolveCatalogSections(kinds, !!catalogTargetUid),
    ...(catalogExpand.length ? { expand: catalogExpand } : {}),
  };
  const limit = normalizeLimit(input.limit);

  return {
    kinds,
    publicTypes,
    ownerPlugins,
    query,
    includeUnavailable: input.includeUnavailable === true,
    includeWarnings: input.includeWarnings === true || expand.has('item.warnings'),
    includeCatalogSettingsSchema: options.includeCatalogSettingsSchema === true,
    limit,
    expand,
    targetHintUsed,
    catalogTargetUid,
    catalogValues,
  };
}

function validateSupportedCapabilitiesRequestShape(input: FlowSurfaceCapabilitiesValues) {
  if (!_.isPlainObject(input)) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces capabilities request must be an object`);
  }
  const rawInput = input as Record<string, unknown>;
  Object.keys(rawInput).forEach((key) => {
    if (!CAPABILITIES_REQUEST_FIELDS.has(key)) {
      throwUnsupportedCapabilitiesRequestField(key);
    }
  });
  const target = rawInput.target;
  if (_.isUndefined(target)) {
    return;
  }
  if (_.isNull(target) || !_.isPlainObject(target)) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces capabilities target must be an object`);
  }
  const targetRecord = target as Record<string, unknown>;
  Object.keys(targetRecord).forEach((key) => {
    if (!CAPABILITIES_TARGET_FIELDS.has(key)) {
      throwUnsupportedCapabilitiesRequestField(`target.${key}`);
    }
  });
  const uid = normalizeTargetUidValue(targetRecord.uid);
  const targetUid = normalizeTargetUidValue(targetRecord.targetUid);
  if (!uid && !targetUid) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces capabilities target.uid or target.targetUid is required`,
      undefined,
      {
        details: {
          reasonCode: 'target-required',
          reasonSource: 'catalog',
          path: 'target',
        },
      },
    );
  }
  if (uid && targetUid && uid !== targetUid) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces capabilities target.uid and target.targetUid must reference the same target`,
      undefined,
      {
        details: {
          reasonCode: 'unsupported',
          reasonSource: 'catalog',
          path: 'target',
        },
      },
    );
  }
}

function throwUnsupportedCapabilitiesRequestField(path: string): never {
  throw new FlowSurfaceBadRequestError(
    `flowSurfaces capabilities ${path} is reserved for future scoped discovery; use target.uid/targetUid or target-scoped catalog`,
    undefined,
    {
      details: {
        reasonCode: 'unsupported',
        reasonSource: 'catalog',
        path,
      },
    },
  );
}

function normalizeCapabilityKinds(input?: FlowSurfaceCapabilityKind[]) {
  if (_.isUndefined(input)) {
    return new Set(DEFAULT_CAPABILITY_KINDS);
  }
  if (!Array.isArray(input)) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces capabilities kinds must be an array`);
  }
  const kinds = new Set<FlowSurfaceCapabilityKind>();
  input.forEach((value, index) => {
    const kind = String(value || '').trim() as FlowSurfaceCapabilityKind;
    if (!FLOW_SURFACE_CAPABILITY_KIND_SET.has(kind)) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces capabilities kinds[${index}] '${String(value || '')}' is not supported`,
      );
    }
    kinds.add(kind);
  });
  return kinds;
}

function normalizeCapabilityExpand(input?: FlowSurfaceCapabilitiesValues['expand']) {
  const expand = new Set<string>();
  if (_.isUndefined(input)) {
    return expand;
  }
  if (!Array.isArray(input)) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces capabilities expand must be an array`);
  }
  input.forEach((value, index) => {
    const normalized = String(value || '').trim();
    if (normalized === 'debugImplementation') {
      throw new FlowSurfaceBadRequestError(`flowSurfaces capabilities expand '${normalized}' is forbidden`, undefined, {
        details: {
          reasonCode: 'debug-expand-forbidden',
          reasonSource: 'catalog',
          path: `expand[${index}]`,
        },
      });
    }
    if (!FLOW_SURFACE_CAPABILITY_EXPAND_SET.has(normalized)) {
      throw new FlowSurfaceBadRequestError(
        `flowSurfaces capabilities expand[${index}] '${String(value || '')}' is not supported`,
      );
    }
    expand.add(normalized);
  });
  return expand;
}

function normalizeStringSet(input?: string[]) {
  if (_.isUndefined(input)) {
    return new Set<string>();
  }
  if (!Array.isArray(input)) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces capabilities filter must be an array`);
  }
  return new Set(input.map((value) => String(value || '').trim()).filter(Boolean));
}

function normalizeLimit(input: unknown) {
  if (_.isUndefined(input)) {
    return undefined;
  }
  const limit = Number(input);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces capabilities limit must be a positive integer`);
  }
  return Math.min(limit, 200);
}

function getCatalogTargetUid(input: FlowSurfaceCapabilitiesValues['target']) {
  return normalizeTargetUidValue(input?.targetUid) || normalizeTargetUidValue(input?.uid);
}

function normalizeTargetUidValue(input: unknown) {
  return typeof input === 'string' ? input.trim() : '';
}

function resolveCatalogSections(
  kinds: Set<FlowSurfaceCapabilityKind>,
  targetHintUsed: boolean,
): FlowSurfaceCatalogSection[] {
  const sections: FlowSurfaceCatalogSection[] = [];
  if (kinds.has('block')) {
    sections.push('blocks');
  }
  if (kinds.has('action')) {
    sections.push('actions', 'recordActions');
  }
  if (targetHintUsed && kinds.has('fieldComponent')) {
    sections.push('fields');
  }
  return Array.from(new Set(sections));
}

function collectCatalogCapabilityItems(catalog: FlowSurfaceCatalogResponse): FlowSurfaceCatalogItem[] {
  return [
    ...(catalog.blocks || []),
    ...(catalog.actions || []),
    ...(catalog.recordActions || []),
    ...(catalog.fields || []),
  ];
}

function toCapabilityKind(item: FlowSurfaceCatalogItem): FlowSurfaceCapabilityKind {
  switch (item.kind) {
    case 'block':
      return 'block';
    case 'action':
      return 'action';
    case 'field':
      return 'fieldComponent';
    default:
      return 'block';
  }
}

function projectCatalogCapabilityItem(
  item: FlowSurfaceCatalogItem,
  request: NormalizedCapabilitiesRequest,
): FlowSurfacePublicCapabilityItem | null {
  const kind = toCapabilityKind(item);
  if (!request.kinds.has(kind)) {
    return null;
  }
  const publicType = String(item.publicType || item.type || item.key || '').trim();
  if (!publicType) {
    return null;
  }
  const acceptedAliases = sanitizeCatalogCapabilityAliases(item.acceptedAliases);
  const ownerPlugin = item.ownerPlugin || DEFAULT_OWNER_PLUGIN;
  const semantic = sanitizeCatalogCapabilitySemantic(item, publicType);
  const settingsSchema = request.includeCatalogSettingsSchema
    ? sanitizeCatalogCapabilitySchema(item.settingsSchema)
    : undefined;
  const configureOptions = request.expand.has('item.settings')
    ? sanitizeCatalogCapabilitySchema(item.configureOptions)
    : undefined;
  const availability =
    item.availability ||
    ({
      render: { supported: true },
      readback: { supported: true },
      create: {
        supported: item.createSupported !== false,
        ...(item.createSupported === false
          ? { reasonCode: 'missing-create-contract' as const, reasonSource: 'catalog' as const }
          : {}),
        acceptsInitParams: !!item.requiredInitParams?.length,
        acceptsSettings: !!item.settingsSchema || !!item.configureOptions,
      },
      configure: {
        supported: !!item.settingsSchema || !!item.configureOptions,
      },
    } as FlowSurfacePublicCapabilityItem['availability']);
  const supportLevel = item.supportLevel || (item.createSupported === false ? 'readback-only' : 'create-only');
  const origin = item.origin || 'builtInStatic';
  const warnings = item.warnings || [];
  const capability: FlowSurfacePublicCapabilityItem = {
    kind,
    publicType,
    publicTypeMeta: {
      value: publicType,
      source: 'builtIn',
      searchAliases: Array.from(new Set(resolveCatalogCapabilitySearchAliases(item, publicType, acceptedAliases))),
      ...(acceptedAliases.length ? { acceptedAliases } : {}),
    },
    label: item.label,
    ownerPlugin,
    origin,
    semantic,
    availability,
    supportLevel,
    confidence: item.confidence || 'high',
    readiness: resolveFlowSurfaceCapabilityReadiness({
      origin,
      availability,
      warnings,
    }),
    placement:
      item.placement ||
      ({
        slots: resolvePlacementSlots(item),
        ...(item.scene
          ? { scenes: [item.scene as NonNullable<FlowSurfacePublicCapabilityItem['placement']>['scenes'][number]] }
          : {}),
        ...(item.requiredInitParams?.includes('collectionName') ? { collectionRequired: true } : {}),
        ...(item.requiredInitParams?.includes('fieldPath') ? { fieldRequired: true } : {}),
      } as FlowSurfacePublicCapabilityItem['placement']),
    ...(request.expand.has('item.identity') && item.identity ? { identity: item.identity } : {}),
    ...(request.expand.has('item.settings')
      ? {
          ...(settingsSchema ? { settingsSchema } : {}),
          ...(configureOptions ? { configureOptions } : {}),
        }
      : {}),
    ...(request.includeWarnings && warnings.length ? { warnings } : {}),
  };
  if (!request.expand.has('item.semantic')) {
    capability.semantic = toLightCapabilitySemantic(semantic);
  }
  const catalogModelUses = getFlowSurfaceCatalogCapabilityModelUses(item);
  return setFlowSurfacePublicCapabilityModelUse(capability, catalogModelUses.length ? catalogModelUses : item.use);
}

function sanitizeCatalogCapabilitySchema(schema: FlowSurfaceCatalogItem['settingsSchema']) {
  if (!schema || containsUnsafePublicFragment(schema)) {
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
  const normalized = normalizeTargetUidValue(value);
  return INTERNAL_PUBLIC_PAYLOAD_KEYS.has(normalized) || /Model$/.test(normalized);
}

function isUnsafePublicToken(value: unknown) {
  const normalized = normalizeTargetUidValue(value);
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

function sanitizeCatalogCapabilitySemantic(
  item: FlowSurfaceCatalogItem,
  publicType: string,
): FlowSurfacePublicCapabilityItem['semantic'] {
  const semantic = item.semantic || {
    title: item.label,
    aliases: [item.key, publicType].filter(Boolean),
  };
  const forbiddenAliases = new Set(
    [item.use, item.fieldUse, item.wrapperUse].map((value) => String(value || '').trim()).filter(Boolean),
  );
  return {
    ...semantic,
    aliases: (semantic.aliases || [])
      .filter((alias) => {
        const normalized = String(alias || '').trim();
        return !!normalized && !forbiddenAliases.has(normalized) && !/Model$/.test(normalized);
      })
      .filter((alias, index, aliases) => aliases.indexOf(alias) === index),
  };
}

function toLightCapabilitySemantic(semantic: FlowSurfacePublicCapabilityItem['semantic']) {
  return {
    title: semantic.title,
    ...(semantic.aliases?.length ? { aliases: semantic.aliases } : {}),
  };
}

function resolveCatalogCapabilitySearchAliases(
  item: FlowSurfaceCatalogItem,
  publicType: string,
  acceptedAliases: string[],
) {
  if (item.kind === 'field') {
    return [item.key, item.type, item.publicType, publicType, ...acceptedAliases].filter(Boolean) as string[];
  }
  return [item.key, item.type, publicType, ...acceptedAliases].filter(Boolean) as string[];
}

function sanitizeCatalogCapabilityAliases(values: FlowSurfaceCatalogItem['acceptedAliases']) {
  return Array.from(
    new Set(
      (values || [])
        .map((value) => String(value || '').trim())
        .filter((value) => value && !containsUnsafePublicFragment(value)),
    ),
  );
}

function resolvePlacementSlots(
  item: FlowSurfaceCatalogItem,
): NonNullable<FlowSurfacePublicCapabilityItem['placement']>['slots'] {
  if (item.kind === 'block') {
    return ['blocks'];
  }
  if (item.kind === 'field') {
    return ['fields', 'fieldComponents'];
  }
  if (item.scope === 'record') {
    return ['recordActions'];
  }
  return ['actions'];
}

function filterCapabilityItem(item: FlowSurfacePublicCapabilityItem, request: NormalizedCapabilitiesRequest) {
  if (shouldHideUnavailableCapability(item, request.includeUnavailable)) {
    return false;
  }
  if (request.publicTypes.size && !matchesCapabilityPublicTypeSet(item, request.publicTypes)) {
    return false;
  }
  if (request.ownerPlugins.size && !request.ownerPlugins.has(item.ownerPlugin)) {
    return false;
  }
  if (!request.query) {
    return true;
  }
  const haystack = [
    item.publicType,
    item.label,
    item.ownerPlugin,
    item.semantic.title,
    item.semantic.description,
    ...(item.semantic.aliases || []),
    ...(item.semantic.domainTags || []),
    ...(item.semantic.intentTags || []),
    ...(item.publicTypeMeta.searchAliases || []),
    ...(item.publicTypeMeta.acceptedAliases || []),
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase();
  return haystack.includes(request.query);
}

function matchesCapabilityPublicType(item: FlowSurfacePublicCapabilityItem, publicType: string) {
  if (item.publicType === publicType) {
    return true;
  }
  return (item.publicTypeMeta.acceptedAliases || []).some((alias) => alias === publicType);
}

function matchesCapabilityPublicTypeSet(item: FlowSurfacePublicCapabilityItem, publicTypes: ReadonlySet<string>) {
  if (publicTypes.has(item.publicType)) {
    return true;
  }
  return (item.publicTypeMeta.acceptedAliases || []).some((alias) => publicTypes.has(alias));
}

function shouldHideUnavailableCapability(item: FlowSurfacePublicCapabilityItem, includeUnavailable: boolean) {
  if (includeUnavailable) {
    return false;
  }
  return item.availability.create.reasonCode === 'public-type-conflict' || item.availability.render.supported === false;
}

function buildRegistrySources(data: FlowSurfacePublicCapabilityItem[]) {
  const counts = new Map<FlowSurfacePublicCapabilityItem['origin'], number>();
  data.forEach((item) => counts.set(item.origin, (counts.get(item.origin) || 0) + 1));
  return Array.from(counts.entries()).map(([origin, count]) => ({
    origin,
    count,
  }));
}

function buildVisiblePluginOwners(data: FlowSurfacePublicCapabilityItem[]) {
  return Array.from(new Set(data.map((item) => item.ownerPlugin).filter(Boolean))).sort();
}
