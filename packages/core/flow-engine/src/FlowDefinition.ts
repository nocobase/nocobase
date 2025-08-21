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
import type { IFlowRepository, FlowDefinitionOptions, StepDefinition } from './types';

export class FlowDefinition {
  _steps: Map<string, FlowStep> = observable.shallow(new Map());
  protected options: Omit<FlowDefinitionOptions, 'steps'>;

  constructor(
    options: FlowDefinitionOptions,
    protected flowRegistry: IFlowRepository,
  ) {
    this.options = observable.shallow(_.omit(options, ['steps']));
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

  set title(title: string) {
    this.options.title = title;
  }

  get sort() {
    return this.options.sort;
  }

  get on() {
    return this.options.on;
  }

  set on(on) {
    this.options.on = on;
  }

  get manual() {
    return this.options.manual;
  }

  set manual(manual: boolean) {
    this.options.manual = manual;
  }

  get steps() {
    const steps: Record<string, StepDefinition> = {};
    for (const [stepKey, step] of this._steps) {
      steps[stepKey] = step.serialize();
    }
    return steps;
  }

  setOptions(flowOptions: Omit<FlowDefinitionOptions, 'key' | 'steps'>) {
    Object.assign(this.options, flowOptions);
  }

  getSteps() {
    return this._steps;
  }

  mapSteps(callback: (step: FlowStep) => any) {
    return [...this._steps.values()].map((step) => {
      return callback(step);
    });
  }

  getStep(stepKey: string) {
    return this._steps.get(stepKey);
  }

  addStep(stepKey: string, flowStep: Omit<StepDefinition, 'key'>) {
    const existingStep = this._steps.get(stepKey);
    if (existingStep) {
      existingStep.setOptions(flowStep);
      return existingStep;
    } else {
      const newStep = new FlowStep(
        {
          ...flowStep,
          key: stepKey,
        },
        this,
      );
      this._steps.set(stepKey, newStep);
      return newStep;
    }
  }

  setStep(stepKey: string, flowStep: StepDefinition) {
    return this.addStep(stepKey, flowStep);
  }

  hasStep(stepKey: string) {
    return this._steps.has(stepKey);
  }

  moveStep(sourceStepKey: string, targetStepKey: string) {}

  removeStep(stepKey: string) {
    this._steps.delete(stepKey);
  }

  async saveStep(step: FlowStep) {
    await this.flowRegistry.saveFlow(this);
  }

  async destroyStep(stepKey: string) {
    this.removeStep(stepKey);
    await this.flowRegistry.saveFlow(this);
  }

  async save() {
    await this.flowRegistry.saveFlow(this);
  }

  async destroy() {
    await this.flowRegistry.destroyFlow(this.key);
  }

  remove() {
    return this.flowRegistry.removeFlow(this.key);
  }

  toData() {
    return this.serialize();
  }

  serialize() {
    const data: any = {
      ...this.options,
    };
    for (const [stepKey, step] of this._steps) {
      data.steps = data.steps || {};
      data.steps[stepKey] = {
        ...step.serialize(),
      };
    }
    return data;
  }
}

class FlowStep {
  protected options: StepDefinition;

  constructor(
    options: StepDefinition,
    protected flowDef: FlowDefinition,
  ) {
    this.options = observable.shallow(options);
  }

  setOptions(stepOptions: Omit<StepDefinition, 'key' | 'flowKey'>) {
    Object.assign(this.options, stepOptions);
  }

  get key() {
    return this.options.key;
  }

  get flowKey() {
    return this.flowDef.key;
  }

  get title() {
    return this.options.title;
  }

  set title(title: string) {
    this.options.title = title;
  }

  get uiSchema() {
    return this.options.uiSchema;
  }

  get defaultParams() {
    return this.options.defaultParams || {};
  }

  get use() {
    return this.options.use;
  }

  async save() {
    return this.flowDef.save();
  }

  async remove() {
    return this.flowDef.removeStep(this.key);
  }

  async destroy() {
    return this.flowDef.destroyStep(this.key);
  }

  serialize() {
    return {
      ...this.options,
      flowKey: this.flowDef.key,
    };
  }
}
