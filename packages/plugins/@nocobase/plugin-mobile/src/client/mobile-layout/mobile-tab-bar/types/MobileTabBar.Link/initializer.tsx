/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializerItemActionModalType } from '@nocobase/client';
import { App } from 'antd';
import { generatePluginTranslationTemplate, usePluginTranslation } from '../../../../locale';
import { getMobileTabBarItemSchemaFields } from '../../MobileTabBar.Item';
import { MobileRouteItem, useMobileRoutes } from '../../../../mobile-providers';

export const mobileTabBarLinkInitializerItem: SchemaInitializerItemActionModalType = {
  name: 'link',
  type: 'actionModal',
  useComponentProps() {
    const { resource, refresh } = useMobileRoutes();
    const { t } = usePluginTranslation();
    const { message } = App.useApp();

    return {
      isItem: true,
      title: generatePluginTranslationTemplate('Add link'),
      buttonText: generatePluginTranslationTemplate('Link'),
      schema: getMobileTabBarItemSchemaFields(),
      async onSubmit(values) {
        if (!values.title || values.title.trim() === '') {
          message.error(t('Title field is required'));
          return Promise.reject(new Error(t('Title field is required')));
        }
        if (!values.icon) {
          message.error(t('Icon field is required'));
          return Promise.reject(new Error(t('Icon field is required')));
        }

        // 先创建 tab item
        await resource.create({
          values: {
            type: 'link',
            title: values.title,
            icon: values.icon,
          } as MobileRouteItem,
        });

        // 刷新 tabs
        await refresh();
      },
    };
  },
};
