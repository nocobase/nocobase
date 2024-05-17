/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { useCollection_deprecated } from '../../../../collection-manager/hooks/useCollection_deprecated';

const useVisibleCollection = () => {
  const collection = useCollection_deprecated();
  return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
};

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
      useVisible: useVisibleCollection,
    },
    {
      title: '{{t("Delete")}}',
      name: 'delete',
      Component: 'DestroyActionInitializer',
      schema: {
        'x-component': 'Action',
        'x-decorator': 'ACLActionProvider',
      },
      useVisible: useVisibleCollection,
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
      useVisible: useVisibleCollection,
    },
    {
      name: 'customRequest',
      title: '{{t("Custom request")}}',
      Component: 'CustomRequestInitializer',
      useVisible: useVisibleCollection,
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
