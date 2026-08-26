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
import { FLOW_SURFACE_RESERVED_KEYS } from './key-registry';

export type FlowSurfaceCreatedKeySpec = {
  key: string;
  resultPath: string;
};

type CollectFlowSurfaceCreatedKeysOptions = {
  targetSelectorKey?: string;
};

export function normalizeFlowSurfaceCreatedKey(key: any, context: string) {
  const normalized = typeof key === 'string' ? key.trim() : String(key || '').trim();
  if (!normalized) {
    throwBadRequest(`${context} key cannot be empty`);
  }
  if (FLOW_SURFACE_RESERVED_KEYS.has(normalized)) {
    throwBadRequest(`${context} key '${normalized}' is reserved`);
  }
  return normalized;
}

export function collectFlowSurfaceCreatedKeys(
  action: string,
  values: any,
  options: CollectFlowSurfaceCreatedKeysOptions = {},
): FlowSurfaceCreatedKeySpec[] {
  if (!_.isPlainObject(values)) {
    return [];
  }
  switch (action) {
    case 'createPage':
      return collectBaseKey(values.key, `flowSurfaces ${action}`, [
        ['', 'pageUid'],
        ['tab', 'tabSchemaUid'],
        ['grid', 'gridUid'],
      ]);
    case 'addTab':
      return collectBaseKey(values.key, `flowSurfaces ${action}`, [
        ['', 'tabSchemaUid'],
        ['grid', 'gridUid'],
      ]);
    case 'addPopupTab':
      return collectBaseKey(values.key, `flowSurfaces ${action}`, [
        ['', 'popupTabUid'],
        ['grid', 'popupGridUid'],
      ]);
    case 'addBlock':
      return collectBaseKey(values.key, `flowSurfaces ${action}`, [
        ['', 'uid'],
        ['grid', 'blockGridUid'],
        ['item', 'itemUid'],
        ['itemGrid', 'itemGridUid'],
        ['actionsColumn', 'actionsColumnUid'],
      ]);
    case 'addField':
      return [
        ...collectBaseKey(values.key, `flowSurfaces ${action}`, [
          ['', 'uid'],
          ['field', 'fieldUid'],
          ['innerField', 'innerFieldUid'],
        ]),
        ...(shouldCollectAddFieldPopupKeys(values)
          ? collectDerivedKey(values.key, `flowSurfaces ${action}`, [
              ['popupPage', 'popupPageUid'],
              ['popupTab', 'popupTabUid'],
              ['popupGrid', 'popupGridUid'],
            ])
          : []),
      ];
    case 'addAction':
    case 'addRecordAction':
      return collectBaseKey(values.key, `flowSurfaces ${action}`, [
        ['', 'uid'],
        ['assignForm', 'assignFormUid'],
        ['assignFormGrid', 'assignFormGridUid'],
        ['popupPage', 'popupPageUid'],
        ['popupTab', 'popupTabUid'],
        ['popupGrid', 'popupGridUid'],
      ]);
    case 'configure':
      return collectConfigureCreatedKeys(values, options);
    case 'compose':
      return collectComposeCreatedKeys(values);
    default:
      return [];
  }
}

function collectBaseKey(
  keyValue: any,
  context: string,
  defs: Array<[suffix: string, resultPath: string]>,
): FlowSurfaceCreatedKeySpec[] {
  if (_.isUndefined(keyValue)) {
    return [];
  }
  const baseKey = normalizeFlowSurfaceCreatedKey(keyValue, context);
  return defs.map(([suffix, resultPath]) => ({
    key: suffix ? `${baseKey}.${suffix}` : baseKey,
    resultPath,
  }));
}

function collectDerivedKey(
  keyValue: any,
  context: string,
  defs: Array<[suffix: string, resultPath: string]>,
): FlowSurfaceCreatedKeySpec[] {
  if (_.isUndefined(keyValue)) {
    return [];
  }
  const baseKey = normalizeFlowSurfaceCreatedKey(keyValue, context);
  return defs.map(([suffix, resultPath]) => ({
    key: `${baseKey}.${suffix}`,
    resultPath,
  }));
}

function shouldCollectAddFieldPopupKeys(values: any) {
  return !_.isUndefined(values?.popup);
}

function inferConfigureCreatedKeyBase(targetSelectorKey: any) {
  if (_.isUndefined(targetSelectorKey)) {
    return undefined;
  }
  const normalizedKey = normalizeFlowSurfaceCreatedKey(targetSelectorKey, 'flowSurfaces configure target key');
  if (normalizedKey.endsWith('.innerField')) {
    return normalizedKey.slice(0, -'.innerField'.length);
  }
  if (normalizedKey.endsWith('.field')) {
    return normalizedKey.slice(0, -'.field'.length);
  }
  return undefined;
}

