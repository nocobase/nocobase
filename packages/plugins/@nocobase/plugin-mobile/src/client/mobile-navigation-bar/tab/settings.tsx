/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { FC } from 'react';
import { App } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  SchemaSettings,
  SchemaSettingsItemType,
  SchemaToolbar,
  SchemaToolbarProvider,
  createTextSettingsItem,
  useSchemaToolbar,
} from '@nocobase/client';
import { generatePluginTranslationTemplate, usePluginTranslation } from '../../locale';
import { TabItem, useMobileTabContext } from '../../mobile-providers';

export const remove = createTextSettingsItem({
  name: 'remove',
  title: generatePluginTranslationTemplate('Remove'),
  useTextClick: () => {
    const { t } = usePluginTranslation();
    const { tab } = useSchemaToolbar();
    const { refresh, resource, activeTabBarItem } = useMobileTabContext();
    const navigate = useNavigate();
    const { modal, message } = App.useApp();
    return async () => {
      modal.confirm({
        title: t('Delete Tab'),
        content: t('Are you sure you want to delete it?'),
        onOk: async () => {
          await resource.destroy({ filterByTk: tab.id });
          await refresh();
          // 跳转到第一个 tab
          const url = activeTabBarItem.children.find((item) => item.id !== tab.id)?.url;
          navigate(url);
          message.success({
            content: 'Delete successfully',
          });
        },
      });
    };
  },
  useVisible() {
    const { activeTabBarItem } = useMobileTabContext();
    return activeTabBarItem.children?.length > 1;
  },
});

const editTitle: SchemaSettingsItemType = {
  name: 'title',
  type: 'actionModal',
  useComponentProps() {
    const { t } = usePluginTranslation();
    const { tab } = useSchemaToolbar();
    const { refresh, resource } = useMobileTabContext();
    return {
      title: t('Title'),
      width: '90%',
      schema: {
        type: 'object',
        properties: {
          title: {
            type: 'string',
            default: tab.options.title,
            'x-decorator': 'FormItem',
            'x-component': 'Input',
          },
        },
      },
      async onSubmit({ title }) {
        await resource.update({ filterByTk: tab.id, values: { options: { ...tab.options, title } } });
        refresh();
      },
    };
  },
};

export const mobilePageTabSettings = new SchemaSettings({
  name: 'mobile:page-tab',
  items: [editTitle, remove],
});

interface MobilePageTabSettingsProps {
  tab: TabItem;
}

export const MobilePageTabSettings: FC<MobilePageTabSettingsProps> = ({ tab }) => {
  return (
    <SchemaToolbarProvider tab={tab}>
      <SchemaToolbar settings={mobilePageTabSettings} draggable={false} />
    </SchemaToolbarProvider>
  );
};
