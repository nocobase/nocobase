/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Field, Form } from '@formily/core';
import { ISchema, Schema, useFieldSchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import _ from 'lodash';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DataBlockInitializer,
  DataSource,
  SchemaInitializerItemType,
  useCollection,
  useCollectionManager,
  useDataSourceKey,
  useFormBlockContext,
} from '../';
import { useFormActiveFields } from '../block-provider/hooks/useFormActiveFields';
import { FieldOptions, useCollectionManager_deprecated, useCollection_deprecated } from '../collection-manager';
import { Collection, CollectionFieldOptions } from '../data-source/collection/Collection';
import { useDataSourceManager } from '../data-source/data-source/DataSourceManagerProvider';
import { isAssocField } from '../filter-provider/utils';
import { useActionContext, useCompile, useDesignable } from '../schema-component';
import { useSchemaTemplateManager } from '../schema-templates';
export const itemsMerge = (items1) => {
  return items1;
};

export const gridRowColWrap = (schema: ISchema) => {
  return {
    type: 'void',
    'x-component': 'Grid.Row',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Grid.Col',
        properties: {
          [schema.name || uid()]: schema,
        },
      },
    },
  };
};

export const removeTableColumn = (schema, cb) => {
  cb(schema.parent);
};

export const removeGridFormItem = (schema, cb) => {
  cb(schema, {
    removeParentsIfNoChildren: true,
    breakRemoveOn: {
      'x-component': 'Grid',
    },
  });
};

export const useRemoveGridFormItem = () => {
  const form = useForm();
  return (schema, cb) => {
    cb(schema, {
      removeParentsIfNoChildren: true,
      breakRemoveOn: {
        'x-component': 'Grid',
      },
    });
    delete form.values?.[schema.name];
  };
};

export const findTableColumn = (schema: Schema, key: string, action: string, deepth = 0) => {
  return schema.reduceProperties((buf, s) => {
    if (s[key] === action) {
      return s;
    }
    const c = s.reduceProperties((buf, s) => {
      if (s[key] === action) {
        return s;
      }
      return buf;
    });
    if (c) {
      return c;
    }
    return buf;
  });
};
const quickEditField = [
  'attachment',
  'textarea',
  'markdown',
  'json',
  'richText',
  'polygon',
  'circle',
  'point',
  'lineString',
];

export const useTableColumnInitializerFields = () => {
  const { name, currentFields = [] } = useCollection_deprecated();
  const { getInterface, getCollection } = useCollectionManager_deprecated();
  const fieldSchema = useFieldSchema();
  const isSubTable = fieldSchema['x-component'] === 'AssociationField.SubTable';
  const form = useForm();
  const isReadPretty = isSubTable ? form.readPretty : true;

  return currentFields
    .filter(
      (field) => field?.interface && field?.interface !== 'subTable' && !field?.isForeignKey && !field?.treeChildren,
    )
    .map((field) => {
      const interfaceConfig = getInterface(field.interface);
      const isFileCollection = field?.target && getCollection(field?.target)?.template === 'file';
      const isPreviewComponent = field?.uiSchema?.['x-component'] === 'Preview';

      const schema = {
        name: field.name,
        'x-collection-field': `${name}.${field.name}`,
        'x-component': 'CollectionField',
        'x-component-props': isFileCollection
          ? {
              fieldNames: {
                label: 'preview',
                value: 'id',
              },
            }
          : isPreviewComponent
            ? { size: 'small' }
            : {},
        'x-read-pretty': isReadPretty || field.uiSchema?.['x-read-pretty'],
        'x-decorator': isSubTable
          ? quickEditField.includes(field.interface) || isFileCollection
            ? 'QuickEdit'
            : 'FormItem'
          : null,
        'x-decorator-props': {
          labelStyle: {
            display: 'none',
          },
        },
      };
      // interfaceConfig?.schemaInitialize?.(schema, { field, readPretty: true, block: 'Table' });
      return {
        type: 'item',
        name: field.name,
        title: field?.uiSchema?.title || field.name,
        Component: 'TableCollectionFieldInitializer',
        find: findTableColumn,
        remove: removeTableColumn,
        schemaInitialize: (s) => {
          interfaceConfig?.schemaInitialize?.(s, {
            field,
            readPretty: isReadPretty,
            block: 'Table',
            targetCollection: getCollection(field.target),
          });
        },
        field,
        schema,
      } as SchemaInitializerItemType;
    });
};

export const useAssociatedTableColumnInitializerFields = () => {
  const { name, fields } = useCollection_deprecated();
  const { getInterface, getCollectionFields, getCollection } = useCollectionManager_deprecated();
  const groups = fields
    ?.filter((field) => {
      return ['o2o', 'oho', 'obo', 'm2o'].includes(field.interface);
    })
    ?.map((field) => {
      const subFields = getCollectionFields(field.target);
      const items = subFields
        // ?.filter((subField) => subField?.interface && !['o2o', 'oho', 'obo', 'o2m', 'm2o', 'subTable', 'linkTo'].includes(subField?.interface))
        ?.filter(
          (subField) => subField?.interface && !['subTable'].includes(subField?.interface) && !subField?.treeChildren,
        )
        ?.map((subField) => {
          const interfaceConfig = getInterface(subField.interface);
          const schema = {
            // type: 'string',
            name: `${field.name}.${subField.name}`,
            // title: subField?.uiSchema?.title || subField.name,

            'x-component': 'CollectionField',
            'x-read-pretty': true,
            'x-collection-field': `${name}.${field.name}.${subField.name}`,
            'x-component-props': {},
          };

          return {
            type: 'item',
            name: subField.name,
            title: subField?.uiSchema?.title || subField.name,
            Component: 'TableCollectionFieldInitializer',
            find: findTableColumn,
            remove: removeTableColumn,
            schemaInitialize: (s) => {
              interfaceConfig?.schemaInitialize?.(s, {
                field: subField,
                readPretty: true,
                block: 'Table',
                targetCollection: getCollection(field.target),
              });
            },
            field: subField,
            schema,
          } as SchemaInitializerItemType;
        });
      return {
        type: 'subMenu',
        name: field.uiSchema?.title,
        title: field.uiSchema?.title,
        children: items,
      } as SchemaInitializerItemType;
    });

  return groups;
};

