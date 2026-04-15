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
import { isBareFlowContextPath } from '../context';
import { throwBadRequest } from '../errors';
import {
  FLOW_SURFACE_REACTION_INVALID_CONDITION_OPERATOR,
  FLOW_SURFACE_REACTION_INVALID_CONDITION_PATH,
  FLOW_SURFACE_REACTION_INVALID_TARGET_FIELD,
  FLOW_SURFACE_REACTION_INVALID_VALUE_PATH,
  FLOW_SURFACE_REACTION_INVALID_VALUE_SOURCE,
  FLOW_SURFACE_REACTION_UNSUPPORTED_ACTION_FOR_SCENE,
  FLOW_SURFACE_REACTION_UNSUPPORTED_TARGET_KIND,
} from './errors';
import {
  FLOW_SURFACE_ACTION_LINKAGE_STATES,
  FLOW_SURFACE_BLOCK_LINKAGE_STATES,
  FLOW_SURFACE_FIELD_LINKAGE_ACTION_TYPES_BY_SCENE,
  FLOW_SURFACE_FIELD_LINKAGE_STATES_BY_SCENE,
  FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES,
} from './registry';
import type {
  FlowSurfaceActionLinkageAction,
  FlowSurfaceActionLinkageRule,
  FlowSurfaceFieldLinkageAction,
  FlowSurfaceFieldLinkageAssignItem,
  FlowSurfaceFieldLinkageRule,
  FlowSurfaceFieldLinkageScene,
  FlowSurfaceFieldOption,
  FlowSurfaceFieldPathToUidResolver,
  FlowSurfaceFieldUidToPathResolver,
  FlowSurfaceReactionFilter,
  FlowSurfaceValueExpr,
  FlowSurfaceBlockLinkageAction,
  FlowSurfaceBlockLinkageRule,
} from './types';

type NormalizeLinkageRuleCommon = {
  key: string;
  title: string;
  enabled: boolean;
  when: FlowSurfaceReactionFilter;
};

type NormalizeFieldRuleOptions = {
  scene: FlowSurfaceFieldLinkageScene;
  resolveFieldPath?: FlowSurfaceFieldUidToPathResolver;
};

type CompileFieldRuleOptions = {
  scene: FlowSurfaceFieldLinkageScene;
  resolveFieldUid?: FlowSurfaceFieldPathToUidResolver;
};

const EMPTY_FILTER: FlowSurfaceReactionFilter = {
  logic: '$and',
  items: [],
};

const CONTEXT_EXPR_RE = /^\{\{\s*ctx(?:\.([^}]+?))?\s*\}\}$/;
const CTX_PREFIX_RE = /^ctx\./;

type FlowSurfaceLinkageValidationCapability = {
  conditionMeta: {
    operatorsByPath: Record<string, string[]>;
  };
};

type FlowSurfaceFieldLinkageValidationCapability = FlowSurfaceLinkageValidationCapability & {
  targetFields: FlowSurfaceFieldOption[];
  valueExprMeta?: {
    supportedSources: Array<'literal' | 'path' | 'runjs'>;
  };
};

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

function assertRuleArray<T>(rules: T, label: string): asserts rules is Exclude<T, null | undefined> & any[] {
  if (!Array.isArray(rules)) {
    throwBadRequest(`${label} must be an array.`);
  }
}

function normalizeKey(rawKey: unknown, fallbackPrefix: string, index: number) {
  const trimmed = typeof rawKey === 'string' ? rawKey.trim() : '';
  return trimmed || `${fallbackPrefix}-${index + 1}`;
}

function normalizeTitle(rawTitle: unknown, index: number) {
  const trimmed = typeof rawTitle === 'string' ? rawTitle.trim() : '';
  return trimmed || `Linkage rule ${index + 1}`;
}

function normalizeBoolean(rawValue: unknown, fallback = true) {
  return typeof rawValue === 'boolean' ? rawValue : fallback;
}

function extractBareContextPath(rawPath: unknown, fieldName = 'condition.path') {
  if (typeof rawPath !== 'string' || !rawPath.trim()) {
    throwBadRequest(`${fieldName} must be a non-empty string.`, FLOW_SURFACE_REACTION_INVALID_CONDITION_PATH);
  }
  const trimmed = rawPath.trim();
  const templateMatch = trimmed.match(CONTEXT_EXPR_RE);
  const bare =
    templateMatch?.[1]?.trim() || (trimmed.startsWith('ctx.') ? trimmed.replace(CTX_PREFIX_RE, '') : trimmed);

  if (!bare || !isBareFlowContextPath(bare)) {
    throwBadRequest(
      `${fieldName} must be a bare flow context path such as "record.id".`,
      FLOW_SURFACE_REACTION_INVALID_CONDITION_PATH,
    );
  }

  return bare;
}

