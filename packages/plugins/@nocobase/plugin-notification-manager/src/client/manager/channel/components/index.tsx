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
  SchemaComponentContext,
  useSchemaComponentContext,
  useAPIClient,
  useActionContext,
  useAsyncData,
  usePlugin,
  ExtendCollectionsProvider,
} from '@nocobase/client';
import { Empty } from 'antd';
import React, { useState } from 'react';
import { channelsSchema, createFormSchema } from '../schemas';
import { Button, Dropdown } from 'antd';
import { PlusOutlined, DownOutlined } from '@ant-design/icons';
import { NotificationTypesContext, useChannelTypes, useNotificationTypeNameProvider } from '../context';
import { useNotificationTranslation } from '../../../locale';
import { ConfigForm } from './ConfigForm';
import channelCollection from '../../../../collections/channel';
import messageLogCollection from '../../../../collections/messageLog';
import {
  useCreateActionProps,
  useEditActionProps,
  useCloseActionProps,
  useEditFormProps,
  useCreateFormProps,
  useNotificationTypes,
  useRecordDeleteActionProps,
  useRecordEditActionProps,
} from '../hooks';
const useCloseAction = () => {
  const { setVisible } = useActionContext();
  return {
    async run() {
      setVisible(false);
    },
  };
};

const AddNew = () => {
  const { t } = useNotificationTranslation();
  const [visible, setVisible] = useState(false);
  const { NotificationTypeNameProvider, name, setName } = useNotificationTypeNameProvider();
  const api = useAPIClient();
  const channelTypes = useChannelTypes().filter((item) => !(item.meta?.createable === false));
  const items =
    channelTypes.length === 0
      ? [
          {
            key: '__empty__',
            label: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <>
                    {t('No channel enabled yet')}
                    <br />{' '}
                    <a
                      target="_blank"
                      href={
                        api.auth.locale === 'zh-CN'
                          ? 'https://docs-cn.nocobase.com/handbook/notification-manager'
                          : 'https://docs.nocobase.com/handbook/notification-manager'
                      }
                      rel="noreferrer"
                    >
                      {t('View documentation')}
                    </a>
                  </>
                }
              />
            ),
          },
        ]
      : channelTypes.map((item) => ({
          key: item.key,
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
          scope={{
            useCloseAction,
            useCreateActionProps,
            useEditActionProps,
            useCloseActionProps,
            useEditFormProps,
            useCreateFormProps,
          }}
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
  const notificationTypes = useNotificationTypes();
  const scCtx = useSchemaComponentContext();

  return (
    <ExtendCollectionsProvider collections={[channelCollection, messageLogCollection]}>
      <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
        <NotificationTypesContext.Provider value={{ channelTypes: notificationTypes }}>
          <SchemaComponent
            schema={channelsSchema}
            components={{ AddNew, ConfigForm }}
            scope={{
              useCanNotDelete,
              t,
              notificationTypeOptions: notificationTypes,
              useCreateActionProps,
              useEditActionProps,
              useCloseActionProps,
              useEditFormProps,
              useCreateFormProps,
              useRecordDeleteActionProps,
              useRecordEditActionProps,
            }}
          />
        </NotificationTypesContext.Provider>
      </SchemaComponentContext.Provider>
    </ExtendCollectionsProvider>
  );
};

ChannelManager.displayName = 'ChannelManager';
