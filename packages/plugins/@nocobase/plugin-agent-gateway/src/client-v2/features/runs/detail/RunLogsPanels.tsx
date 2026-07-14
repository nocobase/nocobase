/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { Alert, Button, Collapse, List, Pagination, Space, Table, Tag, Typography } from 'antd';
import { ColumnsType } from 'antd/es/table';
import React from 'react';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiActionFromPath } from '../../../../shared/apiContract';
import { ApiCallLogRecord, DetailPageMeta, RunEventRecord } from '../../../hooks/useRunObservabilityDetails';
import { JsonPreview, formatDateTime, getObjectRecord } from '../../../pages/AgentGatewayPageUtils';
import { RunRecord, TFunction } from '../../../pages/runs/types';
import { isLiveRunStatus } from '../../../pages/runs/runFormatters';
import {
  DANGLING_TOOL_LIVE_RUN_STATUSES,
  DETAIL_PAGE_SIZE_OPTIONS,
  EmptyInline,
  getStringValue,
  isRunActionAllowed,
} from '../runShared';
import { getRunCapability } from '../terminal/TerminalPanel';

export function getTimelineEmptyDescription(run: RunRecord | undefined, t: TFunction) {
  if (isLiveRunStatus(run?.status)) {
    return t('Waiting for live task updates from the agent');
  }
  return t('No task messages yet');
}

export function shouldCloseDanglingToolCalls(status?: string) {
  return !status || !DANGLING_TOOL_LIVE_RUN_STATUSES.has(status);
}

export function getRawLogDetailsWarning(run: RunRecord | undefined, t: TFunction) {
  if (!run) {
    return undefined;
  }
  if (!isRunActionAllowed(run.agentGatewayActionPermissionsJson, 'readRawLogs')) {
    return t('Agent Gateway raw log read permission required');
  }
  if (!getRunCapability(run, 'structuredEvents')) {
    return t('Structured events are not supported by this provider');
  }
  return undefined;
}

export function createRunLifecycleEvents(run: RunRecord, t: TFunction): RunEventRecord[] {
  const events: RunEventRecord[] = [];
  const addEvent = (eventType: string, message: string, emittedAt?: string) => {
    if (!emittedAt) {
      return;
    }
    events.push({
      id: `${run.id}:${eventType}`,
      sequence: events.length + 1,
      source: 'agent-gateway',
      level: 'info',
      eventType,
      message,
      emittedAt,
    });
  };

  addEvent('run.requested', t('Run requested'), run.requestedAt);
  addEvent('run.queued', t('Run queued'), run.queuedAt);
  addEvent('run.claimed', t('Run claimed by runner'), run.claimedAt);
  addEvent('terminal.started', t('Terminal started'), run.terminalStartedAt);
  addEvent('run.started', t('Run started'), run.startedAt);
  addEvent('terminal.finished', t('Terminal finished'), run.terminalEndedAt);
  addEvent(
    `run.${run.status || 'finished'}`,
    t('Run finished with status', { status: run.status || 'finished' }),
    run.finishedAt,
  );
  return events;
}

export function isHeartbeatRunEvent(record: RunEventRecord) {
  const source = record.source || '';
  const eventType = record.eventType || '';
  return source.includes('heartbeat') || eventType.includes('heartbeat');
}

export function isHarnessStageRunEvent(record: RunEventRecord) {
  const payload = getObjectRecord(record.contentJson);
  const source = record.source || '';
  const eventType = record.eventType || '';
  return (
    payload.progress === true ||
    source === 'harness' ||
    eventType.includes('harness') ||
    eventType.includes('render_run') ||
    eventType.includes('skill.sync') ||
    eventType.includes('agent.process') ||
    eventType.includes('artifacts.collect') ||
    eventType.includes('run.finalizing')
  );
}

export function getRunEventStageLabel(record: RunEventRecord) {
  const { phase, status } = getRunEventStageParts(record);
  return [phase, status].filter(Boolean).join(' / ');
}

export function getRunEventStageParts(record: RunEventRecord) {
  const payload = getObjectRecord(record.contentJson);
  const phase = getStringValue(payload.phase) || record.eventType || '-';
  const status = getStringValue(payload.status);
  return { phase, status };
}

