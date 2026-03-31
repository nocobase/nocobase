/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Button, Tooltip, Flex } from 'antd';
import { useT } from '../../../locale';
import {
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  MinusCircleFilled,
  QuestionCircleOutlined,
  CheckOutlined,
  RightOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { ToolCall, ToolsEntry, toToolsMap, useToken, lazy } from '@nocobase/client';
import { Schema } from '@formily/react';
import { useToolCallActions } from '../hooks/useToolCallActions';
import { useChatMessagesStore } from '../stores/chat-messages';
import { css, keyframes } from '@emotion/css';

const { CodeHighlight } = lazy(() => import('../../common/CodeHighlight'), 'CodeHighlight');

const loadingTextShimmer = keyframes`
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: 0 0;
  }
`;

const CallButton: React.FC<{
  messageId: string;
  toolCalls: ToolCall[];
}> = ({ messageId, toolCalls }) => {
  const t = useT();
  const { token } = useToken();
  const { getDecisionActions } = useToolCallActions({ messageId });
  const [loading, setLoading] = useState(false);
  return (
    <Flex align="center" gap={8}>
      <Button
        loading={loading}
        onClick={async (e) => {
          e.stopPropagation();
          setLoading(true);
          for (const toolCall of toolCalls) {
            const decision = getDecisionActions(toolCall);
            await decision.approve();
          }
          setLoading(false);
        }}
        variant="text"
        color="primary"
        size="small"
        icon={<CheckOutlined />}
        style={{
          height: token.controlHeightSM,
          paddingInline: token.paddingSM,
          fontSize: token.fontSizeSM + 1,
        }}
      >
        {t('Allow use')}
      </Button>
    </Flex>
  );
};

const InvokeStatus: React.FC<{ toolCall: ToolCall<unknown> }> = ({ toolCall }) => {
  const t = useT();
  const { token } = useToken();
  const { invokeStatus } = toolCall;

  switch (invokeStatus) {
    case 'init':
    case 'interrupted':
    case 'waiting':
      return (
        <Tooltip title={t('invoke-status-init')}>
          <MinusCircleFilled style={{ color: token.colorTextQuaternary }} />
        </Tooltip>
      );
    case 'pending':
      return (
        <Tooltip title={t('invoke-status-pending')}>
          <ClockCircleFilled style={{ color: token.colorTextSecondary }} />
        </Tooltip>
      );
    case 'done':
    case 'confirmed':
      return toolCall.status === 'error' ? (
        <Tooltip title={t('invoke-status-error')}>
          <CloseCircleFilled style={{ color: token.colorError }} />
        </Tooltip>
      ) : (
        <Tooltip title={t('invoke-status-success')}>
          <CheckCircleFilled style={{ color: token.colorSuccess }} />
        </Tooltip>
      );
  }
};

const ToolCallRow: React.FC<{
  toolCall: ToolCall;
  toolsMap: Map<string, ToolsEntry>;
  generating: boolean;
  defaultExpanded?: boolean;
  rightExtra?: React.ReactNode;
}> = ({ toolCall, toolsMap, generating, defaultExpanded, rightExtra }) => {
  const t = useT();
  const { token } = useToken();
  const [expanded, setExpanded] = useState(!!defaultExpanded);
  useEffect(() => {
    if (defaultExpanded) {
      setExpanded(true);
    }
  }, [defaultExpanded]);

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

  const titleLoadingClass = css({
    backgroundImage: `linear-gradient(90deg, ${token.colorTextTertiary} 0%, ${token.colorText} 45%, ${token.colorTextTertiary} 100%)`,
    backgroundSize: '160% 100%',
    WebkitBackgroundClip: 'text',
    color: 'transparent',
    opacity: 0.98,
    animation: `${loadingTextShimmer} 1.6s linear infinite`,
    willChange: 'background-position',
  });

  const showLoadingTitle = generating && toolCall.invokeStatus !== 'done' && toolCall.invokeStatus !== 'confirmed';

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px 0 4px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => {
          if (args === '{}') {
            return;
          }
          setExpanded(!expanded);
        }}
      >
        <Flex align="center" gap={8}>
          <InvokeStatus toolCall={toolCall} />
          <span style={{ fontSize: token.fontSizeSM + 1, color: token.colorTextSecondary }}>
            <span className={showLoadingTitle ? titleLoadingClass : undefined}>{title}</span>
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
          {args !== '{}' ? (
            expanded ? (
              <UpOutlined style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary }} />
            ) : (
              <RightOutlined style={{ fontSize: token.fontSizeSM, color: token.colorTextTertiary }} />
            )
          ) : null}
          {rightExtra ? (
            <div
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              style={{ display: 'flex', alignItems: 'center' }}
            >
              {rightExtra}
            </div>
          ) : null}
        </Flex>
      </div>
      {expanded && (
        <div style={{ padding: '4px 12px', fontSize: token.fontSizeSM }}>
          <CodeHighlight language="json" value={args as string} />
        </div>
      )}
    </div>
  );
};

export const DefaultToolCard: React.FC<{
  messageId: string;
  tools: ToolsEntry[];
  toolCalls: ToolCall[];
  inlineActions?: React.ReactNode;
}> = ({ messageId, tools, toolCalls, inlineActions }) => {
  const toolsMap = toToolsMap(tools);
  const messages = useChatMessagesStore.use.messages();
  const responseLoading = useChatMessagesStore.use.responseLoading();
  const generating = responseLoading && messages[messages.length - 1]?.content?.messageId === messageId;
  const hasAutoExpanded = useRef(false);

  const showCallButton =
    messageId &&
    !toolCalls.every((tool) => tool.auto) &&
    !toolCalls.every((tool) => tool.invokeStatus === 'done' || tool.invokeStatus === 'confirmed' || !tool.invokeStatus);
  const shouldAutoExpand = showCallButton && !hasAutoExpanded.current;

  useEffect(() => {
    if (showCallButton) {
      hasAutoExpanded.current = true;
    }
  }, [showCallButton]);

  const singleInlineActions = inlineActions && toolCalls.length === 1 ? inlineActions : null;

  return (
    <Flex vertical>
      {toolCalls.map((toolCall) => (
        <ToolCallRow
          key={toolCall.id}
          toolCall={toolCall}
          toolsMap={toolsMap}
          generating={generating}
          defaultExpanded={shouldAutoExpand}
          rightExtra={singleInlineActions}
        />
      ))}
      {showCallButton && <CallButton messageId={messageId} toolCalls={toolCalls} />}
    </Flex>
  );
};
