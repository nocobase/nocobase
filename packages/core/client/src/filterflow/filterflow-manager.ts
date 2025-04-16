/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, Schema } from '@formily/json-schema';
import { observable } from '@formily/reactive';
import { uid } from '@nocobase/utils/client';
import _ from 'lodash';
import {
  FilterHandlerContext,
  FilterFlowOptions,
  FilterFlowStepOptions,
  FilterHandler,
  FilterGroupOptions,
  IFilter,
} from './types';

export class FilterFlowStep {
  options: FilterFlowStepOptions;
  protected filterFlow: FilterFlow;

  constructor(options: FilterFlowStepOptions, flow: FilterFlow) {
    if (!options.key) {
      options.key = uid();
    }
    this.options = observable(options);
    this.filterFlow = flow;
  }

  get key() {
    return this.options.key;
  }

  get title() {
    return this.options.title;
  }

  get filterName() {
    return this.options.filterName;
  }

  get params() {
    return this.options.params || {};
  }

  get condition() {
    return this.options.condition;
  }

  get configureUiSchema() {
    return this.getUiSchema();
  }

  /**
   * 获取实际的 Filter 函数
   */
  getHandler(): FilterHandler | undefined {
    const filter = this.filterFlow.getFilter(this.filterName);
    return filter?.handler;
  }

  get(key: string) {
    return _.get(this.options, key);
  }

  set(key: string | object, value?: any) {
    if (typeof key === 'object' && typeof value === 'undefined') {
      for (const k in key) {
        if (Object.prototype.hasOwnProperty.call(key, k)) {
          const val = key[k];
          _.set(this.options, k, val);
        }
      }
    } else {
      _.set(this.options, key as string, value);
    }
  }

  // 可根据需要添加 save 等方法，如果需要持久化步骤配置
  // async save() { /* ... */ }

  /**
   * 获取 Filter 的 UI Schema
   */
  private getUiSchema(): ISchema | undefined {
    const filter = this.filterFlow.getFilter(this.filterName);
    return filter?.uiSchema;
  }
}

export class FilterFlow {
  protected filterFlowManager: FilterFlowManager;
  protected options: FilterFlowOptions;
  // 使用 Map 来保持插入顺序，并方便按 key 访问
  protected filterSteps: Map<string, FilterFlowStep>;

  constructor(options: FilterFlowOptions, manager: FilterFlowManager) {
    this.filterFlowManager = manager;
    this.filterSteps = observable(new Map<string, FilterFlowStep>());
    // 确保 options 是响应式的
    this.options = observable(options);

    if (Array.isArray(options.steps)) {
      options.steps.forEach((step) => this.addFilterStep(step));
    }
    // 清除原始数组，因为现在步骤由 map 管理
    delete this.options.steps;
  }

  get name() {
    return this.options.name;
  }

  get title() {
    return this.options.title;
  }

  /**
   * 以数组形式获取所有步骤，保持添加顺序
   */
  getSteps(): FilterFlowStep[] {
    return Array.from(this.filterSteps.values());
  }

  getStep(key: string): FilterFlowStep | undefined {
    return this.filterSteps.get(key);
  }

  hasSteps(): boolean {
    return this.filterSteps.size > 0;
  }

  /**
   * 添加一个 Filter 步骤
   * @param stepOptions 步骤配置
   * @returns 创建的 FilterFlowStep 实例
   */
  addFilterStep(stepOptions: FilterFlowStepOptions): FilterFlowStep {
    const instance = new FilterFlowStep(stepOptions, this);
    this.filterSteps.set(instance.key, instance);
    return instance;
  }

  /**
   * 移除一个 Filter 步骤
   * @param stepKey 要移除的步骤的 key
   * @returns 是否成功移除
   */
  removeFilterStep(stepKey: string): boolean {
    return this.filterSteps.delete(stepKey);
  }

  get(key: string) {
    return _.get(this.options, key);
  }

  set(key: string, value: any) {
    _.set(this.options, key, value);
  }

  getOption(key: keyof FilterFlowOptions) {
    return this.options[key];
  }

  setOption(key: keyof FilterFlowOptions, value: any) {
    this.options[key] = value;
  }

  /**
   * 获取指定的 Filter 配置
   * 该方法转发调用到 FilterFlowManager
   */
  getFilter(filterName: string): IFilter | undefined {
    return this.filterFlowManager.getFilter(filterName);
  }

  async remove() {
    this.filterFlowManager.removeFlow(this.name);
  }

  setFilterFlowManager(filterFlowManager: FilterFlowManager) {
    this.filterFlowManager = filterFlowManager;
  }

  // TODO: Save Flow
  // async save() { /* ... */ }
}

// --- FilterFlowManager Class ---
export class FilterFlowManager {
  private filterGroups: Record<string, FilterGroupOptions> = {};
  private filters: Record<string, IFilter> = {};
  private filterFlows: Map<string, FilterFlow>;

  constructor() {
    this.filterFlows = observable(new Map<string, FilterFlow>());
    this.filters = observable.shallow({});
    this.filterGroups = observable.shallow({});
  }

  // --- Filter Management ---

  /**
   * 注册 Filter 分组
   */
  addFilterGroup(group: FilterGroupOptions) {
    this.filterGroups[group.name] = group;
  }

  /**
   * 注册 Filter (可复用的 Filter 逻辑)
   */
  addFilter(filter: IFilter) {
    this.filters[filter.name] = filter;
  }

  /**
   * 获取指定的 Filter 配置
   */
  getFilter(filterName: string): IFilter | undefined {
    return this.filters[filterName];
  }

  /**
   * 移除注册的 Filter
   */
  removeFilter(filterName: string): boolean {
    if (this.filters[filterName]) {
      delete this.filters[filterName];
      return true;
    }
    return false;
  }

