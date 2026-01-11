/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { DEFAULT_DATA_SOURCE_KEY } from '@nocobase/client';
import type {
  PageTestHarnessConfig,
  NormalizedPageSpec,
  BlockConfig,
  TabConfig,
  FieldConfig,
  ColumnConfig,
  ActionConfig,
  StepParams,
  HarnessDataSourceConfig,
} from './types';

/**
 * 区块类型到 Model 类名的映射
 */
const BLOCK_TYPE_TO_MODEL: Record<string, string> = {
  Table: 'TableBlockModel',
  'Form(Add new)': 'CreateFormModel',
  'Form(Edit)': 'EditFormModel',
  Details: 'DetailsBlockModel',
  List: 'ListBlockModel',
  'Grid Card': 'GridCardBlockModel',
  Chart: 'ChartBlockModel',
  'Filter form': 'FilterFormBlockModel',
  'JS block': 'JSBlockModel',
  Iframe: 'IframeBlockModel',
  'Action panel': 'ActionPanelBlockModel',
};

/**
 * 预设操作类型到 Model 类名的映射
 */
const ACTION_TYPE_TO_MODEL: Record<string, string> = {
  add: 'CreateActionModel',
  create: 'CreateActionModel',
  edit: 'EditActionModel',
  update: 'EditActionModel',
  view: 'ViewActionModel',
  delete: 'DeleteActionModel',
  submit: 'SubmitActionModel',
  cancel: 'CancelActionModel',
  refresh: 'RefreshActionModel',
  export: 'ExportActionModel',
  import: 'ImportActionModel',
  print: 'PrintActionModel',
  duplicate: 'DuplicateActionModel',
};

/**
 * 提取简化属性到 stepParams
 */
function extractStepParamsFromSimplifiedProps(config: any, existingStepParams?: StepParams): StepParams {
  const stepParams: StepParams = existingStepParams ? { ...existingStepParams } : {};

  // 定义需要排除的属性（这些是配置结构，不应该被提取到 stepParams）
  const excludedKeys = new Set([
    'type',
    'use',
    'uid',
    'collection',
    'recordId',
    'stepParams',
    'fields',
    'columns',
    'actions',
    'rowActions',
    'subModels',
  ]);

  // 提取所有其他属性到 default.step1
  const defaultStep = stepParams.default?.step1 || {};

  for (const [key, value] of Object.entries(config)) {
    if (!excludedKeys.has(key) && value !== undefined) {
      defaultStep[key] = value;
    }
  }

  if (Object.keys(defaultStep).length > 0) {
    if (!stepParams.default) {
      stepParams.default = {};
    }
    stepParams.default.step1 = defaultStep;
  }

  return stepParams;
}

/**
 * 规范化字段配置
 */
function normalizeField(field: string | FieldConfig): any {
  if (typeof field === 'string') {
    return {
      use: 'FormItemModel',
      uid: uid(),
      stepParams: {
        default: {
          step1: {
            fieldName: field,
          },
        },
      },
    };
  }

  const { name, stepParams, ...rest } = field;
  const finalStepParams = extractStepParamsFromSimplifiedProps(rest, stepParams);

  if (!finalStepParams.default) {
    finalStepParams.default = {};
  }
  if (!finalStepParams.default.step1) {
    finalStepParams.default.step1 = {};
  }
  finalStepParams.default.step1.fieldName = name;

  return {
    use: 'FormItemModel',
    uid: uid(),
    stepParams: finalStepParams,
  };
}

/**
 * 规范化列配置
 */
function normalizeColumn(column: string | ColumnConfig): any {
  if (typeof column === 'string') {
    return {
      use: 'TableColumnModel',
      uid: uid(),
      stepParams: {
        default: {
          step1: {
            fieldName: column,
            dataSourceKey: DEFAULT_DATA_SOURCE_KEY,
          },
        },
        fieldSettings: {
          init: {
            dataSourceKey: DEFAULT_DATA_SOURCE_KEY,
            fieldPath: column,
          },
        },
      },
    };
  }

  const { name, stepParams, ...rest } = column;
  const finalStepParams = extractStepParamsFromSimplifiedProps(rest, stepParams);

  if (!finalStepParams.default) {
    finalStepParams.default = {};
  }
  if (!finalStepParams.default.step1) {
    finalStepParams.default.step1 = {};
  }
  finalStepParams.default.step1.fieldName = name;
  finalStepParams.default.step1.dataSourceKey = finalStepParams.default.step1.dataSourceKey || DEFAULT_DATA_SOURCE_KEY;

  if (!finalStepParams.fieldSettings) {
    finalStepParams.fieldSettings = {};
  }
  if (!finalStepParams.fieldSettings.init) {
    finalStepParams.fieldSettings.init = {};
  }
  finalStepParams.fieldSettings.init.fieldPath = finalStepParams.fieldSettings.init.fieldPath || name;
  finalStepParams.fieldSettings.init.dataSourceKey =
    finalStepParams.fieldSettings.init.dataSourceKey || DEFAULT_DATA_SOURCE_KEY;

  return {
    use: 'TableColumnModel',
    uid: uid(),
    stepParams: finalStepParams,
  };
}

