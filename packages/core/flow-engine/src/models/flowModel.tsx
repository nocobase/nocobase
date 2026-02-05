/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { batch, define, observable, observe } from '@formily/reactive';
import _ from 'lodash';
import React from 'react';
import { uid } from 'uid/secure';
import { openRequiredParamsStepFormDialog as openRequiredParamsStepFormDialogFn } from '../components/settings/wrappers/contextual/StepRequiredSettingsDialog';
import { openStepSettingsDialog as openStepSettingsDialogFn } from '../components/settings/wrappers/contextual/StepSettingsDialog';
import { Emitter } from '../emitter';
import { InstanceFlowRegistry } from '../flow-registry/InstanceFlowRegistry';
import { FlowContext, FlowModelContext, FlowRuntimeContext } from '../flowContext';
import { FlowEngine } from '../flowEngine';
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
  ResolveUseResult,
  StepParams,
} from '../types';
import { IModelComponentProps, ReadonlyModelProps } from '../types';
import { isInheritedFrom, setupRuntimeContextSteps } from '../utils';
// import { FlowExitAllException } from '../utils/exceptions';
import { Typography } from 'antd/lib';
import { ModelActionRegistry } from '../action-registry/ModelActionRegistry';
import { buildSubModelItem } from '../components/subModel/utils';
import { ModelEventRegistry } from '../event-registry/ModelEventRegistry';
import { GlobalFlowRegistry } from '../flow-registry/GlobalFlowRegistry';
import { FlowDefinition } from '../FlowDefinition';
import { FlowSettingsOpenOptions } from '../flowSettings';
import type { ScheduleOptions } from '../scheduler/ModelOperationScheduler';
import type { DispatchEventOptions, EventDefinition } from '../types';
import { ForkFlowModel } from './forkFlowModel';
import type { MenuProps } from 'antd';
import { observer } from '..';

// 使用 WeakMap 为每个类缓存一个 ModelActionRegistry 实例
const classActionRegistries = new WeakMap<typeof FlowModel, ModelActionRegistry>();

// 使用 WeakMap 为每个类缓存一个 ModelEventRegistry 实例
const classEventRegistries = new WeakMap<typeof FlowModel, ModelEventRegistry>();

// 使用WeakMap存储每个类的meta
const modelMetas = new WeakMap<typeof FlowModel, FlowModelMeta>();

// 使用WeakMap存储每个类的 GlobalFlowRegistry
const modelGlobalRegistries = new WeakMap<typeof FlowModel, GlobalFlowRegistry>();

type BaseMenuItem = NonNullable<MenuProps['items']>[number];
type MenuLeafItem = Exclude<BaseMenuItem, { children: MenuProps['items'] }>;

export type FlowModelExtraMenuItem = Omit<MenuLeafItem, 'key'> & {
  key: React.Key;
  group?: string;
  sort?: number;
  onClick?: () => void;
};

type FlowModelExtraMenuItemInput = Omit<FlowModelExtraMenuItem, 'key'> & { key?: React.Key };

type ExtraMenuItemEntry = {
  group?: string;
  sort?: number;
  matcher?: (model: FlowModel) => boolean;
  keyPrefix?: string;
  items:
    | FlowModelExtraMenuItemInput[]
    | ((
        model: FlowModel,
        t: (k: string, opt?: any) => string,
      ) => FlowModelExtraMenuItemInput[] | Promise<FlowModelExtraMenuItemInput[]>);
};

const classMenuExtensions = new WeakMap<typeof FlowModel, Set<ExtraMenuItemEntry>>();

export enum ModelRenderMode {
  ReactElement = 'reactElement',
  RenderFunction = 'renderFunction',
}

export class FlowModel<Structure extends DefaultStructure = DefaultStructure> {
  /**
   * 当 flowSettingsEnabled 且 model.hidden 为 true 时用于渲染设置态组件（实例方法，子类可覆盖）。
   * 基类默认仅返回一个透明度降低的占位元素
   */
  protected renderHiddenInConfig(): React.ReactNode | undefined {
    return <span style={{ opacity: 0.5 }}>{this.translate?.('Hidden') || 'Hidden'}</span>;
  }
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
  protected _extraTitle: string;
  public isNew = false; // 标记是否为新建状态
  public skeleton = null;
  public forbidden = null;

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
   * 上一次 beforeRender 的执行参数
   */
  private _lastAutoRunParams: [Record<string, any> | undefined, boolean?] | null = null;
  protected observerDispose: () => void;
  #flowContext: FlowModelContext;

