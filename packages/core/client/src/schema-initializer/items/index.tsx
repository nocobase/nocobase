import { FormOutlined, TableOutlined } from '@ant-design/icons';
import { FormDialog, FormLayout } from '@formily/antd';
import { ISchema, SchemaOptionsContext, useFieldSchema } from '@formily/react';
import { merge } from '@formily/shared';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../api-client';
import { useBlockAssociationContext, useBlockRequestContext } from '../../block-provider';
import { useCollection, useCollectionManager } from '../../collection-manager';
import { SchemaComponent, SchemaComponentOptions } from '../../schema-component';
import { useSchemaTemplateManager } from '../../schema-templates';
import { SchemaInitializer } from '../SchemaInitializer';
import {
  createCalendarBlockSchema,
  createDetailsBlockSchema,
  createFormBlockSchema,
  createKanbanBlockSchema,
  createReadPrettyFormBlockSchema,
  createTableBlockSchema,
  createTableSelectorSchema,
  useCollectionDataSourceItems,
  useCurrentSchema,
  useRecordCollectionDataSourceItems
} from '../utils';

// Block
export const BlockInitializer = (props) => {
  const { item, insert } = props;
  return (
    <SchemaInitializer.Item
      onClick={() => {
        insert({
          ...item.schema,
        });
      }}
    />
  );
};

export const G2PlotInitializer = (props) => {
  const { item, insert, ...others } = props;
  return (
    <SchemaInitializer.Item
      {...others}
      onClick={() => {
        insert({
          ...item.schema,
        });
      }}
    />
  );
};

export const CustomizeActionInitializer = (props) => {
  return <BlockInitializer {...props} />;
};

export const InitializerWithSwitch = (props) => {
  const { type, schema, item, insert } = props;
  const { exists, remove } = useCurrentSchema(schema?.[type] || item?.schema?.[type], type, item.find, item.remove);
  return (
    <SchemaInitializer.SwitchItem
      checked={exists}
      title={item.title}
      onClick={() => {
        if (exists) {
          return remove();
        }
        const s = merge(schema || {}, item.schema || {});
        item?.schemaInitialize?.(s);
        insert(s);
      }}
    />
  );
};

export const ActionInitializer = (props) => {
  return <InitializerWithSwitch {...props} type={'x-action'} />;
};

export const DataBlockInitializer = (props) => {
  const { templateWrap, onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          templateWrap ? insert(templateWrap(s, { item })) : insert(s);
        } else {
          if (onCreateBlockSchema) {
            onCreateBlockSchema({ item });
          } else if (createBlockSchema) {
            insert(createBlockSchema({ collection: item.name }));
          }
        }
      }}
      items={useCollectionDataSourceItems(componentType)}
    />
  );
};

export const TableBlockInitializer = (props) => {
  const { insert } = props;
  const { getCollection } = useCollectionManager();
  return (
    <DataBlockInitializer
      {...props}
      icon={<TableOutlined />}
      componentType={'Table'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const schema = createTableBlockSchema({ collection: item.name, rowKey: collection.filterTargetKey || 'id' });
        insert(schema);
      }}
    />
  );
};

export const FormBlockInitializer = (props) => {
  return (
    <DataBlockInitializer
      {...props}
      icon={<FormOutlined />}
      componentType={'FormItem'}
      templateWrap={(templateSchema, { item }) => {
        const s = createFormBlockSchema({
          template: templateSchema,
          collection: item.name,
        });
        if (item.template && item.mode === 'reference') {
          s['x-template-key'] = item.template.key;
        }
        return s;
      }}
      createBlockSchema={createFormBlockSchema}
    />
  );
};

export const DetailsBlockInitializer = (props) => {
  const { insert } = props;
  const { getCollection } = useCollectionManager();
  return (
    <DataBlockInitializer
      {...props}
      icon={<TableOutlined />}
      componentType={'Details'}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const schema = createDetailsBlockSchema({ collection: item.name, rowKey: collection.filterTargetKey || 'id' });
        insert(schema);
      }}
    />
  );
};

export const CalendarBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const { getCollection } = useCollectionManager();
  const options = useContext(SchemaOptionsContext);
  return (
    <DataBlockInitializer
      {...props}
      componentType={'Calendar'}
      icon={<FormOutlined />}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const stringFields = collection?.fields
          ?.filter((field) => field.type === 'string')
          ?.map((field) => {
            return {
              label: field?.uiSchema?.title,
              value: field.name,
            };
          });
        const dateFields = collection?.fields
          ?.filter((field) => field.type === 'date')
          ?.map((field) => {
            return {
              label: field?.uiSchema?.title,
              value: field.name,
            };
          });
        const values = await FormDialog(t('Create calendar block'), () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
                    properties: {
                      title: {
                        title: t('Title field'),
                        enum: stringFields,
                        required: true,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                      start: {
                        title: t('Start date field'),
                        enum: dateFields,
                        required: true,
                        default: 'createdAt',
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                      end: {
                        title: t('End date field'),
                        enum: dateFields,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                    },
                  }}
                />
              </FormLayout>
            </SchemaComponentOptions>
          );
        }).open({
          initialValues: {},
        });
        insert(
          createCalendarBlockSchema({
            collection: item.name,
            fieldNames: {
              ...values,
            },
          }),
        );
      }}
    />
  );
};

