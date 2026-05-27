/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { getFieldInterface, normalizeFieldPath, resolveFieldFromCollection } from './service-helpers';

export type FlowSurfaceAutoFieldGridField = {
  key?: string;
  type?: string;
  fieldPath?: string;
  associationPathName?: string;
  fieldInterface?: string;
};

export type FlowSurfaceAutoFieldGridLayout = {
  rows: Array<Array<{ key: string; span: number }>>;
};

const FLOW_SURFACE_FIELD_GRID_BLOCK_TYPES = new Set(['createForm', 'editForm', 'details', 'filterForm']);
const FLOW_SURFACE_WIDE_FIELD_GRID_BLOCK_TYPES = new Set(['createForm', 'editForm', 'details']);
const FLOW_SURFACE_WIDE_FIELD_INTERFACES = new Set(['richtext', 'vditor']);

function normalizeText(value: any) {
  return String(value || '').trim();
}

export function resolveFlowSurfaceFieldGridFieldInterface(input: {
  collection?: any;
  fieldPath?: string;
  associationPathName?: string;
}) {
  const fieldPath = normalizeFieldPath(normalizeText(input.fieldPath), normalizeText(input.associationPathName));
  if (!input.collection || !fieldPath) {
    return undefined;
  }
  return getFieldInterface(resolveFieldFromCollection(input.collection, fieldPath));
}

function buildCompactFieldGridRow(keys: string[], blockType?: string) {
  const normalizedKeys = keys.filter(Boolean);
  if (!normalizedKeys.length) {
    return [];
  }
  if (blockType === 'filterForm') {
    const span = normalizedKeys.length === 1 ? 24 : normalizedKeys.length === 2 ? 12 : 8;
    return normalizedKeys.map((key) => ({ key, span }));
  }
  if (normalizedKeys.length === 1) {
    return [{ key: normalizedKeys[0], span: 24 }];
  }
  return normalizedKeys.map((key) => ({ key, span: 12 }));
}

function isStandaloneFieldGridField(field: FlowSurfaceAutoFieldGridField, blockType?: string) {
  if (normalizeText(field.type) === 'divider') {
    return true;
  }
  if (!FLOW_SURFACE_WIDE_FIELD_GRID_BLOCK_TYPES.has(blockType || '')) {
    return false;
  }
  return FLOW_SURFACE_WIDE_FIELD_INTERFACES.has(normalizeText(field.fieldInterface).toLowerCase());
}

export function buildFlowSurfaceAutoFieldGridLayout(
  fields: FlowSurfaceAutoFieldGridField[],
  blockType?: string,
): FlowSurfaceAutoFieldGridLayout | undefined {
  if (!FLOW_SURFACE_FIELD_GRID_BLOCK_TYPES.has(blockType || '') || !fields.length) {
    return undefined;
  }

  const rows: FlowSurfaceAutoFieldGridLayout['rows'] = [];
  const chunkSize = blockType === 'filterForm' ? 3 : 2;
  let pendingKeys: string[] = [];

  const flushPending = () => {
    if (!pendingKeys.length) {
      return;
    }
    rows.push(buildCompactFieldGridRow(pendingKeys, blockType));
    pendingKeys = [];
  };

  fields.forEach((field) => {
    const key = normalizeText(field?.key);
    if (!key) {
      return;
    }
    if (isStandaloneFieldGridField(field, blockType)) {
      flushPending();
      rows.push([{ key, span: 24 }]);
      return;
    }
    pendingKeys.push(key);
    if (pendingKeys.length >= chunkSize) {
      flushPending();
    }
  });

  flushPending();
  return rows.length ? { rows } : undefined;
}
