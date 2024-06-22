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
  SchemaInitializerActionModal,
  useSchemaInitializer,
  useSchemaInitializerRender,
} from '@nocobase/client';

import { useMobileTabContext } from '../../mobile-providers';
import { getMobileTabBarItemTabData, getPageContentSchema } from '../../mobile-tab-bar';
import { generatePluginTranslationTemplate } from '../../locale';

export const mobilePageTabInitializer = new SchemaInitializer({
  name: 'mobile:page-tab',
  Component: () => {
    const { refresh, resource, activeTabBarItem } = useMobileTabContext();
    const { insert } = useSchemaInitializer();

    return (
      <SchemaInitializerActionModal
        title={generatePluginTranslationTemplate('Add Tab')}
        buttonText={generatePluginTranslationTemplate('Add Tab')}
        onSubmit={async ({ title }) => {
          // 创建 Tab
          const schemaId = uid();
          await resource.create({
            values: getMobileTabBarItemTabData({
              pageUrl: activeTabBarItem.url,
              schemaId,
              parentId: activeTabBarItem.id,
              title,
            }),
          });

          // 创建 Schema
          insert(getPageContentSchema(schemaId));

          await refresh();
        }}
        schema={{
          title: {
            type: 'string',
            title: 'Title',
            required: true,
            'x-component': 'Input',
            'x-decorator': 'FormItem',
          },
        }}
      ></SchemaInitializerActionModal>
    );
  },
});

export const MobilePageTabInitializer = () => {
  const { render } = useSchemaInitializerRender(mobilePageTabInitializer.name);
  return render();
};
