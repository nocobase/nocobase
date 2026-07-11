/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import {
  collectAutoSnapshotPublicCapabilities,
  collectNormalizedProviderCapabilities,
  getFlowSurfacePublicCapabilityAdmissionCapabilityId,
  getFlowSurfacePublicCapabilityAdmissionIntegrity,
  getFlowSurfacePublicCapabilityInferredAuthoring,
  getFlowSurfacePublicCapabilityModelUses,
  type FlowSurfaceCapabilityRegistryLike,
  type FlowSurfaceCollectedProviderCapability,
} from './capability-registry';
import {
  resolveFlowSurfaceCapabilityAdmissionRuntimeEvidence,
  type FlowSurfaceCapabilityAdmissionReport,
} from './admission-report';
import {
  applyFlowSurfaceCapabilityWritePolicy,
  normalizeFlowSurfaceCapabilityPolicyConfig,
  resolveFlowSurfaceVerifiedAutoAdmissionDecision,
  type FlowSurfaceCapabilityPolicyConfig,
  type NormalizedFlowSurfaceCapabilityPolicyConfig,
} from './capability-policy';
import { callFlowSurfaceProvider } from './capability-provider-executor';
import { resolveJsonCreateRecipe } from './capability-recipe';
import { FlowSurfaceContractGuard } from './contract-guard';
import { FlowSurfaceBadRequestError, FlowSurfaceAggregateError, type FlowSurfaceErrorItemInput } from './errors';
import { validateFlowSurfacePayloadShape } from './payload-shape';
import {
  assertJsonInferredPopupHostContractSupported,
  resolveJsonInferredPopupHostOpenViewPath,
} from './json-inferred-popup-host';
import { buildDefinedPayload } from './service-utils';
import type { FlowSurfaceAutoPopupHost, FlowSurfaceAutoSnapshot } from './extractor/types';
import type {
  FlowSurfaceCapabilityValidationError,
  FlowSurfaceDynamicCapabilityCreateActionName,
  FlowSurfaceDynamicCapabilityCreateResponse,
  FlowSurfaceDynamicCapabilityCreateValues,
  FlowSurfaceDynamicCapabilityPublicInput,
  FlowSurfaceJsonSchema,
  FlowSurfaceNodeSpec,
  FlowSurfaceProviderCreateContext,
  FlowSurfacePublicCapabilityItem,
  FlowSurfaceReasonCode,
} from './types';

const DYNAMIC_FORBIDDEN_PUBLIC_KEYS = new Set([
  'capabilityId',
  'modelUse',
  'use',
  'props',
  'decoratorProps',
  'stepParams',
  'flowRegistry',
  'resourceInit',
  'createModelOptions',
  'node',
  'defaultNode',
  'lens',
  'implementation',
]);

const DYNAMIC_INTERNAL_PROVIDER_TOKENS = new Set([
  ...DYNAMIC_FORBIDDEN_PUBLIC_KEYS,
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
]);

type ResolveDynamicCapabilityCreateOptions = FlowSurfaceDynamicCapabilityCreateValues & {
  enabledPackages: ReadonlySet<string>;
  providerRegistry?: FlowSurfaceCapabilityRegistryLike;
  providerCapabilities?: readonly FlowSurfaceCollectedProviderCapability[];
  providerTimeoutMs?: number;
  actionName?: FlowSurfaceDynamicCapabilityCreateActionName;
  autoSnapshots?: readonly FlowSurfaceAutoSnapshot[];
  admissionReports?: readonly FlowSurfaceCapabilityAdmissionReport[];
  capabilityPolicyConfig?: FlowSurfaceCapabilityPolicyConfig | NormalizedFlowSurfaceCapabilityPolicyConfig | null;
};

type VerifiedAutoSnapshotDynamicCreateResolution =
  | {
      status: 'not-found';
    }
  | {
      status: 'blocked';
      reasonCode: FlowSurfaceReasonCode;
    }
  | {
      status: 'verified';
      capability: FlowSurfaceDynamicAutoSnapshotCreateCapability;
    };

type JsonInferredAutoSnapshotDynamicCreateResolution =
  | {
      status: 'not-found';
    }
  | {
      status: 'blocked';
      reasonCode: FlowSurfaceReasonCode;
    }
  | {
      status: 'verified';
      capability: FlowSurfaceDynamicJsonInferredSnapshotCreateCapability;
    };

type FlowSurfaceDynamicAutoSnapshotCreateCapability = {
  publicItem: ReturnType<typeof collectAutoSnapshotPublicCapabilities>[number];
  modelUse: string;
};

type FlowSurfaceDynamicJsonInferredSnapshotCreateCapability = {
  publicItem: ReturnType<typeof collectAutoSnapshotPublicCapabilities>[number];
  inferredAuthoring: NonNullable<ReturnType<typeof getFlowSurfacePublicCapabilityInferredAuthoring>>;
};

const PROVIDER_VALIDATION_ERROR_CODES = new Set<FlowSurfaceCapabilityValidationError['code']>([
  'required',
  'invalid-type',
  'invalid-enum',
  'unknown-field',
  'collection-not-found',
  'field-not-found',
  'field-interface-mismatch',
  'target-not-allowed',
  'provider-error',
  'contract-guard-failed',
  'unsupported',
]);

