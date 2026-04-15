/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createHash } from 'node:crypto';
import _ from 'lodash';
import { normalizeFieldPath } from '../service-helpers';
import type { FlowSurfaceContextResponse, FlowSurfaceContextVarInfo } from '../types';
import { FLOW_SURFACE_REACTION_FORM_ONLY, FLOW_SURFACE_REACTION_UNSUPPORTED_TARGET_KIND } from './errors';
import { FLOW_SURFACE_REACTION_SLOT_REGISTRY } from './registry';
import { resolveReactionStorageNode } from './resolver';
import type {
  FlowSurfaceBuildReactionMetaCapabilitiesInput,
  FlowSurfaceFieldOption,
  FlowSurfaceFieldValueRule,
  FlowSurfaceFieldValueCapability,
  FlowSurfaceFieldLinkageRule,
  FlowSurfaceGetReactionMetaResult,
  FlowSurfaceLinkageCapability,
  FlowSurfaceBlockLinkageRule,
  FlowSurfaceReactionCapability,
  FlowSurfaceReactionKind,
  FlowSurfaceReactionRuleNormalizerInput,
  FlowSurfaceReactionScene,
  FlowSurfaceReactionUnavailableCapability,
  FlowSurfaceActionLinkageRule,
  FlowSurfaceResolvedReactionCapability,
} from './types';

const STRING_OPERATORS = ['$includes', '$notIncludes', '$eq', '$ne', '$empty', '$notEmpty'];
const ARRAY_OPERATORS = ['$match', '$notMatch', '$anyOf', '$noneOf', '$empty', '$notEmpty'];
const OBJECT_OPERATORS = ['$eq', '$ne'];
const DATETIME_OPERATORS = [
  '$dateOn',
  '$dateNotOn',
  '$dateBefore',
  '$dateAfter',
  '$dateNotBefore',
  '$dateNotAfter',
  '$dateBetween',
  '$empty',
  '$notEmpty',
];
const NUMBER_OPERATORS = ['$eq', '$ne', '$gt', '$gte', '$lt', '$lte', '$empty', '$notEmpty'];
const ID_OPERATORS = ['$eq', '$ne', '$exists', '$notExists'];
const ENUM_OPERATORS = ['$eq', '$ne', '$in', '$notIn', '$empty', '$notEmpty'];
const TIME_OPERATORS = ['$eq', '$neq', '$empty', '$notEmpty'];
const BOOLEAN_OPERATORS = ['$isTruly', '$isFalsy', '$empty', '$notEmpty'];

const FIELD_STATE_BY_SCENE: Record<'form' | 'details' | 'subForm', string[]> = {
  form: ['visible', 'hidden', 'hiddenReservedValue', 'required', 'notRequired', 'disabled', 'enabled'],
  details: ['visible', 'hidden', 'hiddenReservedValue'],
  subForm: ['visible', 'hidden', 'hiddenReservedValue', 'required', 'notRequired', 'disabled', 'enabled'],
};

const CONTEXT_ROOT_BY_SCENE: Partial<Record<FlowSurfaceReactionScene, string>> = {
  form: 'formValues',
  details: 'record',
  subForm: 'formValues',
};

function getAllReactionKinds(): FlowSurfaceReactionKind[] {
  return Object.keys(FLOW_SURFACE_REACTION_SLOT_REGISTRY) as FlowSurfaceReactionKind[];
}

function buildStableFingerprintString(value: any): string {
  if (_.isNil(value)) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => buildStableFingerprintString(item)).join(',')}]`;
  }
  if (_.isPlainObject(value)) {
    const entries = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${buildStableFingerprintString(value[key])}`);
    return `{${entries.join(',')}}`;
  }
  return JSON.stringify(value);
}

function buildReactionFingerprint(value: any) {
  return createHash('sha1').update(buildStableFingerprintString(value)).digest('hex');
}

function buildConditionOperatorsByPath(context: FlowSurfaceContextResponse) {
  const operatorsByPath: Record<string, string[]> = {};
  for (const [path, info] of collectContextPathEntries(context)) {
    operatorsByPath[path] = getOperatorsForContextInfo(info);
  }
  return operatorsByPath;
}

function collectContextPathEntries(context: FlowSurfaceContextResponse) {
  const result = new Map<string, FlowSurfaceContextVarInfo>();

  const visit = (prefix: string, info: FlowSurfaceContextVarInfo | undefined) => {
    if (!prefix || !info) {
      return;
    }
    result.set(prefix, info);
    for (const [childKey, childInfo] of Object.entries(info.properties || {})) {
      visit(`${prefix}.${childKey}`, childInfo);
    }
  };

  for (const [key, info] of Object.entries(context?.vars || {})) {
    visit(key, info);
  }
  return result;
}

