/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { FlowModel } from '../models';
import { FlowDefinition } from '../FlowDefinition';
import { BaseFlowRegistry } from './BaseFlowRegistry';

type FlowKey = string;

export class InstanceFlowRegistry extends BaseFlowRegistry {
  constructor(protected model: FlowModel) {
    super();
  }

  async saveFlow(flow: FlowDefinition): Promise<void> {
    await this.model.save();
  }

  async destroyFlow(flowKey: FlowKey): Promise<void> {
    this.removeFlow(flowKey);
    // TODO
    await this.model.save();
  }

  async moveStep(flowKey: FlowKey, sourceStepKey: string, targetStepKey: string): Promise<void> {
    super.moveStep(flowKey, sourceStepKey, targetStepKey);
    await this.model.save();
  }
}
