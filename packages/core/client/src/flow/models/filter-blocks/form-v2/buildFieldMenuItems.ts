/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

// ==================== 字段菜单构建器 ====================

import { Collection, CollectionField, ModelConstructor } from '@nocobase/flow-engine';
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
 * @param collections Collection数组
 * @param options 可选配置
 * @returns 字段菜单项数组
 */
export function buildFieldMenuItems(
  collections: Collection[],
  gridModel: FilterFormFieldGridModel,
  subModelBaseClass: string | ModelConstructor,
  subModelKey: string,
  buildCreateModelOptions: (options: any) => any,
  options?: {
    includeFieldTypes?: string[]; // 包含的字段类型
    excludeFieldTypes?: string[]; // 排除的字段类型
    includeInterfaces?: string[]; // 包含的字段接口
    excludeInterfaces?: string[]; // 排除的字段接口
    filterFields?: (field: CollectionField) => boolean; // 自定义字段过滤器
  },
): FieldMenuItem[] {
  if (!collections || collections.length === 0) {
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

  // 按数据源分组
  const dataSourceMap = new Map<string, Collection[]>();

  collections.forEach((collection) => {
    const dataSourceKey = collection.dataSourceKey;
    if (!dataSourceMap.has(dataSourceKey)) {
      dataSourceMap.set(dataSourceKey, []);
    }
    const sourceCollections = dataSourceMap.get(dataSourceKey);
    if (sourceCollections) {
      sourceCollections.push(collection);
    }
  });

  const menuItems: FieldMenuItem[] = [];

  // 为每个数据源创建菜单项
  for (const [dataSourceKey, dataSourceCollections] of dataSourceMap) {
    const dataSource = dataSourceCollections[0].dataSource;

    const dataSourceMenuItem: FieldMenuItem = {
      key: dataSourceKey,
      label: dataSource.displayName,
      children: [
        {
          key: 'collections',
          label: 'Collections',
          type: 'group' as const,
          searchable: true,
          searchPlaceholder: 'Search collections',
          children: [],
        },
      ],
    };

    // 为每个集合创建菜单项
    dataSourceCollections.forEach((collection) => {
      const collectionMenuItem: FieldMenuItem = {
        key: `${dataSourceKey}.${collection.name}`,
        label: collection.title,
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

      // 获取集合的所有字段
      const fields = collection.getFields();

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
          key: `${dataSourceKey}.${collection.name}.${field.name}`,
          label: field.title,
          value: `${dataSourceKey}.${collection.name}.${field.name}`,
          icon: fieldClass.meta?.icon,
          createModelOptions: buildCreateModelOptions({
            defaultOptions,
            collectionField: field,
            fieldPath: field.name,
            fieldModelClass: fieldClass,
            collection,
          }),
        };

        collectionMenuItem.children[0].children.push(fieldMenuItem);
      });

      // 只有当集合有字段时才添加到数据源菜单
      if (collectionMenuItem.children && collectionMenuItem.children.length > 0) {
        dataSourceMenuItem.children[0].children.push(collectionMenuItem);
      }
    });

    // 只有当数据源有集合时才添加到最终菜单
    if (dataSourceMenuItem.children && dataSourceMenuItem.children.length > 0) {
      menuItems.push({
        key: 'dataSources',
        label: 'Data sources',
        type: 'group' as const,
        children: [dataSourceMenuItem],
      });
    }
  }

  return menuItems;
}

/**
 * 根据字段类型和接口获取对应的图标
 */
function getFieldIcon(field: CollectionField): string | undefined {
  // 根据字段接口返回对应图标
  const iconMap: Record<string, string> = {
    input: 'InputIcon',
    textarea: 'TextareaIcon',
    number: 'NumberIcon',
    integer: 'NumberIcon',
    percent: 'PercentIcon',
    password: 'PasswordIcon',
    email: 'EmailIcon',
    phone: 'PhoneIcon',
    url: 'UrlIcon',
    color: 'ColorIcon',
    icon: 'IconIcon',
    datetime: 'DatetimeIcon',
    date: 'DateIcon',
    time: 'TimeIcon',
    select: 'SelectIcon',
    multipleSelect: 'MultipleSelectIcon',
    radioGroup: 'RadioIcon',
    checkboxGroup: 'CheckboxIcon',
    checkbox: 'CheckboxIcon',
    switch: 'SwitchIcon',
    attachment: 'AttachmentIcon',
    markdown: 'MarkdownIcon',
    richText: 'RichTextIcon',
    json: 'JsonIcon',
    m2o: 'RelationIcon',
    o2m: 'RelationIcon',
    m2m: 'RelationIcon',
    o2o: 'RelationIcon',
    linkTo: 'LinkIcon',
    formula: 'FormulaIcon',
    sequence: 'SequenceIcon',
    nanoid: 'NanoidIcon',
    uuid: 'UuidIcon',
    autoIncrement: 'AutoIncrementIcon',
    createdAt: 'TimeIcon',
    updatedAt: 'TimeIcon',
    createdBy: 'UserIcon',
    updatedBy: 'UserIcon',
  };

  return iconMap[field.interface];
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
export function findFieldByPath(collections: Collection[], fieldPath: string): CollectionField | undefined {
  const [dataSourceKey, collectionName, fieldName] = fieldPath.split('.');

  const collection = collections.find((c) => c.dataSourceKey === dataSourceKey && c.name === collectionName);

  if (!collection) {
    return undefined;
  }

  return collection.getField(fieldName);
}

function getFieldModelClass(fieldInterface: string, fieldClasses: any[], defaultFieldClass: any) {
  return (
    fieldClasses.find((fieldClass) => {
      return fieldClass['supportedFieldInterfaces']?.includes(fieldInterface);
    }) || defaultFieldClass
  );
}
