/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Button, Collapse, Empty, Space, Tag, Timeline, Typography } from 'antd';
import React, { useMemo } from 'react';

import {
  AgentTranscriptMessage,
  AgentTranscriptMessagePart,
  AgentTranscriptToolCall,
  AgentTranscriptToolKind,
  AgentTranscriptToolStatus,
  buildAgentTranscript,
} from '../../shared/agentTranscript';
import { JsonRecord, formatDateTime, redactPreviewText } from '../pages/AgentGatewayPageUtils';

type TFunction = (key: string, options?: Record<string, unknown>) => string;

const DEFAULT_VISIBLE_MESSAGE_COUNT = 80;
const VISIBLE_MESSAGE_COUNT_INCREMENT = 80;
const LONG_TEXT_PREVIEW_CHARS = 6000;

export interface AgentTimelineEventRecord {
  id: string;
  sequence?: number;
  eventType?: string;
  source?: string;
  providerEventId?: string | null;
  correlationId?: string | null;
  confidence?: number | null;
  contentText?: string | null;
  contentJson?: JsonRecord;
  createdAt?: string;
}

export interface LegacyRunEventRecord {
  id: string;
  source?: string;
  sequence?: number;
  level?: string;
  eventType?: string;
  message?: string | null;
  payloadJson?: JsonRecord;
  emittedAt?: string;
}

function getLegacyTimelineEvents(events: LegacyRunEventRecord[]): AgentTimelineEventRecord[] {
  return events.map((event) => ({
    id: event.id,
    source: event.source,
    sequence: event.sequence,
    eventType: event.eventType,
    contentText: event.message,
    contentJson: event.payloadJson,
    createdAt: event.emittedAt,
  }));
}

function getToolStatusColor(status: AgentTranscriptToolStatus) {
  if (status === 'failed') {
    return 'red';
  }
  if (status === 'succeeded') {
    return 'green';
  }
  if (status === 'running') {
    return 'blue';
  }
  return 'default';
}

function getTimelineColor(message: AgentTranscriptMessage) {
  if (message.toolCalls.some((toolCall) => toolCall.status === 'failed')) {
    return 'red';
  }
  if (message.role === 'user') {
    return 'blue';
  }
  if (message.toolCalls.some((toolCall) => toolCall.status === 'running')) {
    return 'blue';
  }
  return 'gray';
}

function getToolKindLabel(t: TFunction, kind: AgentTranscriptToolKind) {
  const labels: Record<AgentTranscriptToolKind, string> = {
    exec: t('Exec'),
    run: t('Run'),
    terminal: t('Terminal'),
    wait: t('Wait'),
    apply_patch: t('Patch'),
    tool: t('Tool'),
    unknown: t('Tool'),
  };
  return labels[kind];
}

function getToolCallTitle(t: TFunction, toolCall: AgentTranscriptToolCall) {
  return [getToolKindLabel(t, toolCall.kind), toolCall.command || toolCall.title].filter(Boolean).join(' · ');
}

function getMessageTitle(t: TFunction, message: AgentTranscriptMessage) {
  return message.role === 'user' ? t('You') : t('Agent');
}

function TextBlock({ t, text, maxHeight = 320 }: { t: TFunction; text: string; maxHeight?: number }) {
  const [expanded, setExpanded] = React.useState(false);
  if (!text) {
    return null;
  }
  const shouldTruncate = text.length > LONG_TEXT_PREVIEW_CHARS;
  const hiddenChars = Math.max(0, text.length - LONG_TEXT_PREVIEW_CHARS);
  const displayedText =
    shouldTruncate && !expanded
      ? `${text.slice(0, LONG_TEXT_PREVIEW_CHARS)}\n\n[... ${hiddenChars.toLocaleString()} ${t('chars hidden')}]`
      : text;
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Typography.Paragraph
        style={{
          background: '#fafafa',
          border: '1px solid #edf0f2',
          borderRadius: 6,
          margin: 0,
          maxHeight,
          overflow: 'auto',
          padding: '8px 10px',
          whiteSpace: 'pre-wrap',
        }}
      >
        {redactPreviewText(displayedText)}
      </Typography.Paragraph>
      {shouldTruncate ? (
        <Button
          type="link"
          size="small"
          style={{ alignSelf: 'flex-start', padding: 0 }}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? t('Collapse text') : t('Show full text')}
        </Button>
      ) : null}
    </Space>
  );
}