function formatContextPath(path: string) {
  return `{{ ctx.${path} }}`;
}

function clonePlain<T>(value: T): T {
  return _.cloneDeep(value);
}

function normalizeFilterValue(value: any): any {
  if (_.isPlainObject(value) && value.source === 'path' && typeof value.path === 'string') {
    return {
      ...value,
      path: extractBareContextPath(value.path, 'condition.value.path'),
    };
  }
  if (Array.isArray(value)) {
    return value.map((item) => normalizeFilterValue(item));
  }
  if (_.isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalizeFilterValue(item)]));
  }
  return clonePlain(value);
}

function compileFilterValue(value: any): any {
  if (_.isPlainObject(value) && value.source === 'path' && typeof value.path === 'string') {
    return formatContextPath(extractBareContextPath(value.path, 'condition.value.path'));
  }
  if (Array.isArray(value)) {
    return value.map((item) => compileFilterValue(item));
  }
  if (_.isPlainObject(value)) {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, compileFilterValue(item)]));
  }
  return clonePlain(value);
}

function normalizeReactionFilter(rawFilter: unknown): FlowSurfaceReactionFilter {
  if (!rawFilter || !_.isPlainObject(rawFilter)) {
    return clonePlain(EMPTY_FILTER);
  }

  const visit = (node: any): any => {
    if (!_.isPlainObject(node)) {
      return node;
    }

    if (Array.isArray(node.items)) {
      return {
        ...Object.fromEntries(Object.entries(node).filter(([key]) => key !== 'items')),
        items: node.items.map((item: any) => visit(item)),
      };
    }

    const next = { ...node } as Record<string, any>;
    if ('path' in next) {
      next.path = extractBareContextPath(next.path);
    }
    if ('value' in next) {
      next.value = normalizeFilterValue(next.value);
    }
    return next;
  };

  return visit(rawFilter);
}

function compileReactionFilter(filter: FlowSurfaceReactionFilter) {
  const visit = (node: any): any => {
    if (!_.isPlainObject(node)) {
      return clonePlain(node);
    }

    if (Array.isArray(node.items)) {
      return {
        ...Object.fromEntries(Object.entries(node).filter(([key]) => key !== 'items')),
        items: node.items.map((item: any) => visit(item)),
      };
    }

    const next = { ...node } as Record<string, any>;
    if ('path' in next && typeof next.path === 'string') {
      next.path = formatContextPath(extractBareContextPath(next.path));
    }
    if ('value' in next) {
      next.value = compileFilterValue(next.value);
    }
    return next;
  };

  return visit(filter);
}

function isRunJsExpr(value: any): value is { code: string; version?: 'v1' | 'v2' } {
  if (!_.isPlainObject(value)) {
    return false;
  }
  const keys = Object.keys(value);
  if (!keys.includes('code')) {
    return false;
  }
  if (typeof value.code !== 'string') {
    return false;
  }
  if ('version' in value && value.version != null && value.version !== 'v1' && value.version !== 'v2') {
    return false;
  }
  return keys.every((key) => key === 'code' || key === 'version');
}

function normalizeValueExpr(value: any): FlowSurfaceValueExpr {
  if (_.isPlainObject(value) && value.source === 'literal') {
    return {
      source: 'literal',
      value: clonePlain(value.value),
    };
  }
  if (_.isPlainObject(value) && value.source === 'path') {
    return {
      source: 'path',
      path: extractBareContextPath(value.path, 'value.path'),
    };
  }
  if (_.isPlainObject(value) && value.source === 'runjs') {
    if (typeof value.code !== 'string') {
      throwBadRequest('runjs value.code must be a string.');
    }
    return {
      source: 'runjs',
      code: value.code,
      ...(value.version ? { version: value.version } : {}),
    };
  }
  if (_.isPlainObject(value) && 'source' in value) {
    throwBadRequest(
      `value.source "${String(value.source)}" is not supported. Expected one of "literal", "path", or "runjs".`,
      FLOW_SURFACE_REACTION_INVALID_VALUE_SOURCE,
    );
  }
  if (isRunJsExpr(value)) {
    return {
      source: 'runjs',
      code: value.code,
      ...(value.version ? { version: value.version } : {}),
    };
  }
  if (typeof value === 'string') {
    const templateMatch = value.trim().match(CONTEXT_EXPR_RE);
    if (templateMatch?.[1]) {
      return {
        source: 'path',
        path: extractBareContextPath(value, 'value'),
      };
    }
  }
  return {
    source: 'literal',
    value: clonePlain(value),
  };
}

