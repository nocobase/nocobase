/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Sender as AntSender } from '@ant-design/x';
import { GetRef } from 'antd';
import { useT } from '../../locale';
import { SenderFooter } from './SenderFooter';
import { SenderHeader } from './SenderHeader';
import { AttachmentsHeader } from './AttachmentsHeader';
import { useChatConversationsStore } from './stores/chat-conversations';
import { useChatMessagesStore } from './stores/chat-messages';
import { useChatMessageActions } from './hooks/useChatMessageActions';
import { useChatBoxStore } from './stores/chat-box';
import { useChatBoxActions } from './hooks/useChatBoxActions';

export const Sender: React.FC = () => {
  const t = useT();
  const senderRef = useRef<GetRef<typeof AntSender> | null>(null);

  const senderValue = useChatBoxStore.use.senderValue();
  const setSenderValue = useChatBoxStore.use.setSenderValue();
  const senderPlaceholder = useChatBoxStore.use.senderPlaceholder();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const setSenderRef = useChatBoxStore.use.setSenderRef();
  const isEditingMessage = useChatBoxStore.use.isEditingMessage();
  const editingMessageId = useChatBoxStore.use.editingMessageId();

  const currentConversation = useChatConversationsStore.use.currentConversation();

  const responseLoading = useChatMessagesStore.use.responseLoading();
  const attachments = useChatMessagesStore.use.attachments();
  const contextItems = useChatMessagesStore.use.contextItems();
  const systemMessage = useChatMessagesStore.use.systemMessage();

  const { cancelRequest, finishEditingMessage } = useChatMessageActions();

  const { send } = useChatBoxActions();

  const [value, setValue] = useState(senderValue);

  useEffect(() => {
    setSenderRef(senderRef);
  }, []);

  useEffect(() => {
    if (value !== senderValue) {
      setSenderValue(value);
    }
  }, [value]);

  useEffect(() => {
    setValue(senderValue);
  }, [senderValue]);

  return (
    <AntSender
      // components={{
      //   input: VariableInput,
      // }}
      value={value}
      ref={senderRef}
      onChange={(value) => {
        setValue(value);
      }}
      onSubmit={(content) => {
        send({
          sessionId: currentConversation,
          aiEmployee: currentEmployee,
          systemMessage,
          messages: [
            {
              type: 'text',
              content,
            },
          ],
          attachments,
          workContext: contextItems,
          editingMessageId: isEditingMessage ? editingMessageId : undefined,
        });

        if (isEditingMessage) {
          finishEditingMessage();
        }
      }}
      onCancel={cancelRequest}
      header={<SenderHeader />}
      loading={responseLoading}
      footer={({ components }) => <SenderFooter components={components} />}
      disabled={!currentEmployee}
      // placeholder={!currentEmployee ? t('Please choose an AI employee') : senderPlaceholder}
      actions={false}
    />
  );
};
