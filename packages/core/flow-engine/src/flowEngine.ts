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
import { FlowEngineContext } from './flowContext';
import { FlowSettings } from './flowSettings';
import { ErrorFlowModel, FlowModel } from './models';
import { ReactView } from './ReactView';
import {
  ActionDefinition,
  ActionOptions,
  CreateModelOptions,
  FlowDefinition,
  FlowModelOptions,
  IFlowModelRepository,
  ModelConstructor,
} from './types';
import { isInheritedFrom } from './utils';

interface ApplyFlowCacheEntry {
  status: 'pending' | 'resolved' | 'rejected';
  promise: Promise<any>;
  data?: any;
  error?: any;
}

export class FlowEngine {
  /** @private Stores registered action definitions. */
  private actions: Map<string, ActionDefinition> = new Map();
  /** @private Stores registered model constructors. */
  private modelClasses: Map<string, ModelConstructor> = observable.shallow(new Map());
  /** @private Stores created model instances. */
  private modelInstances: Map<string, any> = new Map();
  #modelRepository: IFlowModelRepository | null = null;
  #applyFlowCache = new Map<string, ApplyFlowCacheEntry>();
  #flowContext: FlowEngineContext;

  /** @public Stores flow settings including components and scopes for formily settings. */
  public flowSettings: FlowSettings = new FlowSettings();

  /**
   * 实验性 API：用于在 FlowEngine 中集成 React 视图渲染能力。
   * 该属性未来可能发生重大变更或被移除，请谨慎依赖。
   * @experimental
   */
  public reactView: ReactView;

  constructor() {
    this.reactView = new ReactView(this);
    this.flowSettings.registerScopes({ t: this.translate.bind(this) });
    this.registerModels({ FlowModel });
  }

  get context() {
    if (!this.#flowContext) {
      this.#flowContext = new FlowEngineContext(this);
    }
    return this.#flowContext;
  }

  get applyFlowCache() {
    return this.#applyFlowCache;
  }

  /**
   * 设置模型仓库，用于持久化和查询模型实例。
   * 如果之前已设置过模型仓库，将会覆盖原有设置，并输出警告。
   *
   * @param modelRepository 要设置的模型仓库实例，实现 IFlowModelRepository 接口。
   * @example
   * flowEngine.setModelRepository(new MyFlowModelRepository());
   */
  setModelRepository(modelRepository: IFlowModelRepository) {
    if (this.#modelRepository) {
      console.warn('FlowEngine: Model repository is already set and will be overwritten.');
    }
    this.#modelRepository = modelRepository;
  }

  translate(keyOrTemplate: string, options?: any): string {
    return this.context.t(keyOrTemplate, options);
  }

  registerActions(actions: Record<string, ActionDefinition>): void {
    for (const [, definition] of Object.entries(actions)) {
      this.#registerAction(definition);
    }
  }

  /**
   * 注册一个 Action 定义。
   * @template TModel 具体的FlowModel子类类型，默认为 FlowModel。
   * @param {ActionDefinition<TModel>} definition Action 定义对象，包含名称、处理函数等。
   */
  #registerAction<TModel extends FlowModel = FlowModel>(definition: ActionDefinition<TModel>): void {
    if (!definition.name) {
      throw new Error('FlowEngine: Action must have a name.');
    }
    if (this.actions.has(definition.name)) {
      throw new Error(`FlowEngine: Action with name '${definition.name}' is already registered.`);
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

  #registerModel(name: string, modelClass: ModelConstructor): void {
    if (this.modelClasses.has(name)) {
      console.warn(`FlowEngine: Model class with name '${name}' is already registered and will be overwritten.`);
    }
    this.modelClasses.set(name, modelClass);
  }

  /**
   * 注册 Model 类。
   * @param {Record<string, ModelConstructor>} models 要注册的 Model 类映射表，键为 Model 名称，值为 Model 构造函数。
   * @returns {void}
   * @example
   * flowEngine.registerModels({
   *   UserModel,
   *   OrderModel,
   *   ProductModel
   * });
   */
  public registerModels(models: Record<string, ModelConstructor | typeof FlowModel<any>>) {
    for (const [name, modelClass] of Object.entries(models)) {
      this.#registerModel(name, modelClass);
    }
  }