function compileValueExpr(value: FlowSurfaceValueExpr) {
  if (value?.source === 'path') {
    return formatContextPath(extractBareContextPath(value.path, 'value.path'));
  }
  if (value?.source === 'runjs') {
    if (typeof value.code !== 'string') {
      throwBadRequest('runjs value.code must be a string.');
    }
    return {
      code: value.code,
      ...(value.version ? { version: value.version } : {}),
    };
  }
  return clonePlain(value?.value);
}

function normalizeFieldPath(rawPath: unknown, fieldName: string) {
  if (typeof rawPath !== 'string' || !rawPath.trim()) {
    throwBadRequest(`${fieldName} must be a non-empty string.`);
  }
  return rawPath.trim();
}

function normalizeFieldPaths(rawPaths: unknown, fieldName: string) {
  if (!Array.isArray(rawPaths)) {
    throwBadRequest(`${fieldName} must be an array of field paths.`);
  }
  return _.uniq(rawPaths.map((path, index) => normalizeFieldPath(path, `${fieldName}[${index}]`))).filter(Boolean);
}

function normalizeAssignItem(
  rawItem: any,
  index: number,
  prefix: string,
  fallbackMode: 'assign' | 'default',
): FlowSurfaceFieldLinkageAssignItem {
  const rawTargetPath =
    rawItem?.targetPath ??
    (typeof rawItem?.field === 'string' || typeof rawItem?.field === 'number' ? String(rawItem.field) : undefined);
  const rawValue =
    'value' in (rawItem || {})
      ? rawItem.value
      : fallbackMode === 'default'
        ? rawItem?.initialValue
        : rawItem?.assignValue;

  return {
    key: normalizeKey(rawItem?.key, prefix, index),
    enabled: normalizeBoolean(rawItem?.enabled ?? rawItem?.enable, true),
    targetPath: normalizeFieldPath(rawTargetPath, `${prefix}[${index}].targetPath`),
    when: normalizeReactionFilter(rawItem?.when ?? rawItem?.condition),
    value: normalizeValueExpr(rawValue),
  };
}

function normalizeRuleCommon(rawRule: any, index: number, prefix: string): NormalizeLinkageRuleCommon {
  return {
    key: normalizeKey(rawRule?.key, prefix, index),
    title: normalizeTitle(rawRule?.title, index),
    enabled: normalizeBoolean(rawRule?.enabled ?? rawRule?.enable, true),
    when: normalizeReactionFilter(rawRule?.when ?? rawRule?.condition),
  };
}

function normalizeBlockAction(rawAction: any, index: number, prefix: string): FlowSurfaceBlockLinkageAction {
  const type = rawAction?.type;
  if (type === 'setBlockState') {
    return {
      key: normalizeKey(rawAction?.key, prefix, index),
      type,
      state: rawAction?.state,
    };
  }
  if (type === 'runjs') {
    return {
      key: normalizeKey(rawAction?.key, prefix, index),
      type,
      code: String(rawAction?.code ?? ''),
      ...(rawAction?.version ? { version: rawAction.version } : {}),
    };
  }

  switch (rawAction?.name) {
    case FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES.block.setBlockState:
      return {
        key: normalizeKey(rawAction?.key, prefix, index),
        type: 'setBlockState',
        state: rawAction?.params?.value,
      };
    case FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES.block.runjs:
    case 'runjs':
      return {
        key: normalizeKey(rawAction?.key, prefix, index),
        type: 'runjs',
        code: String(rawAction?.params?.value?.script ?? rawAction?.params?.code ?? ''),
        ...(rawAction?.params?.value?.version ? { version: rawAction.params.value.version } : {}),
      };
    default:
      throwBadRequest(`Unsupported block linkage action "${String(rawAction?.name ?? rawAction?.type ?? '')}".`);
  }
}

function normalizeActionAction(rawAction: any, index: number, prefix: string): FlowSurfaceActionLinkageAction {
  const type = rawAction?.type;
  if (type === 'setActionState') {
    return {
      key: normalizeKey(rawAction?.key, prefix, index),
      type,
      state: rawAction?.state,
    };
  }
  if (type === 'runjs') {
    return {
      key: normalizeKey(rawAction?.key, prefix, index),
      type,
      code: String(rawAction?.code ?? ''),
      ...(rawAction?.version ? { version: rawAction.version } : {}),
    };
  }

  switch (rawAction?.name) {
    case FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES.action.setActionState:
      return {
        key: normalizeKey(rawAction?.key, prefix, index),
        type: 'setActionState',
        state: rawAction?.params?.value,
      };
    case FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES.action.runjs:
    case 'runjs':
      return {
        key: normalizeKey(rawAction?.key, prefix, index),
        type: 'runjs',
        code: String(rawAction?.params?.value?.script ?? rawAction?.params?.code ?? ''),
        ...(rawAction?.params?.value?.version ? { version: rawAction.params.value.version } : {}),
      };
    default:
      throwBadRequest(`Unsupported action linkage action "${String(rawAction?.name ?? rawAction?.type ?? '')}".`);
  }
}

