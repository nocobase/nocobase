/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useState } from 'react';
import { Button, Tooltip, Flex } from 'antd';
import { useT } from '../../../locale';
import {
  CheckCircleTwoTone,
  ClockCircleTwoTone,
  CloseCircleTwoTone,
  PlayCircleTwoTone,
  QuestionCircleOutlined,
  PlaySquareOutlined,
  ToolOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';
import { default as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dark, defaultStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { ToolCall, ToolsEntry, toToolsMap, useGlobalTheme, useToken } from '@nocobase/client';
import { Schema } from '@formily/react';
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

const ToolCallRow: React.FC<{
  toolCall: ToolCall;
  toolsMap: Map<string, ToolsEntry>;
  isDarkTheme: boolean;
}> = ({ toolCall, toolsMap, isDarkTheme }) => {
  const t = useT();
  const { token } = useToken();
  const [expanded, setExpanded] = useState(false);

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

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          borderRadius: token.borderRadiusSM,
          background: token.colorFillTertiary,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Flex align="center" gap={8}>
          <ToolOutlined style={{ color: token.colorTextSecondary }} />
          <span style={{ fontSize: token.fontSizeSM, color: token.colorTextSecondary }}>{t('Use skills')}</span>
          <span style={{ fontSize: token.fontSizeSM, color: token.colorText }}>
            {title}
            {toolsEntry?.introduction?.about && (
              <>
                {' '}
                <Tooltip title={description}>
                  <QuestionCircleOutlined style={{ color: token.colorTextQuaternary }} />
                </Tooltip>
              </>
            )}
          </span>
        </Flex>
        <Flex align="center" gap={8}>
          {expanded ? (
            <UpOutlined style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary }} />
          ) : (
            <DownOutlined style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary }} />
          )}
          <InvokeStatus toolCall={toolCall} />
        </Flex>
      </div>
      {expanded && (
        <div style={{ padding: '4px 12px', fontSize: token.fontSizeSM }}>
          <ReactMarkdown
            components={{
              code(props) {
                const { children, className, node, ...rest } = props;
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <SyntaxHighlighter
                    {...rest}
                    PreTag="div"
                    language={match[1]}
                    style={isDarkTheme ? dark : defaultStyle}
                  >
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
        </div>
      )}
    </div>
  );
};

export const DefaultToolCard: React.FC<{
  messageId: string;
  tools: ToolsEntry[];
  toolCalls: ToolCall[];
}> = ({ messageId, tools, toolCalls }) => {
  const toolsMap = toToolsMap(tools);
  const { isDarkTheme } = useGlobalTheme();

  const showCallButton =
    messageId &&
    !toolCalls.every((tool) => tool.auto) &&
    !toolCalls.every((tool) => tool.invokeStatus === 'done' || tool.invokeStatus === 'confirmed');

  return (
    <Flex vertical gap={8}>
      {toolCalls.map((toolCall) => (
        <ToolCallRow key={toolCall.id} toolCall={toolCall} toolsMap={toolsMap} isDarkTheme={isDarkTheme} />
      ))}
      {showCallButton && <CallButton messageId={messageId} tools={tools} toolCalls={toolCalls} />}
    </Flex>
  );
};
