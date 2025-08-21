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
import pino from 'pino';
import { FlowEngineContext } from './flowContext';
import { FlowSettings } from './flowSettings';
import { ErrorFlowModel, FlowModel } from './models';
import { ReactView } from './ReactView';
import type {
  ActionDefinition,
  ApplyFlowCacheEntry,
  CreateModelOptions,
  FlowModelOptions,
  IFlowModelRepository,
  ModelConstructor,
} from './types';
import { isInheritedFrom } from './utils';

/**
 * FlowEngine is the core class of the flow engine, responsible for managing flow models, actions, model repository, and more.
 * It provides capabilities for registering, creating, finding, persisting, replacing, and moving models.
 * Supports flow definitions, action definitions, model class inheritance and filtering.
 * Integrates FlowEngineContext, FlowSettings, and ReactView for context, configuration, and view rendering.
 *
 * Main features:
 * - Register, get, and find model classes and model instances
 * - Register and get action definitions
 * - Persist and query models via the model repository
 * - Register flow definitions
 * - Create, find, replace, move, and destroy model instances
 * - Support for model class inheritance and filtering
 * - Internationalization support
 * - Integration with React view rendering
 *
 * @example
 * const engine = new FlowEngine();
 * engine.registerModels({ MyModel });
 * engine.setModelRepository(new MyRepository());
 * const model = engine.createModel({ use: 'MyModel', uid: 'xxx' });
 */
export class FlowEngine {
  /**
   * Registered action definitions.
   * Key is the action name, value is ActionDefinition.
   * @private
   */
  #actions: Map<string, ActionDefinition> = new Map();

  /**
   * Registered model classes.
   * Key is the model class name, value is the model class constructor.
   * @private
   */
  #modelClasses: Map<string, ModelConstructor> = observable.shallow(new Map());

  /**
   * Created model instances.
   * Key is the model instance UID, value is the model instance object.
   * @private
   */
  #modelInstances: Map<string, any> = new Map();

  /**
   * The current model repository instance, implements IFlowModelRepository.
   * Used for model persistence and queries.
   * @private
   */
  #modelRepository: IFlowModelRepository | null = null;

  /**
   * Flow application cache.
   * Key is the cache key, value is ApplyFlowCacheEntry.
   * @private
   */
  #applyFlowCache = new Map<string, ApplyFlowCacheEntry>();

  /**
   * Flow engine context object.
   * @private
   */
  #flowContext: FlowEngineContext;

  logger: pino.Logger;

  /**
   * Flow settings, including components and form scopes.
   * @public
   */
  public flowSettings: FlowSettings = new FlowSettings();

  /**
   * Experimental API: Integrates React view rendering capability into FlowEngine.
   * This property may change or be removed in the future. Use with caution.
   * @experimental
   * @public
   */
  public reactView: ReactView;

  /**
   * Constructor. Initializes React view, registers default model and form scopes.
   */
  constructor() {
    this.reactView = new ReactView(this);
    this.flowSettings.registerScopes({ t: this.translate.bind(this) });
    this.registerModels({ FlowModel });
    this.logger = pino({
      level: 'trace',
      browser: {
        write: {
          fatal: (o) => console.trace(o),
          error: (o) => console.error(o),
          warn: (o) => console.warn(o),
          info: (o) => console.info(o),
          debug: (o) => console.debug(o),
          trace: (o) => console.trace(o),
        },
      },
    });
  }

  /**
   * Get the flow engine context object.
   * @returns {FlowEngineContext} Flow engine context
   */
  get context() {
    if (!this.#flowContext) {
      this.#flowContext = new FlowEngineContext(this);
    }
    return this.#flowContext;
  }

  /**
   * Get the flow application cache.
   * @returns {Map<string, ApplyFlowCacheEntry>} Flow application cache map
   * @internal
   */
  get applyFlowCache() {
    return this.#applyFlowCache;
  }

  /**
   * Set the model repository for persisting and querying model instances.
   * If a model repository was already set, it will be overwritten and a warning will be printed.
   * @param {IFlowModelRepository} modelRepository The model repository instance implementing IFlowModelRepository.
   * @example
   * flowEngine.setModelRepository(new MyFlowModelRepository());
   */
  setModelRepository(modelRepository: IFlowModelRepository) {
    if (this.#modelRepository) {
      console.warn('FlowEngine: Model repository is already set and will be overwritten.');
    }
    this.#modelRepository = modelRepository;
  }