  /**
   * 原始 render 方法的引用
   */
  private _originalRender: (() => any) | null = null;

  protected renderOriginal(): React.ReactNode {
    return this._originalRender();
  }

  /**
   * 缓存的响应式包装器组件（每个实例一个）
   */
  private _reactiveWrapperCache?: React.ComponentType;

  flowRegistry: InstanceFlowRegistry;
  private _cleanRun?: boolean;
  /**
   * 声明渲染模式：
   * - 'renderElement': render 返回 React 节点，框架会用 observer 包装以获得响应式；
   * - 'renderFunction': render 返回渲染函数（例如表格单元格渲染器），不做包装也不预调用；
   */
  static renderMode: ModelRenderMode = ModelRenderMode.ReactElement;

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
    this._title = '';
    this._extraTitle = '';

    define(this as any, {
      hidden: observable,
      props: observable,
      subModels: observable.shallow,
      stepParams: observable,
      _title: observable,
      _extraTitle: observable,
      // setProps: action,
      setProps: batch,
      // setStepParams: action,
      setStepParams: batch,
    });
    // 保证onInit在所有属性都定义完成后调用
    // queueMicrotask(() => {
    //   this.onInit(options);
    // });

    this.flowRegistry = new InstanceFlowRegistry(this);
    this.flowRegistry.addFlows(options.flowRegistry);

