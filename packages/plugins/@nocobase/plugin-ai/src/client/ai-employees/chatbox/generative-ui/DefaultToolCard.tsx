/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useState } from 'react';
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
import { ToolCall, ToolsEntry, toToolsMap, useGlobalTheme, useToken } from '@nocobase/client';
import { Schema } from '@formily/react';
import _ from 'lodash';
import { useToolCallActions } from '../hooks/useToolCallActions';

const CallButton: React.FC<{
  messageId: string;
  tools: ToolsEntry[];
  toolCalls: ToolCall[];
}> = ({ messageId, tools, toolCalls }) => {
  const t = useT();
  const { getDecisionActions } = useToolCallActions({ messageId, tools });
  const [loading, setLoading] = useState(false);
  return (
    <Button
      loading={loading}
      onClick={async (e) => {
        e.stopPropagation();
        setLoading(true);
        for (const toolCall of toolCalls) {
          const decision = getDecisionActions(toolCall);
          await decision.approve();
        }
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

const InvokeStatus: React.FC<{ toolCall: ToolCall<unknown> }> = ({ toolCall }) => {
  const t = useT();
  const { invokeStatus } = toolCall;

  switch (invokeStatus) {
    case 'init':
    case 'interrupted':
    case 'waiting':
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
      return toolCall.status === 'error' ? (
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
  tools: ToolsEntry[];
  toolCalls: ToolCall[];
}> = ({ messageId, tools, toolCalls }) => {
  const toolsMap = toToolsMap(tools);
  const t = useT();
  const { token } = useToken();
  const { isDarkTheme } = useGlobalTheme();

  const items = toolCalls.map((toolCall) => {
    let args = toolCall.args;
    try {
      args = JSON.stringify(args, null, 2);
    } catch (err) {
      // ignore
    }
    const toolsEntry = toolsMap.get(toolCall.name);
    const title = toolsEntry?.introduction?.title
      ? Schema.compile(toolsEntry?.introduction?.title, { t })
      : toolCall.name;
    const description = toolsEntry?.introduction?.about
      ? Schema.compile(toolsEntry?.introduction?.about, { t })
      : toolCall.name;

    return {
      key: toolCall.id,
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
              {title}{' '}
              {toolsEntry?.introduction?.about && (
                <Tooltip title={description}>
                  <QuestionCircleOutlined />
                </Tooltip>
              )}
            </Tag>
            <InvokeStatus toolCall={toolCall} />
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
    !toolCalls.every((tool) => tool.auto) &&
    !toolCalls.every((tool) => tool.invokeStatus === 'done' || tool.invokeStatus === 'confirmed');

  return (
    <Card
      variant="borderless"
      size="small"
      title={
        <span>
          <ToolOutlined /> {t('Use skills')}
        </span>
      }
      extra={showCallButton && <CallButton messageId={messageId} tools={tools} toolCalls={toolCalls} />}
    >
      <Collapse items={items} size="small" bordered={false} />
    </Card>
  );
};