export const useInheritsTableColumnInitializerFields = () => {
  const { name } = useCollection_deprecated();
  const { getInterface, getInheritCollections, getCollection, getParentCollectionFields } =
    useCollectionManager_deprecated();
  const fieldSchema = useFieldSchema();
  const isSubTable = fieldSchema['x-component'] === 'AssociationField.SubTable';
  const form = useForm();
  const isReadPretty = isSubTable ? form.readPretty : true;
  const inherits = getInheritCollections(name);
  return inherits?.map((v) => {
    const fields = getParentCollectionFields(v, name);
    const targetCollection = getCollection(v);
    return {
      [targetCollection?.title]: fields
        ?.filter((field) => {
          return field?.interface;
        })
        .map((k) => {
          const interfaceConfig = getInterface(k.interface);
          const isFileCollection = k?.target && getCollection(k?.target)?.template === 'file';
          const schema = {
            name: `${k.name}`,
            'x-component': 'CollectionField',
            'x-read-pretty': isReadPretty || k.uiSchema?.['x-read-pretty'],
            'x-collection-field': `${name}.${k.name}`,
            'x-component-props': isFileCollection
              ? {
                  fieldNames: {
                    label: 'preview',
                    value: 'id',
                  },
                }
              : {},
            'x-decorator': isSubTable
              ? quickEditField.includes(k.interface) || isFileCollection
                ? 'QuickEdit'
                : 'FormItem'
              : null,
            'x-decorator-props': {
              labelStyle: {
                display: 'none',
              },
            },
          };
          return {
            name: k?.uiSchema?.title || k.name,
            type: 'item',
            title: k?.uiSchema?.title || k.name,
            Component: 'TableCollectionFieldInitializer',
            find: findTableColumn,
            remove: removeTableColumn,
            schemaInitialize: (s) => {
              interfaceConfig?.schemaInitialize?.(s, {
                field: k,
                readPretty: true,
                block: 'Table',
                targetCollection: getCollection(k?.target),
              });
            },
            field: k,
            schema,
          } as SchemaInitializerItemType;
        }),
    };
  });
};

export const useFormItemInitializerFields = (options?: any) => {
  const { name, currentFields } = useCollection_deprecated();
  const { getInterface, getCollection } = useCollectionManager_deprecated();
  const form = useForm();
  const { readPretty = form.readPretty, block = 'Form' } = options || {};
  const { fieldSchema } = useActionContext();
  const action = fieldSchema?.['x-action'];

  return currentFields
    ?.filter((field) => field?.interface && !field?.isForeignKey && !field?.treeChildren)
    ?.map((field) => {
      const interfaceConfig = getInterface(field.interface);
      const targetCollection = getCollection(field.target);
      const isFileCollection = field?.target && getCollection(field?.target)?.template === 'file';
      const isAssociationField = targetCollection;
      const fieldNames = field?.uiSchema['x-component-props']?.['fieldNames'];
      const schema = {
        type: 'string',
        name: field.name,
        'x-toolbar': 'FormItemSchemaToolbar',
        'x-settings': 'fieldSettings:FormItem',
        'x-component': 'CollectionField',
        'x-decorator': 'FormItem',
        'x-collection-field': `${name}.${field.name}`,
        'x-component-props': isFileCollection
          ? {
              fieldNames: {
                label: 'preview',
                value: 'id',
              },
            }
          : isAssociationField && fieldNames
            ? {
                fieldNames: { ...fieldNames, label: targetCollection?.titleField || fieldNames.label },
              }
            : {},
        'x-read-pretty': field?.uiSchema?.['x-read-pretty'],
      };
      const resultItem = {
        type: 'item',
        name: field.name,
        title: field?.uiSchema?.title || field.name,
        Component: 'CollectionFieldInitializer',
        remove: removeGridFormItem,
        schemaInitialize: (s) => {
          interfaceConfig?.schemaInitialize?.(s, {
            field,
            block,
            readPretty,
            action,
            targetCollection,
          });
        },
        schema,
      } as SchemaInitializerItemType;
      if (block == 'Kanban') {
        resultItem['find'] = (schema: Schema, key: string, action: string) => {
          const s = findSchema(schema, 'x-component', block);
          return findSchema(s, key, action);
        };
      }

      return resultItem;
    });
};

