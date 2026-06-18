/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React, { ComponentType, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Flex, theme, Tooltip } from 'antd';
import { css, keyframes } from '@emotion/css';
import {
  CheckCircleFilled,
  CheckOutlined,
  ClockCircleFilled,
  CloseCircleFilled,
  MinusCircleFilled,
  QuestionCircleOutlined,
  RightOutlined,
  UpOutlined,
} from '@ant-design/icons';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { dark, defaultStyle } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { ToolsEntry, ToolsUIProperties, toToolsMap, useGlobalTheme } from '@nocobase/client-v2';
import { observer } from '@nocobase/flow-engine';
import { jsonrepair } from 'jsonrepair';
import { useT } from '../../../locale';
import { useAIConfigRepository } from '../../../repositories/hooks/useAIConfigRepository';
import type { ToolCall } from '../../types';
import { useChat } from '../hooks/useChat';
import { useToolCallActions } from '../hooks/useToolCallActions';
import { useChatBoxStore } from '../stores/chat-box';
import { useChatConversationsStore } from '../stores/chat-conversations';

type ToolCardProps = {
  messageId?: string;
  toolCalls?: ToolCall[] | null;
  inlineActions?: React.ReactNode;
};

const loadingShimmerKeyframes = `
${keyframes`
  from {
    background-position: 200% 0;
  }
  to {
    background-position: 0 0;
  }
`}
`;

export const ToolCard: React.FC<ToolCardProps> = observer(({ toolCalls, messageId = '', inlineActions }) => {
  const repository = useAIConfigRepository();
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const toolItems = useMemo(() => (Array.isArray(toolCalls) ? toolCalls : []), [toolCalls]);
  const toolsMap = useMemo(() => toToolsMap(repository.aiTools), [repository.aiTools]);
  const { getDecisionActions } = useToolCallActions({ messageId });

  useEffect(() => {
    repository.getAITools(currentConversation).catch(console.error);
  }, [currentConversation, repository]);

  useEffect(() => {
    if (!messageId || !toolItems.length) {
      return;
    }
    const approveAutoInterruptedToolCalls = async () => {
      for (const toolCall of toolItems) {
        if (toolCall.invokeStatus === 'interrupted' && toolCall.auto === true) {
          const decision = getDecisionActions(toolCall);
          await decision.approve();
        }
      }
    };
    approveAutoInterruptedToolCalls();
  }, [getDecisionActions, messageId, toolItems]);

  if (!toolItems.length || repository.aiToolsLoading) {
    return null;
  }

  const toolsWithUI: ({ C: ComponentType<ToolsUIProperties> } & ToolsUIProperties)[] = [];
  const toolsWithoutUI: ToolCall[] = [];

  for (const item of toolItems) {
    const toolCall = normalizeToolCall(item);
    const toolEntry = toolsMap.get(toolCall.name);
    const C = toolEntry?.ui?.card;
    if (C && toolEntry) {
      toolsWithUI.push({
        C,
        messageId,
        tools: toolEntry,
        toolCall,
        decisions: getDecisionActions(toolCall),
      });
    } else {
      toolsWithoutUI.push(toolCall);
    }
  }

  return (
    <>
      {toolsWithoutUI.length ? (
        <DefaultToolCard
          messageId={messageId}
          tools={repository.aiTools}
          toolCalls={toolsWithoutUI}
          inlineActions={toolsWithoutUI.length === 1 && !toolsWithUI.length ? inlineActions : null}
        />
      ) : null}
      {toolsWithUI.map(({ C, messageId, tools, toolCall, decisions }) => (
        <C key={toolCall.id} messageId={messageId} tools={tools} toolCall={toolCall} decisions={decisions} />
      ))}
    </>
  );
});

ToolCard.displayName = 'ToolCard';

