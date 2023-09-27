import { ISchema, Schema, useFieldSchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BlockRequestContext, SchemaInitializerItemOptions } from '..';
import { CollectionFieldOptions, FieldOptions, useCollection, useCollectionManager } from '../collection-manager';
import { isAssocField } from '../filter-provider/utils';
import { useActionContext, useDesignable } from '../schema-component';
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
  const { name, currentFields = [] } = useCollection();
  const { getInterface, getCollection } = useCollectionManager();
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
        title: field?.uiSchema?.title || field.name,
        component: 'TableCollectionFieldInitializer',
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
      } as SchemaInitializerItemOptions;
    });
};

export const useAssociatedTableColumnInitializerFields = () => {
  const { name, fields } = useCollection();
  const { getInterface, getCollectionFields, getCollection } = useCollectionManager();
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
            title: subField?.uiSchema?.title || subField.name,
            component: 'TableCollectionFieldInitializer',
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
          } as SchemaInitializerItemOptions;
        });
      return {
        type: 'subMenu',
        title: field.uiSchema?.title,
        children: items,
      } as SchemaInitializerItemOptions;
    });

  return groups;
};

export const useInheritsTableColumnInitializerFields = () => {
  const { name } = useCollection();
  const { getInterface, getInheritCollections, getCollection, getParentCollectionFields } = useCollectionManager();
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
            type: 'item',
            title: k?.uiSchema?.title || k.name,
            component: 'TableCollectionFieldInitializer',
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
          } as SchemaInitializerItemOptions;
        }),
    };
  });
};

export const useFormItemInitializerFields = (options?: any) => {
  const { name, currentFields, template } = useCollection();
  const { getInterface, getCollection } = useCollectionManager();
  const form = useForm();
  const { readPretty = form.readPretty, block = 'Form' } = options || {};
  const { snapshot, fieldSchema } = useActionContext();
  const action = fieldSchema?.['x-action'];
  return currentFields
    ?.filter((field) => field?.interface && !field?.isForeignKey && !field?.treeChildren)
    ?.map((field) => {
      const interfaceConfig = getInterface(field.interface);
      const targetCollection = getCollection(field.target);
      const isFileCollection = field?.target && getCollection(field?.target)?.template === 'file';
      // const component =
      //   field.interface === 'o2m' && targetCollection?.template !== 'file' && !snapshot
      //     ? 'TableField'
      //     : 'CollectionField';
      const schema = {
        type: 'string',
        name: field.name,
        'x-designer': 'FormItem.Designer',
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
          : {},
        'x-read-pretty': field?.uiSchema?.['x-read-pretty'],
      };
      // interfaceConfig?.schemaInitialize?.(schema, { field, block: 'Form', readPretty: form.readPretty });
      const resultItem = {
        type: 'item',
        title: field?.uiSchema?.title || field.name,
        component: 'CollectionFieldInitializer',
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
      } as SchemaInitializerItemOptions;
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
  const { name, currentFields } = useCollection();
  const { getInterface, getCollection } = useCollectionManager();
  const form = useForm();
  const { readPretty = form.readPretty, block = 'FilterForm' } = options || {};
  const { snapshot, fieldSchema } = useActionContext();
  const action = fieldSchema?.['x-action'];

  return currentFields
    ?.filter((field) => field?.interface && !field?.isForeignKey && getInterface(field.interface)?.filterable)
    ?.map((field) => {
      const interfaceConfig = getInterface(field.interface);
      const targetCollection = getCollection(field.target);
      // const component =
      //   field.interface === 'o2m' && targetCollection?.template !== 'file' && !snapshot
      //     ? 'TableField'
      //     : 'CollectionField';
      let schema = {
        type: 'string',
        name: field.name,
        required: false,
        'x-designer': 'FormItem.FilterFormDesigner',
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
          'x-designer': 'FormItem.FilterFormDesigner',
          'x-component': 'CollectionField',
          'x-decorator': 'FormItem',
          'x-collection-field': `${name}.${field.name}`,
          'x-component-props': field.uiSchema?.['x-component-props'],
        };
      }
      const resultItem = {
        type: 'item',
        title: field?.uiSchema?.title || field.name,
        component: 'CollectionFieldInitializer',
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
      } as SchemaInitializerItemOptions;

      return resultItem;
    });
};

export const useAssociatedFormItemInitializerFields = (options?: any) => {
  const { name, fields } = useCollection();
  const { getInterface, getCollectionFields, getCollection } = useCollectionManager();
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
            'x-designer': 'FormItem.Designer',
            'x-component': 'CollectionField',

            'x-read-pretty': readPretty,
            'x-component-props': {
              'pattern-disable': block === 'Form' && readPretty,
              fieldNames: {
                label: isFileCollection ? 'preview' : 'id',
                value: 'id',
              },
            },
            'x-decorator': 'FormItem',
            'x-collection-field': `${name}.${field.name}.${subField.name}`,
          };
          return {
            type: 'item',
            title: subField?.uiSchema?.title || subField.name,
            component: 'CollectionFieldInitializer',
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
          } as SchemaInitializerItemOptions;
        });

      return {
        type: 'subMenu',
        title: field.uiSchema?.title,
        children: items,
      } as SchemaInitializerItemOptions;
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
      title: field.uiSchema?.title,
      children: subFields
        .map((subField) =>
          // 使用 | 分隔，是为了防止 form.values 中出现 { a: { b: 1 } } 的情况
          // 使用 | 分隔后，form.values 中会出现 { 'a|b': 1 } 的情况，这种情况下
          // 就可以知道该字段是一个关系字段中的输入框，进而特殊处理
          getItem(subField, `${schemaName}.${subField.name}`, collectionName, getCollectionFields, [
            ...processedCollections,
            field.target,
          ]),
        )
        .filter(Boolean),
    } as SchemaInitializerItemOptions;
  }

  if (isAssocField(field)) return null;

  const schema = {
    type: 'string',
    name: schemaName,
    'x-designer': 'FormItem.FilterFormDesigner',
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
    type: 'item',
    title: field.uiSchema?.title || field.name,
    component: 'CollectionFieldInitializer',
    remove: removeGridFormItem,
    schema,
  } as SchemaInitializerItemOptions;
};