  /**
   * 按分组获取 Filters
   */
  getFiltersByGroup() {
    const items = [];
    // Sort groups
    const sortedGroups = Object.values(this.filterGroups).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

    for (const group of sortedGroups) {
      // Sort handlers within the group
      const children = Object.values(this.filters)
        .filter((item) => item.group === group.name)
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

      if (children.length > 0) {
        items.push({
          key: group.name,
          label: group.title,
          type: 'group',
          children: children,
        });
      }
    }
    // Add handlers without a group (optional)
    const ungroupedFilters = Object.values(this.filters)
      .filter((item) => !item.group || !this.filterGroups[item.group])
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));
    if (ungroupedFilters.length > 0) {
      items.push({
        key: 'ungrouped',
        label: 'Others',
        type: 'group',
        children: ungroupedFilters,
      });
    }

    return items;
  }

  // --- Filter Flow Management ---

  /**
   * 注册/添加一个 Filter Flow
   * @param flowOptions 配置对象或 FilterFlow 实例
   * @returns 创建或添加的 FilterFlow 实例
   */
  addFlow(flowOptions: FilterFlowOptions | FilterFlow): FilterFlow {
    let flowInstance: FilterFlow;
    if (flowOptions instanceof FilterFlow) {
      flowInstance = flowOptions;
      flowInstance.setFilterFlowManager(this);
    } else {
      if (!flowOptions.name) {
        throw new Error('FilterFlowOptions must have a name.');
      }
      flowInstance = new FilterFlow(flowOptions, this);
    }

    if (this.filterFlows.has(flowInstance.name)) {
      console.warn(`FilterFlow with name "${flowInstance.name}" is being overwritten.`);
    }
    this.filterFlows.set(flowInstance.name, flowInstance);
    return flowInstance;
  }

  /**
   * 移除一个 Filter Flow
   * @param flowKey 要移除的 Flow 的 key
   * @returns 是否成功移除
   */
  removeFlow(flowKey: string): boolean {
    return this.filterFlows.delete(flowKey);
  }

  /**
   * 获取指定的 Filter Flow
   */
  getFlow(flowKey: string): FilterFlow | undefined {
    return this.filterFlows.get(flowKey);
  }

  /**
   * 获取所有已注册的 Filter Flow
   * @returns Map<string, FilterFlow>
   */
  getFlows(): Map<string, FilterFlow> {
    return this.filterFlows;
  }

  /**
   * 添加一个 Filter 步骤到指定的 Flow
   * @param flowKey 目标 Flow 的 key
   * @param stepOptions 要添加的步骤的配置
   * @returns 添加的 FilterFlowStep 实例，如果 Flow 不存在则返回 undefined
   */
  addFilterStep(flowKey: string, stepOptions: FilterFlowStepOptions): FilterFlowStep | undefined {
    const flow = this.getFlow(flowKey);
    if (flow) {
      return flow.addFilterStep(stepOptions);
    }
    console.error(`FilterFlow with key "${flowKey}" not found. Cannot add step.`);
    return undefined;
  }

  /**
   * 从指定的 Flow 移除一个 Filter 步骤
   * @param flowKey 目标 Flow 的 key
   * @param stepKey 要移除的步骤的 key
   * @returns 是否成功移除
   */
  removeFilterStep(flowKey: string, stepKey: string): boolean {
    const flow = this.getFlow(flowKey);
    if (flow) {
      return flow.removeFilterStep(stepKey);
    }
    console.error(`FilterFlow with key "${flowKey}" not found. Cannot remove step.`);
    return false;
  }

  /**
   * 应用指定的 Filter Flow
   * @param flowKey 要应用的 Filter Flow 的 key
   * @param initialValue 初始值
   * @param context Filter上下文
   * @returns 应用 Flow 中所有 Filter 后的最终值
   */
  async applyFilters(flowKey: string, initialValue: any, context: FilterHandlerContext): Promise<any> {
    const flow = this.getFlow(flowKey);
    if (!flow) {
      console.warn(`FilterFlow with key "${flowKey}" not found. Returning initial value.`);
      return initialValue;
    }

    let currentValue = initialValue;
    const steps = flow.getSteps(); // 获取有序的步骤数组

    if (!context.meta) {
      context.meta = {
        flowKey,
        flowName: flow.name,
      };
    }

    for (const step of steps) {
      // 1. 检查条件
      if (step.condition && !this.checkCondition(step.condition, context)) {
        continue; // 条件不满足，跳过此步骤
      }

      // 2. 获取 Handler
      const handler = step.getHandler();
      if (!handler) {
        console.warn(
          `Filter "${step.filterName}" for step "${step.key}" in flow "${flowKey}" not found. Skipping step.`,
        );
        continue;
      }

      // 3. 执行 Handler
      try {
        const result = handler(currentValue, step.params, context);
        // 处理异步 Handler
        if (result instanceof Promise) {
          currentValue = await result;
        } else {
          currentValue = result;
        }
      } catch (error) {
        console.error(`Error executing filter "${step.filterName}" in step "${step.key}" (flow: "${flowKey}"):`, error);
        break; // 如果一个步骤出错就停止
      }
    }

    return currentValue;
  }

  /**
   * 检查条件是否满足
   * @param condition 条件表达式字符串
   * @param context 上下文对象
   * @returns boolean
   */
  private checkCondition(condition?: string, context?: FilterHandlerContext): boolean {
    if (!condition) {
      return true; // 没有条件，默认通过
    }
    try {
      const result = Schema.compile(condition, { ctx: context });
      return !!result;
    } catch (error) {
      console.error(`Error evaluating condition "${condition}":`, error);
      return false;
    }
  }
}
