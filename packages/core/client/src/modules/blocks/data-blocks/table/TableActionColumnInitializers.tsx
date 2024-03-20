import { MenuOutlined } from '@ant-design/icons';
import { ISchema, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../../api-client';
import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { SchemaInitializerActionModal } from '../../../../application/schema-initializer/components/SchemaInitializerActionModal';
import { SchemaInitializerItem } from '../../../../application/schema-initializer/components/SchemaInitializerItem';
import { useSchemaInitializer } from '../../../../application/schema-initializer/context';
import { useCollection_deprecated } from '../../../../collection-manager';
import { useDataBlockProps } from '../../../../data-source';
import { createDesignable, useDesignable } from '../../../../schema-component';
import { useGetAriaLabelOfDesigner } from '../../../../schema-settings/hooks/useGetAriaLabelOfDesigner';

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

const commonOptions = {
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
            const collection = useCollection_deprecated();
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
            const collection = useCollection_deprecated();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
        {
          type: 'item',
          title: '{{t("Disassociate")}}',
          name: 'disassociate',
          Component: 'DisassociateActionInitializer',
          schema: {
            'x-component': 'Action.Link',
            'x-action': 'disassociate',
            'x-acl-action': 'destroy',
            'x-decorator': 'ACLActionProvider',
          },
          useVisible() {
            const props = useDataBlockProps();
            const collection = useCollection_deprecated();
            return (
              !!props?.association &&
              (collection.template !== 'view' || collection?.writableView) &&
              collection.template !== 'sql'
            );
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
            const collection = useCollection_deprecated();
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
          Component: 'PopupActionInitializer',
        },
        {
          type: 'item',
          title: '{{t("Update record")}}',
          name: 'updateRecord',
          Component: 'UpdateRecordActionInitializer',
          useVisible() {
            const collection = useCollection_deprecated();
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
            const collection = useCollection_deprecated();
            return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
          },
        },
      ],
    },
    {
      name: 'divider2',
      type: 'divider',
    },
    {
      type: 'item',
      name: 'columnWidth',
      title: 't("Column width")',
      Component: Resizable,
    },
  ],
};

/**
 * @deprecated
 */
export const tableActionColumnInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'TableActionColumnInitializers',
  ...commonOptions,
});

export const tableActionColumnInitializers = new CompatibleSchemaInitializer(
  {
    name: 'table:configureItemActions',
    ...commonOptions,
  },
  tableActionColumnInitializers_deprecated,
);
