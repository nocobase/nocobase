/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaInitializerItemActionModalType } from '@nocobase/client';
import { uid } from '@formily/shared';
import { useNavigate } from 'react-router-dom';

import { generatePluginTranslationTemplate } from '../../locale';
import { getMobileTabBarItemData, mobileTabBarItemSchemaFormFields } from '../MobileTabBar.Item';
import { useMobileTabContext } from '../../mobile-providers';
import { editLinkSchema } from './settings';

export const mobileTabBarLinkInitializerItem: SchemaInitializerItemActionModalType = {
  name: 'link',
  type: 'actionModal',
  useComponentProps() {
    const { resource, refresh } = useMobileTabContext();
    const navigate = useNavigate();

    return {
      isItem: true,
      width: '90%',
      title: generatePluginTranslationTemplate('Add Link page'),
      buttonText: generatePluginTranslationTemplate('Link'),
      schema: {
        ...mobileTabBarItemSchemaFormFields,
        link: editLinkSchema,
      },
      async onSubmit(values) {
        if (!values.title && !values.icon) {
          return;
        }
        const schemaId = uid();

        // 先创建 tab item
        console.log('create Tab item', getMobileTabBarItemData(schemaId, values));

        // 刷新 tabs
        await refresh();

        // 再跳转到页面
        navigate(values.link);
      },
    };
  },
};
