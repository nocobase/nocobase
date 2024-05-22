/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Typography } from 'antd';
import React, { FC } from 'react';
import { FallbackProps } from 'react-error-boundary';
import { StablePopover } from '../popover';
import { ErrorFallback } from './ErrorFallback';

const { Paragraph, Text } = Typography;

export const ErrorFallbackInline: FC<FallbackProps> = (props) => {
  const content = (
    <div style={{ maxHeight: '285px', overflowY: 'scroll' }}>
      <ErrorFallback {...props} />
    </div>
  );
  return (
    <StablePopover content={content} placement="bottomLeft">
      <Paragraph
        style={{
          display: 'flex',
          marginBottom: 0,
        }}
        copyable={{ text: props.error.message }}
      >
        <Text
          type="danger"
          style={{
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            display: 'inline-block',
            maxWidth: '200px',
          }}
        >
          Error: {props.error.message}
        </Text>
      </Paragraph>
    </StablePopover>
  );
};
