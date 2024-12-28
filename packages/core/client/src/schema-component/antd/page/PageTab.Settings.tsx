/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ISchema } from '@formily/json-schema';
import { App } from 'antd';
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
