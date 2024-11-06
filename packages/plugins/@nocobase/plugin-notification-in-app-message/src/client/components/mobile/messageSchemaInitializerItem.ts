/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializerItemType } from '@nocobase/client';
import { useMobileRoutes, MobileRouteItem } from '@nocobase/plugin-mobile/client';
import { uid } from '@formily/shared';
import { Toast } from 'antd-mobile';
import { useLocalTranslation } from '../../../locale';
export const messageSchemaInitializerItem: SchemaInitializerItemType = {
  name: 'message-schema',
  type: 'item',
  useComponentProps() {
    const { t } = useLocalTranslation();
    const { resource, refresh, schemaResource } = useMobileRoutes();
    return {
      isItem: true,
      title: t('Message'),
      badge: 10,
      async onClick(values) {
        const res = await resource.list();
        if (Array.isArray(res?.data?.data)) {
          const findIndex = res?.data?.data.findIndex((route) => route?.options?.url === `/page/in-app-message`);
          if (findIndex > -1) {
            Toast.show({
              icon: 'fail',
              content: t('The message page has already been created.'),
            });
            return;
          }
        }
        const { data } = await resource.create({
          values: {
            type: 'page',
            title: t('Message'),
            icon: 'mailoutlined',
            options: {
              url: `/page/in-app-message`,
              schema: {
                'x-component': 'MobileTabBarMessageItem',
              },
            },
            children: [
              {
                type: 'page',
                title: t('Message'),
                icon: 'mailoutlined',
                options: {
                  url: `/page/in-app-message/messages`,
                  itemSchema: {
                    name: uid(),
                    'x-decorator': 'BlockItem',
                    'x-settings': `mobile:tab-bar:page`,
                    'x-component': 'MobileTabBarMessageItem',
                    'x-toolbar-props': {
                      showBorder: false,
                      showBackground: true,
                    },
                  },
                },
              },
            ],
          } as MobileRouteItem,
        });
        const parentId = data.data.id;
        refresh();
      },
    };
  },
};
