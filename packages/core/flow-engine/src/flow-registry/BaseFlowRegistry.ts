/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowDefinitionOptions } from '../types';
import { FlowDefinition } from '../FlowDefinition';
import { observable } from '@formily/reactive';

type FlowKey = string;

export interface IFlowRepository {
  addFlows(flowDefs: Record<string, Omit<FlowDefinitionOptions, 'key'>>): void;
  addFlow(flowKey: string, flowOptions: Omit<FlowDefinitionOptions, 'key'>): FlowDefinition | void;
  removeFlow(flowKey: string): void;
  getFlows(): Map<string, FlowDefinition>;
  mapFlows<T = any>(callback: (flow: FlowDefinition) => T): T[];
  hasFlow(flowKey: string): boolean;
  getFlow(flowKey: string): FlowDefinition | undefined;
  saveFlow(flow: FlowDefinition): Promise<any> | void;
  destroyFlow(flowKey: string): Promise<any> | void;
  moveStep(flowKey: string, sourceStepKey: string, targetStepKey: string): Promise<any> | void;
}

/**
 * 抽象基类，封装通用的 Flow Registry 逻辑
 * 子类只需实现持久化相关的方法
 */
export abstract class BaseFlowRegistry implements IFlowRepository {
  protected flows: Map<FlowKey, FlowDefinition>;

  constructor() {
    this.flows = observable.shallow(new Map());
  }

  addFlows(flows: Record<FlowKey, Omit<FlowDefinitionOptions, 'key'> & { key?: string }>): void {
    for (const [flowKey, flowOptions] of Object.entries(flows || {})) {
      this.addFlow(flowKey, flowOptions);
    }
  }

  addFlow(flowKey: FlowKey, flowOptions: Omit<FlowDefinitionOptions, 'key'> & { key?: string }): FlowDefinition {
    const flow = new FlowDefinition(
      {
        ...flowOptions,
        key: flowKey,
      },
      this,
    );
    this.flows.set(flowKey, flow);
    return flow;
  }

  hasFlow(flowKey: FlowKey): boolean {
    const flow = this.flows.get(flowKey);
    return !!flow;
  }

  getFlow(flowKey: FlowKey): FlowDefinition | undefined {
    return this.flows.get(flowKey);
  }

  getFlows(): Map<FlowKey, FlowDefinition> {
    return this.flows;
  }

  removeFlow(flowKey: FlowKey): void {
    this.flows.delete(flowKey);
  }

  mapFlows<T = any>(callback: (flow: FlowDefinition) => T): T[] {
    const flows = this.getFlows();
    return [...flows.values()].map((flow) => callback(flow));
  }

  moveStep(flowKey: FlowKey, sourceStepKey: string, targetStepKey: string): void {
    const flow = this.getFlow(flowKey);
    if (!flow) {
      throw new Error(`Flow '${flowKey}' not found`);
    }
    flow.moveStep(sourceStepKey, targetStepKey);
  }

  // 抽象方法 - 子类必须实现持久化逻辑
  abstract saveFlow(flow: FlowDefinition): Promise<any> | void;
  abstract destroyFlow(flowKey: string): Promise<any> | void;
}
