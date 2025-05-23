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
import { useChatBoxContext } from './ChatBoxContext';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { useT } from '../../locale';
import { useUploadFiles } from './useUploadFiles';
import { useChatMessages } from './ChatMessagesProvider';

export const Upload: React.FC = () => {
  const t = useT();
  const uploadProps = useUploadFiles();
  const chatBoxRef = useChatBoxContext('chatBoxRef');
  const currentEmployee = useChatBoxContext('currentEmployee');
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

  if (!currentEmployee) {
    return <Button type="text" icon={<UploadOutlined />} disabled={true} />;
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
        icon: <UploadOutlined />,
        title: 'Drag & Drop files here',
      }}
      items={items}
      {...uploadProps}
    >
      <Tooltip title={t('Upload files')} arrow={false}>
        <Button type="text" icon={<UploadOutlined />} />
      </Tooltip>
    </Attachments>
  );
};
