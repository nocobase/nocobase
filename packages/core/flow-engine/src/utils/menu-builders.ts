/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import _ from 'lodash';
import { Collection, CollectionField, DataSource, DataSourceManager } from '../data-source';
import type { FlowModel } from '../models';
import type { ModelConstructor } from '../types';
import { BLOCK_GROUP_CONFIGS, MENU_KEYS, SHOW_CURRENT_MODELS } from './constants';
import { isInheritedFrom } from './inheritance';
import { resolveDefaultOptions } from './params-resolvers';
import { escapeT } from './translation';
// ==================== 类型定义 ====================

interface MenuItemBase {
  key: string;
  label: string;
  icon?: string;
}

interface MenuGroup extends MenuItemBase {
  type: 'group';
  children: MenuItem[] | (() => Promise<MenuItem[]>);
  searchable?: boolean;
  searchPlaceholder?: string;
}

interface MenuItem extends MenuItemBase {
  createModelOptions?: (() => Promise<any>) | any;
  toggleDetector?: (model: FlowModel) => boolean;
  customRemove?: (model: FlowModel, item: any) => Promise<void>;
  children?: MenuItem[] | (() => Promise<MenuItem[]>);
}

interface BlockInfo {
  className: string;
  ModelClass: ModelConstructor;
}

interface DataSourceInfo {
  key: string;
  displayName: string;
  collections: CollectionInfo[];
}

interface CollectionInfo {
  name: string;
  title?: string;
  dataSource: string;
}

interface MenuBuilderFlowContext {
  runtimeArgs?: {
    filterByTk?: string;
    collectionName?: string;
    sourceId?: string;
    associationName?: string;
  };
  shared?: {
    currentBlockModel?: {
      collection?: any;
    };
  };
}

// ==================== 数据源工具函数 ====================

function getDataSourcesWithCollections(model: FlowModel): DataSourceInfo[] {
  try {
    const globalContext = model.flowEngine.getContext();
    const dataSourceManager: DataSourceManager = globalContext?.dataSourceManager;

    if (!dataSourceManager) return [];

    const allDataSources: DataSource[] = dataSourceManager.getDataSources();

    return allDataSources.map((dataSource: DataSource) => ({
      key: dataSource.key,
      displayName: dataSource.displayName || dataSource.key,
      collections: dataSource.getCollections().map((collection) => ({
        name: collection.name,
        title: collection.title,
        dataSource: dataSource.key,
      })),
    }));
  } catch (error) {
    console.warn('Failed to get data sources:', error);
    return [];
  }
}

// ==================== 通用菜单构建器 ====================

// 创建带数据源参数的默认选项
function createDataSourceStepParams(dataSourceKey: string, collectionName: string, extra?: any) {
  return {
    resourceSettings: {
      init: {
        dataSourceKey,
        collectionName,
        ...extra,
      },
    },
  };
}

// 通用菜单项构建函数
function buildMenuItem(className: string, meta: any, model: FlowModel): MenuItem {
  const baseItem: MenuItem = {
    key: className,
    label: meta?.title || className,
    icon: meta?.icon,
  };

  if (meta?.children) {
    return {
      ...baseItem,
      children: async () => processMetaChildren(meta.children, model, `${className}.`),
    };
  }

  const item: MenuItem = {
    ...baseItem,
    createModelOptions: async () => {
      const defaultOptions = await resolveDefaultOptions(meta?.defaultOptions, model);
      return {
        ...defaultOptions,
        use: className,
      };
    },
  };

  if (meta?.toggleDetector) item.toggleDetector = meta.toggleDetector;
  if (meta?.customRemove) item.customRemove = meta.customRemove;

  return item;
}

// 通用模型类遍历函数
function buildGenericMenuItems(
  model: FlowModel,
  subModelBaseClass: string | ModelConstructor,
  filter?: (modelClass: ModelConstructor, className: string) => boolean,
): MenuItem[] {
  const modelClasses = model.flowEngine.filterModelClassByParent(subModelBaseClass);
  const items: MenuItem[] = [];

  for (const [className, ModelClass] of modelClasses) {
    if (filter && !filter(ModelClass, className)) continue;
    if (ModelClass.meta?.hide) continue;

    const meta = ModelClass.meta;
    items.push(buildMenuItem(className, meta, model));
  }

  return items;
}

// ==================== 导出的构建函数 ====================

export function buildActionItems(
  model: FlowModel,
  subModelBaseClass: string | ModelConstructor,
  filter?: (modelClass: ModelConstructor, className: string) => boolean,
) {
  return buildGenericMenuItems(model, subModelBaseClass, filter);
}

