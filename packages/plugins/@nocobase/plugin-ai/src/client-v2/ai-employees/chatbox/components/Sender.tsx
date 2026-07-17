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
import { observer } from '@nocobase/flow-engine';
import { useT } from '../../../locale';
import type { AIEmployee, Attachment, ContextItem, SendOptions, SkillSettings } from '../../types';
import { useChat } from '../hooks/useChat';
import { useChatBoxActions } from '../hooks/useChatBoxActions';
import { useChatMessageActions } from '../hooks/useChatMessageActions';
import { useUploadFiles } from '../hooks/useUploadFiles';
import { useChatBoxRuntime } from '../stores/runtime';
import { AIEmployeeSwitcher } from './AIEmployeeSwitcher';
import { AddContextButton } from '../../AddContextButton';
import { ContextItem } from './ContextItem';
import { FileCardList, useAttachmentFileCards } from './Attachments';
import { ModelSwitcher } from './ModelSwitcher';
import { SearchSwitch } from './SearchSwitch';
import { normalizeAIFileUploadAttachment } from '../utils';

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

export type SenderOptions = {
  placeholder?: string;
  containerStyle?: React.CSSProperties;
  showContextSelector?: boolean;
  showUpload?: boolean;
  showWebSearch?: boolean;
  showEmployeeSelect?: boolean;
  showModelSelect?: boolean;
  sendContextItems?: boolean;
  defaultSystemMessage?: string;
  defaultUserMessage?: string;
  allowedAIEmployees?: string[];
  allowedModels?: string[];
  scope?: string;
};

export type BuildSenderSendOptionsInput = {
  content: string;
  currentConversation?: string;
  currentEmployee?: AIEmployee;
  systemMessage?: string;
  attachments?: Attachment[];
  contextItems?: ContextItem[];
  defaultSystemMessage?: string;
  defaultUserMessage?: string;
  isEditingMessage?: boolean;
  editingMessageId?: string | null;
  skillSettings?: SkillSettings | null;
  webSearch?: boolean;
  scope?: string;
  uploadEnabled?: boolean;
  contextSelectorEnabled?: boolean;
  webSearchEnabled?: boolean;
};

