import {
  ActionDefinition,
  FlowDefinition,
  ModelConstructor,
  ActionOptions
} from './types';
import { Application } from '../application';
import { FlowModel } from '@nocobase/client';

// 导入hooks和HOC
import { useContext } from './hooks/useContext';
import { useFlowModel } from './hooks/useFlowMode';
import { useApplyFlow, useApplyDefaultFlows } from './hooks/useApplyFlow'; 
import { useDispatchEvent } from './hooks/useDispatchEvent';
import { withFlowModel } from './withFlowModel';

/**
 * FlowEngine 类负责管理流程（Flows）、动作（Actions）和模型（Models）。
 * 它提供了注册、获取和执行这些核心概念的方法，并集成了 React Hooks 和 HOC 以便在 UI 中使用。
 */
export class FlowEngine {
  /**
   * @static
   * @function useContext
   * @description 通过 hook 获取 FlowEngine 上下文。
   * @returns {any} FlowEngine 上下文实例。
   */
  public static useContext = useContext;
  /**
   * @static
   * @function useFlowModel
   * @description 通过 hook 和 UID 获取模型实例。
   * @param {string} id 模型实例的 UID。
   * @param {string} modelClassName 模型类名。
   * @param {Record<string, any>} [stepsParams] 步骤参数。
   * @returns {FlowModel} 模型实例。
   */
  public static useFlowModel = useFlowModel;
  /**
   * @static
   * @function useApplyFlow
   * @description 通过 hook 触发一个流程的执行。
   * @param {string} flowKey 要执行的流程的 Key。
   * @param {FlowModel} model 当前的模型实例。
   * @param {any} [ctx] 可选的上下文对象。
   * @returns {void}
   */
  public static useApplyFlow = useApplyFlow;
  /**
   * @static
   * @function useApplyDefaultFlows
   * @description 通过 hook 触发所有默认流程的执行。
   * @param {FlowModel} model 当前的模型实例。
   * @param {any} [ctx] 可选的上下文对象。
   * @returns {any[]} 所有默认流程的执行结果数组。
   */
  public static useApplyDefaultFlows = useApplyDefaultFlows;
  /**
   * @static
   * @function useDispatchEvent
   * @description 通过 hook 派发一个事件。
   * @param {string} eventName 事件名称。
   * @param {FlowModel} model 当前的模型实例。
   * @param {any} [ctx] 可选的上下文对象。
   * @returns {void}
   */
  public static useDispatchEvent = useDispatchEvent;
  /**
   * @static
   * @function withFlowModel
   * @description 一个高阶组件 (HOC)，用于将组件与 FlowModel 关联起来，并可选择是否执行默认流程。
   * @template P 组件的 props 类型。
   * @param {React.ComponentType<P>} Component 要包装的 React 组件。
   * @param {object} [options] 配置选项。
   * @param {boolean} [options.applyDefaultFlows=true] 是否执行默认流程，默认为 true。
   * @returns {React.ComponentType<P & { model: FlowModel }>} 包装后的组件，增加了 model prop。
   */
  public static withFlowModel = withFlowModel;

  /** @private Stores registered action definitions. */
  private actions: Map<string, ActionDefinition> = new Map();
  /** @private Stores registered model constructors. */
  private modelClasses: Map<string, ModelConstructor> = new Map();
  /** @private Stores created model instances. */
  private modelInstances: Map<string, any> = new Map();

  /**
   * 注册一个 Action。支持泛型以确保正确的模型类型推导。
   * Action 是流程中的可复用操作单元。
   * @template TModel 具体的FlowModel子类类型
   * @param {string | ActionDefinition<TModel>} nameOrDefinition Action 名称或 ActionDefinition 对象。
   *        如果为字符串，则为 Action 名称，需要配合 options 参数。
   *        如果为对象，则为完整的 ActionDefinition。
   * @param {ActionOptions<TModel>} [options] 当第一个参数为 Action 名称时，此参数为 Action 的选项。
   * @returns {void}
   * @example
   * // 方式一: 传入名称和选项
   * flowEngine.registerAction<MyModel>('myAction', { handler: async (ctx, model, params) => { ... } });
   * // 方式二: 传入 ActionDefinition 对象
   * flowEngine.registerAction<MyModel>({ name: 'myAction', handler: async (ctx, model, params) => { ... } });
   */
  public registerAction<TModel extends FlowModel = FlowModel>(
    nameOrDefinition: string | ActionDefinition<TModel>, 
    options?: ActionOptions<TModel>
  ): void {
    let definition: ActionDefinition<TModel>;
    
    if (typeof nameOrDefinition === 'string' && options) {
      definition = {
        ...options,
        name: nameOrDefinition,
      };
    } else if (typeof nameOrDefinition === 'object') {
      definition = nameOrDefinition as ActionDefinition<TModel>;
    } else {
      throw new Error('Invalid arguments for registerAction');
    }
    
    if (this.actions.has(definition.name)) {
      console.warn(`FlowEngine: Action with name '${definition.name}' is already registered and will be overwritten.`);
    }
    this.actions.set(definition.name, definition as ActionDefinition);
  }

