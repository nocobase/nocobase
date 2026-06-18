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
import type { AttachmentsProps } from '@ant-design/x';
import type { Attachment as AntAttachment } from '@ant-design/x/es/attachments';
import { PaperClipOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { useT } from '../../locale';
import { useUploadFiles } from './hooks/useUploadFiles';
import { useChatBoxStore } from './stores/chat-box';
import { useChat } from './hooks/useChat';
import { useChatConversationsStore } from './stores/chat-conversations';

const readString = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);
const readNumber = (value: unknown) => (typeof value === 'number' ? value : undefined);

export const Upload: React.FC<{ disabled?: boolean }> = ({ disabled }) => {
  const t = useT();
  const uploadProps = useUploadFiles();
  const attachmentUploadProps = uploadProps as unknown as Partial<AttachmentsProps>;

  const chatBoxRef = useChatBoxStore.use.chatBoxRef();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);

  const attachments = chat.use.attachments();

  const items = useMemo(() => {
    return attachments?.map(
      (item, index): AntAttachment => ({
        ...item,
        uid: readString(item.uid, String(index)),
        name: readString(item.filename, readString(item.name)),
        status: readString(item.status, 'done') as AntAttachment['status'],
        url: readString(item.url),
        size: readNumber(item.size),
        thumbUrl: readString(item.preview),
      }),
    );
  }, [attachments]);

  if (disabled) {
    return <Button type="text" icon={<PaperClipOutlined />} disabled={true} />;
  }
  return (
    <Attachments
      getDropContainer={() => chatBoxRef.current}
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
      {...attachmentUploadProps}
    >
      <Tooltip title={t('Upload files')} arrow={false}>
        <Button type="text" icon={<PaperClipOutlined />} />
      </Tooltip>
    </Attachments>
  );
};