export async function resolveDynamicCapabilityCreate(
  input: ResolveDynamicCapabilityCreateOptions,
): Promise<FlowSurfaceDynamicCapabilityCreateResponse> {
  const kind = input.kind || 'block';
  if (kind !== 'block') {
    throw new FlowSurfaceBadRequestError(`flowSurfaces dynamic create only supports block capabilities in this slice`);
  }
  const publicType = normalizeRequiredString(input.publicType);
  if (!publicType) {
    throw new FlowSurfaceBadRequestError(`flowSurfaces dynamic create requires publicType`, undefined, {
      details: {
        reasonCode: 'unsupported',
        reasonSource: 'registry',
        path: 'publicType',
      },
    });
  }

  const publicInput: FlowSurfaceDynamicCapabilityPublicInput = {
    initParams: normalizeOptionalObject(input.initParams, 'initParams'),
    settings: normalizeOptionalObject(input.settings, 'settings'),
  };
  if (input.rawPublicPayload) {
    assertPublicPayloadDoesNotContainInternalKeys(input.rawPublicPayload);
  }
  const requestedPublicPayload = buildDynamicCapabilityPublicPayload({
    publicType,
    target: input.target,
    publicInput,
  });
  assertPublicPayloadDoesNotContainInternalKeys(requestedPublicPayload);

  const providerCapabilities =
    input.providerCapabilities ||
    (await collectNormalizedProviderCapabilities({
      providerRegistry: input.providerRegistry,
      enabledPackages: input.enabledPackages,
      providerTimeoutMs: input.providerTimeoutMs,
    }));
  const providerCapability = providerCapabilities.find((item) => {
    if (item.publicItem.kind !== kind || !matchesDynamicCapabilityPublicType(item.publicItem, publicType)) {
      return false;
    }
    return input.ownerPlugin ? item.publicItem.ownerPlugin === input.ownerPlugin : true;
  });

  if (!providerCapability) {
    const jsonInferredAutoSnapshot = resolveJsonInferredAutoSnapshotDynamicCreateCapability({
      kind,
      publicType,
      ownerPlugin: input.ownerPlugin,
      enabledPackages: input.enabledPackages,
      autoSnapshots: input.autoSnapshots,
      capabilityPolicyConfig: input.capabilityPolicyConfig,
      allowUnavailable: input.allowUnavailable === true,
    });
    if (jsonInferredAutoSnapshot.status === 'verified') {
      return resolveJsonInferredAutoSnapshotDynamicCreate({
        capability: jsonInferredAutoSnapshot.capability,
        publicInput,
        target: input.target,
        actionName: input.actionName || 'validateCapabilityCreate',
      });
    }
    if (jsonInferredAutoSnapshot.status === 'blocked') {
      throwDynamicCreateNotEnabled(publicType, jsonInferredAutoSnapshot.reasonCode);
    }

    const verifiedAutoSnapshot = resolveVerifiedAutoSnapshotDynamicCreateCapability({
      kind,
      publicType,
      ownerPlugin: input.ownerPlugin,
      enabledPackages: input.enabledPackages,
      autoSnapshots: input.autoSnapshots,
      admissionReports: input.admissionReports,
      capabilityPolicyConfig: input.capabilityPolicyConfig,
    });
    if (verifiedAutoSnapshot.status === 'verified') {
      const autoCreateResponse = resolveVerifiedAutoSnapshotDynamicCreate({
        capability: verifiedAutoSnapshot.capability,
        publicType,
        publicInput,
        publicPayload: requestedPublicPayload,
        actionName: input.actionName || 'validateCapabilityCreate',
      });
      return autoCreateResponse;
    }
    if (verifiedAutoSnapshot.status === 'blocked') {
      throwDynamicCreateNotEnabled(publicType, verifiedAutoSnapshot.reasonCode);
    }
    throwUnsupportedDynamicCreate(publicType);
  }
  const policyProjectedProviderCapability = {
    ...providerCapability,
    publicItem: applyFlowSurfaceCapabilityWritePolicy(providerCapability.publicItem, input.capabilityPolicyConfig),
  };
  const canonicalPublicType = policyProjectedProviderCapability.publicItem.publicType;
  const publicPayload = buildDynamicCapabilityPublicPayload({
    publicType: canonicalPublicType,
    target: input.target,
    publicInput,
  });
  assertPublicPayloadDoesNotContainInternalKeys(publicPayload);
  const resolveCreate = policyProjectedProviderCapability.provider.resolveCreate;
  if (!input.allowUnavailable && !policyProjectedProviderCapability.publicItem.availability.create.supported) {
    throw new FlowSurfaceBadRequestError(
      `flowSurfaces dynamic create capability '${canonicalPublicType}' is not enabled for writes`,
      undefined,
      {
        details: {
          reasonCode: policyProjectedProviderCapability.publicItem.availability.create.reasonCode || 'unsupported',
          reasonSource: policyProjectedProviderCapability.publicItem.availability.create.reasonSource || 'registry',
          publicType: canonicalPublicType,
        },
      },
    );
  }
  if (!resolveCreate && !policyProjectedProviderCapability.createRecipe) {
    throwMissingCreateContract(canonicalPublicType);
  }

  const validationErrors = [
    ...validateJsonObjectSchema(
      policyProjectedProviderCapability.publicItem.initParamsSchema,
      publicInput.initParams || {},
      'initParams',
    ),
    ...validateJsonObjectSchema(
      policyProjectedProviderCapability.publicItem.settingsSchema,
      publicInput.settings || {},
      'settings',
    ),
  ];
  if (validationErrors.length) {
    throwCapabilityValidationErrors(validationErrors);
  }

  const ctx: FlowSurfaceProviderCreateContext = {
    actionName: input.actionName || 'validateCapabilityCreate',
    enabledPlugins: input.enabledPackages,
    ...(input.target ? { target: input.target } : {}),
  };
  const runtimeCapability = {
    publicItem: policyProjectedProviderCapability.publicItem,
    implementation: policyProjectedProviderCapability.implementation,
  };

  const validateSettings = policyProjectedProviderCapability.provider.validateSettings;
  if (validateSettings) {
    const validation = await callFlowSurfaceProvider({
      provider: policyProjectedProviderCapability.provider,
      method: 'validateSettings',
      timeoutMs: input.providerTimeoutMs,
      run: () => validateSettings(runtimeCapability, publicInput, ctx),
    });
    if (validation.ok === false) {
      throwCapabilityValidationErrors([
        {
          path: 'settings',
          code: 'provider-error',
          message: sanitizeProviderPublicMessage(validation.message, 'provider validateSettings failed'),
        },
      ]);
    }
    if (!validation.value.ok) {
      throwCapabilityValidationErrors(
        normalizeProviderValidationErrors(validation.value.errors, {
          initParamsSchema: policyProjectedProviderCapability.publicItem.initParamsSchema,
          settingsSchema: policyProjectedProviderCapability.publicItem.settingsSchema,
        }),
      );
    }
  }

  let createdNode: FlowSurfaceNodeSpec;
  if (policyProjectedProviderCapability.createRecipe) {
    createdNode = resolveJsonCreateRecipe({
      recipe: policyProjectedProviderCapability.createRecipe,
      publicInput,
    });
  } else {
    const providerResolveCreate = resolveCreate;
    if (!providerResolveCreate) {
      throwMissingCreateContract(canonicalPublicType);
    }
    const created = await callFlowSurfaceProvider({
      provider: policyProjectedProviderCapability.provider,
      method: 'resolveCreate',
      timeoutMs: input.providerTimeoutMs,
      run: () => providerResolveCreate(runtimeCapability, publicInput, ctx),
    });
    if (created.ok === false) {
      throwCapabilityValidationErrors([
        {
          path: 'settings',
          code: 'provider-error',
          message: sanitizeProviderPublicMessage(created.message, 'provider resolveCreate failed'),
        },
      ]);
    }
    createdNode = created.value;
  }

  try {
    validateFlowSurfacePayloadShape(ctx.actionName, createdNode, 'node');
    new FlowSurfaceContractGuard().validateNodeTreeAgainstContract(createdNode);
  } catch (error) {
    const message = sanitizeProviderPublicMessage(
      error instanceof Error ? error.message : '',
      'generated node failed contract guard',
    );
    throwCapabilityValidationErrors([
      {
        path: 'settings',
        code: 'contract-guard-failed',
        message,
      },
    ]);
  }

  return {
    capability: policyProjectedProviderCapability.publicItem,
    publicPayload,
    node: createdNode,
    warnings: policyProjectedProviderCapability.publicItem.warnings || [],
  };
}