// ==================== 动态 Meta Children 构建器 ====================

// 构建基础菜单项
function createBasicMenuItem(key: string, title: string, className: string, options?: any) {
  return {
    key,
    title: escapeT(title),
    defaultOptions: { use: className, ...options },
  };
}

// 构建当前记录菜单项
function createCurrentRecordMenuItem(className: string, collection: Collection, stepParams?: any) {
  return {
    key: MENU_KEYS.CURRENT_RECORD,
    title: escapeT('Current record'),
    collections: [collection],
    defaultOptions: {
      use: className,
      stepParams: stepParams || {
        resourceSettings: {
          init: {
            filterByTk: '{{ctx.runtimeArgs.filterByTk}}',
            collectionName: collection.name,
            dataSourceKey: collection.dataSource.key,
          },
        },
      },
    },
  };
}

// 构建关联记录菜单项
function createAssociationRecordsMenuItem(
  className: string,
  baseCollectionName: string,
  fields: CollectionField[],
  sourceId = '{{ctx.runtimeArgs.filterByTk}}',
) {
  let associationFields = fields.filter(
    (f) => f.target !== baseCollectionName && !!f.targetCollection && f.interface !== 'mbm',
  );
  const toManyInterfaces = ['o2m', 'm2m'];

  if (className !== 'DetailsModel') {
    associationFields = associationFields.filter((f) => toManyInterfaces.includes(f.interface));
  }

  return {
    key: MENU_KEYS.ASSOCIATION_RECORDS,
    title: escapeT('Associated records'),
    fields: associationFields,
    defaultOptions: (_parentModel: any, field: CollectionField) => {
      return {
        use: className,
        stepParams: {
          resourceSettings: {
            init: {
              dataSourceKey: field.collection.dataSource.key,
              collectionName: field.target,
              associationName: field.collection.name + '.' + field.name,
              sourceId,
              // filterByTk: '{{ctx.runtimeArgs.filterByTk}}',
            },
          },
        },
      };
    },
  };
}

// 场景1：没有 filterByTk 的情况
function buildCollectionOnlyItems(className: string, collection: Collection): any[] {
  return [
    {
      ...createBasicMenuItem(MENU_KEYS.CURRENT_COLLECTIONS, 'Current collection', className),
      collections: [collection],
    },
    createBasicMenuItem(MENU_KEYS.OTHER_COLLECTIONS, 'Other collections', className),
  ];
}

// 场景2：当前集合的情况（有 filterByTk，且是同一个集合）
function buildCurrentCollectionItems(
  className: string,
  collection: Collection,
  relatedFields: CollectionField[],
): any[] {
  const items: any[] = [];

  // 为 FormModel 和 DetailsModel 添加当前记录
  if (SHOW_CURRENT_MODELS.includes(className as any)) {
    items.push(createCurrentRecordMenuItem(className, collection));
  }

  // 添加关联记录（如果有）
  if (relatedFields.length > 0) {
    items.push(createAssociationRecordsMenuItem(className, collection.name, relatedFields));
  }

  // 添加其他记录
  items.push(createBasicMenuItem(MENU_KEYS.OTHER_RECORDS, 'Other records', className));

  return items;
}

// 场景3：其他集合的情况（有 filterByTk，但是不同集合）
function buildOtherCollectionItems(
  className: string,
  collection: Collection,
  currentFlow: MenuBuilderFlowContext,
): any[] {
  const items: any[] = [];

  // 只为 FormModel 添加当前记录
  if (SHOW_CURRENT_MODELS.includes(className)) {
    const targetCollection = collection.dataSource.getCollection(currentFlow.runtimeArgs!.collectionName!);
    if (targetCollection) {
      const customStepParams = {
        resourceSettings: {
          init: {
            dataSourceKey: collection.dataSource.key,
            collectionName: currentFlow.runtimeArgs!.collectionName,
            associationName: currentFlow.runtimeArgs.associationName,
            sourceId: '{{ctx.runtimeArgs.sourceId}}',
            filterByTk: '{{ctx.runtimeArgs.filterByTk}}',
          },
        },
      };
      items.push(createCurrentRecordMenuItem(className, targetCollection, customStepParams));
    }
  }

  // 添加关联记录
  const sourceCollection = collection.dataSource.getCollection(currentFlow.runtimeArgs!.collectionName!);
  if (sourceCollection) {
    const relatedFields = sourceCollection.getRelationshipFields();
    items.push(createAssociationRecordsMenuItem(className, currentFlow.runtimeArgs!.collectionName!, relatedFields));
  }

  // 添加其他记录
  items.push(createBasicMenuItem(MENU_KEYS.OTHER_RECORDS, 'Other records', className));

  return items;
}

