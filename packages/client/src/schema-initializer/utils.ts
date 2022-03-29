import { ISchema, Schema, useFieldSchema } from '@formily/react';
import { uid } from '@formily/shared';
import { useTranslation } from 'react-i18next';
import { SchemaInitializerItemOptions } from '../';
import { useCollection, useCollectionManager } from '../collection-manager';
import { useDesignable } from '../schema-component';
import { useSchemaTemplateManager } from '../schema-templates';

export const itemsMerge = (items1, items2) => {
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
  console.log('schema.parent', schema.parent);
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

export const findTableColumn = (schema: Schema, key: string, action: string, deepth: number = 0) => {
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

export const useTableColumnInitializerFields = () => {
  const { name, fields = [] } = useCollection();
  return fields
    .filter((field) => field?.interface && field?.interface !== 'subTable')
    .map((field) => {
      return {
        type: 'item',
        title: field?.uiSchema?.title || field.name,
        component: 'TableCollectionFieldInitializer',
        find: findTableColumn,
        remove: removeTableColumn,
        schema: {
          name: field.name,
          'x-collection-field': `${name}.${field.name}`,
          'x-component': 'CollectionField',
          'x-read-pretty': true,
          'x-component-props': {},
        },
      } as SchemaInitializerItemOptions;
    });
};

export const useFormItemInitializerFields = () => {
  const { name, fields } = useCollection();
  return fields
    ?.filter((field) => field?.interface)
    ?.map((field) => {
      return {
        type: 'item',
        title: field?.uiSchema?.title || field.name,
        component: 'CollectionFieldInitializer',
        remove: removeGridFormItem,
        schema: {
          type: 'string',
          name: field.name,
          title: field?.uiSchema?.title || field.name,
          'x-designer': 'FormItem.Designer',
          'x-component': 'CollectionField',
          'x-decorator': 'FormItem',
          'x-collection-field': `${name}.${field.name}`,
        },
      } as SchemaInitializerItemOptions;
    });
};

const findSchema = (schema: Schema, key: string, action: string) => {
  return schema.reduceProperties((buf, s) => {
    if (s[key] === action) {
      return s;
    }
    const c = findSchema(s, key, action);
    if (c) {
      return c;
    }
    return buf;
  });
};

const removeSchema = (schema, cb) => {
  return cb(schema);
};

export const useCurrentSchema = (action: string, key: string, find = findSchema, rm = removeSchema) => {
  const fieldSchema = useFieldSchema();
  const { remove } = useDesignable();
  const schema = find(fieldSchema, key, action);
  return {
    schema,
    exists: !!schema,
    remove() {
      schema && rm(schema, remove);
    },
  };
};

export const useRecordCollectionDataSourceItems = (componentName) => {
  const collection = useCollection();
  const { getTemplatesByCollection } = useSchemaTemplateManager();
  const templates = getTemplatesByCollection(collection.name).filter((template) => {
    return componentName && template.componentName === componentName;
  });
  if (!templates.length) {
    return [];
  }
  const index = 0;
  return [
    {
      type: 'item',
      name: collection.name,
      title: '空白区块',
    },
    {
      type: 'divider',
    },
    {
      key: `${componentName}_table_subMenu_${index}_copy`,
      type: 'subMenu',
      name: 'copy',
      title: '复制模板',
      children: templates.map((template) => {
        return {
          type: 'item',
          mode: 'copy',
          name: collection.name,
          template,
          title: template.name || '未命名',
        };
      }),
    },
    {
      key: `${componentName}_table_subMenu_${index}_ref`,
      type: 'subMenu',
      name: 'ref',
      title: '引用模板',
      children: templates.map((template) => {
        return {
          type: 'item',
          mode: 'reference',
          name: collection.name,
          template,
          title: template.name || '未命名',
        };
      }),
    },
  ];
};

export const useCollectionDataSourceItems = (componentName) => {
  const { t } = useTranslation();
  const { collections } = useCollectionManager();
  const { getTemplatesByCollection } = useSchemaTemplateManager();
  return [
    {
      key: 'tableBlock',
      type: 'itemGroup',
      title: t('Select data source'),
      children: collections
        ?.filter((item) => !item.inherit)
        ?.map((item, index) => {
          const templates = getTemplatesByCollection(item.name).filter((template) => {
            return componentName && template.componentName === componentName;
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
                title: '空白区块',
              },
              {
                type: 'divider',
              },
              {
                key: `${componentName}_table_subMenu_${index}_copy`,
                type: 'subMenu',
                name: 'copy',
                title: '复制模板',
                children: templates.map((template) => {
                  return {
                    type: 'item',
                    mode: 'copy',
                    name: item.name,
                    template,
                    title: template.name || '未命名',
                  };
                }),
              },
              {
                key: `${componentName}_table_subMenu_${index}_ref`,
                type: 'subMenu',
                name: 'ref',
                title: '引用模板',
                children: templates.map((template) => {
                  return {
                    type: 'item',
                    mode: 'reference',
                    name: item.name,
                    template,
                    title: template.name || '未命名',
                  };
                }),
              },
            ],
          };
        }),
    },
  ];
};

export const createFormBlockSchema = (options) => {
  const {
    formItemInitializers = 'FormItemInitializers',
    actionInitializers = 'FormActionInitializers',
    collection,
    resource,
    association,
    ...others
  } = options;
  const schema: ISchema = {
    type: 'void',
    'x-decorator': 'FormBlockProvider',
    'x-decorator-props': {
      ...others,
      resource: resource || association || collection,
      collection,
      association,
      // action: 'get',
      // useParams: '{{ useParamsFromRecord }}',
    },
    'x-designer': 'FormV2.Designer',
    'x-component': 'CardItem',
    properties: {
      [uid()]: {
        type: 'void',
        'x-component': 'FormV2',
        'x-component-props': {
          useProps: '{{ useFormBlockProps }}',
        },
        properties: {
          grid: {
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
    resource,
    ...others
  } = options;
  const schema: ISchema = {
    type: 'void',
    'x-decorator': 'FormBlockProvider',
    'x-decorator-props': {
      resource: resource || collection,
      collection,
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
          grid: {
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
  const { collection, resource, rowKey, ...others } = options;
  const schema: ISchema = {
    type: 'void',
    'x-decorator': 'TableBlockProvider',
    'x-decorator-props': {
      collection,
      resource: resource || collection,
      action: 'list',
      params: {
        pageSize: 20,
      },
      rowKey,
      showIndex: true,
      dragSort: false,
      ...others,
    },
    'x-designer': 'TableBlockDesigner',
    'x-component': 'CardItem',
    properties: {
      actions: {
        type: 'void',
        'x-initializer': 'TableActionInitializers',
        'x-component': 'ActionBar',
        'x-component-props': {
          style: {
            marginBottom: 16,
          },
        },
        properties: {},
      },
      [uid()]: {
        type: 'array',
        'x-initializer': 'TableColumnInitializers',
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
    },
  };
  return schema;
};

export const createCalendarBlockSchema = (options) => {
  const { collection, resource, fieldNames, ...others } = options;
  const schema: ISchema = {
    type: 'void',
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
    properties: {
      calendar: {
        type: 'array',
        name: 'calendar1',
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
            name: 'event',
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
                    properties: {
                      tab1: {
                        type: 'void',
                        title: '详情',
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

export const createKanbanBlockSchema = (options) => {
  const { collection, resource, groupField, ...others } = options;
  const schema = {
    type: 'void',
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
    properties: {
      kanban: {
        type: 'array',
        'x-component': 'KanbanV2',
        'x-component-props': {
          useProps: '{{ useKanbanBlockProps }}',
        },
        properties: {
          card: {
            type: 'void',
            'x-component': 'KanbanV2.Card',
            'x-designer': 'KanbanV2.Card.Designer',
            properties: {},
          },
        },
      },
    },
  };
  return schema;
};