// 筛选表单相关
export const useFilterAssociatedFormItemInitializerFields = () => {
  const { name, fields } = useCollection();
  const { getCollectionFields } = useCollectionManager();
  const interfaces = ['m2o'];
  const groups = fields
    ?.filter((field) => {
      return interfaces.includes(field.interface);
    })
    ?.map((field) => getItem(field, field.name, name, getCollectionFields, []));
  return groups;
};

export const useInheritsFormItemInitializerFields = (options?) => {
  const { name } = useCollection();
  const { getInterface, getInheritCollections, getCollection, getParentCollectionFields } = useCollectionManager();
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
            'x-designer': 'FormItem.Designer',
            'x-component': component,
            'x-decorator': 'FormItem',
            'x-collection-field': `${name}.${field.name}`,
            'x-component-props': {},
            'x-read-pretty': field?.uiSchema?.['x-read-pretty'],
          };
          return {
            type: 'item',
            title: field?.uiSchema?.title || field.name,
            component: 'CollectionFieldInitializer',
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
          } as SchemaInitializerItemOptions;
        }),
    };
  });
};

// 筛选表单相关
export const useFilterInheritsFormItemInitializerFields = (options?) => {
  const { name } = useCollection();
  const { getInterface, getInheritCollections, getCollection, getParentCollectionFields } = useCollectionManager();
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
            'x-designer': 'FormItem.FilterFormDesigner',
            'x-component': 'CollectionField',
            'x-decorator': 'FormItem',
            'x-collection-field': `${name}.${field.name}`,
            'x-component-props': {},
            'x-read-pretty': field?.uiSchema?.['x-read-pretty'],
          };
          return {
            type: 'item',
            title: field?.uiSchema?.title || field.name,
            component: 'CollectionFieldInitializer',
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
          } as SchemaInitializerItemOptions;
        }),
    };
  });
};
export const useCustomFormItemInitializerFields = (options?: any) => {
  const { name, currentFields } = useCollection();
  const { getInterface, getCollection } = useCollectionManager();
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
        'x-designer': 'FormItem.Designer',
        'x-component': 'AssignedField',
        'x-decorator': 'FormItem',
        'x-collection-field': `${name}.${field.name}`,
      };
      return {
        type: 'item',
        title: field?.uiSchema?.title || field.name,
        component: 'CollectionFieldInitializer',
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
      } as SchemaInitializerItemOptions;
    });
};

