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
import { FLOW_SURFACE_RESERVED_REFS } from './ref-registry';

export type FlowSurfaceCreatedRefSpec = {
  ref: string;
  resultPath: string;
};

export function normalizeFlowSurfaceCreatedRef(ref: any, context: string) {
  const normalized = typeof ref === 'string' ? ref.trim() : String(ref || '').trim();
  if (!normalized) {
    throwBadRequest(`${context} ref cannot be empty`);
  }
  if (FLOW_SURFACE_RESERVED_REFS.has(normalized)) {
    throwBadRequest(`${context} ref '${normalized}' is reserved`);
  }
  return normalized;
}

export function collectFlowSurfaceCreatedRefs(action: string, values: any): FlowSurfaceCreatedRefSpec[] {
  if (!_.isPlainObject(values)) {
    return [];
  }
  switch (action) {
    case 'createPage':
      return collectBaseRef(values.ref, `flowSurfaces ${action}`, [
        ['', 'pageUid'],
        ['tab', 'tabSchemaUid'],
        ['grid', 'gridUid'],
      ]);
    case 'addTab':
      return collectBaseRef(values.ref, `flowSurfaces ${action}`, [
        ['', 'tabSchemaUid'],
        ['grid', 'gridUid'],
      ]);
    case 'addPopupTab':
      return collectBaseRef(values.ref, `flowSurfaces ${action}`, [
        ['', 'popupTabUid'],
        ['grid', 'popupGridUid'],
      ]);
    case 'addBlock':
      return collectBaseRef(values.ref, `flowSurfaces ${action}`, [
        ['', 'uid'],
        ['grid', 'blockGridUid'],
        ['item', 'itemUid'],
        ['itemGrid', 'itemGridUid'],
        ['actionsColumn', 'actionsColumnUid'],
      ]);
    case 'addField':
      return collectBaseRef(values.ref, `flowSurfaces ${action}`, [
        ['', 'uid'],
        ['field', 'fieldUid'],
        ['innerField', 'innerFieldUid'],
        ['popupPage', 'popupPageUid'],
        ['popupTab', 'popupTabUid'],
        ['popupGrid', 'popupGridUid'],
      ]);
    case 'addAction':
    case 'addRecordAction':
      return collectBaseRef(values.ref, `flowSurfaces ${action}`, [
        ['', 'uid'],
        ['assignForm', 'assignFormUid'],
        ['assignFormGrid', 'assignFormGridUid'],
        ['popupPage', 'popupPageUid'],
        ['popupTab', 'popupTabUid'],
        ['popupGrid', 'popupGridUid'],
      ]);
    case 'compose':
      return collectComposeCreatedRefs(values);
    default:
      return [];
  }
}

function collectBaseRef(
  refValue: any,
  context: string,
  defs: Array<[suffix: string, resultPath: string]>,
): FlowSurfaceCreatedRefSpec[] {
  if (_.isUndefined(refValue)) {
    return [];
  }
  const baseRef = normalizeFlowSurfaceCreatedRef(refValue, context);
  return defs.map(([suffix, resultPath]) => ({
    ref: suffix ? `${baseRef}.${suffix}` : baseRef,
    resultPath,
  }));
}

