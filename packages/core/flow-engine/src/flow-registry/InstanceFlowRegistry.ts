/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { FlowDefinition } from '../FlowDefinition';
import { FlowModel } from '../models';
import { BaseFlowRegistry } from './BaseFlowRegistry';

type FlowKey = string;

export class InstanceFlowRegistry extends BaseFlowRegistry {
  static readonly _type = 'instance' as const;
  constructor(protected model: FlowModel) {
    super();
  }

  async save() {
    await this.model.saveStepParams();
  }

  async saveFlow(flow: FlowDefinition): Promise<void> {
    await this.model.saveStepParams();
  }

  async destroyFlow(flowKey: FlowKey): Promise<void> {
    this.removeFlow(flowKey);
    // TODO
    await this.model.saveStepParams();
  }

  async moveStep(flowKey: FlowKey, sourceStepKey: string, targetStepKey: string): Promise<void> {
    super.moveStep(flowKey, sourceStepKey, targetStepKey);
    await this.model.saveStepParams();
  }
}
