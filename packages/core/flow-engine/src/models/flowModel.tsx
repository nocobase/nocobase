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
import { FlowEngine } from '../flowEngine';
import type {
  ActionStepDefinition,
  FlowContext,
  FlowDefinition,
  InlineStepDefinition,
  StepDefinition,
  StepParams,
} from '../types';
import { ExtendedFlowDefinition, FlowExtraContext, IModelComponentProps, ReadonlyModelProps } from '../types';
import { generateUid, mergeFlowDefinitions } from '../utils';

// 使用WeakMap存储每个类的flows
const modelFlows = new WeakMap<typeof FlowModel, Map<string, FlowDefinition>>();

export class FlowModel {
  public readonly uid: string;
  public props: IModelComponentProps;
  public hidden: boolean;
  public stepParams: StepParams;
  public flowEngine: FlowEngine;
  public parent: FlowModel | null = null;

  constructor(
    protected options: { uid: string; use?: string; props?: IModelComponentProps; stepParams?: Record<string, any> },
  ) {
    this.uid = options.uid || uid();
    this.props = options.props || {};
    this.hidden = false;
    this.stepParams = options.stepParams || {};

    define(this, {
      props: observable,
      hidden: observable,
      stepParams: observable.deep,
      setProps: action,
      setStepParams: action,
      setHidden: action,
    });
    // 保证onInit在所有属性都定义完成后调用
    // queueMicrotask(() => {
    //   this.onInit(options);
    // });
  }

  onInit(options): void {}

  /**
   * 设置FlowEngine实例
   * @param {FlowEngine} flowEngine FlowEngine实例
   */
  setFlowEngine(flowEngine: FlowEngine): void {
    this.flowEngine = flowEngine;
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
  public static registerFlow<TModel extends FlowModel = FlowModel>(
    keyOrDefinition: string | FlowDefinition<TModel>,
    flowDefinition?: Omit<FlowDefinition<TModel>, 'key'> & { key?: string },
  ): void {
    let definition: FlowDefinition<TModel>;
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
    const ModelClass = this as typeof FlowModel;
    if (!modelFlows.has(ModelClass)) {
      modelFlows.set(ModelClass, new Map<string, FlowDefinition>());
    }
    const flows = modelFlows.get(ModelClass)!;

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

  setHidden(hidden: boolean): void {
    this.hidden = hidden;
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
    let exited = false;
    const stepResults: Record<string, any> = {};
    const shared: Record<string, any> = {};

    // Create a new FlowContext instance for this flow execution
    const createLogger = (level: string) => (message: string, meta?: any) => {
      const logMessage = `[${level.toUpperCase()}] [Flow: ${flowKey}] [Model: ${this.uid}] ${message}`;
      const logMeta = { flowKey, modelUid: this.uid, ...meta };
      console[level.toLowerCase()](logMessage, logMeta);
    };

    const globalContexts = currentFlowEngine.getContext() || {};
    const flowContext: FlowContext<this> = {
      exit: () => {
        exited = true;
        console.log(`Flow '${flowKey}' on model '${this.uid}' exited via ctx.exit().`);
      },
      logger: {
        info: createLogger('INFO'),
        warn: createLogger('WARN'),
        error: createLogger('ERROR'),
        debug: createLogger('DEBUG'),
      },
      stepResults,
      shared,
      globals: globalContexts,
      extra: extra || {},
      model: this,
      app: globalContexts.app || {},
    };

    for (const stepKey in flow.steps) {
      if (Object.prototype.hasOwnProperty.call(flow.steps, stepKey)) {
        const step: StepDefinition = flow.steps[stepKey];
        if (exited) break;

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
          combinedParams = { ...actionDefinition.defaultParams, ...actionStep.defaultParams };
        } else if ((step as InlineStepDefinition).handler) {
          const inlineStep = step as InlineStepDefinition;
          handler = inlineStep.handler;
          combinedParams = { ...inlineStep.defaultParams };
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
          console.error(`BaseModel.applyFlow: Error executing step '${stepKey}' in flow '${flowKey}':`, error);
          return Promise.reject(error);
        }
      }
    }
    return Promise.resolve(lastResult);
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
    console.warn('FlowModel.render() not implemented. Override in subclass for FlowModelRenderer.');
    // 默认返回一个空的div，子类可以覆盖这个方法来实现具体的渲染逻辑
    return <div {...this.props}></div>;
  }

  setParent(parent: FlowModel): void {
    if (!parent || !(parent instanceof FlowModel)) {
      throw new Error('Parent must be an instance of FlowModel.');
    }
    this.parent = parent;
  }

  public subModelKeys = new Set<string>();

  addSubModel(subKey: string, options) {
    const model = this.flowEngine.createModel({ ...options, parentId: this.uid, subKey, subType: 'array' });
    Array.isArray(this[subKey]) || (this[subKey] = observable.shallow([]));
    this[subKey].push(model);
    this.subModelKeys.add(subKey);
    return model;
  }

  setSubModel(subKey: string, options) {
    const model = this.flowEngine.createModel({ ...options, parentId: this.uid, subKey, subType: 'object' });
    this[subKey] = model;
    this.subModelKeys.add(subKey);
    return model;
  }

  createRootModel(options) {
    return this.flowEngine.createModel(options);
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
    this.flowEngine.destroyModel(this.uid);
    if (this.parent) {
      this.parent.subModelKeys.forEach((subKey) => {
        if (this.parent[subKey].includes(this)) {
          this.parent[subKey].splice(this.parent[subKey].indexOf(this), 1);
        }
      });
    }
  }

  // TODO: 不完整，需要考虑 sub-model 的情况
  serialize(): Record<string, any> {
    const data = {
      uid: this.uid,
      ...this.options,
      props: this.props,
      stepParams: this.stepParams,
    };
    for (const subModelKey of this.subModelKeys) {
      if (Array.isArray(this[subModelKey])) {
        data[subModelKey] = this[subModelKey].map((model: FlowModel) => model.serialize());
      } else if (this[subModelKey] instanceof FlowModel) {
        data[subModelKey] = this[subModelKey].serialize();
      }
    }
    return data;
  }
}

export function defineFlow<TModel extends FlowModel = FlowModel>(definition: FlowDefinition): FlowDefinition<TModel> {
  return definition as FlowDefinition<TModel>;
}
