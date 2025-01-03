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
import { App, Modal } from 'antd';
import _ from 'lodash';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SchemaSettings } from '../../../application/schema-settings/SchemaSettings';
import { useSchemaToolbar } from '../../../application/schema-toolbar';
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
        const { schema } = useSchemaToolbar<{ schema: ISchema }>();
        const { dn } = useDesignable();
        const { updateRoute } = useNocoBaseRoutes();

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
          initialValues: { title: schema.title, icon: schema['x-icon'] },
          onSubmit: ({ title, icon }) => {
            schema.title = title;
            schema['x-icon'] = icon;
            dn.emit('patch', {
              schema: {
                ['x-uid']: schema['x-uid'],
                title,
                'x-icon': icon,
              },
            });

            // 更新路由
            updateRoute(
              schema['__route__'].id,
              {
                title,
                icon,
              },
              false,
            );
          },
        };
      },
    },
    {
      name: 'hidden',
      type: 'switch',
      useComponentProps() {
        const { t } = useTranslation();
        const { schema } = useSchemaToolbar<{ schema: ISchema }>();
        const { updateRoute } = useNocoBaseRoutes();
        const { dn } = useDesignable();

        return {
          title: t('Hidden'),
          checked: schema['x-component-props']?.hidden,
          onChange: (v) => {
            Modal.confirm({
              title: '确定要隐藏该菜单吗？',
              icon: <ExclamationCircleFilled />,
              content: '隐藏后，该菜单将不再显示在菜单栏中。如需再次显示，需要去路由管理页面设置。',
              async onOk() {
                _.set(schema, 'x-component-props.hidden', !!v);

                // 更新菜单对应的路由
                if (schema['__route__']?.id) {
                  await updateRoute(schema['__route__'].id, {
                    hideInMenu: !!v,
                  });
                }

                dn.emit('patch', {
                  schema: {
                    'x-uid': schema['x-uid'],
                    'x-component-props': schema['x-component-props'],
                  },
                });
              },
            });
          },
        };
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'delete',
      type: 'item',
      useComponentProps() {
        const { modal } = App.useApp();
        const { dn } = useDesignable();
        const { t } = useTranslation();
        const { schema } = useSchemaToolbar();
        return {
          title: t('Delete'),
          eventKey: 'remove',
          onClick() {
            modal.confirm({
              title: t('Delete block'),
              content: t('Are you sure you want to delete it?'),
              ...confirm,
              onOk() {
                dn.remove(schema);
              },
            });
          },
          children: t('Delete'),
        };
      },
    },
  ],
});
