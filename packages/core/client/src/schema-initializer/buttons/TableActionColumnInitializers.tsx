import { MenuOutlined } from '@ant-design/icons';
import { ISchema, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../api-client';
import { SchemaInitializerActionModal, SchemaInitializerItem, useSchemaInitializer } from '../../application';
import { SchemaInitializer } from '../../application/schema-initializer/SchemaInitializer';
import { useCollection } from '../../collection-manager';
import { createDesignable, useDesignable } from '../../schema-component';
import { useGetAriaLabelOfDesigner } from '../../schema-settings/hooks/useGetAriaLabelOfDesigner';

export const Resizable = () => {
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  return (
    <SchemaInitializerActionModal
      title={t('Column width')}
      component={React.forwardRef<any, any>((props, ref) => {
        const { children, onClick, ...others } = props;
        const { setVisible } = useSchemaInitializer();
        return (
          <SchemaInitializerItem
            ref={ref}
            onClick={({ event }) => {
              setVisible(false);
              onClick(event);
            }}
            {...others}
            title={t('Column width')}
          ></SchemaInitializerItem>
        );
      })}
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

export const tableActionColumnInitializers = new SchemaInitializer({
  name: 'TableActionColumnInitializers',
  insertPosition: 'beforeEnd',
  useInsert: function useInsert() {
    const { refresh } = useDesignable();
    const fieldSchema = useFieldSchema();
    const api = useAPIClient();
    const { t } = useTranslation();

    return function insert(schema) {
      const spaceSchema = fieldSchema.reduceProperties((buf, schema) => {
        if (schema['x-component'] === 'Space') {
          return schema;
        }
        return buf;
      }, null);
      if (!spaceSchema) {
        return;
      }
      _.set(schema, 'x-designer-props.linkageAction', true);
      const dn = createDesignable({
        t,
        api,
        refresh,
        current: spaceSchema,
      });
      dn.loadAPIClientEvents();
      dn.insertBeforeEnd(schema);
    };
  },
  Component: (props: any) => {
    const { getAriaLabel } = useGetAriaLabelOfDesigner();
    return (
      <MenuOutlined
        {...props}
        role="button"
        aria-label={getAriaLabel('schema-settings')}
        style={{ cursor: 'pointer' }}
      />
    );
  },
  items: [
    {
      type: 'itemGroup',
      name: 'actions',
      title: '{{t("Enable actions")}}',
      children: [
        {
          type: 'item',
          title: '{{t("View")}}',
          name: 'view',
          Component: 'ViewActionInitializer',
          schema: {
            'x-component': 'Action.Link',
            'x-action': 'view',
            'x-decorator': 'ACLActionProvider',
          },
        },
        {
          type: 'item',
          name: 'edit',
          title: '{{t("Edit")}}',
          Component: 'UpdateActionInitializer',
          schema: {
            'x-component': 'Action.Link',
            'x-action': 'update',
            'x-decorator': 'ACLActionProvider',
          },
          useVisible() {
            const collection = useCollection();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
        {
          type: 'item',
          title: '{{t("Delete")}}',
          name: 'delete',
          Component: 'DestroyActionInitializer',
          schema: {
            'x-component': 'Action.Link',
            'x-action': 'destroy',
            'x-decorator': 'ACLActionProvider',
          },
          useVisible() {
            const collection = useCollection();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
        {
          type: 'item',
          title: '{{t("Add child")}}',
          name: 'addChildren',
          Component: 'CreateChildInitializer',
          schema: {
            'x-component': 'Action.Link',
            'x-action': 'create',
            'x-decorator': 'ACLActionProvider',
          },
          useVisible() {
            const fieldSchema = useFieldSchema();
            const collection = useCollection();
            const { treeTable } = fieldSchema?.parent?.parent['x-decorator-props'] || {};
            return collection.tree && treeTable !== false;
          },
        },
      ],
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      type: 'subMenu',
      title: '{{t("Customize")}}',
      name: 'customize',
      children: [
        {
          type: 'item',
          title: '{{t("Popup")}}',
          name: 'popup',
          Component: 'CustomizeActionInitializer',
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
          name: 'updateRecord',
          Component: 'CustomizeActionInitializer',
          schema: {
            title: '{{t("Update record")}}',
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
          useVisible() {
            const collection = useCollection();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
        {
          name: 'customRequest',
          title: '{{t("Custom request")}}',
          Component: 'CustomRequestInitializer',
          schema: {
            'x-action': 'customize:table:request',
          },
          useVisible() {
            const collection = useCollection();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
      ],
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      type: 'item',
      name: 'columnWidth',
      title: 't("Column width")',
      Component: Resizable,
    },
  ],
});