function ToolCallBody({ t, toolCall }: { t: TFunction; toolCall: AgentTranscriptToolCall }) {
  const output = toolCall.output && toolCall.output !== toolCall.command ? toolCall.output : '';
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Space wrap size={6}>
        <Tag color={getToolStatusColor(toolCall.status)}>{toolCall.status}</Tag>
        {toolCall.durationText ? <Tag>{toolCall.durationText}</Tag> : null}
        {typeof toolCall.exitCode === 'number' ? <Tag>exit {toolCall.exitCode}</Tag> : null}
        {toolCall.source ? <Tag>{toolCall.source}</Tag> : null}
      </Space>
      {toolCall.command ? (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('Command')}</Typography.Text>
          <TextBlock t={t} text={toolCall.command} maxHeight={120} />
        </Space>
      ) : null}
      {output ? (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('Output')}</Typography.Text>
          <TextBlock t={t} text={output} maxHeight={300} />
        </Space>
      ) : null}
      {!toolCall.command && !output ? (
        <Typography.Text type="secondary">{t('No parsed tool details')}</Typography.Text>
      ) : null}
    </Space>
  );
}

function isCollapsePanelActive(activeKey: string | string[] | undefined, key: string) {
  return Array.isArray(activeKey) ? activeKey.includes(key) : activeKey === key;
}

function ToolCallCollapse({ t, toolCall }: { t: TFunction; toolCall: AgentTranscriptToolCall }) {
  const [expanded, setExpanded] = React.useState(false);
  return (
    <Collapse
      size="small"
      activeKey={expanded ? [toolCall.id] : []}
      onChange={(activeKey) => {
        setExpanded(isCollapsePanelActive(activeKey as string | string[] | undefined, toolCall.id));
      }}
      items={[
        {
          key: toolCall.id,
          label: (
            <Space wrap size={6}>
              <Typography.Text strong>{getToolCallTitle(t, toolCall)}</Typography.Text>
              <Tag color={getToolStatusColor(toolCall.status)}>{toolCall.status}</Tag>
              {toolCall.durationText ? <Tag>{toolCall.durationText}</Tag> : null}
            </Space>
          ),
          children: expanded ? <ToolCallBody t={t} toolCall={toolCall} /> : null,
        },
      ]}
    />
  );
}

function ToolCallsTimeline({ t, toolCalls }: { t: TFunction; toolCalls: AgentTranscriptToolCall[] }) {
  return (
    <Timeline
      mode="left"
      items={toolCalls.map((toolCall) => ({
        key: toolCall.id,
        color: toolCall.status === 'failed' ? 'red' : toolCall.status === 'running' ? 'blue' : 'gray',
        children: <ToolCallCollapse t={t} toolCall={toolCall} />,
      }))}
    />
  );
}

function ToolCallsCollapse({ t, toolCalls }: { t: TFunction; toolCalls: AgentTranscriptToolCall[] }) {
  const [expanded, setExpanded] = React.useState(false);
  if (!toolCalls.length) {
    return null;
  }
  const failedCount = toolCalls.filter((toolCall) => toolCall.status === 'failed').length;
  return (
    <Collapse
      size="small"
      activeKey={expanded ? ['tool-calls'] : []}
      onChange={(activeKey) => {
        setExpanded(isCollapsePanelActive(activeKey as string | string[] | undefined, 'tool-calls'));
      }}
      items={[
        {
          key: 'tool-calls',
          label: (
            <Space wrap size={6}>
              <Typography.Text strong>{t('Tool calls')}</Typography.Text>
              <Tag>{toolCalls.length}</Tag>
              {failedCount ? (
                <Tag color="red">
                  {t('Failed')}: {failedCount}
                </Tag>
              ) : null}
            </Space>
          ),
          children: expanded ? <ToolCallsTimeline t={t} toolCalls={toolCalls} /> : null,
        },
      ]}
    />
  );
}

