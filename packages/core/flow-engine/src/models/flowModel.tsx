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
import { FlowContext, FlowModelContext, FlowRuntimeContext } from '../flowContext';
import { FlowEngine } from '../flowEngine';
import { InstanceFlowRegistry } from '../flow-registry/InstanceFlowRegistry';
import type {
  ActionDefinition,
  ArrayElementType,
  CreateModelOptions,
  CreateSubModelOptions,
  DefaultStructure,
  FlowDefinitionOptions,
  FlowModelMeta,
  FlowModelOptions,
  ModelConstructor,
  ParamObject,
  ParentFlowModel,
  PersistOptions,
  StepDefinition,
  StepParams,
} from '../types';
import { IModelComponentProps, ReadonlyModelProps } from '../types';
import {
  FlowExitException,
  isInheritedFrom,
  resolveDefaultParams,
  resolveExpressions,
  setupRuntimeContextSteps,
} from '../utils';
// import { FlowExitAllException } from '../utils/exceptions';
import { ForkFlowModel } from './forkFlowModel';
import { FlowSettingsOpenOptions } from '../flowSettings';
import { GlobalFlowRegistry } from '../flow-registry/GlobalFlowRegistry';
import { FlowDefinition } from '../FlowDefinition';
import { ModelActionRegistry } from '../action-registry/ModelActionRegistry';
import { ModelEventRegistry } from '../event-registry/ModelEventRegistry';
import type { EventDefinition } from '../types';

// 使用 WeakMap 为每个类缓存一个 ModelActionRegistry 实例
const classActionRegistries = new WeakMap<typeof FlowModel, ModelActionRegistry>();

// 使用 WeakMap 为每个类缓存一个 ModelEventRegistry 实例
const classEventRegistries = new WeakMap<typeof FlowModel, ModelEventRegistry>();

// 使用WeakMap存储每个类的meta
const modelMetas = new WeakMap<typeof FlowModel, FlowModelMeta>();

// 使用WeakMap存储每个类的 GlobalFlowRegistry
const modelGlobalRegistries = new WeakMap<typeof FlowModel, GlobalFlowRegistry>();

export class FlowModel<Structure extends DefaultStructure = DefaultStructure> {
  public readonly uid: string;
  public sortIndex: number;
  public hidden = false;
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
  protected observerDispose: () => void;
  #flowContext: FlowModelContext;

  /**
   * 原始 render 方法的引用
   */
  private _originalRender: (() => any) | null = null;

  /**
   * 缓存的响应式包装器组件（每个实例一个）
   */
  private _reactiveWrapperCache?: React.ComponentType;

  flowRegistry: InstanceFlowRegistry;
  private _cleanRun?: boolean;

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

    this.flowRegistry = new InstanceFlowRegistry(this);
    this.flowRegistry.addFlows(options.flowRegistry);

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