function buildDynamicCapabilityPublicPayload(input: {
  publicType: string;
  target?: ResolveDynamicCapabilityCreateOptions['target'];
  publicInput: FlowSurfaceDynamicCapabilityPublicInput;
}) {
  return {
    publicType: input.publicType,
    ...(input.target ? { target: input.target } : {}),
    ...(input.publicInput.initParams ? { initParams: input.publicInput.initParams } : {}),
    ...(input.publicInput.settings ? { settings: input.publicInput.settings } : {}),
  };
}

function matchesDynamicCapabilityPublicType(item: FlowSurfacePublicCapabilityItem, publicType: string) {
  const normalizedType = normalizeRequiredString(publicType);
  if (!normalizedType) {
    return false;
  }
  if (item.publicType === normalizedType) {
    return true;
  }
  return (item.publicTypeMeta.acceptedAliases || []).some((alias) => alias === normalizedType);
}

function resolveJsonInferredAutoSnapshotDynamicCreateCapability(input: {
  kind: 'block';
  publicType: string;
  ownerPlugin?: string;
  enabledPackages: ReadonlySet<string>;
  autoSnapshots?: readonly FlowSurfaceAutoSnapshot[];
  capabilityPolicyConfig?: FlowSurfaceCapabilityPolicyConfig | NormalizedFlowSurfaceCapabilityPolicyConfig | null;
  allowUnavailable?: boolean;
}): JsonInferredAutoSnapshotDynamicCreateResolution {
  const candidates = collectAutoSnapshotPublicCapabilities({
    autoSnapshots: input.autoSnapshots,
    enabledPackages: input.enabledPackages,
  }).filter((capability) => {
    if (capability.kind !== input.kind) {
      return false;
    }
    return input.ownerPlugin ? capability.ownerPlugin === input.ownerPlugin : true;
  });
  const capabilityPolicyConfig = normalizeFlowSurfaceCapabilityPolicyConfig(input.capabilityPolicyConfig);
  const exactItem =
    capabilityPolicyConfig.writePolicy.mode === 'jsonInferred'
      ? undefined
      : candidates.find((capability) => capability.publicType === input.publicType);
  if (exactItem && !getFlowSurfacePublicCapabilityInferredAuthoring(exactItem)) {
    return {
      status: 'not-found',
    };
  }
  const item =
    exactItem ||
    candidates.find(
      (capability) =>
        !!getFlowSurfacePublicCapabilityInferredAuthoring(capability) &&
        matchesDynamicCapabilityPublicType(capability, input.publicType),
    );
  if (!item) {
    return {
      status: 'not-found',
    };
  }

  const policyProjectedItem = applyFlowSurfaceCapabilityWritePolicy(item, input.capabilityPolicyConfig);
  const inferredAuthoring = getFlowSurfacePublicCapabilityInferredAuthoring(policyProjectedItem);
  if (!inferredAuthoring) {
    return {
      status: 'not-found',
    };
  }
  if (!input.allowUnavailable && !policyProjectedItem.availability.create.supported) {
    return {
      status: 'blocked',
      reasonCode: policyProjectedItem.availability.create.reasonCode || 'contract-not-verified',
    };
  }
  if (!inferredAuthoring.createRecipe) {
    return {
      status: 'blocked',
      reasonCode: 'missing-create-contract',
    };
  }

  return {
    status: 'verified',
    capability: {
      publicItem: policyProjectedItem,
      inferredAuthoring,
    },
  };
}

