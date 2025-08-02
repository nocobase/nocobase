/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useMemo } from 'react';
import { useUploadFiles } from './hooks/useUploadFiles';
import { Upload } from 'antd';
import { css } from '@emotion/css';
import { Attachment } from './Attachment';
import { useChatMessagesStore } from './stores/chat-messages';

export const AttachmentsHeader: React.FC = () => {
  const uploadProps = useUploadFiles();

  const attachments = useChatMessagesStore.use.attachments();

  const items = useMemo(() => {
    return attachments?.map((item) => ({
      uid: item.filename,
      name: item.filename,
      status: 'done' as const,
      url: item.url,
      size: item.size,
      thumbUrl: item.preview,
      ...item,
    }));
  }, [attachments]);
  if (!items?.length) {
    return null;
  }
  return (
    <Upload
      {...uploadProps}
      listType="picture"
      fileList={items}
      itemRender={(_, file) => <Attachment file={file} closable={true} />}
      className={css`
        .ant-upload-list {
          display: flex;
          justify-content: flex-start;
          flex-wrap: wrap;
          gap: 2px 0;
          margin-top: 4px;
        }
      `}
    ></Upload>
  );
};
