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
import { AttachmentProps } from '../types';

export const Attachment: React.FC<
  AttachmentProps & {
    closeable?: boolean;
    onClose?: () => void;
  }
> = ({ type, title, content, closeable, onClose }) => {
  let prefix: React.ReactNode;
  switch (type) {
    case 'uiSchema':
      prefix = (
        <>
          <BuildOutlined /> {title} {'>'}{' '}
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
