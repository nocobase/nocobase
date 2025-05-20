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
import { dark, defaultStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Card, App, Button, Typography } from 'antd';
import { useT } from '../../locale';
import { CopyOutlined } from '@ant-design/icons';
import { useGlobalTheme, useToken } from '@nocobase/client';
import ReactECharts from 'echarts-for-react';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';

type Props = {
  markdown: string;
};

const Code = (props: any) => {
  const { children, className, node, ...rest } = props;
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';
  const { token } = useToken();
  const { isDarkTheme } = useGlobalTheme();
  const t = useT();
  const content = String(children).replace(/\n$/, '');
  const { message } = App.useApp();
  const copy = () => {
    navigator.clipboard.writeText(content);
    message.success(t('Copied'));
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
      <SyntaxHighlighter {...rest} PreTag="div" language={language} style={isDarkTheme ? dark : defaultStyle}>
        {String(children).replace(/\n$/, '')}
      </SyntaxHighlighter>
    </Card>
  ) : (
    <Typography.Text code {...rest} className={className}>
      {children}
    </Typography.Text>
  );
};

const Echarts = (props: any) => {
  const { children, className, ...rest } = props;
  const t = useT();
  const { token } = useToken();
  const { isDarkTheme } = useGlobalTheme();
  let option = {};
  try {
    const configStr = React.Children.toArray(children).join('');
    option = JSON.parse(configStr);
  } catch (err) {
    return (
      <Card
        size="small"
        title={t('ECharts')}
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
      >
        <SyntaxHighlighter {...rest} PreTag="div" language={'json'} style={isDarkTheme ? dark : defaultStyle}>
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      </Card>
    );
  }
  return <ReactECharts option={option} theme={!isDarkTheme ? 'light' : 'defaultDark'} />;
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
          // @ts-ignore
          echarts: Echarts,
        }}
        rehypePlugins={[
          rehypeRaw,
          [
            rehypeSanitize,
            {
              ...defaultSchema,
              tagNames: [...defaultSchema.tagNames, 'echarts'],
            },
          ],
        ]}
        remarkPlugins={[remarkGfm]}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};
