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
import type { FlowDefinitionOptions, StepDefinition } from './types';
import { IFlowRepository } from './flow-registry/BaseFlowRegistry';

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
    const sortedSteps = this.getSortedSteps();
    for (const [stepKey, step] of sortedSteps) {
      steps[stepKey] = step.serialize();
    }
    return steps;
  }

  getSortedSteps(): [string, FlowStep][] {
    return [...this._steps.entries()].sort(([, stepA], [, stepB]) => {
      const sortA = stepA.serialize().sort ?? 0;
      const sortB = stepB.serialize().sort ?? 0;
      return sortA - sortB;
    });
  }

  setOptions(flowOptions: Omit<FlowDefinitionOptions, 'key' | 'steps'>) {
    Object.assign(this.options, flowOptions);
  }

  getSteps() {
    return this._steps;
  }

  mapSteps(callback: (step: FlowStep) => any) {
    const sortedSteps = this.getSortedSteps();
    return sortedSteps.map(([, step]) => {
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
      // Auto-assign sort value if not provided
      if (flowStep.sort === undefined) {
        const maxSort = Math.max(0, ...Array.from(this._steps.values()).map((step) => step.serialize().sort ?? 0));
        flowStep = { ...flowStep, sort: maxSort + 1 };
      }

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

  moveStep(sourceStepKey: string, targetStepKey: string) {
    if (!this._steps.has(sourceStepKey)) {
      throw new Error(`Source step '${sourceStepKey}' not found`);
    }
    if (!this._steps.has(targetStepKey)) {
      throw new Error(`Target step '${targetStepKey}' not found`);
    }
    if (sourceStepKey === targetStepKey) {
      return; // No need to move
    }

    // Get current sorted steps
    const sortedSteps = this.getSortedSteps();
    const newOrder: [string, FlowStep][] = [];

    // Remove source step from current order
    const filteredSteps = sortedSteps.filter(([key]) => key !== sourceStepKey);
    const sourceStep = this._steps.get(sourceStepKey)!;

    // Insert source step before target step
    for (const [stepKey, step] of filteredSteps) {
      if (stepKey === targetStepKey) {
        newOrder.push([sourceStepKey, sourceStep]);
      }
      newOrder.push([stepKey, step]);
    }

    // Reassign sort values as integers: 1, 2, 3, ...
    newOrder.forEach(([stepKey, step], index) => {
      step.setOptions({ sort: index + 1 });
    });
  }

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
    const sortedSteps = this.getSortedSteps();
    for (const [stepKey, step] of sortedSteps) {
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
