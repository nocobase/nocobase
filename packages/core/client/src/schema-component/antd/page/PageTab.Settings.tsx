/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExclamationCircleFilled } from '@ant-design/icons';
import { ISchema } from '@formily/json-schema';
import { useFieldSchema } from '@formily/react';
import { App, Modal } from 'antd';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigateNoUpdate } from '../../../application/CustomRouterContextProvider';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useCurrentRoute } from '../../../route-switch';
import { useDesignable } from '../../hooks';
import { useNocoBaseRoutes } from '../menu/Menu';

/**
 * @deprecated
 */
export const pageTabSettings = new SchemaSettings({
  name: 'PageTabSettings',
  items: [
    {
      name: 'edit',
      type: 'modal',
      useComponentProps() {
        const { t } = useTranslation();
        const { updateRoute } = useNocoBaseRoutes();
        const currentRoute = useCurrentRoute();

        return {
          title: t('Edit'),
          schema: {
            type: 'object',
            title: t('Edit tab'),
            properties: {
              title: {
                title: t('Tab name'),
                required: true,
                'x-decorator': 'FormItem',
                'x-component': 'Input',
                'x-component-props': {},
              },
              icon: {
                title: t('Icon'),
                'x-decorator': 'FormItem',
                'x-component': 'IconPicker',
                'x-component-props': {},
              },
            },
          } as ISchema,
          initialValues: { title: currentRoute.title, icon: currentRoute.icon },
          onSubmit: ({ title, icon }) => {
            // 更新路由
            updateRoute(currentRoute.id, {
              title,
              icon,
            });
          },
        };
      },
      sort: 100,
    },
    {
      name: 'hidden',
      type: 'switch',
      useComponentProps() {
        const { t } = useTranslation();
        const { updateRoute } = useNocoBaseRoutes();
        const currentRoute = useCurrentRoute();

        return {
          title: t('Hidden'),
          checked: currentRoute.hideInMenu,
          onChange: (v) => {
            Modal.confirm({
              title: t('Are you sure you want to hide this tab?'),
              icon: <ExclamationCircleFilled />,
              content: t(
                'After hiding, this tab will no longer appear in the tab bar. To show it again, you need to go to the route management page to set it.',
              ),
              async onOk() {
                // Update the route corresponding to the menu
                await updateRoute(currentRoute.id, {
                  hideInMenu: !!v,
                });
              },
            });
          },
        };
      },
      sort: 200,
    },
    {
      name: 'divider',
      type: 'divider',
      sort: 300,
    },
    {
      name: 'delete',
      type: 'item',
      useComponentProps() {
        const { modal } = App.useApp();
        const { dn } = useDesignable();
        const { t } = useTranslation();
        const { deleteRoute } = useNocoBaseRoutes();
        const currentRoute = useCurrentRoute();
        const navigate = useNavigateNoUpdate();
        const schema = useFieldSchema();

        return {
          title: t('Delete'),
          eventKey: 'remove',
          onClick() {
            modal.confirm({
              title: t('Delete block'),
              content: t('Are you sure you want to delete it?'),
              ...confirm,
              async onOk() {
                await deleteRoute(currentRoute.id);
                dn.emit('remove', {
                  removed: {
                    'x-uid': currentRoute.schemaUid,
                  },
                });

                // 如果删除的是当前打开的 tab，需要跳转到其他 tab
                if (window.location.pathname.includes(currentRoute.schemaUid)) {
                  navigate(`/admin/${schema['x-uid']}`);
                }
              },
            });
          },
          children: t('Delete'),
        };
      },
      sort: 400,
    },
  ],
});
