/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Card, Typography, Button, App } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { default as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark, defaultStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useGlobalTheme, useToken } from '@nocobase/client';
import { useT } from '../../../locale';

export const CodeInternal: React.FC<{
  language: string;
  value: string;
}> = ({ language, value, ...rest }) => {
  const { isDarkTheme } = useGlobalTheme();

  return (
    <SyntaxHighlighter {...rest} PreTag="div" language={language} style={isDarkTheme ? dark : defaultStyle}>
      {value}
    </SyntaxHighlighter>
  );
};

export const Code = (props: any) => {
  const { children, className, node, message, ...rest } = props;
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const { token } = useToken();
  const t = useT();
  const value = String(children).replace(/\n$/, '');
  const { message: antdMessage } = App.useApp();
  const copy = () => {
    navigator.clipboard.writeText(value);
    antdMessage.success(t('Copied'));
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
      extra={<Button variant="link" color="default" size="small" onClick={copy} icon={<CopyOutlined />} />}
    >
      <CodeInternal {...rest} language={language} value={value} />
    </Card>
  ) : (
    <Typography.Text code {...rest} className={className}>
      {children}
    </Typography.Text>
  );
};
