import { FormOutlined } from '@ant-design/icons';
import { FormDialog, FormLayout } from '@formily/antd';
import { ISchema, SchemaOptionsContext } from '@formily/react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useCollectionManager } from '../../../collection-manager';
import { SchemaComponent, SchemaComponentOptions } from '../../../schema-component';
import { SchemaInitializer } from '../../SchemaInitializer';

const createSchema = (collectionName, { groupField }) => {
  const schema: ISchema = {
    type: 'void',
    'x-collection': 'collections',
    'x-decorator': 'ResourceActionProvider',
    'x-decorator-props': {
      collection: collectionName,
      request: {
        resource: collectionName,
        action: 'list',
        params: {
          paginate: false,
        },
      },
    },
    'x-designer': 'Kanban.Designer',
    'x-component': 'BlockItem',
    properties: {
      kanban: {
        type: 'array',
        name: 'kanban',
        'x-component': 'Kanban',
        'x-component-props': {
          useDataSource: '{{ cm.useDataSourceFromRAC }}',
          groupField: groupField?.uiSchema,
          cardAdderPosition: 'bottom',
          allowAddCard: { on: 'bottom' },
          disableColumnDrag: true,
          // useDragEndAction: '{{ useDragEndHandler }}',
        },
        properties: {
          card: {
            type: 'void',
            name: 'card',
            'x-component': 'Kanban.Card',
            'x-decorator': 'BlockItem',
            'x-designer': 'Kanban.Card.Designer',
            'x-read-pretty': true,
            properties: {},
          },
          cardAdder: {
            type: 'void',
            'x-component': 'Kanban.CardAdder',
            'x-designer': 'Action.Designer',
            'x-component-props': {
              type: 'text',
              openMode: 'drawer',
            },
            title: '添加卡片',
            properties: {
              drawer: {
                type: 'void',
                title: '{{ t("Add new record") }}',
                'x-component': 'Action.Container',
                'x-component-props': {},
                'x-decorator': 'Form',
                'x-decorator-props': {
                  useValues: '{{useCreateKanbanCardValues}}',
                },
                properties: {
                  grid: {
                    type: 'void',
                    'x-component': 'Grid',
                    'x-initializer': 'GridFormItemInitializers',
                    properties: {},
                  },
                  footer: {
                    type: 'void',
                    'x-component': 'Action.Container.Footer',
                    properties: {
                      actions: {
                        type: 'void',
                        'x-initializer': 'PopupFormActionInitializers',
                        'x-decorator': 'DndContext',
                        'x-component': 'ActionBar',
                        'x-component-props': {
                          layout: 'one-column',
                        },
                        properties: {},
                      },
                    },
                  },
                },
              },
            },
          },
          cardViewer: {
            type: 'void',
            'x-component': 'Kanban.CardViewer',
            properties: {
              drawer: {
                type: 'void',
                'x-component': 'Action.Container',
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

export const KanbanBlockInitializer = (props) => {
  const { insert } = props;
  const { collections, getCollection } = useCollectionManager();
  const { t } = useTranslation();
  const options = useContext(SchemaOptionsContext);
  return (
    <SchemaInitializer.Item
      {...props}
      icon={<FormOutlined />}
      onClick={async ({ item }) => {
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
        console.log('groupField', values.groupField);
        insert(createSchema(item.name, values));
      }}
      items={[
        {
          type: 'itemGroup',
          title: t('Select data source'),
          children: collections
            ?.filter((item) => !item.inherit)
            ?.map((item) => {
              return {
                type: 'item',
                name: item.name,
                title: item.title,
              };
            }),
        },
      ]}
    />
  );
};