/**
 * 规范化操作配置
 */
function normalizeAction(action: string | ActionConfig): any {
  if (typeof action === 'string') {
    const modelClass = ACTION_TYPE_TO_MODEL[action] || 'ActionModel';
    return {
      use: modelClass,
      uid: uid(),
      stepParams: {
        default: {
          step1: {
            actionType: action,
          },
        },
      },
    };
  }

  const { type, stepParams, ...rest } = action;
  const finalStepParams = extractStepParamsFromSimplifiedProps(rest, stepParams);

  if (!finalStepParams.default) {
    finalStepParams.default = {};
  }
  if (!finalStepParams.default.step1) {
    finalStepParams.default.step1 = {};
  }
  finalStepParams.default.step1.actionType = type;

  const modelClass = ACTION_TYPE_TO_MODEL[type] || 'ActionModel';

  return {
    use: modelClass,
    uid: uid(),
    stepParams: finalStepParams,
  };
}

/**
 * 规范化区块配置
 */
function normalizeBlock(block: BlockConfig): any {
  const {
    type,
    use,
    uid: blockUid,
    collection,
    recordId,
    stepParams,
    fields,
    columns,
    actions,
    rowActions,
    ...rest
  } = block;
  const targetDataSourceKey = (block as any).dataSourceKey || DEFAULT_DATA_SOURCE_KEY;

  // 确定使用的 Model 类名
  let modelClass = use;
  if (!modelClass && type) {
    modelClass = BLOCK_TYPE_TO_MODEL[type];
    if (!modelClass) {
      throw new Error(`Unknown block type: ${type}`);
    }
  }
  // 如果只提供了 collection，默认使用 Table 类型
  if (!modelClass && collection) {
    modelClass = BLOCK_TYPE_TO_MODEL['Table'];
  }
  if (!modelClass) {
    throw new Error('Block must have either "type", "use", or "collection" property');
  }

  // 提取简化属性到 stepParams
  const finalStepParams = extractStepParamsFromSimplifiedProps(rest, stepParams);

  // 添加 collection 信息
  if (collection) {
    if (!finalStepParams.default) {
      finalStepParams.default = {};
    }
    if (!finalStepParams.default.step1) {
      finalStepParams.default.step1 = {};
    }
    finalStepParams.default.step1.collectionName = collection;
    finalStepParams.default.step1.dataSourceKey = targetDataSourceKey;

    if (!finalStepParams.resourceSettings) {
      finalStepParams.resourceSettings = {};
    }
    if (!finalStepParams.resourceSettings.init) {
      finalStepParams.resourceSettings.init = {};
    }
    finalStepParams.resourceSettings.init.dataSourceKey =
      finalStepParams.resourceSettings.init.dataSourceKey || targetDataSourceKey;
    finalStepParams.resourceSettings.init.collectionName =
      finalStepParams.resourceSettings.init.collectionName || collection;
  }

  // 添加 recordId 信息
  if (recordId !== undefined) {
    if (!finalStepParams.default) {
      finalStepParams.default = {};
    }
    if (!finalStepParams.default.step1) {
      finalStepParams.default.step1 = {};
    }
    finalStepParams.default.step1.filterByTk = recordId;

    if (!finalStepParams.resourceSettings) {
      finalStepParams.resourceSettings = {};
    }
    if (!finalStepParams.resourceSettings.init) {
      finalStepParams.resourceSettings.init = {};
    }
    finalStepParams.resourceSettings.init.filterByTk = finalStepParams.resourceSettings.init.filterByTk ?? recordId;
  }

  // 特殊处理 Form(Edit) 类型
  if (type === 'Form(Edit)') {
    if (!finalStepParams.default) {
      finalStepParams.default = {};
    }
    if (!finalStepParams.default.step1) {
      finalStepParams.default.step1 = {};
    }
    finalStepParams.default.step1.formType = 'edit';
  }

  // 构建子模型
  const subModels: any = {};

  if (fields && fields.length > 0) {
    subModels.fields = fields.map(normalizeField);
  }

  if (columns && columns.length > 0) {
    subModels.columns = columns.map((columnConfig) => {
      const columnModel = normalizeColumn(columnConfig);
      if (collection) {
        const columnStepParams = columnModel.stepParams;
        if (!columnStepParams.default) {
          columnStepParams.default = { step1: {} };
        }
        if (!columnStepParams.default.step1) {
          columnStepParams.default.step1 = {};
        }
        columnStepParams.default.step1.collectionName = columnStepParams.default.step1.collectionName || collection;
        columnStepParams.default.step1.dataSourceKey =
          columnStepParams.default.step1.dataSourceKey || targetDataSourceKey;

        if (!columnStepParams.fieldSettings) {
          columnStepParams.fieldSettings = {};
        }
        if (!columnStepParams.fieldSettings.init) {
          columnStepParams.fieldSettings.init = {};
        }
        const fieldInit = columnStepParams.fieldSettings.init;
        fieldInit.collectionName = fieldInit.collectionName || collection;
        fieldInit.dataSourceKey = fieldInit.dataSourceKey || targetDataSourceKey;

        if (!columnModel.subModels) {
          columnModel.subModels = {};
        }
        if (!columnModel.subModels.field) {
          columnModel.subModels.field = {
            use: 'DisplayTextFieldModel',
            stepParams: {
              fieldSettings: {
                init: {
                  dataSourceKey: fieldInit.dataSourceKey,
                  collectionName: fieldInit.collectionName,
                  fieldPath: fieldInit.fieldPath,
                },
              },
            },
          };
        }
      }
      return columnModel;
    });
  }

  if (actions && actions.length > 0) {
    subModels.actions = actions.map(normalizeAction);
  }

  if (rowActions && rowActions.length > 0) {
    subModels.rowActions = rowActions.map(normalizeAction);
  }

  return {
    use: modelClass,
    uid: blockUid || uid(),
    stepParams: finalStepParams,
    ...(Object.keys(subModels).length > 0 ? { subModels } : {}),
  };
}

