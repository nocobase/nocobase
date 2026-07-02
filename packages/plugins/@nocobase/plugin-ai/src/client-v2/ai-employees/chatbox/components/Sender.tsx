/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Attachments, Sender as AntSender } from '@ant-design/x';
import { Alert, Button, Flex, Space, Spin, theme, Tooltip, type GetRef, type UploadFile } from 'antd';
import { EditOutlined, InfoCircleOutlined, PaperClipOutlined } from '@ant-design/icons';
import { css } from '@emotion/css';
import { useT } from '../../../locale';
import type { Attachment } from '../../types';
import { useChat } from '../hooks/useChat';
import { useChatBoxActions } from '../hooks/useChatBoxActions';
import { useChatMessageActions } from '../hooks/useChatMessageActions';
import { useUploadFiles } from '../hooks/useUploadFiles';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { AIEmployeeSwitcher } from './AIEmployeeSwitcher';
import { AddContextButton } from '../../AddContextButton';
import { ContextItem } from './ContextItem';
import { FileCardList, useAttachmentFileCards } from './Attachments';
import { ModelSwitcher } from './ModelSwitcher';
import { SearchSwitch } from './SearchSwitch';

type SenderRef = GetRef<typeof AntSender> & {
  nativeElement?: HTMLElement;
};

type UploadRequestOptions = {
  file: Blob;
  filename: string;
  data?: Record<string, string | Blob>;
  headers?: Record<string, string>;
  action: string;
  onProgress?: (event: { percent?: number }) => void;
  onSuccess: (response: unknown, file?: Blob) => void;
  onError: (error: Error) => void;
};

const senderClassName = css`
  .ant-sender-content {
    padding: 16px;
  }
`;

export const Sender: React.FC = () => {
  const t = useT();
  const senderRef = useRef<SenderRef | null>(null);
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const setShowSenderHint = useChatBoxStore.use.setShowSenderHint();
  const senderValue = useChatBoxStore.use.senderValue();
  const setSenderValue = useChatBoxStore.use.setSenderValue();
  const setSenderRef = useChatBoxStore.use.setSenderRef();
  const readonly = useChatBoxStore.use.readonly();
  const isEditingMessage = useChatBoxStore.use.isEditingMessage();
  const editingMessageId = useChatBoxStore.use.editingMessageId();
  const webSearch = useChatConversationsStore.use.webSearch();
  const chat = useChat(currentConversation);
  const attachments = chat.use.attachments();
  const contextItems = chat.use.contextItems();
  const systemMessage = chat.use.systemMessage();
  const responseLoading = chat.use.responseLoading();
  const skillSettings = chat.use.skillSettings();
  const uploadProps = useUploadFiles();
  const { send } = useChatBoxActions();
  const { cancelRequest, finishEditingMessage } = useChatMessageActions();
  const [value, setValue] = useState(senderValue);

  useEffect(() => {
    setSenderRef(senderRef);
    return () => {
      setSenderRef(null);
    };
  }, [setSenderRef]);

  useEffect(() => {
    setValue(senderValue);
  }, [senderValue]);

  const submit = (content: string) => {
    if ((!content && !contextItems.length) || !currentEmployee || responseLoading || readonly) {
      return;
    }
    setShowSenderHint(false);
    setValue('');
    setSenderValue('');
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
      attachments: attachments.filter((attachment) => attachment.status === 'done'),
      workContext: contextItems,
      editingMessageId: isEditingMessage ? editingMessageId : undefined,
      skillSettings,
      webSearch,
    });

    if (isEditingMessage) {
      finishEditingMessage();
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const pastedFile = Array.from(event.clipboardData.items)
      .find((item) => item.kind === 'file')
      ?.getAsFile();

    if (!pastedFile) {
      return;
    }

    event.preventDefault();

    const uid = Date.now().toString();
    const uploadFile: Attachment = {
      uid,
      name: pastedFile.name,
      filename: pastedFile.name,
      status: 'uploading',
      originFileObj: pastedFile,
      percent: 0,
      type: pastedFile.type,
      size: pastedFile.size,
    };

    chat.setAttachments((previous) => [...previous, uploadFile]);
    const customRequest = uploadProps.customRequest as ((options: UploadRequestOptions) => void) | undefined;
    const uploadOptions = uploadProps as typeof uploadProps & {
      data?: Record<string, string | Blob>;
      headers?: Record<string, string>;
    };

    if (!customRequest) {
      return;
    }

    customRequest({
      file: pastedFile,
      filename: 'file',
      data: uploadOptions.data,
      headers: uploadOptions.headers,
      action: String(uploadProps.action || 'aiFiles:create'),
      onProgress: ({ percent }) => {
        chat.setAttachments((previous) => previous.map((item) => (item.uid === uid ? { ...item, percent } : item)));
      },
      onSuccess: (response) => {
        const fileData = readUploadedFileData(response);
        chat.setAttachments((previous) =>
          previous.map((item) => (item.uid === uid ? { ...(fileData || item), status: 'done' } : item)),
        );
      },
      onError: (error) => {
        chat.setAttachments((previous) =>
          previous.map((item) => (item.uid === uid ? { ...item, status: 'error', error } : item)),
        );
      },
    });
  };

  return (
    <div
      style={{
        margin: '8px 16px',
      }}
    >
      <AntSender
        className={senderClassName}
        value={value}
        ref={senderRef}
        onChange={(nextValue) => {
          setValue(nextValue);
          setSenderValue(nextValue);
        }}
        onPaste={handlePaste}
        onSubmit={submit}
        onCancel={cancelRequest}
        onBlur={() => {
          setShowSenderHint(false);
        }}
        header={<SenderHeader />}
        loading={responseLoading}
        footer={({ components }) => <SenderFooter components={components} handleSubmit={submit} />}
        disabled={!currentEmployee || readonly}
        placeholder={t('Enter your question')}
        actions={false}
        autoSize={{ minRows: 2, maxRows: 8 }}
      />
    </div>
  );
};

