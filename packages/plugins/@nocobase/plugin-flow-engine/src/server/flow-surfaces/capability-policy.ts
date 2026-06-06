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
  getFlowSurfacePublicCapabilityAdmissionCapabilityId,
  getFlowSurfacePublicCapabilityAdmissionIntegrity,
  getFlowSurfacePublicCapabilityInferredAuthoring,
  getFlowSurfacePublicCapabilityModelUses,
  setFlowSurfacePublicCapabilityAdmissionCapabilityId,
  setFlowSurfacePublicCapabilityAdmissionIntegrity,
  setFlowSurfacePublicCapabilityInferredAuthoring,
  setFlowSurfacePublicCapabilityModelUse,
} from './capability-registry';
import type {
  FlowSurfaceAdmissionRuntimeValidationFailedCheck,
  FlowSurfaceAdmissionRuntimeValidationResult,
} from './admission-report';
import type {
  FlowSurfaceCapabilityAvailability,
  FlowSurfaceCapabilityReadiness,
  FlowSurfacePublicCapabilityItem,
  FlowSurfaceReasonCode,
  FlowSurfaceSupportLevel,
} from './types';

export type FlowSurfaceCapabilityWritePolicyMode = 'discoveryOnly' | 'manifestOnly' | 'verifiedAuto' | 'jsonInferred';

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

export type NormalizedFlowSurfaceCapabilityPolicyConfig = {
  writePolicy: NormalizedFlowSurfaceCapabilityWritePolicy;
  providerTimeoutMs: number;
  extractorSnapshotDir: string;
  diagnosticsEnabled: boolean;
};

export type FlowSurfaceVerifiedAutoAdmissionDecision = {
  ok: boolean;
  readiness: FlowSurfaceCapabilityReadiness;
  reasonCode?: FlowSurfaceReasonCode;
  failedChecks: FlowSurfaceAdmissionRuntimeValidationFailedCheck[];
};

export type ResolveFlowSurfaceVerifiedAutoAdmissionDecisionInput = {
  item: FlowSurfacePublicCapabilityItem;
  config?: FlowSurfaceCapabilityPolicyConfig | NormalizedFlowSurfaceCapabilityPolicyConfig | null;
  admissionEvidence?: FlowSurfaceAdmissionRuntimeValidationResult | null;
};

const DEFAULT_PROVIDER_TIMEOUT_MS = 3000;
const DEFAULT_EXTRACTOR_SNAPSHOT_DIR = 'flow-surfaces-capabilities';
const FLOW_SURFACE_CAPABILITY_WRITE_POLICY_MODES = new Set<FlowSurfaceCapabilityWritePolicyMode>([
  'discoveryOnly',
  'manifestOnly',
  'verifiedAuto',
  'jsonInferred',
]);

export function normalizeFlowSurfaceCapabilityPolicyConfig(
  input?: unknown,
): NormalizedFlowSurfaceCapabilityPolicyConfig {
  const config = isPlainRecord(input) ? input : {};
  const writePolicy = normalizeFlowSurfaceCapabilityWritePolicy(config.writePolicy);
  return {
    writePolicy,
    providerTimeoutMs: normalizePositiveInteger(config.providerTimeoutMs, DEFAULT_PROVIDER_TIMEOUT_MS),
    extractorSnapshotDir:
      normalizeStringOption(config.extractorSnapshotDir) || storagePathJoin(DEFAULT_EXTRACTOR_SNAPSHOT_DIR),
    diagnosticsEnabled:
      typeof config.diagnosticsEnabled === 'boolean'
        ? config.diagnosticsEnabled
        : process.env.NODE_ENV !== 'production',
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
    const reasonCode = normalized.writePolicy.mode === 'verifiedAuto' ? 'contract-not-verified' : 'manifest-required';
    return blockFlowSurfaceCapabilityWrites(item, reasonCode);
  }

  return item;
}

