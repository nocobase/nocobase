/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { ISchema } from '@formily/json-schema';
import { Schema } from '@formily/json-schema';
import { TFuncKey, TOptions } from 'i18next';
import _ from 'lodash';
import type { FlowModel } from './models';
import { ActionDefinition, DeepPartial, FlowContext, FlowDefinition, ModelConstructor, ParamsContext } from './types';
import { Collection, DataSource, DataSourceManager } from './data-source';

// Flow Engine 命名空间常量
export const FLOW_ENGINE_NAMESPACE = 'flow-engine';

/**
 * 获取带有 flow-engine 命名空间的翻译函数
 * @param model FlowModel 实例
 * @returns 翻译函数，自动使用 flow-engine 命名空间
 */
export function getT(model: FlowModel): (key: string, options?: any) => string {
  if (model.flowEngine?.translate) {
    return (key: string, options?: any) => {
      // 自动添加 flow-engine 命名空间
      return model.flowEngine.translate(key, { ns: [FLOW_ENGINE_NAMESPACE, 'client'], nsMode: 'fallback', ...options });
    };
  }
  // 回退到原始键值
  return (key: string) => key;
}

export function generateUid(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * 合并两个流程定义
 * 用于处理流程的部分覆盖（patch）场景
 *
 * @param originalFlow 原始流程定义
 * @param patchFlow 覆盖流程定义
 * @returns 合并后的流程定义
 */
export function mergeFlowDefinitions(
  originalFlow: FlowDefinition,
  patchFlow: DeepPartial<FlowDefinition>,
): FlowDefinition {
  // 创建新的流程定义，合并原始流程和覆盖配置
  const flow = _.cloneDeep(originalFlow);
  const mergedFlow = {
    ...flow,
    title: patchFlow.title ?? flow.title,
    ...(patchFlow.on && { on: patchFlow.on as { eventName: string } }),
    ...flow.steps,
  } as FlowDefinition;

  // 覆盖特定步骤
  if (patchFlow.steps) {
    Object.entries(patchFlow.steps).forEach(([stepKey, stepDefinition]) => {
      mergedFlow.steps[stepKey] = _.merge(flow.steps[stepKey], stepDefinition);
    });
  }

  return mergedFlow;
}

/**
 * 检查一个类是否继承自指定的父类（支持多层继承）
 * @param {ModelConstructor} childClass 要检查的子类
 * @param {ModelConstructor} parentClass 父类
 * @returns {boolean} 如果子类继承自父类则返回 true
 */
export function isInheritedFrom(childClass: ModelConstructor, parentClass: ModelConstructor): boolean {
  // 如果是同一个类，返回 false（不包括自身）
  if (childClass === parentClass) {
    return false;
  }

  // 检查直接继承
  if (childClass.prototype instanceof parentClass) {
    return true;
  }

  // 递归检查原型链
  let currentProto = Object.getPrototypeOf(childClass.prototype);
  while (currentProto && currentProto !== Object.prototype) {
    if (currentProto.constructor === parentClass) {
      return true;
    }
    currentProto = Object.getPrototypeOf(currentProto);
  }

  return false;
}

/**
 * 解析 defaultParams，支持静态值和函数形式
 * 函数可以接收 ParamsContext（在 settings 中）或 FlowContext（在 applyFlow 中）
 * @param {Record<string, any> | ((ctx: any) => Record<string, any> | Promise<Record<string, any>>)} defaultParams 默认参数
 * @param {ParamsContext<TModel>} ctx 上下文
 * @returns {Promise<Record<string, any>>} 解析后的参数对象
 */
export async function resolveDefaultParams<TModel extends FlowModel = FlowModel>(
  defaultParams: Record<string, any> | ((ctx: any) => Record<string, any> | Promise<Record<string, any>>) | undefined,
  ctx: ParamsContext<TModel>,
): Promise<Record<string, any>> {
  if (!defaultParams) {
    return {};
  }

  if (typeof defaultParams === 'function') {
    try {
      const result = await defaultParams(ctx);
      return result || {};
    } catch (error) {
      console.error('Error resolving defaultParams function:', error);
      return {};
    }
  }

  return defaultParams;
}

/**
 * 解析 uiSchema，支持静态值和函数形式
 * 函数可以接收 ParamsContext（在 settings 中）
 * @param {Record<string, ISchema> | ((ctx: ParamsContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)} uiSchema UI Schema 定义
 * @param {ParamsContext<TModel>} ctx 上下文
 * @returns {Promise<Record<string, ISchema>>} 解析后的 UI Schema 对象
 */
export async function resolveUiSchema<TModel extends FlowModel = FlowModel>(
  uiSchema:
    | Record<string, ISchema>
    | ((ctx: ParamsContext<TModel>) => Record<string, ISchema> | Promise<Record<string, ISchema>>)
    | undefined,
  ctx: ParamsContext<TModel>,
): Promise<Record<string, ISchema>> {
  if (!uiSchema) {
    return {};
  }

  if (typeof uiSchema === 'function') {
    try {
      const result = await uiSchema(ctx);
      return result || {};
    } catch (error) {
      console.error('Error resolving uiSchema function:', error);
      return {};
    }
  }

  return uiSchema;
}

/**
 * 流程正常退出异常类
 * 用于标识通过 ctx.exit() 正常退出的情况
 */
export class FlowExitException extends Error {
  public readonly flowKey: string;
  public readonly modelUid: string;

  constructor(flowKey: string, modelUid: string, message?: string) {
    super(message || `Flow '${flowKey}' on model '${modelUid}' exited via ctx.exit().`);
    this.name = 'FlowExitException';
    this.flowKey = flowKey;
    this.modelUid = modelUid;
  }
}

export function defineAction(options: ActionDefinition) {
  return options;
}

// 模块级全局缓存，与 useCompile 保持一致
const compileCache = {};

/**
 * 编译 UI Schema 中的表达式
 *
 * @param scope 编译作用域，包含可用的变量和函数（如 t, randomString 等）
 * @param uiSchema 待编译的 UI Schema
 * @param options 编译选项
 * @returns 编译后的 UI Schema
 */
export function compileUiSchema(scope: Record<string, any>, uiSchema: any, options: { noCache?: boolean } = {}): any {
  const { noCache = false } = options;

  const hasVariable = (source: string): boolean => {
    const reg = /\{\{.*?\}\}/g;
    return reg.test(source);
  };

  const compile = (source: any): any => {
    let shouldCompile = false;
    let cacheKey: string;

    // source is expression, for example: {{ t('Add new') }}
    if (typeof source === 'string' && source.startsWith('{{')) {
      shouldCompile = true;
      cacheKey = source;
    }

    // source is Component Object, for example: { 'x-component': "Cascader", type: "array", title: "所属地区(行政区划)" }
    if (source && typeof source === 'object' && !Array.isArray(source)) {
      try {
        cacheKey = JSON.stringify(source);
      } catch (e) {
        console.warn('Failed to stringify:', e);
        return source;
      }
      if (compileCache[cacheKey]) return compileCache[cacheKey];
      shouldCompile = hasVariable(cacheKey);
    }

    // source is Array, for example: [{ 'title': "{{ t('Admin') }}", name: 'admin' }, { 'title': "{{ t('Root') }}", name: 'root' }]
    if (Array.isArray(source)) {
      try {
        cacheKey = JSON.stringify(source);
      } catch (e) {
        console.warn('Failed to stringify:', e);
        return source;
      }
      if (compileCache[cacheKey]) return compileCache[cacheKey];
      shouldCompile = hasVariable(cacheKey);
    }

    if (shouldCompile) {
      if (!cacheKey) {
        try {
          return Schema.compile(source, scope);
        } catch (error) {
          console.warn('Failed to compile with Formily Schema.compile:', error);
          return source;
        }
      }
      try {
        if (noCache) {
          return Schema.compile(source, scope);
        }
        compileCache[cacheKey] = compileCache[cacheKey] || Schema.compile(source, scope);
        return compileCache[cacheKey];
      } catch (e) {
        console.log('compileUiSchema error', source, e);
        try {
          return Schema.compile(source, scope);
        } catch (error) {
          return source;
        }
      }
    }

    // source is: plain object、string、number、boolean、undefined、null
    return source;
  };

  return compile(uiSchema);
}

export function escapeT(text: TFuncKey | TFuncKey[], options?: TOptions) {
  if (options) {
    return `{{t(${JSON.stringify(text)}, ${JSON.stringify(options)})}}`;
  }
  return `{{t(${JSON.stringify(text)})}}`;
}

/**
 * 检查字段是否在模型的 stepParams 中存在
 */
function checkFieldInStepParams(fieldName: string, subModel: FlowModel): boolean {
  const stepParams = subModel.stepParams;

  if (!stepParams || Object.keys(stepParams).length === 0) {
    return false;
  }

  for (const flowKey in stepParams) {
    const flowSteps = stepParams[flowKey];
    if (!flowSteps) continue;

    for (const stepKey in flowSteps) {
      const stepData = flowSteps[stepKey];
      if (stepData?.fieldPath === fieldName || stepData?.field === fieldName) {
        return true;
      }
    }
  }
  return false;
}

/**
 * 获取字段支持的模型类
 */
function getFieldModelClass(fieldInterface: string, fieldClasses: any[], defaultFieldClass: any) {
  return (
    fieldClasses.find((fieldClass) => {
      return fieldClass['supportedFieldInterfaces']?.includes(fieldInterface);
    }) || defaultFieldClass
  );
}

/**
 * 创建字段切换检测器
 */
function createFieldToggleDetector(fieldName: string, subModelKey: string) {
  return (model: FlowModel) => {
    const subModels = model.subModels[subModelKey];

    if (Array.isArray(subModels)) {
      return subModels.some((subModel) => checkFieldInStepParams(fieldName, subModel));
    } else if (subModels) {
      return checkFieldInStepParams(fieldName, subModels);
    }
    return false;
  };
}

/**
 * 创建字段自定义移除函数
 */
function createFieldCustomRemove(fieldName: string, subModelKey: string) {
  return async (model: FlowModel, _item: any) => {
    const subModels = model.subModels[subModelKey];

    if (Array.isArray(subModels)) {
      const targetModel = subModels.find((subModel) => checkFieldInStepParams(fieldName, subModel));
      if (targetModel) {
        await targetModel.destroy();
        const index = subModels.indexOf(targetModel);
        if (index > -1) subModels.splice(index, 1);
      }
    } else if (subModels && checkFieldInStepParams(fieldName, subModels)) {
      await subModels.destroy();
      (model.subModels as any)[subModelKey] = undefined;
    }
  };
}

/**
 * 构建字段菜单项的工厂函数
 */
export function buildFieldItems(
  fields: any[],
  model: FlowModel,
  subModelBaseClass: string | ModelConstructor,
  subModelKey: string,
  buildCreateModelOptions: (options: any) => any,
) {
  const fieldClassesMap = model.flowEngine.filterModelClassByParent(subModelBaseClass);
  const fieldClasses = Array.from(fieldClassesMap.values())
    ?.filter((ModelClass) => !ModelClass.meta?.hide)
    ?.sort((a, b) => (a.meta?.sort || 0) - (b.meta?.sort || 0));

  if (fieldClasses.length === 0) {
    return [];
  }

  const fieldClassToNameMap = new Map();
  for (const [name, ModelClass] of fieldClassesMap) {
    fieldClassToNameMap.set(ModelClass, name);
  }

  const defaultFieldClass = fieldClasses.find((fieldClass) => fieldClass['supportedFieldInterfaces'] === '*');

  const allFields = fields
    .filter((field) => field.options?.interface)
    .map((field) => {
      const fieldInterfaceName = field.options.interface;
      const fieldClass = getFieldModelClass(fieldInterfaceName, fieldClasses, defaultFieldClass);

      if (!fieldClass) return null;

      const defaultOptions = {
        ...fieldClass.meta?.defaultOptions,
        use: fieldClassToNameMap.get(fieldClass) || fieldClass.name,
      };

      return {
        key: field.name,
        label: field.title,
        icon: fieldClass.meta?.icon,
        createModelOptions: buildCreateModelOptions({
          defaultOptions,
          collectionField: field,
          fieldPath: field.name,
          fieldModelClass: fieldClass,
        }),
        toggleDetector: createFieldToggleDetector(field.name, subModelKey),
        customRemove: createFieldCustomRemove(field.name, subModelKey),
      };
    })
    .filter(Boolean);

  return [
    {
      key: 'addField',
      label: 'Collection fields',
      type: 'group' as const,
      searchable: true,
      searchPlaceholder: 'Search fields',
      children: allFields,
    },
  ];
}

/**
 * 解析 FlowModelMeta 中的 defaultOptions，支持静态值和函数形式
 * @param defaultOptions - 可以是静态对象或返回对象的函数
 * @param parentModel - 父模型实例，用于传递给函数形式的 defaultOptions
 * @returns 解析后的选项对象
 */
export async function resolveDefaultOptions(
  defaultOptions:
    | Record<string, any>
    | ((parentModel: FlowModel) => Record<string, any> | Promise<Record<string, any>>)
    | undefined,
  parentModel: FlowModel,
): Promise<Record<string, any>> {
  if (!defaultOptions) {
    return {};
  }

  if (typeof defaultOptions === 'function') {
    try {
      const result = await defaultOptions(parentModel);
      return result || {};
    } catch (error) {
      console.error('Error resolving defaultOptions function:', error);
      return {};
    }
  }

  return defaultOptions;
}

/**
 * 递归处理 FlowModelMeta 的 children，支持多层嵌套和函数形式的 defaultOptions
 *
 * 该函数用于处理具有层次结构的菜单项定义，支持：
 * - 多层嵌套的 children 结构
 * - 函数形式的 defaultOptions，可根据父模型动态生成配置
 * - 自动处理菜单项的 key 生成和选项解析
 *
 * @param children - FlowModelMeta 中定义的子项数组
 * @param parentModel - 父模型实例，用于传递给函数形式的 defaultOptions
 * @param keyPrefix - 菜单项 key 的前缀，用于生成唯一标识
 * @returns 处理后的菜单项数组
 */
export async function processMetaChildren(children: any[], parentModel: FlowModel, keyPrefix = ''): Promise<any[]> {
  const result = [];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const childKey = `${keyPrefix}${child.title || `item-${i}`}`;

    // 如果有嵌套的 children，创建分组
    if (child.children && child.children.length > 0) {
      const nestedChildren = await processMetaChildren(child.children, parentModel, `${childKey}.`);

      result.push({
        key: childKey,
        label: child.title,
        icon: child.icon,
        // type: 'group',
        children: nestedChildren,
      });
    } else {
      // 叶子节点，处理 defaultOptions
      const defaultOptions = await resolveDefaultOptions(child.defaultOptions, parentModel);

      result.push({
        key: childKey,
        label: child.title,
        icon: child.icon,
        createModelOptions: {
          ...defaultOptions,
          // 确保 use 指向正确的模型类
          use:
            typeof defaultOptions?.use === 'string'
              ? defaultOptions.use
              : (defaultOptions?.use as any)?.name || childKey,
        },
        toggleDetector: child.toggleDetector,
        customRemove: child.customRemove,
      });
    }
  }

  return result;
}