export const mergeSenderContextItems = (contextItems?: ContextItem[]) => {
  const seen = new Set<string>();
  return [...(contextItems || [])].filter((item) => {
    const key = `${item.type}:${item.uid}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
};

export const buildSenderSendOptions = ({
  content,
  currentConversation,
  currentEmployee,
  systemMessage,
  attachments,
  contextItems,
  defaultSystemMessage,
  defaultUserMessage,
  isEditingMessage,
  editingMessageId,
  skillSettings,
  webSearch,
  scope,
  uploadEnabled = true,
  contextSelectorEnabled = true,
  webSearchEnabled = true,
}: BuildSenderSendOptionsInput): SendOptions | null => {
  if (!currentEmployee) {
    return null;
  }
  const resolvedContent = content || defaultUserMessage || '';
  const resolvedContextItems = contextSelectorEnabled ? mergeSenderContextItems(contextItems) : [];

  if (!resolvedContent && !resolvedContextItems.length) {
    return null;
  }

  return {
    sessionId: currentConversation,
    aiEmployee: currentEmployee,
    systemMessage: systemMessage || defaultSystemMessage,
    messages: [
      {
        type: 'text',
        content: resolvedContent,
      },
    ],
    attachments: uploadEnabled ? attachments?.filter((attachment) => attachment.status === 'done') : undefined,
    workContext: resolvedContextItems,
    editingMessageId: isEditingMessage && editingMessageId ? editingMessageId : undefined,
    skillSettings: skillSettings || undefined,
    webSearch: webSearchEnabled ? webSearch : false,
    scope,
  };
};

export const Sender: React.FC<SenderOptions> = observer((options) => {
  const t = useT();
  const senderRef = useRef<SenderRef | null>(null);
  const runtime = useChatBoxRuntime();
  const { chatBoxModel, chatConversationModel, chatSenderModel } = runtime;
  const currentConversation = chatConversationModel.currentConversation;
  const currentEmployee = chatBoxModel.currentEmployee;
  const senderValue = chatSenderModel.senderValue;
  const readonly = chatBoxModel.readonly;
  const isEditingMessage = chatSenderModel.isEditingMessage;
  const editingMessageId = chatSenderModel.editingMessageId;
  const webSearch = chatConversationModel.webSearch;
  const chat = useChat(currentConversation, runtime);
  const attachments = chat.use.attachments();
  const contextItems = chat.use.contextItems();
  const systemMessage = chat.use.systemMessage();
  const responseLoading = chat.use.responseLoading();
  const skillSettings = chat.use.skillSettings();
  const uploadProps = useUploadFiles(runtime);
  const { send } = useChatBoxActions(runtime);
  const { cancelRequest, finishEditingMessage } = useChatMessageActions(runtime);
  const [value, setValue] = useState(senderValue);
  const showContextSelector = options.showContextSelector !== false;
  const showUpload = options.showUpload !== false;
  const showWebSearch = options.showWebSearch !== false;
  const sendContextItems = options.sendContextItems ?? showContextSelector;
  const placeholder = options.placeholder || 'Enter your question';
  const scope = options.scope ?? runtime.scope;

  useEffect(() => {
    chatSenderModel.setSenderRef(senderRef);
    return () => {
      chatSenderModel.setSenderRef(null);
    };
  }, [chatSenderModel]);

  useEffect(() => {
    setValue(senderValue);
  }, [senderValue]);

  useEffect(() => {
    if (!showWebSearch && webSearch) {
      chatConversationModel.setWebSearch(false);
    }
  }, [chatConversationModel, showWebSearch, webSearch]);

  const submit = (content: string) => {
    if (responseLoading || readonly) {
      return;
    }
    const sendOptions = buildSenderSendOptions({
      content,
      currentConversation,
      currentEmployee,
      systemMessage,
      attachments,
      contextItems,
      defaultSystemMessage: options.defaultSystemMessage,
      defaultUserMessage: options.defaultUserMessage,
      isEditingMessage,
      editingMessageId,
      skillSettings,
      webSearch,
      scope,
      uploadEnabled: showUpload,
      contextSelectorEnabled: sendContextItems,
      webSearchEnabled: showWebSearch,
    });
    if (!sendOptions) {
      return;
    }
    chatSenderModel.setShowSenderHint(false);
    setValue('');
    chatSenderModel.setSenderValue('');
    send(sendOptions);

    if (isEditingMessage) {
      finishEditingMessage();
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    if (!showUpload) {
      return;
    }
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
          previous.map((item) => (item.uid === uid ? normalizeAIFileUploadAttachment(fileData || item, 'done') : item)),
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
        ...options.containerStyle,
      }}
    >
      <AntSender
        className={senderClassName}
        value={value}
        ref={senderRef}
        onChange={(nextValue) => {
          setValue(nextValue);
          chatSenderModel.setSenderValue(nextValue);
        }}
        onPaste={handlePaste}
        onSubmit={submit}
        onCancel={cancelRequest}
        onBlur={() => {
          chatSenderModel.setShowSenderHint(false);
        }}
        header={<SenderHeader options={options} />}
        loading={responseLoading}
        footer={({ components }) => <SenderFooter components={components} handleSubmit={submit} options={options} />}
        disabled={!currentEmployee || readonly}
        placeholder={t(placeholder)}
        actions={false}
        autoSize={{ minRows: 2, maxRows: 8 }}
      />
    </div>
  );
});

const SenderHeader: React.FC<{
  options: SenderOptions;
}> = observer(({ options }) => {
  const { chatBoxModel, chatSenderModel } = useChatBoxRuntime();
  const currentEmployee = chatBoxModel.currentEmployee;
  const isEditingMessage = chatSenderModel.isEditingMessage;
  const isShowSenderHint = chatSenderModel.isShowSenderHint;
  const readonly = chatBoxModel.readonly;
  const runtime = useChatBoxRuntime();
  const currentConversation = runtime.chatConversationModel.currentConversation;
  const chat = useChat(currentConversation, runtime);
  const contextItems = chat.use.contextItems();
  const attachments = chat.use.attachments();

  const showContextItems = options.showContextSelector !== false;
  const showAttachments = options.showUpload !== false;
  const hasContextItems = showContextItems && !!contextItems?.length;
  const hasAttachments = showAttachments && !!attachments?.length;

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
      {currentEmployee && showContextItems ? <ContextItemsHeader /> : null}
      {currentEmployee && showAttachments ? <AttachmentsHeader readonly={readonly} /> : null}
    </div>
  );
});

const SenderFooter: React.FC<{
  components: {
    SendButton: React.ComponentType<React.ComponentProps<typeof Button>>;
    LoadingButton: React.ComponentType<React.ComponentProps<typeof Button>>;
  };
  handleSubmit: (content: string) => void;
  options: SenderOptions;
}> = observer(({ components, handleSubmit, options }) => {
  const { SendButton, LoadingButton } = components;
  const senderButtonRef = useRef<GetRef<typeof Button> | null>(null);
  const runtime = useChatBoxRuntime();
  const { chatBoxModel, chatSenderModel } = runtime;
  const currentEmployee = chatBoxModel.currentEmployee;
  const currentConversation = runtime.chatConversationModel.currentConversation;
  const chat = useChat(currentConversation, runtime);
  const readonly = chatBoxModel.readonly;
  const loading = chat.use.responseLoading();
  const addContextItems = chat.addContextItems;
  const removeContextItem = chat.removeContextItem;
  const senderValue = chatSenderModel.senderValue;
  const contextItems = chat.use.contextItems();
  const senderRef = chatSenderModel.senderRef as React.MutableRefObject<SenderRef | null> | null;
  const disabled = !currentEmployee || readonly;
  const showContextSelector = options.showContextSelector !== false;
  const handleEmptySubmit = () => {
    if (!senderValue && (contextItems.length || options.defaultUserMessage)) {
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
        {showContextSelector ? (
          <AddContextButton
            onAdd={addContextItems}
            onRemove={removeContextItem}
            disabled={disabled}
            ignore={(key) => key === 'flow-model.variable'}
          />
        ) : null}
        {options.showUpload !== false ? <UploadFiles disabled={disabled} /> : null}
        {options.showWebSearch !== false ? <SearchSwitch disabled={disabled} /> : null}
        {options.showEmployeeSelect !== false ? (
          <AIEmployeeSwitcher disabled={readonly} allowedUsernames={options.allowedAIEmployees} />
        ) : null}
        {options.showModelSelect !== false ? (
          <ModelSwitcher disabled={disabled} allowedModelKeys={options.allowedModels} />
        ) : null}
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
});

const UploadFiles: React.FC<{ disabled?: boolean }> = observer(({ disabled }) => {
  const t = useT();
  const runtime = useChatBoxRuntime();
  const uploadProps = useUploadFiles(runtime);
  const { chatBoxModel } = runtime;
  const chatBoxRef = chatBoxModel.chatBoxRef;
  const currentConversation = runtime.chatConversationModel.currentConversation;
  const chat = useChat(currentConversation, runtime);
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
});

const ContextItemsHeader: React.FC = observer(() => {
  const runtime = useChatBoxRuntime();
  const currentConversation = runtime.chatConversationModel.currentConversation;
  const chat = useChat(currentConversation, runtime);
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
});

const AttachmentsHeader: React.FC<{ readonly: boolean }> = observer(({ readonly }) => {
  const runtime = useChatBoxRuntime();
  const currentConversation = runtime.chatConversationModel.currentConversation;
  const chat = useChat(currentConversation, runtime);
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
});

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

const EditMessageHeader: React.FC = observer(() => {
  const t = useT();
  const { token } = theme.useToken();
  const runtime = useChatBoxRuntime();
  const { chatBoxModel, chatSenderModel } = runtime;
  const currentConversation = runtime.chatConversationModel.currentConversation;
  const chat = useChat(currentConversation, runtime);
  const { loadMessages, finishEditingMessage } = useChatMessageActions(runtime);

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
        chatSenderModel.setSenderValue('');
        chat.setMessages([]);
        loadMessages(currentConversation).catch(console.error);
      }}
    />
  );
});

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
