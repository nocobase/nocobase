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
import { Upload, Tag, Image } from 'antd';

const ImageAttachment: React.FC<{
  file: any;
}> = ({ file }) => {
  const [visible, setVisible] = React.useState(false);
  const { removeAttachment } = useChatMessages();

  return (
    <Tag
      closable
      onClose={() => removeAttachment(Number(file.uid))}
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
        {file.name}
      </div>
    </Tag>
  );
};

const Attachment: React.FC<{
  file: any;
}> = ({ file }) => {
  return <ImageAttachment file={file} />;
};

export const AttachmentsHeader: React.FC = () => {
  const uploadProps = useUploadFiles();
  const { attachments } = useChatMessages();
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
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: '4px 0px',
        marginTop: '4px',
      }}
    >
      {items?.map((item, index) => <Attachment file={item} key={index} />)}
    </div>
  );
};
