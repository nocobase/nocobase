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

import { generatePluginTranslationTemplate } from '../../locale';
import { getMobileTabBarItemData, mobileTabBarItemSchemaFormFields } from '../MobileTabBar.Item';
import { uid } from '@formily/shared';
import { useMobileTabContext } from '../../mobile-providers';

function getPageSchema(schemaId: string) {
  return {
    type: 'void',
    name: schemaId,
    'x-uid': schemaId,
    'x-component': 'MobilePage',
    'x-settings': 'mobile:page',
    'x-decorator': 'BlockItem',
    'x-toolbar-props': {
      draggable: false,
    },
    properties: {
      navigationBar: {
        type: 'void',
        'x-component': 'MobileNavigationBar',
      },
      content: {
        type: 'void',
        'x-component': 'MobileContent',
        'x-decorator': 'Grid',
        'x-initializer': 'mobile:content',
      },
    },
  };
}

export const mobileTabBarSchemaInitializerItem: SchemaInitializerItemActionModalType = {
  name: 'schema',
  type: 'actionModal',
  useComponentProps() {
    const { resource, refresh } = useMobileTabContext();
    // const navigate = useNavigate();

    return {
      isItem: true,
      width: '90%',
      title: generatePluginTranslationTemplate('Add page'),
      buttonText: generatePluginTranslationTemplate('Page'),
      schema: mobileTabBarItemSchemaFormFields,
      async onSubmit(values) {
        if (!values.title && !values.icon) {
          return;
        }

        const schemaId = uid();

        // 先创建 tab item
        console.log('create Tab item', getMobileTabBarItemData(schemaId, values));

        // 再创建空页面
        console.log('create Page', getPageSchema(schemaId));

        // 刷新 tabs
        await refresh();

        // 再跳转到页面
        // navigate(`/schema/${schemaId}`)
      },
    };
  },
};