const SenderHeader: React.FC = () => {
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const isEditingMessage = useChatBoxStore.use.isEditingMessage();
  const isShowSenderHint = useChatBoxStore.use.isShowSenderHint();
  const readonly = useChatBoxStore.use.readonly();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const contextItems = chat.use.contextItems();
  const attachments = chat.use.attachments();

  const hasContextItems = !!contextItems?.length;
  const hasAttachments = !!attachments?.length;

  if (!isShowSenderHint && !isEditingMessage && (!currentEmployee || (!hasContextItems && !hasAttachments))) {
    return null;
  }

  return (
    <div
      style={{
        padding: '8px 8px 0 8px',
      }}
    >
      {isShowSenderHint ? <HintMessageHeader /> : null}
      {isEditingMessage ? (
        <div>
          <EditMessageHeader />
        </div>
      ) : null}
      {currentEmployee ? <ContextItemsHeader /> : null}
      {currentEmployee ? <AttachmentsHeader readonly={readonly} /> : null}
    </div>
  );
};

const SenderFooter: React.FC<{
  components: {
    SendButton: React.ComponentType<React.ComponentProps<typeof Button>>;
    LoadingButton: React.ComponentType<React.ComponentProps<typeof Button>>;
  };
  handleSubmit: (content: string) => void;
}> = ({ components, handleSubmit }) => {
  const { SendButton, LoadingButton } = components;
  const senderButtonRef = useRef<GetRef<typeof Button> | null>(null);
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const readonly = useChatBoxStore.use.readonly();
  const loading = chat.use.responseLoading();
  const addContextItems = chat.addContextItems;
  const removeContextItem = chat.removeContextItem;
  const senderValue = useChatBoxStore.use.senderValue();
  const contextItems = chat.use.contextItems();
  const senderRef = useChatBoxStore.use.senderRef() as React.MutableRefObject<SenderRef | null> | null;
  const disabled = !currentEmployee || readonly;
  const handleEmptySubmit = () => {
    if (!senderValue && contextItems.length) {
      handleSubmit('');
    }
  };

  useEffect(() => {
    const nativeElement = senderRef?.current?.nativeElement;
    if (!nativeElement) {
      return;
    }

    nativeElement.onkeydown = (event) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (!senderValue && contextItems.length) {
          senderButtonRef.current?.click();
        }
      }
    };

    return () => {
      if (nativeElement.onkeydown) {
        nativeElement.onkeydown = null;
      }
    };
  }, [contextItems, senderRef, senderValue]);

  return (
    <Flex justify="space-between" align="center">
      <Flex gap="middle" align="center">
        <AddContextButton
          onAdd={addContextItems}
          onRemove={removeContextItem}
          disabled={disabled}
          ignore={(key) => key === 'flow-model.variable'}
        />
        <UploadFiles disabled={disabled} />
        <SearchSwitch disabled={disabled} />
        <AIEmployeeSwitcher disabled={readonly} />
        <ModelSwitcher disabled={disabled} />
      </Flex>
      <Flex align="center" gap="middle">
        {loading ? (
          <LoadingButton type="default" />
        ) : (
          <SendButton ref={senderButtonRef} type="primary" disabled={false} onClick={handleEmptySubmit} />
        )}
      </Flex>
    </Flex>
  );
};

