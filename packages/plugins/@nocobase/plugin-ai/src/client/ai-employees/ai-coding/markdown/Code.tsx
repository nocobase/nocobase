/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Card, Typography, Button, App, Space, Tooltip, Divider } from 'antd';
import { CloseOutlined, CodeOutlined, CopyOutlined, ExpandOutlined } from '@ant-design/icons';
import { lazy } from '@nocobase/client';
import { FlowModelContext, useFlowContext, useFlowViewContext } from '@nocobase/flow-engine';
import { useChatMessagesStore } from '../../chatbox/stores/chat-messages';
import { useT } from '../../../locale';

const { CodeHighlight } = lazy(() => import('../../common/CodeHighlight'), 'CodeHighlight');

export const CodeInternal: React.FC<{
  language: string;
  value: string;
  height?: string;
  scrollToBottom?: boolean;
}> = ({ language, value, height, scrollToBottom, ...rest }) => (
  <CodeHighlight {...rest} language={language} value={value} height={height} scrollToBottom={scrollToBottom} />
);

export const Code = (props: any) => {
  const ctx = useFlowContext<FlowModelContext>();
  const t = useT();
  const { children, className, node, message, ...rest } = props;
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  const value = String(children)
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\n$/, '');
  const { message: antdMessage } = App.useApp();
  const copy = () => {
    navigator.clipboard.writeText(value);
    antdMessage.success(t('Copied'));
  };

  let isFullText = true;
  if (message?.type === 'text') {
    const pattern = new RegExp('```' + language + '[\\s\\S]*?```', 's');
    isFullText = pattern.test(message.content);
  }

  const editorRefMap = useChatMessagesStore.use.editorRef();
  const currentEditorRefUid = useChatMessagesStore.use.currentEditorRefUid();
  const editorRef = editorRefMap[currentEditorRefUid];

  return match ? (
    <Card
      type="inner"
      size="small"
      title={
        <Space style={{ margin: '0 8px' }} size="middle">
          <CodeOutlined />
          <span>{language}</span>
        </Space>
      }
      extra={
        <>
          <Tooltip title={t('Copy')}>
            <Button type="text" icon={<CopyOutlined />} onClick={copy} />
          </Tooltip>
          <Divider type="vertical" />
          <Tooltip title={t('Expand')}>
            <Button
              type="text"
              icon={<ExpandOutlined />}
              onClick={() => {
                ctx.viewer.dialog({
                  width: '80%',
                  zIndex: 6000,
                  content: <CodeViewExpanded {...rest} language={language} value={value} height={'75vh'} />,
                });
              }}
            />
          </Tooltip>
        </>
      }
      styles={{ header: { padding: 0 }, body: { padding: 0 } }}
      actions={
        editorRef
          ? [
              <Button
                key="accept"
                type="link"
                onClick={(e) => {
                  e.stopPropagation();
                  editorRef?.write(value);
                  ctx.message.info(t('Applied'));
                }}
                disabled={!isFullText}
              >
                {t('Apply to editor')}
              </Button>,
            ]
          : []
      }
    >
      <CodeInternal {...rest} language={language} value={value} scrollToBottom={!isFullText} />
    </Card>
  ) : (
    <Typography.Text code {...rest} className={className}>
      {children}
    </Typography.Text>
  );
};

const CodeViewExpanded: React.FC<{ language: string; value: string }> = ({ language, value, ...rest }) => {
  const ctx = useFlowViewContext<FlowModelContext>();
  const { Header } = ctx.view;

  const closeBtn = (
    <Button
      type="text"
      icon={<CloseOutlined />}
      onClick={() => {
        ctx.view.close();
      }}
    ></Button>
  );

  return (
    <div style={{ borderRadius: 8 }}>
      <Header
        title={
          <>
            <Space>
              {closeBtn}
              <span>{language}</span>
            </Space>
          </>
        }
      />
      <CodeInternal {...rest} language={language} value={value} />
    </div>
  );
};
