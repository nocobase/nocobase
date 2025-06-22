/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { action, define, observable } from '@formily/reactive';
import _ from 'lodash';
import React from 'react';
import { uid } from 'uid/secure';
import { openRequiredParamsStepFormDialog as openRequiredParamsStepFormDialogFn } from '../components/settings/wrappers/contextual/StepRequiredSettingsDialog';
import { openStepSettingsDialog as openStepSettingsDialogFn } from '../components/settings/wrappers/contextual/StepSettingsDialog';
import { FlowEngine } from '../flowEngine';
import type {
  ActionStepDefinition,
  ArrayElementType,
  CreateModelOptions,
  CreateSubModelOptions,
  DefaultStructure,
  FlowContext,
  FlowDefinition,
  FlowModelMeta,
  FlowModelOptions,
  InlineStepDefinition,
  StepDefinition,
  StepParams,
} from '../types';
import { ExtendedFlowDefinition, FlowExtraContext, IModelComponentProps, ReadonlyModelProps } from '../types';
import { FlowExitException, generateUid, mergeFlowDefinitions, resolveDefaultParams } from '../utils';
import { ForkFlowModel } from './forkFlowModel';

// 使用WeakMap存储每个类的meta
const modelMetas = new WeakMap<typeof FlowModel, FlowModelMeta>();

// 使用WeakMap存储每个类的flows
const modelFlows = new WeakMap<typeof FlowModel, Map<string, FlowDefinition>>();

export class FlowModel<Structure extends { parent?: any; subModels?: any } = DefaultStructure> {
  public readonly uid: string;
  public sortIndex: number;
  public props: IModelComponentProps = {};
  public stepParams: StepParams = {};
  public flowEngine: FlowEngine;
  public parent: Structure['parent'];
  public subModels: Structure['subModels'];
  private _options: FlowModelOptions<Structure>;

  /**
   * 所有 fork 实例的引用集合。
   * 使用 Set 便于在销毁时主动遍历并调用 dispose，避免悬挂引用。
   */
  public forks: Set<ForkFlowModel<any>> = new Set();

  /**
   * 基于 key 的 fork 实例缓存，用于复用 fork 实例
   */
  private forkCache: Map<string, ForkFlowModel<any>> = new Map();

  /**
   * model 树的共享运行上下文
   */
  private _sharedContext: Record<string, any> = {};

  constructor(options: FlowModelOptions<Structure>) {
    if (options?.flowEngine?.getModel(options.uid)) {
      // 此时 new FlowModel 并不创建新实例，而是返回已存在的实例，避免重复创建同一个model实例
      return options.flowEngine.getModel(options.uid);
    }

    if (!options.uid) {
      options.uid = uid();
    }

    this.uid = options.uid;
    this.props = options.props || {};
    this.stepParams = options.stepParams || {};
    this.subModels = {};
    this.flowEngine = options.flowEngine;
    this.sortIndex = options.sortIndex || 0;
    this._options = options;

    define(this, {
      props: observable,
      subModels: observable,
      stepParams: observable,
      setProps: action,
      setStepParams: action,
    });
    // 保证onInit在所有属性都定义完成后调用
    // queueMicrotask(() => {
    //   this.onInit(options);
    // });
    this.createSubModels(options.subModels);
  }

  onInit(options): void {}

  get async() {
    return this._options.async || false;
  }

  get reactView() {
    return this.flowEngine.reactView;
  }

