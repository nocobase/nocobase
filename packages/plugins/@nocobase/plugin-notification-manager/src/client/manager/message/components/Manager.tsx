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
  SchemaComponentContext,
  useSchemaComponentContext,
  ExtendCollectionsProvider,
} from '@nocobase/client';
import React from 'react';
import { useNotificationTranslation } from '../../../locale';
import channelCollection from '../../../../collections/channel';
import messageLogCollection from '../../../../collections/messageLog';
import { MessageComponentNames, MessageScopeNames } from '../types';
import MessageInput from './MessageInput';
import { LogManager } from '../../log/components/Manager';
import { useSendAction } from './useSendAction';
import { useSubmitActionProps, useEditFormProps } from '../../../hooks';

export const MessageManager = () => {
  const { t } = useNotificationTranslation();
  const scCtx = useSchemaComponentContext();
  return (
    <ExtendCollectionsProvider collections={[channelCollection, messageLogCollection]}>
      <SchemaComponentContext.Provider value={{ ...scCtx, designable: false }}>
        <Card bordered={false}>
          <SchemaComponent
            schema={messageManagerSchema}
            scope={{ t, [MessageScopeNames.useSendAction]: useSendAction, useSubmitActionProps, useEditFormProps }}
            components={{
              [MessageComponentNames.MessageInput]: MessageInput,
              [MessageComponentNames.MessageLogManager]: LogManager,
            }}
          />
        </Card>
      </SchemaComponentContext.Provider>
    </ExtendCollectionsProvider>
  );
};

MessageManager.displayName = 'MessageManager';