/**
 * 规范化 Tab 配置
 */
function normalizeTab(tab: TabConfig): any {
  const { title, key, icon, stepParams, blocks = [] } = tab;

  const finalStepParams = stepParams ? { ...stepParams } : {};

  if (!finalStepParams.default) {
    finalStepParams.default = {};
  }
  if (!finalStepParams.default.step1) {
    finalStepParams.default.step1 = {};
  }

  if (title) {
    finalStepParams.default.step1.title = title;
  }

  if (icon) {
    finalStepParams.default.step1.icon = icon;
  }

  const tabUid = key || uid();

  return {
    use: 'RootPageTabModel',
    uid: tabUid,
    key: tabUid,
    stepParams: finalStepParams,
    subModels: {
      grid: {
        use: 'BlockGridModel',
        uid: uid(),
        subModels: {
          items: blocks.map((block) => {
            if (typeof block === 'string') {
              return normalizeBlock({ collection: block });
            }
            return normalizeBlock(block);
          }),
        },
      },
    },
  };
}

/**
 * 从配置中提取 collections
 */
function resolveFieldName(value: string | FieldConfig | ColumnConfig): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  return (value && (value as any).name) || (value as any).field || (value as any).fieldName || (value as any).dataIndex;
}

function extractCollections(config: PageTestHarnessConfig): any[] {
  const collectionFields = new Map<string, Set<string>>();

  const ensureCollection = (name?: string) => {
    if (!name) {
      return undefined;
    }
    if (!collectionFields.has(name)) {
      collectionFields.set(name, new Set());
    }
    return collectionFields.get(name);
  };

  const registerField = (collection: string, fieldName?: string) => {
    if (!collection || !fieldName) {
      return;
    }
    ensureCollection(collection)?.add(fieldName);
  };

  const collectFromBlock = (block: BlockConfig | string) => {
    if (typeof block === 'string') {
      ensureCollection(block);
      return;
    }
    const { collection } = block;
    if (!collection) {
      return;
    }
    ensureCollection(collection);

    if (Array.isArray(block.columns)) {
      for (const column of block.columns) {
        registerField(collection, resolveFieldName(column));
      }
    }

    if (Array.isArray(block.fields)) {
      for (const field of block.fields) {
        registerField(collection, resolveFieldName(field));
      }
    }
  };

  if (config.blocks) {
    for (const block of config.blocks) {
      collectFromBlock(block);
    }
  }

  if (config.tabs) {
    for (const tab of config.tabs) {
      for (const block of tab.blocks) {
        collectFromBlock(block);
      }
    }
  }

  if (config.data) {
    for (const [collection, records] of Object.entries(config.data)) {
      const fieldSet = ensureCollection(collection);
      if (!fieldSet || !Array.isArray(records)) {
        continue;
      }
      for (const record of records) {
        if (record && typeof record === 'object') {
          for (const key of Object.keys(record)) {
            registerField(collection, key);
          }
        }
      }
    }
  }

  const collections: any[] = [];
  for (const [name, fields] of collectionFields.entries()) {
    fields.add('id');
    const sortedFields = Array.from(fields).sort((a, b) => a.localeCompare(b));
    const normalizedFields = sortedFields.map((fieldName) => {
      const isIdField = fieldName === 'id';
      return {
        name: fieldName,
        field: fieldName,
        type: isIdField ? 'integer' : 'string',
        interface: isIdField ? 'inputNumber' : 'input',
        title: fieldName,
        primaryKey: isIdField,
      };
    });
    collections.push({
      name,
      title: name,
      tableName: name,
      fields: normalizedFields,
    });
  }

  return collections;
}

