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
import { useChatBoxStore } from '../stores/chat-box';
import { isEngineer, isSupportLanguage } from '../../built-in/utils';
import { Code as AICoding } from '../../ai-coding/markdown/Code';

export const CodeInternal: React.FC = (props: any) => {
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

  const { isDarkTheme } = useGlobalTheme();

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
      <SyntaxHighlighter {...rest} PreTag="div" language={language} style={isDarkTheme ? dark : defaultStyle}>
        {value}
      </SyntaxHighlighter>
    </Card>
  ) : (
    <Typography.Text code {...rest} className={className}>
      {children}
    </Typography.Text>
  );
};

export const Code = (props: any) => {
  const { className } = props;
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const currentEmployee = useChatBoxStore.use.currentEmployee();
  return isEngineer(currentEmployee) && isSupportLanguage(language) ? (
    <AICoding {...props} />
  ) : (
    <CodeInternal {...props} />
  );
};
