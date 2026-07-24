/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { storagePathJoin } from '@nocobase/utils';
import { resolveFlowSurfaceCapabilityReadiness } from './capability-readiness';
import {
  getFlowSurfacePublicCapabilityInferredAuthoring,
  getFlowSurfacePublicCapabilityModelUses,
  setFlowSurfacePublicCapabilityInferredAuthoring,
  setFlowSurfacePublicCapabilityModelUse,
} from './capability-registry';
import type {
  FlowSurfaceCapabilityAvailability,
  FlowSurfaceCapabilityReadiness,
  FlowSurfacePublicCapabilityItem,
  FlowSurfaceReasonCode,
  FlowSurfaceSupportLevel,
} from './types';

export type FlowSurfaceCapabilityWritePolicyMode = 'discoveryOnly' | 'manifestOnly' | 'jsonInferred';

export type FlowSurfaceCapabilityWritePolicy = {
  mode?: FlowSurfaceCapabilityWritePolicyMode;
  allowedOwners?: string[];
  allowedPublicTypes?: string[];
};

export type FlowSurfaceCapabilityPolicyConfig = {
  writePolicy?: FlowSurfaceCapabilityWritePolicy;
  providerTimeoutMs?: number;
  extractorSnapshotDir?: string;
  diagnosticsEnabled?: boolean;
};

export type NormalizedFlowSurfaceCapabilityWritePolicy = {
  mode: FlowSurfaceCapabilityWritePolicyMode;
  allowedOwners?: string[];
  allowedPublicTypes?: string[];
};

export type FlowSurfaceCapabilityPolicyWarning = {
  code: 'invalid-policy-config';
  path: string;
  message: string;
};

export type NormalizedFlowSurfaceCapabilityPolicyConfig = {
  writePolicy: NormalizedFlowSurfaceCapabilityWritePolicy;
  providerTimeoutMs: number;
  extractorSnapshotDir: string;
  diagnosticsEnabled: boolean;
  warnings?: FlowSurfaceCapabilityPolicyWarning[];
};

const DEFAULT_PROVIDER_TIMEOUT_MS = 3000;
const DEFAULT_EXTRACTOR_SNAPSHOT_DIR = 'flow-surfaces-capabilities';
const FLOW_SURFACE_CAPABILITY_WRITE_POLICY_MODES = new Set<FlowSurfaceCapabilityWritePolicyMode>([
  'discoveryOnly',
  'manifestOnly',
  'jsonInferred',
]);

export function normalizeFlowSurfaceCapabilityPolicyConfig(
  input?: unknown,
): NormalizedFlowSurfaceCapabilityPolicyConfig {
  const config = isPlainRecord(input) ? input : {};
  const warnings: FlowSurfaceCapabilityPolicyWarning[] = [];
  const writePolicy = normalizeFlowSurfaceCapabilityWritePolicy(config.writePolicy, warnings);
  const providerTimeoutMs = normalizePositiveInteger(config.providerTimeoutMs, DEFAULT_PROVIDER_TIMEOUT_MS);
  const extractorSnapshotDir = normalizeStringOption(config.extractorSnapshotDir);
  const diagnosticsEnabled =
    typeof config.diagnosticsEnabled === 'boolean' ? config.diagnosticsEnabled : process.env.NODE_ENV !== 'production';
  if (typeof config.providerTimeoutMs !== 'undefined' && !isPositiveInteger(config.providerTimeoutMs)) {
    warnings.push({
      code: 'invalid-policy-config',
      path: 'flowSurfaceCapabilities.providerTimeoutMs',
      message: 'Invalid providerTimeoutMs; fallback to default timeout.',
    });
  }
  if (typeof config.extractorSnapshotDir !== 'undefined' && !extractorSnapshotDir) {
    warnings.push({
      code: 'invalid-policy-config',
      path: 'flowSurfaceCapabilities.extractorSnapshotDir',
      message: 'Invalid extractorSnapshotDir; fallback to default snapshot directory.',
    });
  }
  if (typeof config.diagnosticsEnabled !== 'undefined' && typeof config.diagnosticsEnabled !== 'boolean') {
    warnings.push({
      code: 'invalid-policy-config',
      path: 'flowSurfaceCapabilities.diagnosticsEnabled',
      message: 'Invalid diagnosticsEnabled; fallback to environment default.',
    });
  }
  return {
    writePolicy,
    providerTimeoutMs,
    extractorSnapshotDir: extractorSnapshotDir || storagePathJoin(DEFAULT_EXTRACTOR_SNAPSHOT_DIR),
    diagnosticsEnabled,
    ...(warnings.length ? { warnings } : {}),
  };
}

