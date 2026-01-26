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
import { useChatConversationsStore } from './stores/chat-conversations';
import { useChatMessagesStore } from './stores/chat-messages';
import { useChatMessageActions } from './hooks/useChatMessageActions';
import { useChatBoxStore } from './stores/chat-box';
import { useChatBoxActions } from './hooks/useChatBoxActions';
import { useUploadFiles } from './hooks/useUploadFiles';
import _ from 'lodash';

const useSendMessage = () => {
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const isEditingMessage = useChatBoxStore.use.isEditingMessage();
  const editingMessageId = useChatBoxStore.use.editingMessageId();

  const currentConversation = useChatConversationsStore.use.currentConversation();
  const webSearch = useChatConversationsStore.use.webSearch();

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
      webSearch,
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

  const senderValue = useChatBoxStore.use.senderValue();
  const setSenderValue = useChatBoxStore.use.setSenderValue();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const setSenderRef = useChatBoxStore.use.setSenderRef();

  const setAttachments = useChatMessagesStore.use.setAttachments();
  const uploadProps = useUploadFiles();

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

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    let file = null;
    for (let i = 0; i < items.length; i++) {
      if (items[i].kind === 'file') {
        file = items[i].getAsFile();
        break;
      }
    }

    if (!file) {
      return;
    }
    e.preventDefault();

    const uid = Date.now().toString();
    const rawFile = file;
    const uploadFile = {
      uid,
      name: rawFile.name,
      status: 'uploading',
      originFileObj: rawFile,
      percent: 0,
      type: rawFile.type,
      size: rawFile.size,
    };

    setAttachments((prev) => [...prev, uploadFile]);
    const { customRequest, data, headers, action } = uploadProps;

    if (customRequest) {
      customRequest({
        file: rawFile,
        filename: 'file',
        data,
        headers,
        action,
        onProgress: ({ percent }) => {
          setAttachments((prev) =>
            prev.map((item) => {
              if (item.uid === uid) {
                return { ...item, percent };
              }
              return item;
            }),
          );
        },
        onSuccess: (response, xhr) => {
          const fileData = response?.data;
          setAttachments((prev) =>
            prev.map((item) => {
              if (item.uid === uid) {
                return {
                  ...item,
                  status: 'done',
                  response: response,
                  ...fileData,
                  url: fileData?.url || item.url,
                };
              }
              return item;
            }),
          );
        },
        onError: (err) => {
          setAttachments((prev) =>
            prev.map((item) => {
              if (item.uid === uid) {
                return { ...item, status: 'error', error: err };
              }
              return item;
            }),
          );
        },
      });
    }
  };

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
      onPaste={handlePaste}
      onSubmit={handleSubmit}
      onCancel={cancelRequest}
      header={<SenderHeader />}
      loading={responseLoading}
      footer={({ components }) => <SenderFooter components={components} handleSubmit={handleSubmit} />}
      disabled={!currentEmployee}
      // placeholder={!currentEmployee ? t('Please choose an AI employee') : senderPlaceholder}
      actions={false}
      autoSize={{ minRows: 2, maxRows: 8 }}
    />
  );
};
