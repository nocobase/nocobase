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
  SchemaComponentOptions,
} from '@nocobase/client';
import { Card } from 'antd';
import React, { useEffect, useState, useContext } from 'react';
import { channelsSchema, createFormSchema } from '../schemas';
import { Button, Dropdown } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import { ChannelTypeNameContext, ChannelTypesContext, useChannelTypes, useChannelTypeNameProvider } from '../context';
import { useTranslation } from 'react-i18next';
import { useNotificationTranslation } from '../../../locale';
import { Schema } from '@formily/react';
import { PluginNotificationCoreClient } from '../../..';
import { ChannelType, NotificationType } from '../types';

type NotificationTypeOption = {
  key: NotificationType;
  value: NotificationType;
  label: string;
};
const notificationTypeOptions: Array<NotificationTypeOption> = [
  { key: 'mail', label: 'mail', value: 'mail' },
  { key: 'SMS', label: 'SMS', value: 'SMS' },
];

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

  const { setName } = useContext(ChannelTypeNameContext);
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
      <Dropdown menu={{ items }}>
        <Button icon={<PlusOutlined />} type={'primary'}>
          {t('Add new')} <DownOutlined />
        </Button>
      </Dropdown>
      <SchemaComponent
        scope={{ useCloseAction, notificationTypeOptions }}
        schema={createFormSchema}
        // components={{ ConfigForm: getConfigForm(typeName) }}
      />
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
  const plugin = usePlugin(PluginNotificationCoreClient);
  const channelTypes: Array<ChannelType> = [];
  for (const [key, val] of plugin.channelTypes.getEntities()) {
    const type = {
      ...val,
      title: Schema.compile(val.title, { t }) as string,
    };
    channelTypes.push(type);
  }

  const getConfigForm = (name: string) => {
    const channel = channelTypes.find((channelType) => channelType.name === name);
    if (channel) return channel.components.ConfigForm;
    else return null;
  };

  const { ChannelTypeNameProvider, name } = useChannelTypeNameProvider();

  // useRequest(
  //   () =>
  //     api
  //       .resource('channels')
  //       .listTypes()
  //       .then((res) => {
  //         const types = DEFAULT_TYPES; //res?.data?.data ||;
  //         return types.map((type: { name: string; title?: string }) => ({
  //           key: type.name,
  //           label: Schema.compile(type.title || type.name, { t }),
  //           value: type.name,
  //         }));
  //       }),
  //   {
  //     onSuccess: (types) => {
  //       setTypes(types);
  //     },
  //   },
  // );

  return (
    <Card bordered={false}>
      <ChannelTypeNameProvider>
        <ChannelTypesContext.Provider value={{ channelTypes: channelTypes }}>
          <SchemaComponentOptions components={{ ConfigForm: getConfigForm(name) }}>
            <SchemaComponent
              schema={channelsSchema}
              components={{ AddNew, ConfigForm: getConfigForm(name) }}
              scope={{ notificationTypeOptions, useCanNotDelete, t }}
            />
          </SchemaComponentOptions>
        </ChannelTypesContext.Provider>
      </ChannelTypeNameProvider>
    </Card>
  );
};

ChannelManager.displayName = 'ChannelManager';