function normalizeFieldStateAction(
  rawAction: any,
  index: number,
  prefix: string,
  resolveFieldPath?: FlowSurfaceFieldUidToPathResolver,
): FlowSurfaceFieldLinkageAction {
  if (rawAction?.type === 'setFieldState') {
    return {
      key: normalizeKey(rawAction?.key, prefix, index),
      type: 'setFieldState',
      fieldPaths: normalizeFieldPaths(rawAction?.fieldPaths, `${prefix}[${index}].fieldPaths`),
      state: rawAction?.state,
    };
  }

  const rawFields = rawAction?.params?.value?.fields;
  return {
    key: normalizeKey(rawAction?.key, prefix, index),
    type: 'setFieldState',
    fieldPaths: normalizeFieldPaths(rawFields, `${prefix}[${index}].fieldPaths`).map(
      (fieldUid) => resolveFieldPath?.(fieldUid) || fieldUid,
    ),
    state: rawAction?.params?.value?.state,
  };
}

function normalizeFieldAssignAction(
  rawAction: any,
  index: number,
  prefix: string,
  fallbackMode: 'assign' | 'default',
): FlowSurfaceFieldLinkageAction {
  if (rawAction?.type === 'assignField' || rawAction?.type === 'setFieldDefaultValue') {
    const nextType =
      fallbackMode === 'default' || rawAction?.type === 'setFieldDefaultValue' ? 'setFieldDefaultValue' : 'assignField';
    return {
      key: normalizeKey(rawAction?.key, prefix, index),
      type: nextType,
      items: Array.isArray(rawAction?.items)
        ? rawAction.items.map((item: any, itemIndex: number) =>
            normalizeAssignItem(item, itemIndex, `${prefix}-${index + 1}-item`, fallbackMode),
          )
        : [],
    };
  }

  const rawValue = rawAction?.params?.value;
  const items = Array.isArray(rawValue)
    ? rawValue.map((item: any, itemIndex: number) =>
        normalizeAssignItem(item, itemIndex, `${prefix}-${index + 1}-item`, fallbackMode),
      )
    : rawValue && typeof rawValue === 'object'
      ? [normalizeAssignItem(rawValue, 0, `${prefix}-${index + 1}-item`, fallbackMode)]
      : [];
  return {
    key: normalizeKey(rawAction?.key, prefix, index),
    type: fallbackMode === 'default' ? 'setFieldDefaultValue' : 'assignField',
    items,
  };
}

function normalizeFieldRunJsAction(rawAction: any, index: number, prefix: string): FlowSurfaceFieldLinkageAction {
  if (rawAction?.type === 'runjs') {
    return {
      key: normalizeKey(rawAction?.key, prefix, index),
      type: 'runjs',
      code: String(rawAction?.code ?? ''),
      ...(rawAction?.version ? { version: rawAction.version } : {}),
    };
  }
  return {
    key: normalizeKey(rawAction?.key, prefix, index),
    type: 'runjs',
    code: String(rawAction?.params?.value?.script ?? rawAction?.params?.code ?? ''),
    ...(rawAction?.params?.value?.version ? { version: rawAction.params.value.version } : {}),
  };
}

function normalizeFieldAction(
  rawAction: any,
  index: number,
  prefix: string,
  options: NormalizeFieldRuleOptions,
): FlowSurfaceFieldLinkageAction {
  switch (rawAction?.type) {
    case 'setFieldState':
      return normalizeFieldStateAction(rawAction, index, prefix, options.resolveFieldPath);
    case 'assignField':
    case 'setFieldDefaultValue':
      return normalizeFieldAssignAction(
        rawAction,
        index,
        prefix,
        rawAction.type === 'setFieldDefaultValue' ? 'default' : 'assign',
      );
    case 'runjs':
      return normalizeFieldRunJsAction(rawAction, index, prefix);
    default:
      break;
  }

  switch (rawAction?.name) {
    case FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES.form.setFieldState:
    case FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES.details.setFieldState:
    case FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES.subForm.setFieldState:
      return normalizeFieldStateAction(rawAction, index, prefix, options.resolveFieldPath);
    case FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES.form.assignField:
    case FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES.subForm.assignField:
      return normalizeFieldAssignAction(rawAction, index, prefix, 'assign');
    case FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES.form.setFieldDefaultValue:
      return normalizeFieldAssignAction(rawAction, index, prefix, 'default');
    case FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES.form.runjs:
    case 'runjs':
      return normalizeFieldRunJsAction(rawAction, index, prefix);
    default:
      throwBadRequest(`Unsupported field linkage action "${String(rawAction?.name ?? rawAction?.type ?? '')}".`);
  }
}