  get modelRepository(): IFlowModelRepository | null {
    return this.#modelRepository;
  }

  /**
   * Internationalization translation method, calls the context's t method.
   * @param {string} keyOrTemplate Translation key or template string
   * @param {any} [options] Optional parameters
   * @returns {string} Translated string
   */
  translate(keyOrTemplate: string, options?: any): string {
    return this.context.t(keyOrTemplate, options);
  }

  /**
   * Register multiple actions.
   * @param {Record<string, ActionDefinition>} actions Action definition object collection
   */
  registerActions(actions: Record<string, ActionDefinition>): void {
    for (const [, definition] of Object.entries(actions)) {
      this.#registerAction(definition);
    }
  }

  /**
   * Register a single action.
   * @template TModel Specific FlowModel subclass type, defaults to FlowModel.
   * @param {ActionDefinition<TModel>} definition Action definition object, including name and handler.
   * @private
   */
  #registerAction<TModel extends FlowModel = FlowModel>(definition: ActionDefinition<TModel>): void {
    if (!definition.name) {
      throw new Error('FlowEngine: Action must have a name.');
    }
    if (this.#actions.has(definition.name)) {
      throw new Error(`FlowEngine: Action with name '${definition.name}' is already registered.`);
    }
    this.#actions.set(definition.name, definition as ActionDefinition);
  }

  /**
   * Get a registered action definition.
   * @template TModel Specific FlowModel subclass type
   * @param {string} name Action name
   * @returns {ActionDefinition<TModel> | undefined} Action definition, or undefined if not found
   */
  public getAction<TModel extends FlowModel = FlowModel>(name: string): ActionDefinition<TModel> | undefined {
    return this.#actions.get(name) as ActionDefinition<TModel> | undefined;
  }

  /**
   * Register a single model class.
   * @param {string} name Model class name
   * @param {ModelConstructor} modelClass Model class constructor
   * @private
   */
  #registerModel(name: string, modelClass: ModelConstructor): void {
    if (this.#modelClasses.has(name)) {
      console.warn(`FlowEngine: Model class with name '${name}' is already registered and will be overwritten.`);
    }
    Object.defineProperty(modelClass, 'name', { value: name });
    this.#modelClasses.set(name, modelClass);
  }

  /**
   * Register multiple model classes.
   * @param {Record<string, ModelConstructor>} models Model class map, key is model name, value is model constructor
   * @returns {void}
   * @example
   * flowEngine.registerModels({ UserModel, OrderModel });
   */
  public registerModels(models: Record<string, ModelConstructor | typeof FlowModel<any>>) {
    for (const [name, modelClass] of Object.entries(models)) {
      this.#registerModel(name, modelClass);
    }
  }

  /**
   * Get all registered model classes.
   * @returns {Map<string, ModelConstructor>} Model class map
   */
  getModelClasses() {
    return this.#modelClasses;
  }

  /**
   * Get a registered model class (constructor).
   * @param {string} name Model class name
   * @returns {ModelConstructor | undefined} Model constructor, or undefined if not found
   */
  public getModelClass(name: string): ModelConstructor | undefined {
    return this.#modelClasses.get(name);
  }

  /**
   * Find a registered model class by predicate.
   * @param predicate Callback function, arguments are (name, ModelClass), returns true if matched
   * @returns {[string, ModelConstructor] | undefined} Matched model class and name
   */
  public findModelClass(
    predicate: (name: string, ModelClass: ModelConstructor) => boolean,
  ): [string, ModelConstructor] | undefined {
    for (const [name, ModelClass] of this.#modelClasses) {
      if (predicate(name, ModelClass)) {
        return [name, ModelClass];
      }
    }
    return undefined;
  }

  /**
   * Filter model classes by base class (supports multi-level inheritance), with optional custom filter.
   * @param {string | ModelConstructor} baseClass Base class name or constructor
   * @param {(ModelClass: ModelConstructor, className: string) => boolean} [filter] Optional filter function
   * @returns {Map<string, ModelConstructor>} Model classes inherited from base class and passed the filter
   */
  public getSubclassesOf(
    baseClass: string | ModelConstructor,
    filter?: (ModelClass: ModelConstructor, className: string) => boolean,
  ): Map<string, ModelConstructor> {
    const parentModelClass = typeof baseClass === 'string' ? this.getModelClass(baseClass) : baseClass;
    const result = new Map<string, ModelConstructor>();
    if (!parentModelClass) return result;
    for (const [className, ModelClass] of this.#modelClasses) {
      if (isInheritedFrom(ModelClass, parentModelClass)) {
        if (!filter || filter(ModelClass, className)) {
          result.set(className, ModelClass);
        }
      }
    }
    return result;
  }

  /**
   * Create and register a model instance.
   * If an instance with the same UID exists, returns the existing instance.
   * @template T FlowModel subclass type, defaults to FlowModel.
   * @param {CreateModelOptions} options Model creation options
   * @returns {T} Created model instance
   */
  public createModel<T extends FlowModel = FlowModel>(options: CreateModelOptions): T {
    const { parentId, uid, use: modelClassName, subModels } = options;
    const ModelClass = typeof modelClassName === 'string' ? this.getModelClass(modelClassName) : modelClassName;

    if (uid && this.#modelInstances.has(uid)) {
      return this.#modelInstances.get(uid) as T;
    }

    let modelInstance;

    if (!ModelClass) {
      modelInstance = new ErrorFlowModel({ ...options, flowEngine: this } as any);
      modelInstance.setErrorMessage(`Model class '${modelClassName}' not found. Please register it first.`);
    } else {
      modelInstance = new (ModelClass as ModelConstructor<T>)({ ...options, flowEngine: this } as any);
    }

    modelInstance.onInit(options);

    if (parentId && this.#modelInstances.has(parentId)) {
      modelInstance.setParent(this.#modelInstances.get(parentId));
    }

    this.#modelInstances.set(modelInstance.uid, modelInstance);

    return modelInstance;
  }

  /**
   * Get a model instance by UID.
   * @template T FlowModel subclass type, defaults to FlowModel.
   * @param {string} uid Model instance UID
   * @returns {T | undefined} Model instance, or undefined if not found
   */
  public getModel<T extends FlowModel = FlowModel>(uid: string): T | undefined {
    return this.#modelInstances.get(uid) as T | undefined;
  }

  /**
   * Iterate all registered model instances.
   * @template T FlowModel subclass type, defaults to FlowModel.
   * @param {(model: T) => void} callback Callback function
   */
  forEachModel<T extends FlowModel = FlowModel>(callback: (model: T) => void): void {
    this.#modelInstances.forEach(callback);
  }

  /**
   * Remove a local model instance.
   * @param {string} uid UID of the model instance to destroy
   * @returns {boolean} Returns true if successfully destroyed, false otherwise (e.g. instance does not exist)
   */
  public removeModel(uid: string): boolean {
    if (!this.#modelInstances.has(uid)) {
      console.warn(`FlowEngine: Model with UID '${uid}' does not exist.`);
      return false;
    }
    const modelInstance = this.#modelInstances.get(uid) as FlowModel;
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
    this.#modelInstances.delete(uid);
    return true;
  }

  /**
   * Check if the model repository is set.
   * @returns {boolean} Returns true if set, false otherwise.
   * @private
   */
  private ensureModelRepository(): boolean {
    if (!this.#modelRepository) {
      // 不抛错，直接返回 false
      return false;
    }
    return true;
  }

  /**
   * Load a model instance (prefers local, falls back to repository).
   * @template T FlowModel subclass type, defaults to FlowModel.
   * @param {any} options Load options
   * @returns {Promise<T | null>} Loaded model instance or null
   */
  async loadModel<T extends FlowModel = FlowModel>(options): Promise<T | null> {
    if (!this.ensureModelRepository()) return;
    const model = this.findModelByParentId(options.parentId, options.subKey);
    if (model) {
      return model as T;
    }
    const data = await this.#modelRepository.findOne(options);
    return data?.uid ? this.createModel<T>(data as any) : null;
  }

  /**
   * Find a sub-model by parent model ID and subKey.
   * @template T FlowModel subclass type, defaults to FlowModel.
   * @param {string} parentId Parent model UID
   * @param {string} subKey Sub-model key
   * @returns {T | null} Found sub-model or null
   */
  findModelByParentId<T extends FlowModel = FlowModel>(parentId: string, subKey: string): T | null {
    if (parentId && this.#modelInstances.has(parentId)) {
      const parentModel = this.#modelInstances.get(parentId) as FlowModel;
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

  /**
   * Load or create a model instance.
   * @template T FlowModel subclass type, defaults to FlowModel.
   * @param {any} options Load or create options
   * @returns {Promise<T | null>} Model instance or null
   */
  async loadOrCreateModel<T extends FlowModel = FlowModel>(options): Promise<T | null> {
    if (!this.ensureModelRepository()) return;
    const { uid, parentId, subKey } = options;
    if (uid && this.#modelInstances.has(uid)) {
      return this.#modelInstances.get(uid) as T;
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

  /**
   * Persist and save a model instance.
   * @template T FlowModel subclass type, defaults to FlowModel.
   * @param {T} model Model instance to save
   * @returns {Promise<any>} Repository save result
   */
  async saveModel<T extends FlowModel = FlowModel>(model: T, options?: { onlyStepParams?: boolean }): Promise<any> {
    if (!this.ensureModelRepository()) return;
    return await this.#modelRepository.save(model, options);
  }

  /**
   * Destroy a model instance (persistently delete and remove local instance).
   * @param {string} uid UID of the model to destroy
   * @returns {Promise<boolean>} Whether destroyed successfully
   */
  async destroyModel(uid: string) {
    if (this.ensureModelRepository()) {
      await this.#modelRepository.destroy(uid);
    }
    return this.removeModel(uid);
  }

  /**
   * Replace a model instance with a new instance of a class.
   * @template T New model type
   * @param {string} uid UID of the model to replace
   * @param {Partial<FlowModelOptions> | ((oldModel: FlowModel) => Partial<FlowModelOptions>)} [optionsOrFn]
   *        Options for creating the new model, supports two forms:
   *        1. Pass options directly
   *        2. Pass a function that receives current options and returns new options
   * @returns {Promise<T | null>} Newly created model instance
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
      userOptions = optionsOrFn(oldModel as any);
    } else {
      // 对象模式：直接使用提供的options替换
      userOptions = optionsOrFn || {};
    }

    // 3. 合并用户选项和关键属性
    const newOptions = {
      ..._.omit(currentOptions, ['subModels']),
      ...userOptions,
    } as CreateModelOptions;

    // 暂停父模型的事件触发,
    // TODO: find a better way to do this
    if (currentParent) {
      currentParent.emitter.setPaused(true);
    }

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
      currentParent.emitter.setPaused(false);
      currentParent.parent.invalidateAutoFlowCache(true);
      currentParent.parent?.rerender();
      currentParent.emitter.emit('onSubModelReplaced', { oldModel, newModel });
    }
    await newModel.save();
    return newModel;
  }

  /**
   * Move a model instance within its parent model.
   * @param {any} sourceId Source model UID
   * @param {any} targetId Target model UID
   * @returns {Promise<void>} No return value
   */
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
   * Filter model classes by parent class (supports multi-level inheritance).
   * @param {string | ModelConstructor} parentClass Parent class name or constructor
   * @returns {Map<string, ModelConstructor>} Model classes inherited from the specified parent class
   */
  public filterModelClassByParent(parentClass: string | ModelConstructor) {
    const parentModelClass = typeof parentClass === 'string' ? this.getModelClass(parentClass) : parentClass;
    if (!parentModelClass) {
      return new Map();
    }
    const modelClasses = new Map<string, ModelConstructor>();
    for (const [className, ModelClass] of this.#modelClasses) {
      if (isInheritedFrom(ModelClass, parentModelClass)) {
        modelClasses.set(className, ModelClass);
      }
    }
    return modelClasses;
  }

  /**
   * Generate a unique key for the flow application cache.
   * @param {string} prefix Prefix
   * @param {string} flowKey Flow key
   * @param {string} modelUid Model UID
   * @returns {string} Unique cache key
   * @internal
   */
  static generateApplyFlowCacheKey(prefix: string, flowKey: string, modelUid: string): string {
    return `${prefix}:${flowKey}:${modelUid}`;
  }
}