function getOperatorsForContextInfo(info: FlowSurfaceContextVarInfo): string[] {
  const normalizedInterface = String(info?.interface || '').trim();
  if (normalizedInterface === 'checkbox') {
    return BOOLEAN_OPERATORS;
  }
  if (normalizedInterface === 'time') {
    return TIME_OPERATORS;
  }
  if (normalizedInterface === 'id') {
    return ID_OPERATORS;
  }
  if (normalizedInterface === 'multipleSelect' || normalizedInterface === 'checkboxGroup') {
    return ARRAY_OPERATORS;
  }
  if (normalizedInterface === 'select' || normalizedInterface === 'radioGroup' || (info?.enumValues || []).length) {
    return ENUM_OPERATORS;
  }

  switch (info?.type) {
    case 'number':
      return NUMBER_OPERATORS;
    case 'boolean':
      return BOOLEAN_OPERATORS;
    case 'array':
      return ARRAY_OPERATORS;
    case 'object':
      return OBJECT_OPERATORS;
    default:
      break;
  }

  if (
    ['date', 'dateOnly', 'datetime', 'datetimeNoTz', 'createdAt', 'updatedAt', 'unixTimestamp'].includes(
      normalizedInterface,
    )
  ) {
    return DATETIME_OPERATORS;
  }

  return STRING_OPERATORS;
}

function getCanonicalRulesFromNode(node: any, capability: FlowSurfaceResolvedReactionCapability) {
  const stepRoot = _.get(node, ['stepParams', capability.resolvedSlot.flowKey, capability.resolvedSlot.stepKey]);
  const rawValue =
    capability.resolvedSlot.valuePath == null ? stepRoot : _.get(stepRoot, capability.resolvedSlot.valuePath || '');
  return Array.isArray(rawValue) ? _.cloneDeep(rawValue) : [];
}

function normalizeCapabilityRules<TRule>(
  input: FlowSurfaceBuildReactionMetaCapabilitiesInput,
  capability: FlowSurfaceResolvedReactionCapability,
  canonicalRules: any[],
): TRule[] {
  const normalizer = input.normalizeRules?.[capability.kind];
  if (!normalizer) {
    return _.cloneDeep(canonicalRules) as TRule[];
  }
  return normalizer({
    kind: capability.kind,
    resolvedScene: capability.resolvedScene,
    resolvedSlot: capability.resolvedSlot,
    canonicalRules,
    node: input.resolvedTarget.node,
    context: input.context,
  } satisfies FlowSurfaceReactionRuleNormalizerInput) as TRule[];
}

function inferFieldOptionSupport(scene: FlowSurfaceReactionScene) {
  switch (scene) {
    case 'form':
      return {
        supportsDefault: true,
        supportsAssign: true,
        supportsState: FIELD_STATE_BY_SCENE.form,
      };
    case 'details':
      return {
        supportsDefault: false,
        supportsAssign: false,
        supportsState: FIELD_STATE_BY_SCENE.details,
      };
    case 'subForm':
      return {
        supportsDefault: false,
        supportsAssign: true,
        supportsState: FIELD_STATE_BY_SCENE.subForm,
      };
    default:
      return {
        supportsDefault: false,
        supportsAssign: false,
        supportsState: [],
      };
  }
}

function inferNodeFieldLabel(node: any, fallback: string) {
  const labelCandidates = [
    node?.props?.label,
    node?.decoratorProps?.label,
    node?.props?.title,
    node?.decoratorProps?.title,
    _.get(node, ['stepParams', 'cardSettings', 'titleDescription', 'title']),
  ];
  for (const candidate of labelCandidates) {
    const normalized = String(candidate || '').trim();
    if (normalized) {
      return normalized;
    }
  }
  return fallback;
}

function buildContextPathIndex(context: FlowSurfaceContextResponse) {
  const entries = collectContextPathEntries(context);
  return new Map(entries);
}

function enrichFieldOptionFromContext(
  option: FlowSurfaceFieldOption,
  contextPathIndex: Map<string, FlowSurfaceContextVarInfo>,
  scene: FlowSurfaceReactionScene,
) {
  const contextRoot = CONTEXT_ROOT_BY_SCENE[scene];
  if (!contextRoot) {
    return option;
  }
  const contextInfo = contextPathIndex.get(`${contextRoot}.${option.path}`);
  return {
    ...option,
    ...(contextInfo?.interface ? { interface: contextInfo.interface } : {}),
    ...(contextInfo?.type ? { type: contextInfo.type } : {}),
  };
}