function compileBlockAction(action: FlowSurfaceBlockLinkageAction, index: number, prefix: string) {
  if (action.type === 'setBlockState') {
    return {
      key: normalizeKey(action.key, prefix, index),
      name: FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES.block.setBlockState,
      params: {
        value: action.state,
      },
    };
  }

  return {
    key: normalizeKey(action.key, prefix, index),
    name: FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES.block.runjs,
    params: {
      value: {
        script: action.code,
        ...(action.version ? { version: action.version } : {}),
      },
    },
  };
}

function compileActionAction(action: FlowSurfaceActionLinkageAction, index: number, prefix: string) {
  if (action.type === 'setActionState') {
    return {
      key: normalizeKey(action.key, prefix, index),
      name: FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES.action.setActionState,
      params: {
        value: action.state,
      },
    };
  }

  return {
    key: normalizeKey(action.key, prefix, index),
    name: FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES.action.runjs,
    params: {
      value: {
        script: action.code,
        ...(action.version ? { version: action.version } : {}),
      },
    },
  };
}

function compileFieldAssignItems(items: FlowSurfaceFieldLinkageAssignItem[], fallbackMode: 'assign' | 'default') {
  return items.map((item, itemIndex) => ({
    key: normalizeKey(item.key, `${fallbackMode}-item`, itemIndex),
    enable: normalizeBoolean(item.enabled, true),
    targetPath: normalizeFieldPath(item.targetPath, `${fallbackMode}.targetPath`),
    mode: fallbackMode,
    condition: compileReactionFilter(normalizeReactionFilter(item.when)),
    value: compileValueExpr(item.value),
  }));
}

function compileFieldAction(
  action: FlowSurfaceFieldLinkageAction,
  index: number,
  prefix: string,
  options: CompileFieldRuleOptions,
) {
  const actionNames = FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES[options.scene];

  if (action.type === 'setFieldState') {
    const actionName = actionNames.setFieldState;
    return {
      key: normalizeKey(action.key, prefix, index),
      name: actionName,
      params: {
        value: {
          fields: _.uniq(
            action.fieldPaths.map(
              (fieldPath) => options.resolveFieldUid?.(fieldPath) || normalizeFieldPath(fieldPath, 'fieldPath'),
            ),
          ),
          state: action.state,
        },
      },
    };
  }

  if (action.type === 'assignField') {
    if (!('assignField' in actionNames)) {
      throwBadRequest(
        `Field linkage action "${action.type}" is not supported in scene "${options.scene}".`,
        FLOW_SURFACE_REACTION_UNSUPPORTED_ACTION_FOR_SCENE,
      );
    }
    return {
      key: normalizeKey(action.key, prefix, index),
      name: actionNames.assignField,
      params: {
        value: compileFieldAssignItems(action.items, 'assign'),
      },
    };
  }

  if (action.type === 'setFieldDefaultValue') {
    if (!('setFieldDefaultValue' in actionNames)) {
      throwBadRequest(
        `Field linkage action "${action.type}" is not supported in scene "${options.scene}".`,
        FLOW_SURFACE_REACTION_UNSUPPORTED_ACTION_FOR_SCENE,
      );
    }
    return {
      key: normalizeKey(action.key, prefix, index),
      name: actionNames.setFieldDefaultValue,
      params: {
        value: compileFieldAssignItems(action.items, 'default'),
      },
    };
  }

  return {
    key: normalizeKey(action.key, prefix, index),
    name: FLOW_SURFACE_LINKAGE_CANONICAL_ACTION_NAMES[options.scene].runjs,
    params: {
      value: {
        script: action.code,
        ...(action.version ? { version: action.version } : {}),
      },
    },
  };
}

function assertScene(kind: 'blockLinkage' | 'actionLinkage', scene: string) {
  const expectedScene = kind === 'blockLinkage' ? 'block' : 'action';
  if (scene !== expectedScene) {
    throwBadRequest(
      `${kind} only supports scene "${expectedScene}". Received "${scene}".`,
      FLOW_SURFACE_REACTION_UNSUPPORTED_TARGET_KIND,
    );
  }
}

function buildAllowedContextPathSet(operatorsByPath: Record<string, string[]>) {
  return new Set(Object.keys(operatorsByPath || {}).filter(Boolean));
}

