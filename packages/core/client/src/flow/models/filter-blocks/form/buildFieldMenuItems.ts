/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// ==================== 字段菜单构建器 ====================

import { CollectionField, ModelConstructor, FlowModel } from '@nocobase/flow-engine';
import { FilterFormFieldGridModel } from './FilterFormFieldGridModel';

interface FieldMenuItem {
  key: string;
  label: string;
  icon?: string;
  value?: string; // 字段的完整路径，如 "dataSourceKey.collectionName.fieldName"
  children?: FieldMenuItem[];
  type?: 'group' | 'item';
  searchable?: boolean;
  searchPlaceholder?: string;
  createModelOptions?: {
    defaultOptions: Record<string, any>;
    collectionField?: CollectionField;
    fieldPath?: string;
    fieldModelClass?: ModelConstructor;
  };
}

/**
 * 构建字段菜单列表
 * @param dataModels FlowModel数组
 * @param options 可选配置
 * @returns 字段菜单项数组
 */
export async function buildFieldMenuItems(
  dataModels: FlowModel[],
  gridModel: FilterFormFieldGridModel,
  subModelBaseClass: string | ModelConstructor,
  buildCreateModelOptions: (options: any) => any,
  options?: {
    includeFieldTypes?: string[]; // 包含的字段类型
    excludeFieldTypes?: string[]; // 排除的字段类型
    includeInterfaces?: string[]; // 包含的字段接口
    excludeInterfaces?: string[]; // 排除的字段接口
    filterFields?: (field: CollectionField) => boolean; // 自定义字段过滤器
  },
): Promise<FieldMenuItem[]> {
  if (!dataModels || dataModels.length === 0) {
    return [];
  }

  const fieldClassesMap = gridModel.flowEngine.filterModelClassByParent(subModelBaseClass);
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

  const menuItems: FieldMenuItem[] = [
    {
      key: 'blocks',
      label: 'Block list',
      type: 'group' as const,
      searchPlaceholder: 'Search blocks',
      children: [],
    },
  ];

  // 为每个数据模型创建菜单项
  await Promise.all(
    dataModels.map(async (model) => {
      const modelMenuItem: FieldMenuItem = {
        key: model.uid,
        label: `${model.title} #${model.uid.substring(0, 4)}`,
        children: [
          {
            key: 'fields',
            label: 'Fields',
            type: 'group' as const,
            searchable: true,
            searchPlaceholder: 'Search fields',
            children: [],
          },
        ],
      };

      // 获取模型的所有字段
      const fields = (await (model as any).getFilterFields?.()) || [];

      // 过滤字段
      const filteredFields = fields.filter((field) => {
        // 应用字段类型过滤
        if (options?.includeFieldTypes && !options.includeFieldTypes.includes(field.type)) {
          return false;
        }
        if (options?.excludeFieldTypes?.includes(field.type)) {
          return false;
        }

        // 应用接口类型过滤
        if (options?.includeInterfaces && !options.includeInterfaces.includes(field.interface)) {
          return false;
        }
        if (options?.excludeInterfaces?.includes(field.interface)) {
          return false;
        }

        // 应用自定义过滤器
        if (options?.filterFields && !options.filterFields(field)) {
          return false;
        }

        return true;
      });

      // 为每个字段创建菜单项
      filteredFields.forEach((field) => {
        const fieldInterfaceName = field.options.interface;
        const fieldClass = getFieldModelClass(fieldInterfaceName, fieldClasses, defaultFieldClass);

        if (!fieldClass) return null;

        const defaultOptions = {
          ...fieldClass.meta?.defaultOptions,
          use: fieldClassToNameMap.get(fieldClass) || fieldClass.name,
        };

        const fieldMenuItem: FieldMenuItem = {
          key: `${model.uid}.${field.name}`,
          label: field.title,
          value: `${model.uid}.${field.name}`,
          icon: fieldClass.meta?.icon,
          createModelOptions: buildCreateModelOptions({
            defaultOptions,
            collectionField: field,
            fieldPath: field.name,
            fieldModelClass: fieldClass,
            model,
          }),
        };

        modelMenuItem.children[0].children.push(fieldMenuItem);
      });

      // 只有当模型有字段时才添加到区块列表菜单
      if (modelMenuItem.children[0].children.length > 0) {
        menuItems[0].children.push(modelMenuItem);
      }
    }),
  );

  return menuItems;
}

/**
 * 扁平化字段菜单，返回所有字段的完整路径列表
 */
export function flattenFieldMenuItems(menuItems: FieldMenuItem[]): string[] {
  const result: string[] = [];

  function traverse(items: FieldMenuItem[]) {
    items.forEach((item) => {
      if (item.value) {
        result.push(item.value);
      }
      if (item.children) {
        traverse(item.children);
      }
    });
  }

  traverse(menuItems);
  return result;
}

/**
 * 根据字段路径查找对应的字段对象
 */
export function findFieldByPath(dataModels: FlowModel[], fieldPath: string): CollectionField | undefined {
  const [modelUid, fieldName] = fieldPath.split('.');

  const model = dataModels.find((m) => m.uid === modelUid);

  if (!model) {
    return undefined;
  }

  const fields = (model as any).getFilterFields?.() || [];
  return fields.find((field) => field.name === fieldName);
}

function getFieldModelClass(fieldInterface: string, fieldClasses: any[], defaultFieldClass: any) {
  return (
    fieldClasses.find((fieldClass) => {
      return fieldClass['supportedFieldInterfaces']?.includes(fieldInterface);
    }) || defaultFieldClass
  );
}
