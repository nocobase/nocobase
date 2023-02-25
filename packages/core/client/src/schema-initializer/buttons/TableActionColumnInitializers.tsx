import { MenuOutlined } from '@ant-design/icons';
import { ISchema, useFieldSchema } from '@formily/react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import {
  IsTreeTableContext,
  SchemaInitializer,
  SchemaInitializerItemOptions,
  SchemaSettings,
  TableBlockContext,
} from '../..';
import { useAPIClient } from '../../api-client';
import { createDesignable, useDesignable } from '../../schema-component';

const Resizable = (props) => {
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  return (
    <SchemaSettings.ModalItem
      title={t('Column width')}
      schema={
        {
          type: 'object',
          title: t('Column width'),
          properties: {
            width: {
              'x-decorator': 'FormItem',
              'x-component': 'InputNumber',
              'x-component-props': {},
              default: fieldSchema?.['x-component-props']?.width || 200,
            },
          },
        } as ISchema
      }
      onSubmit={({ width }) => {
        const props = fieldSchema['x-component-props'] || {};
        props['width'] = width;
        const schema: ISchema = {
          ['x-uid']: fieldSchema['x-uid'],
        };
        schema['x-component-props'] = props;
        fieldSchema['x-component-props'] = props;
        dn.emit('patch', {
          schema,
        });
        dn.refresh();
      }}
    />
  );
};

export const TableActionColumnInitializers = (props: any) => {
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const { refresh } = useDesignable();
  const { t } = useTranslation();
  const treeTable = useContext(IsTreeTableContext);

  return (
    <SchemaInitializer.Button
      insertPosition={'beforeEnd'}
      insert={(schema) => {
        const spaceSchema = fieldSchema.reduceProperties((buf, schema) => {
          if (schema['x-component'] === 'Space') {
            return schema;
          }
          return buf;
        }, null);
        if (!spaceSchema) {
          return;
        }
        const dn = createDesignable({
          t,
          api,
          refresh,
          current: spaceSchema,
        });
        dn.loadAPIClientEvents();
        dn.insertBeforeEnd(schema);
      }}
      items={[
        {
          type: 'itemGroup',
          title: t('Enable actions'),
          children: [
            {
              type: 'item',
              title: t('View'),
              component: 'ViewActionInitializer',
              schema: {
                'x-component': 'Action.Link',
                'x-action': 'view',
                'x-decorator': 'ACLActionProvider',
              },
            },
            {
              type: 'item',
              title: t('Edit'),
              component: 'UpdateActionInitializer',
              schema: {
                'x-component': 'Action.Link',
                'x-action': 'update',
                'x-decorator': 'ACLActionProvider',
              },
            },
            {
              type: 'item',
              title: t('Delete'),
              component: 'DestroyActionInitializer',
              schema: {
                'x-component': 'Action.Link',
                'x-action': 'destroy',
                'x-decorator': 'ACLActionProvider',
              },
            },
            treeTable
              ? {
                  type: 'item',
                  title: t('Add Child'),
                  component: 'CreateChildNodeInitializer',
                  schema: {
                    'x-component': 'Action.Link',
                    'x-action': 'create',
                    'x-decorator': 'ACLActionProvider',
                  },
                }
              : null,
          ].filter((i) => i) as SchemaInitializerItemOptions[],
        },
        {
          type: 'divider',
        },
        {
          type: 'subMenu',
          title: '{{t("Customize")}}',
          children: [
            {
              type: 'item',
              title: '{{t("Popup")}}',
              component: 'CustomizeActionInitializer',
              schema: {
                type: 'void',
                title: '{{ t("Popup") }}',
                'x-action': 'customize:popup',
                'x-designer': 'Action.Designer',
                'x-component': 'Action.Link',
                'x-component-props': {
                  openMode: 'drawer',
                },
                properties: {
                  drawer: {
                    type: 'void',
                    title: '{{ t("Popup") }}',
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
            {
              type: 'item',
              title: '{{t("Update record")}}',
              component: 'CustomizeActionInitializer',
              schema: {
                title: '{{ t("Update record") }}',
                'x-component': 'Action.Link',
                'x-action': 'customize:update',
                'x-decorator': 'ACLActionProvider',
                'x-acl-action': 'update',
                'x-designer': 'Action.Designer',
                'x-action-settings': {
                  assignedValues: {},
                  onSuccess: {
                    manualClose: true,
                    redirecting: false,
                    successMessage: '{{t("Updated successfully")}}',
                  },
                },
                'x-component-props': {
                  useProps: '{{ useCustomizeUpdateActionProps }}',
                },
              },
            },
            {
              type: 'item',
              title: '{{t("Custom request")}}',
              component: 'CustomizeActionInitializer',
              schema: {
                title: '{{ t("Custom request") }}',
                'x-component': 'Action.Link',
                'x-action': 'customize:table:request',
                'x-designer': 'Action.Designer',
                'x-action-settings': {
                  requestSettings: {},
                  onSuccess: {
                    manualClose: false,
                    redirecting: false,
                    successMessage: '{{t("Request success")}}',
                  },
                },
                'x-component-props': {
                  useProps: '{{ useCustomizeRequestActionProps }}',
                },
              },
            },
          ],
        },
        {
          type: 'divider',
        },
        {
          type: 'item',
          title: t('Column width'),
          component: Resizable,
        },
      ]}
      component={<MenuOutlined style={{ cursor: 'pointer' }} />}
    />
  );
};
