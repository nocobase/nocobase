/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { throwBadRequest } from '../errors';
import { FLOW_SURFACE_REACTION_FORM_ONLY } from './errors';
import { buildReactionFingerprint } from './fingerprint';
import { getReactionSlot } from './registry';
import type {
  FlowSurfaceFieldValueRule,
  FlowSurfaceReactionSlot,
  FlowSurfaceReactionTargetSummary,
  FlowSurfaceReactionWriteResult,
} from './types';
import {
  compileReactionFilter,
  compileReactionValueExpr,
  normalizeReactionFilter,
  normalizeReactionPath,
  normalizeReactionValueExpr,
} from './value-expr';

const FLOW_SURFACE_FIELD_VALUE_SUPPORTED_USES = new Set(['CreateFormModel', 'EditFormModel']);
const FLOW_SURFACE_FIELD_VALUE_SCENE = 'form' as const;
const FLOW_SURFACE_FIELD_VALUE_SLOT = getReactionSlot(
  'fieldValue',
  FLOW_SURFACE_FIELD_VALUE_SCENE,
) as FlowSurfaceReactionSlot;

export type FlowSurfaceFieldValueTarget = FlowSurfaceReactionTargetSummary & {
  use?: string | null;
  collection?: any;
};

export type FlowSurfaceFieldValueCompileResult = FlowSurfaceReactionWriteResult<FlowSurfaceFieldValueRule> & {
  updateAssociationValues: string[];
};

export function isFieldValueTargetUseSupported(use?: string | null) {
  return FLOW_SURFACE_FIELD_VALUE_SUPPORTED_USES.has(String(use || '').trim());
}

export function assertFieldValueTargetSupported(target: FlowSurfaceFieldValueTarget) {
  if (isFieldValueTargetUseSupported(target?.use)) {
    return;
  }
  const label = target?.publicPath || target?.uid || 'target';
  throwBadRequest(
    `flowSurfaces field value rules only support createForm/editForm targets; got '${label}' (${
      target?.use || 'unknown'
    })`,
    FLOW_SURFACE_REACTION_FORM_ONLY,
  );
}

function normalizeFieldValueRule(
  rule: FlowSurfaceFieldValueRule | undefined,
  index: number,
): FlowSurfaceFieldValueRule {
  const current: Partial<FlowSurfaceFieldValueRule> = _.isPlainObject(rule) ? rule : {};
  const key = String(current.key || `idx:${index}`).trim();
  return {
    ...(key ? { key } : {}),
    enabled: current.enabled !== false,
    targetPath: normalizeReactionPath(current.targetPath, `rules[${index}].targetPath`),
    mode: current.mode === 'default' ? 'default' : 'assign',
    when: normalizeReactionFilter(current.when),
    value: normalizeReactionValueExpr(current.value),
  };
}

export function normalizeFieldValueRules(rules: FlowSurfaceFieldValueRule[] | undefined): FlowSurfaceFieldValueRule[] {
  const list = Array.isArray(rules) ? rules : [];
  return list.map((rule, index) => normalizeFieldValueRule(rule, index));
}

export function compileFieldValueRulesToCanonical(rules: FlowSurfaceFieldValueRule[] | undefined) {
  return normalizeFieldValueRules(rules).map((rule) => ({
    key: rule.key,
    enable: rule.enabled !== false,
    targetPath: rule.targetPath,
    mode: rule.mode === 'default' ? 'default' : 'assign',
    condition: compileReactionFilter(rule.when),
    value: compileReactionValueExpr(rule.value),
  }));
}

export function collectUpdateAssociationValuesFromFieldValueRules(
  items: Array<{ targetPath?: string } | any>,
  rootCollection: any,
): string[] {
  const list = Array.isArray(items) ? items : [];
  const output = new Set<string>();

  const getDeepestAssociationPath = (targetPath: string): string | null => {
    if (!rootCollection || typeof rootCollection.getField !== 'function') return null;
    if (typeof targetPath !== 'string' || !targetPath.includes('.')) return null;

    const segments = targetPath.split('.').filter(Boolean);
    if (segments.length < 2) return null;

    let currentCollection = rootCollection;
    const associationSegments: string[] = [];
    let deepest: string | null = null;
    let deepestField: any | null = null;

    for (let index = 0; index < segments.length - 1; index += 1) {
      const segment = segments[index];
      const field = currentCollection?.getField?.(segment);
      if (!field?.isAssociationField?.() || !field?.targetCollection) break;
      associationSegments.push(segment);
      deepest = associationSegments.join('.');
      deepestField = field;
      currentCollection = field.targetCollection;
    }

    if (deepest && deepestField) {
      const leaf = segments[segments.length - 1];
      const rawKey = deepestField?.targetKey ?? deepestField?.targetCollection?.filterTargetKey ?? 'id';
      const keyFields = Array.isArray(rawKey)
        ? rawKey.filter((value: any) => typeof value === 'string' && !!value)
        : typeof rawKey === 'string' && rawKey
          ? [rawKey]
          : ['id'];
      if (typeof leaf === 'string' && keyFields.includes(leaf)) {
        return null;
      }
    }

    return deepest;
  };

  for (const item of list) {
    const targetPath = typeof item?.targetPath === 'string' ? item.targetPath : '';
    if (!targetPath) continue;
    const associationPath = getDeepestAssociationPath(targetPath);
    if (associationPath) {
      output.add(associationPath);
    }
  }

  return Array.from(output);
}

export function buildFieldValueWriteResult(params: {
  target: FlowSurfaceFieldValueTarget;
  rules: FlowSurfaceFieldValueRule[] | undefined;
}): FlowSurfaceFieldValueCompileResult {
  assertFieldValueTargetSupported(params.target);
  const normalizedRules = normalizeFieldValueRules(params.rules);
  const canonicalRules = normalizedRules.map((rule) => ({
    key: rule.key,
    enable: rule.enabled !== false,
    targetPath: rule.targetPath,
    mode: rule.mode,
    condition: compileReactionFilter(rule.when),
    value: compileReactionValueExpr(rule.value),
  }));
  const fingerprint = buildReactionFingerprint({
    kind: 'fieldValue',
    scene: FLOW_SURFACE_FIELD_VALUE_SCENE,
    slot: FLOW_SURFACE_FIELD_VALUE_SLOT,
    canonicalRules,
  });

  return {
    target: {
      uid: params.target.uid,
      ...(params.target.publicPath ? { publicPath: params.target.publicPath } : {}),
    },
    resolvedScene: FLOW_SURFACE_FIELD_VALUE_SCENE,
    resolvedSlot: FLOW_SURFACE_FIELD_VALUE_SLOT,
    fingerprint,
    normalizedRules,
    canonicalRules,
    updateAssociationValues: collectUpdateAssociationValuesFromFieldValueRules(
      canonicalRules,
      params.target.collection,
    ),
  };
}
