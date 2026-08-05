/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { FlowSurfaceCapabilityReadiness, FlowSurfacePublicCapabilityItem, FlowSurfaceReasonCode } from './types';

const BLOCKING_CREATE_REASON_CODES = new Set<FlowSurfaceReasonCode>([
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

const BLOCKING_RENDER_REASON_CODES = new Set<FlowSurfaceReasonCode>([
  'plugin-disabled',
  'public-type-conflict',
  'provider-error',
  'snapshot-stale',
  'extractor-runtime-error',
  'unsafe-auto-discovery',
  'permission-denied',
  'license-required',
  'dependency-missing',
]);

export function resolveFlowSurfaceCapabilityReadiness(
  item: Pick<FlowSurfacePublicCapabilityItem, 'origin' | 'availability' | 'warnings'>,
): FlowSurfaceCapabilityReadiness {
  if (hasUnsafeSemanticWarning(item)) {
    return 'blocked';
  }

  if (item.origin === 'autoSnapshot') {
    if (
      item.availability.render.supported === false &&
      isBlockingRenderReasonCode(item.availability.render.reasonCode)
    ) {
      return 'blocked';
    }
    if (item.availability.create.supported) {
      return 'createEnabled';
    }
    return 'discovered';
  }

  if (item.availability.render.supported === false && isBlockingRenderReasonCode(item.availability.render.reasonCode)) {
    return 'blocked';
  }
  if (item.availability.create.supported === false && isBlockingCreateReasonCode(item.availability.create.reasonCode)) {
    return 'blocked';
  }

  if (item.origin === 'builtInStatic') {
    return resolveBuiltInStaticReadiness(item);
  }
  if (item.availability.create.supported) {
    // Provider/manifest capabilities need admission evidence before readiness advances past the declared contract.
    return 'contractDeclared';
  }
  if (item.availability.readback.supported) {
    return 'readbackVerified';
  }
  return 'discovered';
}

function resolveBuiltInStaticReadiness(item: Pick<FlowSurfacePublicCapabilityItem, 'availability'>) {
  if (item.availability.create.supported) {
    return 'createEnabled';
  }
  if (item.availability.readback.supported) {
    return 'readbackVerified';
  }
  return 'discovered';
}

function isBlockingCreateReasonCode(reasonCode: FlowSurfaceReasonCode | undefined) {
  return !!reasonCode && BLOCKING_CREATE_REASON_CODES.has(reasonCode);
}

function isBlockingRenderReasonCode(reasonCode: FlowSurfaceReasonCode | undefined) {
  return !!reasonCode && BLOCKING_RENDER_REASON_CODES.has(reasonCode);
}

function hasUnsafeSemanticWarning(item: Pick<FlowSurfacePublicCapabilityItem, 'warnings'>) {
  return item.warnings?.some((warning) => warning.code === 'unsafe-semantic-text') === true;
}
