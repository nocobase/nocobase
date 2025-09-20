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
import { GetRef, Button } from 'antd';
import { useT } from '../../locale';
import { SenderFooter } from './SenderFooter';
import { SenderHeader } from './SenderHeader';
import { useChatConversationsStore } from './stores/chat-conversations';
import { useChatMessagesStore } from './stores/chat-messages';
import { useChatMessageActions } from './hooks/useChatMessageActions';
import { useChatBoxStore } from './stores/chat-box';
import { useChatBoxActions } from './hooks/useChatBoxActions';
import _ from 'lodash';

const useSendMessage = () => {
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const isEditingMessage = useChatBoxStore.use.isEditingMessage();
  const editingMessageId = useChatBoxStore.use.editingMessageId();

  const currentConversation = useChatConversationsStore.use.currentConversation();

  const attachments = useChatMessagesStore.use.attachments();
  const contextItems = useChatMessagesStore.use.contextItems();
  const systemMessage = useChatMessagesStore.use.systemMessage();
  const skillSettings = useChatMessagesStore.use.skillSettings();

  const { finishEditingMessage } = useChatMessageActions();

  const { send } = useChatBoxActions();
  const handleSubmit = (content: string) => {
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
      attachments: attachments.filter((x) => x.status === 'done'),
      workContext: contextItems,
      editingMessageId: isEditingMessage ? editingMessageId : undefined,
      skillSettings,
    });

    if (isEditingMessage) {
      finishEditingMessage();
    }
  };

  return [handleSubmit];
};

export const Sender: React.FC = () => {
  const t = useT();
  const [handleSubmit] = useSendMessage();
  const senderRef = useRef<GetRef<typeof AntSender> | null>(null);
  const senderButtonRef = useRef<GetRef<typeof Button> | null>(null);

  const senderValue = useChatBoxStore.use.senderValue();
  const setSenderValue = useChatBoxStore.use.setSenderValue();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const setSenderRef = useChatBoxStore.use.setSenderRef();

  const responseLoading = useChatMessagesStore.use.responseLoading();

  const { cancelRequest } = useChatMessageActions();

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

  const contextItems = useChatMessagesStore.use.contextItems();
  useEffect(() => {
    senderRef.current.nativeElement.onkeydown = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (_.isEmpty(senderValue) && contextItems.length) {
          senderButtonRef.current.click();
        }
      }
    };
  }, [senderValue, contextItems]);

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
      onSubmit={handleSubmit}
      onCancel={cancelRequest}
      header={<SenderHeader />}
      loading={responseLoading}
      footer={({ components }) => {
        const { SendButton } = components;
        if (SendButton) {
          const DecoratedSendButton = (props) => {
            const senderValue = useChatBoxStore.use.senderValue();
            const contextItems = useChatMessagesStore.use.contextItems();
            const [handleSubmit] = useSendMessage();
            const handleEmptySubmit = () => {
              if (_.isEmpty(senderValue) && contextItems.length) {
                handleSubmit('');
              }
            };
            return <SendButton ref={senderButtonRef} {...props} onClick={handleEmptySubmit} />;
          };
          components.SendButton = DecoratedSendButton;
        }
        return <SenderFooter components={components} />;
      }}
      disabled={!currentEmployee}
      // placeholder={!currentEmployee ? t('Please choose an AI employee') : senderPlaceholder}
      actions={false}
    />
  );
};