function formatAllowedValues(values: string[]) {
  return values.length ? values.join(', ') : '(none)';
}

function validateContextBoundValuePath(
  rawPath: unknown,
  allowedContextPaths: Set<string>,
  fieldName: string,
  code = FLOW_SURFACE_REACTION_INVALID_VALUE_PATH,
) {
  const path = extractBareContextPath(rawPath, `${fieldName}.path`);
  if (!allowedContextPaths.has(path)) {
    throwBadRequest(`${fieldName}.path "${path}" is not available in the current reaction context.`, code);
  }
}

function validateContextBoundValue(value: any, allowedContextPaths: Set<string>, fieldName: string) {
  if (_.isPlainObject(value) && value.source === 'path') {
    validateContextBoundValuePath(value.path, allowedContextPaths, fieldName);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateContextBoundValue(item, allowedContextPaths, `${fieldName}[${index}]`));
    return;
  }
  if (_.isPlainObject(value)) {
    for (const [key, item] of Object.entries(value)) {
      validateContextBoundValue(item, allowedContextPaths, `${fieldName}.${key}`);
    }
  }
}

function validateReactionFilterAgainstCapability(
  filter: FlowSurfaceReactionFilter | undefined,
  capability: FlowSurfaceLinkageValidationCapability,
  prefix: string,
) {
  const operatorsByPath = capability.conditionMeta?.operatorsByPath || {};
  const allowedContextPaths = buildAllowedContextPathSet(operatorsByPath);

  const visit = (node: any, currentPrefix: string) => {
    if (!_.isPlainObject(node)) {
      return;
    }
    if (Array.isArray(node.items)) {
      node.items.forEach((item: any, index: number) => visit(item, `${currentPrefix}.items[${index}]`));
      return;
    }

    const hasOperator = 'operator' in node;
    const hasValue = 'value' in node;
    const hasPath = 'path' in node;

    if (!hasOperator && !hasValue && !hasPath) {
      return;
    }

    if (!hasPath) {
      throwBadRequest(
        `${currentPrefix}.path must be a non-empty string.`,
        FLOW_SURFACE_REACTION_INVALID_CONDITION_PATH,
      );
    }

    const path = extractBareContextPath(node.path, `${currentPrefix}.path`);
    if (!allowedContextPaths.has(path)) {
      throwBadRequest(
        `${currentPrefix}.path "${path}" is not available in the current reaction context.`,
        FLOW_SURFACE_REACTION_INVALID_CONDITION_PATH,
      );
    }

    const operator = typeof node.operator === 'string' ? node.operator.trim() : '';
    const allowedOperators = operatorsByPath[path] || [];
    if (!operator) {
      throwBadRequest(
        `${currentPrefix}.operator is required for path "${path}".`,
        FLOW_SURFACE_REACTION_INVALID_CONDITION_OPERATOR,
      );
    }
    if (!allowedOperators.includes(operator)) {
      throwBadRequest(
        `${currentPrefix}.operator "${operator}" is not supported for path "${path}". Supported operators: ${formatAllowedValues(
          allowedOperators,
        )}.`,
        FLOW_SURFACE_REACTION_INVALID_CONDITION_OPERATOR,
      );
    }

    if (hasValue) {
      validateContextBoundValue(node.value, allowedContextPaths, `${currentPrefix}.value`);
    }
  };

  visit(filter, prefix);
}

function validateFieldAssignItemValue(
  item: FlowSurfaceFieldLinkageAssignItem,
  capability: FlowSurfaceFieldLinkageValidationCapability,
  prefix: string,
) {
  const supportedSources = capability.valueExprMeta?.supportedSources || [];
  if (!supportedSources.includes(item.value.source)) {
    throwBadRequest(
      `${prefix}.value.source "${item.value.source}" is not supported. Supported sources: ${formatAllowedValues(
        supportedSources,
      )}.`,
      FLOW_SURFACE_REACTION_INVALID_VALUE_SOURCE,
    );
  }

  if (item.value.source === 'path') {
    validateContextBoundValuePath(
      item.value.path,
      buildAllowedContextPathSet(capability.conditionMeta.operatorsByPath),
      `${prefix}.value`,
    );
  }
}

function validateFieldAssignItemTarget(
  item: FlowSurfaceFieldLinkageAssignItem,
  capability: FlowSurfaceFieldLinkageValidationCapability,
  prefix: string,
  mode: 'assign' | 'default',
) {
  const field = capability.targetFields.find((targetField) => targetField.path === item.targetPath);
  if (!field) {
    throwBadRequest(
      `${prefix}.targetPath "${item.targetPath}" is not available in the current target fields.`,
      FLOW_SURFACE_REACTION_INVALID_TARGET_FIELD,
    );
  }

  const supported = mode === 'assign' ? field.supportsAssign : field.supportsDefault;
  if (!supported) {
    throwBadRequest(
      `${prefix}.targetPath "${item.targetPath}" does not support ${
        mode === 'assign' ? 'assignment' : 'default values'
      } in the current scene.`,
      FLOW_SURFACE_REACTION_INVALID_TARGET_FIELD,
    );
  }
}