    this._cleanRun = !!options['cleanRun'];
  }

  /**
   * 对外暴露的上下文：
   */
  get context() {
    if (!this.#flowContext) {
      this.#flowContext = new FlowModelContext(this);
    }
    return this.#flowContext;
  }

  on(eventName: string, listener: (...args: any[]) => void) {
    this.emitter.on(eventName, listener);
  }

  onInit(options) {
    // Dynamic flows loading is disabled. Previous logic preserved for reference:
    /*
    this.loadDynamicFlows()
      .then((flows) => {
        if (!_.isEmpty(flows)) {
          this.setDynamicFlows(flows);
        }
      })
      .catch((error) => {
        console.error(`Failed to load dynamic flows for ${this.constructor.name}:`, error);
      });
    */
    this.context.defineMethod('aclCheck', async (params) => {
      return await this.flowEngine.context.acl.aclCheck(params);
    });
  }

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

  get parentId() {
    return this._options.parentId;
  }

  static get meta() {
    return modelMetas.get(this);
  }

  static get globalFlowRegistry(): GlobalFlowRegistry {
    const Cls = this as unknown as typeof FlowModel;
    let reg = modelGlobalRegistries.get(Cls);
    if (!reg) {
      reg = new GlobalFlowRegistry(Cls);
      modelGlobalRegistries.set(Cls, reg);
    }
    return reg;
  }

  // 获取当前类的动作注册表（含父子链注入），按类缓存
  protected static get actionRegistry(): ModelActionRegistry {
    const ModelClass = this;
    let registry = classActionRegistries.get(ModelClass);
    if (!registry) {
      let parentRegistry: ModelActionRegistry | null = null;
      const ParentClass = Object.getPrototypeOf(ModelClass);
      if (ParentClass && ParentClass !== Function.prototype && ParentClass !== Object.prototype) {
        const isSubclassOfFlowModel = ParentClass === FlowModel || isInheritedFrom(ParentClass, FlowModel);
        if (isSubclassOfFlowModel) {
          parentRegistry = (ParentClass as typeof FlowModel).actionRegistry as ModelActionRegistry;
        }
      }
      registry = new ModelActionRegistry(ModelClass, parentRegistry);
      classActionRegistries.set(ModelClass, registry);
    }
    return registry;
  }

  // 获取当前类的事件注册表（含父子链注入），按类缓存
  protected static get eventRegistry(): ModelEventRegistry {
    const ModelClass = this;
    let registry = classEventRegistries.get(ModelClass);
    if (!registry) {
      let parentRegistry: ModelEventRegistry | null = null;
      const ParentClass = Object.getPrototypeOf(ModelClass);
      if (ParentClass && ParentClass !== Function.prototype && ParentClass !== Object.prototype) {
        const isSubclassOfFlowModel = ParentClass === FlowModel || isInheritedFrom(ParentClass, FlowModel);
        if (isSubclassOfFlowModel) {
          parentRegistry = (ParentClass as typeof FlowModel).eventRegistry as ModelEventRegistry;
        }
      }
      registry = new ModelEventRegistry(ModelClass, parentRegistry);
      classEventRegistries.set(ModelClass, registry);
    }
    return registry;
  }

  /**
   * 注册仅当前 FlowModel 类及其子类可用的 Action。
   * 该注册是类级别的，不会影响全局（FlowEngine）的 Action 注册。
   */
  public static registerAction<TModel extends FlowModel = FlowModel>(definition: ActionDefinition<TModel>): void {
    this.actionRegistry.registerAction(definition);
  }

  /**
   * 批量注册仅当前 FlowModel 类及其子类可用的 Actions。
   */
  public static registerActions<TModel extends FlowModel = FlowModel>(
    actions: Record<string, ActionDefinition<TModel>>,
  ): void {
    this.actionRegistry.registerActions(actions);
  }

  /**
   * 注册仅当前 FlowModel 类及其子类可用的 Event。
   * 该注册是类级别的，不会影响全局（FlowEngine）的 Event 注册。
   */
  public static registerEvent<TModel extends FlowModel = FlowModel>(definition: EventDefinition<TModel>): void {
    this.eventRegistry.registerEvent(definition);
  }

  /**
   * 批量注册仅当前 FlowModel 类及其子类可用的 Events。
   */
  public static registerEvents<TModel extends FlowModel = FlowModel>(
    events: Record<string, EventDefinition<TModel>>,
  ): void {
    this.eventRegistry.registerEvents(events);
  }

  get title() {
    // model 可以通过 setTitle 来自定义title， 具有更高的优先级
    return this.translate(this._title) || this.translate(this.constructor['meta']?.label);
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
   * 注册一个 Flow。
   * @template TModel 具体的FlowModel子类类型
   * @param {string | FlowDefinitionOptions<TModel>} keyOrDefinition 流程的 Key 或 FlowDefinitionOptions 对象。
   *        如果为字符串，则为流程 Key，需要配合 flowDefinition 参数。
   *        如果为对象，则为包含 key 属性的完整 FlowDefinitionOptions。
   * @param {FlowDefinitionOptions<TModel>} [flowDefinition] 当第一个参数为流程 Key 时，此参数为流程的定义。
   * @returns {void}
   */
  public static registerFlow<TClass extends ModelConstructor, TModel extends InstanceType<TClass>>(
    this: TClass,
    keyOrDefinition: string | FlowDefinitionOptions<TModel>,
    flowDefinition?: Omit<FlowDefinitionOptions<TModel>, 'key'> & { key?: string },
  ): void {
    const Cls = this as unknown as typeof FlowModel;
    if (typeof keyOrDefinition === 'string') {
      Cls.globalFlowRegistry.addFlow(keyOrDefinition, flowDefinition);
    } else {
      Cls.globalFlowRegistry.addFlow(keyOrDefinition.key, keyOrDefinition);
    }
  }

  // /**
  //  * 清空所有注册的流程定义。在测试中用来清理已注册的流，防止对其它测试产生影响。
  //  */
  // public static clearFlows(): void {
  //   modelFlows = new WeakMap<typeof FlowModel, Map<string, FlowDefinition>>();
  // }

  /**
   * 获取已注册的流程定义。
   * 如果当前类不存在对应的flow，会继续往父类查找。
   * @param {string} key 流程 Key。
   * @returns {FlowDefinition | undefined} 流程定义，如果未找到则返回 undefined。
   */
  public getFlow(key: string): FlowDefinition | undefined {
    if (this.flowRegistry.hasFlow(key)) {
      return this.flowRegistry.getFlow(key);
    }
    const Cls = this.constructor as typeof FlowModel;
    return Cls.globalFlowRegistry.getFlow(key);
  }

  /**
   * 注册一个实例级别的流程定义。
   * @template TModel 具体的FlowModel子类类型
   * @param {string | FlowDefinitionOptions<TModel>} keyOrDefinition 流程的 Key 或 FlowDefinitionOptions 对象。
   * @param {FlowDefinitionOptions<TModel>} [flowDefinition] 当第一个参数为流程 Key 时，此参数为流程的定义。
   * @returns {FlowDefinition} 注册的流程定义实例
   */
  public registerFlow<TModel extends FlowModel = this>(
    keyOrDefinition: string | FlowDefinitionOptions<TModel>,
    flowDefinition?: Omit<FlowDefinitionOptions<TModel>, 'key'> & { key?: string },
  ): FlowDefinition {
    if (typeof keyOrDefinition === 'string') {
      return this.flowRegistry.addFlow(keyOrDefinition, flowDefinition);
    } else {
      return this.flowRegistry.addFlow(keyOrDefinition.key, keyOrDefinition);
    }
  }

  /**
   * 获取当前模型可用的所有 Actions：
   * - 包含全局（FlowEngine）注册的 Actions；
   * - 合并类级（FlowModel.registerAction(s)）注册的 Actions，并考虑继承（子类覆盖父类同名 Action）。
   */
  public getActions<TModel extends FlowModel = this, TCtx extends FlowContext = FlowRuntimeContext<TModel>>(): Map<
    string,
    ActionDefinition<TModel, TCtx>
  > {
    const ModelClass = this.constructor as typeof FlowModel;
    const merged = ModelClass.actionRegistry.getActions<TModel, TCtx>();
    const actions = new Map<string, ActionDefinition<TModel, TCtx>>();
    const globalActions = this.flowEngine?.getActions<TModel, TCtx>();
    if (globalActions) for (const [k, v] of globalActions) actions.set(k, v);
    for (const [k, v] of merged) actions.set(k, v);
    return actions;
  }

  /**
   * 获取当前模型可用的所有 Events：
   * - 包含全局（FlowEngine）注册的 Events；
   * - 合并类级（FlowModel.registerEvent(s)）注册的 Events，并考虑继承（子类覆盖父类同名 Event）。
   */
  public getEvents<TModel extends FlowModel = this>(): Map<string, EventDefinition<TModel>> {
    const ModelClass = this.constructor as typeof FlowModel;
    const merged = ModelClass.eventRegistry.getEvents();
    const events = new Map<string, EventDefinition<TModel>>();
    const globalEvents = this.flowEngine?.getEvents<TModel>();
    if (globalEvents) for (const [k, v] of globalEvents) events.set(k, v);
    for (const [k, v] of merged) events.set(k, v);
    return events;
  }

  /**
   * 获取指定名称的 Event（优先返回类级注册的，未找到则回退到全局）。
   */
  public getEvent<TModel extends FlowModel = this>(name: string): EventDefinition<TModel> | undefined {
    const ModelClass = this.constructor as typeof FlowModel;
    const own = ModelClass.eventRegistry.getEvent(name) as EventDefinition<TModel> | undefined;
    if (own) return own;
    return this.flowEngine?.getEvent<TModel>(name);
  }

  /**
   * 获取指定名称的 Action（优先返回类级注册的，未找到则回退到全局）。
   */
  public getAction<TModel extends FlowModel = this, TCtx extends FlowContext = FlowRuntimeContext<TModel>>(
    name: string,
  ): ActionDefinition<TModel, TCtx> | undefined {
    const ModelClass = this.constructor as typeof FlowModel;
    const own = ModelClass.actionRegistry.getAction<TModel, TCtx>(name);
    if (own) return own;
    return this.flowEngine?.getAction<TModel, TCtx>(name);
  }

  getFlows() {
    const instanceFlows = this.flowRegistry.getFlows();
    const allFlows = new Map<string, FlowDefinition>(instanceFlows);
    const staticFlows = (this.constructor as typeof FlowModel).globalFlowRegistry.getFlows();
    for (const [key, def] of staticFlows) {
      if (!allFlows.has(key)) {
        // 实例级流程优先于静态流程
        allFlows.set(key, def);
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

  setStepParams(flowKey: string, stepKey: string, params: ParamObject): void;
  setStepParams(flowKey: string, stepParams: Record<string, ParamObject>): void;
  setStepParams(allParams: StepParams): void;
  setStepParams(
    flowKeyOrAllParams: string | StepParams,
    stepKeyOrStepsParams?: string | Record<string, ParamObject>,
    params?: ParamObject,
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
    const isFork = (this as any).isFork === true;
    const target = this;
    console.log(
      `[FlowModel] applyFlow: uid=${this.uid}, flowKey=${flowKey}, isFork=${isFork}, cleanRun=${
        this.cleanRun
      }, targetIsFork=${(target as any)?.isFork === true}`,
    );
    return currentFlowEngine.executor.runFlow(target, flowKey, inputArgs, runId);
  }

  async dispatchEvent(eventName: string, inputArgs?: Record<string, any>): Promise<void> {
    const currentFlowEngine = this.flowEngine;
    if (!currentFlowEngine) {
      console.warn('FlowEngine not available on this model for dispatchEvent. Please set flowEngine on the model.');
      return;
    }
    const isFork = (this as any).isFork === true;
    const target = this;
    console.log(
      `[FlowModel] dispatchEvent: uid=${this.uid}, event=${eventName}, isFork=${isFork}, cleanRun=${
        this.cleanRun
      }, targetIsFork=${(target as any)?.isFork === true}`,
    );
    await currentFlowEngine.executor.dispatchEvent(target, eventName, inputArgs);
  }

  /**
   * 获取所有自动应用流程定义并按 sort 排序
   * @returns {FlowDefinition[]} 按 sort 排序的自动应用流程定义数组
   */
  public getAutoFlows(): FlowDefinition[] {
    const allFlows = this.getFlows();

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
   * 自动流程执行前钩子。
   * 子类可覆盖；可抛出 FlowExitException 提前终止。
   */
  public async onBeforeAutoFlows(inputArgs?: Record<string, any>): Promise<void> {}

  /**
   * 自动流程执行后钩子。
   * 子类可覆盖。
   */
  public async onAfterAutoFlows(results: any[], inputArgs?: Record<string, any>): Promise<void> {}

  /**
   * 自动流程错误钩子。
   * 子类可覆盖。
   */
  public async onAutoFlowsError(error: Error, inputArgs?: Record<string, any>): Promise<void> {}

  /**
   * 执行所有自动应用流程
   * @param {Record<string, any>} [inputArgs] 可选的运行时参数
   * @param {boolean} [useCache=true] 是否使用缓存机制，默认为 true
   * @returns {Promise<any[]>} 所有自动应用流程的执行结果数组
   */
  async applyAutoFlows(inputArgs?: Record<string, any>, useCache?: boolean): Promise<any[]>;
  async applyAutoFlows(...args: any[]): Promise<any[]> {
    const [inputArgs, useCache = true] = args;
    const cacheKey = useCache
      ? FlowEngine.generateApplyFlowCacheKey(this['forkId'] ?? 'autoFlow', 'all', this.uid)
      : null;
    if (!_.isEqual(inputArgs, this._lastAutoRunParams?.[0]) && cacheKey) {
      this.flowEngine.applyFlowCache.delete(cacheKey);
    }
    this._lastAutoRunParams = args;

    // 在执行自动流程前触发（无论是否命中缓存都应触发）
    try {
      await this.onBeforeAutoFlows(inputArgs);
    } catch (error) {
      if (error instanceof FlowExitException) {
        this.context.logger?.debug(`[FlowModel.applyAutoFlows] ${error.message}`);
        return [];
      }
      try {
        await this.onAutoFlowsError(error as Error, inputArgs);
      } catch (_) {
        // swallow secondary hook error to avoid masking the original
      }
      throw error;
    }

    // 执行自动流程（内部可能命中缓存）
    let results: any[] = [];
    try {
      results = await this.flowEngine.executor.runAutoFlows(this, inputArgs, useCache);
    } catch (error) {
      try {
        await this.onAutoFlowsError(error as Error, inputArgs);
      } catch (_) {
        // ignore secondary error from error hook
      }
      throw error;
    }

    // 执行后钩子
    try {
      await this.onAfterAutoFlows(results, inputArgs);
    } catch (error) {
      try {
        await this.onAutoFlowsError(error as Error, inputArgs);
      } catch (_) {
        // ignore
      }
      throw error;
    }

    return results;
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
          // 触发响应式更新的关键属性访问（读取 run/渲染目标的 props）
          const isForkInstance = (modelInstance as any)?.isFork === true;
          const renderTarget = modelInstance;
          if (renderTarget !== modelInstance && (renderTarget as any)?.localProps !== undefined) {
            // 订阅 fork 的本地 props 变更
            (renderTarget as any).localProps;
            // 同时订阅原实例（master/UI fork）的 props 变更，
            // 以捕获诸如 FormItem→FieldModelRenderer 通过 model.setProps 写到 master.props 的更新
            modelInstance.props;
          } else {
            // 订阅当前实例的 props 变更
            modelInstance.props;
          }

          // 添加生命周期钩子：当渲染目标变化时，解绑旧目标并绑定新目标
          React.useEffect(() => {
            if (typeof renderTarget.onMount === 'function') {
              renderTarget.onMount();
            }
            return () => {
              if (typeof renderTarget.onUnmount === 'function') {
                renderTarget.onUnmount();
              }
            };
          }, [renderTarget]);

          // 调用原始渲染方法
          return originalRender.call(renderTarget);
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

  get cleanRun() {
    return true; // 故意的设置 cleanRun 为true
    // return !!this._cleanRun;
  }

  setCleanRun(value: boolean) {
    const prev = this._cleanRun;
    this._cleanRun = !!value;
  }

  /**
   * 组件挂载时的生命周期钩子
   * 子类可以重写此方法来添加挂载时的逻辑
   * @protected
   */
  // eslint-disable-next-line no-empty
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
    if (this.hidden) {
      return this.renderNoPermission();
    }
    return this.renderContent();
  }

  /**
   * 无权限时的渲染逻辑。
   * 子类可以覆盖此方法，返回自定义的“无权限”提示 UI。
   * 如果子类不覆盖，则默认显示null。
   *
   * @returns {React.ReactNode} 无权限时的渲染结果
   */
  public renderNoPermission(): React.ReactNode {
    return null;
  }

  /**
   * 有权限时的渲染逻辑。
   * 这是一个抽象方法，所有子类都必须实现，用于返回自己的正常 UI。
   *
   * @returns {React.ReactNode} 有权限时的渲染结果
   */
  public renderContent(): React.ReactNode {
    return <div {...this.props}></div>;
  }
  async rerender() {
    await this.applyAutoFlows(this._lastAutoRunParams?.[0], false);
  }

  /**
   * 自动流程缓存的作用域标识；fork 实例可覆盖以区分缓存。
   */
  public getAutoFlowCacheScope(): string {
    return 'autoFlow';
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

  removeParentDelegate() {
    if (!this.parent) {
      return;
    }
    this.context.removeDelegate(this.parent.context);
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

  filterSubModels<K extends keyof Structure['subModels'], R>(
    subKey: K,
    callback: (model: ArrayElementType<Structure['subModels'][K]>, index: number) => boolean,
  ): ArrayElementType<Structure['subModels'][K]>[] {
    const model = (this.subModels as any)[subKey as string];

    if (!model) {
      return [];
    }

    const results: ArrayElementType<Structure['subModels'][K]>[] = [];

    _.castArray(model)
      .sort((a, b) => (a.sortIndex || 0) - (b.sortIndex || 0))
      .forEach((item, index) => {
        const result = (callback as (model: any, index: number) => boolean)(item, index);
        if (result) {
          results.push(item);
        }
      });

    return results;
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
  createFork(
    localProps?: IModelComponentProps,
    key?: string,
    options?: { sharedProperties?: string[]; register?: boolean },
  ): ForkFlowModel<this> {
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
    if (options?.register !== false) {
      this.forks.add(fork as any);
    }

    // 如果提供了 key，将 fork 缓存起来
    if (key && options?.register !== false) {
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
   * @param {PersistOptions} [options] 可选的持久化选项
   * @returns {boolean} 是否成功移动
   */
  moveTo(targetModel: FlowModel, options?: PersistOptions) {
    if (!this.flowEngine) {
      throw new Error('FlowEngine is not set on this model. Please set flowEngine before saving.');
    }
    return this.flowEngine.moveModel(this.uid, targetModel.uid, options);
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

  async saveStepParams() {
    return this.flowEngine.saveModel(this, { onlyStepParams: true });
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
   * @deprecated
   * 打开步骤设置对话框
   * 用于配置流程中特定步骤的参数和设置
   * @param {string} flowKey 流程的唯一标识符
   * @param {string} stepKey 步骤的唯一标识符
   * @returns {void}
   */
  openStepSettingsDialog(flowKey: string, stepKey: string) {
    // 创建流程运行时上下文
    const flow = this.getFlow(flowKey);
    const step = flow?.steps?.[stepKey];

    if (!flow || !step) {
      console.error(`Flow ${flowKey} or step ${stepKey} not found`);
      return;
    }

    const ctx = new FlowRuntimeContext(this, flowKey, 'settings');
    setupRuntimeContextSteps(ctx, flow, this, flowKey);
    ctx.defineProperty('currentStep', { value: step });

    return openStepSettingsDialogFn({
      model: this,
      flowKey,
      stepKey,
      ctx,
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

  /**
   * @deprecated
   * @param dialogWidth
   * @param dialogTitle
   * @returns
   */
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
    for (const [key, flow] of this.flowRegistry.getFlows()) {
      data['flowRegistry'] = data['flowRegistry'] || {};
      data['flowRegistry'][key] = flow.toData();
    }
    return data;
  }

  /**
   * Opens the flow settings dialog for this flow model.
   * @param options - Configuration options for opening flow settings, excluding the model property
   * @returns A promise that resolves when the flow settings dialog is opened
   */
  async openFlowSettings(options?: Omit<FlowSettingsOpenOptions, 'model'>) {
    return this.flowEngine.flowSettings.open({
      model: this,
      ...options,
    });
  }

  // =============================
  // Dynamic flows (disabled)
  // The following APIs are kept as comments to preserve context
  // =============================
  /*
  async openDynamicFlowsEditor(
    options?: Omit<FlowSettingsOpenOptions, 'model' | 'flowKey' | 'flowKeys' | 'stepKey' | 'preset'>,
  ) {
    return this.flowEngine.flowSettings.openDynamicFlowsEditor({
      model: this,
      ...options,
    });
  }

  #dynamicFlows: FlowDefinition[] = [];

  async loadDynamicFlows(): Promise<FlowDefinition[]> {
    return JSON.parse(localStorage.getItem('DYNAMIC_FLOWS') || '[]');
  }

  async saveDynamicFlows(): Promise<void> {
    localStorage.setItem('DYNAMIC_FLOWS', JSON.stringify(this.#dynamicFlows));
  }

  setDynamicFlows(flows: FlowDefinition[]): void {
    this.#dynamicFlows = flows;
    flows.forEach((flow) => {
      // @ts-ignore
      this.constructor.registerFlow(flow);
    });
  }

  getDynamicFlows(): FlowDefinitionOptions[] {
    return this.#dynamicFlows;
  }
  */
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

export function defineFlow<TModel extends FlowModel = FlowModel>(
  definition: FlowDefinitionOptions,
): FlowDefinitionOptions<TModel> {
  return definition as FlowDefinitionOptions<TModel>;
}