// 筛选表单相关
export const useFilterFormItemInitializerFields = (options?: any) => {
  const { name, currentFields } = useCollection_deprecated();
  const { getInterface, getCollection } = useCollectionManager_deprecated();
  const form = useForm();
  const { readPretty = form.readPretty, block = 'FilterForm' } = options || {};
  const { snapshot, fieldSchema } = useActionContext();
  const action = fieldSchema?.['x-action'];

  return currentFields
    ?.filter((field) => field?.interface && !field?.isForeignKey && getInterface(field.interface)?.filterable)
    ?.map((field) => {
      const interfaceConfig = getInterface(field.interface);
      const targetCollection = getCollection(field.target);
      let schema = {
        type: 'string',
        name: field.name,
        required: false,
        // 'x-designer': 'FormItem.FilterFormDesigner',
        'x-toolbar': 'FormItemSchemaToolbar',
        'x-settings': 'fieldSettings:FilterFormItem',
        'x-component': 'CollectionField',
        'x-decorator': 'FormItem',
        'x-collection-field': `${name}.${field.name}`,
        'x-component-props': {},
      };
      if (isAssocField(field)) {
        schema = {
          type: 'string',
          name: `${field.name}`,
          required: false,
          // 'x-designer': 'FormItem.FilterFormDesigner',
          'x-toolbar': 'FormItemSchemaToolbar',
          'x-settings': 'fieldSettings:FilterFormItem',
          'x-component': 'CollectionField',
          'x-decorator': 'FormItem',
          'x-collection-field': `${name}.${field.name}`,
          'x-component-props': field.uiSchema?.['x-component-props'],
        };
      }
      const resultItem = {
        name: field?.uiSchema?.title || field.name,
        type: 'item',
        title: field?.uiSchema?.title || field.name,
        Component: 'CollectionFieldInitializer',
        remove: removeGridFormItem,
        schemaInitialize: (s) => {
          interfaceConfig?.schemaInitialize?.(s, {
            field,
            block,
            readPretty,
            action,
            targetCollection,
          });
        },
        schema,
      } as SchemaInitializerItemType;

      return resultItem;
    });
};

export const useAssociatedFormItemInitializerFields = (options?: any) => {
  const { name, fields } = useCollection_deprecated();
  const { getInterface, getCollectionFields, getCollection } = useCollectionManager_deprecated();
  const form = useForm();
  const { readPretty = form.readPretty, block = 'Form' } = options || {};
  const interfaces = block === 'Form' ? ['m2o'] : ['o2o', 'oho', 'obo', 'm2o'];
  const groups = fields
    ?.filter((field) => {
      return interfaces.includes(field.interface);
    })
    ?.map((field) => {
      const subFields = getCollectionFields(field.target);
      const items = subFields
        ?.filter(
          (subField) => subField?.interface && !['subTable'].includes(subField?.interface) && !subField.treeChildren,
        )
        ?.map((subField) => {
          const interfaceConfig = getInterface(subField.interface);
          const isFileCollection = field?.target && getCollection(field?.target)?.template === 'file';
          const schema = {
            type: 'string',
            name: `${field.name}.${subField.name}`,
            // 'x-designer': 'FormItem.Designer',
            'x-toolbar': 'FormItemSchemaToolbar',
            'x-settings': 'fieldSettings:FormItem',
            'x-component': 'CollectionField',
            'x-read-pretty': readPretty,
            'x-component-props': {
              'pattern-disable': block === 'Form' && readPretty,
              fieldNames: isFileCollection
                ? {
                    label: 'preview',
                    value: 'id',
                  }
                : undefined,
            },
            'x-decorator': 'FormItem',
            'x-collection-field': `${name}.${field.name}.${subField.name}`,
          };
          return {
            name: subField?.uiSchema?.title || subField.name,
            type: 'item',
            title: subField?.uiSchema?.title || subField.name,
            Component: 'CollectionFieldInitializer',
            remove: removeGridFormItem,
            schemaInitialize: (s) => {
              interfaceConfig?.schemaInitialize?.(s, {
                field: subField,
                block,
                readPretty,
                targetCollection: getCollection(field.target),
              });
            },
            schema,
          } as SchemaInitializerItemType;
        });

      return {
        type: 'subMenu',
        name: field.uiSchema?.title,
        title: field.uiSchema?.title,
        children: items,
      } as SchemaInitializerItemType;
    });
  return groups;
};

const getItem = (
  field: FieldOptions,
  schemaName: string,
  collectionName: string,
  getCollectionFields,
  processedCollections: string[],
) => {
  if (field.interface === 'm2o') {
    if (processedCollections.includes(field.target)) return null;

    const subFields = getCollectionFields(field.target);

    return {
      type: 'subMenu',
      name: schemaName,
      title: field.uiSchema?.title,
      children: subFields
        .map((subField) =>
          getItem(subField, `${schemaName}.${subField.name}`, collectionName, getCollectionFields, [
            ...processedCollections,
            field.target,
          ]),
        )
        .filter(Boolean),
    } as SchemaInitializerItemType;
  }

  if (isAssocField(field)) return null;

  const schema = {
    type: 'string',
    name: schemaName,
    // 'x-designer': 'FormItem.FilterFormDesigner',
    'x-toolbar': 'FormItemSchemaToolbar',
    'x-settings': 'fieldSettings:FilterFormItem',
    'x-designer-props': {
      // 在 useOperatorList 中使用，用于获取对应的操作符列表
      interface: field.interface,
    },
    'x-component': 'CollectionField',
    'x-read-pretty': false,
    'x-decorator': 'FormItem',
    'x-collection-field': `${collectionName}.${schemaName}`,
  };

  return {
    name: field.uiSchema?.title || field.name,
    type: 'item',
    title: field.uiSchema?.title || field.name,
    Component: 'CollectionFieldInitializer',
    remove: removeGridFormItem,
    schema,
  } as SchemaInitializerItemType;
};

// 筛选表单相关
export const useFilterAssociatedFormItemInitializerFields = () => {
  const { name, fields } = useCollection_deprecated();
  const { getCollectionFields } = useCollectionManager_deprecated();
  const interfaces = ['m2o'];
  const groups = fields
    ?.filter((field) => {
      return interfaces.includes(field.interface);
    })
    ?.map((field) => getItem(field, field.name, name, getCollectionFields, []));
  return groups;
};

