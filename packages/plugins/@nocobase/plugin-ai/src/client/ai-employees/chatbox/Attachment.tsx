/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Tag, Image } from 'antd';
import { Attachment as AttachmentType } from '../types';
import { getFileIconByExt } from './utils';
import { useChatMessagesStore } from './stores/chat-messages';

export const Attachment: React.FC<{
  file: AttachmentType;
  closable?: boolean;
}> = ({ file, closable }) => {
  const [visible, setVisible] = useState(false);
  const removeAttachment = useChatMessagesStore.use.removeAttachment();

  return (
    <Tag
      closable={closable}
      onClose={() => removeAttachment(file.name)}
      style={{
        padding: '2px 4px',
        cursor: 'pointer',
      }}
      onClick={() => {
        setVisible(true);
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          gap: '4px',
        }}
      >
        {file.mimetype?.startsWith('image') && file.thumbUrl ? (
          <Image
            src={file.thumbUrl}
            width={20}
            preview={{
              mask: null,
              visible,
              src: file.thumbUrl,
              onVisibleChange: (v) => {
                setVisible(v);
              },
            }}
          />
        ) : (
          <Image width={20} src={getFileIconByExt(file.extname)} preview={false} />
        )}
        {file.name}
      </div>
    </Tag>
  );
};
