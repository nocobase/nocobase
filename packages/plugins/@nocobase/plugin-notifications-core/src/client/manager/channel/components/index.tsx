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
  SchemaComponentProvider,
  CollectionProvider,
  ResourceActionProvider,
} from '@nocobase/client';
import { Card } from 'antd';
import React, { useEffect, useState } from 'react';
import { channelsSchema, createFormSchema } from '../schemas';
import { Button, Dropdown } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import { ChannelTypeNameContext, ChannelTypesContext, useChannelTypes } from '../context';
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
  const [typeName, setTypeName] = useState('');
  const channelTypes = useChannelTypes();
  const items = channelTypes.map((item) => ({
    key: item.name,
    label: item.title,
    onClick: () => {
      setVisible(true);
      setTypeName(item.name);
    },
  }));

  const getConfigForm = (name: string) => {
    const channel = channelTypes.find((channelType) => channelType.name === name);
    if (channel) return channel.components.ConfigForm;
    else return null;
  };

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <ChannelTypeNameContext.Provider value={{ name: typeName }}>
        <Dropdown menu={{ items }}>
          <Button icon={<PlusOutlined />} type={'primary'}>
            {t('Add new')} <DownOutlined />
          </Button>
        </Dropdown>
        {/* <SchemaComponentProvidr components={{ (typeName) }}> */}
        <SchemaComponent
          scope={{ useCloseAction, types: channelTypes, setType: setTypeName }}
          schema={createFormSchema}
          components={{ ConfigForm: getConfigForm(typeName) }}
        />
        {/* </SchemaComponentProvider> */}
      </ChannelTypeNameContext.Provider>
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
  const [types, setTypes] = useState([]);
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
      <ChannelTypesContext.Provider value={{ channelTypes: channelTypes }}>
        <SchemaComponent
          schema={channelsSchema}
          components={{ AddNew }}
          scope={{ types, notificationTypeOptions, useCanNotDelete, t }}
        />
      </ChannelTypesContext.Provider>
    </Card>
  );
};
