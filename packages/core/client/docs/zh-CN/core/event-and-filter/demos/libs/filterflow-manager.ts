import { ISchema, Schema } from '@formily/json-schema';
import { observable } from '@formily/reactive';
import { uid } from '@nocobase/utils/client';
import _ from 'lodash';
import {
  FilterContext,
  FilterFlowOptions,
  FilterFlowStepOptions,
  FilterHandlerFunction,
  FilterHandlerGroupOptions,
  FilterHandlerOptions,
} from './types';

export class FilterFlowStep {
  options: FilterFlowStepOptions;
  protected filterFlowManager: FilterFlowManager;

  constructor(options: FilterFlowStepOptions, manager: FilterFlowManager) {
    if (!options.key) {
      options.key = uid();
    }
    this.options = observable(options);
    this.filterFlowManager = manager;
  }

  get key() {
    return this.options.key;
  }

  get title() {
    return this.options.title;
  }

  get filterHandlerName() {
    return this.options.filterHandlerName;
  }

  get params() {
    return this.options.params || {};
  }

  get condition() {
    return this.options.condition;
  }

  /**
   * 获取实际的 Filter Handler 函数
   */
  getHandler(): FilterHandlerFunction | undefined {
    const handlerOptions = this.filterFlowManager.getFilterHandler(this.filterHandlerName);
    return handlerOptions?.handler;
  }

  /**
   * 获取 Filter Handler 的 UI Schema
   */
  getUiSchema(): ISchema | undefined {
    const handlerOptions = this.filterFlowManager.getFilterHandler(this.filterHandlerName);
    return handlerOptions?.uiSchema;
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
    const instance = new FilterFlowStep(stepOptions, this.filterFlowManager);
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

  // 可根据需要添加 save/remove Flow 的方法
  // async save() { /* ... */ }
  // async remove() { this.filterFlowManager.removeFlow(this.key); }
}

// --- FilterFlowManager Class ---
export class FilterFlowManager {
  private filterHandlerGroups: Record<string, FilterHandlerGroupOptions> = {};
  private filterHandlers: Record<string, FilterHandlerOptions> = {};
  private filterFlows: Map<string, FilterFlow>;

  constructor() {
    this.filterFlows = observable(new Map<string, FilterFlow>());
    this.filterHandlers = observable.shallow({});
    this.filterHandlerGroups = observable.shallow({});
  }

  // --- Filter Handler Management ---

  /**
   * 注册 Filter Handler 分组
   */
  addFilterHandlerGroup(group: FilterHandlerGroupOptions) {
    this.filterHandlerGroups[group.name] = group;
  }

  /**
   * 注册 Filter Handler (可复用的 Filter 逻辑)
   */
  addFilterHandler(handlerOptions: FilterHandlerOptions) {
    this.filterHandlers[handlerOptions.name] = handlerOptions;
  }

  /**
   * 获取指定的 Filter Handler 配置
   */
  getFilterHandler(handlerName: string): FilterHandlerOptions | undefined {
    return this.filterHandlers[handlerName];
  }

  /**
   * 移除注册的 Filter Handler
   */
  removeFilterHandler(handlerName: string): boolean {
    if (this.filterHandlers[handlerName]) {
      delete this.filterHandlers[handlerName];
      return true;
    }
    return false;
  }

  /**
   * 按分组获取 Filter Handlers (用于 UI 选择等)
   */
  getFilterHandlersByGroup() {
    const items = [];
    // Sort groups
    const sortedGroups = Object.values(this.filterHandlerGroups).sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0));

    for (const group of sortedGroups) {
      // Sort handlers within the group
      const children = Object.values(this.filterHandlers)
        .filter((item) => item.group === group.name)
        .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
        .map((item) => ({
          key: item.name,
          label: item.title,
          // 可选：可以添加 uiSchema 等信息供 UI 使用
          // uiSchema: item.uiSchema,
          // description: item.description,
        }));

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
    const ungroupedHandlers = Object.values(this.filterHandlers)
      .filter((item) => !item.group || !this.filterHandlerGroups[item.group])
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((item) => ({
        key: item.name,
        label: item.title,
      }));
    if (ungroupedHandlers.length > 0) {
      items.push({
        key: 'ungrouped', // Or some other identifier
        label: 'Others', // Or leave it out if only grouped items are needed
        type: 'group',
        children: ungroupedHandlers,
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
      // 确保 manager 被设置 (如果实例是从外部创建的)
      if ((flowInstance as any).filterFlowManager !== this) {
        (flowInstance as any).filterFlowManager = this;
        // 可能需要递归更新步骤的 manager 引用，但这通常在构造时完成
      }
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
  addFilter(flowKey: string, stepOptions: FilterFlowStepOptions): FilterFlowStep | undefined {
    const flow = this.getFlow(flowKey);
    if (flow) {
      return flow.addFilterStep(stepOptions);
    }
    console.warn(`FilterFlow with key "${flowKey}" not found. Cannot add step.`);
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
    console.warn(`FilterFlow with key "${flowKey}" not found. Cannot remove step.`);
    return false;
  }

  /**
   * 应用指定的 Filter Flow
   * @param flowKey 要应用的 Filter Flow 的 key
   * @param initialValue 初始值
   * @param context 过滤器上下文
   * @returns 应用 Flow 中所有 Filter 后的最终值
   */
  async applyFilters(flowKey: string, initialValue: any, context: FilterContext): Promise<any> {
    const flow = this.getFlow(flowKey);
    if (!flow) {
      console.warn(`FilterFlow with key "${flowKey}" not found. Returning initial value.`);
      return initialValue;
    }

    let currentValue = initialValue;
    const steps = flow.getSteps(); // 获取有序的步骤数组

    for (const step of steps) {
      // 1. 检查条件
      if (step.condition && !this.checkCondition(step.condition, context)) {
        continue; // 条件不满足，跳过此步骤
      }

      // 2. 获取 Handler
      const handler = step.getHandler();
      if (!handler) {
        console.warn(
          `Filter handler "${step.filterHandlerName}" for step "${step.key}" in flow "${flowKey}" not found. Skipping step.`,
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

        // 检查 context 中是否有中断信号 (例如 context._cancel = true)
        if (context?._cancel) {
          console.log(`Filter flow "${flowKey}" cancelled at step "${step.key}".`);
          break; // 提前退出循环
        }
      } catch (error) {
        console.error(
          `Error executing filter handler "${step.filterHandlerName}" in step "${step.key}" (flow: "${flowKey}"):`,
          error,
        );
        // 可选择是否继续执行后续步骤或直接抛出错误中断流程
        // throw error; // 如果需要中断
        // 或者收集错误信息到 context.errors
        if (!context.errors) context.errors = [];
        context.errors.push({ stepKey: step.key, handlerName: step.filterHandlerName, error });
        // break; // 如果一个步骤出错就停止
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
  private checkCondition(condition: string | undefined, context: FilterContext): boolean {
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