    this.observerDispose = observe(this.stepParams, (changed) => {
      // if doesn't change, skip
      if (changed.type === 'set' && _.isEqual(changed.value, changed.oldValue)) {
        return;
      }

      if (this.flowEngine) {
        this.invalidateFlowCache('beforeRender');
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
  }

  /**
   * 通过 AddSubModelButton 添加为子模型后调用（子类可覆盖）
   */
  async afterAddAsSubModel() {}

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

  public scheduleModelOperation(
    toUid: string,
    fn: (model: FlowModel) => Promise<void> | void,
    options?: ScheduleOptions,
  ) {
    return this.flowEngine?.scheduleModelOperation(this, toUid, fn, options);
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
   * 动态解析实际要实例化的模型类；可在子类中覆盖。
   * 返回注册名或构造器，支持在 FlowEngine 中继续沿链解析。
   */
  static resolveUse?(options: CreateModelOptions, engine: FlowEngine, parent?: FlowModel): ResolveUseResult | void;

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

  static async buildChildrenFromModels(ctx, Models: Array<any>) {
    return Promise.all(Models.map((M) => buildSubModelItem(M, ctx, true)));
  }

  get title() {
    // model 可以通过 setTitle 来自定义title， 具有更高的优先级
    return this.translate(this._title) || this.translate(this.constructor['meta']?.label);
  }

  get extraTitle() {
    return this._extraTitle ? this.translate(this._extraTitle) : '';
  }

  setTitle(value: string) {
    this._title = value;
  }

  setExtraTitle(value: string) {
    this._extraTitle = value || '';
  }

  setHidden(value: boolean) {
    this.hidden = !!value;
  }

  _createSubModels(subModels: Record<string, CreateSubModelOptions | CreateSubModelOptions[]>) {
    // Merge default subModels declared in meta.createModelOptions (object form) with provided subModels.
    // Provided subModels take precedence over defaults.
    let mergedSubModels: Record<string, CreateSubModelOptions | CreateSubModelOptions[]> = subModels || {};
    try {
      const Cls = this.constructor as typeof FlowModel;
      const meta = Cls.meta as any;
      const metaCreate = meta?.createModelOptions;
      if (metaCreate && typeof metaCreate === 'object' && metaCreate.subModels) {
        const replaceArrays = (objValue: unknown, srcValue: unknown) => {
          if (Array.isArray(objValue) && Array.isArray(srcValue)) {
            // Arrays should be replaced, not merged by index.
            return srcValue;
          }
          return undefined;
        };
        mergedSubModels = _.mergeWith(
          {},
          _.cloneDeep(metaCreate.subModels || {}),
          _.cloneDeep(subModels || {}),
          replaceArrays,
        );
      }
    } catch (e) {
      // Fallback silently if meta defaults resolution fails
    }

    Object.entries(mergedSubModels || {}).forEach(([key, value]) => {
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

  /**
   * 失效指定事件的流程缓存；未指定 eventName 时，失效当前模型全部事件缓存。
   * - 默认 beforeRender 与其它事件共享同一缓存体系：prefix=`event:${scope}`，flowKey=`eventName`，uid=`model.uid`
   */
  public invalidateFlowCache(eventName?: string, deep = false) {
    if (this.flowEngine) {
      const scope = `event:${this.getFlowCacheScope(eventName || 'beforeRender')}`;
      const cache = this.flowEngine.applyFlowCache;

      if (eventName) {
        // 删除该事件名下所有缓存（忽略不同 inputArgs 的散列差异）
        const altScope = scope.replace(/:/g, '-');
        const uidSuffixes = [`:${this.uid}`, `-${this.uid}`];
        const eventSegments = [`:${eventName}:`, `-${eventName}-`];
        for (const key of cache.keys()) {
          const startMatches = key.startsWith(scope) || key.startsWith(altScope);
          const endMatches = uidSuffixes.some((s) => key.endsWith(s));
          const eventMatches = eventSegments.some((seg) => key.includes(seg));
          if (startMatches && endMatches && eventMatches) {
            cache.delete(key);
          }
        }
      } else {
        // 粗粒度：扫描并删除当前模型 uid 相关的事件缓存（任意事件）
        const altScope = `${scope}:`.replace(/:/g, '-');
        const prefixes = [`${scope}:`, altScope];
        const uidSuffixes = [`:${this.uid}`, `-${this.uid}`];
        for (const key of cache.keys()) {
          const startMatches = prefixes.some((p) => key.startsWith(p));
          const endMatches = uidSuffixes.some((s) => key.endsWith(s));
          if (startMatches && endMatches) cache.delete(key);
        }
      }

      // 同步失效所有 fork 的缓存
      this.forks.forEach((fork) => {
        const forkScope = `event:${
          (fork as any).getFlowCacheScope?.(eventName || 'beforeRender') ?? String((fork as any)['forkId'])
        }`;
        const altForkScope = forkScope.replace(/:/g, '-');
        const uidSuffixes = [`:${this.uid}`, `-${this.uid}`];
        if (eventName) {
          const eventSegments = [`:${eventName}:`, `-${eventName}-`];
          for (const key of this.flowEngine.applyFlowCache.keys()) {
            const startMatches = key.startsWith(forkScope) || key.startsWith(altForkScope);
            const endMatches = uidSuffixes.some((s) => key.endsWith(s));
            const eventMatches = eventSegments.some((seg) => key.includes(seg));
            if (startMatches && endMatches && eventMatches) this.flowEngine.applyFlowCache.delete(key);
          }
        } else {
          const prefixes = [`${forkScope}:`, `${altForkScope}-`];
          for (const key of this.flowEngine.applyFlowCache.keys()) {
            const startMatches = prefixes.some((p) => key.startsWith(p));
            const endMatches = uidSuffixes.some((s) => key.endsWith(s));
            if (startMatches && endMatches) this.flowEngine.applyFlowCache.delete(key);
          }
        }
      });
    }
    if (deep) {
      const subModelKeys = Object.keys(this.subModels);
      for (const subModelKey of subModelKeys) {
        const subModelValue = this.subModels[subModelKey];
        if (Array.isArray(subModelValue)) {
          for (const subModel of subModelValue) {
            subModel.invalidateFlowCache(eventName, deep);
          }
        } else if (subModelValue instanceof FlowModel) {
          subModelValue.invalidateFlowCache(eventName, deep);
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
  public static registerFlow<
    TClass extends ModelConstructor,
    TModel extends InstanceType<TClass> = InstanceType<TClass>,
  >(
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
    // 分离获取：实例流（未排序）与静态流（在 GlobalFlowRegistry 中已排序）
    const instanceFlows = this.flowRegistry.getFlows();
    const staticFlows = (this.constructor as typeof FlowModel).globalFlowRegistry.getFlows();

    // 跳过同名静态流（实例覆盖静态）
    const instanceKeys = new Set(instanceFlows.keys());
    const staticEntries = Array.from(staticFlows.entries()).filter(([key]) => !instanceKeys.has(key));

    // 组内排序：
    // - 静态流：GlobalFlowRegistry 已按 sort 和继承深度排序，直接使用
    // - 实例流：按 sort 升序；相同 sort 保持注册顺序
    const instanceEntries = Array.from(instanceFlows.entries());
    const instanceEntriesWithIndex = instanceEntries.map((e, i) => ({ e, i }));
    instanceEntriesWithIndex.sort((a, b) => {
      const sa = a.e[1].sort ?? 0;
      const sb = b.e[1].sort ?? 0;
      if (sa !== sb) return sa - sb;
      return a.i - b.i; // 稳定顺序
    });

    // 分组合并：动态流（实例）优先于静态流
    const merged: [string, FlowDefinition][] = [...instanceEntriesWithIndex.map(({ e }) => e), ...staticEntries];

    return new Map<string, FlowDefinition>(merged);
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
    // 发起配置修改事件
    this.emitter.emit('onStepParamsChanged');
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

  private async _dispatchEvent(
    eventName: string,
    inputArgs?: Record<string, any>,
    options?: DispatchEventOptions,
  ): Promise<any[]> {
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
    return await currentFlowEngine.executor.dispatchEvent(target, eventName, inputArgs, options);
  }

  private _dispatchEventWithDebounce = _.debounce(
    async function (
      this: FlowModel,
      eventName: string,
      inputArgs?: Record<string, any>,
      options?: DispatchEventOptions,
    ) {
      return this._dispatchEvent(eventName, inputArgs, options);
    },
    500,
    { leading: true },
  );

  async dispatchEvent(
    eventName: string,
    inputArgs?: Record<string, any>,
    options?: {
      /** 是否要开启防抖功能 */
      debounce?: boolean;
    } & DispatchEventOptions,
  ): Promise<any[]> {
    const isBeforeRender = eventName === 'beforeRender';
    // 缺省值由模型层提供：beforeRender 默认顺序执行 + 使用缓存；其它事件默认顺序执行（不默认使用缓存）
    const defaults = isBeforeRender ? { sequential: true, useCache: true } : { sequential: true };
    const execOptions = {
      sequential: options?.sequential ?? (defaults as any).sequential,
      useCache: options?.useCache ?? (defaults as any).useCache,
    } as DispatchEventOptions;

    // 记录最近一次 beforeRender 的入参与选项，便于 stepParams 变化时触发重跑
    if (isBeforeRender) {
      this._lastAutoRunParams = [inputArgs, execOptions.useCache];
    }

    if (options?.debounce) {
      return this._dispatchEventWithDebounce(eventName, inputArgs, execOptions);
    }
    return this._dispatchEvent(eventName, inputArgs, execOptions);
  }

  /**
   * 按事件名获取对应的流程集合（保持 getFlows 的顺序，即按 sort 排序）。
   * - beforeRender 兼容：除显式 on: 'beforeRender' 外，包含未声明 on 且 manual !== true 的流程。
   */
  public getEventFlows(eventName: string): FlowDefinition[] {
    const allFlows = this.getFlows();
    const beforeRender = eventName === 'beforeRender';
    const isMatch = (flow: FlowDefinition) => {
      if (beforeRender) {
        if (flow.manual === true) return false;
        if (!flow.on) return true;
        return typeof flow.on === 'string' ? flow.on === 'beforeRender' : flow.on?.eventName === 'beforeRender';
      }
      const on = flow.on;
      if (!on) return false;
      return typeof on === 'string' ? on === eventName : on?.eventName === eventName;
    };
    return Array.from(allFlows.values()).filter(isMatch);
  }

  /**
   * 重新执行上一次的 beforeRender，保持参数一致
   * 如果之前没有执行过，则直接跳过
   * 使用 lodash debounce 避免频繁调用
   */
  private _rerunLastAutoRun = _.debounce(async () => {
    if (this._lastAutoRunParams) {
      try {
        const [inputArgs] = this._lastAutoRunParams as any[];
        await this.dispatchEvent('beforeRender', inputArgs);
      } catch (error) {
        console.error('FlowModel._rerunLastAutoRun: Error during rerun:', error);
      }
    }
  }, 100);

  /**
   * 通用事件分发钩子：开始
   * 子类可覆盖；beforeRender 事件可通过抛出 FlowExitException 提前终止。
   */
  public async onDispatchEventStart(
    eventName: string,
    options?: DispatchEventOptions,
    inputArgs?: Record<string, any>,
  ): Promise<void> {}

  /**
   * 通用事件分发钩子：结束
   * 子类可覆盖。
   */
  public async onDispatchEventEnd(
    eventName: string,
    options?: DispatchEventOptions,
    inputArgs?: Record<string, any>,
    results?: any[],
  ): Promise<void> {}

  /**
   * 通用事件分发钩子：错误
   * 子类可覆盖。
   */
  public async onDispatchEventError(
    eventName: string,
    options?: DispatchEventOptions,
    inputArgs?: Record<string, any>,
    error?: Error,
  ): Promise<void> {}

  useHooksBeforeRender() {}

  /**
   * 智能检测是否应该跳过响应式包装
   * 说明：
   * - 仅基于标记判断，不会执行 render，避免出现“预调用 render”带来的副作用和双调用问题。
   * - 当子类需要返回函数（如表格列的单元格渲染器），应在子类上设置静态属性 `renderReturnsFunction = true`。
   */
  private shouldSkipReactiveWrapping(): boolean {
    // 已经包裹过则跳过
    if ((this.render as any).__isReactiveWrapped) {
      return true;
    }
    // 子类显式声明渲染模式为 renderFunction，则跳过包裹
    const Cls = this.constructor as typeof FlowModel;
    if (Cls.renderMode === ModelRenderMode.RenderFunction) {
      return true;
    }
    return false;
  }

  /**
   * 设置 render 方法的响应式包装
   * @private
   */
  private setupReactiveRender(): void {
    // 确保 render 方法存在且是函数
    if (typeof this.render !== 'function') {
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

      // 如果需要跳过响应式包装（例如返回渲染函数），也需要包一层以处理 hidden/config 逻辑
      if (this.shouldSkipReactiveWrapping()) {
        const wrappedNonReactive = function (this: any) {
          const isConfigMode = !!this?.context?.flowSettingsEnabled;
          if (this.hidden) {
            if (!isConfigMode) return null;
            const rendered = this.renderHiddenInConfig?.();
            const Cls = this.constructor as typeof FlowModel;
            const returnsFunction = Cls.renderMode === ModelRenderMode.RenderFunction;
            return returnsFunction ? (typeof rendered === 'function' ? rendered : () => rendered) : rendered;
          }
          return originalRender.call(this);
        };
        (wrappedNonReactive as any).__originalRender = originalRender;
        this.render = wrappedNonReactive;
        return;
      }

      // 创建缓存的响应式包装器组件工厂（只创建一次）
      const createReactiveWrapper = (modelInstance: any) => {
        const ReactiveWrapper = observer(() => {
          // 触发响应式更新的关键属性访问（读取 run/渲染目标的 props）
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
            // 发射 mounted 生命周期事件（严格模式：不吞错，若有错误将以未处理拒绝暴露）
            void renderTarget.flowEngine?.emitter?.emitAsync('model:mounted', {
              uid: renderTarget.uid,
              model: renderTarget,
            });
            return () => {
              if (typeof renderTarget.onUnmount === 'function') {
                renderTarget.onUnmount();
              }
              // 发射 unmounted 生命周期事件（严格模式：不吞错）
              void renderTarget.flowEngine?.emitter?.emitAsync('model:unmounted', {
                uid: renderTarget.uid,
                model: renderTarget,
              });
            };
          }, [renderTarget]);

          // 处理 hidden 渲染逻辑：
          const isConfigMode = !!modelInstance?.context?.flowSettingsEnabled;
          if (modelInstance.hidden) {
            if (!isConfigMode) {
              return null;
            }
            // 设置态隐藏时的渲染：由实例方法 renderHiddenInConfig 决定；若为渲染函数模式，则包装为函数
            return modelInstance.renderHiddenInConfig?.();
          }

          // 订阅 stepParams 变化，以便当步骤参数（如 JS 代码等）更新时触发一次 React 渲染，
          // 从而让 useHooksBeforeRender 中的副作用得以感知并执行（如 applyFlow('jsSettings')）。
          modelInstance.stepParams;

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
   * 有权限时的渲染逻辑。
   * 这是一个抽象方法，所有子类都必须实现，用于返回自己的正常 UI。
   *
   * @returns {React.ReactNode} 有权限时的渲染结果
   */
  public render(): any {
    return <div {...this.props}></div>;
  }

  async rerender() {
    await this.dispatchEvent('beforeRender', this._lastAutoRunParams?.[0], { useCache: false });
  }

  /**
   * 事件缓存的作用域标识；可按事件区分（默认与事件无关的 scope 返回 'default'）。
   */
  public getFlowCacheScope(eventName: string): string {
    return String(eventName);
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
    const actualParent: FlowModel = (this['master'] as FlowModel) || this;

    let model: T;
    if (options instanceof FlowModel) {
      // Compare by uid to tolerate fork wrappers and contextThis bindings
      const hasParent = !!options.parent;
      const parentUid = options.parent?.uid;
      if (hasParent && parentUid && parentUid !== actualParent.uid) {
        throw new Error('Sub model already has a parent.');
      }
      model = options;
    } else {
      model = actualParent.flowEngine.createModel<T>({
        ...options,
        parentId: actualParent.uid,
        subKey,
        subType: 'array',
      });
    }
    model.setParent(actualParent);
    const subModels = actualParent.subModels as {
      [subKey: string]: FlowModel[];
    };
    if (!Array.isArray(subModels[subKey])) {
      subModels[subKey] = observable.shallow([]);
    }
    const maxSortIndex = Math.max(...(subModels[subKey] as FlowModel[]).map((item) => item.sortIndex || 0), 0);
    model.sortIndex = maxSortIndex + 1;
    subModels[subKey].push(model);
    actualParent.emitter.emit('onSubModelAdded', model);
    // 同步发射到引擎级事件总线，便于外部统一监听模型树变更
    actualParent.flowEngine?.emitter?.emit('model:subModel:added', {
      parentUid: actualParent.uid,
      parent: actualParent,
      subKey,
      model,
    });
    return model;
  }

  setSubModel(subKey: string, options: CreateModelOptions | FlowModel) {
    const actualParent: FlowModel = (this['master'] as FlowModel) || this;

    let model: FlowModel;
    if (options instanceof FlowModel) {
      // Compare by uid to tolerate fork wrappers and contextThis bindings
      const hasParent = !!options.parent;
      const parentUid = options.parent?.uid;
      if (hasParent && parentUid && parentUid !== actualParent.uid) {
        throw new Error('Sub model already has a parent.');
      }
      model = options;
    } else {
      model = actualParent.flowEngine.createModel({
        ...options,
        parentId: actualParent.uid,
        subKey,
        subType: 'object',
      });
    }
    model.setParent(actualParent);
    (actualParent.subModels as any)[subKey] = model;
    actualParent.emitter.emit('onSubModelAdded', model);
    actualParent.flowEngine?.emitter?.emit('model:subModel:added', {
      parentUid: actualParent.uid,
      parent: actualParent,
      subKey,
      model,
    });
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

  /**
   * 对指定子模型派发 beforeRender 事件（顺序执行并使用缓存）。
   */
  async applySubModelsBeforeRenderFlows<K extends keyof Structure['subModels']>(
    subKey: K,
    inputArgs?: Record<string, any>,
    shared?: Record<string, any>,
  ) {
    await Promise.all(
      this.mapSubModels(subKey, async (sub) => {
        await sub.dispatchEvent('beforeRender', inputArgs);
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
    const forkId = uid(); // 当前集合大小作为索引
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
    this.invalidateFlowCache('beforeRender', true);
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
    this.invalidateFlowCache('beforeRender', true);
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
    setupRuntimeContextSteps(ctx, flow.steps, this, flowKey);
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
      flowRegistry: {},
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
      data.flowRegistry[key] = flow.toData();
    }
    return data;
  }

  /**
   * 复制当前模型实例为一个新的实例。
   * 新实例及其所有子模型都会有新的 uid，且不保留 root model 的 parent 关系。
   * 内部所有引用旧 uid 的地方（如 parentId, parentUid 等）都会被替换为对应的新 uid。
   * @returns {FlowModel} 复制后的新模型实例
   */
  clone<T extends FlowModel = this>(): T {
    if (!this.flowEngine) {
      throw new Error('FlowEngine is not set on this model. Please set flowEngine before cloning.');
    }

    // 序列化当前实例
    const serialized = this.serialize();

    // 第一步：收集所有 uid 并建立 oldUid -> newUid 的映射
    const uidMap = new Map<string, string>();

    const collectUids = (data: Record<string, any>): void => {
      if (data.uid && typeof data.uid === 'string') {
        uidMap.set(data.uid, uid());
      }

      // 递归处理 subModels
      if (data.subModels) {
        for (const key in data.subModels) {
          const subModel = data.subModels[key];
          if (Array.isArray(subModel)) {
            subModel.forEach((item) => collectUids(item));
          } else if (subModel && typeof subModel === 'object') {
            collectUids(subModel);
          }
        }
      }
    };

    collectUids(serialized);

    // 第二步：深度遍历并替换所有 uid 引用
    const replaceUidReferences = (data: any, isRoot = false): any => {
      if (data === null || data === undefined) {
        return data;
      }

      // 如果是字符串，检查是否是需要替换的 uid
      if (typeof data === 'string') {
        return uidMap.get(data) ?? data;
      }

      // 如果是数组，递归处理每个元素
      if (Array.isArray(data)) {
        return data.map((item) => replaceUidReferences(item, false));
      }

      // 如果是对象，递归处理每个属性
      if (typeof data === 'object') {
        const result: Record<string, any> = {};

        for (const key in data) {
          if (!Object.prototype.hasOwnProperty.call(data, key)) continue;

          // 只删除 root model 的 parentId
          if (isRoot && key === 'parentId') {
            continue;
          }

          result[key] = replaceUidReferences(data[key], false);
        }

        return result;
      }

      // 其他类型（number, boolean 等）直接返回
      return data;
    };

    const clonedData = replaceUidReferences(serialized, true);

    // 使用 flowEngine 创建新实例
    return this.flowEngine.createModel<T>(clonedData as any);
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

  /** 注册设置菜单的额外项（静态，按类缓存，可继承合并） */
  static registerExtraMenuItems(
    opts:
      | ExtraMenuItemEntry
      | ((
          model: FlowModel,
          t: (k: string, opt?: any) => string,
        ) => FlowModelExtraMenuItemInput[] | Promise<FlowModelExtraMenuItemInput[]>),
  ): () => void {
    const ModelClass = this as typeof FlowModel;
    const registry = classMenuExtensions.get(ModelClass) || new Set<ExtraMenuItemEntry>();
    let entry: ExtraMenuItemEntry;
    if (typeof opts === 'function') {
      entry = { items: opts };
    } else {
      entry = opts;
    }
    registry.add(entry);
    classMenuExtensions.set(ModelClass, registry);
    return () => {
      const reg = classMenuExtensions.get(ModelClass);
      reg?.delete(entry);
    };
  }

  static async getExtraMenuItems(
    model: FlowModel,
    t: (k: string, opt?: any) => string,
  ): Promise<FlowModelExtraMenuItem[]> {
    const ModelClass = this as typeof FlowModel;
    const collected: FlowModelExtraMenuItem[] = [];
    const seen = new Set<typeof FlowModel>();
    const walk = async (Cls: typeof FlowModel) => {
      if (!Cls || seen.has(Cls)) return;
      seen.add(Cls);
      const reg = classMenuExtensions.get(Cls);
      if (reg) {
        for (const entry of reg) {
          if (entry.matcher && !entry.matcher(model)) continue;
          const items =
            typeof entry.items === 'function' ? await entry.items(model, t) : await Promise.resolve(entry.items || []);
          const group = entry.group || 'common-actions';
          const sort = entry.sort ?? 0;
          const prefix = entry.keyPrefix || Cls.name || 'extra';
          (items || []).forEach((it, idx: number) => {
            if (!it) return;
            const key = it.key ?? `${prefix}-${group}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
            collected.push({
              ...it,
              key,
              group: it.group || group,
              sort: typeof it.sort === 'number' ? it.sort : sort,
            });
          });
        }
      }
      const ParentClass = Object.getPrototypeOf(Cls) as typeof FlowModel;
      const isFlowModelCtor = ParentClass === FlowModel || ParentClass?.prototype instanceof FlowModel;
      if (isFlowModelCtor) {
        await walk(ParentClass);
      }
    };
    await walk(ModelClass);
    return collected;
  }

  refresh() {
    return this.rerender();
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
    return <Typography.Text type="danger">{this.errorMessage}</Typography.Text>;
  }
}

export function defineFlow<TModel extends FlowModel = FlowModel>(
  definition: FlowDefinitionOptions,
): FlowDefinitionOptions<TModel> {
  return definition as FlowDefinitionOptions<TModel>;
}
