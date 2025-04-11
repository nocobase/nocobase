/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ButtonEditor,
  SchemaSettingOpenModeSchemaItems,
  SchemaSettings,
  useSchemaInitializer,
  useOpenModeContext,
  ModalActionSchemaInitializerItem,
  SchemaSettingAccessControl,
  SchemaSettingsLinkageRules,
  useSchemaToolbar,
} from '@nocobase/client';
import React from 'react';
import { useTranslation } from 'react-i18next';

export const workbenchActionSettingsPopup = new SchemaSettings({
  name: 'workbench:actionSettings:popup',
  items: [
    {
      name: 'editButton',
      Component: ButtonEditor,
      useComponentProps() {
        return { hasIconColor: true };
      },
    },
    {
      name: 'linkageRules',
      Component: SchemaSettingsLinkageRules,
      useComponentProps() {
        const { linkageRulesProps } = useSchemaToolbar();
        return {
          ...linkageRulesProps,
        };
      },
    },
    {
      name: 'openMode',
      Component: SchemaSettingOpenModeSchemaItems,
      useComponentProps() {
        const { t } = useTranslation();
        const { hideOpenMode } = useOpenModeContext();
        return {
          openSize: !hideOpenMode,
          modeOptions: hideOpenMode && [
            { label: t('Drawer'), value: 'drawer' },
            { label: t('Page'), value: 'page' },
          ],
        };
      },
    },
    {
      ...SchemaSettingAccessControl,
      useVisible() {
        return true;
      },
    },
    {
      sort: 800,
      name: 'd1',
      type: 'divider',
    },
    {
      sort: 900,
      type: 'remove',
      name: 'remove',
    },
  ],
});

export function WorkbenchPopupActionSchemaInitializerItem(props) {
  // 调用插入功能
  const { insert } = useSchemaInitializer();
  const { t } = useTranslation();
  const { isMobile } = useOpenModeContext();

  return (
    <ModalActionSchemaInitializerItem
      title={t('Popup')}
      modalSchema={{
        title: t('Add popup', { ns: 'block-workbench' }),
        properties: {
          title: {
            title: t('Title'),
            required: true,
            'x-component': 'Input',
            'x-decorator': 'FormItem',
          },
          icon: {
            title: t('Icon'),
            required: true,
            'x-component': 'IconPicker',
            'x-decorator': 'FormItem',
          },
          iconColor: {
            title: t('Color'),
            required: true,
            default: '#1677FF',
            'x-component': 'ColorPicker',
            'x-decorator': 'FormItem',
          },
        },
      }}
      onSubmit={(values) => {
        insert({
          type: 'void',
          title: values.title,
          'x-action': 'customize:popup',
          'x-toolbar': 'ActionSchemaToolbar',
          'x-settings': 'workbench:actionSettings:popup',
          'x-component': 'WorkbenchAction',
          'x-component-props': {
            icon: values.icon,
            iconColor: values.iconColor,
            refreshDataBlockRequest: false,
          },
          properties: {
            drawer: {
              type: 'void',
              title: values.title,
              'x-component': 'Action.Container',
              'x-component-props': {
                className: 'nb-action-popup',
              },
              properties: {
                tabs: {
                  type: 'void',
                  'x-component': 'Tabs',
                  'x-component-props': {},
                  'x-initializer': 'popup:addTab',
                  properties: {
                    tab1: {
                      type: 'void',
                      title: '{{t("Details")}}',
                      'x-component': 'Tabs.TabPane',
                      'x-designer': 'Tabs.Designer',
                      'x-component-props': {},
                      properties: {
                        grid: {
                          type: 'void',
                          'x-component': 'Grid',
                          'x-initializer': isMobile ? 'mobile:addBlock' : 'page:addBlock',
                          properties: {},
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });
      }}
    />
  );
}