export const useInheritsFormItemInitializerFields = (options?) => {
  const { name } = useCollection_deprecated();
  const { getInterface, getInheritCollections, getCollection, getParentCollectionFields } =
    useCollectionManager_deprecated();
  const inherits = getInheritCollections(name);
  const { snapshot } = useActionContext();
  const form = useForm();

  return inherits?.map((v) => {
    const fields = getParentCollectionFields(v, name);
    const { readPretty = form.readPretty, block = 'Form', component = 'CollectionField' } = options || {};
    const targetCollection = getCollection(v);
    return {
      [targetCollection?.title]: fields
        ?.filter((field) => field?.interface && !field?.isForeignKey)
        ?.map((field) => {
          const interfaceConfig = getInterface(field.interface);
          const targetCollection = getCollection(field.target);
          // const component =
          //   field.interface === 'o2m' && targetCollection?.template !== 'file' && !snapshot
          //     ? 'TableField'
          //     : 'CollectionField';
          const schema = {
            type: 'string',
            name: field.name,
            title: field?.uiSchema?.title || field.name,
            // 'x-designer': 'FormItem.Designer',
            'x-toolbar': 'FormItemSchemaToolbar',
            'x-settings': 'fieldSettings:FormItem',
            'x-component': component,
            'x-decorator': 'FormItem',
            'x-collection-field': `${name}.${field.name}`,
            'x-component-props': {},
            'x-read-pretty': field?.uiSchema?.['x-read-pretty'],
          };
          return {
            name: field?.uiSchema?.title || field.name,
            type: 'item',
            title: field?.uiSchema?.title || field.name,
            Component: 'CollectionFieldInitializer',
            remove: removeGridFormItem,
            schemaInitialize: (s) => {
              interfaceConfig?.schemaInitialize?.(s, {
                field,
                block,
                readPretty,
                targetCollection,
              });
            },
            schema,
          } as SchemaInitializerItemType;
        }),
    };
  });
};

// 筛选表单相关
export const useFilterInheritsFormItemInitializerFields = (options?) => {
  const { name } = useCollection_deprecated();
  const { getInterface, getInheritCollections, getCollection, getParentCollectionFields } =
    useCollectionManager_deprecated();
  const inherits = getInheritCollections(name);
  const { snapshot } = useActionContext();
  const form = useForm();

  return inherits?.map((v) => {
    const fields = getParentCollectionFields(v, name);
    const { readPretty = form.readPretty, block = 'Form' } = options || {};
    const targetCollection = getCollection(v);
    return {
      [targetCollection.title]: fields
        ?.filter((field) => field?.interface && !field?.isForeignKey && getInterface(field.interface)?.filterable)
        ?.map((field) => {
          const interfaceConfig = getInterface(field.interface);
          const targetCollection = getCollection(field.target);
          // const component =
          //   field.interface === 'o2m' && targetCollection?.template !== 'file' && !snapshot
          //     ? 'TableField'
          //     : 'CollectionField';
          const schema = {
            type: 'string',
            name: field.name,
            title: field?.uiSchema?.title || field.name,
            required: false,
            // 'x-designer': 'FormItem.FilterFormDesigner',
            'x-toolbar': 'FormItemSchemaToolbar',
            'x-settings': 'fieldSettings:FilterFormItem',
            'x-component': 'CollectionField',
            'x-decorator': 'FormItem',
            'x-collection-field': `${name}.${field.name}`,
            'x-component-props': {},
            'x-read-pretty': field?.uiSchema?.['x-read-pretty'],
          };
          return {
            name: field?.uiSchema?.title || field.name,
            type: 'item',
            title: field?.uiSchema?.title || field.name,
            Component: 'CollectionFieldInitializer',
            remove: removeGridFormItem,
            schemaInitialize: (s) => {
              interfaceConfig?.schemaInitialize?.(s, {
                field,
                block,
                readPretty,
                targetCollection,
              });
            },
            schema,
          } as SchemaInitializerItemType;
        }),
    };
  });
};
export const useCustomFormItemInitializerFields = (options?: any) => {
  const { name, currentFields } = useCollection_deprecated();
  const { getInterface, getCollection } = useCollectionManager_deprecated();
  const form = useForm();
  const { readPretty = form.readPretty, block = 'Form' } = options || {};
  const remove = useRemoveGridFormItem();
  return currentFields
    ?.filter((field) => {
      return (
        field?.interface &&
        !field?.uiSchema?.['x-read-pretty'] &&
        field.interface !== 'snapshot' &&
        field.type !== 'sequence'
      );
    })
    ?.map((field) => {
      const interfaceConfig = getInterface(field.interface);
      const schema = {
        type: 'string',
        name: field.name,
        title: field?.uiSchema?.title || field.name,
        // 'x-designer': 'FormItem.Designer',
        'x-toolbar': 'FormItemSchemaToolbar',
        'x-settings': 'fieldSettings:FormItem',
        'x-component': 'AssignedField',
        'x-decorator': 'FormItem',
        'x-collection-field': `${name}.${field.name}`,
      };
      return {
        name: field?.uiSchema?.title || field.name,
        type: 'item',
        title: field?.uiSchema?.title || field.name,
        Component: 'CollectionFieldInitializer',
        remove: remove,
        schemaInitialize: (s) => {
          interfaceConfig?.schemaInitialize?.(s, {
            field,
            block,
            readPretty,
            targetCollection: getCollection(field.target),
          });
        },
        schema,
      } as SchemaInitializerItemType;
    });
};

const findSchema = (schema: Schema, key: string, action: string) => {
  if (!Schema.isSchemaInstance(schema)) return null;
  return schema.reduceProperties((buf, s) => {
    if (s[key] === action) {
      return s;
    }
    if (s['x-component'] !== 'Action.Container' && s['x-component'] !== 'AssociationField.Viewer') {
      const c = findSchema(s, key, action);
      if (c) {
        return c;
      }
    }

    return buf;
  });
};

const removeSchema = (schema, cb) => {
  return cb(schema);
};

const recursiveParent = (schema: Schema) => {
  if (!schema.parent) return null;

  if (schema.parent['x-initializer']) return schema.parent;

  return recursiveParent(schema.parent);
};

