/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { memo } from 'react';
import { Button, Space } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { Bubble } from '@ant-design/x';
import { InfoFormMessage } from './InfoForm';

const MessageWrapper = React.forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
  }
>((props, ref) => {
  if (ref) {
    return <div ref={ref}>{props.children}</div>;
  }
  return props.children;
});

const AIMessageRenderer: React.FC<{
  msg: any;
}> = ({ msg }) => {
  switch (msg.type) {
    case 'greeting':
      return <Bubble content={msg.content} />;
    case 'text':
      return (
        <Bubble
          content={msg.content}
          footer={
            <Space>
              <Button color="default" variant="text" size="small" icon={<ReloadOutlined />} />
              <Button color="default" variant="text" size="small" icon={<CopyOutlined />} />
            </Space>
          }
        />
      );
    case 'info':
      return <Bubble content={<InfoFormMessage values={msg.content} />} />;
  }
};

export const AIMessage: React.FC<{
  msg: any;
}> = memo(({ msg }) => {
  return (
    <MessageWrapper ref={msg.ref}>
      <AIMessageRenderer msg={msg} />
    </MessageWrapper>
  );
});

export const UserMessage: React.FC<{
  msg: any;
}> = memo(({ msg }) => {
  return (
    <MessageWrapper ref={msg.ref}>
      <Bubble content={msg.content} />
    </MessageWrapper>
  );
});
