/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import _ from 'lodash';
import { FlowModel } from './models';
import { FlowDefinitionOptions, IFlowRepository } from './types';
import { FlowDefinition } from './FlowDefinition';

type FlowKey = string;

export class InstanceFlowRegistry implements IFlowRepository {
  flowDefs: Map<FlowKey, FlowDefinition> = observable.shallow(new Map());

  constructor(protected model: FlowModel) {}

  addFlows(flowDefs: Record<FlowKey, Omit<FlowDefinitionOptions, 'key'>>): void {
    for (const [flowKey, flowOptions] of Object.entries(flowDefs || {})) {
      this.addFlow(flowKey, flowOptions);
    }
  }

  addFlow(flowKey: FlowKey, flowOptions: Omit<FlowDefinitionOptions, 'key'>) {
    const flowDef = new FlowDefinition(
      {
        key: flowKey,
        ...flowOptions,
      },
      this,
    );
    this.flowDefs.set(flowKey, flowDef);
    return flowDef;
  }

  removeFlow(flowKey: FlowKey) {
    this.flowDefs.delete(flowKey);
  }

  getFlows() {
    return this.flowDefs;
  }

  mapFlows<T = any>(callback: (flow: FlowDefinition) => T): T[] {
    return [...this.flowDefs.values()].map((flow) => callback(flow));
  }

  hasFlow(flowKey: FlowKey) {
    return this.flowDefs.has(flowKey);
  }

  getFlow(flowKey: FlowKey): FlowDefinition | undefined {
    return this.flowDefs.get(flowKey) as any;
  }

  async saveFlow(flow: FlowDefinition) {
    await this.model.save();
  }

  async destroyFlow(flowKey: FlowKey) {
    this.removeFlow(flowKey);
    // TODO
    await this.model.save();
  }
}