function resolveJsonInferredAutoSnapshotDynamicCreate(input: {
  capability: FlowSurfaceDynamicJsonInferredSnapshotCreateCapability;
  publicInput: FlowSurfaceDynamicCapabilityPublicInput;
  target?: ResolveDynamicCapabilityCreateOptions['target'];
  actionName: FlowSurfaceDynamicCapabilityCreateActionName;
}): FlowSurfaceDynamicCapabilityCreateResponse {
  const publicItem = input.capability.publicItem;
  const createRecipe = input.capability.inferredAuthoring.createRecipe;
  if (!createRecipe) {
    throwMissingCreateContract(publicItem.publicType);
  }
  const validationErrors = [
    ...validateJsonObjectSchema(publicItem.initParamsSchema, input.publicInput.initParams || {}, 'initParams'),
    ...validateJsonObjectSchema(publicItem.settingsSchema, input.publicInput.settings || {}, 'settings'),
  ];
  if (validationErrors.length) {
    throwCapabilityValidationErrors(validationErrors);
  }

  const publicPayload = buildDynamicCapabilityPublicPayload({
    publicType: publicItem.publicType,
    target: input.target,
    publicInput: input.publicInput,
  });
  assertPublicPayloadDoesNotContainInternalKeys(publicPayload);
  const node = resolveJsonCreateRecipe({
    recipe: createRecipe,
    publicInput: input.publicInput,
  });
  enhanceJsonInferredCreatedNode({
    publicItem,
    inferredAuthoring: input.capability.inferredAuthoring,
    publicInput: input.publicInput,
    node,
  });
  try {
    assertJsonInferredCreatedNodeUse(publicItem.publicType, input.capability.inferredAuthoring.modelUse, node);
    validateFlowSurfacePayloadShape(input.actionName, node, 'node');
    new FlowSurfaceContractGuard().validateNodeTreeAgainstContract(node, { allowUnknownUses: true });
  } catch (error) {
    const message = sanitizeProviderPublicMessage(
      error instanceof Error ? error.message : '',
      'generated node failed contract guard',
    );
    throwCapabilityValidationErrors([
      {
        path: 'settings',
        code: 'contract-guard-failed',
        message,
      },
    ]);
  }

  return {
    capability: publicItem,
    publicPayload,
    node,
    warnings: publicItem.warnings || [],
  };
}

function enhanceJsonInferredCreatedNode(input: {
  publicItem: FlowSurfacePublicCapabilityItem;
  inferredAuthoring: FlowSurfaceDynamicJsonInferredSnapshotCreateCapability['inferredAuthoring'];
  publicInput: FlowSurfaceDynamicCapabilityPublicInput;
  node: FlowSurfaceNodeSpec;
}) {
  applyJsonInferredPopupHostOpenViews({
    node: input.node,
    popupHosts: getHighConfidenceJsonInferredPopupHosts(input.inferredAuthoring.popupHosts || []),
    publicInput: input.publicInput,
  });
}

function getHighConfidenceJsonInferredPopupHosts(popupHosts: FlowSurfaceAutoPopupHost[]) {
  return popupHosts.filter((popupHost) => !popupHost.confidence || popupHost.confidence === 'high');
}

function applyJsonInferredPopupHostOpenViews(input: {
  node: FlowSurfaceNodeSpec;
  popupHosts: FlowSurfaceAutoPopupHost[];
  publicInput: FlowSurfaceDynamicCapabilityPublicInput;
}) {
  if (!input.popupHosts.length) {
    return;
  }
  const dataSourceKey = normalizeRequiredString(input.publicInput.initParams?.dataSourceKey) || 'main';
  const collectionName = normalizeRequiredString(input.publicInput.initParams?.collectionName);
  input.popupHosts.forEach((popupHost) => assertJsonInferredPopupHostContractSupported(popupHost));
  visitJsonInferredNode(input.node, undefined, undefined, (node, parentUse, subModelKey) => {
    input.popupHosts
      .filter((popupHost) => isJsonInferredPopupHostMatch(node, popupHost, parentUse, subModelKey))
      .forEach((popupHost) =>
        ensureJsonInferredPopupHostOpenView(node, popupHost, {
          dataSourceKey,
          collectionName,
        }),
      );
  });
}

function visitJsonInferredNode(
  current: unknown,
  parentUse: string | undefined,
  subModelKey: string | undefined,
  visit: (node: Record<string, unknown>, parentUse?: string, subModelKey?: string) => void,
) {
  if (!_.isPlainObject(current)) {
    return;
  }
  const node = current as Record<string, unknown>;
  visit(node, parentUse, subModelKey);
  const currentUse = normalizeRequiredString(node.use);
  const subModels = node.subModels;
  if (!_.isPlainObject(subModels)) {
    return;
  }
  Object.entries(subModels as Record<string, unknown>).forEach(([childSubModelKey, value]) => {
    _.castArray(value).forEach((child) => visitJsonInferredNode(child, currentUse, childSubModelKey, visit));
  });
}