// 根据当前流程上下文动态构建 meta.children
// 这个函数会根据运行时参数（如 filterByTk、collectionName）决定显示哪些菜单项
function buildDynamicMetaChildren(
  className: string,
  currentFlow: MenuBuilderFlowContext,
  collection: Collection,
  relatedFields: CollectionField[],
) {
  // 场景1：没有 filterByTk，显示集合选择
  if (!currentFlow.runtimeArgs?.filterByTk) {
    return buildCollectionOnlyItems(className, collection);
  }

  // 判断是否使用当前集合
  const shouldUseCurrentCollection =
    !currentFlow.runtimeArgs?.collectionName || currentFlow.runtimeArgs.collectionName === collection.name;

  // 场景2：当前集合上下文
  if (shouldUseCurrentCollection) {
    return buildCurrentCollectionItems(className, collection, relatedFields);
  }

  // 场景3：其他集合上下文
  return buildOtherCollectionItems(className, collection, currentFlow);
}

// ==================== 子项处理函数 ====================

async function resolveMetaChildren(
  children: any[] | ((parentModel: FlowModel) => any[] | Promise<any[]>) | undefined,
  parentModel: FlowModel,
): Promise<any[]> {
  if (!children) return [];

  if (typeof children === 'function') {
    try {
      const result = await children(parentModel);
      return result || [];
    } catch (error) {
      console.error('Error resolving meta children function:', error);
      return [];
    }
  }

  return children;
}