function collectComposeCreatedRefs(values: any): FlowSurfaceCreatedRefSpec[] {
  const blocks = _.castArray(values?.blocks || []);
  const specs: FlowSurfaceCreatedRefSpec[] = [];
  blocks.forEach((block: any, blockIndex: number) => {
    const blockContext = `flowSurfaces compose block #${blockIndex + 1}`;
    if (_.isPlainObject(block) && !_.isUndefined(block.ref)) {
      specs.push(
        ...collectBaseRef(block.ref, blockContext, [
          ['', `blocks.${blockIndex}.uid`],
          ['grid', `blocks.${blockIndex}.gridUid`],
          ['item', `blocks.${blockIndex}.itemUid`],
          ['itemGrid', `blocks.${blockIndex}.itemGridUid`],
          ['actionsColumn', `blocks.${blockIndex}.actionsColumnUid`],
        ]),
      );
    }
    _.castArray(block?.fields || []).forEach((field: any, fieldIndex: number) => {
      const fieldRef = resolveComposeFieldRef(field, `${blockContext} field #${fieldIndex + 1}`);
      if (!fieldRef) {
        return;
      }
      specs.push(
        ...collectBaseRef(fieldRef, `${blockContext} field #${fieldIndex + 1}`, [
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
      const actionRef = resolveComposeActionRef(action, `${blockContext} action #${actionIndex + 1}`);
      if (!actionRef) {
        return;
      }
      specs.push(
        ...collectBaseRef(actionRef, `${blockContext} action #${actionIndex + 1}`, [
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
      const actionRef = resolveComposeActionRef(action, `${blockContext} recordAction #${actionIndex + 1}`);
      if (!actionRef) {
        return;
      }
      specs.push(
        ...collectBaseRef(actionRef, `${blockContext} recordAction #${actionIndex + 1}`, [
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

function resolveComposeFieldRef(field: any, context: string) {
  if (typeof field === 'string') {
    return normalizeFlowSurfaceCreatedRef(field, context);
  }
  if (!_.isPlainObject(field)) {
    return undefined;
  }
  const semanticType = String(field.type || '').trim();
  const fieldPath = String(field.fieldPath || '').trim();
  const renderer = typeof field.renderer === 'undefined' ? undefined : String(field.renderer || '').trim();
  const rawRef = String(field.ref || semanticType || (renderer === 'js' ? `js:${fieldPath}` : fieldPath)).trim();
  return rawRef ? normalizeFlowSurfaceCreatedRef(rawRef, context) : undefined;
}

function resolveComposeActionRef(action: any, context: string) {
  if (typeof action === 'string') {
    return normalizeFlowSurfaceCreatedRef(action, context);
  }
  if (!_.isPlainObject(action)) {
    return undefined;
  }
  const rawRef = String(action.ref || action.type || '').trim();
  return rawRef ? normalizeFlowSurfaceCreatedRef(rawRef, context) : undefined;
}

export function assertNoDuplicateFlowSurfaceCreatedRefs(
  specs: FlowSurfaceCreatedRefSpec[],
  context: string,
  options: { existingRefs?: Iterable<string>; reservedNames?: Iterable<string> } = {},
) {
  const seen = new Map<string, number>();
  const existing = new Set(options.existingRefs || []);
  const reservedNames = new Set(options.reservedNames || []);
  specs.forEach((spec, index) => {
    if (reservedNames.has(spec.ref)) {
      throwBadRequest(`${context} ref '${spec.ref}' conflicts with an existing step id`);
    }
    if (existing.has(spec.ref)) {
      throwBadRequest(`${context} ref '${spec.ref}' is already defined`);
    }
    const previousIndex = seen.get(spec.ref);
    if (typeof previousIndex === 'number') {
      throwBadRequest(`${context} ref '${spec.ref}' is duplicated at #${previousIndex + 1} and #${index + 1}`);
    }
    seen.set(spec.ref, index);
  });
}

export function registerFlowSurfaceCreatedRefs(
  result: any,
  specs: FlowSurfaceCreatedRefSpec[],
  refs: Map<string, any>,
) {
  const registered = resolveFlowSurfaceCreatedRefResults(result, specs);
  registered.forEach((item) => refs.set(item.ref, item.uid));
  return registered;
}

export function collectPersistableFlowSurfaceCreatedRefs(result: any, specs: FlowSurfaceCreatedRefSpec[]) {
  const persistedUidSet = new Set<string>();
  const persisted: Array<{ ref: string; uid: string }> = [];
  for (const item of resolveFlowSurfaceCreatedRefResults(result, specs)) {
    if (persistedUidSet.has(item.uid)) {
      continue;
    }
    persistedUidSet.add(item.uid);
    persisted.push(item);
  }
  return persisted;
}

function resolveFlowSurfaceCreatedRefResults(result: any, specs: FlowSurfaceCreatedRefSpec[]) {
  const registered: Array<{ ref: string; uid: string }> = [];
  for (const spec of specs) {
    const value = _.get(result, spec.resultPath);
    if (typeof value !== 'string' || !value.trim()) {
      continue;
    }
    registered.push({
      ref: spec.ref,
      uid: value.trim(),
    });
  }
  return registered;
}

export function isFlowSurfacePureRefObject(input: any): input is { ref: string } {
  return (
    _.isPlainObject(input) && Object.keys(input).length === 1 && typeof input.ref === 'string' && !!input.ref.trim()
  );
}

export function normalizeComposeInlineRefsForPlan(values: any, contextPath: string) {
  if (!_.isPlainObject(values)) {
    return values;
  }
  const cloned = _.cloneDeep(values);
  const blockRefs = new Set(
    _.castArray(cloned.blocks || [])
      .map((block: any, index: number) => {
        if (!_.isPlainObject(block) || _.isUndefined(block.ref)) {
          return '';
        }
        return normalizeFlowSurfaceCreatedRef(block.ref, `${contextPath}.blocks[${index}]`);
      })
      .filter(Boolean),
  );

  _.castArray(cloned.blocks || []).forEach((block: any, blockIndex: number) => {
    _.castArray(block?.fields || []).forEach((field: any, fieldIndex: number) => {
      if (isFlowSurfacePureRefObject(field?.target)) {
        const targetRef = normalizeFlowSurfaceCreatedRef(
          field.target.ref,
          `${contextPath}.blocks[${blockIndex}].fields[${fieldIndex}].target`,
        );
        if (!blockRefs.has(targetRef)) {
          throwBadRequest(
            `flowSurfaces compose local field target ref '${targetRef}' must match a block ref in the same compose step`,
          );
        }
        field.target = targetRef;
      }
    });
  });

  _.castArray(cloned.layout?.rows || []).forEach((row: any, rowIndex: number) => {
    if (!Array.isArray(row)) {
      return;
    }
    row.forEach((cell: any, cellIndex: number) => {
      if (!_.isPlainObject(cell) || typeof cell.ref !== 'string' || !cell.ref.trim()) {
        return;
      }
      const ref = normalizeFlowSurfaceCreatedRef(cell.ref, `${contextPath}.layout.rows[${rowIndex}][${cellIndex}]`);
      if (!blockRefs.has(ref)) {
        throwBadRequest(
          `flowSurfaces compose local layout ref '${ref}' must match a block ref in the same compose step`,
        );
      }
      delete cell.ref;
      cell.composeRef = ref;
    });
  });

  return cloned;
}
