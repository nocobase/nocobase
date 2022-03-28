import { FormOutlined, TableOutlined } from '@ant-design/icons';
import { FormDialog, FormLayout } from '@formily/antd';
import { SchemaOptionsContext } from '@formily/react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../api-client';
import { useCollectionManager } from '../../collection-manager';
import { SchemaComponent, SchemaComponentOptions } from '../../schema-component';
import { useSchemaTemplateManager } from '../../schema-templates';
import { SchemaInitializer } from '../SchemaInitializer';
import {
  createCalendarBlockSchema,
  createFormBlockSchema,
  createKanbanBlockSchema,
  createTableBlockSchema,
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

export const DataBlockInitializer = (props) => {
  const { onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  return (
    <SchemaInitializer.Item
      icon={<TableOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          insert(s);
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
      componentType={'Form'}
      createBlockSchema={createFormBlockSchema}
    />
  );
};

export const CalendarBlockInitializer = (props) => {
  const { insert } = props;
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
        const values = await FormDialog('创建日历区块', () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
                    properties: {
                      title: {
                        title: '标题字段',
                        enum: stringFields,
                        required: true,
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                      start: {
                        title: '开始日期字段',
                        enum: dateFields,
                        required: true,
                        default: 'createdAt',
                        'x-component': 'Select',
                        'x-decorator': 'FormItem',
                      },
                      end: {
                        title: '结束日期字段',
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
            ...values,
          }),
        );
      }}
    />
  );
};

export const KanbanBlockInitializer = (props) => {
  const { insert } = props;
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
        const values = await FormDialog('创建看板区块', () => {
          return (
            <SchemaComponentOptions scope={options.scope} components={{ ...options.components }}>
              <FormLayout layout={'vertical'}>
                <SchemaComponent
                  schema={{
                    properties: {
                      groupField: {
                        title: '分组字段',
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
            ...values,
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

export const ActionInitializer = (props) => {
  const { schema, item, insert } = props;
  const { exists, remove } = useCurrentSchema(
    schema?.['x-action'] || item?.schema?.['x-action'],
    'x-action',
    item.find,
  );
  return (
    <SchemaInitializer.SwitchItem
      checked={exists}
      title={item.title}
      onClick={() => {
        if (exists) {
          return remove();
        }
        console.log(schema, item);
        insert({
          ...schema,
          ...item.schema,
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
    'x-designer': 'Action.Designer',
    'x-component': 'Action',
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
          grid: {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'CreateFormBlockInitializers',
            properties: {},
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
          grid: {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'RecordBlockInitializers',
            properties: {},
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
          grid: {
            type: 'void',
            'x-component': 'Grid',
            'x-initializer': 'RecordFormBlockInitializers',
            properties: {},
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
      confirm: {
        title: "{{t('Delete record')}}",
        content: "{{t('Are you sure you want to delete it?')}}",
      },
      // useProps: '{{ bp.useBulkDestroyActionProps }}',
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
      confirm: {
        title: "{{t('Delete record')}}",
        content: "{{t('Are you sure you want to delete it?')}}",
      },
      // useProps: '{{ bp.useDestroyActionProps }}',
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

export const CollectionFieldInitializer = () => null;
export const AssociationFieldInitializer = () => null;
export const TableFieldInitializer = () => null;
export const AssociationBlockInitializer = () => null;

export const RecordAssociationBlockInitializer = () => null;

export const CreateFormBlockInitializer = (props) => {
  const { onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          insert(s);
        } else {
          insert(createFormBlockSchema({ collection: item.name }));
        }
      }}
      items={useRecordCollectionDataSourceItems('Form')}
    />
  );
};

export const RecordFormBlockInitializer = (props) => {
  const { onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          insert(s);
        } else {
          insert(createFormBlockSchema({ collection: item.name }));
        }
      }}
      items={useRecordCollectionDataSourceItems('Form')}
    />
  );
};

export const RecordReadPrettyFormBlockInitializer = (props) => {
  const { onCreateBlockSchema, componentType, createBlockSchema, insert, ...others } = props;
  const { getTemplateSchemaByMode } = useSchemaTemplateManager();
  return (
    <SchemaInitializer.Item
      icon={<FormOutlined />}
      {...others}
      onClick={async ({ item }) => {
        if (item.template) {
          const s = await getTemplateSchemaByMode(item);
          insert(s);
        } else {
          insert(createFormBlockSchema({ collection: item.name }));
        }
      }}
      items={useRecordCollectionDataSourceItems('Details')}
    />
  );
};