function MessagePart({ t, part }: { t: TFunction; part: AgentTranscriptMessagePart }) {
  if (part.type === 'tool-calls') {
    return <ToolCallsCollapse t={t} toolCalls={part.toolCalls} />;
  }
  return <TextBlock t={t} text={part.text} />;
}

function MessageContent({ t, message }: { t: TFunction; message: AgentTranscriptMessage }) {
  const parts = message.parts.length
    ? message.parts
    : ([
        {
          id: `${message.id}-text`,
          type: 'text',
          text: message.text,
        },
        message.toolCalls.length
          ? {
              id: `${message.id}-tool-calls`,
              type: 'tool-calls',
              toolCalls: message.toolCalls,
            }
          : null,
      ].filter(Boolean) as AgentTranscriptMessagePart[]);

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Space wrap size={6}>
        <Typography.Text strong>{getMessageTitle(t, message)}</Typography.Text>
        {message.sources.map((source) => (
          <Tag key={source}>{source}</Tag>
        ))}
        <Typography.Text type="secondary">{formatDateTime(message.createdAt)}</Typography.Text>
      </Space>
      {parts.map((part) => (
        <MessagePart key={part.id} t={t} part={part} />
      ))}
    </Space>
  );
}

export function AgentTimeline({
  t,
  events,
  legacyEvents,
  useLegacyFallback,
  warning,
  emptyDescription,
}: {
  t: TFunction;
  events: AgentTimelineEventRecord[];
  legacyEvents: LegacyRunEventRecord[];
  useLegacyFallback: boolean;
  warning?: string;
  emptyDescription?: React.ReactNode;
}) {
  const usingLegacyFallback = useLegacyFallback && !events.length && legacyEvents.length > 0;
  const transcriptEvents = usingLegacyFallback ? getLegacyTimelineEvents(legacyEvents) : events;
  const transcript = useMemo(() => buildAgentTranscript(transcriptEvents), [transcriptEvents]);
  const [visibleMessageCount, setVisibleMessageCount] = React.useState(DEFAULT_VISIBLE_MESSAGE_COUNT);
  const timelineResetKey = `${usingLegacyFallback ? 'legacy' : 'events'}:${transcriptEvents[0]?.id || 'empty'}`;
  React.useEffect(() => {
    setVisibleMessageCount(DEFAULT_VISIBLE_MESSAGE_COUNT);
  }, [timelineResetKey]);
  const hiddenMessageCount = Math.max(0, transcript.messages.length - visibleMessageCount);
  const visibleMessages = hiddenMessageCount ? transcript.messages.slice(hiddenMessageCount) : transcript.messages;
  const timelineItems = visibleMessages.map((message) => ({
    key: message.id,
    color: getTimelineColor(message),
    children: <MessageContent t={t} message={message} />,
  }));

  return (
    <section aria-label={t('Task conversation')}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Space direction="vertical" size={2}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {t('Task')}
          </Typography.Title>
          <Typography.Text type="secondary">
            {usingLegacyFallback
              ? t('Showing available conversation messages from legacy events')
              : t('Conversation between you and the agent')}
          </Typography.Text>
        </Space>
        {warning ? <Alert type="warning" showIcon message={warning} /> : null}
        {timelineItems.length ? (
          <>
            {hiddenMessageCount ? (
              <Button
                size="small"
                onClick={() => setVisibleMessageCount((count) => count + VISIBLE_MESSAGE_COUNT_INCREMENT)}
              >
                {t('Load earlier messages')} ({hiddenMessageCount})
              </Button>
            ) : null}
            <Timeline mode="left" items={timelineItems} />
          </>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={emptyDescription || t('No task messages yet')} />
        )}
      </Space>
    </section>
  );
}