export const KanbanBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  const { getCollection } = useCollectionManager();
  const options = useContext(SchemaOptionsContext);
  const api = useAPIClient();
  return (
    <DataBlockInitializer
      {...props}
      componentType={'Kanban'}
      icon={<FormOutlined />}
      onCreateBlockSchema={async ({ item }) => {
        const collection = getCollection(item.name);
        const fields = collection?.fields
          ?.filter((field) => ['select', 'radioGroup'].includes(field.interface))
          ?.map((field) => {
            return {
              label: field?.uiSchema?.title,
              value: field.name,
              uiSchema: {
                ...field.uiSchema,
                name: field.name,
              },
            };
          });
        const values = await FormDialog(t('Create kanban block'), () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
                    properties: {
                      groupField: {
                        title: t('Group field'),
                        enum: fields,
                        required: true,
                        'x-component': 'Select',
                        'x-component-props': {
                          objectValue: true,
                          fieldNames: { label: 'label', value: 'value' },
                        },
                        'x-decorator': 'FormItem',
                      },
                    },
                  }}
                />
              </FormLayout>
            </SchemaComponentOptions>
          );
        }).open({
          initialValues: {},
        });
        const sortName = `${values.groupField.value}_sort`;
        const exists = collection?.fields?.find((field) => field.name === sortName);
        if (!exists) {
          await api.resource('collections.fields', item.name).create({
            values: {
              type: 'sort',
              name: sortName,
              hidden: true,
              scopeKey: values.groupField.value,
            },
          });
        }
        insert(
          createKanbanBlockSchema({
            groupField: values.groupField.value,
            collection: item.name,
            params: {
              sort: [sortName],
              paginate: false,
            },
          }),
        );
      }}
    />
  );
};

export const MarkdownBlockInitializer = (props) => {
  const { insert } = props;
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<FormOutlined />}
      onClick={() => {
        insert({
          type: 'void',
          'x-designer': 'Markdown.Void.Designer',
          'x-decorator': 'CardItem',
          'x-component': 'Markdown.Void',
          'x-editable': false,
          'x-component-props': {
            content: t('This is a demo text, **supports Markdown syntax**.'),
          },
        });
      }}
    />
  );
};

export const FilterActionInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("Filter") }}',
    'x-action': 'filter',
    'x-designer': 'Filter.Action.Designer',
    'x-component': 'Filter.Action',
    'x-component-props': {
      icon: 'FilterOutlined',
      useProps: '{{ useFilterActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};

export const CreateActionInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("Add new") }}',
    'x-action': 'create',
    'x-designer': 'Action.Designer',
    'x-component': 'Action',
    'x-component-props': {
      icon: 'PlusOutlined',
      openMode: 'drawer',
      type: 'primary',
    },
    properties: {
      drawer: {
        type: 'void',
        title: '{{ t("Add record") }}',
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
                title: '{{t("Add new")}}',
                'x-component': 'Tabs.TabPane',
                'x-designer': 'Tabs.Designer',
                'x-component-props': {},
                properties: {
                  grid: {
                    type: 'void',
                    'x-component': 'Grid',
                    'x-initializer': 'CreateFormBlockInitializers',
                    properties: {},
                  },
                },
              },
            },
          },
        },
      },
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};

export const ViewActionInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("View") }}',
    'x-action': 'view',
    'x-designer': 'Action.Designer',
    'x-component': 'Action',
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
  };
  return <ActionInitializer {...props} schema={schema} />;
};

export const UpdateActionInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("Edit") }}',
    'x-action': 'update',
    'x-designer': 'Action.Designer',
    'x-component': 'Action',
    'x-component-props': {
      openMode: 'drawer',
      icon: 'EditOutlined',
    },
    properties: {
      drawer: {
        type: 'void',
        title: '{{ t("Edit record") }}',
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
                title: '{{t("Edit")}}',
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
  };
  return <ActionInitializer {...props} schema={schema} />;
};

export const DestroyActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Delete") }}',
    'x-action': 'destroy',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      icon: 'DeleteOutlined',
      confirm: {
        title: "{{t('Delete record')}}",
        content: "{{t('Are you sure you want to delete it?')}}",
      },
      useProps: '{{ useDestroyActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};