export function buildReactionFingerprint(value: any) {
  return createHash('sha1').update(buildStableFingerprintString(value)).digest('hex');
}

export function normalizeBlockLinkageRules(rawRules: unknown): FlowSurfaceBlockLinkageRule[] {
  assertRuleArray(rawRules, 'Block linkage rules');
  return rawRules.map((rawRule, index) => {
    const common = normalizeRuleCommon(rawRule, index, 'block-linkage-rule');
    const rawActions = Array.isArray((rawRule as any)?.then)
      ? (rawRule as any).then
      : Array.isArray((rawRule as any)?.actions)
        ? (rawRule as any).actions
        : [];

    return {
      key: common.key,
      title: common.title,
      enabled: common.enabled,
      when: common.when,
      then: rawActions.map((rawAction: any, actionIndex: number) =>
        normalizeBlockAction(rawAction, actionIndex, `${common.key}-action`),
      ),
    };
  });
}

export function normalizeActionLinkageRules(rawRules: unknown): FlowSurfaceActionLinkageRule[] {
  assertRuleArray(rawRules, 'Action linkage rules');
  return rawRules.map((rawRule, index) => {
    const common = normalizeRuleCommon(rawRule, index, 'action-linkage-rule');
    const rawActions = Array.isArray((rawRule as any)?.then)
      ? (rawRule as any).then
      : Array.isArray((rawRule as any)?.actions)
        ? (rawRule as any).actions
        : [];

    return {
      key: common.key,
      title: common.title,
      enabled: common.enabled,
      when: common.when,
      then: rawActions.map((rawAction: any, actionIndex: number) =>
        normalizeActionAction(rawAction, actionIndex, `${common.key}-action`),
      ),
    };
  });
}

export function normalizeFieldLinkageRules(
  rawRules: unknown,
  options: NormalizeFieldRuleOptions,
): FlowSurfaceFieldLinkageRule[] {
  assertRuleArray(rawRules, 'Field linkage rules');
  const normalized = rawRules.map((rawRule, index) => {
    const common = normalizeRuleCommon(rawRule, index, 'field-linkage-rule');
    const rawActions = Array.isArray((rawRule as any)?.then)
      ? (rawRule as any).then
      : Array.isArray((rawRule as any)?.actions)
        ? (rawRule as any).actions
        : [];

    return {
      key: common.key,
      title: common.title,
      enabled: common.enabled,
      when: common.when,
      then: rawActions.map((rawAction: any, actionIndex: number) =>
        normalizeFieldAction(rawAction, actionIndex, `${common.key}-action`, options),
      ),
    };
  });

  validateFieldLinkageSceneSupport(options.scene, normalized);
  return normalized;
}

export function validateBlockLinkageSceneSupport(scene: string, rules?: FlowSurfaceBlockLinkageRule[]) {
  assertScene('blockLinkage', scene);
  for (const rule of rules || []) {
    for (const action of rule.then || []) {
      if (action.type === 'setBlockState' && !FLOW_SURFACE_BLOCK_LINKAGE_STATES.includes(action.state)) {
        throwBadRequest(
          `Block linkage state "${String(action.state)}" is not supported in scene "${scene}".`,
          FLOW_SURFACE_REACTION_UNSUPPORTED_ACTION_FOR_SCENE,
        );
      }
    }
  }
}

export function validateBlockLinkageRulesAgainstCapability(
  rules: FlowSurfaceBlockLinkageRule[],
  capability: FlowSurfaceLinkageValidationCapability,
) {
  for (const [ruleIndex, rule] of (rules || []).entries()) {
    validateReactionFilterAgainstCapability(rule.when, capability, `rules[${ruleIndex}].when`);
  }
}

export function validateActionLinkageSceneSupport(scene: string, rules?: FlowSurfaceActionLinkageRule[]) {
  assertScene('actionLinkage', scene);
  for (const rule of rules || []) {
    for (const action of rule.then || []) {
      if (action.type === 'setActionState' && !FLOW_SURFACE_ACTION_LINKAGE_STATES.includes(action.state)) {
        throwBadRequest(
          `Action linkage state "${String(action.state)}" is not supported in scene "${scene}".`,
          FLOW_SURFACE_REACTION_UNSUPPORTED_ACTION_FOR_SCENE,
        );
      }
    }
  }
}