export const useCustomBulkEditFormItemInitializerFields = (options?: any) => {
  const { name, fields } = useCollection();
  const { getInterface, getCollection } = useCollectionManager();
  const form = useForm();
  const { readPretty = form.readPretty, block = 'Form' } = options || {};
  const remove = useRemoveGridFormItem();
  const filterFields = useMemo(
    () =>
      fields
        ?.filter((field) => {
          return (
            field?.interface &&
            !field?.uiSchema?.['x-read-pretty'] &&
            field.interface !== 'snapshot' &&
            field.type !== 'sequence'
          );
        })
        .map((field) => {
          const interfaceConfig = getInterface(field.interface);
          const schema = {
            type: 'string',
            name: field.name,
            title: field?.uiSchema?.title || field.name,
            'x-designer': 'FormItem.Designer',
            'x-component': 'BulkEditField',
            'x-decorator': 'FormItem',
            'x-collection-field': `${name}.${field.name}`,
          };
          return {
            type: 'item',
            title: field?.uiSchema?.title || field.name,
            component: 'CollectionFieldInitializer',
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
          } as SchemaInitializerItemOptions;
        }),
    [fields],
  );

  return filterFields;
};

const findSchema = (schema: Schema, key: string, action: string) => {
  if (!Schema.isSchemaInstance(schema)) return null;
  return schema.reduceProperties((buf, s) => {
    if (s[key] === action) {
      return s;
    }
    if (s['x-component'] !== 'Action.Container') {
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
  let fieldSchema = useFieldSchema();
  if (!fieldSchema?.['x-initializer']) {
    const recursiveInitializerSchema = recursiveParent(fieldSchema);
    if (recursiveInitializerSchema) {
      fieldSchema = recursiveInitializerSchema;
    }
  }
  const { remove } = useDesignable();
  const schema = find(fieldSchema, key, action);
  const ctx = useContext(BlockRequestContext);
  return {
    schema,
    exists: !!schema,
    remove() {
      if (ctx.field) {
        ctx.field.data = ctx.field.data || {};
        ctx.field.data.activeFields = ctx.field.data.activeFields || new Set();
        ctx.field.data.activeFields.delete(schema.name);
      }
      schema && rm(schema, remove);
    },
  };
};

export const useRecordCollectionDataSourceItems = (
  componentName,
  item = null,
  collectionName = null,
  resourceName = null,
) => {
  const { t } = useTranslation();
  const collection = useCollection();
  const { getTemplatesByCollection } = useSchemaTemplateManager();
  const templates = getTemplatesByCollection(collectionName || collection.name)
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

export const useCollectionDataSourceItems = (componentName) => {
  const { t } = useTranslation();
  const { collections, getCollectionFields } = useCollectionManager();
  const { getTemplatesByCollection } = useSchemaTemplateManager();

  return [
    {
      key: 'tableBlock',
      type: 'itemGroup',
      title: null,
      children: [],
      loadChildren: ({ searchValue } = { searchValue: '' }) => {
        return getChildren({
          collections,
          getCollectionFields,
          componentName,
          searchValue,
          getTemplatesByCollection,
          t,
        });
      },
    },
  ];
};

export const createDetailsBlockSchema = (options) => {
  const {
    formItemInitializers = 'ReadPrettyFormItemInitializers',
    actionInitializers = 'DetailsActionInitializers',
    collection,
    association,
    resource,
    template,
    ...others
  } = options;
  const resourceName = resource || association || collection;
  const schema: ISchema = {
    type: 'void',
    'x-acl-action': `${resourceName}:view`,
    'x-decorator': 'DetailsBlockProvider',
    'x-decorator-props': {
      resource: resourceName,
      collection,
      association,
      readPretty: true,
      action: 'list',
      params: {
        pageSize: 1,
      },
      // useParams: '{{ useParamsFromRecord }}',
      ...others,
    },
    'x-designer': 'DetailsDesigner',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Details',
        'x-read-pretty': true,
        'x-component-props': {
          useProps: '{{ useDetailsBlockProps }}',
        },
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
          pagination: {
            type: 'void',
            'x-component': 'Pagination',
            'x-component-props': {
              useProps: '{{ useDetailsPaginationProps }}',
            },
          },
        },
      },
    },
  };
  return schema;
};

export const createListBlockSchema = (options) => {
  const {
    formItemInitializers = 'ReadPrettyFormItemInitializers',
    actionInitializers = 'ListActionInitializers',
    itemActionInitializers = 'ListItemActionInitializers',
    collection,
    association,
    resource,
    template,
    ...others
  } = options;
  const resourceName = resource || association || collection;
  const schema: ISchema = {
    type: 'void',
    'x-acl-action': `${resourceName}:view`,
    'x-decorator': 'List.Decorator',
    'x-decorator-props': {
      resource: resourceName,
      collection,
      association,
      readPretty: true,
      action: 'list',
      params: {
        pageSize: 10,
      },
      runWhenParamsChanged: true,
      ...others,
    },
    'x-component': 'CardItem',
    'x-designer': 'List.Designer',
    properties: {
      actionBar: {
        type: 'void',
        'x-initializer': actionInitializers,
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 'var(--nb-spacing)',
          },
        },
        properties: {},
      },
      list: {
        type: 'array',
        'x-component': 'List',
        'x-component-props': {
          props: '{{ useListBlockProps }}',
        },
        properties: {
          item: {
            type: 'object',
            'x-component': 'List.Item',
            'x-read-pretty': true,
            'x-component-props': {
              useProps: '{{ useListItemProps }}',
            },
            properties: {
              grid: template || {
                type: 'void',
                'x-component': 'Grid',
                'x-initializer': formItemInitializers,
                'x-initializer-props': {
                  useProps: '{{ useListItemInitializerProps }}',
                },
                properties: {},
              },
              actionBar: {
                type: 'void',
                'x-align': 'left',
                'x-initializer': itemActionInitializers,
                'x-component': 'ActionBar',
                'x-component-props': {
                  useProps: '{{ useListActionBarProps }}',
                  layout: 'one-column',
                },
                properties: {},
              },
            },
          },
        },
      },
    },
  };
  return schema;
};

