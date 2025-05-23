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
import { useChatMessages } from './ChatMessagesProvider';
import { useUploadFiles } from './useUploadFiles';

export const AttachmentsHeader: React.FC = () => {
  const uploadProps = useUploadFiles();
  const { attachments, removeAttachment } = useChatMessages();
  const items = useMemo(() => {
    return attachments?.map((item, index) => ({
      uid: index.toString(),
      name: item.filename,
      status: 'done' as const,
      url: item.url,
      size: item.size,
      thumbUrl: item.preview,
      ...item,
    }));
  }, [attachments]);
  return (
    <Attachments
      style={
        !items?.length
          ? {
              height: 0,
            }
          : {}
      }
      items={items}
      onRemove={({ uid }) => removeAttachment(Number(uid))}
      {...uploadProps}
    />
  );
};