function isJsonInferredPopupHostMatch(
  node: Record<string, unknown>,
  popupHost: FlowSurfaceAutoPopupHost,
  parentUse?: string,
  subModelKey?: string,
) {
  const modelUse = normalizeRequiredString(popupHost.modelUse);
  if (!modelUse || normalizeRequiredString(node.use) !== modelUse) {
    return false;
  }
  const expectedParentUse = normalizeRequiredString(popupHost.parentModelUse);
  if (expectedParentUse && expectedParentUse !== normalizeRequiredString(parentUse)) {
    return false;
  }
  const expectedSubModelKey = normalizeRequiredString(popupHost.subModelKey);
  if (expectedSubModelKey && expectedSubModelKey !== normalizeRequiredString(subModelKey)) {
    return false;
  }
  return true;
}

function ensureJsonInferredPopupHostOpenView(
  node: Record<string, unknown>,
  popupHost: FlowSurfaceAutoPopupHost,
  input: { dataSourceKey: string; collectionName: string },
) {
  const openViewPath = resolveJsonInferredPopupHostOpenViewPath(popupHost);
  if (!openViewPath) {
    return;
  }
  const existing = _.get(node, openViewPath);
  const openView = buildDefinedPayload({
    mode: 'drawer',
    size: 'medium',
    pageModelClass: 'ChildPageModel',
    dataSourceKey: input.dataSourceKey,
    collectionName: input.collectionName || undefined,
    ...(_.isPlainObject(popupHost.openViewDefaults) ? _.cloneDeep(popupHost.openViewDefaults) : {}),
    ...(_.isPlainObject(existing) ? _.cloneDeep(existing) : {}),
  });
  if (Object.keys(openView).length) {
    _.set(node, openViewPath, openView);
  }
}

function assertJsonInferredCreatedNodeUse(publicType: string, expectedModelUse: string, node: FlowSurfaceNodeSpec) {
  const expectedUse = normalizeRequiredString(expectedModelUse);
  const actualUse = normalizeRequiredString(node?.use);
  if (expectedUse && actualUse === expectedUse) {
    return;
  }
  throw new Error(
    `json inferred capability '${publicType}' generated incompatible node use '${actualUse || 'unknown'}'`,
  );
}

function resolveVerifiedAutoSnapshotDynamicCreateCapability(input: {
  kind: 'block';
  publicType: string;
  ownerPlugin?: string;
  enabledPackages: ReadonlySet<string>;
  autoSnapshots?: readonly FlowSurfaceAutoSnapshot[];
  admissionReports?: readonly FlowSurfaceCapabilityAdmissionReport[];
  capabilityPolicyConfig?: FlowSurfaceCapabilityPolicyConfig | NormalizedFlowSurfaceCapabilityPolicyConfig | null;
}): VerifiedAutoSnapshotDynamicCreateResolution {
  const item = collectAutoSnapshotPublicCapabilities({
    autoSnapshots: input.autoSnapshots,
    enabledPackages: input.enabledPackages,
  }).find((capability) => {
    if (capability.kind !== input.kind || capability.publicType !== input.publicType) {
      return false;
    }
    return input.ownerPlugin ? capability.ownerPlugin === input.ownerPlugin : true;
  });
  if (!item) {
    return {
      status: 'not-found',
    };
  }

  const capabilityPolicyConfig = normalizeFlowSurfaceCapabilityPolicyConfig(input.capabilityPolicyConfig);
  const policyProjectedItem = applyFlowSurfaceCapabilityWritePolicy(item, capabilityPolicyConfig);
  const capabilityId = getFlowSurfacePublicCapabilityAdmissionCapabilityId(policyProjectedItem);
  const admissionEvidence = resolveFlowSurfaceCapabilityAdmissionRuntimeEvidence({
    reports: input.admissionReports || [],
    capability: {
      kind: policyProjectedItem.kind,
      publicType: policyProjectedItem.publicType,
      ownerPlugin: policyProjectedItem.ownerPlugin,
      ...(capabilityId ? { capabilityId } : {}),
    },
    expectedIntegrity: getFlowSurfacePublicCapabilityAdmissionIntegrity(policyProjectedItem),
  });
  const admissionDecision = resolveFlowSurfaceVerifiedAutoAdmissionDecision({
    item: policyProjectedItem,
    config: capabilityPolicyConfig,
    admissionEvidence,
  });
  if (!admissionDecision.ok) {
    return {
      status: 'blocked',
      reasonCode: admissionDecision.reasonCode || 'contract-not-verified',
    };
  }
  if (!hasStrictVerifiedAutoDynamicCreateAllowlists(capabilityPolicyConfig)) {
    return {
      status: 'blocked',
      reasonCode: 'contract-not-verified',
    };
  }
  const modelUse = resolveVerifiedAutoSnapshotDynamicCreateModelUse(item);
  if (!modelUse) {
    return {
      status: 'blocked',
      reasonCode: 'missing-create-contract',
    };
  }
  return {
    status: 'verified',
    capability: {
      publicItem: enableVerifiedAutoSnapshotDynamicCreateItem(policyProjectedItem),
      modelUse,
    },
  };
}

function hasStrictVerifiedAutoDynamicCreateAllowlists(config: NormalizedFlowSurfaceCapabilityPolicyConfig) {
  return !!config.writePolicy.allowedOwners?.length && !!config.writePolicy.allowedPublicTypes?.length;
}

