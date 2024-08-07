/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Card } from 'antd';
import { messageManagerSchema, createMessageFormSchema } from '../schemas';
import {
  ActionContextProvider,
  SchemaComponent,
  useAPIClient,
  useActionContext,
  useAsyncData,
  usePlugin,
  SchemaComponentOptions,
  SchemaComponentContext,
  useSchemaComponentContext,
  ExtendCollectionsProvider,
} from '@nocobase/client';
import React, { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useNotificationTranslation } from '../../../locale';
import channelCollection from '../../../../collections/channel';
import messageCollection from '../../../../collections/message';
import { MessageComponentNames } from '../types';
import ReceiverConfigForm from './ReceiverConfigForm';
import MessageInput from './MessageInput';

const useCloseAction = () => {
  const { setVisible } = useActionContext();
  return {
    async run() {
      setVisible(false);
    },
  };
};

export const MessageManager = () => {
  const { t } = useNotificationTranslation();
  const scCtx = useSchemaComponentContext();
  return (
    <ExtendCollectionsProvider collections={[channelCollection, messageCollection]}>
      <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
        <Card bordered={false}>
          <SchemaComponent
            schema={messageManagerSchema}
            scope={{ t }}
            components={{
              [MessageComponentNames.ReceiverConfigForm]: ReceiverConfigForm,
              [MessageComponentNames.MessageInput]: MessageInput,
            }}
          />
        </Card>
      </SchemaComponentContext.Provider>
    </ExtendCollectionsProvider>
  );
};

MessageManager.displayName = 'MessageManager';
