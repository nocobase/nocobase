/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Tag } from 'antd';
import { BuildOutlined } from '@ant-design/icons';

export type AttachmentType = 'image' | 'uiSchema';
export type AttachmentProps = {
  type: AttachmentType;
  content: string;
};

export const Attachment: React.FC<
  AttachmentProps & {
    closeable?: boolean;
    onClose?: () => void;
  }
> = ({ type, content, closeable, onClose }) => {
  let prefix: React.ReactNode;
  switch (type) {
    case 'uiSchema':
      prefix = (
        <>
          <BuildOutlined /> UI Schema {'>'}{' '}
        </>
      );
      break;
  }
  return (
    <Tag closeIcon={closeable} onClose={onClose}>
      {prefix}
      {content}
    </Tag>
  );
};
