/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { uid } from '@formily/shared';
import {
  SchemaInitializer,
  useSchemaInitializer,
  useSchemaInitializerRender,
  SchemaInitializerActionModal,
} from '@nocobase/client';

import { getPageContentTabSchema } from '../../content';
import { MobileRouteItem, useMobileRoutes } from '../../../../mobile-providers';
import { generatePluginTranslationTemplate } from '../../../../locale';

export const mobilePagesTabInitializer = new SchemaInitializer({
  name: 'mobile:page:tabs',
  Component: () => {
    const { refresh, resource, activeTabBarItem } = useMobileRoutes();
    const { insert } = useSchemaInitializer();

    return (
      <SchemaInitializerActionModal
        title={generatePluginTranslationTemplate('Add tab')}
        btnStyles={{ width: 32, padding: 0, marginRight: 12 }}
        onSubmit={async ({ title, icon }) => {
          // 创建 Tab
          const tabSchemaUid = uid();
          await resource.create({
            values: {
              type: 'tabs',
              title,
              icon,
              schemaUid: tabSchemaUid,
              parentId: activeTabBarItem.id,
            } as MobileRouteItem,
          });

          // 创建 Schema
          insert(getPageContentTabSchema(tabSchemaUid));

          await refresh();
        }}
        schema={{
          title: {
            type: 'string',
            title: generatePluginTranslationTemplate('Title'),
            required: true,
            'x-component': 'Input',
            'x-decorator': 'FormItem',
          },
          icon: {
            title: generatePluginTranslationTemplate('Icon'),
            type: 'string',
            'x-decorator': 'FormItem',
            'x-component': 'IconPicker',
          },
        }}
      ></SchemaInitializerActionModal>
    );
  },
});

export const MobilePageTabInitializer = () => {
  const { render } = useSchemaInitializerRender(mobilePagesTabInitializer.name);
  return render();
};