  static get meta() {
    return modelMetas.get(this);
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

  /**
   * 设置FlowEngine实例
   * @param {FlowEngine} flowEngine FlowEngine实例
   */
  setFlowEngine(flowEngine: FlowEngine): void {
    this.flowEngine = flowEngine;
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
    const flows = modelFlows.get(ModelClass as any)!;

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

    // 遍历类继承链，收集所有流程
    let cls: typeof FlowModel | null = this;
    while (cls) {
      const flows = modelFlows.get(cls);
      if (flows) {
        // 合并流程，但如果已有同名流程则不覆盖
        for (const [key, flow] of flows.entries()) {
          if (!allFlows.has(key)) {
            allFlows.set(key, flow);
          }
        }
      }

      // 获取父类
      const proto = Object.getPrototypeOf(cls);
      if (proto === Function.prototype || proto === Object.prototype) {
        break;
      }
      cls = proto as typeof FlowModel;
    }

    return allFlows;
  }

  setProps(props: IModelComponentProps): void;
  setProps(key: string, value: any): void;
  setProps(props: IModelComponentProps | string, value?: any): void {
    if (typeof props === 'string') {
      this.props[props] = value;
    } else {
      this.props = { ...props };
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
        this.stepParams[flowKey][stepKeyOrStepsParams] = params;
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

  async applyFlow(flowKey: string, extra?: FlowExtraContext): Promise<any> {
    const currentFlowEngine = this.flowEngine;
    if (!currentFlowEngine) {
      console.warn(
        'FlowEngine not available on this model for applyFlow. Check model.app and model.app.flowEngine setup.',
      );
      return Promise.reject(new Error('FlowEngine not available for applyFlow. Please set flowEngine on the model.'));
    }

    const flow = this.getFlow(flowKey);

    if (!flow) {
      console.error(`BaseModel.applyFlow: Flow with key '${flowKey}' not found.`);
      return Promise.reject(new Error(`Flow '${flowKey}' not found.`));
    }

    let lastResult: any;
    const stepResults: Record<string, any> = {};

    // Create a new FlowContext instance for this flow execution
    const createLogger = (level: string) => (message: string, meta?: any) => {
      const logMessage = `[${level.toUpperCase()}] [Flow: ${flowKey}] [Model: ${this.uid}] ${message}`;
      const logMeta = { flowKey, modelUid: this.uid, ...meta };
      console[level.toLowerCase()](logMessage, logMeta);
    };

    const globalContexts = currentFlowEngine.getContext() || {};
    const flowContext: FlowContext<this> = {
      exit: () => {
        throw new FlowExitException(flowKey, this.uid);
      },
      logger: {
        info: createLogger('INFO'),
        warn: createLogger('WARN'),
        error: createLogger('ERROR'),
        debug: createLogger('DEBUG'),
      },
      reactView: this.reactView,
      stepResults,
      shared: this.getSharedContext(),
      globals: globalContexts,
      extra: extra || {},
      model: this,
      app: globalContexts.app || {},
    };

    for (const stepKey in flow.steps) {
      if (Object.prototype.hasOwnProperty.call(flow.steps, stepKey)) {
        const step: StepDefinition = flow.steps[stepKey];
        let handler: ((ctx: FlowContext<this>, params: any) => Promise<any> | any) | undefined;
        let combinedParams: Record<string, any> = {};
        let actionDefinition;

        if ((step as ActionStepDefinition).use) {
          const actionStep = step as ActionStepDefinition;
          actionDefinition = currentFlowEngine.getAction(actionStep.use);
          if (!actionDefinition) {
            console.error(
              `BaseModel.applyFlow: Action '${actionStep.use}' not found for step '${stepKey}' in flow '${flowKey}'. Skipping.`,
            );
            continue;
          }
          handler = actionDefinition.handler;
          const actionDefaultParams = await resolveDefaultParams(actionDefinition.defaultParams, flowContext);
          const stepDefaultParams = await resolveDefaultParams(actionStep.defaultParams, flowContext);
          combinedParams = { ...actionDefaultParams, ...stepDefaultParams };
        } else if ((step as InlineStepDefinition).handler) {
          const inlineStep = step as InlineStepDefinition;
          handler = inlineStep.handler;
          const inlineDefaultParams = await resolveDefaultParams(inlineStep.defaultParams, flowContext);
          combinedParams = { ...inlineDefaultParams };
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

        try {
          const currentStepResult = handler!(flowContext, combinedParams);
          if (step.isAwait !== false) {
            lastResult = await currentStepResult;
          } else {
            lastResult = currentStepResult;
          }

          // Store step result
          stepResults[stepKey] = lastResult;
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

  dispatchEvent(eventName: string, extra?: FlowExtraContext): void {
    const currentFlowEngine = this.flowEngine;
    if (!currentFlowEngine) {
      console.warn('FlowEngine not available on this model for dispatchEvent. Please set flowEngine on the model.');
      return;
    }

    // 获取所有流程
    const constructor = this.constructor as typeof FlowModel;
    const allFlows = constructor.getFlows();

    allFlows.forEach((flow) => {
      if (flow.on && flow.on.eventName === eventName) {
        console.log(`BaseModel '${this.uid}' dispatching event '${eventName}' to flow '${flow.key}'.`);
        this.applyFlow(flow.key, extra).catch((error) => {
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
      static name = `CustomFlowModel_${generateUid()}`;
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
    const autoFlows = Array.from(allFlows.values())
      .filter((flow) => flow.auto === true)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0));

    return autoFlows;
  }

  /**
   * 执行所有自动应用流程
   * @param {FlowExtraContext} [extra] 可选的额外上下文
   * @returns {Promise<any[]>} 所有自动应用流程的执行结果数组
   */
  async applyAutoFlows(extra?: FlowExtraContext): Promise<any[]> {
    const autoApplyFlows = this.getAutoFlows();

    if (autoApplyFlows.length === 0) {
      console.warn(`FlowModel: No auto-apply flows found for model '${this.uid}'`);
      return [];
    }

    const results: any[] = [];
    for (const flow of autoApplyFlows) {
      try {
        const result = await this.applyFlow(flow.key, extra);
        results.push(result);
      } catch (error) {
        console.error(`FlowModel.applyAutoFlows: Error executing auto-apply flow '${flow.key}':`, error);
        throw error;
      }
    }

    return results;
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

  setParent(parent: FlowModel): void {
    if (!parent || !(parent instanceof FlowModel)) {
      throw new Error('Parent must be an instance of FlowModel.');
    }
    this.parent = parent;
    this._options.parentId = parent.uid;
  }

  addSubModel(subKey: string, options: CreateModelOptions | FlowModel) {
    let model: FlowModel;
    if (options instanceof FlowModel) {
      if (options.parent && options.parent !== this) {
        throw new Error('Sub model already has a parent.');
      }
      model = options;
    } else {
      model = this.flowEngine.createModel({ ...options, subKey, subType: 'array' });
    }
    model.setParent(this);
    Array.isArray(this.subModels[subKey]) || (this.subModels[subKey] = []);
    const maxSortIndex = Math.max(...this.subModels[subKey].map((item) => item.sortIndex || 0), 0);
    model.sortIndex = maxSortIndex + 1;
    this.subModels[subKey].push(model);
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
    this.subModels[subKey] = model;
    return model;
  }

  mapSubModels<K extends keyof Structure['subModels'], R>(
    subKey: K,
    callback: (model: ArrayElementType<Structure['subModels'][K]>) => R,
  ): R[] {
    const model = this.subModels[subKey];

    if (!model) {
      return [];
    }

    const results: R[] = [];

    _.castArray(model).forEach((item) => {
      const result = (callback as (model: any) => R)(item);
      results.push(result);
    });

    return results;
  }

  findSubModel<K extends keyof Structure['subModels'], R>(
    subKey: K,
    callback: (model: ArrayElementType<Structure['subModels'][K]>) => R,
  ): R | null {
    const model = this.subModels[subKey];

    if (!model) {
      return null;
    }

    return _.castArray(model).find((item) => {
      return (callback as (model: any) => R)(item);
    });
  }

  createRootModel(options) {
    return this.flowEngine.createModel(options);
  }

  async applySubModelsAutoFlows<K extends keyof Structure['subModels'], R>(
    subKey: K,
    extra?: Record<string, any>,
    shared?: Record<string, any>,
  ) {
    await Promise.all(
      this.mapSubModels(subKey, async (column) => {
        column.setSharedContext(shared);
        await column.applyAutoFlows(extra);
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

  remove() {
    if (!this.flowEngine) {
      throw new Error('FlowEngine is not set on this model. Please set flowEngine before saving.');
    }
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

  get ctx() {
    return {
      globals: this.flowEngine.getContext(),
      shared: this.getSharedContext(),
    };
  }

  public setSharedContext(ctx: Record<string, any>) {
    this._sharedContext = ctx;
  }

  public getSharedContext() {
    if (this.async || !this.parent) {
      return this._sharedContext;
    }
    return {
      ...this.parent?.getSharedContext(),
      ...this._sharedContext, // 当前实例的 context 优先级最高
    };
  }

  // TODO: 不完整，需要考虑 sub-model 的情况
  serialize(): Record<string, any> {
    const data = {
      uid: this.uid,
      ..._.omit(this._options, ['flowEngine']),
      props: this.props,
      stepParams: this.stepParams,
      sortIndex: this.sortIndex,
    };
    for (const subModelKey in this.subModels) {
      data.subModels = data.subModels || {};
      if (Array.isArray(this.subModels[subModelKey])) {
        data.subModels[subModelKey] = this.subModels[subModelKey].map((model: FlowModel, index) => ({
          ...model.serialize(),
          sortIndex: index,
        }));
      } else if ((this.subModels[subModelKey] as any) instanceof FlowModel) {
        data.subModels[subModelKey] = this.subModels[subModelKey].serialize();
      }
    }
    return data;
  }
}

export function defineFlow<TModel extends FlowModel = FlowModel>(definition: FlowDefinition): FlowDefinition<TModel> {
  return definition as FlowDefinition<TModel>;
}
