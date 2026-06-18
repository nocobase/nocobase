/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { Attachments } from '@ant-design/x';
import type { Attachment as AntAttachment } from '@ant-design/x/es/attachments';
import { css } from '@emotion/css';
import { useChat } from './hooks/useChat';
import { useChatConversationsStore } from './stores/chat-conversations';

const readString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);
const readNumber = (value: unknown) => (typeof value === 'number' ? value : undefined);

export const AttachmentsHeader: React.FC = () => {
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const attachments = chat.use.attachments();
  const removeAttachment = chat.removeAttachment;

  const items = useMemo(() => {
    return attachments?.map(
      (item, index): AntAttachment => ({
        ...item,
        uid: readString(item.uid, readString(item.filename, String(index))),
        name: readString(item.filename, readString(item.name)),
        status: readString(item.status, 'done') as AntAttachment['status'],
        url: readString(item.url),
        size: readNumber(item.size),
        thumbUrl: readString(item.preview),
      }),
    );
  }, [attachments]);

  if (!items?.length) {
    return null;
  }

  const wrapperClassName = css`
    .ant-attachment-list-card .ant-image img {
      height: 60px;
      width: 60px;
      object-fit: cover;
    }
  `;

  return (
    <div
      className={wrapperClassName}
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 4,
      }}
    >
      {items.map((item) => (
        <Attachments.FileCard key={item.uid} item={item} onRemove={(item) => removeAttachment(item.name)} />
      ))}
    </div>
  );
};