/**
 * 递归处理数据区块的 children，为每个叶子节点创建数据源菜单
 *
 * 用于处理数据区块类型的层次结构，为每个叶子节点自动生成：
 * - 数据源选择菜单
 * - 数据表选择菜单
 * - 相应的 stepParams 配置
 *
 * @param children - 数据区块 FlowModelMeta 中定义的子项数组
 * @param parentModel - 父模型实例
 * @param dataSources - 可用的数据源列表
 * @param keyPrefix - 菜单项 key 的前缀
 * @returns 处理后的包含数据源菜单的菜单项数组
 */
async function processDataBlockChildren(
  children: any[],
  parentModel: FlowModel,
  dataSources: any[],
  keyPrefix = '',
): Promise<any[]> {
  const result = [];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const childKey = `${keyPrefix}${child.title || `item-${i}`}`;

    // 如果有嵌套的 children，递归处理
    if (child.children && child.children.length > 0) {
      const nestedChildren = await processDataBlockChildren(child.children, parentModel, dataSources, `${childKey}.`);

      result.push({
        key: childKey,
        label: child.title,
        icon: child.icon,
        children: nestedChildren,
      });
    } else {
      // 叶子节点，为其创建数据源菜单
      const defaultOptions = await resolveDefaultOptions(child.defaultOptions, parentModel);

      result.push({
        key: childKey,
        label: child.title,
        icon: child.icon,
        children: dataSources.map((dataSource) => ({
          key: `${childKey}.${dataSource.key}`,
          label: dataSource.displayName,
          children: dataSource.collections.map((collection) => ({
            key: `${childKey}.${dataSource.key}.${collection.name}`,
            label: collection.title || collection.name,
            createModelOptions: {
              ..._.cloneDeep(defaultOptions),
              use:
                typeof defaultOptions?.use === 'string'
                  ? defaultOptions.use
                  : (defaultOptions?.use as any)?.name || childKey,
              stepParams: {
                default: {
                  step1: {
                    dataSourceKey: dataSource.key,
                    collectionName: collection.name,
                  },
                },
              },
            },
          })),
        })),
      });
    }
  }

  return result;
}

