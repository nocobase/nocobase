/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { batch, define, observable, observe } from '@formily/reactive';
import { observer } from '@formily/reactive-react';
import _ from 'lodash';
import React from 'react';
import { uid } from 'uid/secure';
import { openRequiredParamsStepFormDialog as openRequiredParamsStepFormDialogFn } from '../components/settings/wrappers/contextual/StepRequiredSettingsDialog';
import { openStepSettingsDialog as openStepSettingsDialogFn } from '../components/settings/wrappers/contextual/StepSettingsDialog';
import { Emitter } from '../emitter';
import { FlowModelContext, FlowRuntimeContext } from '../flowContext';
import { FlowEngine } from '../flowEngine';
import type {
  ArrayElementType,
  CreateModelOptions,
  CreateSubModelOptions,
  DefaultStructure,
  FlowDefinition,
  FlowModelMeta,
  FlowModelOptions,
  ParentFlowModel,
  StepDefinition,
  StepParams,
} from '../types';
import { ExtendedFlowDefinition, IModelComponentProps, ReadonlyModelProps } from '../types';
import {
  FlowExitException,
  isInheritedFrom,
  mergeFlowDefinitions,
  resolveDefaultParams,
  resolveParamsExpressions,
  setupRuntimeContextSteps,
} from '../utils';
import { ForkFlowModel } from './forkFlowModel';

// 使用WeakMap存储每个类的meta
const modelMetas = new WeakMap<typeof FlowModel, FlowModelMeta>();

// 使用WeakMap存储每个类的flows
const modelFlows = new WeakMap<typeof FlowModel, Map<string, FlowDefinition>>();

export class FlowModel<Structure extends DefaultStructure = DefaultStructure> {
  public readonly uid: string;
  public sortIndex: number;
  public props: IModelComponentProps = {};
  public stepParams: StepParams = {};
  public flowEngine: FlowEngine;
  public parent: ParentFlowModel<Structure>;
  public subModels: Structure['subModels'];
  private _options: FlowModelOptions<Structure>;
  protected _title: string;

  /**
   * 所有 fork 实例的引用集合。
   * 使用 Set 便于在销毁时主动遍历并调用 dispose，避免悬挂引用。
   */
  public forks: Set<ForkFlowModel<any>> = new Set();
  public emitter: Emitter = new Emitter();

  /**
   * 基于 key 的 fork 实例缓存，用于复用 fork 实例
   */
  private forkCache: Map<string, ForkFlowModel<any>> = new Map();

  /**
   * 上一次 applyAutoFlows 的执行参数
   */
  private _lastAutoRunParams: any[] | null = null;
  private observerDispose: () => void;
  #flowContext: FlowModelContext;

  /**
   * 原始 render 方法的引用
   */
  private _originalRender: (() => any) | null = null;

  /**
   * 缓存的响应式包装器组件（每个实例一个）
   */
  private _reactiveWrapperCache?: React.ComponentType;

  constructor(options: FlowModelOptions<Structure>) {
    if (!options.flowEngine) {
      throw new Error('FlowModel must be initialized with a FlowEngine instance.');
    }
    this.flowEngine = options.flowEngine;
    if (this.flowEngine.getModel(options.uid)) {
      // 此时 new FlowModel 并不创建新实例，而是返回已存在的实例，避免重复创建同一个model实例
      return this.flowEngine.getModel(options.uid);
    }

    if (!options.uid) {
      options.uid = uid();
    }

    this.uid = options.uid;
    this.props = {
      ...options.props,
    };
    this.stepParams = options.stepParams || {};
    this.subModels = {};
    this.sortIndex = options.sortIndex || 0;
    this._options = options;

    define(this, {
      props: observable,
      subModels: observable.shallow,
      stepParams: observable,
      // setProps: action,
      setProps: batch,
      // setStepParams: action,
      setStepParams: batch,
    });
    // 保证onInit在所有属性都定义完成后调用
    // queueMicrotask(() => {
    //   this.onInit(options);
    // });
    this.createSubModels(options.subModels);

    this.observerDispose = observe(this.stepParams, (changed) => {
      // if doesn't change, skip
      if (changed.type === 'set' && _.isEqual(changed.value, changed.oldValue)) {
        return;
      }

      if (this.flowEngine) {
        this.invalidateAutoFlowCache();
      }
      this._rerunLastAutoRun();
      this.forks.forEach((fork) => {
        fork.rerender();
      });
    });

    // 设置 render 方法的响应式包装
    try {
      this.setupReactiveRender();
    } catch (error) {
      console.error(`Failed to setup reactive render for ${this.constructor.name}:`, error);
      // 如果包装失败，确保 render 方法仍然可用
      if (typeof this.render !== 'function') {
        this.render = () => React.createElement('div', null, 'Render method not available');
      }
    }
  }

  get context() {
    if (!this.#flowContext) {
      this.#flowContext = new FlowModelContext(this);
    }
    return this.#flowContext;
  }

  on(eventName: string, listener: (...args: any[]) => void) {
    this.emitter.on(eventName, listener);
  }

  onInit(options) {}

  get async() {
    return this._options.async || false;
  }

  get use() {
    return this._options.use;
  }

  get subKey() {
    return this._options.subKey;
  }

  get subType() {
    return this._options.subType;
  }

  get reactView() {
    return this.flowEngine.reactView;
  }

  static get meta() {
    return modelMetas.get(this);
  }

