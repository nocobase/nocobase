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
import { useActionAvailable } from '../../useActionAvailable';
const commonOptions = {
  title: '{{t("Configure actions")}}',
  icon: 'SettingOutlined',
  items: [
    {
      name: 'view',
      title: '{{t("View")}}',
      Component: 'ViewActionInitializer',
      schema: {
        'x-component': 'Action.Link',
        'x-action': 'view',
        'x-decorator': 'ACLActionProvider',
        'x-align': 'left',
      },
      useVisible: () => useActionAvailable('get'),
    },
    {
      name: 'edit',
      title: '{{t("Edit")}}',
      Component: 'UpdateActionInitializer',
      schema: {
        'x-component': 'Action.Link',
        'x-action': 'update',
        'x-decorator': 'ACLActionProvider',
        'x-align': 'left',
      },
      useVisible: () => useActionAvailable('update'),
    },
    {
      name: 'delete',
      title: '{{t("Delete")}}',
      Component: 'DestroyActionInitializer',
      schema: {
        'x-component': 'Action.Link',
        'x-action': 'destroy',
        'x-decorator': 'ACLActionProvider',
        'x-align': 'left',
      },
      useVisible: () => useActionAvailable('destroy'),
    },
    {
      name: 'popup',
      title: '{{t("Popup")}}',
      Component: 'PopupActionInitializer',
      useComponentProps() {
        return {
          'x-component': 'Action.Link',
        };
      },
    },
    {
      name: 'update-record',
      title: '{{t("Update record")}}',
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
 * use `gridCardItemActionInitializers` instead
 */
export const gridCardItemActionInitializers_deprecated = new CompatibleSchemaInitializer({
  name: 'GridCardItemActionInitializers',
  ...commonOptions,
});

export const gridCardItemActionInitializers = new CompatibleSchemaInitializer(
  {
    name: 'gridCard:configureItemActions',
    ...commonOptions,
  },
  gridCardItemActionInitializers_deprecated,
);
