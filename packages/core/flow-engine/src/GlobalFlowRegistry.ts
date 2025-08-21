/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowDefinitionOptions, ModelConstructor, IFlowRepository } from './types';
import { FlowModel } from './models';
import { FlowDefinition } from './FlowDefinition';

type FlowKey = string;

export class GlobalFlowRegistry implements IFlowRepository {
  constructor(private target: ModelConstructor | FlowModel) {}

  private cache: Map<FlowKey, FlowDefinition> = new Map();

  addFlows(flows: Record<FlowKey, FlowDefinitionOptions>): void {
    for (const [flowKey, flowOptions] of Object.entries(flows || {})) {
      this.addFlow(flowKey, flowOptions);
    }
  }

  addFlow(flowKey: FlowKey, options: FlowDefinitionOptions): FlowDefinition | void {
    const def = new FlowDefinition({ key: flowKey, ...options } as any, this);
    this.cache.set(flowKey, def);
    return def;
  }

  removeFlow(flowKey: FlowKey): void {
    // Not supported yet for static flows; warn and noop
    console.warn(`GlobalFlowRegistry.removeFlow: removing static flow '${flowKey}' is not supported.`);
  }

  hasFlow(flowKey: FlowKey): boolean {
    return !!this.getFlow(flowKey);
  }

  getFlow(flowKey: FlowKey): FlowDefinition | undefined {
    if (this.cache.has(flowKey)) {
      return this.cache.get(flowKey);
    }
    const proto: typeof FlowModel | null = Object.getPrototypeOf(this.target);
    if (proto !== Function.prototype && proto !== Object.prototype && proto?.globalFlowRegistry) {
      return proto.globalFlowRegistry.getFlow(flowKey);
    }
    return undefined;
  }

  getFlows(): Map<FlowKey, FlowDefinition> {
    const flows = new Map<FlowKey, FlowDefinition>(this.cache);
    const proto: typeof FlowModel | null = Object.getPrototypeOf(this.target);
    if (proto !== Function.prototype && proto !== Object.prototype && proto?.globalFlowRegistry) {
      for (const [key, def] of proto.globalFlowRegistry.getFlows().entries()) {
        if (!flows.has(key)) {
          flows.set(key, new FlowDefinition(def, this));
        }
      }
    }
    return flows;
  }

  mapFlows<T = any>(callback: (flow: FlowDefinition) => T): T[] {
    const flows = this.getFlows();
    return [...flows.values()].map((flow) => callback(flow));
  }

  saveFlow(flow: FlowDefinition): void {
    // No-op for static flows
  }

  destroyFlow(flowKey: string): void {
    // Static flows are class-level; no persistence. No-op.
  }
}