function resolveVerifiedAutoSnapshotDynamicCreateModelUse(
  item: FlowSurfaceDynamicAutoSnapshotCreateCapability['publicItem'],
) {
  if (
    item.kind === 'block' &&
    item.ownerPlugin === '@nocobase/plugin-gantt' &&
    item.publicType === 'pluginGantt.gantt'
  ) {
    const modelUses = getVerifiedAutoSnapshotCapabilityModelUses(item);
    return modelUses.includes('GanttBlockModel') ? 'GanttBlockModel' : '';
  }
  return '';
}

function resolveVerifiedAutoSnapshotDynamicCreate(input: {
  capability: FlowSurfaceDynamicAutoSnapshotCreateCapability;
  publicType: string;
  publicInput: FlowSurfaceDynamicCapabilityPublicInput;
  publicPayload: Record<string, unknown>;
  actionName: FlowSurfaceDynamicCapabilityCreateActionName;
}): FlowSurfaceDynamicCapabilityCreateResponse {
  const schemas = getVerifiedAutoSnapshotDynamicCreatePublicSchemas(input.capability);
  if (!schemas) {
    throwMissingCreateContract(input.publicType);
  }
  const validationErrors = [
    ...validateJsonObjectSchema(schemas.initParamsSchema, input.publicInput.initParams || {}, 'initParams'),
    ...validateJsonObjectSchema(schemas.settingsSchema, input.publicInput.settings || {}, 'settings'),
    ...validateVerifiedAutoSnapshotDynamicCreatePublicValues(input.publicInput),
  ];
  if (validationErrors.length) {
    throwCapabilityValidationErrors(validationErrors);
  }
  const node = buildVerifiedAutoSnapshotDynamicCreateNode({
    modelUse: input.capability.modelUse,
    publicInput: input.publicInput,
  });
  try {
    validateFlowSurfacePayloadShape(input.actionName, node, 'node');
    new FlowSurfaceContractGuard().validateNodeTreeAgainstContract(node);
  } catch (error) {
    const message = sanitizeProviderPublicMessage(
      error instanceof Error ? error.message : '',
      'generated node failed contract guard',
    );
    throwCapabilityValidationErrors([
      {
        path: 'settings',
        code: 'contract-guard-failed',
        message,
      },
    ]);
  }
  return {
    capability: input.capability.publicItem,
    publicPayload: input.publicPayload,
    node,
    warnings: input.capability.publicItem.warnings || [],
  };
}

function getVerifiedAutoSnapshotDynamicCreatePublicSchemas(capability: FlowSurfaceDynamicAutoSnapshotCreateCapability) {
  if (
    capability.publicItem.kind !== 'block' ||
    capability.publicItem.ownerPlugin !== '@nocobase/plugin-gantt' ||
    capability.publicItem.publicType !== 'pluginGantt.gantt' ||
    capability.modelUse !== 'GanttBlockModel'
  ) {
    return null;
  }
  return {
    initParamsSchema: getVerifiedAutoSnapshotGanttInitParamsSchema(),
    settingsSchema: getVerifiedAutoSnapshotEmptySettingsSchema(),
  };
}

function validateVerifiedAutoSnapshotDynamicCreatePublicValues(
  publicInput: FlowSurfaceDynamicCapabilityPublicInput,
): FlowSurfaceCapabilityValidationError[] {
  if (
    Object.prototype.hasOwnProperty.call(publicInput.initParams || {}, 'collectionName') &&
    !normalizeRequiredString(publicInput.initParams?.collectionName)
  ) {
    return [
      {
        path: 'initParams.collectionName',
        code: 'required',
        message: 'initParams.collectionName is required',
      },
    ];
  }
  return [];
}

function enableVerifiedAutoSnapshotDynamicCreateItem(
  item: FlowSurfacePublicCapabilityItem,
): FlowSurfacePublicCapabilityItem {
  const availability = {
    ...item.availability,
    create: {
      supported: true,
      acceptsInitParams: true,
      acceptsSettings: false,
    },
  };
  const warnings = (item.warnings || []).filter((warning) => warning.code !== 'auto-discovered-readonly');
  const projected: FlowSurfacePublicCapabilityItem = {
    ...item,
    availability,
    supportLevel: 'create-only',
    readiness: 'createEnabled',
    initParamsSchema: getVerifiedAutoSnapshotGanttInitParamsSchema(),
    settingsSchema: getVerifiedAutoSnapshotEmptySettingsSchema(),
  };
  if (warnings.length) {
    projected.warnings = warnings;
  } else {
    delete projected.warnings;
  }
  return projected;
}

function getVerifiedAutoSnapshotGanttInitParamsSchema(): FlowSurfaceJsonSchema {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['collectionName'],
    properties: {
      collectionName: {
        type: 'string',
      },
      dataSourceKey: {
        type: 'string',
      },
    },
  };
}

function getVerifiedAutoSnapshotEmptySettingsSchema(): FlowSurfaceJsonSchema {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {},
  };
}

function buildVerifiedAutoSnapshotDynamicCreateNode(input: {
  modelUse: string;
  publicInput: FlowSurfaceDynamicCapabilityPublicInput;
}): FlowSurfaceNodeSpec {
  const collectionName = normalizeRequiredString(input.publicInput.initParams?.collectionName);
  const dataSourceKey = normalizeRequiredString(input.publicInput.initParams?.dataSourceKey) || undefined;
  return {
    use: input.modelUse,
    stepParams: {
      resourceSettings: {
        init: buildDefinedPayload({
          dataSourceKey,
          collectionName,
        }),
      },
    },
  };
}