/**
 * 构建动作菜单项的工厂函数
 */
export function buildActionItems(
  model: FlowModel,
  subModelBaseClass: string | ModelConstructor,
  filter?: (modelClass: ModelConstructor, className: string) => boolean,
) {
  const actionClasses = model.flowEngine.filterModelClassByParent(subModelBaseClass);
  const registeredItems = [];

  for (const [className, ModelClass] of actionClasses) {
    if (filter && !filter(ModelClass, className)) {
      continue;
    }
    if (ModelClass.meta?.hide) {
      continue;
    }

    const meta = ModelClass.meta;

    // 如果模型定义了 children，创建包含子菜单的分组项
    if (meta?.children && meta.children.length > 0) {
      const item: any = {
        key: className,
        label: meta.title || className,
        icon: meta.icon,
        type: 'group',
        children: async () => {
          return await processMetaChildren(meta.children, model, `${className}.`);
        },
      };

      registeredItems.push(item);
    } else {
      // 原有的单个菜单项逻辑
      const item: any = {
        key: className,
        label: meta?.title || className,
        icon: meta?.icon,
        createModelOptions: async () => {
          const defaultOptions = await resolveDefaultOptions(meta?.defaultOptions, model);

          return {
            ...defaultOptions,
            use: className,
          };
        },
      };

      // 从 meta 中获取 toggleDetector
      if (meta?.toggleDetector) {
        item.toggleDetector = meta.toggleDetector;
      }

      if (meta?.customRemove) {
        item.customRemove = meta.customRemove;
      }

      registeredItems.push(item);
    }
  }

  return registeredItems;
}

