/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { throwBadRequest } from './errors';

export type FlowSurfaceEventFlowRecord = Record<string, unknown>;
export type FlowSurfaceEventFlowRegistry = Record<string, FlowSurfaceEventFlowRecord>;

function asPlainRecord(value: unknown): FlowSurfaceEventFlowRecord | null {
  return _.isPlainObject(value) ? (value as FlowSurfaceEventFlowRecord) : null;
}

export function buildFlowSurfaceEmptyEventCondition() {
  return { logic: '$and', items: [] };
}

export function normalizeFlowSurfaceEventFlowOn(on: unknown) {
  if (typeof on === 'string') {
    const eventName = on.trim();
    if (!eventName) {
      return on;
    }
    return {
      eventName,
      defaultParams: {
        condition: buildFlowSurfaceEmptyEventCondition(),
      },
    };
  }

  const onRecord = asPlainRecord(on);
  if (!onRecord) {
    return on;
  }

  const next = _.cloneDeep(onRecord);
  const eventName = String(next.eventName || '').trim();
  if (eventName) {
    next.eventName = eventName;
  }

  const phase = String(next.phase || '').trim();
  if (!phase || phase === 'beforeAllFlows') {
    delete next.phase;
  } else {
    next.phase = phase;
  }

  const defaultParams = asPlainRecord(next.defaultParams) || {};
  if (!asPlainRecord(defaultParams.condition)) {
    defaultParams.condition = buildFlowSurfaceEmptyEventCondition();
  }
  next.defaultParams = defaultParams;

  return next;
}

export function normalizeFlowSurfaceEventFlow(
  actionName: string,
  key: string,
  flowInput: unknown,
): FlowSurfaceEventFlowRecord {
  const flowRecord = asPlainRecord(flowInput);
  if (!flowRecord) {
    throwBadRequest(`flowSurfaces ${actionName} flow '${key}' must be an object`);
  }
  const flow = _.cloneDeep(flowRecord);
  flow.key = key;
  if (asPlainRecord(flow.on) || typeof flow.on === 'string') {
    flow.on = normalizeFlowSurfaceEventFlowOn(flow.on);
  }
  if (_.isUndefined(flow.steps)) {
    flow.steps = {};
  }
  return flow;
}

export function normalizeFlowSurfaceEventFlowRegistry(
  actionName: string,
  flowRegistry: Record<string, unknown>,
): FlowSurfaceEventFlowRegistry;
export function normalizeFlowSurfaceEventFlowRegistry<T>(actionName: string, flowRegistry: T): T;
export function normalizeFlowSurfaceEventFlowRegistry(actionName: string, flowRegistry: unknown) {
  const registryRecord = asPlainRecord(flowRegistry);
  if (!registryRecord) {
    return flowRegistry;
  }
  return Object.fromEntries(
    Object.entries(registryRecord).map(([key, flow]) => [key, normalizeFlowSurfaceEventFlow(actionName, key, flow)]),
  );
}

export function isFlowSurfaceBeforeAllEventFlow(flow: unknown) {
  const flowRecord = asPlainRecord(flow);
  if (!flowRecord) {
    return false;
  }
  const onRecord = asPlainRecord(normalizeFlowSurfaceEventFlowOn(flowRecord.on));
  return (
    Boolean(onRecord) &&
    typeof onRecord?.eventName === 'string' &&
    (typeof onRecord.phase === 'undefined' || onRecord.phase === 'beforeAllFlows')
  );
}
