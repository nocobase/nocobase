/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, SchemaInitializerItemActionModalType, SchemaSettings, SchemaSettingsActionLinkItem, useSchemaInitializer } from '@nocobase/client';
import { App } from 'antd';
import { usePluginTranslation } from '../../../../../locale';
import { editAction } from '../actionCommonSettings';
import { useLinkActionProps } from '@nocobase/client';

export const mobileNavigationBarLinkSettings = new SchemaSettings({
  name: `mobile:navigation-bar:link`,
  items: [
    editAction(),
    {
      name: 'editLink',
      Component: SchemaSettingsActionLinkItem,
    },
    {
      name: 'remove',
      type: 'remove',
    },
  ],
});

export const useMobileNavigationBarLink = () => {
  const { onClick } = useLinkActionProps();
  return {
    onClick,
  };
};

export const getMobileNavigationBarLinkSchema = (values: any): ISchema => ({
  type: 'void',
  'x-component': 'Action',
  'x-toolbar': 'ActionSchemaToolbar',
  'x-settings': mobileNavigationBarLinkSettings.name,
  'x-use-component-props': 'useMobileNavigationBarLink',
  'x-component-props': {
    ...values,
    component: 'MobileNavigationBarAction',
  },
});

export const mobileNavigationBarLinkInitializerItem: SchemaInitializerItemActionModalType = {
  name: 'link',
  type: 'actionModal',
  useComponentProps() {
    const { insert } = useSchemaInitializer();
    const { t } = usePluginTranslation();
    const { message } = App.useApp();
    return {
      title: t('Add Link'),
      buttonText: t('Link'),
      schema: {
        title: {
          type: 'string',
          title: t('Title'),
          'x-decorator': 'FormItem',
          'x-component': 'Input',
          'x-reactions': {
            target: 'icon',
            fulfill: {
              state: {
                required: '{{!$self.value}}',
              },
            },
          }
        },
        icon: {
          type: 'string',
          title: t('Icon'),
          'x-decorator': 'FormItem',
          'x-component': 'IconPicker',
          'x-reactions': {
            target: 'title',
            fulfill: {
              state: {
                required: '{{!$self.value}}',
              },
            },
          }
        },
      },
      isItem: true,
      onSubmit(values) {
        if (!values.title && !values.icon) {
          message.error(t('Please enter title or select icon'));
          return;
        }
        insert(getMobileNavigationBarLinkSchema(values));
      },
    };
  },
};
