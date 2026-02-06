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
  CheckCircleFilled,
  ClockCircleFilled,
  CloseCircleFilled,
  MinusCircleFilled,
  QuestionCircleOutlined,
  CheckOutlined,
  ToolOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { ToolCall, ToolsEntry, toToolsMap, useToken, lazy } from '@nocobase/client';
import { Schema } from '@formily/react';
import { useToolCallActions } from '../hooks/useToolCallActions';

const { CodeHighlight } = lazy(() => import('../../common/CodeHighlight'), 'CodeHighlight');

const CallButton: React.FC<{
  messageId: string;
  tools: ToolsEntry[];
  toolCalls: ToolCall[];
}> = ({ messageId, tools, toolCalls }) => {
  const t = useT();
  const { token } = useToken();
  const { getDecisionActions } = useToolCallActions({ messageId, tools });
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
}> = ({ toolCall, toolsMap }) => {
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
          <span style={{ fontSize: token.fontSizeSM + 1, color: token.colorTextSecondary }}>{t('Use skills')}</span>
          <span style={{ fontSize: token.fontSizeSM + 1, color: token.colorText }}>
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
}> = ({ messageId, tools, toolCalls }) => {
  const toolsMap = toToolsMap(tools);

  const showCallButton =
    messageId &&
    !toolCalls.every((tool) => tool.auto) &&
    !toolCalls.every((tool) => tool.invokeStatus === 'done' || tool.invokeStatus === 'confirmed');

  return (
    <Flex vertical gap={8}>
      {toolCalls.map((toolCall) => (
        <ToolCallRow key={toolCall.id} toolCall={toolCall} toolsMap={toolsMap} />
      ))}
      {showCallButton && <CallButton messageId={messageId} tools={tools} toolCalls={toolCalls} />}
    </Flex>
  );
};
