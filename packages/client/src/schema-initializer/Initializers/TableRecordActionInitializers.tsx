import { MenuOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useFieldSchema } from '@formily/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaInitializer } from '../..';
import { useAPIClient } from '../../api-client';
import { createDesignable, useDesignable } from '../../schema-component';

export const TableRecordActionInitializers = (props: any) => {
  const fieldSchema = useFieldSchema();
  const api = useAPIClient();
  const { refresh } = useDesignable();
  const { t } = useTranslation();
  return (
    <SchemaInitializer.Button
      className={css`
        border: 0 !important;
        color: #fff !important;
        background: none !important;
        height: auto !important;
        line-height: 12px !important;
        width: 12px !important;
        padding: 0;
        font-size: 12px;
      `}
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
              component: 'ActionInitializer',
              schema: {
                title: '{{ t("View") }}',
                type: 'void',
                'x-action': 'view',
                'x-designer': 'Action.Designer',
                'x-component': 'Action.Link',
                'x-component-props': {},
                properties: {
                  drawer: {
                    type: 'void',
                    'x-component': 'Action.Drawer',
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
            {
              type: 'item',
              title: t('Edit'),
              component: 'ActionInitializer',
              schema: {
                title: '{{ t("Edit") }}',
                type: 'void',
                'x-action': 'update',
                'x-designer': 'Action.Designer',
                'x-component': 'Action.Link',
                'x-component-props': {},
                properties: {
                  drawer: {
                    type: 'void',
                    'x-decorator': 'Form',
                    'x-decorator-props': {
                      useValues: '{{ cm.useValuesFromRecord }}',
                    },
                    'x-component': 'Action.Drawer',
                    title: '{{ t("Edit record") }}',
                    properties: {
                      grid: {
                        type: 'void',
                        'x-component': 'Grid',
                        'x-initializer': 'GridFormItemInitializers',
                        properties: {},
                      },
                      footer: {
                        type: 'void',
                        'x-component': 'Action.Drawer.Footer',
                        properties: {
                          actions: {
                            type: 'void',
                            'x-component': 'ActionBar',
                            'x-component-props': {
                              layout: 'one-column',
                            },
                            properties: {
                              cancel: {
                                title: '{{ t("Cancel") }}',
                                'x-action': 'cancel',
                                'x-component': 'Action',
                                'x-component-props': {
                                  useAction: '{{ cm.useCancelAction }}',
                                },
                              },
                              submit: {
                                title: '{{ t("Submit") }}',
                                'x-action': 'submit',
                                'x-component': 'Action',
                                'x-component-props': {
                                  type: 'primary',
                                  useAction: '{{ cm.useUpdateAction }}',
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
            {
              type: 'item',
              title: t('Delete'),
              component: 'ActionInitializer',
              schema: {
                title: '{{ t("Delete") }}',
                'x-action': 'destroy',
                'x-designer': 'Action.Designer',
                'x-component': 'Action.Link',
                'x-component-props': {
                  confirm: {
                    title: "{{t('Delete record')}}",
                    content: "{{t('Are you sure you want to delete it?')}}",
                  },
                  useAction: '{{ cm.useDestroyAction }}',
                },
              },
            },
          ],
        },
      ]}
    >
      <MenuOutlined />
    </SchemaInitializer.Button>
  );
};