export const useCurrentSchema = (action: string, key: string, find = findSchema, rm = removeSchema) => {
  const { removeActiveFieldName } = useFormActiveFields() || {};
  const { form }: { form?: Form } = useFormBlockContext();
  let fieldSchema = useFieldSchema();
  if (!fieldSchema?.['x-initializer'] && fieldSchema?.['x-decorator'] === 'FormItem') {
    const recursiveInitializerSchema = recursiveParent(fieldSchema);
    if (recursiveInitializerSchema) {
      fieldSchema = recursiveInitializerSchema;
    }
  }
  const { remove } = useDesignable();
  const schema = find(fieldSchema, key, action);
  return {
    schema,
    exists: !!schema,
    remove() {
      removeActiveFieldName?.(schema.name);
      form?.query(new RegExp(`${schema.parent.name}.${schema.name}$`)).forEach((field: Field) => {
        // 如果字段被删掉，那么在提交的时候不应该提交这个字段
        field.setValue?.(undefined);
      });
      schema && rm(schema, remove);
    },
  };
};

/**
 * @deprecated
 * 待统一区块的创建之后，将废弃该方法
 */
export const useRecordCollectionDataSourceItems = (
  componentName,
  item = null,
  collectionName = null,
  resourceName = null,
) => {
  const { t } = useTranslation();
  const collection = useCollection_deprecated();
  const { getTemplatesByCollection } = useSchemaTemplateManager();
  const templates = getTemplatesByCollection(collection.dataSource, collectionName || collection.name)
    .filter((template) => {
      return componentName && template.componentName === componentName;
    })
    .filter((template) => {
      return ['FormItem', 'ReadPrettyFormItem'].includes(componentName) || template.resourceName === resourceName;
    });
  if (!templates.length) {
    return [];
  }
  const index = 0;
  return [
    {
      key: `${collectionName || componentName}_table_blank`,
      type: 'item',
      name: collection.name,
      title: t('Blank block'),
      item,
    },
    {
      type: 'divider',
    },
    {
      key: `${collectionName || componentName}_table_subMenu_${index}_copy`,
      type: 'subMenu',
      name: 'copy',
      title: t('Duplicate template'),
      children: templates.map((template) => {
        const templateName = ['FormItem', 'ReadPrettyFormItem'].includes(template?.componentName)
          ? `${template?.name} ${t('(Fields only)')}`
          : template?.name;
        return {
          type: 'item',
          mode: 'copy',
          name: collection.name,
          template,
          item,
          title: templateName || t('Untitled'),
        };
      }),
    },
    {
      key: `${collectionName || componentName}_table_subMenu_${index}_ref`,
      type: 'subMenu',
      name: 'ref',
      title: t('Reference template'),
      children: templates.map((template) => {
        const templateName = ['FormItem', 'ReadPrettyFormItem'].includes(template?.componentName)
          ? `${template?.name} ${t('(Fields only)')}`
          : template?.name;
        return {
          type: 'item',
          mode: 'reference',
          name: collection.name,
          template,
          item,
          title: templateName || t('Untitled'),
        };
      }),
    },
  ];
};

