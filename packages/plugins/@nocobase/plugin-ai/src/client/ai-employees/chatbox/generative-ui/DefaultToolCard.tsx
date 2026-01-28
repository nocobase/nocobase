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
  CheckCircleTwoTone,
  ClockCircleTwoTone,
  CloseCircleTwoTone,
  PlayCircleTwoTone,
  QuestionCircleOutlined,
  PlaySquareOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { default as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark, defaultStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { useAPIClient, useApp, useGlobalTheme, usePlugin, useRequest, useToken } from '@nocobase/client';
import { Schema } from '@formily/react';
import PluginAIClient from '../../..';
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
    invoke: (toolCallIds?: string[], toolCallResults?: { id: string; [key: string]: any }[]) => {
      callTool({
        sessionId: currentConversation,
        messageId,
        aiEmployee: currentEmployee,
        toolCallIds,
        toolCallResults,
      });
    },
  };
};

const CallButton: React.FC<{
  messageId: string;
  tools: ToolCall<unknown>[];
}> = ({ messageId, tools }) => {
  const t = useT();
  const { invoke: invokeDefault } = useDefaultAction(messageId);
  const plugin = usePlugin('ai') as PluginAIClient;
  const employeeTools = plugin.aiManager.useTools();
  const app = useApp();

  const invoke = async () => {
    if (tools?.length) {
      const toolCallIds: string[] = [];
      const toolCallResults = [];
      for (const tool of tools) {
        toolCallIds.push(tool.id);
        const t = employeeTools.get(tool.name);
        if (t && t.invoke) {
          const result = await t.invoke(app, tool.args);
          if (result) {
            toolCallResults.push({
              id: tool.id,
              result,
            });
          }
        }
      }
      invokeDefault(toolCallIds, toolCallResults);
    } else {
      invokeDefault();
    }
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
      icon={<PlaySquareOutlined />}
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
          <PlayCircleTwoTone />
        </Tooltip>
      );
    case 'pending':
      return (
        <Tooltip title={t('invoke-status-pending')}>
          <ClockCircleTwoTone />
        </Tooltip>
      );
    case 'done':
    case 'confirmed':
      return tool.status === 'error' ? (
        <Tooltip title={t('invoke-status-error')}>
          <CloseCircleTwoTone twoToneColor="#eb2f96" />
        </Tooltip>
      ) : (
        <Tooltip title={t('invoke-status-success')}>
          <CheckCircleTwoTone twoToneColor="#52c41a" />
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
  }>(
    () =>
      api
        .resource('aiConversations')
        .getTools({
          values: {
            sessionId: currentConversation,
            messageId,
          },
        })
        .then((res) => res?.data?.data),
    {
      ready: !!messageId,
    },
  );

  const items = tools.map((tool) => {
    let args = tool.args;
    try {
      args = JSON.stringify(args, null, 2);
    } catch (err) {
      // ignore
    }
    return {
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
          {'```json\n' + args + '\n```'}
        </ReactMarkdown>
      ),
      style: {
        fontSize: token.fontSizeSM,
      },
    };
  });

  const showCallButton =
    messageId &&
    !tools.every((tool) => tool.auto) &&
    !tools.every((tool) => tool.invokeStatus === 'done' || tool.invokeStatus === 'confirmed');

  return (
    <Card
      variant="borderless"
      size="small"
      title={
        <span>
          <ToolOutlined /> {t('Use skills')}
        </span>
      }
      extra={showCallButton && <CallButton messageId={messageId} tools={tools} />}
    >
      <Collapse items={items} size="small" bordered={false} />
    </Card>
  );
};
