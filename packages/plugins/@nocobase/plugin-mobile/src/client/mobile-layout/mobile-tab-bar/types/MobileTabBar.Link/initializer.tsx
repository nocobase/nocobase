/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializerItemActionModalType } from '@nocobase/client';

import { generatePluginTranslationTemplate } from '../../../../locale';
import { getMobileTabBarItemSchemaFields } from '../../MobileTabBar.Item';
import { useMobileRoutes } from '../../../../mobile-providers';
import { getMobileTabBarLinkItemData } from './schema';

export const mobileTabBarLinkInitializerItem: SchemaInitializerItemActionModalType = {
  name: 'link',
  type: 'actionModal',
  useComponentProps() {
    const { resource, refresh } = useMobileRoutes();

    return {
      isItem: true,
      title: generatePluginTranslationTemplate('Add Link'),
      buttonText: generatePluginTranslationTemplate('Link'),
      schema: getMobileTabBarItemSchemaFields(),
      async onSubmit(values) {
        if (!values.title && !values.icon) {
          return;
        }

        // 先创建 tab item
        await resource.create({
          values: getMobileTabBarLinkItemData({ url: undefined, values }),
        });

        // 刷新 tabs
        await refresh();
      },
    };
  },
};
