/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { useCollection } from '../../../../data-source';

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
      useVisible() {
        const collection = useCollection() || ({} as any);
        const { unavailableActions, availableActions } = collection?.options || {};
        if (availableActions) {
          return availableActions.includes?.('update');
        }
        if (unavailableActions) {
          return !unavailableActions?.includes?.('update');
        }
        return true;
      },
    },
    {
      title: '{{t("Delete")}}',
      name: 'delete',
      Component: 'DestroyActionInitializer',
      schema: {
        'x-component': 'Action',
        'x-decorator': 'ACLActionProvider',
      },
      useVisible() {
        const collection = useCollection() || ({} as any);
        const { unavailableActions, availableActions } = collection?.options || {};
        if (availableActions) {
          return availableActions.includes?.('destroy');
        }
        if (unavailableActions) {
          return !unavailableActions?.includes?.('destroy');
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
      useVisible() {
        const collection = useCollection() || ({} as any);
        const { unavailableActions, availableActions } = collection?.options || {};
        if (availableActions) {
          return availableActions.includes?.('update');
        }
        if (unavailableActions) {
          return !unavailableActions?.includes?.('update');
        }
        return true;
      },
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
