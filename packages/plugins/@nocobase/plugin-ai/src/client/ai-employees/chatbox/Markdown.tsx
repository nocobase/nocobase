/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import { css } from '@emotion/css';
import { default as SyntaxHighlighter } from 'react-syntax-highlighter';
import { Card, App, Button, Typography } from 'antd';
import { useT } from '../../locale';
import { CopyOutlined } from '@ant-design/icons';
import { useToken } from '@nocobase/client';

type Props = {
  markdown: string;
};

const Code = (props: any) => {
  const { children, className, node, ...rest } = props;
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const { token } = useToken();
  const t = useT();
  const content = String(children).replace(/\n$/, '');
  const { message } = App.useApp();
  const copy = () => {
    navigator.clipboard.writeText(content);
    message.success(t('Copied to clipboard'));
  };

  return match ? (
    <Card
      size="small"
      title={language}
      styles={{
        title: {
          fontSize: token.fontSize,
          fontWeight: 400,
        },
        body: {
          width: '100%',
          fontSize: token.fontSizeSM,
        },
      }}
      extra={
        <Button variant="link" color="default" size="small" onClick={copy} icon={<CopyOutlined />}>
          {t('Copy')}
        </Button>
      }
    >
      <SyntaxHighlighter {...rest} PreTag="div" language={language}>
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </Card>
  ) : (
    <Typography.Text code {...rest} className={className}>
      {children}
    </Typography.Text>
  );
};

export const Markdown: React.FC<Props> = ({ markdown }) => {
  return (
    <div
      className={css`
        margin-bottom: -1em;
      `}
    >
      <ReactMarkdown
        components={{
          code: Code,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};
