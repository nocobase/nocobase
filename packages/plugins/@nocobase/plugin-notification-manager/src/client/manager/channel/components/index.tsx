/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  ActionContextProvider,
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useAsyncData,
  usePlugin,
} from '@nocobase/client';
import { Card } from 'antd';
import React, { useState } from 'react';
import { channelsSchema, createFormSchema } from '../schemas';
import { Button, Dropdown } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import { NotificationTypesContext, useChannelTypes, useNotificationTypeNameProvider } from '../context';
import { useTranslation } from 'react-i18next';
import { useNotificationTranslation } from '../../../locale';
import { Schema } from '@formily/react';
import { PluginNotificationManagerClient } from '../../..';
import { ChannelType } from '../types';
import { ConfigForm } from './ConfigForm';

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  return {
    async run() {
      setVisible(false);
    },
  };
};

const AddNew = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const { NotificationTypeNameProvider, name, setName } = useNotificationTypeNameProvider();
  const channelTypes = useChannelTypes();
  const items = channelTypes.map((item) => ({
    key: item.name,
    label: item.title,
    onClick: () => {
      setVisible(true);
      setName(item.name);
    },
  }));

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <NotificationTypeNameProvider>
        <Dropdown menu={{ items }}>
          <Button icon={<PlusOutlined />} type={'primary'}>
            {t('Add new')} <DownOutlined />
          </Button>
        </Dropdown>
        <SchemaComponent
          scope={{ useCloseAction }}
          schema={createFormSchema}
          // components={{ ConfigForm: getConfigForm(typeName) }}
        />
      </NotificationTypeNameProvider>
    </ActionContextProvider>
  );
};

// Disable delete button when there is only one authenticator
const useCanNotDelete = () => {
  const { data } = useAsyncData();
  // return data?.meta?.count === 1;
  return false;
};

export const ChannelManager = () => {
  const { t } = useNotificationTranslation();
  const api = useAPIClient();
  const plugin = usePlugin(PluginNotificationManagerClient);
  const notificationTypes: Array<ChannelType> = [];
  for (const [key, val] of plugin.manager.channelTypes.getEntities()) {
    const type = {
      ...val,
      title: Schema.compile(val.title, { t }) as string,
    };
    notificationTypes.push(type);
  }

  const notificationTypeOptions = notificationTypes.map((item) => ({
    key: item.name,
    label: item.title,
    value: item.name,
  }));

  return (
    <Card bordered={false}>
      <NotificationTypesContext.Provider value={{ channelTypes: notificationTypes }}>
        <SchemaComponent
          schema={channelsSchema}
          components={{ AddNew, ConfigForm }}
          scope={{ useCanNotDelete, t, notificationTypeOptions }}
        />
      </NotificationTypesContext.Provider>
    </Card>
  );
};

ChannelManager.displayName = 'ChannelManager';
