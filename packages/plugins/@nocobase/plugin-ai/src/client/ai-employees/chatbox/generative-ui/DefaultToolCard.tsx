/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Button, Card, Collapse, Tooltip, Tag, Flex } from 'antd';
import { useT } from '../../../locale';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  CaretRightOutlined,
  QuestionCircleOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { default as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark, defaultStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useAPIClient, useGlobalTheme, usePlugin, useRequest, useToken } from '@nocobase/client';
import { Schema } from '@formily/react';
import PluginAIClient from '../../..';
import { useAISelectionContext } from '../../selector/AISelectorProvider';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';
import { useChatMessageActions } from '../hooks/useChatMessageActions';
import _ from 'lodash';
import { ToolCall } from '../../types';

const useDefaultAction = (messageId: string) => {
  const currentEmployee = useChatBoxStore.use.currentEmployee();

  const currentConversation = useChatConversationsStore.use.currentConversation();

  const { callTool } = useChatMessageActions();

  return {
    invoke: () => {
      callTool({
        sessionId: currentConversation,
        messageId,
        aiEmployee: currentEmployee,
      });
    },
  };
};

const CallButton: React.FC<{
  messageId: string;
}> = ({ messageId }) => {
  const t = useT();
  const { invoke: invokeDefault } = useDefaultAction(messageId);
  const invoke = async () => {
    invokeDefault();
  };

  return (
    <Button
      onClick={(e) => {
        e.stopPropagation();
        invoke();
      }}
      variant="link"
      color="primary"
      size="small"
      icon={<CaretRightOutlined />}
    >
      {t('Call')}
    </Button>
  );
};

const InvokeStatus: React.FC<{ tool: ToolCall<unknown> }> = ({ tool }) => {
  const t = useT();
  switch (tool.invokeStatus) {
    case 'init':
      return (
        <Tooltip title={t('invoke-status-init')}>
          <CaretRightOutlined />
        </Tooltip>
      );
    case 'pending':
      return (
        <Tooltip title={t('invoke-status-pending')}>
          <ClockCircleOutlined />
        </Tooltip>
      );
    case 'done':
    case 'confirmed':
      return tool.status === 'error' ? (
        <Tooltip title={t('invoke-status-error')}>
          <CloseCircleOutlined />
        </Tooltip>
      ) : (
        <Tooltip title={t('invoke-status-success')}>
          <CheckCircleOutlined />
        </Tooltip>
      );
  }
};

export const DefaultToolCard: React.FC<{
  messageId: string;
  tools: ToolCall<unknown>[];
}> = ({ tools, messageId }) => {
  const t = useT();
  const { token } = useToken();
  const { isDarkTheme } = useGlobalTheme();
  const api = useAPIClient();

  const currentConversation = useChatConversationsStore((s) => s.currentConversation);

  const { data } = useRequest<{
    [name: string]: {
      title: string;
      description: string;
    };
  }>(() =>
    api
      .resource('aiConversations')
      .getTools({
        values: {
          sessionId: currentConversation,
          messageId,
        },
      })
      .then((res) => res?.data?.data),
  );

  const items = tools.map((tool) => ({
    key: tool.id,
    label: (
      <div
        style={{
          fontSize: token.fontSize,
        }}
      >
        <Flex justify="space-between">
          <Tag
            style={{
              marginLeft: 8,
            }}
          >
            {data?.[tool.name]?.title ? Schema.compile(data[tool.name].title, { t }) : tool.name}{' '}
            {data?.[tool.name]?.description && (
              <Tooltip title={Schema.compile(data[tool.name].description, { t })}>
                <QuestionCircleOutlined />
              </Tooltip>
            )}
          </Tag>
          <InvokeStatus tool={tool} />
        </Flex>
      </div>
    ),
    children: (
      <ReactMarkdown
        components={{
          code(props) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <SyntaxHighlighter {...rest} PreTag="div" language={match[1]} style={isDarkTheme ? dark : defaultStyle}>
                {String(children).replace(/\n$/, '')}
              </SyntaxHighlighter>
            ) : (
              <code {...rest} className={className}>
                {children}
              </code>
            );
          },
        }}
      >
        {'```json\n' + JSON.stringify(tool.args, null, 2) + '\n```'}
      </ReactMarkdown>
    ),
    style: {
      fontSize: token.fontSizeSM,
    },
  }));

  const showCallButton =
    !tools.every((tool) => tool.auto) &&
    !tools.every((tool) => tool.invokeStatus === 'done' || tool.invokeStatus === 'confirmed');

  return (
    <Card
      title={
        <span>
          <ToolOutlined /> {t('Use skill')}
        </span>
      }
      extra={showCallButton && <CallButton messageId={messageId} />}
    >
      <Collapse items={items} size="small" bordered={false} />
    </Card>
  );
};