export function LogsPanel({
  t,
  run,
  events,
  eventsWarning,
  hasMoreBefore,
  loading,
  onLoadOlder,
}: {
  t: TFunction;
  run: RunRecord;
  events: RunEventRecord[];
  eventsWarning?: string;
  hasMoreBefore?: boolean;
  loading?: boolean;
  onLoadOlder(): void;
}) {
  const displayEvents = events.length ? events : createRunLifecycleEvents(run, t);
  const heartbeatEvents = displayEvents.filter(isHeartbeatRunEvent);
  const visibleEvents = displayEvents.filter((event) => !isHeartbeatRunEvent(event));
  const harnessStageEvents = visibleEvents.filter(isHarnessStageRunEvent);
  const columns: ColumnsType<RunEventRecord> = [
    { title: t('Sequence'), dataIndex: 'sequence', key: 'sequence', width: 96 },
    { title: t('Source'), dataIndex: 'source', key: 'source', width: 120 },
    { title: t('Level'), dataIndex: 'level', key: 'level', width: 96 },
    { title: t('Type'), dataIndex: 'eventType', key: 'eventType', width: 180 },
    {
      title: t('Message'),
      dataIndex: 'message',
      key: 'message',
      render: (value: string | null | undefined) => (
        <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{value || '-'}</Typography.Paragraph>
      ),
    },
    {
      title: t('Emitted at'),
      dataIndex: 'emittedAt',
      key: 'emittedAt',
      width: 180,
      render: (value: string | undefined) => formatDateTime(value),
    },
  ];
  const expandedRowRender = (record: RunEventRecord) => <JsonPreview value={record.contentJson} />;
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {eventsWarning ? <Alert type="warning" showIcon message={eventsWarning} /> : null}
      {harnessStageEvents.length ? (
        <Collapse
          size="small"
          defaultActiveKey={['harness-stages']}
          items={[
            {
              key: 'harness-stages',
              label: (
                <Space wrap size={6}>
                  <Typography.Text strong>{t('Harness stages')}</Typography.Text>
                  <Tag>{harnessStageEvents.length}</Tag>
                </Space>
              ),
              children: (
                <List
                  size="small"
                  dataSource={harnessStageEvents}
                  style={{ maxHeight: 280, overflow: 'auto' }}
                  renderItem={(event) => (
                    <List.Item>
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Space wrap size={6}>
                          <Typography.Text strong>{getRunEventStageLabel(event)}</Typography.Text>
                          {event.source ? <Tag>{event.source}</Tag> : null}
                          {event.level ? <Tag>{event.level}</Tag> : null}
                          <Typography.Text type="secondary">{formatDateTime(event.emittedAt)}</Typography.Text>
                        </Space>
                        {event.message ? (
                          <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                            {event.message}
                          </Typography.Paragraph>
                        ) : null}
                      </Space>
                    </List.Item>
                  )}
                />
              ),
            },
          ]}
        />
      ) : null}
      {visibleEvents.length ? (
        <Table<RunEventRecord>
          columns={columns}
          expandable={{
            expandedRowRender,
          }}
          dataSource={visibleEvents}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
        />
      ) : (
        <EmptyInline
          description={heartbeatEvents.length ? t('Only heartbeat events were recorded') : t('No events yet')}
        />
      )}
      {heartbeatEvents.length ? (
        <Collapse
          size="small"
          items={[
            {
              key: 'heartbeat-events',
              label: (
                <Space wrap size={6}>
                  <Typography.Text strong>{t('Heartbeat event details')}</Typography.Text>
                  <Tag>{heartbeatEvents.length}</Tag>
                </Space>
              ),
              children: (
                <Table<RunEventRecord>
                  columns={columns}
                  expandable={{
                    expandedRowRender,
                  }}
                  dataSource={heartbeatEvents}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              ),
            },
          ]}
        />
      ) : null}
      {hasMoreBefore ? (
        <Button loading={loading} onClick={onLoadOlder}>
          {t('Load older events')}
        </Button>
      ) : null}
    </Space>
  );
}

export function isHeartbeatApiCallLog(record: ApiCallLogRecord) {
  return getAgentGatewayApiActionFromPath(record.path || '') === AGENT_GATEWAY_API_ACTIONS.heartbeatRun;
}

export function getApiLogTimeMs(record: ApiCallLogRecord) {
  if (!record.createdAt) {
    return null;
  }
  const time = Date.parse(record.createdAt);
  return Number.isFinite(time) ? time : null;
}

export function getHeartbeatApiLogSummary(apiCallLogs: ApiCallLogRecord[]) {
  if (!apiCallLogs.length) {
    return null;
  }
  const sortedLogs = [...apiCallLogs].sort((left, right) => {
    const leftTime = getApiLogTimeMs(left) || 0;
    const rightTime = getApiLogTimeMs(right) || 0;
    return leftTime - rightTime;
  });
  const durations = apiCallLogs
    .map((log) => (typeof log.durationMs === 'number' && Number.isFinite(log.durationMs) ? log.durationMs : null))
    .filter((duration): duration is number => duration !== null);
  const averageDurationMs = durations.length
    ? Math.round(durations.reduce((total, duration) => total + duration, 0) / durations.length)
    : null;
  const latestLog = sortedLogs[sortedLogs.length - 1];
  return {
    count: apiCallLogs.length,
    firstCreatedAt: sortedLogs[0]?.createdAt,
    lastCreatedAt: latestLog?.createdAt,
    latestStatusCode: latestLog?.statusCode,
    averageDurationMs,
  };
}