  get title() {
    // model 可以通过 setTitle 来自定义title， 具有更高的优先级
    return this.translate(this._title) || this.translate(this.constructor['meta']?.title);
  }

  setTitle(value: string) {
    this._title = value;
  }

  private createSubModels(subModels: Record<string, CreateSubModelOptions | CreateSubModelOptions[]>) {
    Object.entries(subModels || {}).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value
          .sort((a, b) => (a.sortIndex || 0) - (b.sortIndex || 0))
          .forEach((item) => {
            this.addSubModel(key, item);
          });
      } else {
        this.setSubModel(key, value);
      }
    });
  }

  public invalidateAutoFlowCache(deep = false) {
    if (this.flowEngine) {
      const cacheKey = FlowEngine.generateApplyFlowCacheKey('autoFlow', 'all', this.uid);
      this.flowEngine.applyFlowCache.delete(cacheKey);
      this.forks.forEach((fork) => {
        const forkCacheKey = FlowEngine.generateApplyFlowCacheKey(`${fork['forkId']}`, 'all', this.uid);
        this.flowEngine.applyFlowCache.delete(forkCacheKey);
      });
    }
    if (deep) {
      const subModelKeys = Object.keys(this.subModels);
      for (const subModelKey of subModelKeys) {
        const subModelValue = this.subModels[subModelKey];
        if (Array.isArray(subModelValue)) {
          for (const subModel of subModelValue) {
            subModel.invalidateAutoFlowCache(deep);
          }
        } else if (subModelValue instanceof FlowModel) {
          subModelValue.invalidateAutoFlowCache(deep);
        }
      }
    }
  }

  /**
   * 设置FlowEngine实例
   * @param {FlowEngine} flowEngine FlowEngine实例
   */
  setFlowEngine(flowEngine: FlowEngine): void {
    // this.flowEngine = flowEngine;
  }

  static define(meta: FlowModelMeta) {
    modelMetas.set(this, meta);
  }

  /**
   * 注册一个流程 (Flow)。支持泛型，能够正确推导出模型类型。
   * @template TModel 具体的FlowModel子类类型
   * @param {string | FlowDefinition<TModel>} keyOrDefinition 流程的 Key 或 FlowDefinition 对象。
   *        如果为字符串，则为流程 Key，需要配合 flowDefinition 参数。
   *        如果为对象，则为包含 key 属性的完整 FlowDefinition。
   * @param {FlowDefinition<TModel>} [flowDefinition] 当第一个参数为流程 Key 时，此参数为流程的定义。
   * @returns {void}
   */
  public static registerFlow<TModel extends new (...args: any[]) => FlowModel<any>>(
    this: TModel,
    keyOrDefinition: string | FlowDefinition<InstanceType<TModel>>,
    flowDefinition?: Omit<FlowDefinition<InstanceType<TModel>>, 'key'> & { key?: string },
  ): void {
    let definition: FlowDefinition<InstanceType<TModel>>;
    let key: string;

    if (typeof keyOrDefinition === 'string' && flowDefinition) {
      key = keyOrDefinition;
      definition = {
        ...flowDefinition,
        key,
      };
    } else if (typeof keyOrDefinition === 'object' && 'key' in keyOrDefinition) {
      key = keyOrDefinition.key;
      definition = keyOrDefinition;
    } else {
      throw new Error('Invalid arguments for registerFlow');
    }

    // 确保当前类有自己的flows Map
    const ModelClass = this;
    if (!modelFlows.has(ModelClass as any)) {
      modelFlows.set(ModelClass as any, new Map<string, FlowDefinition>());
    }
    const flows = modelFlows.get(ModelClass as any);
    if (!flows) {
      throw new Error('Failed to get flows Map for model class');
    }

    if (flows.has(key)) {
      console.warn(`FlowModel: Flow with key '${key}' is already registered and will be overwritten.`);
    }
    flows.set(key, definition as FlowDefinition);
  }

  /**
   * 扩展已存在的流程定义。通过合并现有流程和扩展定义来创建新的流程。
   * @template TModel 具体的FlowModel子类类型
   * @param {string | ExtendedFlowDefinition} keyOrDefinition 流程的 Key 或 ExtendedFlowDefinition 对象。
   *        如果为字符串，则为流程 Key，需要配合 extendDefinition 参数。
   *        如果为对象，则为包含 key 属性的完整 ExtendedFlowDefinition。
   * @param {Omit<ExtendedFlowDefinition, 'key'>} [extendDefinition] 当第一个参数为流程 Key 时，此参数为流程的扩展定义。
   * @returns {void}
   */
  public static extendFlow<TModel extends FlowModel = FlowModel>(
    keyOrDefinition: string | ExtendedFlowDefinition,
    extendDefinition?: Omit<ExtendedFlowDefinition, 'key'>,
  ): void {
    let definition: ExtendedFlowDefinition;
    let key: string;

    if (typeof keyOrDefinition === 'string' && extendDefinition) {
      key = keyOrDefinition;
      definition = {
        ...extendDefinition,
        key,
      };
    } else if (typeof keyOrDefinition === 'object' && 'key' in keyOrDefinition) {
      key = keyOrDefinition.key;
      definition = keyOrDefinition;
    } else {
      throw new Error('Invalid arguments for extendFlow');
    }

    // 获取所有流程（包括从父类继承的）
    const allFlows = this.getFlows();
    const originalFlow = allFlows.get(key);

    if (!originalFlow) {
      console.warn(
        `FlowModel.extendFlow: Cannot extend flow '${key}' as it does not exist in parent class. Registering as new flow.`,
      );
      // 移除patch标记，作为新流程注册
      const { patch, ...newFlowDef } = definition;
      this.registerFlow(newFlowDef as FlowDefinition<TModel>);
      return;
    }

    // 合并流程定义
    const mergedFlow = mergeFlowDefinitions(originalFlow, definition);

    // 注册合并后的流程
    this.registerFlow(mergedFlow as FlowDefinition<TModel>);
  }

  /**
   * 获取已注册的流程定义。
   * 如果当前类不存在对应的flow，会继续往父类查找。
   * @param {string} key 流程 Key。
   * @returns {FlowDefinition | undefined} 流程定义，如果未找到则返回 undefined。
   */
  public getFlow(key: string): FlowDefinition | undefined {
    // 获取当前类的构造函数
    const currentClass = this.constructor as typeof FlowModel;

    // 遍历类继承链，查找流程
    let cls: typeof FlowModel | null = currentClass;
    while (cls) {
      const flows = modelFlows.get(cls);
      if (flows && flows.has(key)) {
        return flows.get(key);
      }

      // 获取父类
      const proto = Object.getPrototypeOf(cls);
      if (proto === Function.prototype || proto === Object.prototype) {
        break;
      }
      cls = proto as typeof FlowModel;
    }

    return undefined;
  }

  /**
   * 获取所有已注册的流程定义，包括从父类继承的流程。
   * @returns {Map<string, FlowDefinition>} 一个包含所有流程定义的 Map 对象，Key 为流程 Key，Value 为流程定义。
   */
  public static getFlows(): Map<string, FlowDefinition> {
    // 创建一个新的Map来存储所有流程
    const allFlows = new Map<string, FlowDefinition>();

    // 收集所有类的flows
    const classFlows: Map<string, FlowDefinition>[] = [];
    let cls: typeof FlowModel | null = this;
    while (cls) {
      const flows = modelFlows.get(cls);
      if (flows) {
        classFlows.push(flows);
      }

      // 获取父类
      const proto = Object.getPrototypeOf(cls);
      if (proto === Function.prototype || proto === Object.prototype) {
        break;
      }
      cls = proto as typeof FlowModel;
    }

    // 按照父类优先的顺序合并flows，但每个类内部维持原来的顺序
    // 从最后一个（最顶层父类）开始合并到第一个（当前类）
    // 子类的同名flow会覆盖父类的
    for (let i = classFlows.length - 1; i >= 0; i--) {
      const flows = classFlows[i];
      for (const [key, flow] of flows.entries()) {
        allFlows.set(key, flow);
      }
    }

    return allFlows;
  }

  setProps(props: IModelComponentProps): void;
  setProps(key: string, value: any): void;
  setProps(props: IModelComponentProps | string, value?: any): void {
    if (typeof props === 'string') {
      this.props[props] = value;
    } else {
      this.props = { ...this.props, ...props };
    }
  }

  getProps(): ReadonlyModelProps {
    return this.props as ReadonlyModelProps;
  }

  setStepParams(flowKey: string, stepKey: string, params: any): void;
  setStepParams(flowKey: string, stepParams: Record<string, any>): void;
  setStepParams(allParams: StepParams): void;
  setStepParams(
    flowKeyOrAllParams: string | StepParams,
    stepKeyOrStepsParams?: string | Record<string, any>,
    params?: any,
  ): void {
    if (typeof flowKeyOrAllParams === 'string') {
      const flowKey = flowKeyOrAllParams;
      if (typeof stepKeyOrStepsParams === 'string' && params !== undefined) {
        if (!this.stepParams[flowKey]) {
          this.stepParams[flowKey] = {};
        }
        this.stepParams[flowKey][stepKeyOrStepsParams] = {
          ...this.stepParams[flowKey][stepKeyOrStepsParams],
          ...params,
        };
      } else if (typeof stepKeyOrStepsParams === 'object' && stepKeyOrStepsParams !== null) {
        this.stepParams[flowKey] = { ...(this.stepParams[flowKey] || {}), ...stepKeyOrStepsParams };
      }
    } else if (typeof flowKeyOrAllParams === 'object' && flowKeyOrAllParams !== null) {
      for (const fk in flowKeyOrAllParams) {
        if (Object.prototype.hasOwnProperty.call(flowKeyOrAllParams, fk)) {
          this.stepParams[fk] = { ...(this.stepParams[fk] || {}), ...flowKeyOrAllParams[fk] };
        }
      }
    }
  }

  getStepParams(flowKey: string, stepKey: string): any | undefined;
  getStepParams(flowKey: string): Record<string, any> | undefined;
  getStepParams(): StepParams;
  getStepParams(flowKey?: string, stepKey?: string): any {
    if (flowKey && stepKey) {
      return this.stepParams[flowKey]?.[stepKey];
    }
    if (flowKey) {
      return this.stepParams[flowKey];
    }
    return this.stepParams;
  }

  async applyFlow(flowKey: string, inputArgs?: Record<string, any>, runId?: string): Promise<any> {
    const currentFlowEngine = this.flowEngine;
    if (!currentFlowEngine) {
      console.warn('FlowEngine not available on this model for applyFlow. Check and model.flowEngine setup.');
      return Promise.reject(new Error('FlowEngine not available for applyFlow. Please set flowEngine on the model.'));
    }

    const flow = this.getFlow(flowKey);

    if (!flow) {
      console.error(`BaseModel.applyFlow: Flow with key '${flowKey}' not found.`);
      return Promise.reject(new Error(`Flow '${flowKey}' not found.`));
    }

    // Create a new FlowContext instance for this flow execution
    const createLogger = (level: string) => (message: string, meta?: any) => {
      const logMessage = `[${level.toUpperCase()}] [Flow: ${flowKey}] [Model: ${this.uid}] ${message}`;
      const logMeta = { flowKey, modelUid: this.uid, ...meta };
      console[level.toLowerCase()](logMessage, logMeta);
    };

    const flowContext = new FlowRuntimeContext(this, flowKey);

    flowContext.defineProperty('logger', {
      value: {
        info: createLogger('INFO'),
        warn: createLogger('WARN'),
        error: createLogger('ERROR'),
        debug: createLogger('DEBUG'),
      },
    });
    flowContext.defineProperty('reactView', {
      value: this.reactView,
    });
    flowContext.defineProperty('inputArgs', {
      value: inputArgs,
    });
    flowContext.defineProperty('runId', {
      value: runId || `run-${Date.now()}`,
    });

    let lastResult: any;
    const stepResults: Record<string, any> = flowContext.stepResults;

    // 使用 setupRuntimeContextSteps 来设置 steps 属性
    setupRuntimeContextSteps(flowContext, flow, this, flowKey);
    const steps = flowContext.steps as Record<string, { params: any; uiSchema?: any; result?: any }>;

    for (const stepKey in flow.steps) {
      if (Object.prototype.hasOwnProperty.call(flow.steps, stepKey)) {
        const step: StepDefinition = flow.steps[stepKey];
        let handler: ((ctx: FlowRuntimeContext<this>, params: any) => Promise<any> | any) | undefined;
        let combinedParams: Record<string, any> = {};
        let actionDefinition;

        if (step.use) {
          // Step references a registered action
          actionDefinition = currentFlowEngine.getAction(step.use);
          if (!actionDefinition) {
            console.error(
              `BaseModel.applyFlow: Action '${step.use}' not found for step '${stepKey}' in flow '${flowKey}'. Skipping.`,
            );
            continue;
          }
          // Use step's handler if provided, otherwise use action's handler
          handler = step.handler || actionDefinition.handler;
          // Merge default params: action defaults first, then step defaults
          const actionDefaultParams = await resolveDefaultParams(actionDefinition.defaultParams, flowContext);
          const stepDefaultParams = await resolveDefaultParams(step.defaultParams, flowContext);
          combinedParams = { ...actionDefaultParams, ...stepDefaultParams };
        } else if (step.handler) {
          // Step defines its own inline handler
          handler = step.handler;
          const stepDefaultParams = await resolveDefaultParams(step.defaultParams, flowContext);
          combinedParams = { ...stepDefaultParams };
        } else {
          console.error(
            `BaseModel.applyFlow: Step '${stepKey}' in flow '${flowKey}' has neither 'use' nor 'handler'. Skipping.`,
          );
          continue;
        }

        const modelStepParams = this.getStepParams(flowKey, stepKey);
        if (modelStepParams !== undefined) {
          combinedParams = { ...combinedParams, ...modelStepParams };
        }

        // 解析 combinedParams 中的表达式
        combinedParams = await resolveParamsExpressions(combinedParams, flowContext);

        try {
          if (!handler) {
            console.error(
              `BaseModel.applyFlow: No handler available for step '${stepKey}' in flow '${flowKey}'. Skipping.`,
            );
            continue;
          }
          const currentStepResult = handler(flowContext, combinedParams);
          if (step.isAwait !== false) {
            lastResult = await currentStepResult;
          } else {
            lastResult = currentStepResult;
          }

          // Store step result
          stepResults[stepKey] = lastResult;
          // update the context
          steps[stepKey].result = stepResults[stepKey];
        } catch (error) {
          // 检查是否是通过 ctx.exit() 正常退出
          if (error instanceof FlowExitException) {
            console.log(`[FlowEngine] ${error.message}`);
            return Promise.resolve(stepResults);
          }

          console.error(`BaseModel.applyFlow: Error executing step '${stepKey}' in flow '${flowKey}':`, error);
          return Promise.reject(error);
        }
      }
    }
    return Promise.resolve(stepResults);
  }

  dispatchEvent(eventName: string, inputArgs?: Record<string, any>): void {
    const currentFlowEngine = this.flowEngine;
    if (!currentFlowEngine) {
      console.warn('FlowEngine not available on this model for dispatchEvent. Please set flowEngine on the model.');
      return;
    }

    // 获取所有流程
    const constructor = this.constructor as typeof FlowModel;
    const allFlows = constructor.getFlows();
    const runId = `${this.uid}-${eventName}-${Date.now()}`;

    allFlows.forEach((flow) => {
      if (flow.on) {
        let flowEvent = '';
        if (typeof flow.on === 'string') {
          flowEvent = flow.on;
        } else if (flow.on?.eventName) {
          flowEvent = flow.on.eventName;
        }
        if (flowEvent !== eventName) {
          return; // 只处理匹配的事件
        }
        console.log(`BaseModel '${this.uid}' dispatching event '${eventName}' to flow '${flow.key}'.`);
        this.applyFlow(flow.key, inputArgs, runId).catch((error) => {
          console.error(
            `BaseModel.dispatchEvent: Error executing event-triggered flow '${flow.key}' for event '${eventName}':`,
            error,
          );
        });
      }
    });
  }

  /**
   * 创建一个新的 FlowModel 子类，并预注册指定的流程。
   * @param {ExtendedFlowDefinition[]} flows 要预注册的流程定义数组
   *        如果flow.patch为true，则表示这是对父类同名流程的部分覆盖
   * @returns 新创建的 FlowModel 子类
   */
  public static extends<T extends typeof FlowModel>(this: T, flows: ExtendedFlowDefinition[] = []): T {
    class CustomFlowModel extends (this as unknown as typeof FlowModel) {
      // @ts-ignore
      static name = `CustomFlowModel_${uid()}`;
    }

    // 处理流程注册和覆盖
    if (flows.length > 0) {
      flows.forEach((flowDefinition) => {
        // 如果标记为部分覆盖，则调用extendFlow方法
        if (flowDefinition.patch === true) {
          CustomFlowModel.extendFlow(flowDefinition);
        } else {
          // 完全覆盖或新增流程
          CustomFlowModel.registerFlow(flowDefinition as FlowDefinition);
        }
      });
    }

    return CustomFlowModel as unknown as T;
  }

  /**
   * 获取所有自动应用流程定义并按 sort 排序
   * @returns {FlowDefinition[]} 按 sort 排序的自动应用流程定义数组
   */
  public getAutoFlows(): FlowDefinition[] {
    const constructor = this.constructor as typeof FlowModel;
    const allFlows = constructor.getFlows();

    // 过滤出自动流程并按 sort 排序
    // 没有 on 属性且没有 manual: true 的流程默认自动执行
    const autoFlows = Array.from(allFlows.values())
      .filter((flow) => {
        // 如果有 on 属性，说明是事件触发流程，不自动执行
        if (flow.on) {
          return false;
        }
        // 如果明确设置了 manual: true，不自动执行
        if (flow.manual === true) {
          return false;
        }
        // 其他情况默认自动执行
        return true;
      })
      .sort((a, b) => (a.sort || 0) - (b.sort || 0));

    return autoFlows;
  }

  /**
   * 重新执行上一次的 applyAutoFlows，保持参数一致
   * 如果之前没有执行过，则直接跳过
   * 使用 lodash debounce 避免频繁调用
   */
  private _rerunLastAutoRun = _.debounce(async () => {
    if (this._lastAutoRunParams) {
      try {
        await this.applyAutoFlows(...this._lastAutoRunParams);
      } catch (error) {
        console.error('FlowModel._rerunLastAutoRun: Error during rerun:', error);
      }
    }
  }, 100);

  /**
   * 在所有自动流程执行前调用的钩子方法
   * 子类可以覆盖此方法来实现自定义逻辑，可以通过抛出 FlowExitException 来终止流程
   * @param {Record<string, any>} [inputArgs] 输入参数
   * @protected
   */
  protected async beforeApplyAutoFlows(inputArgs?: Record<string, any>): Promise<void> {
    // 默认实现为空，子类可以覆盖
  }

  /**
   * 在所有自动流程执行后调用的钩子方法
   * 子类可以覆盖此方法来实现自定义逻辑
   * @param {any[]} results 所有自动流程的执行结果
   * @param {Record<string, any>} [inputArgs] 输入参数
   * @protected
   */
  protected async afterApplyAutoFlows(results: any[], inputArgs?: Record<string, any>): Promise<void> {
    // 默认实现为空，子类可以覆盖
  }

  /**
   * 在自动流程执行出错时调用的钩子方法
   * 子类可以覆盖此方法来实现自定义错误处理逻辑
   * @param {Error} error 捕获的错误
   * @param {Record<string, any>} [inputArgs] 输入参数
   * @protected
   */
  protected async onApplyAutoFlowsError(error: Error, inputArgs?: Record<string, any>): Promise<void> {
    // 默认实现为空，子类可以覆盖
  }

  /**
   * 执行所有自动应用流程
   * @param {Record<string, any>} [inputArgs] 可选的运行时参数
   * @param {boolean} [useCache=true] 是否使用缓存机制，默认为 true
   * @returns {Promise<any[]>} 所有自动应用流程的执行结果数组
   */
  async applyAutoFlows(inputArgs?: Record<string, any>, useCache?: boolean): Promise<any[]>;
  async applyAutoFlows(...args: any[]): Promise<any[]> {
    const [inputArgs, useCache = true] = args;
    // 生成缓存键，包含 stepParams 的序列化版本以确保参数变化时重新执行
    const cacheKey = useCache
      ? FlowEngine.generateApplyFlowCacheKey(this['forkId'] ?? 'autoFlow', 'all', this.uid)
      : null;

    if (!_.isEqual(inputArgs, this._lastAutoRunParams?.[0]) && cacheKey) {
      this.flowEngine.applyFlowCache.delete(cacheKey);
    }

    // 存储本次执行的参数，用于后续重新执行
    this._lastAutoRunParams = args;

    const autoApplyFlows = this.getAutoFlows();

    if (autoApplyFlows.length === 0) {
      console.warn(`FlowModel: No auto-apply flows found for model '${this.uid}'`);
      return [];
    }

    // 检查缓存
    if (cacheKey && this.flowEngine) {
      const cachedEntry = this.flowEngine.applyFlowCache.get(cacheKey);
      if (cachedEntry) {
        if (cachedEntry.status === 'resolved') {
          console.log(`[FlowEngine.applyAutoFlows] Using cached result for model: ${this.uid}`);
          return cachedEntry.data;
        }
        if (cachedEntry.status === 'rejected') throw cachedEntry.error;
        if (cachedEntry.status === 'pending') return await cachedEntry.promise;
      }
    }

    // 执行 autoFlows
    const executeAutoFlows = async (): Promise<any[]> => {
      const results: any[] = [];
      const runId = `${this.uid}-autoFlow-${Date.now()}`;

      try {
        // 调用 beforeApplyAutoFlows 钩子
        await this.beforeApplyAutoFlows(inputArgs);

        // 如果没有自动流程，记录警告但仍然继续执行钩子
        if (autoApplyFlows.length === 0) {
          console.warn(`FlowModel: No auto-apply flows found for model '${this.uid}'`);
        } else {
          // 执行所有自动流程
          for (const flow of autoApplyFlows) {
            try {
              const result = await this.applyFlow(flow.key, inputArgs, runId);
              results.push(result);
            } catch (error) {
              console.error(`FlowModel.applyAutoFlows: Error executing auto-apply flow '${flow.key}':`, error);
              throw error;
            }
          }
        }

        // 调用 afterApplyAutoFlows 钩子
        await this.afterApplyAutoFlows(results, inputArgs);

        return results;
      } catch (error) {
        // 检查是否是通过 FlowExitException 正常退出
        if (error instanceof FlowExitException) {
          console.log(`[FlowEngine.applyAutoFlows] ${error.message}`);
          return results; // 返回已执行的结果
        }

        // 调用 onApplyAutoFlowsError 钩子
        try {
          await this.onApplyAutoFlowsError(error, inputArgs);
        } catch (hookError) {
          console.error('FlowModel.applyAutoFlows: Error in onApplyAutoFlowsError hook:', hookError);
        }

        throw error;
      }
    };

    // 如果不使用缓存，直接执行
    if (!cacheKey || !this.flowEngine) {
      return await executeAutoFlows();
    }

    // 使用缓存机制
    const promise = executeAutoFlows()
      .then((result) => {
        this.flowEngine.applyFlowCache.set(cacheKey, {
          status: 'resolved',
          data: result,
          promise: Promise.resolve(result),
        });
        return result;
      })
      .catch((err) => {
        this.flowEngine.applyFlowCache.set(cacheKey, {
          status: 'rejected',
          error: err,
          promise: Promise.reject(err),
        });
        throw err;
      });

    this.flowEngine.applyFlowCache.set(cacheKey, { status: 'pending', promise });
    return await promise;
  }

  /**
   * 智能检测是否应该跳过响应式包装
   * @private
   */
  private shouldSkipReactiveWrapping(): boolean {
    // 1. 检查是否已经被包装过
    if ((this.render as any).__isReactiveWrapped) {
      return true;
    }

    // 2. 检查 render 方法的返回值类型
    if (this.isRenderMethodReturningFunction()) {
      return true;
    }

    return false;
  }

  /**
   * 检查 render 方法是否返回函数
   * @private
   */
  private isRenderMethodReturningFunction(): boolean {
    try {
      // 创建一个临时的 render 调用来检测返回类型
      const originalRender = Object.getPrototypeOf(this).render;
      if (originalRender && originalRender !== FlowModel.prototype.render) {
        const result = originalRender.call(this);
        return typeof result === 'function';
      }
    } catch (error) {
      // 如果调用出错，假设不返回函数
    }

    return false;
  }

  /**
   * 设置 render 方法的响应式包装
   * @private
   */
  private setupReactiveRender(): void {
    // 确保 render 方法存在且是函数
    if (typeof this.render !== 'function' || this.shouldSkipReactiveWrapping()) {
      return;
    }

    try {
      // 保存原始 render 方法的引用
      const originalRender = this.render;
      this._originalRender = originalRender;

      // 验证原始方法是函数
      if (typeof originalRender !== 'function') {
        console.error(`FlowModel ${this.constructor.name}: original render method is not a function`, originalRender);
        return;
      }

      // 创建缓存的响应式包装器组件工厂（只创建一次）
      const createReactiveWrapper = (modelInstance: any) => {
        const ReactiveWrapper = observer(() => {
          // 触发响应式更新的关键属性访问
          modelInstance.props; // 确保 props 变化时触发更新

          // 添加生命周期钩子
          React.useEffect(() => {
            // 组件挂载时调用 onMount 钩子
            if (typeof modelInstance.onMount === 'function') {
              modelInstance.onMount();
            }

            // 返回清理函数，组件卸载时调用 onUnmount 钩子
            return () => {
              if (typeof modelInstance.onUnmount === 'function') {
                modelInstance.onUnmount();
              }
            };
          }, []);

          // 调用原始渲染方法
          return originalRender.call(modelInstance);
        });

        // 设置显示名称便于调试
        ReactiveWrapper.displayName = `ReactiveWrapper(${modelInstance.constructor.name})`;

        return ReactiveWrapper;
      };

      const wrappedRender = function (this: any) {
        // 当前实例创建或获取缓存的 ReactiveWrapper
        if (!this._reactiveWrapperCache) {
          this._reactiveWrapperCache = createReactiveWrapper(this);
        }

        // 返回响应式组件
        return React.createElement(this._reactiveWrapperCache);
      };

      // 标记已被包装
      (wrappedRender as any).__isReactiveWrapped = true;
      (wrappedRender as any).__originalRender = originalRender;

      // 替换 render 方法
      this.render = wrappedRender;
    } catch (error) {
      console.error(`FlowModel ${this.constructor.name}: Error during render method wrapping:`, error);
    }
  }

  /**
   * 组件挂载时的生命周期钩子
   * 子类可以重写此方法来添加挂载时的逻辑
   * @protected
   */
  protected onMount(): void {
    // 默认为空实现，子类可以重写
  }

  /**
   * 组件卸载时的生命周期钩子
   * 子类可以重写此方法来添加卸载时的逻辑
   * @protected
   */
  protected onUnmount(): void {
    // 默认为空实现，子类可以重写
  }

  /**
   * Renders the React representation of this flow model.
   * @returns {React.ReactNode} The React node to render.
   */
  public render(): any {
    // console.warn('FlowModel.render() not implemented. Override in subclass for FlowModelRenderer.');
    // 默认返回一个空的div，子类可以覆盖这个方法来实现具体的渲染逻辑
    return <div {...this.props}></div>;
  }

  async rerender() {
    await this.applyAutoFlows(this._lastAutoRunParams?.[0], false);
  }

  setParent(parent: FlowModel): void {
    // forkflowModel instanceof FlowModel is false, but fork can be used as parent
    const isValidParent =
      parent && (parent.constructor === FlowModel || isInheritedFrom(parent.constructor as any, FlowModel));
    if (!isValidParent) {
      throw new Error('Parent must be an instance of FlowModel.');
    }
    this.parent = parent as ParentFlowModel<Structure>;
    this._options.parentId = parent.uid;
    if (this._options.delegateToParent !== false) {
      this.context.addDelegate(this.parent.context);
    }
  }

  addSubModel<T extends FlowModel>(subKey: string, options: CreateModelOptions | T) {
    let model: T;
    if (options instanceof FlowModel) {
      if (options.parent && options.parent !== this) {
        throw new Error('Sub model already has a parent.');
      }
      model = options;
    } else {
      model = this.flowEngine.createModel<T>({ ...options, subKey, subType: 'array' });
    }
    model.setParent(this);
    const subModels = this.subModels as {
      [subKey: string]: FlowModel[];
    };
    if (!Array.isArray(subModels[subKey])) {
      subModels[subKey] = observable.shallow([]);
    }
    const maxSortIndex = Math.max(...(subModels[subKey] as FlowModel[]).map((item) => item.sortIndex || 0), 0);
    model.sortIndex = maxSortIndex + 1;
    subModels[subKey].push(model);
    this.emitter.emit('onSubModelAdded', model);
    return model;
  }

  setSubModel(subKey: string, options: CreateModelOptions | FlowModel) {
    let model: FlowModel;
    if (options instanceof FlowModel) {
      if (options.parent && options.parent !== this) {
        throw new Error('Sub model already has a parent.');
      }
      model = options;
    } else {
      model = this.flowEngine.createModel({ ...options, parentId: this.uid, subKey, subType: 'object' });
    }
    model.setParent(this);
    (this.subModels as any)[subKey] = model;
    this.emitter.emit('onSubModelAdded', model);
    return model;
  }

  mapSubModels<K extends keyof Structure['subModels'], R>(
    subKey: K,
    callback: (model: ArrayElementType<Structure['subModels'][K]>, index: number) => R,
  ): R[] {
    const model = (this.subModels as any)[subKey as string];

    if (!model) {
      return [];
    }

    const results: R[] = [];

    _.castArray(model)
      .sort((a, b) => (a.sortIndex || 0) - (b.sortIndex || 0))
      .forEach((item, index) => {
        const result = (callback as (model: any, index: number) => R)(item, index);
        results.push(result);
      });

    return results;
  }

  hasSubModel<K extends keyof Structure['subModels']>(subKey: K) {
    const subModel = (this.subModels as any)[subKey as string];
    if (!subModel) {
      return false;
    }
    return _.castArray(subModel).length > 0;
  }

  findSubModel<K extends keyof Structure['subModels'], R>(
    subKey: K,
    callback: (model: ArrayElementType<Structure['subModels'][K]>) => R,
  ): ArrayElementType<Structure['subModels'][K]> | null {
    const model = (this.subModels as any)[subKey as string];

    if (!model) {
      return null;
    }

    return (
      (_.castArray(model).find((item) => {
        return (callback as (model: any) => R)(item);
      }) as ArrayElementType<Structure['subModels'][K]> | undefined) || null
    );
  }

  createRootModel(options) {
    return this.flowEngine.createModel(options);
  }

  async applySubModelsAutoFlows<K extends keyof Structure['subModels']>(
    subKey: K,
    inputArgs?: Record<string, any>,
    shared?: Record<string, any>,
  ) {
    await Promise.all(
      this.mapSubModels(subKey, async (sub) => {
        await sub.applyAutoFlows(inputArgs);
      }),
    );
  }

  /**
   * 创建一个 fork 实例，实现"一份数据（master）多视图（fork）"的能力。
   * @param {IModelComponentProps} [localProps={}] fork 专属的局部 props，优先级高于 master.props
   * @param {string} [key] 可选的 key，用于复用 fork 实例。如果提供了 key，会尝试复用已存在的 fork
   * @returns {ForkFlowModel<this>} 创建的 fork 实例
   */
  createFork(localProps?: IModelComponentProps, key?: string): ForkFlowModel<this> {
    // 如果提供了 key，尝试从缓存中获取
    if (key) {
      const cachedFork = this.forkCache.get(key);
      if (cachedFork && !(cachedFork as any).disposed) {
        // 更新 localProps
        cachedFork.setProps(localProps || {});
        return cachedFork as ForkFlowModel<this>;
      }
    }

    // 创建新的 fork 实例
    const forkId = this.forks.size; // 当前集合大小作为索引
    const fork = new ForkFlowModel<this>(this as any, localProps, forkId);
    this.forks.add(fork as any);

    // 如果提供了 key，将 fork 缓存起来
    if (key) {
      this.forkCache.set(key, fork as any);
    }

    return fork as ForkFlowModel<this>;
  }

  clearForks() {
    console.log(`FlowModel ${this.uid} clearing all forks.`);
    // 主动使所有 fork 失效
    if (this.forks?.size) {
      this.forks.forEach((fork) => fork.dispose());
      this.forks.clear();
    }
    // 清理 fork 缓存
    this.forkCache.clear();
  }

  getFork(key: string) {
    return this.forkCache.get(key);
  }

  /**
   * 移动当前模型到目标模型的位置
   * @param {FlowModel} targetModel 目标模型
   * @returns {boolean} 是否成功移动
   */
  moveTo(targetModel: FlowModel) {
    if (!this.flowEngine) {
      throw new Error('FlowEngine is not set on this model. Please set flowEngine before saving.');
    }
    return this.flowEngine.moveModel(this.uid, targetModel.uid);
  }

  remove() {
    if (!this.flowEngine) {
      throw new Error('FlowEngine is not set on this model. Please set flowEngine before saving.');
    }
    this.observerDispose();
    this.invalidateAutoFlowCache(true);
    return this.flowEngine.removeModel(this.uid);
  }

  async save() {
    if (!this.flowEngine) {
      throw new Error('FlowEngine is not set on this model. Please set flowEngine before saving.');
    }
    return this.flowEngine.saveModel(this);
  }

  async destroy() {
    if (!this.flowEngine) {
      throw new Error('FlowEngine is not set on this model. Please set flowEngine before deleting.');
    }
    this.observerDispose();
    this.invalidateAutoFlowCache(true);
    // 从 FlowEngine 中销毁模型
    return this.flowEngine.destroyModel(this.uid);
  }

  /**
   * 打开步骤设置对话框
   * 用于配置流程中特定步骤的参数和设置
   * @param {string} flowKey 流程的唯一标识符
   * @param {string} stepKey 步骤的唯一标识符
   * @returns {void}
   */
  openStepSettingsDialog(flowKey: string, stepKey: string) {
    return openStepSettingsDialogFn({
      model: this,
      flowKey,
      stepKey,
    });
  }

  /**
   * 配置必填步骤参数
   * 用于在一个分步表单中配置所有需要参数的步骤
   * @param {number | string} [dialogWidth=800] 对话框宽度，默认为800
   * @param {string} [dialogTitle='步骤参数配置'] 对话框标题，默认为'步骤参数配置'
   * @returns {Promise<any>} 返回表单提交的值
   */
  async configureRequiredSteps(dialogWidth?: number | string, dialogTitle?: string) {
    return openRequiredParamsStepFormDialogFn({
      model: this,
      dialogWidth,
      dialogTitle,
    });
  }

  async openPresetStepSettingsDialog(dialogWidth?: number | string, dialogTitle?: string) {
    return this.configureRequiredSteps(dialogWidth, dialogTitle);
  }

  async openFlowStepSettingsDialog(options: {
    flowKey?: string;
    stepKey?: string;
    preset?: boolean;
    uiMode?: 'drawer' | 'dialog';
  }) {}

  get translate() {
    return this.flowEngine.translate.bind(this.flowEngine);
  }

  // TODO: 不完整，需要考虑 sub-model 的情况
  serialize(): Record<string, any> {
    const data = {
      uid: this.uid,
      ..._.omit(this._options, ['flowEngine']),
      stepParams: this.stepParams,
      sortIndex: this.sortIndex,
    };
    const subModels = this.subModels as {
      [key: string]: FlowModel | FlowModel[];
    };
    for (const subModelKey in subModels) {
      data.subModels = data.subModels || {};
      if (Array.isArray(subModels[subModelKey])) {
        (data.subModels as any)[subModelKey] = (subModels[subModelKey] as FlowModel[]).map((model, index) => ({
          ...model.serialize(),
          sortIndex: index,
        }));
      } else if (subModels[subModelKey] instanceof FlowModel) {
        (data.subModels as any)[subModelKey] = (subModels[subModelKey] as FlowModel).serialize();
      }
    }
    return data;
  }
}

export class ErrorFlowModel extends FlowModel {
  public errorMessage: string;

  setErrorMessage(msg: string) {
    this.errorMessage = msg;
  }

  public render() {
    throw new Error(this.errorMessage);
  }
}

export function defineFlow<TModel extends FlowModel = FlowModel>(definition: FlowDefinition): FlowDefinition<TModel> {
  return definition as FlowDefinition<TModel>;
}