export const useCollectionDataSourceItems = ({
  componentName,
  filter = () => true,
  onlyCurrentDataSource = false,
  showAssociationFields,
  filterDataSource,
  dataBlockInitializerProps,
  hideOtherRecordsInPopup,
  onClick,
  filterOtherRecordsCollection,
  currentText,
  otherText,
}: {
  componentName;
  filter?: (options: { collection?: Collection; associationField?: CollectionFieldOptions }) => boolean;
  onlyCurrentDataSource?: boolean;
  showAssociationFields?: boolean;
  filterDataSource?: (dataSource?: DataSource) => boolean;
  dataBlockInitializerProps?: any;
  /**
   * 隐藏弹窗中的 Other records 选项
   */
  hideOtherRecordsInPopup?: boolean;
  onClick?: (options: any) => void;
  /**
   * 用来筛选弹窗中的 “Other records” 选项中的数据表
   */
  filterOtherRecordsCollection?: (collection: Collection) => boolean;
  currentText?: string;
  otherText?: string;
}) => {
  const { t } = useTranslation();
  const dm = useDataSourceManager();
  const dataSourceKey = useDataSourceKey();
  const collection = useCollection();
  const associationFields = useAssociationFields({ componentName, filterCollections: filter, showAssociationFields });

  let allCollections = dm.getAllCollections({
    filterCollection: (collection) => {
      if (onlyCurrentDataSource && collection.dataSource !== dataSourceKey) {
        return false;
      }
      return filter({ collection });
    },
    filterDataSource,
  });
  if (onlyCurrentDataSource) {
    allCollections = allCollections.filter((collection) => collection.key === dataSourceKey);
  }

  const { getTemplatesByCollection } = useSchemaTemplateManager();

  const noAssociationMenu = useMemo(() => {
    return allCollections.map(({ key, displayName, collections }) => ({
      name: key,
      label: displayName,
      type: 'subMenu',
      children: [
        ...getChildren({
          collections,
          componentName,
          searchValue: '',
          dataSource: key,
          getTemplatesByCollection,
          t,
        }).sort((item) => {
          // fix https://nocobase.height.app/T-3551
          const inherits = _.toArray(collection?.inherits || []);
          if (item.name === collection?.name || inherits.some((inheritName) => inheritName === item.name)) return -1;
        }),
      ],
    }));
  }, [allCollections, collection?.inherits, collection?.name, componentName, getTemplatesByCollection, t]);

  // https://nocobase.height.app/T-3821
  // showAssociationFields 的值是固定不变的，所以在 if 语句里使用 hooks 是安全的
  if (showAssociationFields) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useMemo(() => {
      const currentRecord = {
        name: 'currentRecord',
        collectionName: collection.name,
        dataSource: collection.dataSource,
        Component: DataBlockInitializer,
        // 目的是使点击无效
        onClick() {},
        componentProps: {
          ...dataBlockInitializerProps,
          icon: null,
          title: currentText || t('Current record'),
          name: 'currentRecord',
          hideSearch: false,
          hideChildrenIfSingleCollection: true,
          items: noAssociationMenu,
        },
      };
      const associationRecords = {
        name: 'associationRecords',
        Component: DataBlockInitializer,
        // 目的是使点击无效
        onClick() {},
        componentProps: {
          ...dataBlockInitializerProps,
          icon: null,
          title: t('Associated records'),
          name: 'associationRecords',
          hideSearch: false,
          items: [
            {
              name: 'associationFields',
              label: t('Association fields'),
              type: 'subMenu', // 这里套一层 subMenu 是因为 DataBlockInitializer 组件需要这样的数据结构，其实这层 subMenu 最终是不会渲染出来的
              children: associationFields,
            },
          ],
        },
      };
      const componentTypeMap = {
        ReadPrettyFormItem: 'Details',
      };
      const otherRecords = {
        name: 'otherRecords',
        Component: DataBlockInitializer,
        // 目的是使点击无效
        onClick() {},
        componentProps: {
          icon: null,
          title: otherText || t('Other records'),
          name: 'otherRecords',
          showAssociationFields: false,
          onlyCurrentDataSource: false,
          hideChildrenIfSingleCollection: false,
          onCreateBlockSchema: dataBlockInitializerProps.onCreateBlockSchema,
          componentType: componentTypeMap[componentName] || componentName,
          filter({ collection, associationField }) {
            if (filterOtherRecordsCollection) {
              return filterOtherRecordsCollection(collection);
            }
            return true;
          },
          onClick(options) {
            onClick({ ...options, fromOthersInPopup: true });
          },
        },
      };

      let children;

      const _associationRecords = associationFields.length ? associationRecords : null;
      if (noAssociationMenu[0].children.length && associationFields.length) {
        if (hideOtherRecordsInPopup) {
          children = [currentRecord, _associationRecords];
        } else {
          children = [currentRecord, _associationRecords, otherRecords];
        }
      } else if (noAssociationMenu[0].children.length) {
        if (hideOtherRecordsInPopup) {
          // 当可选数据表只有一个时，实现只点击一次区块 menu 就能创建区块
          if (noAssociationMenu[0].children.length <= 1) {
            noAssociationMenu[0].children = (noAssociationMenu[0].children[0]?.children as any) || [];
            return noAssociationMenu;
          }
          children = [currentRecord];
        } else {
          children = [currentRecord, otherRecords];
        }
      } else {
        if (hideOtherRecordsInPopup) {
          children = [_associationRecords];
        } else {
          children = [_associationRecords, otherRecords];
        }
      }

      return [
        {
          name: 'records',
          label: t('Records'),
          type: 'subMenu',
          children: children.filter(Boolean),
        },
      ];
    }, [
      associationFields,
      collection.dataSource,
      collection.name,
      componentName,
      dataBlockInitializerProps,
      filterOtherRecordsCollection,
      hideOtherRecordsInPopup,
      noAssociationMenu,
      onClick,
      t,
    ]);
  }

  return noAssociationMenu;
};

/**
 * @deprecated
 * 已弃用，请使用 createDetailsUISchema 和 createDetailsWithPaginationUISchema 替代
 * @param options
 * @returns
 */
export const createDetailsBlockSchema = (options: {
  collection: string;
  dataSource: string;
  rowKey?: string;
  formItemInitializers?: string;
  actionInitializers?: string;
  association?: string;
  template?: any;
  settings?: string;
  action?: string;
  [key: string]: any;
}) => {
  const {
    formItemInitializers = 'details:configureFields',
    actionInitializers = 'detailsWithPaging:configureActions',
    collection,
    dataSource,
    association,
    template,
    settings,
    action = 'list',
    ...others
  } = options;
  const resourceName = association || collection;
  const schema: ISchema = {
    type: 'void',
    'x-acl-action': action === 'get' ? `${resourceName}:get` : `${resourceName}:view`,
    'x-decorator': 'DetailsBlockProvider',
    'x-decorator-props': {
      dataSource,
      collection,
      association,
      readPretty: true,
      action,
      ...(action === 'list'
        ? {
            params: {
              pageSize: 1,
            },
          }
        : {}),
      ...others,
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': settings,
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Details',
        'x-use-component-props': 'useDetailsBlockProps',
        'x-read-pretty': true,
        properties: {
          [uid()]: {
            type: 'void',
            'x-initializer': actionInitializers,
            'x-component': 'ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 24,
              },
            },
            properties: {},
          },
          grid: template || {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': formItemInitializers,
            properties: {},
          },
          ...(action === 'list'
            ? {
                pagination: {
                  type: 'void',
                  'x-component': 'Pagination',
                  'x-use-component-props': 'useDetailsPaginationProps',
                },
              }
            : {}),
        },
      },
    },
  };
  return schema;
};

/**
 * @deprecated
 * 已弃用，请使用 createCreateFormBlockUISchema 或者 createEditFormBlockUISchema 替代
 * @param options
 * @returns
 */
