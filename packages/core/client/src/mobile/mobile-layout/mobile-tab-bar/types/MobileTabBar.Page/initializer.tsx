/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { uid } from '@formily/shared';
import { SchemaInitializerItemActionModalType } from '../../../../schema-component';
import { App } from 'antd';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';
import { MobileRouteItem, useMobileRoutes } from '../../../../mobile-providers';
import { getMobilePageSchema } from '../../../../pages';
import { getMobileTabBarItemSchemaFields } from '../../MobileTabBar.Item';

export const mobileTabBarSchemaInitializerItem: SchemaInitializerItemActionModalType = {
  name: 'schema',
  type: 'actionModal',
  useComponentProps() {
    const { resource, refresh, schemaResource } = useMobileRoutes();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { message } = App.useApp();

    return {
      isItem: true,
      title: t('Add page'),
      buttonText: t('Page'),
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

        const pageSchemaUid = uid();
        const firstTabUid = uid();
        const url = `/page/${pageSchemaUid}`;

        const { data } = await resource.create({
          values: {
            type: 'page',
            schemaUid: pageSchemaUid,
            title: values.title,
            icon: values.icon,
            enableTabs: false,
          } as MobileRouteItem,
        });

        await schemaResource.insertAdjacent({
          resourceIndex: 'mobile',
          position: 'beforeEnd',
          values: getMobilePageSchema(pageSchemaUid, firstTabUid),
        });

        const parentId = data.data.id;
        await resource.create({
          values: {
            type: 'tabs',
            parentId,
            schemaUid: firstTabUid,
            hidden: true,
          } as MobileRouteItem,
        });

        await refresh();

        navigate(url);
      },
    };
  },
};
