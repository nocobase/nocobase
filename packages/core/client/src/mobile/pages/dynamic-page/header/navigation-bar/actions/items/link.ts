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
  useLinkActionProps,
} from '../../../../schema-component';
import { App } from 'antd';
import { useTranslation } from 'react-i18next';
import { editAction } from '../actionCommonSettings';
import { actionCommonInitializerSchema } from '../actionCommonInitializerSchema';

export const mobileNavigationBarLinkSettings = new SchemaSettings({
  name: 'mobile:navigation-bar:actions:link',
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
        title: '{{t("Delete action")}}',
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
    const { t } = useTranslation();
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
