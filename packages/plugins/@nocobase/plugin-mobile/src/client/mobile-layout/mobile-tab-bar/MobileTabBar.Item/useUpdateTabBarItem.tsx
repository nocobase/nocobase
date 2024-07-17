/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { omit } from 'lodash';
import { App } from 'antd';

import { usePluginTranslation } from '../../../locale';
import { useMobileRoutes } from '../../../mobile-providers';

export function useUpdateTabBarItem() {
  const { refresh, resource } = useMobileRoutes();
  const fieldSchema = useFieldSchema();
  const { t } = usePluginTranslation();
  const { message } = App.useApp();

  return async (values) => {
    if (!values.title || values.title.trim() === '') {
      message.error(t('Title field is required'));
      return Promise.reject(new Error(t('Title field is required')));
    }
    if (!values.icon) {
      message.error(t('Icon field is required'));
      return Promise.reject(new Error(t('Icon field is required')));
    }

    const schema = fieldSchema.toJSON();
    const id = Number(schema.name);
    const title = schema['x-component-props'].title;
    const icon = schema['x-component-props'].icon;

    const options = omit(schema['x-component-props'], 'title', 'icon');
    await resource.update({ filterByTk: id, values: { title, icon, options } });
    refresh();
  };
}