export function resolveFlowSurfaceVerifiedAutoAdmissionDecision(
  input: ResolveFlowSurfaceVerifiedAutoAdmissionDecisionInput,
): FlowSurfaceVerifiedAutoAdmissionDecision {
  const normalized = isNormalizedPolicyConfig(input.config)
    ? input.config
    : normalizeFlowSurfaceCapabilityPolicyConfig(input.config);
  if (input.item.origin !== 'autoSnapshot') {
    return buildBlockedVerifiedAutoAdmissionDecision(
      input.item.readiness,
      'unsupported',
      'Verified auto admission only applies to auto snapshot capabilities.',
    );
  }

  if (normalized.writePolicy.mode !== 'verifiedAuto') {
    const reasonCode = normalized.writePolicy.mode === 'discoveryOnly' ? 'contract-not-verified' : 'manifest-required';
    return buildBlockedVerifiedAutoAdmissionDecision(
      input.item.readiness,
      reasonCode,
      'Verified auto admission requires writePolicy.mode to be verifiedAuto.',
    );
  }

  if (!isFixtureScopedVerifiedAutoAdmissionCapability(input.item)) {
    return buildBlockedVerifiedAutoAdmissionDecision(
      input.item.readiness,
      'contract-not-verified',
      'Verified auto admission is limited to the admitted Gantt block capability in this slice.',
    );
  }

  if (!matchesFlowSurfaceCapabilityWritePolicyAllowlist(input.item, normalized.writePolicy)) {
    return buildBlockedVerifiedAutoAdmissionDecision(
      input.item.readiness,
      'contract-not-verified',
      'Verified auto admission requires the owner and publicType to match the write policy allowlist.',
    );
  }

  if (input.item.readiness === 'blocked') {
    const reasonCode = resolveBlockedVerifiedAutoAdmissionReasonCode(input.item);
    return buildBlockedVerifiedAutoAdmissionDecision(
      'blocked',
      reasonCode,
      'Verified auto admission requires an unblocked auto snapshot capability.',
    );
  }

  if (!input.admissionEvidence) {
    return {
      ok: false,
      readiness: 'blocked',
      reasonCode: 'contract-not-verified',
      failedChecks: [
        {
          key: 'admissionRecord',
          reasonCode: 'contract-not-verified',
          message: 'Verified auto admission requires matching runtime admission evidence.',
        },
      ],
    };
  }

  if (!input.admissionEvidence.ok || input.admissionEvidence.readiness !== 'createEnabled') {
    const reasonCode = input.admissionEvidence.reasonCode || 'contract-not-verified';
    return {
      ok: false,
      readiness: input.admissionEvidence.readiness || 'blocked',
      reasonCode,
      failedChecks: input.admissionEvidence.failedChecks.length
        ? input.admissionEvidence.failedChecks
        : [
            {
              key: 'readiness',
              reasonCode,
              message: 'Verified auto admission evidence is not createEnabled.',
            },
          ],
    };
  }

  return {
    ok: true,
    readiness: 'createEnabled',
    failedChecks: [],
  };
}

function isFixtureScopedVerifiedAutoAdmissionCapability(item: FlowSurfacePublicCapabilityItem) {
  return (
    item.kind === 'block' &&
    item.ownerPlugin === '@nocobase/plugin-gantt' &&
    item.publicType === 'pluginGantt.gantt' &&
    getFlowSurfacePublicCapabilityModelUses(item).includes('GanttBlockModel')
  );
}

function normalizeFlowSurfaceCapabilityWritePolicy(input: unknown): NormalizedFlowSurfaceCapabilityWritePolicy {
  const policy = isPlainRecord(input) ? input : {};
  const allowedOwners = normalizeStringList(policy.allowedOwners);
  const allowedPublicTypes = normalizeStringList(policy.allowedPublicTypes);
  const mode =
    typeof policy.mode === 'string' &&
    FLOW_SURFACE_CAPABILITY_WRITE_POLICY_MODES.has(policy.mode as FlowSurfaceCapabilityWritePolicyMode)
      ? (policy.mode as FlowSurfaceCapabilityWritePolicyMode)
      : 'jsonInferred';
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
    setFlowSurfacePublicCapabilityAdmissionIntegrity(
      setFlowSurfacePublicCapabilityAdmissionCapabilityId(
        setFlowSurfacePublicCapabilityModelUse(
          {
            ...item,
            availability,
            supportLevel: resolveFlowSurfaceSupportLevel(availability),
            readiness: options.readiness || resolveFlowSurfacePolicyReadiness(item, availability),
          },
          getFlowSurfacePublicCapabilityModelUses(item),
        ),
        getFlowSurfacePublicCapabilityAdmissionCapabilityId(item),
      ),
      getFlowSurfacePublicCapabilityAdmissionIntegrity(item),
    ),
    getFlowSurfacePublicCapabilityInferredAuthoring(item),
  );
}

function buildBlockedVerifiedAutoAdmissionDecision(
  readiness: FlowSurfaceCapabilityReadiness,
  reasonCode: FlowSurfaceReasonCode,
  message: string,
): FlowSurfaceVerifiedAutoAdmissionDecision {
  return {
    ok: false,
    readiness,
    reasonCode,
    failedChecks: [
      {
        key: 'admissionRecord',
        reasonCode,
        message,
      },
    ],
  };
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

function resolveBlockedVerifiedAutoAdmissionReasonCode(item: FlowSurfacePublicCapabilityItem): FlowSurfaceReasonCode {
  return (
    item.availability.render.reasonCode ||
    item.availability.create.reasonCode ||
    item.availability.configure.reasonCode ||
    'contract-not-verified'
  );
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
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : fallback;
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
