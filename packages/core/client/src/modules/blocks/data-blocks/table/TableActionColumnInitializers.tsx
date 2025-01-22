/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PlusOutlined } from '@ant-design/icons';
import { ISchema, useField, useFieldSchema } from '@formily/react';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useAPIClient } from '../../../../api-client';
import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { SchemaInitializerActionModal } from '../../../../application/schema-initializer/components/SchemaInitializerActionModal';
import { SchemaInitializerItem } from '../../../../application/schema-initializer/components/SchemaInitializerItem';
import { SelectWithTitle } from '../../../../common/SelectWithTitle';
import { useDataBlockProps } from '../../../../data-source';
import { createDesignable, useDesignable } from '../../../../schema-component';
import { useGetAriaLabelOfDesigner } from '../../../../schema-settings/hooks/useGetAriaLabelOfDesigner';
import { useCollection } from '../../../../data-source';
import { useActionAvailable } from '../../useActionAvailable';
export const Resizable = () => {
  const { t } = useTranslation();
  const { dn } = useDesignable();
  const fieldSchema = useFieldSchema();
  return (
    <SchemaInitializerActionModal
      title={t('Column width')}
      component={React.forwardRef<any, any>((props, ref) => {
        const { children, onClick, ...others } = props;
        return (
          <SchemaInitializerItem
            ref={ref}
            onClick={({ event }) => {
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
              default: fieldSchema?.['x-component-props']?.width || 100,
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

export const SchemaSettingsFixed = () => {
  const field = useField();
  const fieldSchema = useFieldSchema();
  const { t } = useTranslation();
  const { dn } = useDesignable();

  const options = [
    { label: t('Not fixed'), value: 'none' },
    { label: t('Left fixed'), value: 'left' },
    { label: t('Right fixed'), value: 'right' },
  ];
  return (
    <SchemaInitializerItem>
      <SelectWithTitle
        key="fixed"
        title={t('Fixed')}
        options={options}
        defaultValue={field.componentProps?.fixed || 'none'}
        onChange={(fixed) => {
          const schema = {
            ['x-uid']: fieldSchema['x-uid'],
          };
          fieldSchema['x-component-props'] = fieldSchema['x-component-props'] || {};
          fieldSchema['x-component-props']['fixed'] = fixed;
          schema['x-component-props'] = fieldSchema['x-component-props'];
          field.componentProps = field.componentProps || {};
          field.componentProps.fixed = fixed;
          void dn.emit('patch', {
            schema,
          });
          dn.refresh();
        }}
      />
    </SchemaInitializerItem>
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
      <PlusOutlined
        {...props}
        role="button"
        aria-label={getAriaLabel('schema-initializer')}
        style={{ cursor: 'pointer' }}
      />
    );
  },
  items: [
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
      useVisible: () => useActionAvailable('get'),
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
      useVisible: () => useActionAvailable('update'),
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
      useVisible: () => useActionAvailable('destroy'),
    },
    {
      type: 'item',
      title: '{{t("Disassociate")}}',
      name: 'disassociate',
      Component: 'DisassociateActionInitializer',
      schema: {
        'x-component': 'Action.Link',
        'x-action': 'disassociate',
        'x-acl-action': 'update',
        'x-decorator': 'ACLActionProvider',
      },
      useVisible() {
        const props = useDataBlockProps();
        const collection = useCollection() || ({} as any);
        const { unavailableActions, availableActions } = collection?.options || {};
        if (availableActions) {
          return !!props?.association && availableActions.includes?.('update');
        }
        if (unavailableActions) {
          return !!props?.association && !unavailableActions?.includes?.('update');
        }
        return true;
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
        return collection.tree && treeTable;
      },
    },
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
      useVisible: () => useActionAvailable('update'),
    },
    {
      name: 'customRequest',
      title: '{{t("Custom request")}}',
      Component: 'CustomRequestInitializer',
      schema: {
        'x-action': 'customize:table:request',
      },
    },
    {
      name: 'link',
      title: '{{t("Link")}}',
      Component: 'LinkActionInitializer',
      useComponentProps() {
        return {
          'x-component': 'Action.Link',
        };
      },
    },
  ],
};

/**
 * @deprecated
 * use `tableActionColumnInitializers` instead
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
