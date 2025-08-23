/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowDefinition } from '../FlowDefinition';
import type { FlowModel } from '../models';

type FlowKey = string;

/**
 * CombinedFlowRegistry provides a read-only, merged view of instance-level and class-level (global)
 * flow definitions for a given model instance. Instance flows take precedence over global flows.
 */
export class CombinedFlowRegistry {
  constructor(private readonly model: FlowModel) {}

  /**
   * Get a single flow by key. Prefers instance flow; falls back to class-level global flow.
   */
  getFlow(flowKey: FlowKey): FlowDefinition | undefined {
    // prefer instance-level flow
    const instanceFlow = this.model.flowRegistry?.getFlow(flowKey);
    if (instanceFlow) return instanceFlow;
    // then class-level flow via GlobalFlowRegistry
    const Cls = this.model.constructor as any;
    return Cls?.globalFlowRegistry?.getFlow?.(flowKey);
  }

  /**
   * Get merged flows map. Instance flows override global flows with same key.
   */
  getFlows(): Map<FlowKey, FlowDefinition> {
    const all = new Map<FlowKey, FlowDefinition>();
    // instance flows first
    const instanceFlows = this.model.flowRegistry?.getFlows?.() as Map<FlowKey, FlowDefinition> | undefined;
    if (instanceFlows) for (const [k, v] of instanceFlows) all.set(k, v);
    // then merge in global flows if absent
    const Cls = this.model.constructor as any;
    const globalFlows = Cls?.globalFlowRegistry?.getFlows?.() as Map<FlowKey, FlowDefinition> | undefined;
    if (globalFlows) {
      for (const [k, v] of globalFlows) {
        if (!all.has(k)) all.set(k, v);
      }
    }
    return all;
  }

  /**
   * Get auto-apply flows (no `on` and not `manual: true`), sorted by `sort`.
   */
  getAutoFlows(): FlowDefinition[] {
    return Array.from(this.getFlows().values())
      .filter((flow) => {
        if ((flow as any).on) return false;
        if ((flow as any).manual === true) return false;
        return true;
      })
      .sort((a, b) => ((a as any).sort || 0) - ((b as any).sort || 0));
  }

  /**
   * Get flows bound to a specific event name via `flow.on`.
   */
  getFlowsByEvent(eventName: string): FlowDefinition[] {
    return Array.from(this.getFlows().values()).filter((flow) => {
      const on = (flow as any).on;
      if (!on) return false;
      if (typeof on === 'string') return on === eventName;
      if (on && typeof on === 'object') return on.eventName === eventName;
      return false;
    });
  }
}
