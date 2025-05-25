import { observable, action, define } from '@formily/reactive';
import { FlowEngine } from '../../flow-engine';
import type { FlowContext, StepDefinition, FlowDefinition, ActionStepDefinition, InlineStepDefinition } from '../../flow-engine/types';
import type { Application } from '../../application/Application';
import { uid } from '@nocobase/utils/client';
import _ from 'lodash';
import { ExtendedFlowDefinition, IModelComponentProps, ReadonlyModelProps, FlowUserContext } from '../types';
import { mergeFlowDefinitions } from '../utils';

// 使用WeakMap存储每个类的flows
const modelFlows = new WeakMap<typeof FlowModel, Map<string, FlowDefinition>>();

export class FlowModel {
  public readonly uid: string;
  public props: IModelComponentProps;
  public hidden: boolean;
  public stepParams: Record<string, Record<string, any>>;
  public app: Application;

  constructor(
    uid: string,
    app: Application,
    stepParams?: Record<string, any>,
  ) {
    this.uid = uid;
    this.props = {};
    this.hidden = false;
    this.stepParams = stepParams || {};
    this.app = app;

    define(this, {
      props: observable,
      hidden: observable,
      stepParams: observable.deep,
      setProps: action,
      setStepParams: action,
      setHidden: action,
    });
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
    flowDefinition?: FlowDefinition<TModel>
  ): void {
    let definition: FlowDefinition<TModel>;
    let key: string;
    
    if (typeof keyOrDefinition === 'string' && flowDefinition) {
      key = keyOrDefinition;
      definition = {
        ...flowDefinition,
        key
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

  get flowEngine(): FlowEngine | undefined {
    if (this.app && this.app.flowEngine) {
      if (this.app.flowEngine instanceof FlowEngine) {
        return this.app.flowEngine;
      }
      // Duck typing with type assertion to any for property access
      if (typeof this.app.flowEngine === 'object' && 
          this.app.flowEngine !== null &&
          typeof (this.app.flowEngine as any).getFlow === 'function' &&  
          typeof (this.app.flowEngine as any).getAction === 'function') {
        console.warn(`[BaseModel uid: ${this.uid}] flowEngine getter: this.app.flowEngine is not an instanceof FlowEngine, but seems to have core methods. Module identity issue?`);
        return this.app.flowEngine as FlowEngine;
      }
    }
    return undefined;
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
  setStepParams(flowKey: string, stepsParams: Record<string, any>): void;
  setStepParams(allParams: Record<string, Record<string, any>>): void;
  setStepParams(
    flowKeyOrAllParams: string | Record<string, Record<string, any>>,
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
  getStepParams(): Record<string, Record<string, any>>;
  getStepParams(flowKey?: string, stepKey?: string): any {
    if (flowKey && stepKey) {
      return this.stepParams[flowKey]?.[stepKey];
    }
    if (flowKey) {
      return this.stepParams[flowKey];
    }
    return this.stepParams;
  }

  async applyFlow(flowKey: string, context?: FlowUserContext): Promise<any> {
    const currentFlowEngine = this.flowEngine;
    if (!currentFlowEngine || !this.app) {
      console.warn('FlowEngine or Application not available on this model for applyFlow. Check model.app and model.app.flowEngine setup.');
      return Promise.reject(new Error('FlowEngine or Application not available for applyFlow'));
    }
    
    let flow = this.getFlow(flowKey);
    
    if (!flow) {
      console.error(`BaseModel.applyFlow: Flow with key '${flowKey}' not found.`);
      return Promise.reject(new Error(`Flow '${flowKey}' not found.`));
    }

    let lastResult: any;
    let exited = false;
    const exitFlow = () => { exited = true; console.log(`Flow '${flowKey}' on model '${this.uid}' exited via ctx.$exit().`); };

    const baseContextForSteps: Omit<FlowContext, '$exit'> = {
      engine: currentFlowEngine,
      app: this.app,
      ...(context || {}),
    };

    for (const stepKey in flow.steps) {
      if (Object.prototype.hasOwnProperty.call(flow.steps, stepKey)) {
        const step: StepDefinition = flow.steps[stepKey];
        if (exited) break;

        const stepContext: FlowContext = { ...baseContextForSteps, $exit: exitFlow } as FlowContext;
        
        let handler: ((ctx: FlowContext, model: FlowModel, params: any) => Promise<any> | any) | undefined;
        let combinedParams: Record<string, any> = {};
        let actionDefinition;

        if ((step as ActionStepDefinition).use) {
          const actionStep = step as ActionStepDefinition;
          actionDefinition = currentFlowEngine.getAction(actionStep.use);
          if (!actionDefinition) {
            console.error(`BaseModel.applyFlow: Action '${actionStep.use}' not found for step '${stepKey}' in flow '${flowKey}'. Skipping.`);
            continue;
          }
          handler = actionDefinition.handler;
          combinedParams = { ...actionDefinition.defaultParams, ...actionStep.defaultParams };
        } else if ((step as InlineStepDefinition).handler) {
          const inlineStep = step as InlineStepDefinition;
          handler = inlineStep.handler;
          combinedParams = { ...inlineStep.defaultParams };
        } else {
          console.error(`BaseModel.applyFlow: Step '${stepKey}' in flow '${flowKey}' has neither 'use' nor 'handler'. Skipping.`);
          continue;
        }

        const modelStepParams = this.getStepParams(flowKey, stepKey);
        if (modelStepParams !== undefined) {
          combinedParams = { ...combinedParams, ...modelStepParams };
        }

        try {
          const currentStepResult = handler!(stepContext, this, combinedParams);
          if (step.isAwait !== false) {
            lastResult = await currentStepResult;
          } else {
            lastResult = currentStepResult;
          }
        } catch (error) {
          console.error(`BaseModel.applyFlow: Error executing step '${stepKey}' in flow '${flowKey}':`, error);
          return Promise.reject(error);
        }
      }
    }
    return Promise.resolve(lastResult);
  }

  dispatchEvent(eventName: string, context?: FlowUserContext): void {
    const currentFlowEngine = this.flowEngine;
    if (!currentFlowEngine || !this.app) {
      console.warn('FlowEngine or Application not available on this model for dispatchEvent. Check model.app and model.app.flowEngine setup.');
      return;
    }
    
    // 获取所有流程
    const constructor = this.constructor as typeof FlowModel;
    const allFlows = constructor.getFlows();

    const baseContextForFlow: Omit<FlowContext, '$exit'> = {
        engine: currentFlowEngine,
        app: this.app,
        event: { name: eventName, modelUid: this.uid },
        ...(context || {}),
    };

    allFlows.forEach((flow) => {
      if (flow.on && flow.on.eventName === eventName) {
        console.log(`BaseModel '${this.uid}' dispatching event '${eventName}' to flow '${flow.key}'.`);
        this.applyFlow(flow.key, baseContextForFlow as any).catch(error => {
          console.error(`BaseModel.dispatchEvent: Error executing event-triggered flow '${flow.key}' for event '${eventName}':`, error);
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
  public static extends<T extends typeof FlowModel>(
    this: T, 
    flows: ExtendedFlowDefinition[] = []
  ): T {
    class CustomFlowModel extends (this as unknown as typeof FlowModel) {
      static name = `CustomFlowModel_${uid()}`;
    }

    // 处理流程注册和覆盖
    if (flows.length > 0) {
      flows.forEach(flowDefinition => {
        const allFlows = this.getFlows();
        // 如果标记为部分覆盖，则尝试获取并合并父类流程
        if (flowDefinition.patch === true) {
          // 获取原始流程定义，使用getFlows方法获取所有流程（包括从父类继承的）
          const originalFlow = allFlows.get(flowDefinition.key);
          
          if (originalFlow) {
            const mergedFlow = mergeFlowDefinitions(originalFlow, flowDefinition);
            
            // 注册合并后的流程
            CustomFlowModel.registerFlow(mergedFlow);
          } else {
            console.warn(`FlowModel.extends: Cannot patch flow '${flowDefinition.key}' as it does not exist in parent class. Registering as new flow.`);
            // 移除patch标记，作为新流程注册
            const { patch, ...newFlowDef } = flowDefinition;
            CustomFlowModel.registerFlow(newFlowDef as FlowDefinition);
          }
        } else {
          // 完全覆盖或新增流程
          CustomFlowModel.registerFlow(flowDefinition as FlowDefinition);
        }
      });
    }
    
    return CustomFlowModel as unknown as T;
  }

  /**
   * 获取所有默认流程定义并按 sort 排序
   * @returns {FlowDefinition[]} 按 sort 排序的默认流程定义数组
   */
  public getDefaultFlows(): FlowDefinition[] {
    const constructor = this.constructor as typeof FlowModel;
    const allFlows = constructor.getFlows();

    // 过滤出默认流程并按 sort 排序
    const defaultFlows = Array.from(allFlows.values())
      .filter(flow => flow.default === true)
      .sort((a, b) => (a.sort || 0) - (b.sort || 0));

    return defaultFlows;
  }

  /**
   * 执行所有默认流程
   * @param {FlowUserContext} [context] 可选的用户上下文
   * @returns {Promise<any[]>} 所有默认流程的执行结果数组
   */
  async applyDefaultFlows(context?: FlowUserContext): Promise<any[]> {
    const defaultFlows = this.getDefaultFlows();
    
    if (defaultFlows.length === 0) {
      console.warn(`FlowModel: No default flows found for model '${this.uid}'`);
      return [];
    }

    const results: any[] = [];
    for (const flow of defaultFlows) {
      try {
        const result = await this.applyFlow(flow.key, context);
        results.push(result);
      } catch (error) {
        console.error(`FlowModel.applyDefaultFlows: Error executing default flow '${flow.key}':`, error);
        throw error;
      }
    }
    
    return results;
  }
}