export const createGridCardBlockSchema = (options) => {
  const {
    formItemInitializers = 'ReadPrettyFormItemInitializers',
    actionInitializers = 'GridCardActionInitializers',
    itemActionInitializers = 'GridCardItemActionInitializers',
    collection,
    association,
    resource,
    template,
    ...others
  } = options;
  const resourceName = resource || association || collection;
  const schema: ISchema = {
    type: 'void',
    'x-acl-action': `${resourceName}:view`,
    'x-decorator': 'GridCard.Decorator',
    'x-decorator-props': {
      resource: resourceName,
      collection,
      association,
      readPretty: true,
      action: 'list',
      params: {
        pageSize: 12,
      },
      runWhenParamsChanged: true,
      ...others,
    },
    'x-component': 'BlockItem',
    'x-component-props': {
      useProps: '{{ useGridCardBlockItemProps }}',
    },
    'x-designer': 'GridCard.Designer',
    properties: {
      actionBar: {
        type: 'void',
        'x-initializer': actionInitializers,
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 'var(--nb-spacing)',
          },
        },
        properties: {},
      },
      list: {
        type: 'array',
        'x-component': 'GridCard',
        'x-component-props': {
          useProps: '{{ useGridCardBlockProps }}',
        },
        properties: {
          item: {
            type: 'object',
            'x-component': 'GridCard.Item',
            'x-read-pretty': true,
            'x-component-props': {
              useProps: '{{ useGridCardItemProps }}',
            },
            properties: {
              grid: template || {
                type: 'void',
                'x-component': 'Grid',
                'x-initializer': formItemInitializers,
                'x-initializer-props': {
                  useProps: '{{ useGridCardItemInitializerProps }}',
                },
                properties: {},
              },
              actionBar: {
                type: 'void',
                'x-align': 'left',
                'x-initializer': itemActionInitializers,
                'x-component': 'ActionBar',
                'x-component-props': {
                  useProps: '{{ useGridCardActionBarProps }}',
                  layout: 'one-column',
                },
                properties: {},
              },
            },
          },
        },
      },
    },
  };
  return schema;
};
export const createFormBlockSchema = (options) => {
  const {
    formItemInitializers = 'FormItemInitializers',
    actionInitializers = 'FormActionInitializers',
    collection,
    resource,
    association,
    action,
    actions = {},
    'x-designer': designer = 'FormV2.Designer',
    template,
    title,
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
      resource: resourceName,
      collection,
      association,
      // action: 'get',
      // useParams: '{{ useParamsFromRecord }}',
    },
    'x-designer': designer,
    'x-component': 'CardItem',
    'x-component-props': {
      title,
    },
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'FormV2',
        'x-component-props': {
          useProps: '{{ useFormBlockProps }}',
        },
        properties: {
          grid: template || {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': formItemInitializers,
            properties: {},
          },
          actions: {
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

export const createFilterFormBlockSchema = (options) => {
  const {
    formItemInitializers = 'FilterFormItemInitializers',
    actionInitializers = 'FilterFormActionInitializers',
    collection,
    resource,
    association,
    action,
    template,
    ...others
  } = options;
  const resourceName = resource || association || collection;
  const schema: ISchema = {
    type: 'void',
    'x-decorator': 'FilterFormBlockProvider',
    'x-decorator-props': {
      ...others,
      action,
      resource: resourceName,
      collection,
      association,
    },
    'x-designer': 'FormV2.FilterDesigner',
    'x-component': 'CardItem',
    // 保存当前筛选区块所能过滤的数据区块
    'x-filter-targets': [],
    // 用于存储用户设置的每个字段的运算符，目前仅筛选表单区块支持自定义
    'x-filter-operators': {},
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'FormV2',
        'x-component-props': {
          useProps: '{{ useFormBlockProps }}',
        },
        properties: {
          grid: template || {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': formItemInitializers,
            properties: {},
          },
          actions: {
            type: 'void',
            'x-initializer': actionInitializers,
            'x-component': 'ActionBar',
            'x-component-props': {
              layout: 'one-column',
              style: {
                float: 'right',
              },
            },
            properties: {},
          },
        },
      },
    },
  };
  return schema;
};

export const createReadPrettyFormBlockSchema = (options) => {
  const {
    formItemInitializers = 'ReadPrettyFormItemInitializers',
    actionInitializers = 'ReadPrettyFormActionInitializers',
    collection,
    association,
    resource,
    template,
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
      readPretty: true,
      action: 'get',
      useParams: '{{ useParamsFromRecord }}',
      ...others,
    },
    'x-designer': 'FormV2.ReadPrettyDesigner',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'FormV2',
        'x-read-pretty': true,
        'x-component-props': {
          useProps: '{{ useFormBlockProps }}',
        },
        properties: {
          actions: {
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
  // console.log(JSON.stringify(schema, null, 2));
  return schema;
};

export const createTableBlockSchema = (options) => {
  const {
    collection,
    resource,
    rowKey,
    tableActionInitializers,
    tableColumnInitializers,
    tableActionColumnInitializers,
    tableBlockProvider,
    disableTemplate,
    TableBlockDesigner,
    blockType,
    pageSize = 20,
    ...others
  } = options;
  const schema: ISchema = {
    type: 'void',
    'x-decorator': tableBlockProvider ?? 'TableBlockProvider',
    'x-acl-action': `${resource || collection}:list`,
    'x-decorator-props': {
      collection,
      resource: resource || collection,
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
    'x-designer': TableBlockDesigner ?? 'TableBlockDesigner',
    'x-component': 'CardItem',
    'x-filter-targets': [],
    properties: {
      actions: {
        type: 'void',
        'x-initializer': tableActionInitializers ?? 'TableActionInitializers',
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
        'x-initializer': tableColumnInitializers ?? 'TableColumnInitializers',
        'x-component': 'TableV2',
        'x-component-props': {
          rowKey: 'id',
          rowSelection: {
            type: 'checkbox',
          },
          useProps: '{{ useTableBlockProps }}',
        },
        properties: {
          actions: {
            type: 'void',
            title: '{{ t("Actions") }}',
            'x-action-column': 'actions',
            'x-decorator': 'TableV2.Column.ActionBar',
            'x-component': 'TableV2.Column',
            'x-designer': 'TableV2.ActionColumnDesigner',
            'x-initializer': tableActionColumnInitializers ?? 'TableActionColumnInitializers',
            properties: {
              actions: {
                type: 'void',
                'x-decorator': 'DndContext',
                'x-component': 'Space',
                'x-component-props': {
                  split: '|',
                },
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

export const createCollapseBlockSchema = (options) => {
  const { collection, blockType } = options;
  const schema: ISchema = {
    type: 'void',
    'x-decorator': 'AssociationFilter.Provider',
    'x-decorator-props': {
      collection,
      blockType,
      associationFilterStyle: {
        width: '100%',
      },
    },
    'x-designer': 'AssociationFilter.BlockDesigner',
    'x-component': 'CardItem',
    'x-filter-targets': [],
    properties: {
      [uid()]: {
        type: 'void',
        'x-action': 'associateFilter',
        'x-initializer': 'AssociationFilter.FilterBlockInitializer',
        'x-component': 'AssociationFilter',
        properties: {},
      },
    },
  };

  return schema;
};

export const createTableSelectorSchema = (options) => {
  const { collection, resource, rowKey, ...others } = options;
  const schema: ISchema = {
    type: 'void',
    'x-acl-action': `${resource || collection}:list`,
    'x-decorator': 'TableSelectorProvider',
    'x-decorator-props': {
      collection,
      resource: resource || collection,
      action: 'list',
      params: {
        pageSize: 20,
      },
      rowKey,
      ...others,
    },
    'x-designer': 'TableSelectorDesigner',
    'x-component': 'BlockItem',
    properties: {
      actions: {
        type: 'void',
        'x-initializer': 'TableActionInitializers',
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 'var(--nb-spacing)',
          },
        },
        properties: {},
      },
      value: {
        type: 'array',
        'x-initializer': 'TableColumnInitializers',
        'x-component': 'TableV2.Selector',
        'x-component-props': {
          rowSelection: {
            type: 'checkbox',
          },
          useProps: '{{ useTableSelectorProps }}',
        },
        properties: {},
      },
    },
  };
  console.log(JSON.stringify(schema, null, 2));
  return schema;
};

export const createCalendarBlockSchema = (options) => {
  const { collection, resource, fieldNames, ...others } = options;
  const schema: ISchema = {
    type: 'void',
    'x-acl-action': `${resource || collection}:list`,
    'x-decorator': 'CalendarBlockProvider',
    'x-decorator-props': {
      collection: collection,
      resource: resource || collection,
      action: 'list',
      fieldNames: {
        id: 'id',
        ...fieldNames,
      },
      params: {
        paginate: false,
      },
      ...others,
    },
    'x-designer': 'CalendarV2.Designer',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'CalendarV2',
        'x-component-props': {
          useProps: '{{ useCalendarBlockProps }}',
        },
        properties: {
          toolBar: {
            type: 'void',
            'x-component': 'CalendarV2.ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 24,
              },
            },
            'x-initializer': 'CalendarActionInitializers',
            properties: {},
          },
          event: {
            type: 'void',
            'x-component': 'CalendarV2.Event',
            properties: {
              drawer: {
                type: 'void',
                'x-component': 'Action.Drawer',
                'x-component-props': {
                  className: 'nb-action-popup',
                },
                title: '{{ t("View record") }}',
                properties: {
                  tabs: {
                    type: 'void',
                    'x-component': 'Tabs',
                    'x-component-props': {},
                    'x-initializer': 'TabPaneInitializers',
                    'x-initializer-props': {
                      gridInitializer: 'RecordBlockInitializers',
                    },
                    properties: {
                      tab1: {
                        type: 'void',
                        title: '{{t("Details")}}',
                        'x-component': 'Tabs.TabPane',
                        'x-designer': 'Tabs.Designer',
                        'x-component-props': {},
                        properties: {
                          grid: {
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer-props': {
                              actionInitializers: 'CalendarFormActionInitializers',
                            },
                            'x-initializer': 'RecordBlockInitializers',
                            properties: {},
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  console.log(JSON.stringify(schema, null, 2));
  return schema;
};

export const createGanttBlockSchema = (options) => {
  const { collection, resource, fieldNames, ...others } = options;
  const schema: ISchema = {
    type: 'void',
    'x-acl-action': `${resource || collection}:list`,
    'x-decorator': 'GanttBlockProvider',
    'x-decorator-props': {
      collection: collection,
      resource: resource || collection,
      action: 'list',
      fieldNames: {
        id: 'id',
        ...fieldNames,
      },
      params: {
        paginate: false,
      },
      ...others,
    },
    'x-designer': 'Gantt.Designer',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'Gantt',
        'x-component-props': {
          useProps: '{{ useGanttBlockProps }}',
        },
        properties: {
          toolBar: {
            type: 'void',
            'x-component': 'ActionBar',
            'x-component-props': {
              style: {
                marginBottom: 24,
              },
            },
            'x-initializer': 'GanttActionInitializers',
            properties: {},
          },
          table: {
            type: 'array',
            'x-decorator': 'div',
            'x-decorator-props': {
              style: {
                float: 'left',
                maxWidth: '35%',
              },
            },

            'x-initializer': 'TableColumnInitializers',
            'x-component': 'TableV2',
            'x-component-props': {
              rowKey: 'id',
              rowSelection: {
                type: 'checkbox',
              },
              useProps: '{{ useTableBlockProps }}',
              pagination: false,
            },
            properties: {
              actions: {
                type: 'void',
                title: '{{ t("Actions") }}',
                'x-action-column': 'actions',
                'x-decorator': 'TableV2.Column.ActionBar',
                'x-component': 'TableV2.Column',
                'x-designer': 'TableV2.ActionColumnDesigner',
                'x-initializer': 'TableActionColumnInitializers',
                properties: {
                  actions: {
                    type: 'void',
                    'x-decorator': 'DndContext',
                    'x-component': 'Space',
                    'x-component-props': {
                      split: '|',
                    },
                    properties: {},
                  },
                },
              },
            },
          },
          detail: {
            type: 'void',
            'x-component': 'Gantt.Event',
            properties: {
              drawer: {
                type: 'void',
                'x-component': 'Action.Drawer',
                'x-component-props': {
                  className: 'nb-action-popup',
                },
                title: '{{ t("View record") }}',
                properties: {
                  tabs: {
                    type: 'void',
                    'x-component': 'Tabs',
                    'x-component-props': {},
                    'x-initializer': 'TabPaneInitializers',
                    properties: {
                      tab1: {
                        type: 'void',
                        title: '{{t("Details")}}',
                        'x-component': 'Tabs.TabPane',
                        'x-designer': 'Tabs.Designer',
                        'x-component-props': {},
                        properties: {
                          grid: {
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'RecordBlockInitializers',
                            properties: {},
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  console.log(JSON.stringify(schema, null, 2));
  return schema;
};
export const createKanbanBlockSchema = (options) => {
  const { collection, resource, groupField, ...others } = options;
  const schema: ISchema = {
    type: 'void',
    'x-acl-action': `${resource || collection}:list`,
    'x-decorator': 'KanbanBlockProvider',
    'x-decorator-props': {
      collection: collection,
      resource: resource || collection,
      action: 'list',
      groupField,
      params: {
        paginate: false,
      },
      ...others,
    },
    'x-designer': 'Kanban.Designer',
    'x-component': 'CardItem',
    properties: {
      actions: {
        type: 'void',
        'x-initializer': 'KanbanActionInitializers',
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
        'x-component': 'Kanban',
        'x-component-props': {
          useProps: '{{ useKanbanBlockProps }}',
        },
        properties: {
          card: {
            type: 'void',
            'x-read-pretty': true,
            'x-label-disabled': true,
            'x-decorator': 'BlockItem',
            'x-component': 'Kanban.Card',
            'x-component-props': {
              openMode: 'drawer',
            },
            'x-designer': 'Kanban.Card.Designer',
            properties: {
              grid: {
                type: 'void',
                'x-component': 'Grid',
                'x-component-props': { dndContext: false },
              },
            },
          },
          cardViewer: {
            type: 'void',
            title: '{{ t("View") }}',
            'x-designer': 'Action.Designer',
            'x-component': 'Kanban.CardViewer',
            'x-action': 'view',
            'x-component-props': {
              openMode: 'drawer',
            },
            properties: {
              drawer: {
                type: 'void',
                title: '{{ t("View record") }}',
                'x-component': 'Action.Container',
                'x-component-props': {
                  className: 'nb-action-popup',
                },
                properties: {
                  tabs: {
                    type: 'void',
                    'x-component': 'Tabs',
                    'x-component-props': {},
                    'x-initializer': 'TabPaneInitializers',
                    properties: {
                      tab1: {
                        type: 'void',
                        title: '{{t("Details")}}',
                        'x-component': 'Tabs.TabPane',
                        'x-designer': 'Tabs.Designer',
                        'x-component-props': {},
                        properties: {
                          grid: {
                            type: 'void',
                            'x-component': 'Grid',
                            'x-initializer': 'RecordBlockInitializers',
                            properties: {},
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  return schema;
};

const getChildren = ({
  collections,
  getCollectionFields,
  componentName,
  searchValue,
  getTemplatesByCollection,
  t,
}: {
  collections: any[];
  getCollectionFields: (name: any) => CollectionFieldOptions[];
  componentName: any;
  searchValue: string;
  getTemplatesByCollection: (collectionName: string, resourceName?: string) => any;
  t;
}) => {
  return collections
    ?.filter((item) => {
      if (item.inherit) {
        return false;
      }
      const fields = getCollectionFields(item.name);
      if (item.autoGenId === false && !fields.find((v) => v.primaryKey)) {
        return false;
      } else if (
        ['Kanban', 'FormItem'].includes(componentName) &&
        ((item.template === 'view' && !item.writableView) || item.template === 'sql')
      ) {
        return false;
      } else if (item.template === 'file' && ['Kanban', 'FormItem', 'Calendar'].includes(componentName)) {
        return false;
      } else {
        if (!item.title) {
          return false;
        }
        return item.title.toUpperCase().includes(searchValue.toUpperCase()) && !(item?.isThrough && item?.autoCreate);
      }
    })
    ?.map((item, index) => {
      const templates = getTemplatesByCollection(item.name).filter((template) => {
        return (
          componentName &&
          template.componentName === componentName &&
          (!template.resourceName || template.resourceName === item.name)
        );
      });
      if (!templates.length) {
        return {
          type: 'item',
          name: item.name,
          title: item.title,
        };
      }
      return {
        key: `${componentName}_table_subMenu_${index}`,
        type: 'subMenu',
        name: `${item.name}_${index}`,
        title: item.title,
        children: [
          {
            type: 'item',
            name: item.name,
            title: t('Blank block'),
          },
          {
            type: 'divider',
          },
          {
            key: `${componentName}_table_subMenu_${index}_copy`,
            type: 'subMenu',
            name: 'copy',
            title: t('Duplicate template'),
            children: templates.map((template) => {
              const templateName =
                template?.componentName === 'FormItem' ? `${template?.name} ${t('(Fields only)')}` : template?.name;
              return {
                type: 'item',
                mode: 'copy',
                name: item.name,
                template,
                title: templateName || t('Untitled'),
              };
            }),
          },
          {
            key: `${componentName}_table_subMenu_${index}_ref`,
            type: 'subMenu',
            name: 'ref',
            title: t('Reference template'),
            children: templates.map((template) => {
              const templateName =
                template?.componentName === 'FormItem' ? `${template?.name} ${t('(Fields only)')}` : template?.name;
              return {
                type: 'item',
                mode: 'reference',
                name: item.name,
                template,
                title: templateName || t('Untitled'),
              };
            }),
          },
        ],
      };
    });
};