const UploadFiles: React.FC<{ disabled?: boolean }> = ({ disabled }) => {
  const t = useT();
  const uploadProps = useUploadFiles();
  const chatBoxRef = useChatBoxStore.use.chatBoxRef();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const attachments = chat.use.attachments();
  const items = useAttachmentFileCards(attachments);

  if (disabled) {
    return <Button type="text" icon={<PaperClipOutlined />} disabled />;
  }

  return (
    <Attachments
      getDropContainer={() => chatBoxRef?.current ?? document.body}
      styles={{
        placeholder: {
          opacity: 0.8,
        },
      }}
      placeholder={{
        icon: <PaperClipOutlined />,
        title: t('Drag & Drop files here'),
      }}
      items={items}
      action={uploadProps.action}
      customRequest={uploadProps.customRequest as React.ComponentProps<typeof Attachments>['customRequest']}
      onChange={(info) => {
        uploadProps.onChange({
          fileList: info.fileList.map(uploadFileToAttachment),
        });
      }}
    >
      <Tooltip title={t('Upload files')} arrow={false}>
        <Button type="text" icon={<PaperClipOutlined />} />
      </Tooltip>
    </Attachments>
  );
};

const ContextItemsHeader: React.FC = () => {
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const contextItems = chat.use.contextItems();
  const removeContextItem = chat.removeContextItem;

  if (!contextItems?.length) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        gap: '2px 0',
        marginTop: 4,
      }}
    >
      {contextItems.map((item) => (
        <ContextItem
          within="sender"
          key={`${item.type}:${item.uid}`}
          item={item}
          closable
          onRemove={removeContextItem}
        />
      ))}
    </div>
  );
};

const AttachmentsHeader: React.FC<{ readonly: boolean }> = ({ readonly }) => {
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const attachments = chat.use.attachments();

  return (
    <FileCardList
      attachments={attachments}
      onRemove={
        readonly
          ? undefined
          : (attachment) => {
              chat.removeAttachment(readAttachmentFilename(attachment));
            }
      }
    />
  );
};

const HintMessageHeader: React.FC = () => {
  const t = useT();
  const { token } = theme.useToken();

  return (
    <Alert
      style={{
        background: token.colorBgContainer,
        borderColor: token.colorBorderSecondary,
        color: token.colorText,
      }}
      icon={<InfoCircleOutlined style={{ color: token.colorText }} />}
      message={t('Please enter and send the modification request')}
      type="info"
      showIcon
    />
  );
};

const EditMessageHeader: React.FC = () => {
  const t = useT();
  const { token } = theme.useToken();
  const setSenderValue = useChatBoxStore.use.setSenderValue();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const { loadMessages, finishEditingMessage } = useChatMessageActions();

  return (
    <Alert
      style={{
        background: token.colorBgContainer,
        borderColor: token.colorBorderSecondary,
        color: token.colorText,
      }}
      icon={<EditOutlined style={{ color: token.colorText }} />}
      message={t('Editing message for AI employee')}
      type="info"
      showIcon
      closable
      onClose={() => {
        finishEditingMessage();
        setSenderValue('');
        chat.setMessages([]);
        loadMessages(currentConversation).catch(console.error);
      }}
    />
  );
};

function readUploadedFileData(response: unknown): Attachment | undefined {
  if (!response || typeof response !== 'object' || !('data' in response)) {
    return undefined;
  }
  const data = (response as { data?: unknown }).data;
  return data && typeof data === 'object' ? (data as Attachment) : undefined;
}

function uploadFileToAttachment(file: UploadFile): Attachment {
  return {
    filename: file.name,
    name: file.name,
    uid: file.uid,
    status: file.status,
    response: readUploadResponse(file.response),
    url: file.url,
    thumbUrl: file.thumbUrl,
    size: file.size,
    type: file.type,
    originFileObj: file.originFileObj,
  };
}

function readUploadResponse(response: unknown): { data?: Attachment } | undefined {
  if (!response || typeof response !== 'object') {
    return undefined;
  }
  const value = response as { data?: unknown };
  return value.data && typeof value.data === 'object' ? { data: value.data as Attachment } : undefined;
}

function readAttachmentFilename(attachment: Attachment) {
  const filename = attachment.filename;
  if (typeof filename === 'string') {
    return filename;
  }
  const name = attachment.name;
  return typeof name === 'string' ? name : '';
}
