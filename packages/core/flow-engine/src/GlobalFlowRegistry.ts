/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowDefinitionOptions, ModelConstructor } from './types';
import { FlowModel } from './models';
import { FlowDefinition } from './FlowDefinition';
import { BaseFlowRegistry } from './BaseFlowRegistry';

type FlowKey = string;

export class GlobalFlowRegistry extends BaseFlowRegistry {
  constructor(protected target: ModelConstructor | FlowModel) {
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
          flows.set(key, new FlowDefinition(def, this));
        }
      }
    }
    return flows;
  }

  saveFlow(flow: FlowDefinition): void {
    // No-op for static flows
  }

  destroyFlow(flowKey: string): void {
    // Static flows are class-level; no persistence. No-op.
  }
}
