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
import { GetRef, Input } from 'antd';
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

const decodeHTML = (str: string) =>
  str
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
const stripTags = (s: string) => s.replace(/<[^>]+>/g, '');
const htmlToMarkdown = (html: string) => {
  let s = html;
  s = s.replace(/<br\s*\/?>(?!\n)/gi, '\n');
  s = s.replace(/<\/p>/gi, '\n\n').replace(/<p[^>]*>/gi, '');
  s = s.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  s = s.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  s = s.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  s = s.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
  s = s.replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, (_m, code) => '```\n' + decodeHTML(code) + '\n```');
  s = s.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
  s = s.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (_m, list) =>
    list.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m2, item) => `- ${stripTags(item)}\n`),
  );
  s = s.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (_m, list) => {
    let i = 0;
    return list.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m2, item) => `${++i}. ${stripTags(item)}\n`);
  });
  s = s.replace(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, text) => `[${stripTags(text)}](${href})`);
  s = s.replace(
    /<img[^>]*src="([^"]+)"[^>]*alt="([^"]*)"[^>]*\/?>(?:<\/img>)?/gi,
    (_m, src, alt) => `![${alt}](${src})`,
  );
  s = s.replace(
    /<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi,
    (_m, lvl, text) => `${'#'.repeat(Number(lvl))} ${stripTags(text)}\n\n`,
  );
  s = s.replace(/<\/?div[^>]*>/gi, '').replace(/<\/?span[^>]*>/gi, '');
  s = s.replace(/<[^>]+>/g, '');
  return decodeHTML(s).trim();
};

const MarkdownInput: React.FC<any> = ({ value, onChange, autoSize, disabled, placeholder }) => {
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData('text/html');
    if (html) {
      e.preventDefault();
      const md = htmlToMarkdown(html);
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart ?? value?.length ?? 0;
      const end = target.selectionEnd ?? start;
      const next = (value || '').slice(0, start) + md + (value || '').slice(end);
      onChange?.(next);
    }
  };
  return (
    <Input.TextArea
      value={value}
      onChange={(ev) => onChange?.(ev.target.value)}
      onPaste={handlePaste}
      autoSize={autoSize}
      disabled={disabled}
      placeholder={placeholder}
    />
  );
};

export const Sender: React.FC = () => {
  const t = useT();
  const [handleSubmit] = useSendMessage();
  const senderRef = useRef<GetRef<typeof AntSender> | null>(null);

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

  return (
    <AntSender
      components={{
        input: MarkdownInput,
      }}
      value={value}
      ref={senderRef}
      onChange={(value) => {
        setValue(value);
      }}
      onSubmit={handleSubmit}
      onCancel={cancelRequest}
      header={<SenderHeader />}
      loading={responseLoading}
      footer={({ components }) => <SenderFooter components={components} handleSubmit={handleSubmit} />}
      disabled={!currentEmployee}
      actions={false}
      autoSize={{ minRows: 2, maxRows: 8 }}
    />
  );
};
