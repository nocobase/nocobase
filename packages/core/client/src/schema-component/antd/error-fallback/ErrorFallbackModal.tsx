/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Modal, Typography } from 'antd';
import React, { FC } from 'react';
import { FallbackProps } from 'react-error-boundary';
import { ErrorFallback } from './ErrorFallback';
const { Paragraph, Text } = Typography;

export const ErrorFallbackModal: FC<FallbackProps> = (props) => {
  const [open, setOpen] = React.useState(false);
  const defaultChildren = (
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
  );

  return (
    <>
      <div onMouseOver={() => setOpen(true)}>{props.children || defaultChildren}</div>
      <Modal zIndex={10000} open={open} footer={null} onCancel={() => setOpen(false)} width={'60%'}>
        <ErrorFallback {...props} />
      </Modal>
    </>
  );
};