  getModelClasses() {
    return this.modelClasses;
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
   * 根据条件查找已注册的 Model 类。
   * @param predicate 回调函数，参数为 (name, ModelClass)，返回 true 时即为命中。
   * @returns [name, ModelConstructor] | undefined
   */
  public findModelClass(
    predicate: (name: string, ModelClass: ModelConstructor) => boolean,
  ): [string, ModelConstructor] | undefined {
    for (const [name, ModelClass] of this.modelClasses) {
      if (predicate(name, ModelClass)) {
        return [name, ModelClass];
      }
    }
    return undefined;
  }

  /**
   * 根据父类过滤模型类（支持多层继承），可选自定义过滤器
   * @param {string | ModelConstructor} baseClass 父类名称或构造函数
   * @param {(ModelClass: ModelConstructor, className: string) => boolean} [filter] 过滤函数
   * @returns {Map<string, ModelConstructor>} 继承自指定父类且通过过滤的模型类映射
   */
  public getSubclassesOf(
    baseClass: string | ModelConstructor,
    filter?: (ModelClass: ModelConstructor, className: string) => boolean,
  ): Map<string, ModelConstructor> {
    const parentModelClass = typeof baseClass === 'string' ? this.getModelClass(baseClass) : baseClass;
    const result = new Map<string, ModelConstructor>();
    if (!parentModelClass) return result;
    for (const [className, ModelClass] of this.modelClasses) {
      if (isInheritedFrom(ModelClass, parentModelClass)) {
        if (!filter || filter(ModelClass, className)) {
          result.set(className, ModelClass);
        }
      }
    }
    return result;
  }

  /**
   * 创建并注册一个 Model 实例。
   * 如果具有相同 UID 的实例已存在，则返回现有实例。
   * @template T FlowModel 的子类型，默认为 FlowModel。
   * @param {CreateModelOptions} options 创建模型的选项
   * @returns {T} 创建的 Model 实例。
   */
  public createModel<T extends FlowModel = FlowModel>(options: CreateModelOptions): T {
    const { parentId, uid, use: modelClassName, subModels } = options;
    const ModelClass = typeof modelClassName === 'string' ? this.getModelClass(modelClassName) : modelClassName;

    if (uid && this.modelInstances.has(uid)) {
      return this.modelInstances.get(uid) as T;
    }

    let modelInstance;

    if (!ModelClass) {
      modelInstance = new ErrorFlowModel({ ...options, flowEngine: this } as any);
      modelInstance.setErrorMessage(`Model class '${modelClassName}' not found. Please register it first.`);
    } else {
      modelInstance = new (ModelClass as ModelConstructor<T>)({ ...options, flowEngine: this } as any);
    }

    modelInstance.onInit(options);

    if (parentId && this.modelInstances.has(parentId)) {
      modelInstance.setParent(this.modelInstances.get(parentId));
    }

    this.modelInstances.set(modelInstance.uid, modelInstance);

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

  forEachModel<T extends FlowModel = FlowModel>(callback: (model: T) => void): void {
    this.modelInstances.forEach(callback);
  }

  /**
   * 移除一个本地模型实例。
   * @param {string} uid 要销毁的 Model 实例的唯一标识符。
   * @returns {boolean} 如果成功销毁则返回 true，否则返回 false (例如，实例不存在)。
   */
  public removeModel(uid: string): boolean {
    if (!this.modelInstances.has(uid)) {
      console.warn(`FlowEngine: Model with UID '${uid}' does not exist.`);
      return false;
    }
    const modelInstance = this.modelInstances.get(uid) as FlowModel;
    modelInstance.clearForks();
    // 从父模型中移除当前模型的引用
    if (modelInstance.parent?.subModels) {
      for (const subKey in modelInstance.parent.subModels) {
        const subModelValue = modelInstance.parent.subModels[subKey];

        if (Array.isArray(subModelValue)) {
          const index = subModelValue.findIndex((subModel) => subModel == modelInstance);
          if (index !== -1) {
            subModelValue.splice(index, 1);
            modelInstance.parent.emitter.emit('onSubModelRemoved', modelInstance);
            break;
          }
        } else if (subModelValue && subModelValue === modelInstance) {
          delete modelInstance.parent.subModels[subKey];
          modelInstance.parent.emitter.emit('onSubModelRemoved', modelInstance);
          break;
        }
      }
    }
    this.modelInstances.delete(uid);
    return false;
  }

  private ensureModelRepository(): boolean {
    if (!this.#modelRepository) {
      // 不抛错，直接返回 false
      return false;
    }
    return true;
  }

  async loadModel<T extends FlowModel = FlowModel>(options): Promise<T | null> {
    if (!this.ensureModelRepository()) return;
    const model = this.findModelByParentId(options.parentId, options.subKey);
    if (model) {
      return model as T;
    }
    const data = await this.#modelRepository.findOne(options);
    return data?.uid ? this.createModel<T>(data as any) : null;
  }

  findModelByParentId<T extends FlowModel = FlowModel>(parentId: string, subKey: string): T | null {
    if (parentId && this.modelInstances.has(parentId)) {
      const parentModel = this.modelInstances.get(parentId) as FlowModel;
      if (parentModel && parentModel.subModels[subKey]) {
        const subModels = parentModel.subModels[subKey];
        if (Array.isArray(subModels)) {
          return subModels[0] as T; // 返回第一个子模型
        } else {
          return subModels as T;
        }
      }
    }
  }

  async loadOrCreateModel<T extends FlowModel = FlowModel>(options): Promise<T | null> {
    if (!this.ensureModelRepository()) return;
    const { uid, parentId, subKey } = options;
    if (uid && this.modelInstances.has(uid)) {
      return this.modelInstances.get(uid) as T;
    }
    const m = this.findModelByParentId<T>(parentId, subKey);
    if (m) {
      return m;
    }
    const data = await this.#modelRepository.findOne(options);
    let model: T | null = null;
    if (data?.uid) {
      model = this.createModel<T>(data as any);
    } else {
      model = this.createModel<T>(options);
      await model.save();
    }
    if (model.parent) {
      const subModel = model.parent.findSubModel(model.subKey, (m) => {
        return m.uid === model.uid;
      });
      if (subModel) {
        return model;
      }
      if (model.subKey === 'array') {
        model.parent.addSubModel(model.subKey, model);
      } else {
        model.parent.setSubModel(model.subKey, model);
      }
    }
    return model;
  }

  async saveModel<T extends FlowModel = FlowModel>(model: T) {
    if (!this.ensureModelRepository()) return;
    return await this.#modelRepository.save(model);
  }

  async destroyModel(uid: string) {
    if (this.ensureModelRepository()) {
      await this.#modelRepository.destroy(uid);
    }
    return this.removeModel(uid);
  }

  /**
   * 将指定的模型实例替换为新的类创建的实例
   * @template T 新模型的类型
   * @param {string} uid 要替换的模型的UID
   * @param {Partial<FlowModelOptions> | ((oldModel: FlowModel) => Partial<FlowModelOptions>)} [optionsOrFn]
   *        创建新模型的选项，支持两种形式：
   *        1. 直接传入options
   *        2. 传入函数，接收当前选项作为参数，返回新的options
   * @returns {Promise<T>} 创建的新模型实例
   */
  async replaceModel<T extends FlowModel = FlowModel>(
    uid: string,
    optionsOrFn?: Partial<FlowModelOptions> | ((currentOptions: FlowModelOptions) => Partial<FlowModelOptions>),
  ): Promise<T | null> {
    const oldModel = this.getModel(uid);
    if (!oldModel) {
      console.warn(`FlowEngine: Cannot replace model. Model with UID '${uid}' not found.`);
      return null;
    }

    // 1. 保存当前模型的关键信息
    const currentParent = oldModel.parent;
    const currentSubKey = oldModel.subKey;
    const currentSubType = oldModel.subType;
    const currentOptions = oldModel.serialize();

    // 2. 确定新的选项
    let userOptions: Partial<FlowModelOptions>;

    if (typeof optionsOrFn === 'function') {
      // 函数模式：传入当前options，获取新的options
      userOptions = optionsOrFn(oldModel);
    } else {
      // 对象模式：直接使用提供的options替换
      userOptions = optionsOrFn || {};
    }

    // 3. 合并用户选项和关键属性
    const newOptions = {
      ..._.omit(currentOptions, ['subModels']),
      ...userOptions,
    } as CreateModelOptions;

    // 4. 销毁当前模型（这会处理所有清理工作：持久化删除、内存清理、父模型引用等）
    await oldModel.destroy();

    // 5. 使用createModel创建新的模型实例
    const newModel = this.createModel<T>(newOptions);

    // 6. 如果有父模型，将新模型添加到父模型的subModels中
    if (currentParent && currentSubKey) {
      if (currentSubType === 'array') {
        // 对于数组类型，使用addSubModel方法
        currentParent.addSubModel(currentSubKey, newModel);
      } else {
        // 对于对象类型，使用setSubModel方法
        currentParent.setSubModel(currentSubKey, newModel);
      }
    }

    // 7. 触发事件以通知其他部分模型已替换
    if (currentParent) {
      currentParent.emitter.emit('onSubModelReplaced', { oldModel, newModel });
    }
    await newModel.save();
    return newModel;
  }

  async moveModel(sourceId: any, targetId: any): Promise<void> {
    const sourceModel = this.getModel(sourceId);
    const targetModel = this.getModel(targetId);
    if (!sourceModel || !targetModel) {
      console.warn(`FlowEngine: Cannot move model. Source or target model not found.`);
      return;
    }
    const move = (sourceModel: FlowModel, targetModel: FlowModel) => {
      if (!sourceModel.parent || !targetModel.parent || sourceModel.parent !== targetModel.parent) {
        console.error('FlowModel.moveTo: Both models must have the same parent to perform move operation.');
        return false;
      }

      const subModels = sourceModel.parent.subModels[sourceModel.subKey];

      if (!subModels || !Array.isArray(subModels)) {
        console.error('FlowModel.moveTo: Parent subModels must be an array to perform move operation.');
        return false;
      }

      const findIndex = (model: FlowModel) => subModels.findIndex((item) => item.uid === model.uid);

      const currentIndex = findIndex(sourceModel);
      const targetIndex = findIndex(targetModel);

      if (currentIndex === -1 || targetIndex === -1) {
        console.error('FlowModel.moveTo: Current or target model not found in parent subModels.');
        return false;
      }

      if (currentIndex === targetIndex) {
        console.warn('FlowModel.moveTo: Current model is already at the target position. No action taken.');
        return false;
      }

      // 使用splice直接移动数组元素（O(n)比排序O(n log n)更快）
      const [movedModel] = subModels.splice(currentIndex, 1);
      subModels.splice(targetIndex, 0, movedModel);

      // 重新分配连续的sortIndex
      subModels.forEach((model, index) => {
        model.sortIndex = index;
      });

      return true;
    };
    move(sourceModel, targetModel);
    if (this.ensureModelRepository()) {
      const position = sourceModel.sortIndex - targetModel.sortIndex > 0 ? 'after' : 'before';
      await this.#modelRepository.move(sourceId, targetId, position);
    }
    // 触发事件以通知其他部分模型已移动
    sourceModel.parent.emitter.emit('onSubModelMoved', { source: sourceModel, target: targetModel });
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
    flowDefinition: FlowDefinition<TModel>,
  ): void {
    const ModelClass = this.getModelClass(modelClassName);

    // 检查ModelClass是否存在
    if (!ModelClass) {
      console.warn(
        `FlowEngine: Model class '${modelClassName}' not found. Flow '${flowDefinition.key}' will not be registered.`,
      );
      return;
    }

    if (typeof (ModelClass as any).registerFlow !== 'function') {
      console.warn(
        `FlowEngine: Model class '${modelClassName}' does not have a static registerFlow method. Flow '${flowDefinition.key}' will not be registered.`,
      );
      return;
    }

    (ModelClass as any).registerFlow(flowDefinition);
  }

  /**
   * 根据父类过滤模型类（支持多层继承）
   * @param {string | ModelConstructor} parentClass 父类名称或构造函数
   * @returns {Map<string, ModelConstructor>} 继承自指定父类的模型类映射
   */
  public filterModelClassByParent(parentClass: string | ModelConstructor) {
    const parentModelClass = typeof parentClass === 'string' ? this.getModelClass(parentClass) : parentClass;
    if (!parentModelClass) {
      return new Map();
    }
    const modelClasses = new Map<string, ModelConstructor>();
    for (const [className, ModelClass] of this.modelClasses) {
      if (isInheritedFrom(ModelClass, parentModelClass)) {
        modelClasses.set(className, ModelClass);
      }
    }
    return modelClasses;
  }

  static generateApplyFlowCacheKey(prefix: string, flowKey: string, modelUid: string): string {
    return `${prefix}:${flowKey}:${modelUid}`;
  }
}