const CallButton: React.FC<{
  messageId: string;
  toolCalls: ToolCall[];
}> = ({ messageId, toolCalls }) => {
  const t = useT();
  const { token } = theme.useToken();
  const { getDecisionActions } = useToolCallActions({ messageId });
  const [loading, setLoading] = useState(false);
  const readonly = useChatBoxStore.use.readonly();

  return (
    <Flex align="center" gap={token.marginXS}>
      <Button
        loading={loading}
        disabled={readonly}
        onClick={async (event) => {
          event.stopPropagation();
          setLoading(true);
          try {
            for (const toolCall of toolCalls) {
              const decision = getDecisionActions(toolCall);
              await decision.approve();
            }
          } finally {
            setLoading(false);
          }
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

const InvokeStatus: React.FC<{ toolCall: ToolCall }> = ({ toolCall }) => {
  const t = useT();
  const { token } = theme.useToken();

  switch (toolCall.invokeStatus) {
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
    default:
      return null;
  }
};

const ToolCallRow: React.FC<{
  toolCall: ToolCall;
  toolsMap: Map<string, ToolsEntry>;
  generating: boolean;
  defaultExpanded?: boolean;
  rightExtra?: React.ReactNode;
}> = React.memo(({ toolCall, toolsMap, generating, defaultExpanded, rightExtra }) => {
  const t = useT();
  const { token } = theme.useToken();
  const [expanded, setExpanded] = useState(!!defaultExpanded);

  useEffect(() => {
    if (defaultExpanded) {
      setExpanded(true);
    }
  }, [defaultExpanded]);

  const args = stringifyToolArgs(toolCall.args);
  const toolsEntry = toolsMap.get(toolCall.name);
  const title = toolsEntry?.introduction?.title ? t(toolsEntry.introduction.title) : toolCall.name;
  const description = toolsEntry?.introduction?.about ? t(toolsEntry.introduction.about) : toolCall.name;
  const showLoadingTitle = generating && toolCall.invokeStatus !== 'done' && toolCall.invokeStatus !== 'confirmed';
  const showArgs = args !== '{}';
  const loadingTitleClassName = css`
    background-image: linear-gradient(
      90deg,
      ${token.colorTextTertiary} 0%,
      ${token.colorText} 45%,
      ${token.colorTextTertiary} 100%
    );
    background-size: 160% 100%;
    -webkit-background-clip: text;
    color: transparent;
    opacity: 0.98;
    animation: ${loadingShimmerKeyframes} 1.6s linear infinite;
    will-change: background-position;
  `;

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${token.paddingXXS}px ${token.paddingSM}px 0 ${token.paddingXXS}px`,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => {
          if (showArgs) {
            setExpanded(!expanded);
          }
        }}
      >
        <Flex align="center" gap={token.marginXS}>
          <InvokeStatus toolCall={toolCall} />
          <span style={{ fontSize: token.fontSizeSM + 1, color: token.colorTextSecondary }}>
            <span className={showLoadingTitle ? loadingTitleClassName : undefined}>{title}</span>
            {toolsEntry?.introduction?.about ? (
              <>
                {' '}
                <Tooltip title={description}>
                  <QuestionCircleOutlined style={{ color: token.colorTextQuaternary }} />
                </Tooltip>
              </>
            ) : null}
          </span>
        </Flex>
        <Flex align="center" gap={token.marginXS}>
          {showArgs ? (
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
      {expanded ? (
        <div style={{ padding: `${token.paddingXXS}px ${token.paddingSM}px`, fontSize: token.fontSizeSM }}>
          <CodeHighlight language="json" value={args} />
        </div>
      ) : null}
    </div>
  );
});

ToolCallRow.displayName = 'ToolCallRow';

const DefaultToolCard: React.FC<{
  messageId: string;
  tools: ToolsEntry[];
  toolCalls: ToolCall[];
  inlineActions?: React.ReactNode;
}> = ({ messageId, tools, toolCalls, inlineActions }) => {
  const toolsMap = useMemo(() => toToolsMap(tools), [tools]);
  const currentConversation = useChatConversationsStore.use.currentConversation();
  const chat = useChat(currentConversation);
  const messages = chat.use.messages();
  const responseLoading = chat.use.responseLoading();
  const generating = responseLoading && messages[messages.length - 1]?.content?.messageId === messageId;
  const hasAutoExpanded = useRef(false);

  const showCallButton =
    !!messageId &&
    !toolCalls.every((tool) => tool.auto) &&
    !toolCalls.every((tool) => tool.invokeStatus === 'done' || tool.invokeStatus === 'confirmed' || !tool.invokeStatus);
  const shouldAutoExpand = showCallButton && !hasAutoExpanded.current;
  const singleInlineActions = inlineActions && toolCalls.length === 1 ? inlineActions : null;

  useEffect(() => {
    if (showCallButton) {
      hasAutoExpanded.current = true;
    }
  }, [showCallButton]);

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
      {showCallButton ? <CallButton messageId={messageId} toolCalls={toolCalls} /> : null}
    </Flex>
  );
};

const CodeHighlight: React.FC<{ language: string; value: string }> = ({ language, value }) => {
  const { isDarkTheme } = useGlobalTheme();

  return (
    <SyntaxHighlighter PreTag="div" language={language} style={isDarkTheme ? dark : defaultStyle}>
      {value}
    </SyntaxHighlighter>
  );
};

function normalizeToolCall(toolCall: ToolCall): ToolCall {
  if (typeof toolCall.args !== 'string') {
    return toolCall;
  }

  const trimmed = toolCall.args.trim();
  if (!trimmed) {
    return {
      ...toolCall,
      args: {},
    };
  }

  try {
    const repaired = jsonrepair(trimmed);
    return {
      ...toolCall,
      args: JSON.parse(repaired) as unknown,
    };
  } catch (error) {
    console.error(error, toolCall.args);
    return toolCall;
  }
}

function stringifyToolArgs(args: unknown) {
  try {
    const stringifiedArgs = JSON.stringify(args, null, 2);
    return stringifiedArgs ?? '{}';
  } catch (error) {
    return typeof args === 'string' ? args : '{}';
  }
}
