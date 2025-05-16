/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Attachments } from '@ant-design/x';
import { useChatBoxContext } from './ChatBoxContext';
import { UploadOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import { useT } from '../../locale';

export const Upload: React.FC = () => {
  const t = useT();
  const chatBoxRef = useChatBoxContext('chatBoxRef');
  const currentEmployee = useChatBoxContext('currentEmployee');
  if (!currentEmployee) {
    return <Button type="text" icon={<UploadOutlined />} disabled={true} />;
  }
  return (
    <Attachments
      beforeUpload={() => false}
      onChange={({ file }) => {}}
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
    >
      <Tooltip title={t('Upload attachments')} arrow={false}>
        <Button type="text" icon={<UploadOutlined />} />
      </Tooltip>
    </Attachments>
  );
};