/**
 * 获取数据源和数据表信息
 * 从 flowEngine 的全局上下文获取数据源管理器信息
 */
async function getDataSourcesWithCollections(model: FlowModel) {
  try {
    // 从 flowEngine 的全局上下文获取数据源管理器
    const globalContext = model.flowEngine.getContext();
    const dataSourceManager: DataSourceManager = globalContext?.dataSourceManager;

    if (!dataSourceManager) {
      // 如果没有数据源管理器，返回空数组
      return [];
    }

    // 获取所有数据源
    const allDataSources: DataSource[] = dataSourceManager.getDataSources();

    // 转换为我们需要的格式
    return allDataSources.map((dataSource: DataSource) => {
      const key = dataSource.key;
      const displayName = dataSource.displayName || dataSource.key;

      // 从 collectionManager 获取 collections
      const collections: Collection[] = dataSource.getCollections();

      return {
        key,
        displayName,
        collections: collections.map((collection: Collection) => ({
          name: collection.name,
          title: collection.title,
          dataSource: key,
        })),
      };
    });
  } catch (error) {
    console.warn('Failed to get data sources:', error);
    // 返回空数组，不提供假数据
    return [];
  }
}

/**
 * 构建区块菜单项的工厂函数
 * 固定使用 BlockModel 作为基类进行过滤
 */
