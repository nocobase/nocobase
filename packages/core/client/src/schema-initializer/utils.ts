import { Field, Form } from '@formily/core';
import { ISchema, Schema, useFieldSchema, useForm } from '@formily/react';
import { uid } from '@formily/shared';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializerItemType, useDataSourceKey, useFormActiveFields, useFormBlockContext } from '../';
import { FieldOptions, useCollection_deprecated, useCollectionManager_deprecated } from '../collection-manager';
import { isAssocField } from '../filter-provider/utils';
import { useActionContext, useDesignable } from '../schema-component';
import { useSchemaTemplateManager } from '../schema-templates';
import { Collection } from '../data-source/collection/Collection';
import { useDataSourceManager } from '../data-source/data-source/DataSourceManagerProvider';
import { DataSourceManager } from '../data-source/data-source/DataSourceManager';

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
      name: field.uiSchema?.title,
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
  const { form }: { form: Form } = useFormBlockContext();
  let fieldSchema = useFieldSchema();

  if (!fieldSchema?.['x-initializer']) {
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
      form?.query(schema.name).forEach((field: Field) => {
        field.setInitialValue?.(null);
        field.reset?.();
      });
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

export const useCollectionDataSourceItems = (
  componentName,
  filter: (collection: Collection) => boolean = () => true,
  onlyCurrentDataSource = false,
) => {
  const { t } = useTranslation();
  const dm = useDataSourceManager();
  const dataSourceKey = useDataSourceKey();
  let allCollections = dm.getAllCollections(filter);
  if (onlyCurrentDataSource) {
    allCollections = allCollections.filter((collection) => collection.key === dataSourceKey);
  }

  const { getTemplatesByCollection } = useSchemaTemplateManager();
  const res = useMemo(() => {
    return allCollections.map(({ key, displayName, collections }) => ({
      name: key,
      label: displayName,
      type: 'subMenu',
      children: getChildren({
        collections,
        componentName,
        searchValue: '',
        dataSource: key,
        getTemplatesByCollection,
        t,
      }),
    }));
  }, [allCollections, componentName, dm, getTemplatesByCollection, t]);

  return res;
};

export const createDetailsBlockSchema = (options) => {
  const {
    formItemInitializers = 'ReadPrettyFormItemInitializers',
    actionInitializers = 'DetailsActionInitializers',
    collection,
    dataSource,
    association,
    resource,
    template,
    settings,
    ...others
  } = options;
  const resourceName = resource || association || collection;
  const schema: ISchema = {
    type: 'void',
    'x-acl-action': `${resourceName}:view`,
    'x-decorator': 'DetailsBlockProvider',
    'x-decorator-props': {
      resource: resourceName,
      dataSource,
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
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': settings,
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
    dataSource,
    association,
    resource,
    template,
    settings,
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
      dataSource,
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
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': settings,
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
    dataSource,
    settings,
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
      dataSource,
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
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': settings,
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
      // action: 'get',
      // useParams: '{{ useParamsFromRecord }}',
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

export const createFilterFormBlockSchema = (options) => {
  const {
    formItemInitializers = 'FilterFormItemInitializers',
    actionInitializers = 'FilterFormActionInitializers',
    collection,
    resource,
    association,
    dataSource,
    action,
    template,
    settings,
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
      dataSource,
      collection,
      association,
    },
    'x-toolbar': 'BlockSchemaToolbar',
    ...(settings ? { 'x-settings': settings } : { 'x-designer': 'FormV2.FilterDesigner' }),
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
          [uid()]: {
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
        'x-read-pretty': true,
        'x-component-props': {
          useProps: '{{ useFormBlockProps }}',
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
        },
      },
    },
  };

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
    dataSource,
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
      dataSource,
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
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:table',
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
              [uid()]: {
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
  const { collection, dataSource, blockType } = options;
  const schema: ISchema = {
    type: 'void',
    'x-decorator': 'AssociationFilter.Provider',
    'x-decorator-props': {
      collection,
      dataSource,
      blockType,
      associationFilterStyle: {
        width: '100%',
      },
      name: 'filter-collapse',
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:filterCollapse',
    'x-component': 'CardItem',
    'x-filter-targets': [],
    properties: {
      [uid()]: {
        type: 'void',
        'x-action': 'associateFilter',
        'x-initializer': 'AssociationFilterInitializers',
        'x-component': 'AssociationFilter',
        properties: {},
      },
    },
  };

  return schema;
};

export const createTableSelectorSchema = (options) => {
  const { collection, dataSource, resource, rowKey, ...others } = options;
  const schema: ISchema = {
    type: 'void',
    'x-acl-action': `${resource || collection}:list`,
    'x-decorator': 'TableSelectorProvider',
    'x-decorator-props': {
      collection,
      resource: resource || collection,
      dataSource,
      action: 'list',
      params: {
        pageSize: 20,
      },
      rowKey,
      ...others,
    },
    'x-toolbar': 'BlockSchemaToolbar',
    'x-settings': 'blockSettings:tableSelector',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
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
          (!template.resourceName || template.resourceName === item.name)
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
              const templateName =
                template?.componentName === 'FormItem' ? `${template?.name} ${t('(Fields only)')}` : template?.name;
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
              const templateName =
                template?.componentName === 'FormItem' ? `${template?.name} ${t('(Fields only)')}` : template?.name;
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