export async function processMetaChildren(
  children: any[] | ((parentModel: FlowModel) => any[] | Promise<any[]>),
  parentModel: FlowModel,
  keyPrefix = '',
): Promise<MenuItem[]> {
  const resolvedChildren = await resolveMetaChildren(children, parentModel);
  const result: MenuItem[] = [];

  for (let i = 0; i < resolvedChildren.length; i++) {
    const child = resolvedChildren[i];
    const childKey = `${keyPrefix}${child.title || `item-${i}`}`;

    if (child.children) {
      const nestedChildren = await processMetaChildren(child.children, parentModel, `${childKey}.`);
      result.push({
        key: childKey,
        label: child.title,
        icon: child.icon,
        children: nestedChildren,
      });
    } else {
      const defaultOptions = await resolveDefaultOptions(child.defaultOptions, parentModel);
      result.push({
        key: childKey,
        label: child.title,
        icon: child.icon,
        createModelOptions: {
          ...defaultOptions,
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

// 处理数据块子项
async function processDataBlockChildren(
  children: any[] | ((parentModel: FlowModel) => any[] | Promise<any[]>),
  parentModel: FlowModel,
  dataSources: DataSourceInfo[],
  keyPrefix = '',
): Promise<MenuItem[]> {
  const resolvedChildren = await resolveMetaChildren(children, parentModel);
  const result: MenuItem[] = [];

  for (let i = 0; i < resolvedChildren.length; i++) {
    const child = resolvedChildren[i];
    const childKey = `${keyPrefix}${child.title || `item-${i}`}`;

    if (child.children) {
      const nestedChildren = await processDataBlockChildren(child.children, parentModel, dataSources, `${childKey}.`);
      result.push({
        key: childKey,
        label: child.title,
        icon: child.icon,
        children: nestedChildren,
      });
    } else {
      let menuItems;

      // 对于关联记录，构建 datasource -> field 层级
      if (child.key === MENU_KEYS.ASSOCIATION_RECORDS && child.fields) {
        // 按数据源分组关联字段
        const fieldsByDataSource = new Map<string, CollectionField[]>();
        for (const field of child.fields) {
          const dataSourceKey = field.collection.dataSource.key;
          if (!fieldsByDataSource.has(dataSourceKey)) {
            fieldsByDataSource.set(dataSourceKey, []);
          }
          fieldsByDataSource.get(dataSourceKey)!.push(field);
        }

        menuItems = await Promise.all(
          Array.from(fieldsByDataSource.entries()).map(async ([dataSourceKey, fields]) => {
            const dataSource = dataSources.find((ds) => ds.key === dataSourceKey);
            return {
              key: `${childKey}.${dataSourceKey}`,
              label: dataSource?.displayName || dataSourceKey,
              children: await Promise.all(
                fields.map(async (field) => {
                  const defaultOptions = await resolveDefaultOptions(child.defaultOptions, parentModel, field);
                  return {
                    key: `${childKey}.${dataSourceKey}.${field.name}`,
                    label: field.uiSchema?.title || field.name,
                    createModelOptions: {
                      ..._.cloneDeep(defaultOptions),
                      use:
                        typeof defaultOptions?.use === 'string'
                          ? defaultOptions.use
                          : (defaultOptions?.use as any)?.name || childKey,
                    },
                  };
                }),
              ),
            };
          }),
        );
      } else {
        // 原有的逻辑处理其他类型的菜单项
        let filteredDataSources = dataSources;
        if (child.collections && child.collections.length > 0) {
          const currentDataSource = child.collections[0].dataSource;
          filteredDataSources = dataSources.filter((ds) => ds.key === currentDataSource.key);
        }

        menuItems = await Promise.all(
          filteredDataSources.map(async (dataSource) => ({
            key: `${childKey}.${dataSource.key}`,
            label: dataSource.displayName,
            children: await Promise.all(
              dataSource.collections
                .filter((c) => {
                  return (
                    !child.collections ||
                    child.collections.find((col: any) => col.name === c.name && col.dataSource.key === dataSource.key)
                  );
                })
                .map(async (collection) => {
                  const defaultOptions = await resolveDefaultOptions(child.defaultOptions, parentModel, {
                    dataSourceKey: dataSource.key,
                    collectionName: collection.name,
                  });
                  return {
                    key: `${childKey}.${dataSource.key}.${collection.name}`,
                    label: collection.title || collection.name,
                    createModelOptions: {
                      ..._.cloneDeep(defaultOptions),
                      use:
                        typeof defaultOptions?.use === 'string'
                          ? defaultOptions.use
                          : (defaultOptions?.use as any)?.name || childKey,
                      stepParams: {
                        ...createDataSourceStepParams(dataSource.key, collection.name),
                        ...defaultOptions?.stepParams,
                      },
                    },
                  };
                }),
            ),
          })),
        );
      }

      // 对于关联记录，即使只有一个选项也不要隐藏collection选择
      const totalCollections = menuItems.reduce((sum, item) => sum + item.children.length, 0);
      if (totalCollections === 1 && child.key !== MENU_KEYS.ASSOCIATION_RECORDS) {
        const singleItem = menuItems[0].children[0];
        result.push({
          key: childKey,
          label: child.title,
          icon: child.icon,
          createModelOptions: singleItem.createModelOptions,
        });
      } else if (totalCollections > 0) {
        // 如果只有一个数据源，直接显示collections，隐藏数据源层
        if (menuItems.length === 1) {
          result.push({
            key: childKey,
            label: child.title,
            icon: child.icon,
            children: menuItems[0].children,
          });
        } else {
          result.push({
            key: childKey,
            label: child.title,
            icon: child.icon,
            children: menuItems,
          });
        }
      }
    }
  }

  return result;
}

// ==================== 字段菜单构建器 ====================

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

function getFieldModelClass(fieldInterface: string, fieldClasses: any[], defaultFieldClass: any) {
  return (
    fieldClasses.find((fieldClass) => {
      return fieldClass['supportedFieldInterfaces']?.includes(fieldInterface);
    }) || defaultFieldClass
  );
}

function createFieldToggleDetector(fieldName: string, subModelKey: string) {
  return (model: FlowModel) => {
    const subModels = model.subModels?.[subModelKey];

    if (Array.isArray(subModels)) {
      return subModels.some((subModel) => checkFieldInStepParams(fieldName, subModel));
    } else if (subModels) {
      return checkFieldInStepParams(fieldName, subModels);
    }
    return false;
  };
}

function createFieldCustomRemove(fieldName: string, subModelKey: string) {
  return async (model: FlowModel, _item: any) => {
    const subModels = model.subModels?.[subModelKey];

    if (Array.isArray(subModels)) {
      const targetModel = subModels.find((subModel) => checkFieldInStepParams(fieldName, subModel));
      if (targetModel) {
        await targetModel.destroy();
        const index = subModels.indexOf(targetModel);
        if (index > -1) subModels.splice(index, 1);
      }
    } else if (subModels && checkFieldInStepParams(fieldName, subModels)) {
      await subModels.destroy();
      if (model.subModels) (model.subModels as any)[subModelKey] = undefined;
    }
  };
}

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

// ==================== 区块菜单构建器 ====================

export function buildBlockItems(
  model: FlowModel,
  filter?: (blockClass: ModelConstructor, className: string) => boolean,
): MenuItem[] {
  const blockClasses = model.flowEngine.filterModelClassByParent('BlockModel');
  const DataBlockModelClass = model.flowEngine.getModelClass('DataBlockModel');
  const FilterBlockModelClass = model.flowEngine.getModelClass('FilterBlockModel');

  const dataBlocks: BlockInfo[] = [];
  const filterBlocks: BlockInfo[] = [];
  const otherBlocks: BlockInfo[] = [];

  for (const [className, ModelClass] of blockClasses) {
    if (filter && !filter(ModelClass, className)) continue;
    if ((ModelClass as any).meta?.hide) continue;
    if (className === 'DataBlockModel' || className === 'FilterBlockModel') continue;

    const blockInfo = { className, ModelClass };

    if (DataBlockModelClass && isInheritedFrom(ModelClass, DataBlockModelClass)) {
      dataBlocks.push(blockInfo);
    } else if (FilterBlockModelClass && isInheritedFrom(ModelClass, FilterBlockModelClass)) {
      filterBlocks.push(blockInfo);
    } else {
      otherBlocks.push(blockInfo);
    }
  }

  const result: MenuItem[] = [];

  if (dataBlocks.length > 0) {
    result.push(buildBlockGroup('data', dataBlocks, model));
  }
  if (filterBlocks.length > 0) {
    result.push(buildBlockGroup('filter', filterBlocks, model));
  }
  if (otherBlocks.length > 0) {
    result.push(buildBlockGroup('other', otherBlocks, model));
  }

  return result;
}

function buildBlockGroup(type: 'data' | 'filter' | 'other', blocks: BlockInfo[], model: FlowModel): MenuGroup {
  const config = BLOCK_GROUP_CONFIGS[type];

  return {
    key: config.key,
    label: config.label,
    type: 'group' as const,
    children: async () => {
      if (type === 'other') {
        return buildOtherBlockItems(blocks, model);
      }
      return buildDataSourceBlockItems(blocks, model, config.hasCurrentFlowContext);
    },
  };
}

async function buildDataSourceBlockItems(
  blocks: BlockInfo[],
  model: FlowModel,
  hasCurrentFlowContext = false,
): Promise<MenuItem[]> {
  const dataSources = getDataSourcesWithCollections(model);

  return Promise.all(
    blocks.map(async ({ className, ModelClass }) => {
      const meta = hasCurrentFlowContext ? _.cloneDeep((ModelClass as any).meta) : (ModelClass as any).meta;
      const defaultOptions = await resolveDefaultOptions(meta?.defaultOptions, model);

      if (hasCurrentFlowContext) {
        const currentFlow = model.parent?.getSharedContext()?.currentFlow;
        const collection: Collection = currentFlow?.shared?.currentBlockModel?.collection;

        if (currentFlow && collection) {
          const relatedFields = collection?.getRelationshipFields() || [];
          meta.children = buildDynamicMetaChildren(className, currentFlow, collection, relatedFields);
          meta.children.forEach(async (child) => {
            const childDefault = child.defaultOptions;
            child.defaultOptions = async (model, extra) => {
              const options = await resolveDefaultOptions(childDefault, model, extra);
              return _.merge(_.cloneDeep(defaultOptions), options);
            };
          });
        }
      }

      if (meta?.children) {
        return {
          key: className,
          label: meta.title || className,
          icon: meta.icon,
          children: await processDataBlockChildren(meta.children, model, dataSources, `${className}.`),
        };
      }

      const dataSourceMenuItems = dataSources.map((dataSource) => ({
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
              ...createDataSourceStepParams(
                dataSource.key,
                collection.name,
                defaultOptions?.stepParams?.resourceSettings?.init,
              ),
            },
          },
        })),
      }));

      // 如果只有一个数据源，直接显示collections，隐藏数据源层
      const children = dataSourceMenuItems.length === 1 ? dataSourceMenuItems[0].children : dataSourceMenuItems;

      return {
        key: className,
        label: meta?.title || className,
        icon: meta?.icon,
        children,
      };
    }),
  );
}

async function buildOtherBlockItems(blocks: BlockInfo[], model: FlowModel): Promise<MenuItem[]> {
  const items: MenuItem[] = [];

  for (const { className, ModelClass } of blocks) {
    const meta = (ModelClass as any).meta;
    items.push(buildMenuItem(className, meta, model));
  }

  return items;
}
