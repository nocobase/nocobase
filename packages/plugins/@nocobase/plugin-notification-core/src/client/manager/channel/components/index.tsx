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
  useRequest,
} from '@nocobase/client';
import { Card } from 'antd';
import React, { useEffect, useState } from 'react';
import { channelsSchema, createFormSchema } from '../schemas';
import { Button, Dropdown } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import { ChannelTypeContext, ChannelTypesContext, useChannelTypes } from '../context';
import { useTranslation } from 'react-i18next';
import { useNotificationTranslation } from '../../../locale';
import { Schema } from '@formily/react';

const DEFAULT_TYPES = [{ key: 'test', name: 'test', title: 'test' }];

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
  const [type, setType] = useState('');
  const types = useChannelTypes();
  const items = types.map((item) => ({
    ...item,
    onClick: () => {
      setVisible(true);
      setType(item.value);
    },
  }));

  return (
    <ActionContextProvider value={{ visible, setVisible }}>
      <ChannelTypeContext.Provider value={{ type }}>
        <Dropdown menu={{ items }}>
          <Button icon={<PlusOutlined />} type={'primary'}>
            {t('Add new')} <DownOutlined />
          </Button>
        </Dropdown>
        <SchemaComponent scope={{ useCloseAction, types, setType }} schema={createFormSchema} />
      </ChannelTypeContext.Provider>
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
      <ChannelTypesContext.Provider value={{ types: [{ key: 'test', label: 'test', value: 'test' }] }}>
        <SchemaComponent schema={channelsSchema} components={{ AddNew }} scope={{ types, useCanNotDelete, t }} />
      </ChannelTypesContext.Provider>
    </Card>
  );
};