function collectConfigureCreatedKeys(
  values: any,
  options: CollectFlowSurfaceCreatedKeysOptions = {},
): FlowSurfaceCreatedKeySpec[] {
  if (!_.isPlainObject(values?.changes?.openView)) {
    return [];
  }
  const keyBase = !_.isUndefined(values.key) ? values.key : inferConfigureCreatedKeyBase(options.targetSelectorKey);
  if (_.isUndefined(keyBase)) {
    return [];
  }
  return collectDerivedKey(keyBase, 'flowSurfaces configure', [
    ['popupPage', 'popupPageUid'],
    ['popupTab', 'popupTabUid'],
    ['popupGrid', 'popupGridUid'],
  ]);
}

function collectComposeCreatedKeys(values: any): FlowSurfaceCreatedKeySpec[] {
  const blocks = _.castArray(values?.blocks || []);
  const specs: FlowSurfaceCreatedKeySpec[] = [];
  blocks.forEach((block: any, blockIndex: number) => {
    const blockContext = `flowSurfaces compose block #${blockIndex + 1}`;
    if (_.isPlainObject(block) && !_.isUndefined(block.key)) {
      specs.push(
        ...collectBaseKey(block.key, blockContext, [
          ['', `blocks.${blockIndex}.uid`],
          ['grid', `blocks.${blockIndex}.gridUid`],
          ['item', `blocks.${blockIndex}.itemUid`],
          ['itemGrid', `blocks.${blockIndex}.itemGridUid`],
          ['actionsColumn', `blocks.${blockIndex}.actionsColumnUid`],
        ]),
      );
    }
    _.castArray(block?.fields || []).forEach((field: any, fieldIndex: number) => {
      const fieldKey = resolveComposeFieldKey(field, `${blockContext} field #${fieldIndex + 1}`);
      if (!fieldKey) {
        return;
      }
      specs.push(
        ...collectBaseKey(fieldKey, `${blockContext} field #${fieldIndex + 1}`, [
          ['', `blocks.${blockIndex}.fields.${fieldIndex}.uid`],
          ['field', `blocks.${blockIndex}.fields.${fieldIndex}.fieldUid`],
          ['innerField', `blocks.${blockIndex}.fields.${fieldIndex}.innerFieldUid`],
          ['popupPage', `blocks.${blockIndex}.fields.${fieldIndex}.popupPageUid`],
          ['popupTab', `blocks.${blockIndex}.fields.${fieldIndex}.popupTabUid`],
          ['popupGrid', `blocks.${blockIndex}.fields.${fieldIndex}.popupGridUid`],
        ]),
      );
    });
    _.castArray(block?.actions || []).forEach((action: any, actionIndex: number) => {
      const actionKey = resolveComposeActionKey(action, `${blockContext} action #${actionIndex + 1}`);
      if (!actionKey) {
        return;
      }
      specs.push(
        ...collectBaseKey(actionKey, `${blockContext} action #${actionIndex + 1}`, [
          ['', `blocks.${blockIndex}.actions.${actionIndex}.uid`],
          ['assignForm', `blocks.${blockIndex}.actions.${actionIndex}.assignFormUid`],
          ['assignFormGrid', `blocks.${blockIndex}.actions.${actionIndex}.assignFormGridUid`],
          ['popupPage', `blocks.${blockIndex}.actions.${actionIndex}.popupPageUid`],
          ['popupTab', `blocks.${blockIndex}.actions.${actionIndex}.popupTabUid`],
          ['popupGrid', `blocks.${blockIndex}.actions.${actionIndex}.popupGridUid`],
        ]),
      );
    });
    _.castArray(block?.recordActions || []).forEach((action: any, actionIndex: number) => {
      const actionKey = resolveComposeActionKey(action, `${blockContext} recordAction #${actionIndex + 1}`);
      if (!actionKey) {
        return;
      }
      specs.push(
        ...collectBaseKey(actionKey, `${blockContext} recordAction #${actionIndex + 1}`, [
          ['', `blocks.${blockIndex}.recordActions.${actionIndex}.uid`],
          ['assignForm', `blocks.${blockIndex}.recordActions.${actionIndex}.assignFormUid`],
          ['assignFormGrid', `blocks.${blockIndex}.recordActions.${actionIndex}.assignFormGridUid`],
          ['popupPage', `blocks.${blockIndex}.recordActions.${actionIndex}.popupPageUid`],
          ['popupTab', `blocks.${blockIndex}.recordActions.${actionIndex}.popupTabUid`],
          ['popupGrid', `blocks.${blockIndex}.recordActions.${actionIndex}.popupGridUid`],
        ]),
      );
    });
  });
  return specs;
}

function resolveComposeFieldKey(field: any, context: string) {
  if (typeof field === 'string') {
    return normalizeFlowSurfaceCreatedKey(field, context);
  }
  if (!_.isPlainObject(field)) {
    return undefined;
  }
  const semanticType = String(field.type || '').trim();
  const fieldPath = String(field.fieldPath || '').trim();
  const renderer = typeof field.renderer === 'undefined' ? undefined : String(field.renderer || '').trim();
  const rawKey = String(field.key || semanticType || (renderer === 'js' ? `js:${fieldPath}` : fieldPath)).trim();
  return rawKey ? normalizeFlowSurfaceCreatedKey(rawKey, context) : undefined;
}

