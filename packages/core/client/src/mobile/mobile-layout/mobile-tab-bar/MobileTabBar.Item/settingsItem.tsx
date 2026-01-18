/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema, createModalSettingsItem, createTextSettingsItem } from '../../../schema-component';
import { useFieldSchema } from '@formily/react';
import { useNavigate } from 'react-router-dom';
import { App } from 'antd';

import { useTranslation } from 'react-i18next';
import { useUpdateTabBarItem } from './useUpdateTabBarItem';
import { getMobileTabBarItemSchemaFields } from './schemaFormFields';
import { useMobileRoutes } from '../../../mobile-providers';

export const editTabItemSettingsItem = (getMoreFields?: (values: any) => Record<string, ISchema>) =>
  createModalSettingsItem({
    title: '{{t("Edit button")}}',
    name: 'tabBarItem',
    parentSchemaKey: 'x-component-props',
    schema: (defaultValues) => ({
      type: 'object',
      title: 'Edit button',
      properties: {
        ...getMobileTabBarItemSchemaFields(defaultValues),
        ...(getMoreFields ? getMoreFields(defaultValues) : {}),
      },
    }),
    useSubmit: useUpdateTabBarItem,
  });

export const removeTabItemSettingsItem = createTextSettingsItem({
  name: 'remove',
  title: '{{t("Delete")}}',
  useTextClick: () => {
    const schema = useFieldSchema();
    const id = Number(schema.toJSON().name);
    const { refresh, resource, routeList, api } = useMobileRoutes();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { modal, message } = App.useApp();
    return async () => {
      modal.confirm({
        title: t('Delete action'),
        content: t('Are you sure you want to delete it?'),
        onOk: async () => {
          await resource.destroy({ filterByTk: id });
          await resource.destroy({ filter: { parentId: id } });

          const routeItem = routeList.find((item) => item.id === id);
          await api.request({ url: `/uiSchemas:remove/${routeItem.schemaUid}`, method: 'delete' });

          await refresh();

          navigate('/');
          message.success({
            content: 'Delete successfully',
          });
        },
      });
    };
  },
});
