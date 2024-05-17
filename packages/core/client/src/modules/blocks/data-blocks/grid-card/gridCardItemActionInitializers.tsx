/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CompatibleSchemaInitializer } from '../../../../application/schema-initializer/CompatibleSchemaInitializer';
import { useCollection_deprecated } from '../../../../collection-manager';

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
      useVisible() {
        const collection = useCollection_deprecated();
        return (collection.template !== 'view' || collection?.writableView) && collection.template !== 'sql';
      },
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
      useVisible() {
        const collection = useCollection_deprecated();
        return collection.template !== 'sql';
      },
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
