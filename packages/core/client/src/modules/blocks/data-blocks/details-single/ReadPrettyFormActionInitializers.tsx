/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { useCollection, useDataBlockProps } from '../../../../data-source';
import { useActionAvailable } from '../../useActionAvailable';

const commonOptions = {
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  style: {
    marginLeft: 8,
  },
  items: [
    {
      title: '{{t("Edit")}}',
      name: 'edit',
      Component: 'UpdateActionInitializer',
      schema: {
        'x-component': 'Action',
        'x-decorator': 'ACLActionProvider',
        'x-component-props': {
          type: 'primary',
        },
      },
      useVisible: () => useActionAvailable('update'),
    },
    {
      title: '{{t("Delete")}}',
      name: 'delete',
      Component: 'DestroyActionInitializer',
      schema: {
        'x-component': 'Action',
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
        'x-component': 'Action',
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
      name: 'popup',
      title: '{{t("Popup")}}',
      Component: 'PopupActionInitializer',
      useComponentProps() {
        return {
          'x-component': 'Action',
        };
      },
    },
    {
      name: 'updateRecord',
      title: '{{t("Update record")}}',
      Component: 'UpdateRecordActionInitializer',
      useComponentProps() {
        return {
          'x-component': 'Action',
        };
      },
      useVisible: () => useActionAvailable('update'),
    },
    {
      name: 'customRequest',
      title: '{{t("Custom request")}}',
      Component: 'CustomRequestInitializer',
    },
    {
      name: 'link',
      title: '{{t("Link")}}',
      Component: 'LinkActionInitializer',
      useComponentProps() {
        return {
          'x-component': 'Action',
        };
      },
    },
  ],
};

/**
 * @deprecated
 * use `readPrettyFormActionInitializers` instead
 * 表单的操作配置
 */
export const readPrettyFormActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'ReadPrettyFormActionInitializers',
  ...commonOptions,
});

export const readPrettyFormActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'details:configureActions',
    ...commonOptions,
  },
  readPrettyFormActionInitializers_deprecated,
);