/**
 * 规范化页面配置
 */
export function normalizePageConfig(config: PageTestHarnessConfig): NormalizedPageSpec {
  const { stepParams, tabs, blocks, dataSources, apiMocks, plugins, pageTitle, pageConfig } = config;

  // 提取 collections
  const collections = extractCollections(config);
  const normalizedDataSources: Record<string, HarnessDataSourceConfig> = dataSources ? { ...dataSources } : {};

  const defaultDataSource = normalizedDataSources[DEFAULT_DATA_SOURCE_KEY] || {};
  const existingCollections = Array.isArray(defaultDataSource.collections) ? defaultDataSource.collections : [];
  const collectionNames = new Set(existingCollections.map((item: any) => item?.name));
  const mergedCollections = [...existingCollections];

  for (const collection of collections) {
    if (!collectionNames.has(collection.name)) {
      mergedCollections.push(collection);
    }
  }

  normalizedDataSources[DEFAULT_DATA_SOURCE_KEY] = {
    ...defaultDataSource,
    key: defaultDataSource.key || DEFAULT_DATA_SOURCE_KEY,
    collections: mergedCollections,
  };

  // 构建根页面模型配置
  const rootPageModelConfig: any = {
    use: 'RootPageModel',
    uid: uid(),
    stepParams: stepParams || {},
  };

  // 添加页面配置
  if (pageTitle || pageConfig) {
    if (!rootPageModelConfig.stepParams.default) {
      rootPageModelConfig.stepParams.default = {};
    }
    if (!rootPageModelConfig.stepParams.default.step1) {
      rootPageModelConfig.stepParams.default.step1 = {};
    }

    if (pageTitle) {
      rootPageModelConfig.stepParams.default.step1.title = pageTitle;
    }

    if (pageConfig) {
      Object.assign(rootPageModelConfig.stepParams.default.step1, pageConfig);
    }
  }

  const normalizedTabs = tabs?.length ? tabs.map(normalizeTab) : [];

  if (!normalizedTabs.length && blocks && blocks.length > 0) {
    const defaultBlocks = blocks.map<BlockConfig>((block) => {
      if (typeof block === 'string') {
        return { collection: block };
      }
      return block;
    });

    normalizedTabs.push(
      normalizeTab({
        title: pageTitle || 'Main',
        blocks: defaultBlocks,
      } as TabConfig),
    );
  }

  if (normalizedTabs.length > 0) {
    rootPageModelConfig.subModels = {
      tabs: normalizedTabs,
    };
  }

  return {
    rootPageModelConfig,
    collections,
    dataSources: normalizedDataSources,
    apiMocks: apiMocks || [],
    plugins: plugins || [],
  };
}
