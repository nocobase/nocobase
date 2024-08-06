/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ISchema,
  SchemaInitializerItemActionModalType,
  SchemaSettings,
  SchemaSettingsActionLinkItem,
  useSchemaInitializer,
} from '@nocobase/client';
import { App } from 'antd';
import { usePluginTranslation, generatePluginTranslationTemplate } from '../../../../../../locale';
import { editAction } from '../actionCommonSettings';
import { useLinkActionProps } from '@nocobase/client';
import { actionCommonInitializerSchema } from '../actionCommonInitializerSchema';

export const mobileNavigationBarLinkSettings = new SchemaSettings({
  name: `mobile:navigation-bar:actions:link`,
  items: [
    editAction(),
    {
      name: 'editLink',
      Component: SchemaSettingsActionLinkItem,
    },
    {
      name: 'remove',
      type: 'remove',
      componentProps: {
        title: generatePluginTranslationTemplate('Delete action'),
      },
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
      title: t('Add link'),
      buttonText: t('Link'),
      schema: actionCommonInitializerSchema,
      isItem: true,
      onSubmit(values) {
        if ((!values.title || values.title.trim().length === 0) && !values.icon) {
          message.error(t('Please enter title or select icon'));
          return Promise.reject(new Error('Please enter title or select icon'));
        }
        insert(getMobileNavigationBarLinkSchema(values));
      },
    };
  },
};