export const createFormBlockSchema = (options: {
  formItemInitializers?: string;
  actionInitializers?: string;
  collection: string;
  resource?: string;
  dataSource?: string;
  association?: string;
  action?: string;
  actions?: Record<string, any>;
  template?: any;
  title?: string;
  settings?: any;
  'x-designer'?: string;
  [key: string]: any;
}) => {
  const {
    formItemInitializers = 'form:configureFields',
    actionInitializers = 'createForm:configureActions',
    collection,
    resource,
    dataSource,
    association,
    action,
    actions = {},
    'x-designer': designer = 'FormV2.Designer',
    template,
    title,
    settings,
    ...others
  } = options;
  const resourceName = resource || association || collection;
  const schema: ISchema = {
    type: 'void',
    'x-acl-action-props': {
      skipScopeCheck: !action,
    },
    'x-acl-action': action ? `${resourceName}:update` : `${resourceName}:create`,
    'x-decorator': 'FormBlockProvider',
    'x-decorator-props': {
      ...others,
      action,
      dataSource,
      resource: resourceName,
      collection,
      association,
    },
    'x-toolbar': 'BlockSchemaToolbar',
    ...(settings ? { 'x-settings': settings } : { 'x-designer': designer }),
    'x-component': 'CardItem',
    'x-component-props': {
      title,
    },
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'FormV2',
        'x-use-component-props': 'useFormBlockProps',
        properties: {
          grid: template || {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': formItemInitializers,
            properties: {},
          },
          [uid()]: {
            type: 'void',
            'x-initializer': actionInitializers,
            'x-component': 'ActionBar',
            'x-component-props': {
              layout: 'one-column',
              style: {
                marginTop: 24,
              },
            },
            properties: actions,
          },
        },
      },
    },
  };
  return schema;
};

/**
 * @deprecated
 * 已弃用，可以使用 createDetailsBlockSchema 替换
 * @param options
 * @returns
 */
export const createReadPrettyFormBlockSchema = (options) => {
  const {
    formItemInitializers = 'details:configureFields',
    actionInitializers = 'details:configureActions',
    collection,
    association,
    dataSource,
    resource,
    template,
    settings,
    ...others
  } = options;
  const resourceName = resource || association || collection;
  const schema: ISchema = {
    type: 'void',
    'x-acl-action': `${resourceName}:get`,
    'x-decorator': 'FormBlockProvider',
    'x-decorator-props': {
      resource: resourceName,
      collection,
      association,
      dataSource,
      readPretty: true,
      action: 'get',
      useParams: '{{ useParamsFromRecord }}',
      ...others,
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': settings,
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'FormV2',
        'x-use-component-props': 'useFormBlockProps',
        'x-read-pretty': true,
        properties: {
          [uid()]: {
            type: 'void',
            'x-initializer': actionInitializers,
            'x-component': 'ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 24,
              },
            },
            properties: {},
          },
          grid: template || {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': formItemInitializers,
            properties: {},
          },
        },
      },
    },
  };

  return schema;
};

/**
 * @deprecated
 * 已弃用，可以使用 createTableBlockUISchema 替换
 * @param options
 * @returns
 */
export const createTableBlockSchema = (options) => {
  const {
    collection,
    rowKey,
    tableActionInitializers,
    tableColumnInitializers,
    tableActionColumnInitializers,
    tableBlockProvider,
    disableTemplate,
    dataSource,
    blockType,
    pageSize = 20,
    ...others
  } = options;
  const schema: ISchema = {
    type: 'void',
    'x-decorator': tableBlockProvider ?? 'TableBlockProvider',
    'x-acl-action': `${collection}:list`,
    'x-decorator-props': {
      collection,
      dataSource,
      action: 'list',
      params: {
        pageSize,
      },
      rowKey,
      showIndex: true,
      dragSort: false,
      disableTemplate: disableTemplate ?? false,
      blockType,
      ...others,
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:table',
    'x-component': 'CardItem',
    'x-filter-targets': [],
    properties: {
      actions: {
        type: 'void',
        'x-initializer': tableActionInitializers ?? 'table:configureActions',
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 'var(--nb-spacing)',
          },
        },
        properties: {},
      },
      [uid()]: {
        type: 'array',
        'x-initializer': tableColumnInitializers ?? 'table:configureColumns',
        'x-component': 'TableV2',
        'x-use-component-props': 'useTableBlockProps',
        'x-component-props': {
          rowKey: 'id',
          rowSelection: {
            type: 'checkbox',
          },
        },
        properties: {
          actions: {
            type: 'void',
            title: '{{ t("Actions") }}',
            'x-action-column': 'actions',
            'x-decorator': 'TableV2.Column.ActionBar',
            'x-component': 'TableV2.Column',
            'x-designer': 'TableV2.ActionColumnDesigner',
            'x-initializer': tableActionColumnInitializers ?? 'table:configureItemActions',
            properties: {
              [uid()]: {
                type: 'void',
                'x-decorator': 'DndContext',
                'x-component': 'Space',
                'x-component-props': {},
                properties: {},
              },
            },
          },
        },
      },
    },
  };
  // console.log(JSON.stringify(schema, null, 2));
  return schema;
};