export function validateActionLinkageRulesAgainstCapability(
  rules: FlowSurfaceActionLinkageRule[],
  capability: FlowSurfaceLinkageValidationCapability,
) {
  for (const [ruleIndex, rule] of (rules || []).entries()) {
    validateReactionFilterAgainstCapability(rule.when, capability, `rules[${ruleIndex}].when`);
  }
}

export function validateFieldLinkageSceneSupport(
  scene: FlowSurfaceFieldLinkageScene,
  rules?: FlowSurfaceFieldLinkageRule[],
) {
  const supportedActionTypes = FLOW_SURFACE_FIELD_LINKAGE_ACTION_TYPES_BY_SCENE[scene] as readonly string[];
  const supportedStates = FLOW_SURFACE_FIELD_LINKAGE_STATES_BY_SCENE[scene] as readonly string[];

  for (const rule of rules || []) {
    for (const action of rule.then || []) {
      if (!supportedActionTypes.includes(action.type)) {
        throwBadRequest(
          `Field linkage action "${action.type}" is not supported in scene "${scene}".`,
          FLOW_SURFACE_REACTION_UNSUPPORTED_ACTION_FOR_SCENE,
        );
      }
      if (action.type === 'setFieldState' && !supportedStates.includes(action.state)) {
        throwBadRequest(
          `Field linkage state "${String(action.state)}" is not supported in scene "${scene}".`,
          FLOW_SURFACE_REACTION_UNSUPPORTED_ACTION_FOR_SCENE,
        );
      }
    }
  }
}

export function validateFieldLinkageRulesAgainstCapability(
  rules: FlowSurfaceFieldLinkageRule[],
  capability: FlowSurfaceFieldLinkageValidationCapability,
) {
  for (const [ruleIndex, rule] of (rules || []).entries()) {
    validateReactionFilterAgainstCapability(rule.when, capability, `rules[${ruleIndex}].when`);

    for (const [actionIndex, action] of (rule.then || []).entries()) {
      if (action.type !== 'assignField' && action.type !== 'setFieldDefaultValue') {
        continue;
      }

      const mode = action.type === 'assignField' ? 'assign' : 'default';
      for (const [itemIndex, item] of (action.items || []).entries()) {
        const itemPrefix = `rules[${ruleIndex}].then[${actionIndex}].items[${itemIndex}]`;
        validateFieldAssignItemTarget(item, capability, itemPrefix, mode);
        validateFieldAssignItemValue(item, capability, itemPrefix);
        validateReactionFilterAgainstCapability(item.when, capability, `${itemPrefix}.when`);
      }
    }
  }
}

export function compileBlockLinkageCanonicalRules(rules: FlowSurfaceBlockLinkageRule[]) {
  validateBlockLinkageSceneSupport('block', rules);
  return normalizeBlockLinkageRules(rules).map((rule, index) => ({
    key: normalizeKey(rule.key, 'block-linkage-rule', index),
    title: normalizeTitle(rule.title, index),
    enable: normalizeBoolean(rule.enabled, true),
    condition: compileReactionFilter(normalizeReactionFilter(rule.when)),
    actions: rule.then.map((action, actionIndex) => compileBlockAction(action, actionIndex, `${rule.key}-action`)),
  }));
}

export function compileActionLinkageCanonicalRules(rules: FlowSurfaceActionLinkageRule[]) {
  validateActionLinkageSceneSupport('action', rules);
  return normalizeActionLinkageRules(rules).map((rule, index) => ({
    key: normalizeKey(rule.key, 'action-linkage-rule', index),
    title: normalizeTitle(rule.title, index),
    enable: normalizeBoolean(rule.enabled, true),
    condition: compileReactionFilter(normalizeReactionFilter(rule.when)),
    actions: rule.then.map((action, actionIndex) => compileActionAction(action, actionIndex, `${rule.key}-action`)),
  }));
}

export function compileFieldLinkageCanonicalRules(
  rules: FlowSurfaceFieldLinkageRule[],
  options: CompileFieldRuleOptions,
) {
  validateFieldLinkageSceneSupport(options.scene, rules);
  return normalizeFieldLinkageRules(rules, { scene: options.scene }).map((rule, index) => ({
    key: normalizeKey(rule.key, 'field-linkage-rule', index),
    title: normalizeTitle(rule.title, index),
    enable: normalizeBoolean(rule.enabled, true),
    condition: compileReactionFilter(normalizeReactionFilter(rule.when)),
    actions: rule.then.map((action, actionIndex) =>
      compileFieldAction(action, actionIndex, `${rule.key}-action`, options),
    ),
  }));
}
