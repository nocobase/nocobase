/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFieldSchema } from '@formily/react';
import { SchemaSettings, createSwitchSettingsItem, useDesignable } from '../../schema-component';
import { useTranslation } from 'react-i18next';
import { useMobileApp } from '../../MobileAppContext';
import { useMobileRoutes } from '../../mobile-providers/context/MobileRoutes';

export const mobilePageSettings = new SchemaSettings({
  name: 'mobile:page',
  items: [
    {
      type: 'itemGroup',
      name: 'app',
      useComponentProps() {
        const { t } = useTranslation();
        return {
          title: t('App settings'),
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
            const { t } = useTranslation();
            const { showTabBar, setShowTabBar } = useMobileApp();
            const { refresh } = useDesignable();
            return {
              title: t('Display tab bar'),
              checked: showTabBar,
              onChange(value) {
                setShowTabBar(value);
                refresh();
              },
            };
          },
        },
        {
          name: 'enableBackAction',
          type: 'switch',
          useComponentProps() {
            const { t } = useTranslation();
            const { showBackButton, setShowBackButton } = useMobileApp();
            const { refresh } = useDesignable();
            return {
              title: t('Display < back button'),
              checked: showBackButton,
              onChange(value) {
                setShowBackButton(value);
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
        const { t } = useTranslation();
        return {
          title: t('Page settings'),
        };
      },
      children: [
        createSwitchSettingsItem({
          name: 'displayPageHeader',
          title: '{{t("Display page header")}}',
          defaultValue: true,
          schemaKey: 'x-component-props.displayPageHeader',
        }),
        createSwitchSettingsItem({
          name: 'displayNavigationBar',
          title: '{{t("Display navigation bar")}}',
          defaultValue: true,
          schemaKey: 'x-component-props.displayNavigationBar',
          useVisible() {
            const schema = useFieldSchema();
            return schema['x-component-props']?.['displayPageHeader'] !== false;
          },
        }),
        createSwitchSettingsItem({
          name: 'displayPageTitle',
          title: '{{t("Display page title")}}',
          defaultValue: true,
          schemaKey: 'x-component-props.displayPageTitle',
          useVisible() {
            const schema = useFieldSchema();
            return (
              schema['x-component-props']?.['displayNavigationBar'] !== false &&
              schema['x-component-props']?.['displayPageHeader'] !== false
            );
          },
        }),
        createSwitchSettingsItem({
          name: 'displayTabs',
          title: '{{t("Display tabs")}}',
          defaultValue: false,
          schemaKey: 'x-component-props.displayTabs',
          useVisible() {
            const schema = useFieldSchema();
            return schema['x-component-props']?.['displayPageHeader'] !== false;
          },
          useComponentProps() {
            const { resource, activeTabBarItem, refresh } = useMobileRoutes();

            return {
              async onChange(value) {
                await resource.update({
                  filterByTk: activeTabBarItem.id,
                  values: {
                    enableTabs: value,
                  },
                });

                refresh();
              },
              checked: activeTabBarItem.enableTabs,
            };
          },
        }),
      ],
    },
  ],
});
