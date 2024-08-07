/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Card } from 'antd';
import { messageManagerSchema } from '../schemas';
import {
  SchemaComponent,
  useActionContext,
  SchemaComponentContext,
  useSchemaComponentContext,
  ExtendCollectionsProvider,
} from '@nocobase/client';
import React from 'react';
import { useNotificationTranslation } from '../../../locale';
import channelCollection from '../../../../collections/channel';
import messageCollection from '../../../../collections/message';
import messageLogCollection from '../../../../collections/messageLog';
import { MessageComponentNames, MessageScopeNames } from '../types';
import ReceiverConfigForm from './ReceiverConfigForm';
import MessageInput from './MessageInput';
import { MessageLogManager } from '../../messageLog/components/Manager';
import { useSendAction } from './useSendAction';
import { useSubmitActionProps } from '../../../hooks';
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
    <ExtendCollectionsProvider collections={[channelCollection, messageCollection, messageLogCollection]}>
      <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
        <Card bordered={false}>
          <SchemaComponent
            schema={messageManagerSchema}
            scope={{ t, [MessageScopeNames.useSendAction]: useSendAction, useSubmitActionProps }}
            components={{
              [MessageComponentNames.ReceiverConfigForm]: ReceiverConfigForm,
              [MessageComponentNames.MessageInput]: MessageInput,
              [MessageComponentNames.MessageLogManager]: MessageLogManager,
            }}
          />
        </Card>
      </SchemaComponentContext.Provider>
    </ExtendCollectionsProvider>
  );
};

MessageManager.displayName = 'MessageManager';
