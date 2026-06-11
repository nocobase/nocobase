/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { FlowDefinition } from '../FlowDefinition';
import { FlowDefinitionOptions } from '../types';
import { BaseFlowRegistry, IFlowRepository } from './BaseFlowRegistry';

export type FlowRegistryData = Record<string, Omit<FlowDefinitionOptions, 'key'> & { key?: string }>;

export class DetachedFlowRegistry extends BaseFlowRegistry {
  constructor(flows: FlowRegistryData = {}) {
    super();
    this.addFlows(_.cloneDeep(flows));
  }

  saveFlow(_flow: FlowDefinition): void {}

  destroyFlow(flowKey: string): void {
    this.removeFlow(flowKey);
  }
}

export function serializeFlowRegistry(registry: Pick<IFlowRepository, 'getFlows'>): FlowRegistryData {
  const flows: FlowRegistryData = {};
  for (const [key, flow] of registry.getFlows()) {
    flows[key] = _.cloneDeep(flow.toData());
  }
  return flows;
}

export function replaceFlowRegistry(
  registry: Pick<IFlowRepository, 'getFlows' | 'removeFlow' | 'addFlows'>,
  flows: FlowRegistryData,
) {
  for (const key of Array.from(registry.getFlows().keys())) {
    registry.removeFlow(key);
  }
  registry.addFlows(_.cloneDeep(flows));
}