export function buildBlockItems(
  model: FlowModel,
  filter?: (blockClass: ModelConstructor, className: string) => boolean,
) {
  // 获取所有注册的区块类，固定使用 BlockModel 作为基类
  const blockClasses = model.flowEngine.filterModelClassByParent('BlockModel');

  // 获取基础类用于继承检查
  const DataBlockModelClass = model.flowEngine.getModelClass('DataBlockModel');
  const FilterBlockModelClass = model.flowEngine.getModelClass('FilterBlockModel');

  // 分类区块：数据区块, 筛选区块, 其他区块
  const dataBlocks: Array<{ className: string; ModelClass: ModelConstructor }> = [];
  const filterBlocks: Array<{ className: string; ModelClass: ModelConstructor }> = [];
  const otherBlocks: Array<{ className: string; ModelClass: ModelConstructor }> = [];

  for (const [className, ModelClass] of blockClasses) {
    // 应用过滤器
    if (filter && !filter(ModelClass, className)) {
      continue;
    }

    // 排除被隐藏的模型
    if (ModelClass.meta?.hide) {
      continue;
    }

    // 排除基类本身
    if (className === 'DataBlockModel' || className === 'FilterBlockModel') {
      continue;
    }

    // 使用继承关系判断区块类型
    let isDataBlock = false;
    let isFilterBlock = false;

    if (DataBlockModelClass && isInheritedFrom(ModelClass, DataBlockModelClass)) {
      isDataBlock = true;
    } else if (FilterBlockModelClass && isInheritedFrom(ModelClass, FilterBlockModelClass)) {
      isFilterBlock = true;
    }

    if (isDataBlock) {
      dataBlocks.push({ className, ModelClass });
    } else if (isFilterBlock) {
      filterBlocks.push({ className, ModelClass });
    } else {
      otherBlocks.push({ className, ModelClass });
    }
  }

  const result: any[] = [];

  // 数据区块分组
  if (dataBlocks.length > 0) {
    result.push({
      key: 'dataBlocks',
      label: 'Data blocks',
      type: 'group',
      children: async () => {
        const dataSources = await getDataSourcesWithCollections(model);

        // 按区块类型组织菜单：区块 → 数据源 → 数据表
        return await Promise.all(
          dataBlocks.map(async ({ className, ModelClass }) => {
            const meta = (ModelClass as any).meta;

            // 如果模型定义了 children，为每个子项创建数据源菜单
            if (meta?.children && meta.children.length > 0) {
              const childrenWithDataSources = await processDataBlockChildren(
                meta.children,
                model,
                dataSources,
                `${className}.`,
              );

              return {
                key: className,
                label: meta.title || className,
                icon: meta.icon,
                children: childrenWithDataSources,
              };
            } else {
              // 原有的单个区块逻辑
              const defaultOptions = await resolveDefaultOptions(meta?.defaultOptions, model);

              return {
                key: className,
                label: meta?.title || className,
                icon: meta?.icon,
                children: dataSources.map((dataSource) => ({
                  key: `${className}.${dataSource.key}`,
                  label: dataSource.displayName,
                  children: dataSource.collections.map((collection) => ({
                    key: `${className}.${dataSource.key}.${collection.name}`,
                    label: collection.title || collection.name,
                    createModelOptions: {
                      ..._.cloneDeep(defaultOptions),
                      use: className,
                      stepParams: {
                        default: {
                          step1: {
                            dataSourceKey: dataSource.key,
                            collectionName: collection.name,
                          },
                        },
                      },
                    },
                  })),
                })),
              };
            }
          }),
        );
      },
    });
  }

  // 筛选区块分组
  if (filterBlocks.length > 0) {
    result.push({
      key: 'filterBlocks',
      label: 'Filter blocks',
      type: 'group',
      children: async () => {
        const dataSources = await getDataSourcesWithCollections(model);

        // 按区块类型组织菜单：区块 → 数据源 → 数据表
        return await Promise.all(
          filterBlocks.map(async ({ className, ModelClass }) => {
            const meta = (ModelClass as any).meta;

            // 如果模型定义了 children，为每个子项创建数据源菜单
            if (meta?.children && meta.children.length > 0) {
              const childrenWithDataSources = await processDataBlockChildren(
                meta.children,
                model,
                dataSources,
                `${className}.`,
              );

              return {
                key: className,
                label: meta.title || className,
                icon: meta.icon,
                children: childrenWithDataSources,
              };
            } else {
              // 原有的单个区块逻辑
              const defaultOptions = await resolveDefaultOptions(meta?.defaultOptions, model);

              return {
                key: className,
                label: meta?.title || className,
                icon: meta?.icon,
                children: dataSources.map((dataSource) => ({
                  key: `${className}.${dataSource.key}`,
                  label: dataSource.displayName,
                  children: dataSource.collections.map((collection) => ({
                    key: `${className}.${dataSource.key}.${collection.name}`,
                    label: collection.title || collection.name,
                    createModelOptions: {
                      ..._.cloneDeep(defaultOptions),
                      use: className,
                      stepParams: {
                        ..._.cloneDeep(defaultOptions?.stepParams),
                        default: {
                          ..._.cloneDeep(defaultOptions?.stepParams?.default),
                          step1: {
                            dataSourceKey: dataSource.key,
                            collectionName: collection.name,
                          },
                        },
                      },
                    },
                  })),
                })),
              };
            }
          }),
        );
      },
    });
  }

  // 其他区块分组
  if (otherBlocks.length > 0) {
    const otherBlockItems = [];

    for (const { className, ModelClass } of otherBlocks) {
      const meta = (ModelClass as any).meta;

      // 如果模型定义了 children，创建包含子菜单的分组项
      if (meta?.children && meta.children.length > 0) {
        const item = {
          key: className,
          label: meta.title || className,
          icon: meta.icon,
          // type: 'group',
          children: async () => {
            return await processMetaChildren(meta.children, model, `${className}.`);
          },
        };

        otherBlockItems.push(item);
      } else {
        // 原有的单个菜单项逻辑
        const item: any = {
          key: className,
          label: meta?.title || className,
          icon: meta?.icon,
          createModelOptions: async () => {
            const defaultOptions = await resolveDefaultOptions(meta?.defaultOptions, model);

            return {
              ..._.cloneDeep(defaultOptions),
              use: className,
            };
          },
        };

        // 从 meta 中获取 toggleDetector 和 customRemove
        if (meta?.toggleDetector) {
          item.toggleDetector = meta.toggleDetector;
        }
        if (meta?.customRemove) {
          item.customRemove = meta.customRemove;
        }

        otherBlockItems.push(item);
      }
    }

    result.push({
      key: 'otherBlocks',
      label: 'Other blocks',
      type: 'group',
      children: otherBlockItems,
    });
  }

  return result;
}