const getChildren = ({
  collections,
  dataSource,
  componentName,
  searchValue,
  getTemplatesByCollection,
  t,
}: {
  collections: any[];
  componentName: string;
  searchValue: string;
  dataSource: string;
  getTemplatesByCollection: (dataSource: string, collectionName: string, resourceName?: string) => any;
  t;
}) => {
  return collections
    ?.filter((item) => {
      if (item.inherit) {
        return false;
      }
      if (!item.filterTargetKey) {
        return false;
      } else if (
        ['Kanban', 'FormItem'].includes(componentName) &&
        ((item.template === 'view' && !item.writableView) || item.template === 'sql')
      ) {
        return false;
      } else if (item.template === 'file' && ['Kanban', 'FormItem', 'Calendar'].includes(componentName)) {
        return false;
      } else {
        const title = item.title || item.tableName;
        if (!title) {
          return false;
        }
        return title.toUpperCase().includes(searchValue.toUpperCase()) && !(item?.isThrough && item?.autoCreate);
      }
    })
    ?.map((item, index) => {
      const title = item.title || item.tableName || item.label;
      const templates = getTemplatesByCollection(dataSource, item.name).filter((template) => {
        return (
          componentName &&
          template.componentName === componentName &&
          (['FormItem', 'ReadPrettyFormItem'].includes(componentName) ||
            !template.resourceName ||
            template.resourceName === item.name)
        );
      });
      if (!templates.length) {
        return {
          type: 'item',
          name: item.name,
          title,
          dataSource,
        };
      }
      return {
        key: `${componentName}_table_subMenu_${index}`,
        type: 'subMenu',
        name: `${item.name}_${index}`,
        title,
        dataSource,
        children: [
          {
            type: 'item',
            name: item.name,
            dataSource,
            title: t('Blank block'),
          },
          {
            type: 'divider',
          },
          {
            key: `${componentName}_table_subMenu_${index}_copy`,
            type: 'subMenu',
            name: 'copy',
            dataSource,
            title: t('Duplicate template'),
            children: templates.map((template) => {
              const templateName = ['FormItem', 'ReadPrettyFormItem'].includes(template?.componentName)
                ? `${template?.name} ${t('(Fields only)')}`
                : template?.name;
              return {
                type: 'item',
                mode: 'copy',
                name: item.name,
                template,
                dataSource,
                title: templateName || t('Untitled'),
              };
            }),
          },
          {
            key: `${componentName}_table_subMenu_${index}_ref`,
            type: 'subMenu',
            name: 'ref',
            dataSource,
            title: t('Reference template'),
            children: templates.map((template) => {
              const templateName = ['FormItem', 'ReadPrettyFormItem'].includes(template?.componentName)
                ? `${template?.name} ${t('(Fields only)')}`
                : template?.name;
              return {
                type: 'item',
                mode: 'reference',
                name: item.name,
                template,
                dataSource,
                title: templateName || t('Untitled'),
              };
            }),
          },
        ],
      };
    });
};

function useAssociationFields({
  componentName,
  filterCollections,
  showAssociationFields,
}: {
  componentName: string;
  filterCollections: (options: { collection?: Collection; associationField?: CollectionFieldOptions }) => boolean;
  showAssociationFields?: boolean;
}) {
  const fieldSchema = useFieldSchema();
  const { getCollectionFields } = useCollectionManager_deprecated();
  const collection = useCollection_deprecated();
  const cm = useCollectionManager();
  const dataSource = useDataSourceKey();
  const { getTemplatesByCollection } = useSchemaTemplateManager();
  const { t } = useTranslation();
  const compile = useCompile();

  return useMemo(() => {
    if (!showAssociationFields) {
      return [];
    }

    let fields: CollectionFieldOptions[] = [];

    if (fieldSchema['x-initializer']) {
      fields = collection.fields;
    } else {
      const collection = recursiveParent(fieldSchema.parent);
      if (collection) {
        fields = getCollectionFields(collection);
      }
    }

    return fields
      .filter((field) => ['linkTo', 'subTable', 'o2m', 'm2m', 'obo', 'oho', 'o2o', 'm2o'].includes(field.interface))
      .filter((field) => filterCollections({ associationField: field }))
      .map((field, index) => {
        const title = compile(field.uiSchema.title || field.name);
        const templates = getTemplatesByCollection(dataSource, field.target).filter((template) => {
          // 针对弹窗中的详情区块
          if (componentName === 'ReadPrettyFormItem') {
            if (['hasOne', 'belongsTo'].includes(field.type)) {
              return template.componentName === 'ReadPrettyFormItem';
            } else {
              return template.componentName === 'Details';
            }
          }

          return (
            componentName &&
            template.componentName === componentName &&
            (['FormItem', 'ReadPrettyFormItem'].includes(componentName) ||
              !template.resourceName ||
              template.resourceName === `${field.collectionName}.${field.name}`)
          );
        });
        if (!templates.length) {
          return {
            type: 'item',
            name: `${field.collectionName}.${field.name}`,
            collectionName: field.target,
            title,
            dataSource,
            associationField: field,
          };
        }
        return {
          key: `associationFiled_${componentName}_table_subMenu_${index}`,
          type: 'subMenu',
          name: `${field.target}_${index}`,
          title,
          dataSource,
          children: [
            {
              type: 'item',
              name: `${field.collectionName}.${field.name}`,
              collectionName: field.target,
              dataSource,
              title: t('Blank block'),
              associationField: field,
            },
            {
              type: 'divider',
            },
            {
              key: `associationFiled_${componentName}_table_subMenu_${index}_copy`,
              type: 'subMenu',
              name: 'copy',
              dataSource,
              title: t('Duplicate template'),
              children: templates.map((template) => {
                const templateName = ['FormItem', 'ReadPrettyFormItem'].includes(template?.componentName)
                  ? `${template?.name} ${t('(Fields only)')}`
                  : template?.name;
                return {
                  type: 'item',
                  mode: 'copy',
                  name: `${field.collectionName}.${field.name}`,
                  collectionName: field.target,
                  template,
                  dataSource,
                  title: templateName || t('Untitled'),
                  associationField: field,
                };
              }),
            },
            {
              key: `associationFiled_${componentName}_table_subMenu_${index}_ref`,
              type: 'subMenu',
              name: 'ref',
              dataSource,
              title: t('Reference template'),
              children: templates.map((template) => {
                const templateName = ['FormItem', 'ReadPrettyFormItem'].includes(template?.componentName)
                  ? `${template?.name} ${t('(Fields only)')}`
                  : template?.name;
                return {
                  type: 'item',
                  mode: 'reference',
                  name: `${field.collectionName}.${field.name}`,
                  collectionName: field.target,
                  template,
                  dataSource,
                  title: templateName || t('Untitled'),
                  associationField: field,
                };
              }),
            },
          ],
        };
      });
  }, [
    collection.fields,
    compile,
    componentName,
    dataSource,
    fieldSchema,
    filterCollections,
    getCollectionFields,
    getTemplatesByCollection,
    showAssociationFields,
    t,
  ]);
}