function collectFieldOptionsFromNode(
  node: any,
  context: FlowSurfaceContextResponse,
  scene: FlowSurfaceReactionScene,
): FlowSurfaceFieldOption[] {
  const dedupe = new Map<string, FlowSurfaceFieldOption>();
  const support = inferFieldOptionSupport(scene);
  const contextPathIndex = buildContextPathIndex(context);

  const visit = (current: any) => {
    if (!current || typeof current !== 'object') {
      return;
    }
    const fieldInit =
      current?.stepParams?.fieldSettings?.init || current?.subModels?.field?.stepParams?.fieldSettings?.init;
    const fieldPath = String(fieldInit?.fieldPath || '').trim();
    if (fieldPath) {
      const normalizedPath = normalizeFieldPath(fieldPath, fieldInit?.associationPathName);
      if (normalizedPath && !dedupe.has(normalizedPath)) {
        const baseOption: FlowSurfaceFieldOption = {
          path: normalizedPath,
          label: inferNodeFieldLabel(current, normalizedPath),
          supportsDefault: support.supportsDefault,
          supportsAssign: support.supportsAssign,
          supportsState: support.supportsState,
        };
        dedupe.set(normalizedPath, enrichFieldOptionFromContext(baseOption, contextPathIndex, scene));
      }
    }
    for (const child of Object.values(current.subModels || {})) {
      const children = Array.isArray(child) ? child : [child];
      children.forEach((item) => visit(item));
    }
  };

  visit(node);
  return [...dedupe.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function collectFieldOptionsFromContext(
  context: FlowSurfaceContextResponse,
  scene: FlowSurfaceReactionScene,
): FlowSurfaceFieldOption[] {
  const contextRoot = CONTEXT_ROOT_BY_SCENE[scene];
  const support = inferFieldOptionSupport(scene);
  if (!contextRoot) {
    return [];
  }
  const root = context?.vars?.[contextRoot];
  const result = new Map<string, FlowSurfaceFieldOption>();

  const visit = (prefix: string, info: FlowSurfaceContextVarInfo | undefined) => {
    if (!prefix || !info) {
      return;
    }
    if (!info.properties || !Object.keys(info.properties).length) {
      result.set(prefix, {
        path: prefix,
        label: info.title || prefix,
        interface: info.interface,
        type: info.type,
        supportsDefault: support.supportsDefault,
        supportsAssign: support.supportsAssign,
        supportsState: support.supportsState,
      });
      return;
    }
    for (const [childKey, childInfo] of Object.entries(info.properties)) {
      visit(prefix ? `${prefix}.${childKey}` : childKey, childInfo);
    }
  };

  for (const [childKey, childInfo] of Object.entries(root?.properties || {})) {
    visit(childKey, childInfo);
  }

  return [...result.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function collectFieldOptions(
  node: any,
  context: FlowSurfaceContextResponse,
  scene: FlowSurfaceReactionScene,
): FlowSurfaceFieldOption[] {
  const fromNode = collectFieldOptionsFromNode(node, context, scene);
  return fromNode.length ? fromNode : collectFieldOptionsFromContext(context, scene);
}

function buildSupportedActions(capability: FlowSurfaceResolvedReactionCapability): Array<Record<string, any>> {
  switch (capability.kind) {
    case 'blockLinkage':
      return [{ type: 'setBlockState', states: ['visible', 'hidden'] }, { type: 'runjs' }];
    case 'actionLinkage':
      return [
        { type: 'setActionState', states: ['visible', 'hidden', 'hiddenText', 'enabled', 'disabled'] },
        { type: 'runjs' },
      ];
    case 'fieldLinkage':
      if (capability.resolvedScene === 'details') {
        return [{ type: 'setFieldState', states: FIELD_STATE_BY_SCENE.details }, { type: 'runjs' }];
      }
      if (capability.resolvedScene === 'subForm') {
        return [
          { type: 'setFieldState', states: FIELD_STATE_BY_SCENE.subForm },
          { type: 'assignField' },
          { type: 'runjs' },
        ];
      }
      return [
        { type: 'setFieldState', states: FIELD_STATE_BY_SCENE.form },
        { type: 'assignField' },
        { type: 'setFieldDefaultValue' },
        { type: 'runjs' },
      ];
    default:
      return [];
  }
}

function buildUnavailableCapability(kind: FlowSurfaceReactionKind): FlowSurfaceReactionUnavailableCapability {
  if (kind === 'fieldValue') {
    return {
      kind,
      code: FLOW_SURFACE_REACTION_FORM_ONLY,
      reason: 'Field value rules are only available on create/edit form blocks',
    };
  }
  return {
    kind,
    code: FLOW_SURFACE_REACTION_UNSUPPORTED_TARGET_KIND,
    reason: `The current target does not support ${kind}`,
  };
}

function buildCapabilityFingerprint(capability: FlowSurfaceResolvedReactionCapability, canonicalRules: any[]) {
  return buildReactionFingerprint({
    kind: capability.kind,
    scene: capability.resolvedScene,
    slot: capability.resolvedSlot,
    canonicalRules,
  });
}

function buildFieldValueCapability(
  input: FlowSurfaceBuildReactionMetaCapabilitiesInput,
  capability: FlowSurfaceResolvedReactionCapability,
): FlowSurfaceFieldValueCapability {
  const storageNode = resolveReactionStorageNode(input.resolvedTarget, capability);
  const canonicalRules = getCanonicalRulesFromNode(storageNode, capability);
  return {
    kind: 'fieldValue',
    resolvedScene: capability.resolvedScene,
    resolvedSlot: capability.resolvedSlot,
    fingerprint: buildCapabilityFingerprint(capability, canonicalRules),
    normalizedRules: normalizeCapabilityRules<FlowSurfaceFieldValueRule>(input, capability, canonicalRules),
    canonicalRules,
    context: input.context,
    targetFields: collectFieldOptions(input.resolvedTarget.node, input.context, capability.resolvedScene),
    valueExprMeta: {
      supportedSources: ['literal', 'path', 'runjs'],
      runjsScene: 'fieldValue',
    },
  };
}

function buildLinkageCapability(
  input: FlowSurfaceBuildReactionMetaCapabilitiesInput,
  capability: FlowSurfaceResolvedReactionCapability,
): FlowSurfaceLinkageCapability {
  const storageNode = resolveReactionStorageNode(input.resolvedTarget, capability);
  const canonicalRules = getCanonicalRulesFromNode(storageNode, capability);
  const base = {
    resolvedScene: capability.resolvedScene,
    resolvedSlot: capability.resolvedSlot,
    fingerprint: buildCapabilityFingerprint(capability, canonicalRules),
    canonicalRules,
    context: input.context,
    supportedActions: buildSupportedActions(capability),
    conditionMeta: {
      operatorsByPath: buildConditionOperatorsByPath(input.context),
    },
  };

  if (capability.kind === 'fieldLinkage') {
    return {
      ...base,
      kind: 'fieldLinkage',
      normalizedRules: normalizeCapabilityRules<FlowSurfaceFieldLinkageRule>(input, capability, canonicalRules),
      targetFields: collectFieldOptions(input.resolvedTarget.node, input.context, capability.resolvedScene),
      ...(capability.resolvedScene === 'details'
        ? {}
        : {
            valueExprMeta: {
              supportedSources: ['literal', 'path', 'runjs'],
              runjsScene: 'linkage' as const,
            },
          }),
    };
  }

  if (capability.kind === 'blockLinkage') {
    return {
      ...base,
      kind: 'blockLinkage',
      normalizedRules: normalizeCapabilityRules<FlowSurfaceBlockLinkageRule>(input, capability, canonicalRules),
    };
  }

  return {
    ...base,
    kind: 'actionLinkage',
    normalizedRules: normalizeCapabilityRules<FlowSurfaceActionLinkageRule>(input, capability, canonicalRules),
  };
}

export function buildReactionMetaCapabilities(
  input: FlowSurfaceBuildReactionMetaCapabilitiesInput,
): Pick<FlowSurfaceGetReactionMetaResult, 'capabilities' | 'unavailable'> {
  const capabilities: FlowSurfaceReactionCapability[] = [];
  const unavailable: FlowSurfaceReactionUnavailableCapability[] = [];
  const capabilityMap = new Map(input.resolvedTarget.capabilities.map((item) => [item.kind, item]));

  for (const kind of getAllReactionKinds()) {
    const capability = capabilityMap.get(kind);
    if (!capability) {
      unavailable.push(buildUnavailableCapability(kind));
      continue;
    }
    if (kind === 'fieldValue') {
      capabilities.push(buildFieldValueCapability(input, capability));
      continue;
    }
    capabilities.push(buildLinkageCapability(input, capability));
  }

  return {
    capabilities,
    unavailable,
  };
}

export function buildGetReactionMetaResult(
  input: FlowSurfaceBuildReactionMetaCapabilitiesInput,
): FlowSurfaceGetReactionMetaResult {
  const { capabilities, unavailable } = buildReactionMetaCapabilities(input);
  return {
    target: input.resolvedTarget.target,
    capabilities,
    unavailable,
  };
}