export const BulkDestroyActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Delete") }}',
    'x-action': 'destroy',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      icon: 'DeleteOutlined',
      confirm: {
        title: "{{t('Delete record')}}",
        content: "{{t('Are you sure you want to delete it?')}}",
      },
      useProps: '{{ useBulkDestroyActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};

export const RefreshActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Refresh") }}',
    'x-action': 'refresh',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      icon: 'ReloadOutlined',
      useProps: '{{ useRefreshActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};

export const SubmitActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Submit") }}',
    'x-action': 'submit',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      type: 'primary',
      htmlType: 'submit',
      // useProps: '{{ bp.useSubmitActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};

export const CreateSubmitActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Submit") }}',
    'x-action': 'submit',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      type: 'primary',
      htmlType: 'submit',
      useProps: '{{ useCreateActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};

export const UpdateSubmitActionInitializer = (props) => {
  const schema = {
    title: '{{ t("Submit") }}',
    'x-action': 'submit',
    'x-component': 'Action',
    'x-designer': 'Action.Designer',
    'x-component-props': {
      type: 'primary',
      htmlType: 'submit',
      useProps: '{{ useUpdateActionProps }}',
    },
  };
  return <ActionInitializer {...props} schema={schema} />;
};

export const CreateFormBlockInitializer = (props) => {
  const { onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const association = useBlockAssociationContext();
  const collection = useCollection();
  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'FormItem') {
            const blockSchema = createFormBlockSchema({
              actionInitializers: 'CreateFormActionInitializers',
              association,
              collection: collection.name,
              template: s,
            });
            if (item.mode === 'reference') {
              blockSchema['x-template-key'] = item.template.key;
            }
            insert(blockSchema);
          } else {
            insert(s);
          }
        } else {
          insert(
            createFormBlockSchema({
              actionInitializers: 'CreateFormActionInitializers',
              association,
              collection: collection.name,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('FormItem')}
    />
  );
};

export const RecordFormBlockInitializer = (props) => {
  const { onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const collection = useCollection();
  const association = useBlockAssociationContext();
  console.log('RecordFormBlockInitializer', collection, association);
  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'FormItem') {
            const blockSchema = createFormBlockSchema({
              association,
              collection: collection.name,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              actionInitializers: 'UpdateFormActionInitializers',
              template: s,
            });
            if (item.mode === 'reference') {
              blockSchema['x-template-key'] = item.template.key;
            }
            insert(blockSchema);
          } else {
            insert(s);
          }
        } else {
          insert(
            createFormBlockSchema({
              association,
              collection: collection.name,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              actionInitializers: 'UpdateFormActionInitializers',
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('FormItem')}
    />
  );
};

export const RecordReadPrettyFormBlockInitializer = (props) => {
  const { onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const collection = useCollection();
  const association = useBlockAssociationContext();
  const { block } = useBlockRequestContext();
  const actionInitializers = block !== 'TableField' ? 'ReadPrettyFormActionInitializers' : null;

  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      {...others}
      key={'123'}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'ReadPrettyFormItem') {
            const blockSchema = createReadPrettyFormBlockSchema({
              actionInitializers,
              association,
              collection: collection.name,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              template: s,
            });
            if (item.mode === 'reference') {
              blockSchema['x-template-key'] = item.template.key;
            }
            insert(blockSchema);
          } else {
            insert(s);
          }
        } else {
          insert(
            createReadPrettyFormBlockSchema({
              actionInitializers,
              association,
              collection: collection.name,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('ReadPrettyFormItem')}
    />
  );
};

export const RecordAssociationFormBlockInitializer = (props) => {
  const { item, onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const field = item.field;
  const collection = field.target;
  const resource = `${field.collectionName}.${field.name}`;
  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {

        const action = ['hasOne', 'belongsTo'].includes(field.type) ? 'get' : null;
        const actionInitializers = ['hasOne', 'belongsTo'].includes(field.type) ? 'UpdateFormActionInitializers' : 'CreateFormActionInitializers';

        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'FormItem') {
            const blockSchema = createFormBlockSchema({
              collection,
              resource,
              association: resource,
              action,
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              actionInitializers,
              template: s,
            });
            if (item.mode === 'reference') {
              blockSchema['x-template-key'] = item.template.key;
            }
            insert(blockSchema);
          } else {
            insert(s);
          }
        } else {
          insert(
            createFormBlockSchema({
              collection,
              resource,
              association: resource,
              action,
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              actionInitializers,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('FormItem', item, collection, resource)}
    />
  );
};

export const RecordReadPrettyAssociationFormBlockInitializer = (props) => {
  const { item, onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();

  const field = item.field;
  const collection = field.target;
  const resource = `${field.collectionName}.${field.name}`;
  const { block } = useBlockRequestContext();
  const actionInitializers = block !== 'TableField' ? 'ReadPrettyFormActionInitializers' : null;

  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          if (item.template.componentName === 'ReadPrettyFormItem') {
            const blockSchema = createReadPrettyFormBlockSchema({
              actionInitializers,
              collection,
              resource,
              association: resource,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
              template: s,
            });
            if (item.mode === 'reference') {
              blockSchema['x-template-key'] = item.template.key;
            }
            insert(blockSchema);
          } else {
            insert(s);
          }
        } else {
          insert(
            createReadPrettyFormBlockSchema({
              actionInitializers,
              collection,
              resource,
              association: resource,
              action: 'get',
              useSourceId: '{{ useSourceIdFromParentRecord }}',
              useParams: '{{ useParamsFromRecord }}',
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('ReadPrettyFormItem', item, collection, resource)}
    />
  );
};

export const RecordAssociationDetailsBlockInitializer = (props) => {
  const { item, onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { getCollection } = useCollectionManager();
  const field = item.field;
  const collection = getCollection(field.target);
  const resource = `${field.collectionName}.${field.name}`;
  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          insert(s);
        } else {
          insert(
            createDetailsBlockSchema({
              collection: field.target,
              resource,
              association: resource,
              rowKey: collection.filterTargetKey || 'id',
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('Details', item, field.target, resource)}
    />
  );
}

export const RecordAssociationCalendarBlockInitializer = (props) => {
  const { item, onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  const { getCollection } = useCollectionManager();
  const field = item.field;
  const collection = getCollection(field.target);
  const resource = `${field.collectionName}.${field.name}`;

  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          insert(s);
        } else {
        const stringFields = collection?.fields
          ?.filter((field) => field.type === 'string')
          ?.map((field) => {
            return {
              label: field?.uiSchema?.title,
              value: field.name,
            };
          });
        const dateFields = collection?.fields
          ?.filter((field) => field.type === 'date')
          ?.map((field) => {
            return {
              label: field?.uiSchema?.title,
              value: field.name,
            };
          });
        const values = await FormDialog(t('Create calendar block'), () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
                    properties: {
                      title: {
                        title: t('Title field'),
                        enum: stringFields,
                        required: true,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                      start: {
                        title: t('Start date field'),
                        enum: dateFields,
                        required: true,
                        default: 'createdAt',
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                      end: {
                        title: t('End date field'),
                        enum: dateFields,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                    },
                  }}
                />
              </FormLayout>
            </SchemaComponentOptions>
          );
        }).open({
          initialValues: {},
        });
        insert(
          createCalendarBlockSchema({
            collection: field.target,
            resource,
            association: resource,
            fieldNames: {
              ...values,
            },
          }),
        );
        }
      }}
      items={useRecordCollectionDataSourceItems('Calendar', item, field.target, resource)}
    />
  );
}

export const RecordAssociationBlockInitializer = (props) => {
  const { item, onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const { getCollection } = useCollectionManager();
  const field = item.field;
  const collection = getCollection(field.target);
  const resource = `${field.collectionName}.${field.name}`;
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          insert(s);
        } else {
          insert(
            createTableBlockSchema({
              rowKey: collection.filterTargetKey,
              collection: field.target,
              resource,
              association: resource,
            }),
          );
        }
      }}
      items={useRecordCollectionDataSourceItems('Table', item, field.target, resource)}
    />
  );
};

export const TableActionColumnInitializer = (props) => {
  const schema = {
    type: 'void',
    title: '{{ t("Actions") }}',
    'x-decorator': 'TableV2.Column.ActionBar',
    'x-component': 'TableV2.Column',
    'x-designer': 'TableV2.ActionColumnDesigner',
    'x-initializer': 'TableActionColumnInitializers',
    'x-action-column': 'actions',
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
  };
  return <InitializerWithSwitch {...props} schema={schema} type={'x-action-column'} />;
};

export const TableCollectionFieldInitializer = (props) => {
  const schema: ISchema = {};
  return <InitializerWithSwitch {...props} schema={schema} type={'x-collection-field'} />;
};

export const CollectionFieldInitializer = (props) => {
  const schema: ISchema = {};
  return <InitializerWithSwitch {...props} schema={schema} type={'x-collection-field'} />;
};

export const TableSelectorInitializer = (props) => {
  const { onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  const collection = useCollection();
  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        const field = item.field;
        insert(
          createTableSelectorSchema({
            rowKey: collection.filterTargetKey,
            collection: collection.name,
            resource: collection.name,
          }),
        );
      }}
    />
  );
};