function resolveComposeActionKey(action: any, context: string) {
  if (typeof action === 'string') {
    return normalizeFlowSurfaceCreatedKey(action, context);
  }
  if (!_.isPlainObject(action)) {
    return undefined;
  }
  const rawKey = String(action.key || action.type || '').trim();
  return rawKey ? normalizeFlowSurfaceCreatedKey(rawKey, context) : undefined;
}

export function assertNoDuplicateFlowSurfaceCreatedKeys(
  specs: FlowSurfaceCreatedKeySpec[],
  context: string,
  options: { existingKeys?: Iterable<string>; reservedNames?: Iterable<string> } = {},
) {
  const seen = new Map<string, number>();
  const existing = new Set(options.existingKeys || []);
  const reservedNames = new Set(options.reservedNames || []);
  specs.forEach((spec, index) => {
    if (reservedNames.has(spec.key)) {
      throwBadRequest(`${context} key '${spec.key}' conflicts with an existing step id`);
    }
    if (existing.has(spec.key)) {
      throwBadRequest(`${context} key '${spec.key}' is already defined`);
    }
    const previousIndex = seen.get(spec.key);
    if (typeof previousIndex === 'number') {
      throwBadRequest(`${context} key '${spec.key}' is duplicated at #${previousIndex + 1} and #${index + 1}`);
    }
    seen.set(spec.key, index);
  });
}

export function registerFlowSurfaceCreatedKeys(
  result: any,
  specs: FlowSurfaceCreatedKeySpec[],
  keys: Map<string, any>,
) {
  const registered = resolveFlowSurfaceCreatedKeyResults(result, specs);
  registered.forEach((item) => keys.set(item.key, item.uid));
  return registered;
}

export function collectPersistableFlowSurfaceCreatedKeys(result: any, specs: FlowSurfaceCreatedKeySpec[]) {
  const persistedUidSet = new Set<string>();
  const persisted: Array<{ key: string; uid: string }> = [];
  for (const item of resolveFlowSurfaceCreatedKeyResults(result, specs)) {
    if (persistedUidSet.has(item.uid)) {
      continue;
    }
    persistedUidSet.add(item.uid);
    persisted.push(item);
  }
  return persisted;
}

function resolveFlowSurfaceCreatedKeyResults(result: any, specs: FlowSurfaceCreatedKeySpec[]) {
  const registered: Array<{ key: string; uid: string }> = [];
  for (const spec of specs) {
    const value = _.get(result, spec.resultPath);
    if (typeof value !== 'string' || !value.trim()) {
      continue;
    }
    registered.push({
      key: spec.key,
      uid: value.trim(),
    });
  }
  return registered;
}

export function isFlowSurfacePureKeyObject(input: any): input is { key: string } {
  return (
    _.isPlainObject(input) && Object.keys(input).length === 1 && typeof input.key === 'string' && !!input.key.trim()
  );
}

export function normalizeComposeInlineKeysForPlan(values: any, contextPath: string) {
  if (!_.isPlainObject(values)) {
    return values;
  }
  const cloned = _.cloneDeep(values);
  const blockKeys = new Set(
    _.castArray(cloned.blocks || [])
      .map((block: any, index: number) => {
        if (!_.isPlainObject(block) || _.isUndefined(block.key)) {
          return '';
        }
        return normalizeFlowSurfaceCreatedKey(block.key, `${contextPath}.blocks[${index}]`);
      })
      .filter(Boolean),
  );

  _.castArray(cloned.blocks || []).forEach((block: any, blockIndex: number) => {
    _.castArray(block?.fields || []).forEach((field: any, fieldIndex: number) => {
      if (typeof field?.target !== 'string' || !field.target.trim()) {
        return;
      }
      const targetKey = normalizeFlowSurfaceCreatedKey(
        field.target,
        `${contextPath}.blocks[${blockIndex}].fields[${fieldIndex}].target`,
      );
      if (!blockKeys.has(targetKey)) {
        return;
      }
      field.target = targetKey;
    });
  });

  _.castArray(cloned.layout?.rows || []).forEach((row: any, rowIndex: number) => {
    if (!Array.isArray(row)) {
      return;
    }
    row.forEach((cell: any, cellIndex: number) => {
      if (typeof cell === 'string') {
        return;
      }
      if (!_.isPlainObject(cell) || typeof cell.key !== 'string' || !cell.key.trim()) {
        return;
      }
      const key = normalizeFlowSurfaceCreatedKey(cell.key, `${contextPath}.layout.rows[${rowIndex}][${cellIndex}]`);
      if (!blockKeys.has(key)) {
        throwBadRequest(
          `flowSurfaces compose local layout key '${key}' must match a block key in the same compose step`,
        );
      }
      delete cell.key;
      cell.composeKey = key;
    });
  });

  return cloned;
}
