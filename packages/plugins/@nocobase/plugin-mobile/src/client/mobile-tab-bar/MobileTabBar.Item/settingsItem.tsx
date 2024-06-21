/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, createModalSettingsItem, createTextSettingsItem } from '@nocobase/client';
import { useFieldSchema } from '@formily/react';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';

import { generatePluginTranslationTemplate, usePluginTranslation } from '../../locale';
import { useUpdateTabBarItem } from './useUpdateTabBarItem';
import { getMobileTabBarItemSchemaFields } from './schemaFormFields';
import { useMobileTabContext } from '../../mobile-providers';

export const editTabItemSettingsItem = (getMoreFields?: (values: any) => Record<string, ISchema>) =>
  createModalSettingsItem({
    title: generatePluginTranslationTemplate('Edit tabBar item'),
    name: 'tabBarItem',
    parentSchemaKey: 'x-component-props',
    width: '90%',
    schema: (defaultValues) => ({
      type: 'object',
      title: 'Edit tabBar item',
      properties: {
        ...getMobileTabBarItemSchemaFields(defaultValues),
        ...(getMoreFields ? getMoreFields(defaultValues) : {}),
      },
    }),
    useSubmit: useUpdateTabBarItem,
  });

export const removeTabItemSettingsItem = createTextSettingsItem({
  name: 'remove',
  title: generatePluginTranslationTemplate('Remove'),
  useTextClick: () => {
    const schema = useFieldSchema();
    const id = Number(schema.toJSON().name);
    const { refresh, tabList, resource } = useMobileTabContext();
    const navigate = useNavigate();
    const { t } = usePluginTranslation();
    const { modal, message } = App.useApp();
    return async () => {
      modal.confirm({
        title: t('Delete TabBar Item'),
        content: t('Are you sure you want to delete it?'),
        onOk: async () => {
          await resource.destroy({ filterByTk: id });
          await refresh();
          // 跳转到第一个 tab
          const url = tabList.find((item) => item.id !== id && item.url)?.url || '/';
          navigate(url);
          message.success({
            content: 'Delete successfully',
          });
        },
      });
    };
  },
});
