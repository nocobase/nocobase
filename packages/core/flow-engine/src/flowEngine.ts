/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */
import { observable } from '@formily/reactive';
import { FlowSettings } from './flowSettings';
import { FlowModel } from './models';
import { ReactView } from './ReactView';
import {
  ActionDefinition,
  ActionOptions,
  CreateModelOptions,
  FlowDefinition,
  IFlowModelRepository,
  ModelConstructor,
} from './types';
import { isInheritedFrom, TranslationUtil } from './utils';

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
  /** @public Stores flow settings including components and scopes for formily settings. */
  public flowSettings: FlowSettings = new FlowSettings();
  context: Record<string, any> = {};
  private modelRepository: IFlowModelRepository | null = null;
  private _applyFlowCache = new Map<string, ApplyFlowCacheEntry>();
  /** @private Translation utility for template compilation and caching */
  private _translationUtil = new TranslationUtil();

  reactView: ReactView;

  constructor() {
    this.reactView = new ReactView(this);
  }
  // 注册默认的 FlowModel

  setModelRepository(modelRepository: IFlowModelRepository) {
    if (this.modelRepository) {
      console.warn('FlowEngine: Model repository is already set and will be overwritten.');
    }
    this.modelRepository = modelRepository;
  }

  setContext(context: any) {
    this.context = { ...this.context, ...context };
  }

  getContext() {
    return this.context;
  }

  /**
   * 翻译函数，支持简单翻译和模板编译
   * @param keyOrTemplate 翻译键或包含 {{t('key', options)}} 的模板字符串
   * @param options 翻译选项（如命名空间、参数等）
   * @returns 翻译后的文本
   *
   * @example
   * // 简单翻译
   * flowEngine.t('Hello World')
   * flowEngine.t('Hello {name}', { name: 'John' })
   *
   * // 模板编译
   * flowEngine.t("{{t('Hello World')}}")
   * flowEngine.t("{{ t( 'User Name' ) }}")
   * flowEngine.t("{{  t  (  'Email'  ,  { ns: 'fields' }  )  }}")
   * flowEngine.t("前缀 {{ t('User Name') }} 后缀")
   * flowEngine.t("{{t('Hello {name}', {name: 'John'})}}")
   */
  public t(keyOrTemplate: string, options?: any): string {
    return this._translationUtil.translate(
      keyOrTemplate,
      (key: string, opts?: any) => this.translateKey(key, opts),
      options,
    );
  }

  /**
   * 内部翻译方法
   * @private
   */
  private translateKey(key: string, options?: any): string {
    if (this.context?.i18n?.t) {
      return this.context.i18n.t(key, options);
    }
    // 如果没有翻译函数，返回原始键值
    return key;
  }

  get applyFlowCache() {
    return this._applyFlowCache;
  }

  registerActions(actions: Record<string, ActionDefinition>): void {
    for (const [, definition] of Object.entries(actions)) {
      this.registerAction(definition);
    }
  }

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
   * flowEngine.registerAction<MyModel>('myAction', { handler: async (ctx, params) => { ... } });
   * // 方式二: 传入 ActionDefinition 对象
   * flowEngine.registerAction<MyModel>({ name: 'myAction', handler: async (ctx, params) => { ... } });
   */
  public registerAction<TModel extends FlowModel = FlowModel>(
    nameOrDefinition: string | ActionDefinition<TModel>,
    options?: ActionOptions<TModel>,
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

  private registerModel(name: string, modelClass: ModelConstructor): void {
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
   *   'UserModel': UserModel,
   *   'OrderModel': OrderModel,
   *   'ProductModel': ProductModel
   * });
   */
  public registerModels(models: Record<string, ModelConstructor>) {
    for (const [name, modelClass] of Object.entries(models)) {
      this.registerModel(name, modelClass);
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
   * 创建并注册一个 Model 实例。
   * 如果具有相同 UID 的实例已存在，则返回现有实例。
   * @template T FlowModel 的子类型，默认为 FlowModel。
   * @param {CreateModelOptions} options 创建模型的选项
   * @returns {T} 创建的 Model 实例。
   */
  public createModel<T extends FlowModel = FlowModel>(options: CreateModelOptions): T {
    const { parentId, uid, use: modelClassName, subModels } = options;
    const ModelClass = typeof modelClassName === 'string' ? this.getModelClass(modelClassName) : modelClassName;

    if (!ModelClass) {
      throw new Error(`Model class '${modelClassName}' not found. Please register it first.`);
    }

    if (uid && this.modelInstances.has(uid)) {
      return this.modelInstances.get(uid) as T;
    }
    const modelInstance = new (ModelClass as ModelConstructor<T>)({ ...options, flowEngine: this } as any);

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
          const index = subModelValue.indexOf(modelInstance);
          if (index !== -1) {
            subModelValue.splice(index, 1);
            modelInstance.parent.emitter.emit('onSubModelRemoved', modelInstance);
            break;
          }
        } else if (subModelValue === modelInstance) {
          delete modelInstance.parent.subModels[subKey];
          modelInstance.parent.emitter.emit('onSubModelRemoved', modelInstance);
          break;
        }
      }
    }
    modelInstance['onRemove']?.();
    this.modelInstances.delete(uid);
    return false;
  }

  private ensureModelRepository(): boolean {
    if (!this.modelRepository) {
      // 不抛错，直接返回 false
      return false;
    }
    return true;
  }

  async loadModel<T extends FlowModel = FlowModel>(uid: string): Promise<T | null> {
    if (!this.ensureModelRepository()) return;
    const data = await this.modelRepository.findOne({ uid });
    return data?.uid ? this.createModel<T>(data as any) : null;
  }

  async loadOrCreateModel<T extends FlowModel = FlowModel>(options): Promise<T | null> {
    if (!this.ensureModelRepository()) return;
    const data = await this.modelRepository.findOne(options);
    if (data?.uid) {
      return this.createModel<T>(data as any);
    } else {
      const model = this.createModel<T>(options);
      await model.save();
      return model;
    }
  }

  async saveModel<T extends FlowModel = FlowModel>(model: T) {
    if (!this.ensureModelRepository()) return;
    return await this.modelRepository.save(model);
  }

  async destroyModel(uid: string) {
    if (this.ensureModelRepository()) {
      await this.modelRepository.destroy(uid);
    }
    return this.removeModel(uid);
  }

  async moveModel(sourceId: string, targetId: string): Promise<void> {
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
      const position = sourceModel.sortIndex - targetModel.sortIndex > 0 ? 'before' : 'after';
      await this.modelRepository.move(sourceId, targetId, position);
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