export function readFlowSurfaceCapabilityPolicyConfigFromPluginOptions(
  options: unknown,
): NormalizedFlowSurfaceCapabilityPolicyConfig {
  if (!isPlainRecord(options)) {
    return normalizeFlowSurfaceCapabilityPolicyConfig();
  }
  const flowSurfaceCapabilities = options.flowSurfaceCapabilities;
  if (isPlainRecord(flowSurfaceCapabilities)) {
    return normalizeFlowSurfaceCapabilityPolicyConfig(flowSurfaceCapabilities);
  }
  const writePolicy = options.flowSurfaceCapabilityPolicy;
  if (isPlainRecord(writePolicy)) {
    return normalizeFlowSurfaceCapabilityPolicyConfig({
      writePolicy,
    });
  }
  return normalizeFlowSurfaceCapabilityPolicyConfig();
}

export function applyFlowSurfaceCapabilityWritePolicy(
  item: FlowSurfacePublicCapabilityItem,
  config?: FlowSurfaceCapabilityPolicyConfig | NormalizedFlowSurfaceCapabilityPolicyConfig | null,
): FlowSurfacePublicCapabilityItem {
  const normalized = isNormalizedPolicyConfig(config) ? config : normalizeFlowSurfaceCapabilityPolicyConfig(config);
  if (item.origin === 'builtInStatic') {
    return item;
  }

  if (normalized.writePolicy.mode === 'discoveryOnly') {
    return blockFlowSurfaceCapabilityWrites(item, 'contract-not-verified', {
      readiness: 'blocked',
    });
  }

  if (!matchesFlowSurfaceCapabilityWritePolicyAllowlist(item, normalized.writePolicy)) {
    return blockFlowSurfaceCapabilityWrites(item, 'contract-not-verified');
  }

  if (item.origin === 'autoSnapshot') {
    if (normalized.writePolicy.mode === 'jsonInferred') {
      return item;
    }
    return blockFlowSurfaceCapabilityWrites(item, 'manifest-required');
  }

  return item;
}

function normalizeFlowSurfaceCapabilityWritePolicy(
  input: unknown,
  warnings: FlowSurfaceCapabilityPolicyWarning[],
): NormalizedFlowSurfaceCapabilityWritePolicy {
  const policy = isPlainRecord(input) ? input : {};
  const allowedOwners = normalizeStringList(policy.allowedOwners);
  const allowedPublicTypes = normalizeStringList(policy.allowedPublicTypes);
  if (typeof policy.allowedOwners !== 'undefined' && !Array.isArray(policy.allowedOwners)) {
    warnings.push({
      code: 'invalid-policy-config',
      path: 'flowSurfaceCapabilities.writePolicy.allowedOwners',
      message: 'Invalid writePolicy.allowedOwners; ignore owner allowlist.',
    });
  }
  if (typeof policy.allowedPublicTypes !== 'undefined' && !Array.isArray(policy.allowedPublicTypes)) {
    warnings.push({
      code: 'invalid-policy-config',
      path: 'flowSurfaceCapabilities.writePolicy.allowedPublicTypes',
      message: 'Invalid writePolicy.allowedPublicTypes; ignore public type allowlist.',
    });
  }
  let mode: FlowSurfaceCapabilityWritePolicyMode = 'jsonInferred';
  if (typeof policy.mode !== 'undefined') {
    mode =
      typeof policy.mode === 'string' &&
      FLOW_SURFACE_CAPABILITY_WRITE_POLICY_MODES.has(policy.mode as FlowSurfaceCapabilityWritePolicyMode)
        ? (policy.mode as FlowSurfaceCapabilityWritePolicyMode)
        : 'discoveryOnly';
    if (mode === 'discoveryOnly' && policy.mode !== 'discoveryOnly') {
      warnings.push({
        code: 'invalid-policy-config',
        path: 'flowSurfaceCapabilities.writePolicy.mode',
        message: 'Invalid writePolicy.mode; fallback to discoveryOnly.',
      });
    }
  }
  return {
    mode,
    ...(allowedOwners.length ? { allowedOwners } : {}),
    ...(allowedPublicTypes.length ? { allowedPublicTypes } : {}),
  };
}