  /**
   * 获取已注册的 Action 定义。
   * @template TModel 具体的FlowModel子类类型
   * @param {string} name Action 名称。
   * @returns {ActionDefinition<TModel> | undefined} Action 定义，如果未找到则返回 undefined。
   */
  public getAction<TModel extends FlowModel = FlowModel>(name: string): ActionDefinition<TModel> | undefined {
    return this.actions.get(name) as ActionDefinition<TModel> | undefined;
  }

  /**
   * 注册一个 Model 类。
   * Model 类用于创建和管理流程中的数据状态。
   * @param {string} name Model 类名称。
   * @param {ModelConstructor} modelClass Model 构造函数。
   * @returns {void}
   * @example
   * class MyModel extends FlowModel {}
   * flowEngine.registerModelClass('MyModel', MyModel);
   */
  public registerModelClass(name: string, modelClass: ModelConstructor): void {
    if (this.modelClasses.has(name)) {
      console.warn(`FlowEngine: Model class with name '${name}' is already registered and will be overwritten.`);
    }
    this.modelClasses.set(name, modelClass);
  }

  /**
   * 获取已注册的 Model 类 (构造函数)。
   * @param {string} name Model 类名称。
   * @returns {ModelConstructor | undefined} Model 构造函数，如果未找到则返回 undefined。
   */
  public getModelClass(name: string): ModelConstructor | undefined {
    return this.modelClasses.get(name);
  }

  /**
   * 创建并注册一个 Model 实例。
   * 如果具有相同 UID 的实例已存在，则返回现有实例。
   * @template T FlowModel 的子类型，默认为 FlowModel。
   * @param {string} uid Model 实例的唯一标识符。
   * @param {string} modelClassName 要创建实例的 Model 类的名称 (已通过 registerModelClass 注册)。
   * @param {Application} app Application 实例。
   * @returns {T} 创建的 Model 实例。
   */
  public createModel<T extends FlowModel = FlowModel>(
    uid: string,
    modelClassName: string,
    app: Application,
    stepsParams?: Record<string, any>,
  ): T {
    const ModelClass = (this.getModelClass(modelClassName) || FlowModel) as ModelConstructor<T>;
    if (this.modelInstances.has(uid)) {
      console.warn(`FlowEngine: Model instance with UID '${uid}' already exists. Returning existing instance.`);
      return this.modelInstances.get(uid) as T;
    }
    const modelInstance = new ModelClass(uid, app, stepsParams);
    this.modelInstances.set(uid, modelInstance);
    return modelInstance;
  }

  /**
   * 根据 UID 获取 Model 实例。
   * @template T FlowModel 的子类型，默认为 FlowModel。
   * @param {string} uid Model 实例的唯一标识符。
   * @returns {T | undefined} Model 实例，如果未找到则返回 undefined。
   */
  public getModel<T extends FlowModel = FlowModel>(uid: string): T | undefined {
    return this.modelInstances.get(uid) as T | undefined;
  }

  /**
   * 销毁并移除一个 Model 实例。
   * @param {string} uid 要销毁的 Model 实例的唯一标识符。
   * @returns {boolean} 如果成功销毁则返回 true，否则返回 false (例如，实例不存在)。
   */
  public destroyModel(uid: string): boolean {
    if (this.modelInstances.has(uid)) {
        return this.modelInstances.delete(uid);
    }
    return false;
  }
  
  /**
   * 注册一个流程 (Flow)。支持泛型以确保正确的模型类型推导。
   * 流程是一系列步骤的定义，可以由事件触发或手动应用。
   * @template TModel 具体的FlowModel子类类型
   * @param {string} modelClassName 模型类名称。
   * @param {FlowDefinition<TModel>} flowDefinition 流程定义。
   * @returns {void}
   */
  public registerFlow<TModel extends FlowModel = FlowModel>(
    modelClassName: string, 
    flowDefinition: FlowDefinition<TModel>
  ): void {
    const ModelClass = this.getModelClass(modelClassName);
    
    // 检查ModelClass是否存在
    if (!ModelClass) {
      console.warn(`FlowEngine: Model class '${modelClassName}' not found. Flow '${flowDefinition.key}' will not be registered.`);
      return;
    }
    
    if (typeof (ModelClass as any).registerFlow !== 'function') {
      console.warn(`FlowEngine: Model class '${modelClassName}' does not have a static registerFlow method. Flow '${flowDefinition.key}' will not be registered.`);
      return;
    }
    
    (ModelClass as any).registerFlow(flowDefinition);
  }
} 