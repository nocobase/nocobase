/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowDefinitionOptions, ModelConstructor } from '../types';
import { FlowModel } from '../models';
import { FlowDefinition } from '../FlowDefinition';
import { BaseFlowRegistry } from './BaseFlowRegistry';

type FlowKey = string;

export class GlobalFlowRegistry extends BaseFlowRegistry {
  constructor(protected target: ModelConstructor) {
    super();
  }

  removeFlow(flowKey: FlowKey): void {
    // Not supported yet for static flows; warn and noop
    console.warn(`GlobalFlowRegistry.removeFlow: removing static flow '${flowKey}' is not supported.`);
  }

  getFlow(flowKey: FlowKey): FlowDefinition | undefined {
    if (this.flows.has(flowKey)) {
      return this.flows.get(flowKey);
    }
    const proto: typeof FlowModel | null = Object.getPrototypeOf(this.target);
    if (proto !== Function.prototype && proto !== Object.prototype && proto?.globalFlowRegistry) {
      return proto.globalFlowRegistry.getFlow(flowKey);
    }
    return undefined;
  }

  getFlows(): Map<FlowKey, FlowDefinition> {
    const flows = new Map<FlowKey, FlowDefinition>(this.flows);
    const proto: typeof FlowModel | null = Object.getPrototypeOf(this.target);
    if (proto !== Function.prototype && proto !== Object.prototype && proto?.globalFlowRegistry) {
      for (const [key, def] of proto.globalFlowRegistry.getFlows().entries()) {
        if (!flows.has(key)) {
          flows.set(key, def);
        }
      }
    }

    // 对静态流进行排序：按 sort 升序；sort 相同的情况下，父类静态流先于子类静态流
    const getClassDepth = (klass: any): number => {
      let depth = 0;
      let cur = klass;
      while (cur && cur !== FlowModel && cur !== Function.prototype && cur !== Object.prototype) {
        cur = Object.getPrototypeOf(cur);
        depth += 1;
      }
      return depth;
    };

    const sortedEntries = Array.from(flows.entries()).sort(([, a], [, b]) => {
      const sa = a.sort ?? 0;
      const sb = b.sort ?? 0;
      if (sa !== sb) return sa - sb;
      const ra = a['flowRegistry'];
      const rb = b['flowRegistry'];
      const da = getClassDepth(ra['target']);
      const db = getClassDepth(rb['target']);
      if (da !== db) return da - db; // 父类（深度更小）在前
      return 0;
    });

    return new Map(sortedEntries);
  }

  saveFlow(flow: FlowDefinition): void {
    // No-op for static flows
  }

  destroyFlow(flowKey: string): void {
    // Static flows are class-level; no persistence. No-op.
  }
}
