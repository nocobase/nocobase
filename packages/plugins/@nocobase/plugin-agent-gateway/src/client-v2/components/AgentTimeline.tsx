/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Empty, Space, Tag, Timeline, Typography } from 'antd';
import React from 'react';

import { JsonPreview, JsonRecord, formatDateTime, redactPreviewText } from '../pages/AgentGatewayPageUtils';

type TFunction = (key: string, options?: Record<string, unknown>) => string;

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

function getJsonString(value: JsonRecord | undefined, key: string) {
  const item = value?.[key];
  return typeof item === 'string' ? item : undefined;
}

function getJsonNumber(value: JsonRecord | undefined, key: string) {
  const item = value?.[key];
  return typeof item === 'number' && Number.isFinite(item) ? item : undefined;
}

function getTimelineColor(eventType: string | undefined, level?: string, contentJson?: JsonRecord) {
  const status = getJsonString(contentJson, 'status');
  const exitCode = getJsonNumber(contentJson, 'exitCode');
  if (
    level === 'error' ||
    status === 'failed' ||
    (typeof exitCode === 'number' && exitCode !== 0) ||
    eventType?.includes('failed')
  ) {
    return 'red';
  }
  if (eventType?.includes('completed')) {
    return 'green';
  }
  if (eventType?.includes('started')) {
    return 'blue';
  }
  return 'gray';
}

function TimelineContent({
  title,
  source,
  sequence,
  timestamp,
  contentText,
  contentJson,
  detailsLabel,
}: {
  title: string;
  source?: string;
  sequence?: number;
  timestamp?: string;
  contentText?: string | null;
  contentJson?: JsonRecord;
  detailsLabel: string;
}) {
  return (
    <Space direction="vertical" size={4} style={{ width: '100%' }}>
      <Space wrap size={6}>
        <Typography.Text strong>{title}</Typography.Text>
        {source ? <Tag>{source}</Tag> : null}
        {typeof sequence === 'number' ? <Tag>#{sequence}</Tag> : null}
        <Typography.Text type="secondary">{formatDateTime(timestamp)}</Typography.Text>
      </Space>
      {contentText ? (
        <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
          {redactPreviewText(contentText)}
        </Typography.Paragraph>
      ) : null}
      {contentJson && Object.keys(contentJson).length ? (
        <details>
          <summary>{detailsLabel}</summary>
          <JsonPreview value={contentJson} />
        </details>
      ) : null}
    </Space>
  );
}

export function AgentTimeline({
  t,
  events,
  legacyEvents,
  useLegacyFallback,
  warning,
}: {
  t: TFunction;
  events: AgentTimelineEventRecord[];
  legacyEvents: LegacyRunEventRecord[];
  useLegacyFallback: boolean;
  warning?: string;
}) {
  const usingLegacyFallback = useLegacyFallback && !events.length && legacyEvents.length > 0;
  const timelineItems = events.length
    ? events.map((event) => ({
        key: event.id,
        color: getTimelineColor(event.eventType, undefined, event.contentJson),
        children: (
          <TimelineContent
            title={event.eventType || t('Agent event')}
            source={event.source}
            sequence={event.sequence}
            timestamp={event.createdAt}
            contentText={event.contentText}
            contentJson={event.contentJson}
            detailsLabel={t('Details')}
          />
        ),
      }))
    : usingLegacyFallback
      ? legacyEvents.map((event) => ({
          key: event.id,
          color: getTimelineColor(event.eventType, event.level),
          children: (
            <TimelineContent
              title={event.eventType || t('Legacy event')}
              source={event.source}
              sequence={event.sequence}
              timestamp={event.emittedAt}
              contentText={event.message}
              contentJson={event.payloadJson}
              detailsLabel={t('Details')}
            />
          ),
        }))
      : [];

  return (
    <section aria-label={t('Agent Timeline')}>
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Space direction="vertical" size={2}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {t('Agent Timeline')}
          </Typography.Title>
          <Typography.Text type="secondary">
            {usingLegacyFallback
              ? t('Showing legacy run events because no normalized timeline exists')
              : events.length
                ? t('Normalized agent activity')
                : t('No timeline activity yet')}
          </Typography.Text>
        </Space>
        {warning ? <Alert type="warning" showIcon message={warning} /> : null}
        {usingLegacyFallback ? (
          <Alert type="info" showIcon message={t('This run has no normalized agent timeline yet')} />
        ) : null}
        {timelineItems.length ? (
          <Timeline mode="left" items={timelineItems} />
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No timeline events yet')} />
        )}
      </Space>
    </section>
  );
}