function matchesFlowSurfaceCapabilityWritePolicyAllowlist(
  item: FlowSurfacePublicCapabilityItem,
  policy: NormalizedFlowSurfaceCapabilityWritePolicy,
) {
  if (policy.allowedOwners?.length && !policy.allowedOwners.includes(item.ownerPlugin)) {
    return false;
  }
  if (policy.allowedPublicTypes?.length && !policy.allowedPublicTypes.includes(item.publicType)) {
    return false;
  }
  return true;
}

function blockFlowSurfaceCapabilityWrites(
  item: FlowSurfacePublicCapabilityItem,
  reasonCode: FlowSurfaceReasonCode,
  options: { readiness?: FlowSurfaceCapabilityReadiness } = {},
): FlowSurfacePublicCapabilityItem {
  const availability = {
    ...item.availability,
    create: blockAvailabilityState(item.availability.create, reasonCode),
    configure: blockAvailabilityState(item.availability.configure, reasonCode),
  };
  return setFlowSurfacePublicCapabilityInferredAuthoring(
    setFlowSurfacePublicCapabilityModelUse(
      {
        ...item,
        availability,
        supportLevel: resolveFlowSurfaceSupportLevel(availability),
        readiness: options.readiness || resolveFlowSurfacePolicyReadiness(item, availability),
      },
      getFlowSurfacePublicCapabilityModelUses(item),
    ),
    getFlowSurfacePublicCapabilityInferredAuthoring(item),
  );
}

function blockAvailabilityState<T extends FlowSurfaceCapabilityAvailability['create']>(
  state: T,
  reasonCode: FlowSurfaceReasonCode,
): T {
  return {
    ...state,
    supported: false,
    reasonCode,
    reasonSource: 'registry',
  };
}

function resolveFlowSurfacePolicyReadiness(
  item: FlowSurfacePublicCapabilityItem,
  availability: FlowSurfaceCapabilityAvailability,
): FlowSurfaceCapabilityReadiness {
  return resolveFlowSurfaceCapabilityReadiness({
    origin: item.origin,
    availability,
    warnings: item.warnings,
  });
}

function resolveFlowSurfaceSupportLevel(availability: FlowSurfaceCapabilityAvailability): FlowSurfaceSupportLevel {
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

function isNormalizedPolicyConfig(value: unknown): value is NormalizedFlowSurfaceCapabilityPolicyConfig {
  const providerTimeoutMs = isPlainRecord(value) ? value.providerTimeoutMs : undefined;
  return (
    isPlainRecord(value) &&
    isPlainRecord(value.writePolicy) &&
    FLOW_SURFACE_CAPABILITY_WRITE_POLICY_MODES.has(value.writePolicy.mode as FlowSurfaceCapabilityWritePolicyMode) &&
    typeof providerTimeoutMs === 'number' &&
    Number.isInteger(providerTimeoutMs) &&
    providerTimeoutMs > 0 &&
    typeof value.extractorSnapshotDir === 'string' &&
    typeof value.diagnosticsEnabled === 'boolean'
  );
}

function normalizePositiveInteger(value: unknown, fallback: number) {
  return isPositiveInteger(value) ? value : fallback;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0;
}

function normalizeStringList(value: unknown) {
  return Array.from(
    new Set((Array.isArray(value) ? value : []).map((item) => normalizeStringOption(item)).filter(isNonEmptyString)),
  );
}

function normalizeStringOption(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