export function ApiLogsPanel({
  t,
  apiCallLogs,
  meta,
  apiCallLogsWarning,
  loading,
  onPageChange,
}: {
  t: TFunction;
  apiCallLogs: ApiCallLogRecord[];
  meta: DetailPageMeta;
  apiCallLogsWarning?: string;
  loading?: boolean;
  onPageChange(page: number, pageSize: number): void;
}) {
  const heartbeatLogs = apiCallLogs.filter(isHeartbeatApiCallLog);
  const visibleLogs = apiCallLogs.filter((log) => !isHeartbeatApiCallLog(log));
  const heartbeatSummary = getHeartbeatApiLogSummary(heartbeatLogs);
  const columns: ColumnsType<ApiCallLogRecord> = [
    { title: t('Method'), dataIndex: 'method', key: 'method', width: 96 },
    { title: t('Path'), dataIndex: 'path', key: 'path' },
    { title: t('Status code'), dataIndex: 'statusCode', key: 'statusCode', width: 120 },
    { title: t('Duration ms'), dataIndex: 'durationMs', key: 'durationMs', width: 120 },
    {
      title: t('Created at'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 180,
      render: (value: string | undefined) => formatDateTime(value),
    },
  ];
  const expandedRowRender = (record: ApiCallLogRecord) => (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Typography.Text strong>{t('Request summary')}</Typography.Text>
      <JsonPreview value={record.requestSummaryJson} />
      <Typography.Text strong>{t('Response summary')}</Typography.Text>
      <JsonPreview value={record.responseSummaryJson} />
      {record.errorSummary ? <Typography.Text type="danger">{record.errorSummary}</Typography.Text> : null}
    </Space>
  );

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {apiCallLogsWarning ? <Alert type="warning" showIcon message={apiCallLogsWarning} /> : null}
      {heartbeatSummary ? (
        <Alert
          type="info"
          showIcon
          message={t('Heartbeat summary')}
          description={
            <Space wrap size={8}>
              <Tag>
                {t('Heartbeat calls')}: {heartbeatSummary.count}
              </Tag>
              <Tag>
                {t('First heartbeat')}: {formatDateTime(heartbeatSummary.firstCreatedAt)}
              </Tag>
              <Tag>
                {t('Last heartbeat')}: {formatDateTime(heartbeatSummary.lastCreatedAt)}
              </Tag>
              {heartbeatSummary.averageDurationMs !== null ? (
                <Tag>
                  {t('Average duration ms')}: {heartbeatSummary.averageDurationMs}
                </Tag>
              ) : null}
              {heartbeatSummary.latestStatusCode ? (
                <Tag>
                  {t('Latest status code')}: {heartbeatSummary.latestStatusCode}
                </Tag>
              ) : null}
            </Space>
          }
        />
      ) : null}
      {visibleLogs.length || loading ? (
        <Table<ApiCallLogRecord>
          columns={columns}
          expandable={{
            expandedRowRender,
          }}
          dataSource={visibleLogs}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
        />
      ) : (
        <EmptyInline
          description={heartbeatLogs.length ? t('Only heartbeat API calls were recorded') : t('No API logs yet')}
        />
      )}
      {heartbeatLogs.length ? (
        <Collapse
          size="small"
          items={[
            {
              key: 'heartbeat-details',
              label: (
                <Space wrap size={6}>
                  <Typography.Text strong>{t('Heartbeat details')}</Typography.Text>
                  <Tag>{heartbeatLogs.length}</Tag>
                </Space>
              ),
              children: (
                <Table<ApiCallLogRecord>
                  columns={columns}
                  expandable={{
                    expandedRowRender,
                  }}
                  dataSource={heartbeatLogs}
                  rowKey="id"
                  pagination={false}
                  size="small"
                />
              ),
            },
          ]}
        />
      ) : null}
      {meta.count > meta.pageSize ? (
        <Pagination
          current={meta.page}
          pageSize={meta.pageSize}
          total={meta.count}
          showSizeChanger
          pageSizeOptions={DETAIL_PAGE_SIZE_OPTIONS}
          showTotal={(total) => `${t('Total')}: ${total}`}
          onChange={onPageChange}
        />
      ) : null}
    </Space>
  );
}
