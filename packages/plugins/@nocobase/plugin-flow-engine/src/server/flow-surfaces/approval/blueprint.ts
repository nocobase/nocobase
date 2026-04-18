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

export const FLOW_SURFACE_APPROVAL_BLUEPRINT_SURFACES = ['initiator', 'approver', 'taskCard'] as const;

export type FlowSurfaceApprovalBlueprintSurface = (typeof FLOW_SURFACE_APPROVAL_BLUEPRINT_SURFACES)[number];

export type FlowSurfaceApplyApprovalBlueprintDocument = {
  version: '1';
  mode: 'replace';
  surface: FlowSurfaceApprovalBlueprintSurface;
  workflowId?: string | number;
  nodeId?: string | number;
  blocks?: Record<string, any>[];
  fields?: Array<string | Record<string, any>>;
  layout?: Record<string, any>;
};

function normalizeApprovalBlueprintVersion(value: any) {
  const normalized = _.isUndefined(value) ? '1' : String(value || '').trim();
  if (normalized !== '1') {
    throwBadRequest(`flowSurfaces applyApprovalBlueprint only supports version '1'`);
  }
  return '1' as const;
}

function normalizeApprovalBlueprintMode(value: any) {
  const normalized = _.isUndefined(value) ? 'replace' : String(value || '').trim();
  if (normalized !== 'replace') {
    throwBadRequest(`flowSurfaces applyApprovalBlueprint only supports mode 'replace'`);
  }
  return 'replace' as const;
}

function normalizeApprovalBlueprintSurface(value: any): FlowSurfaceApprovalBlueprintSurface {
  const normalized = String(value || '').trim() as FlowSurfaceApprovalBlueprintSurface;
  if (!FLOW_SURFACE_APPROVAL_BLUEPRINT_SURFACES.includes(normalized)) {
    throwBadRequest(
      `flowSurfaces applyApprovalBlueprint surface must be one of ${FLOW_SURFACE_APPROVAL_BLUEPRINT_SURFACES.map(
        (item) => `'${item}'`,
      ).join(', ')}`,
    );
  }
  return normalized;
}

function normalizeOptionalBindingId(value: any, fieldName: 'workflowId' | 'nodeId') {
  if (_.isUndefined(value) || _.isNull(value) || String(value).trim() === '') {
    return undefined;
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const normalized = String(value).trim();
  if (!normalized) {
    return undefined;
  }
  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }
  throwBadRequest(`flowSurfaces applyApprovalBlueprint ${fieldName} must be an integer identifier`);
}

function normalizeBlocks(input: any) {
  if (_.isUndefined(input)) {
    return [];
  }
  if (!Array.isArray(input)) {
    throwBadRequest(`flowSurfaces applyApprovalBlueprint blocks must be an array`);
  }
  const normalized = _.cloneDeep(input);
  normalized.forEach((block, index) => {
    if (!_.isPlainObject(block)) {
      throwBadRequest(`flowSurfaces applyApprovalBlueprint blocks[${index}] must be an object`);
    }
    if (!_.isUndefined(block.template)) {
      throwBadRequest(`flowSurfaces applyApprovalBlueprint blocks[${index}] does not accept template`);
    }
  });
  return normalized;
}

function normalizeFields(input: any) {
  if (_.isUndefined(input)) {
    return [];
  }
  if (!Array.isArray(input)) {
    throwBadRequest(`flowSurfaces applyApprovalBlueprint fields must be an array`);
  }
  return _.cloneDeep(input);
}

function normalizeLayout(input: any) {
  if (_.isUndefined(input)) {
    return undefined;
  }
  if (!_.isPlainObject(input)) {
    throwBadRequest(`flowSurfaces applyApprovalBlueprint layout must be an object`);
  }
  return _.cloneDeep(input);
}

export function prepareFlowSurfaceApplyApprovalBlueprintDocument(
  values: Record<string, any>,
): FlowSurfaceApplyApprovalBlueprintDocument {
  const version = normalizeApprovalBlueprintVersion(values?.version);
  const mode = normalizeApprovalBlueprintMode(values?.mode);
  const surface = normalizeApprovalBlueprintSurface(values?.surface);
  const workflowId = normalizeOptionalBindingId(values?.workflowId, 'workflowId');
  const nodeId = normalizeOptionalBindingId(values?.nodeId, 'nodeId');
  const layout = normalizeLayout(values?.layout);

  if (surface === 'initiator') {
    if (_.isUndefined(workflowId)) {
      throwBadRequest(`flowSurfaces applyApprovalBlueprint surface 'initiator' requires workflowId`);
    }
    if (!_.isUndefined(nodeId)) {
      throwBadRequest(`flowSurfaces applyApprovalBlueprint surface 'initiator' does not accept nodeId`);
    }
    if (!_.isUndefined(values?.fields)) {
      throwBadRequest(`flowSurfaces applyApprovalBlueprint surface 'initiator' does not accept fields`);
    }
    return {
      version,
      mode,
      surface,
      workflowId,
      blocks: normalizeBlocks(values?.blocks),
      layout,
    };
  }

  if (surface === 'approver') {
    if (_.isUndefined(nodeId)) {
      throwBadRequest(`flowSurfaces applyApprovalBlueprint surface 'approver' requires nodeId`);
    }
    if (!_.isUndefined(workflowId)) {
      throwBadRequest(`flowSurfaces applyApprovalBlueprint surface 'approver' does not accept workflowId`);
    }
    if (!_.isUndefined(values?.fields)) {
      throwBadRequest(`flowSurfaces applyApprovalBlueprint surface 'approver' does not accept fields`);
    }
    return {
      version,
      mode,
      surface,
      nodeId,
      blocks: normalizeBlocks(values?.blocks),
      layout,
    };
  }

  if (_.isUndefined(workflowId) === _.isUndefined(nodeId)) {
    throwBadRequest(
      `flowSurfaces applyApprovalBlueprint surface 'taskCard' requires exactly one of workflowId or nodeId`,
    );
  }
  if (!_.isUndefined(values?.blocks)) {
    throwBadRequest(`flowSurfaces applyApprovalBlueprint surface 'taskCard' does not accept blocks`);
  }
  return {
    version,
    mode,
    surface,
    ...(typeof workflowId !== 'undefined' ? { workflowId } : {}),
    ...(typeof nodeId !== 'undefined' ? { nodeId } : {}),
    fields: normalizeFields(values?.fields),
    layout,
  };
}
