/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

export function getAssociationPath(str) {
  const lastIndex = str.lastIndexOf('.');
  if (lastIndex !== -1) {
    return str.substring(0, lastIndex);
  }
  return str;
}

/**
 * 为多层级的关系字段补充上父级字段
 * e.g. ['a', 'b.c'] => ['a', 'b', 'b.c']
 * @param appends
 * @returns
 */
export function fillParentFields(appends: Set<string>) {
  const depFields = Array.from(appends).filter((field) => field?.includes?.('.'));

  depFields.forEach((field) => {
    const fields = field.split('.');
    fields.pop();
    const parentField = fields.join('.');
    appends.add(parentField);
  });

  return appends;
}

export const parseAssociationNames = (dataSourceKey: string, collectionName: string, app: any, fieldSchema: any) => {
  let appends = new Set([]);
  const dataSource = app.dataSourceManager.dataSources.get(dataSourceKey);
  const _getAssociationAppends = (schema, str) => {
    // 定义 reduceProperties 函数来遍历 properties
    const reduceProperties = (schema, reducer, initialValue) => {
      if (!schema || typeof schema !== 'object') {
        return initialValue;
      }
      if (schema.properties && typeof schema.properties === 'object') {
        for (const key in schema.properties) {
          if (schema.properties[key]) {
            const property = schema.properties[key];
            // 调用 reducer 函数
            initialValue = reducer(initialValue, property, key);
            // 递归处理嵌套 properties
            initialValue = reduceProperties(property, reducer, initialValue);
          }
        }
      }
      return initialValue;
    };

    const customReducer = (pre, s, key) => {
      const prefix = pre || str;
      const collection = dataSource.collectionManager.getCollection(
        s?.['x-collection-field']?.split('.')?.[0] || collectionName,
      );
      if (!collection) {
        throw new Error('The collection is not found');
      }
      const collectionField = s['x-collection-field'] && collection.getField(s['x-collection-field']?.split('.')[1]);
      const isAssociationField =
        collectionField &&
        ['hasOne', 'hasMany', 'belongsTo', 'belongsToMany', 'belongsToArray'].includes(collectionField.type);
      if (collectionField && isAssociationField) {
        appends.add(collectionField.target);
        // 如果组件类型是 'Nester'、'SubTable' 或 'PopoverNester'，递归调用 _getAssociationAppends
        if (['Nester', 'SubTable', 'PopoverNester'].includes(s['x-component-props']?.mode)) {
          const bufPrefix = prefix && prefix !== '' ? `${prefix}.${s.name}` : s.name;
          _getAssociationAppends(s, bufPrefix);
        }
      } else if (
        ![
          'ActionBar',
          'Action',
          'Action.Link',
          'Action.Modal',
          'Selector',
          'Viewer',
          'AddNewer',
          'AssociationField.Selector',
          'AssociationField.AddNewer',
          'TableField',
        ].includes(s['x-component'])
      ) {
        _getAssociationAppends(s, str);
      }
      return pre;
    };

    // 使用 reduceProperties 遍历 schema
    reduceProperties(schema, customReducer, str);
  };
  const getAssociationAppends = () => {
    appends = new Set([]);
    _getAssociationAppends(fieldSchema.properties.form, '');
    appends = fillParentFields(appends);
    return { appends: [...appends] };
  };
  return { getAssociationAppends };
};