function getVerifiedAutoSnapshotCapabilityModelUses(
  item: FlowSurfaceDynamicAutoSnapshotCreateCapability['publicItem'],
) {
  return getFlowSurfacePublicCapabilityModelUses(item)
    .map((value) => String(value || '').trim())
    .filter(Boolean);
}

function throwUnsupportedDynamicCreate(publicType: string): never {
  throw new FlowSurfaceBadRequestError(
    `flowSurfaces dynamic create capability '${publicType}' is not supported`,
    undefined,
    {
      details: {
        reasonCode: 'unsupported',
        reasonSource: 'registry',
        publicType,
      },
    },
  );
}

function throwMissingCreateContract(publicType: string): never {
  throw new FlowSurfaceBadRequestError(
    `flowSurfaces dynamic create capability '${publicType}' does not declare a create resolver`,
    undefined,
    {
      details: {
        reasonCode: 'missing-create-contract',
        reasonSource: 'registry',
        publicType,
      },
    },
  );
}

function throwDynamicCreateNotEnabled(publicType: string, reasonCode: FlowSurfaceReasonCode): never {
  throw new FlowSurfaceBadRequestError(
    `flowSurfaces dynamic create capability '${publicType}' is not enabled for writes`,
    undefined,
    {
      details: {
        reasonCode,
        reasonSource: 'registry',
        publicType,
      },
    },
  );
}

function normalizeRequiredString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeOptionalObject(value: unknown, path: string) {
  if (_.isUndefined(value)) {
    return undefined;
  }
  if (!_.isPlainObject(value)) {
    throwCapabilityValidationErrors([
      {
        path,
        code: 'invalid-type',
        message: `${path} must be an object`,
      },
    ]);
  }
  return value as Record<string, unknown>;
}

function assertPublicPayloadDoesNotContainInternalKeys(payload: Record<string, unknown>) {
  let hasInternalKey = false;
  const visit = (value: unknown, path: string) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, `${path}[${index}]`));
      return;
    }
    if (!_.isPlainObject(value)) {
      return;
    }
    Object.entries(value as Record<string, unknown>).forEach(([key, child]) => {
      const childPath = path ? `${path}.${key}` : key;
      if (DYNAMIC_INTERNAL_PROVIDER_TOKENS.has(key)) {
        hasInternalKey = true;
      }
      visit(child, childPath);
    });
  };
  visit(payload, '');
  if (hasInternalKey) {
    throwCapabilityValidationErrors([
      {
        path: 'payload',
        code: 'unsupported',
        message: 'public payload contains unsupported dynamic capability create fields',
      },
    ]);
  }
}

function validateJsonObjectSchema(
  schema: Record<string, unknown> | undefined,
  value: Record<string, unknown>,
  path: string,
): FlowSurfaceCapabilityValidationError[] {
  if (!schema) {
    return Object.keys(value).map((key) => ({
      path: `${path}.${key}`,
      code: 'unknown-field' as const,
      message: `${path}.${key} is not supported`,
    }));
  }
  if (schema.type !== 'object') {
    return [];
  }
  const properties = (_.isPlainObject(schema.properties) ? schema.properties : {}) as Record<
    string,
    FlowSurfaceJsonSchema
  >;
  const errors: FlowSurfaceCapabilityValidationError[] = [];
  const required = Array.isArray(schema.required)
    ? schema.required.filter((item): item is string => typeof item === 'string')
    : [];
  required.forEach((key) => {
    if (_.isUndefined(value[key])) {
      errors.push({
        path: `${path}.${key}`,
        code: 'required',
        message: `${path}.${key} is required`,
      });
    }
  });
  if (schema.additionalProperties === false) {
    Object.keys(value)
      .filter((key) => !properties[key])
      .forEach((key) => {
        errors.push({
          path: `${path}.${key}`,
          code: 'unknown-field',
          message: `${path}.${key} is not supported`,
        });
      });
  } else if (_.isPlainObject(schema.additionalProperties)) {
    Object.entries(value)
      .filter(([key]) => !properties[key])
      .forEach(([key, propertyValue]) => {
        errors.push(
          ...validateJsonValue(schema.additionalProperties as FlowSurfaceJsonSchema, propertyValue, `${path}.${key}`),
        );
      });
  }
  Object.entries(properties).forEach(([key, propertySchema]) => {
    if (_.isUndefined(value[key])) {
      return;
    }
    errors.push(...validateJsonValue(propertySchema, value[key], `${path}.${key}`));
  });
  return errors;
}

function validateJsonValue(
  schema: FlowSurfaceJsonSchema | undefined,
  value: unknown,
  path: string,
): FlowSurfaceCapabilityValidationError[] {
  if (!schema) {
    return [];
  }
  const type = schema.type;
  if (type === 'string' && typeof value !== 'string') {
    return invalidType(path, 'string');
  }
  if (type === 'number' && (typeof value !== 'number' || !Number.isFinite(value))) {
    return invalidType(path, 'number');
  }
  if (type === 'boolean' && typeof value !== 'boolean') {
    return invalidType(path, 'boolean');
  }
  if (type === 'object' && !_.isPlainObject(value)) {
    return invalidType(path, 'object');
  }
  if (type === 'array' && !Array.isArray(value)) {
    return invalidType(path, 'array');
  }
  const errors: FlowSurfaceCapabilityValidationError[] = [];
  if (type === 'object') {
    errors.push(...validateJsonObjectSchema(schema, value as Record<string, unknown>, path));
  }
  if (type === 'array' && _.isPlainObject(schema.items)) {
    (value as unknown[]).forEach((item, index) => {
      errors.push(...validateJsonValue(schema.items as FlowSurfaceJsonSchema, item, `${path}[${index}]`));
    });
  }
  if (Array.isArray(schema.enum) && !schema.enum.some((item) => _.isEqual(item, value))) {
    errors.push({
      path,
      code: 'invalid-enum',
      message: `${path} must be one of: ${schema.enum.join(', ')}`,
    });
  }
  if (typeof value === 'number' && typeof schema.minimum === 'number' && value < schema.minimum) {
    errors.push({
      path,
      code: 'invalid-type',
      message: `${path} must be >= ${schema.minimum}`,
    });
  }
  if (typeof value === 'number' && typeof schema.maximum === 'number' && value > schema.maximum) {
    errors.push({
      path,
      code: 'invalid-type',
      message: `${path} must be <= ${schema.maximum}`,
    });
  }
  return errors;
}

