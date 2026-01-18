/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { App } from 'antd';
import React, { FC } from 'react';
import { useNavigate } from 'react-router-dom';

import { useTranslation } from 'react-i18next';
import { MobileRouteItem, useMobileRoutes } from '../../../../mobile-providers';
import { createTextSettingsItem } from '../../../../../application/schema-settings/utils/createTextSettingsItem';
import { SchemaToolbarProvider, useSchemaToolbar } from '../../../../../application/schema-toolbar/context';
import { SchemaSettingsItemType } from '../../../../../application/schema-settings/types';
import { SchemaSettings } from '../../../../../application/schema-settings/SchemaSettings';
import { SchemaToolbar } from '../../../../../schema-settings';

const remove = createTextSettingsItem({
  name: 'remove',
  title: '{{t("Delete")}}',
  useTextClick: () => {
    const { t } = useTranslation();
    const { tab } = useSchemaToolbar<{ tab: MobileRouteItem }>();
    const { refresh, resource, activeTabBarItem, api } = useMobileRoutes();
    const navigate = useNavigate();
    const { modal, message } = App.useApp();
    return async () => {
      modal.confirm({
        title: t('Delete action'),
        content: t('Are you sure you want to delete it?'),
        onOk: async () => {
          await resource.destroy({ filterByTk: tab.id });
          await refresh();

          await api.request({ url: `/uiSchemas:remove/${tab.schemaUid}`, method: 'delete' });

          const firstTab = activeTabBarItem.children.find((item) => item.id !== tab.id);
          navigate(`/${activeTabBarItem.type}/${activeTabBarItem.schemaUid}/${firstTab.type}/${firstTab.schemaUid}`);
          message.success({
            content: 'Delete successfully',
          });
        },
      });
    };
  },
  useVisible() {
    const { activeTabBarItem } = useMobileRoutes();
    return activeTabBarItem.children?.length > 1;
  },
});

const editTitle: SchemaSettingsItemType = {
  name: 'title',
  type: 'actionModal',
  useComponentProps() {
    const { t } = useTranslation();
    const { tab } = useSchemaToolbar();
    const { refresh, resource } = useMobileRoutes();
    const { message } = App.useApp();

    return {
      title: t('Edit'),
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            title: '{{t("Title")}}',
            default: tab.title,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
            required: true,
          },
          icon: {
            title: '{{t("Icon")}}',
            type: 'string',
            'x-decorator': 'FormItem',
            default: tab.icon,
            'x-component': 'IconPicker',
          },
        },
      },
      async onSubmit({ title, icon }) {
        if (title && title.trim().length == 0) {
          message.error(t('Title field is required'));
          return Promise.reject(new Error('Title field is required'));
        }
        await resource.update({ filterByTk: tab.id, values: { title, icon } });
        refresh();
      },
    };
  },
};

export const mobilePageTabsSettings = new SchemaSettings({
  name: 'mobile:tabs',
  items: [editTitle, remove],
});

interface MobilePageTabsSettingsProps {
  tab: MobileRouteItem;
}

export const MobilePageTabsSettings: FC<MobilePageTabsSettingsProps> = ({ tab }) => {
  return (
    <SchemaToolbarProvider tab={tab}>
      <SchemaToolbar
        settings={mobilePageTabsSettings}
        showBackground
        showBorder={false}
        toolbarStyle={{ inset: '0 -12px' }}
        spaceWrapperStyle={{ top: 3 }}
      />
    </SchemaToolbarProvider>
  );
};
