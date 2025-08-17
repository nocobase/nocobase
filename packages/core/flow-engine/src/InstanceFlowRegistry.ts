/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { observable } from '@formily/reactive';
import { FlowModel } from './models';
import { FlowDefinition, StepDefinition } from './types';

type FlowKey = string;
type FlowDefinitionOptions = Omit<FlowDefinition, 'key'>;

interface FlowStep extends StepDefinition<any> {
  stepKey: string;
  flowKey: FlowKey;
}

export class InstanceFlowRegistry {
  flowDefs: Map<FlowKey, FlowDef> = observable.shallow(new Map());

  constructor(protected model: FlowModel) {}

  addFlows(flowDefs: Record<FlowKey, FlowDefinitionOptions>) {
    for (const [flowKey, flowOptions] of Object.entries(flowDefs || {})) {
      this.addFlow(flowKey, flowOptions);
    }
  }

  addFlow(flowKey: FlowKey, flowOptions: FlowDefinitionOptions) {
    const flowDef = new FlowDef(
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

  hasFlow(flowKey: FlowKey) {
    return this.flowDefs.has(flowKey);
  }

  getFlow(flowKey: FlowKey): FlowDef | undefined {
    return this.flowDefs.get(flowKey) as any;
  }

  async saveFlow(flow: FlowDef) {
    await this.model.save();
  }

  async destroyFlow(flowKey: FlowKey) {
    this.removeFlow(flowKey);
    // TODO
    await this.model.save();
  }

  async saveStep(flowStep: FlowStep) {
    await this.model.save();
  }

  async destroyStep(flowStep: FlowStep) {
    const flow = this.flowDefs.get(flowStep.flowKey);
    flow.removeStep(flowStep.stepKey);
    await this.model.save();
  }
}

class FlowDef {
  _steps: Map<string, StepDefinition> = observable.shallow(new Map());
  constructor(
    protected options: FlowDefinition,
    protected flowRegistry: InstanceFlowRegistry,
  ) {
    // 初始化步骤
    for (const [stepKey, step] of Object.entries(options.steps || {})) {
      this.addStep(stepKey, step);
    }
  }

  get key() {
    return this.options.key;
  }

  get title() {
    return this.options.title;
  }

  get sort() {
    return this.options.sort;
  }

  get on() {
    return this.options.on;
  }

  get manual() {
    return this.options.manual;
  }

  get steps() {
    const steps: Record<string, StepDefinition> = {};
    for (const [stepKey, step] of this._steps) {
      steps[stepKey] = step;
    }
    return steps;
  }

  getSteps() {
    return this._steps;
  }

  getStep(stepKey: string) {
    return this._steps.get(stepKey);
  }

  addStep(stepKey: string, flowStep: StepDefinition) {
    this._steps.set(stepKey, flowStep);
  }

  setStep(stepKey: string, flowStep: StepDefinition) {
    this._steps.set(stepKey, flowStep);
  }

  hasStep(stepKey: string) {
    return this._steps.has(stepKey);
  }

  moveStep(sourceStepKey: string, targetStepKey: string) {}

  removeStep(stepKey: string) {
    this._steps.delete(stepKey);
  }

  async saveStep(stepKey: string) {
    await this.flowRegistry.saveStep({
      flowKey: this.key,
      stepKey,
    });
  }

  async destroyStep(stepKey: string) {
    await this.flowRegistry.destroyStep({
      flowKey: this.key,
      stepKey,
    });
  }

  async save() {
    await this.flowRegistry.saveFlow(this);
  }

  async destroy() {
    await this.flowRegistry.destroyFlow(this.key);
  }

  toData() {
    const data = {
      ...this.options,
    };
    for (const [stepKey, step] of this._steps) {
      data.steps = data.steps || {};
      data.steps[stepKey] = {
        ...step,
      };
    }
    return data;
  }
}