function invalidType(path: string, expected: string): FlowSurfaceCapabilityValidationError[] {
  return [
    {
      path,
      code: 'invalid-type',
      message: `${path} must be ${expected}`,
    },
  ];
}

function normalizeProviderValidationErrors(
  errors: FlowSurfaceCapabilityValidationError[] | undefined,
  schemas: {
    initParamsSchema?: FlowSurfaceJsonSchema;
    settingsSchema?: FlowSurfaceJsonSchema;
  },
): FlowSurfaceCapabilityValidationError[] {
  if (errors?.length) {
    return errors.map((error) => sanitizeProviderValidationError(error, schemas));
  }
  return [
    {
      path: 'settings',
      code: 'provider-error',
      message: 'provider validateSettings failed',
    },
  ];
}

function sanitizeProviderValidationError(
  error: FlowSurfaceCapabilityValidationError,
  schemas: {
    initParamsSchema?: FlowSurfaceJsonSchema;
    settingsSchema?: FlowSurfaceJsonSchema;
  },
): FlowSurfaceCapabilityValidationError {
  const pathResult = sanitizeProviderValidationPath(error.path, schemas);
  if (!pathResult) {
    return {
      path: 'settings',
      code: 'provider-error',
      message: 'provider validateSettings failed',
    };
  }
  return {
    path: pathResult.path,
    code: PROVIDER_VALIDATION_ERROR_CODES.has(error.code) ? error.code : 'provider-error',
    message: pathResult.truncated
      ? 'provider validateSettings failed'
      : sanitizeProviderPublicMessage(error.message, 'provider validateSettings failed'),
  };
}

function sanitizeProviderValidationPath(
  path: unknown,
  schemas: {
    initParamsSchema?: FlowSurfaceJsonSchema;
    settingsSchema?: FlowSurfaceJsonSchema;
  },
) {
  const normalized = normalizeRequiredString(path);
  if (!normalized || containsUnsafeProviderFragment(normalized)) {
    return '';
  }
  if (normalized === 'settings' || normalized === 'initParams') {
    return {
      path: normalized,
      truncated: false,
    };
  }
  const [root, ...pathSegments] = normalized.split('.');
  const schema =
    root === 'settings' ? schemas.settingsSchema : root === 'initParams' ? schemas.initParamsSchema : undefined;
  const sanitizedPath = sanitizeSchemaPath(schema, pathSegments);
  if (sanitizedPath) {
    return {
      path: [root, ...sanitizedPath.path].join('.'),
      truncated: sanitizedPath.truncated,
    };
  }
  return null;
}

function sanitizeSchemaPath(schema: FlowSurfaceJsonSchema | undefined, path: string[]) {
  if (!schema || schema.type !== 'object' || !path.length) {
    return null;
  }
  const accepted: string[] = [];
  let currentSchema: FlowSurfaceJsonSchema | undefined = schema;
  for (const segment of path) {
    if (!segment || containsUnsafeProviderFragment(segment) || currentSchema?.type !== 'object') {
      return accepted.length
        ? {
            path: accepted,
            truncated: true,
          }
        : null;
    }
    const properties = _.isPlainObject(currentSchema.properties)
      ? (currentSchema.properties as Record<string, FlowSurfaceJsonSchema>)
      : {};
    if (!Object.prototype.hasOwnProperty.call(properties, segment)) {
      return accepted.length
        ? {
            path: accepted,
            truncated: true,
          }
        : null;
    }
    accepted.push(segment);
    currentSchema = properties[segment];
  }
  return {
    path: accepted,
    truncated: false,
  };
}

function sanitizeProviderPublicMessage(message: unknown, fallback: string) {
  const normalized = normalizeRequiredString(message);
  if (!normalized || containsUnsafeProviderFragment(normalized)) {
    return fallback;
  }
  return normalized;
}

function containsUnsafeProviderFragment(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some((item) => containsUnsafeProviderFragment(item));
  }
  if (_.isPlainObject(value)) {
    return Object.entries(value as Record<string, unknown>).some(
      ([key, item]) => containsUnsafeProviderFragment(key) || containsUnsafeProviderFragment(item),
    );
  }
  const normalized = normalizeRequiredString(value);
  if (!normalized) {
    return false;
  }
  return normalized
    .split(/[^a-zA-Z0-9_$]+/)
    .filter(Boolean)
    .some((segment) => DYNAMIC_INTERNAL_PROVIDER_TOKENS.has(segment) || /Model$/.test(segment));
}

function throwCapabilityValidationErrors(errors: FlowSurfaceCapabilityValidationError[]): never {
  throw new FlowSurfaceAggregateError(
    errors.map(
      (error): FlowSurfaceErrorItemInput => ({
        message: error.message,
        path: error.path,
        ruleId: error.code,
        details: error.details,
      }),
    ),
  );
}
