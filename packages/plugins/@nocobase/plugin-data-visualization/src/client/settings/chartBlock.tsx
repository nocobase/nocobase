/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import {
  SchemaSettings,
  SchemaSettingsBlockTitleItem,
  SchemaSettingsSwitchItem,
  useDesignable,
  useToken,
  SchemaSettingsLinkageRules,
  LinkageRuleCategory,
} from '@nocobase/client';
import { useTranslation } from 'react-i18next';
import { useChartsTranslation } from '../locale';
import { useField, useFieldSchema } from '@formily/react';

export const chartBlockSettings = new SchemaSettings({
  name: 'chart:block',
  items: [
    {
      name: 'title',
      Component: SchemaSettingsBlockTitleItem,
    },
    {
      name: 'blockLinkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { t } = useTranslation();
        return {
          collectionName: name,
          title: t('Block Linkage rules'),
          category: LinkageRuleCategory.block,
        };
      },
    },
    {
      name: 'background',
      Component: () => {
        const { t } = useChartsTranslation();
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { dn } = useDesignable();
        const { token } = useToken();

        return (
          <SchemaSettingsSwitchItem
            title={t('Show background')}
            checked={field.componentProps.style?.background !== 'none'}
            onChange={(v) => {
              const style = {
                ...field.componentProps.style,
                background: v ? token.colorBgContainer : 'none',
                boxShadow: v ? token.boxShadowTertiary : 'none',
              };
              field.componentProps.style = style;
              field.componentProps.bordered = v;
              fieldSchema['x-component-props'] = field.componentProps;
              dn.emit('patch', {
                schema: {
                  ['x-uid']: fieldSchema['x-uid'],
                  'x-component-props': field.componentProps,
                },
              });
              dn.refresh();
            }}
          />
        );
      },
    },
    {
      name: 'padding',
      Component: () => {
        const { t } = useChartsTranslation();
        const field = useField();
        const fieldSchema = useFieldSchema();
        const { dn } = useDesignable();
        const { token } = useToken();

        return (
          <SchemaSettingsSwitchItem
            title={t('Show padding')}
            checked={field.componentProps.bodyStyle?.padding !== '5px 0 0'}
            onChange={(v) => {
              const style = {
                ...field.componentProps.bodyStyle,
                padding: v ? `${token.paddingLG}px ${token.paddingLG}px 0` : '5px 0 0',
              };
              field.componentProps.bodyStyle = style;
              fieldSchema['x-component-props'] = field.componentProps;
              dn.emit('patch', {
                schema: {
                  ['x-uid']: fieldSchema['x-uid'],
                  'x-component-props': field.componentProps,
                },
              });
              dn.refresh();
            }}
          />
        );
      },
    },
    {
      name: 'divider',
      type: 'divider',
    },
    {
      name: 'remove',
      type: 'remove',
    },
  ],
});
