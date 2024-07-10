/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { SchemaSettings, createSwitchSettingsItem, useDesignable } from '@nocobase/client';
import { generatePluginTranslationTemplate, usePluginTranslation } from '../../locale';
import { useFieldSchema } from '@formily/react';
import { useMobileApp } from '../../mobile';

export const mobilePageSettings = new SchemaSettings({
  name: 'mobile:page',
  items: [
    {
      type: 'itemGroup',
      name: 'app',
      useComponentProps() {
        const { t } = usePluginTranslation();
        return {
          title: t('App'),
        };
      },
      useVisible() {
        const app = useMobileApp();
        return !!app;
      },
      children: [
        {
          name: 'enableTabBar',
          type: 'switch',
          useComponentProps() {
            const { t } = usePluginTranslation();
            const { showTabBar, setShowTabBar } = useMobileApp();
            const { refresh } = useDesignable();
            return {
              title: t('Enable tab bar'),
              checked: showTabBar,
              onChange(v) {
                setShowTabBar(v);
                refresh();
              },
            };
          },
        },
      ],
    },
    {
      type: 'itemGroup',
      name: 'page',
      useComponentProps() {
        const { t } = usePluginTranslation();
        return {
          title: t('Page'),
        };
      },
      children: [
        createSwitchSettingsItem({
          name: 'enableNavigationBar',
          title: generatePluginTranslationTemplate('Enable navigation bar'),
          defaultValue: true,
          schemaKey: 'x-component-props.enableNavigationBar',
        }),
        createSwitchSettingsItem({
          name: 'enableNavigationBarTitle',
          title: generatePluginTranslationTemplate('Enable navigation bar title'),
          defaultValue: true,
          schemaKey: 'x-component-props.enableNavigationBarTitle',
          useVisible() {
            const schema = useFieldSchema();
            return schema['x-component-props']?.['enableNavigationBar'] !== false;
          },
        }),
        createSwitchSettingsItem({
          name: 'enableNavigationBarTabs',
          title: generatePluginTranslationTemplate('Enable navigation bar tabs'),
          defaultValue: false,
          schemaKey: 'x-component-props.enableNavigationBarTabs',
          useVisible() {
            const schema = useFieldSchema();
            return schema['x-component-props']?.['enableNavigationBar'] !== false;
          },
        }),
      ],
    },
  ],
});
