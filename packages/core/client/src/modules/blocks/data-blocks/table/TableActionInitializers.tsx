/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { useCollection, useDataBlockProps } from '../../../../data-source';
import { useActionAvailable } from '../../useActionAvailable';

const commonOptions = {
  title: "{{t('Configure actions')}}",
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      type: 'item',
      name: 'filter',
      title: "{{t('Filter')}}",
      Component: 'FilterActionInitializer',
      schema: {
        'x-align': 'left',
      },
    },

    {
      type: 'item',
      title: "{{t('Add new')}}",
      name: 'addNew',
      Component: 'CreateActionInitializer',
      schema: {
        'x-align': 'right',
        'x-decorator': 'ACLActionProvider',
        'x-acl-action-props': {
          skipScopeCheck: true,
        },
      },
      useVisible: () => useActionAvailable('create'),
    },
    {
      type: 'item',
      title: '{{t("Associate")}}',
      name: 'associate',
      Component: 'AssociateActionInitializer',
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
      title: "{{t('Popup')}}",
      name: 'popup',
      Component: 'PopupActionInitializer',
      componentProps: {
        'x-component': 'Action',
        'x-initializer': 'page:addBlock',
      },
      schema: {
        'x-align': 'right',
      },
    },
    {
      type: 'item',
      title: "{{t('Delete')}}",
      name: 'delete',
      Component: 'BulkDestroyActionInitializer',
      schema: {
        'x-align': 'right',
        'x-decorator': 'ACLActionProvider',
      },
      useVisible: () => useActionAvailable('destroyMany'),
    },
    {
      type: 'item',
      title: "{{t('Refresh')}}",
      name: 'refresh',
      Component: 'RefreshActionInitializer',
      schema: {
        'x-align': 'right',
      },
    },
    {
      type: 'item',
      title: "{{t('Column Settings')}}",
      name: 'editTable',
      Component: 'EditTableActionInitializer',
      schema: {
        'x-align': 'right',
      },
    },
    {
      type: 'item',
      title: "{{t('Link')}}",
      name: 'link',
      Component: 'LinkActionInitializer',
      schema: {
        'x-align': 'right',
      },
      useComponentProps() {
        return {
          'x-component': 'Action',
        };
      },
    },
    {
      name: 'toggle',
      title: "{{t('Expand/Collapse')}}",
      Component: 'ExpandableActionInitializer',
      schema: {
        'x-align': 'right',
      },
      useVisible() {
        const schema = useFieldSchema();
        const collection = useCollection();
        const { treeTable } = schema?.parent?.['x-decorator-props'] || {};
        return collection.tree && treeTable;
      },
    },
    {
      name: 'customRequest',
      title: '{{t("Custom request")}}',
      Component: 'CustomRequestInitializer',
      schema: {
        'x-action': 'customize:table:request:global',
      },
    },
  ],
};

/**
 * @deprecated
 * use `tableActionInitializers` instead
 * 表格操作配置
 */
export const tableActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'TableActionInitializers',
  ...commonOptions,
});

export const tableActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'table:configureActions',
    ...commonOptions,
  },
  tableActionInitializers_deprecated,
);
