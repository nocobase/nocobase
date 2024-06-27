/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializerItemActionModalType } from '@nocobase/client';
import { useNavigate } from 'react-router-dom';
import { uid } from '@formily/shared';

import { generatePluginTranslationTemplate } from '../../locale';
import { getMobileTabBarItemSchemaFields } from '../MobileTabBar.Item';
import { useMobileTabContext } from '../../mobile-providers';
import { getMobileTabBarSchemaItemData } from './schema';
import { getMobilePageSchema } from '../../mobile-schema-page';
import { getMobileNavigationBarTabData } from '../../mobile-navigation-bar';

export const mobileTabBarSchemaInitializerItem: SchemaInitializerItemActionModalType = {
  name: 'schema',
  type: 'actionModal',
  useComponentProps() {
    const { resource, refresh, schemaResource } = useMobileTabContext();
    const navigate = useNavigate();
    return {
      isItem: true,
      title: generatePluginTranslationTemplate('Add page'),
      buttonText: generatePluginTranslationTemplate('Page'),
      schema: getMobileTabBarItemSchemaFields(),
      async onSubmit(values) {
        if (!values.title && !values.icon) {
          return;
        }

        const pageSchemaUId = uid();
        const firstTabSchemaUid = uid();
        const url = `/schema/${pageSchemaUId}`;

        // 先创建 TabBar item
        const { data } = await resource.create({
          values: getMobileTabBarSchemaItemData({ url, pageSchemaUid: pageSchemaUId, values }),
        });

        // 创建空页面
        await schemaResource.insertAdjacent({
          resourceIndex: 'mobile',
          position: 'beforeEnd',
          values: getMobilePageSchema(pageSchemaUId, firstTabSchemaUid),
        });

        // 创建 TabBar item 的第一个 tab
        const parentId = data.data.id;
        await resource.create({
          values: getMobileNavigationBarTabData({ pageUrl: url, tabSchemaUid: firstTabSchemaUid, parentId }),
        });

        // 刷新 tabs
        await refresh();

        // 再跳转到页面
        navigate(url);
      },
    };
  },
};
