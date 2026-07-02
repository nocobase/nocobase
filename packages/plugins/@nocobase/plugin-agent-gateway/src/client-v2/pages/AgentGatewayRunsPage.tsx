/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  EnterOutlined,
  EyeOutlined,
  PoweroffOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import {
  Alert,
  Button,
  Collapse,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  List,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { CSSMotionProps } from 'rc-motion';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AgentTimeline, AgentTimelineEventRecord } from '../components/AgentTimeline';
import { AgentSessionResumeBox, AgentSessionResumeInput } from '../components/AgentSessionResumeBox';
import { ReadonlyXtermOutput } from '../components/ReadonlyXtermOutput';
import { TerminalStreamSmokePanel, isTerminalStreamSmokeEnabled } from '../components/TerminalStreamSmokePanel';
import { useTerminalStream, UseTerminalStreamState } from '../hooks/useTerminalStream';
import { useT } from '../locale';
import {
  AgentGatewayContext,
  AgentGatewayApiResponse,
  JsonPreview,
  JsonRecord,
  formatDateTime,
  getApiErrorMessage,
  getRequiredResponseData,
  getResponseData,
  redactExternalUrlPreviewJson,
  redactPreviewText,
  statusTag,
} from './AgentGatewayPageUtils';

interface RunRecord {
  id: string;
  runCode: string;
  status: string;
  nodeId?: string | null;
  agentProfileId?: string | null;
  sourceType?: string | null;
  sourceCollection?: string | null;
  sourceRecordId?: string | null;
  cancelRequested?: boolean;
  resultSummaryJson?: JsonRecord;
  errorSummary?: string | null;
  terminalBackend?: string | null;
  terminalSessionName?: string | null;
  terminalStatus?: string | null;
  terminalStartedAt?: string;
  terminalEndedAt?: string;
  terminalLastActivityAt?: string;
  terminalExitCode?: number | null;
  agentSessionId?: string | null;
  parentRunId?: string | null;
  resumedFromRunId?: string | null;
  continuationReason?: string | null;
  agentSessionProvider?: string | null;
  agentSessionProviderId?: string | null;
  requestedAt?: string;
  queuedAt?: string;
  claimedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
}

interface RunEventRecord {
  id: string;
  source?: string;
  sequence?: number;
  level?: string;
  eventType?: string;
  message?: string | null;
  payloadJson?: JsonRecord;
  emittedAt?: string;
}

interface RunArtifactRecord {
  id: string;
  artifactKey?: string | null;
  artifactType?: string;
  mimeType?: string | null;
  sizeBytes?: number | string | null;
  contentText?: string | null;
  metadataJson?: JsonRecord;
}

interface RunSnapshotRecord {
  id: string;
  snapshotType?: string;
  snapshotJson?: JsonRecord;
  metadataJson?: JsonRecord;
  capturedAt?: string;
}

interface ApiCallLogRecord {
  id: string;
  method?: string;
  path?: string;
  statusCode?: number;
  durationMs?: number;
  requestSummaryJson?: JsonRecord;
  responseSummaryJson?: JsonRecord;
  errorSummary?: string | null;
  createdAt?: string;
}

interface TerminalSnapshot {
  backend?: string | null;
  sessionName?: string | null;
  terminalStatus?: string | null;
  runStatus?: string;
  available: boolean;
  output: string;
  capturedAt: string;
  inputEnabled: boolean;
}

interface RunDetails {
  run: RunRecord;
  conversationEvents: AgentTimelineEventRecord[];
  events: RunEventRecord[];
  artifacts: RunArtifactRecord[];
  snapshots: RunSnapshotRecord[];
  apiCallLogs: ApiCallLogRecord[];
  warnings: RunDetailsWarnings;
}

interface RunDetailsWarnings {
  conversationEvents?: string;
  events?: string;
  artifacts?: string;
  snapshots?: string;
  apiCallLogs?: string;
}

interface ResumeAgentSessionResult {
  runId: string;
  runCode?: string;
  agentSessionId: string;
  parentRunId?: string;
  resumedFromRunId?: string;
  deduped: boolean;
}

interface ConversationEventsState {
  runId: string;
  events: AgentTimelineEventRecord[];
  warning?: string;
}

interface DateLike {
  toISOString(): string;
}

interface RunFilterFormValues {
  status?: string;
  nodeId?: string;
  agentProfileId?: string;
  createdAtRange?: [DateLike, DateLike];
}

type TFunction = (key: string, options?: Record<string, unknown>) => string;

const RUN_STATUS_OPTIONS = [
  'queued',
  'claimed',
  'syncing_skills',
  'running',
  'canceling',
  'succeeded',
  'failed',
  'canceled',
  'timeout',
  'abandoned',
];

const CANCELABLE_STATUSES = new Set(['queued', 'claimed', 'syncing_skills', 'running']);
const LEGACY_TIMELINE_FALLBACK_STATUSES = new Set(['succeeded']);
const RUN_DETAIL_QUERY_PARAM = 'runId';
const NO_COLLAPSE_MOTION: CSSMotionProps = {
  motionName: '',
  motionAppear: false,
  motionEnter: false,
  motionLeave: false,
};
const FastCollapse = Collapse as React.ComponentType<
  React.ComponentProps<typeof Collapse> & { openMotion?: CSSMotionProps }
>;

function isCancelableRun(run: RunRecord) {
  return CANCELABLE_STATUSES.has(run.status);
}

function canUseLegacyTimelineFallback(run: RunRecord | undefined, eventCount: number, hasWarning: boolean) {
  if (!run || eventCount > 0 || hasWarning) {
    return false;
  }
  return (
    LEGACY_TIMELINE_FALLBACK_STATUSES.has(run.status) &&
    !run.agentSessionId &&
    !run.agentSessionProvider &&
    !run.agentSessionProviderId
  );
}

function mergeConversationEventsState(
  previous: ConversationEventsState | null,
  next: ConversationEventsState,
): ConversationEventsState {
  if (previous?.runId !== next.runId) {
    return next;
  }
  if (previous.events.length > next.events.length) {
    return previous;
  }
  return next;
}

function normalizeRunFilters(values: RunFilterFormValues) {
  const filters: Record<string, unknown> = {};
  if (values.status) {
    filters.status = values.status;
  }
  if (values.nodeId) {
    filters.nodeId = values.nodeId;
  }
  if (values.agentProfileId) {
    filters.agentProfileId = values.agentProfileId;
  }
  if (values.createdAtRange?.[0]) {
    filters.createdAtFrom = values.createdAtRange[0].toISOString();
  }
  if (values.createdAtRange?.[1]) {
    filters.createdAtTo = values.createdAtRange[1].toISOString();
  }
  return filters;
}

function EmptyInline({ description }: { description: string }) {
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />;
}

function getTerminalStreamAuth(ctx: AgentGatewayContext) {
  const auth = ctx.api.auth;
  return {
    token: auth?.token || '',
    authenticator: auth?.getAuthenticator?.() || auth?.authenticator || 'basic',
    role: auth?.role,
  };
}

function getRunIdFromLocationSearch() {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return new URLSearchParams(window.location.search).get(RUN_DETAIL_QUERY_PARAM) || undefined;
}

function replaceRunIdInLocationSearch(runId?: string) {
  if (typeof window === 'undefined') {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  if (runId) {
    params.set(RUN_DETAIL_QUERY_PARAM, runId);
  } else {
    params.delete(RUN_DETAIL_QUERY_PARAM);
  }
  const search = params.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}

function useInitialRunDetailQuery() {
  return useState(() => getRunIdFromLocationSearch())[0];
}

function RunSessionSummary({ run, t }: { run: RunRecord; t: TFunction }) {
  const providerSummary = [run.agentSessionProvider, run.agentSessionProviderId].filter(Boolean).join(' / ');
  if (providerSummary || run.agentSessionId) {
    return (
      <Space direction="vertical" size={0}>
        <Typography.Text>{providerSummary || t('Agent session')}</Typography.Text>
        {run.agentSessionId ? <Typography.Text type="secondary">{run.agentSessionId}</Typography.Text> : null}
      </Space>
    );
  }

  return <Typography.Text type="secondary">{t('Legacy run')}</Typography.Text>;
}

function getDetailWarning(error: unknown, fallback: string) {
  const detail = getApiErrorMessage(error, '');
  return detail ? `${fallback}: ${detail}` : fallback;
}

async function getOptionalDetails<T>(options: {
  request: Promise<AgentGatewayApiResponse<T>>;
  fallback: T;
  fallbackMessage: string;
}) {
  try {
    const response = await options.request;
    return {
      data: getResponseData(response, options.fallback),
    };
  } catch (error) {
    return {
      data: options.fallback,
      warning: getDetailWarning(error, options.fallbackMessage),
    };
  }
}

function TerminalPanel({
  runId,
  t,
  snapshot,
  stream,
  loading,
  interrupting,
  terminating,
  onRefresh,
  onInterrupt,
  onTerminate,
}: {
  runId: string;
  t: TFunction;
  snapshot: TerminalSnapshot | null | undefined;
  stream: UseTerminalStreamState;
  loading: boolean;
  interrupting: boolean;
  terminating: boolean;
  onRefresh(): void;
  onInterrupt(): void;
  onTerminate(): void;
}) {
  const output = snapshot?.output || '';
  const terminalAvailable = Boolean(snapshot?.available);
  const inputEnabled = Boolean(snapshot?.inputEnabled);
  const streamHasOutput = stream.hasStreamOutput || stream.chunks.length > 0 || Boolean(stream.previewText);
  const snapshotHasOutput = Boolean(output);
  const streamUnavailable =
    stream.connectionState === 'closed' || stream.connectionState === 'error' || Boolean(stream.lastErrorCode);
  const useSnapshotFallback = !streamHasOutput || (streamUnavailable && snapshotHasOutput);
  const useStreamOutput = streamHasOutput && !useSnapshotFallback;
  const xtermResetKey = [
    runId,
    useStreamOutput ? 'stream' : 'snapshot',
    useStreamOutput ? 'live' : snapshot?.capturedAt || 'empty',
    snapshot?.sessionName || '',
  ].join(':');
  const fallbackOutput = output || t('No terminal output yet');

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
        <Space wrap>
          <Typography.Text type="secondary">{snapshot?.sessionName || '-'}</Typography.Text>
          {snapshot?.terminalStatus ? statusTag(snapshot.terminalStatus) : null}
          <Typography.Text type="secondary">{t('Stream')}</Typography.Text>
          {statusTag(stream.connectionState)}
          <Typography.Text data-testid="agent-gateway-xterm-stream-offset" type="secondary">
            {t('Offset')}: {stream.currentOffset}
          </Typography.Text>
          {stream.lastErrorCode ? (
            <Typography.Text data-testid="agent-gateway-xterm-stream-error" type="danger">
              {stream.lastErrorCode}
            </Typography.Text>
          ) : null}
          <Typography.Text type="secondary">{formatDateTime(snapshot?.capturedAt)}</Typography.Text>
        </Space>
        <Space>
          <Tooltip title={t('Refresh terminal')}>
            <Button
              aria-label={t('Refresh terminal')}
              icon={<ReloadOutlined />}
              loading={loading}
              onClick={onRefresh}
            />
          </Tooltip>
          <Tooltip title={t('Interrupt terminal')}>
            <Button
              aria-label={t('Interrupt terminal')}
              disabled={!inputEnabled}
              icon={<EnterOutlined />}
              loading={interrupting}
              onClick={onInterrupt}
            />
          </Tooltip>
          <Tooltip title={t('Terminate terminal')}>
            <Button
              aria-label={t('Terminate terminal')}
              danger
              disabled={!snapshot?.sessionName}
              icon={<PoweroffOutlined />}
              loading={terminating}
              onClick={onTerminate}
            />
          </Tooltip>
        </Space>
      </Space>

      {!terminalAvailable ? <Alert type="info" showIcon message={t('No terminal session yet')} /> : null}
      {stream.lastErrorCode === 'TERMINAL_OFFSET_GAP' ? (
        <Alert
          data-testid="agent-gateway-terminal-offset-gap"
          type="warning"
          showIcon
          message={t('Live output gap detected. Showing saved terminal output when available.')}
        />
      ) : null}
      <ReadonlyXtermOutput
        ariaLabel={t('Readonly live terminal output')}
        chunks={useStreamOutput ? stream.chunks : []}
        emptyText={t('No terminal output yet')}
        initialOutput={useStreamOutput ? '' : fallbackOutput}
        resetKey={xtermResetKey}
      />
    </Space>
  );
}

function LogsPanel({
  t,
  events,
  apiCallLogs,
  eventsWarning,
  apiCallLogsWarning,
}: {
  t: TFunction;
  events: RunEventRecord[];
  apiCallLogs: ApiCallLogRecord[];
  eventsWarning?: string;
  apiCallLogsWarning?: string;
}) {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {eventsWarning ? <Alert type="warning" showIcon message={eventsWarning} /> : null}
      {events.length ? (
        <Table<RunEventRecord>
          columns={[
            { title: t('Sequence'), dataIndex: 'sequence', key: 'sequence', width: 96 },
            { title: t('Source'), dataIndex: 'source', key: 'source', width: 120 },
            { title: t('Level'), dataIndex: 'level', key: 'level', width: 96 },
            { title: t('Type'), dataIndex: 'eventType', key: 'eventType', width: 180 },
            {
              title: t('Message'),
              dataIndex: 'message',
              key: 'message',
              render: (value: string | null | undefined) => (
                <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                  {value || '-'}
                </Typography.Paragraph>
              ),
            },
            {
              title: t('Emitted at'),
              dataIndex: 'emittedAt',
              key: 'emittedAt',
              width: 180,
              render: (value: string | undefined) => formatDateTime(value),
            },
          ]}
          dataSource={events}
          rowKey="id"
          pagination={false}
          size="small"
        />
      ) : (
        <EmptyInline description={t('No events yet')} />
      )}

      <Typography.Title level={5} style={{ margin: 0 }}>
        {t('API logs')}
      </Typography.Title>
      {apiCallLogsWarning ? <Alert type="warning" showIcon message={apiCallLogsWarning} /> : null}
      {apiCallLogs.length ? (
        <Table<ApiCallLogRecord>
          columns={[
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
          ]}
          expandable={{
            expandedRowRender: (record) => (
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Typography.Text strong>{t('Request summary')}</Typography.Text>
                <JsonPreview value={record.requestSummaryJson} />
                <Typography.Text strong>{t('Response summary')}</Typography.Text>
                <JsonPreview value={record.responseSummaryJson} />
                {record.errorSummary ? <Typography.Text type="danger">{record.errorSummary}</Typography.Text> : null}
              </Space>
            ),
          }}
          dataSource={apiCallLogs}
          rowKey="id"
          pagination={false}
          size="small"
        />
      ) : (
        <EmptyInline description={t('No API logs yet')} />
      )}
    </Space>
  );
}

function ArtifactsPanel({
  t,
  artifacts,
  snapshots,
  artifactsWarning,
  snapshotsWarning,
}: {
  t: TFunction;
  artifacts: RunArtifactRecord[];
  snapshots: RunSnapshotRecord[];
  artifactsWarning?: string;
  snapshotsWarning?: string;
}) {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {artifactsWarning ? <Alert type="warning" showIcon message={artifactsWarning} /> : null}
      {artifacts.length ? (
        <List
          dataSource={artifacts}
          renderItem={(artifact) => (
            <List.Item>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Typography.Text strong>
                  {[artifact.artifactKey, artifact.artifactType, artifact.mimeType].filter(Boolean).join(' / ') ||
                    artifact.id}
                </Typography.Text>
                {artifact.contentText ? (
                  <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                    {artifact.contentText}
                  </Typography.Paragraph>
                ) : (
                  <Typography.Text type="secondary">{t('No inline artifact text')}</Typography.Text>
                )}
                <JsonPreview value={redactExternalUrlPreviewJson(artifact.metadataJson)} />
              </Space>
            </List.Item>
          )}
        />
      ) : (
        <EmptyInline description={t('No artifacts yet')} />
      )}

      <Typography.Title level={5} style={{ margin: 0 }}>
        {t('Snapshots')}
      </Typography.Title>
      {snapshotsWarning ? <Alert type="warning" showIcon message={snapshotsWarning} /> : null}
      {snapshots.length ? (
        <List
          dataSource={snapshots}
          renderItem={(snapshot) => (
            <List.Item>
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <Typography.Text strong>
                  {snapshot.snapshotType || snapshot.id} - {formatDateTime(snapshot.capturedAt)}
                </Typography.Text>
                <JsonPreview value={snapshot.snapshotJson} />
              </Space>
            </List.Item>
          )}
        />
      ) : (
        <EmptyInline description={t('No snapshots yet')} />
      )}
    </Space>
  );
}

export default function AgentGatewayRunsPage() {
  const t = useT();
  const ctx = useFlowContext() as unknown as AgentGatewayContext;
  const initialRunId = useInitialRunDetailQuery();
  const [filterForm] = Form.useForm<RunFilterFormValues>();
  const [runFilters, setRunFilters] = useState<Record<string, unknown>>({});
  const [detailOpen, setDetailOpen] = useState(Boolean(initialRunId));
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>(initialRunId);
  const [conversationEventsState, setConversationEventsState] = useState<ConversationEventsState | null>(null);
  const [conversationEventsWarning, setConversationEventsWarning] = useState<string>();

  const runsRequest = useRequest(
    async () => {
      const response = await ctx.api.request<RunRecord[]>({
        url: 'agent-gateway/runs:list',
        method: 'get',
        params: runFilters,
      });
      return getResponseData(response, []);
    },
    {
      refreshDeps: [runFilters],
    },
  );
  const { refresh: refreshRuns } = runsRequest;

  const runDetailsRequest = useRequest(
    async () => {
      if (!selectedRunId || !detailOpen) {
        return null;
      }

      const runResponse = await ctx.api.request<RunRecord>({
        url: `agent-gateway/runs:get/${encodeURIComponent(selectedRunId)}`,
        method: 'get',
      });
      const run = getRequiredResponseData(runResponse, t('Failed to load run details'));
      const timelineUrl = run.agentSessionId
        ? `agent-gateway/agent-sessions/${encodeURIComponent(run.agentSessionId)}/conversation-events:list`
        : `agent-gateway/runs/${encodeURIComponent(selectedRunId)}/conversation-events:list`;
      const [conversationEventsResult, eventsResult, artifactsResult, snapshotsResult, apiCallLogsResult] =
        await Promise.all([
          getOptionalDetails<AgentTimelineEventRecord[]>({
            request: ctx.api.request<AgentTimelineEventRecord[]>({
              url: timelineUrl,
              method: 'get',
            }),
            fallback: [],
            fallbackMessage: t('Agent timeline unavailable'),
          }),
          getOptionalDetails<RunEventRecord[]>({
            request: ctx.api.request<RunEventRecord[]>({
              url: `agent-gateway/runs/${encodeURIComponent(selectedRunId)}/events:list`,
              method: 'get',
            }),
            fallback: [],
            fallbackMessage: t('Events unavailable'),
          }),
          getOptionalDetails<RunArtifactRecord[]>({
            request: ctx.api.request<RunArtifactRecord[]>({
              url: `agent-gateway/runs/${encodeURIComponent(selectedRunId)}/artifacts:list`,
              method: 'get',
            }),
            fallback: [],
            fallbackMessage: t('Artifacts unavailable'),
          }),
          getOptionalDetails<RunSnapshotRecord[]>({
            request: ctx.api.request<RunSnapshotRecord[]>({
              url: `agent-gateway/runs/${encodeURIComponent(selectedRunId)}/snapshots:list`,
              method: 'get',
            }),
            fallback: [],
            fallbackMessage: t('Snapshots unavailable'),
          }),
          getOptionalDetails<ApiCallLogRecord[]>({
            request: ctx.api.request<ApiCallLogRecord[]>({
              url: `agent-gateway/runs/${encodeURIComponent(selectedRunId)}/api-call-logs:list`,
              method: 'get',
            }),
            fallback: [],
            fallbackMessage: t('API logs unavailable'),
          }),
        ]);

      return {
        run,
        conversationEvents: conversationEventsResult.data,
        events: eventsResult.data,
        artifacts: artifactsResult.data,
        snapshots: snapshotsResult.data,
        apiCallLogs: apiCallLogsResult.data,
        warnings: {
          conversationEvents: conversationEventsResult.warning,
          events: eventsResult.warning,
          artifacts: artifactsResult.warning,
          snapshots: snapshotsResult.warning,
          apiCallLogs: apiCallLogsResult.warning,
        },
      } satisfies RunDetails;
    },
    {
      refreshDeps: [selectedRunId, detailOpen],
      onSuccess(data) {
        if (!data?.run?.id || data.run.id !== selectedRunId) {
          return;
        }
        if (data.warnings.conversationEvents) {
          setConversationEventsWarning(data.warnings.conversationEvents);
          return;
        }
        setConversationEventsState((previous) =>
          mergeConversationEventsState(previous, {
            runId: data.run.id,
            events: data.conversationEvents,
          }),
        );
        setConversationEventsWarning(undefined);
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to load run details')));
      },
    },
  );
  const { refresh: refreshRunDetails } = runDetailsRequest;

  const terminalSnapshotRequest = useRequest(
    async () => {
      if (!selectedRunId || !detailOpen) {
        return null;
      }
      const response = await ctx.api.request<TerminalSnapshot | null>({
        url: `agent-gateway/runs/${encodeURIComponent(selectedRunId)}/terminal:snapshot`,
        method: 'get',
      });
      return getResponseData(response, null);
    },
    {
      manual: true,
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to load terminal')));
      },
    },
  );
  const { run: refreshTerminalSnapshot } = terminalSnapshotRequest;

  const conversationEventsRequest = useRequest(
    async () => {
      if (!selectedRunId || !detailOpen) {
        return null;
      }
      const currentRun = runDetailsRequest.data?.run;
      const currentRunMatchesSelection = currentRun?.id === selectedRunId;
      const timelineUrl =
        currentRunMatchesSelection && currentRun?.agentSessionId
          ? `agent-gateway/agent-sessions/${encodeURIComponent(currentRun.agentSessionId)}/conversation-events:list`
          : `agent-gateway/runs/${encodeURIComponent(selectedRunId)}/conversation-events:list`;
      const response = await ctx.api.request<AgentTimelineEventRecord[]>({
        url: timelineUrl,
        method: 'get',
      });
      return {
        runId: selectedRunId,
        events: getResponseData(response, []),
      } satisfies ConversationEventsState;
    },
    {
      manual: true,
      onSuccess(data) {
        if (!data || data.runId !== selectedRunId) {
          return;
        }
        setConversationEventsState((previous) => mergeConversationEventsState(previous, data));
        setConversationEventsWarning(undefined);
      },
      onError(error) {
        setConversationEventsWarning(getDetailWarning(error, t('Agent timeline unavailable')));
      },
    },
  );
  const { run: refreshConversationEvents } = conversationEventsRequest;

  const cancelRunRequest = useRequest(
    async (run: RunRecord) => {
      const response = await ctx.api.request<RunRecord>({
        url: `agent-gateway/runs/${encodeURIComponent(run.id)}/cancel`,
        method: 'post',
      });
      return getRequiredResponseData(response, t('Failed to cancel run'));
    },
    {
      manual: true,
      onSuccess() {
        ctx.message?.success(t('Cancel requested'));
        runsRequest.refresh();
        runDetailsRequest.refresh();
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to cancel run')));
      },
    },
  );

  const interruptTerminalRequest = useRequest(
    async () => {
      if (!selectedRunId) {
        return null;
      }
      await ctx.api.request({
        url: `agent-gateway/runs/${encodeURIComponent(selectedRunId)}/terminal:interrupt`,
        method: 'post',
      });
      return true;
    },
    {
      manual: true,
      onSuccess() {
        refreshTerminalSnapshot();
        runDetailsRequest.refresh();
        ctx.message?.success(t('Terminal interrupted'));
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to interrupt terminal')));
      },
    },
  );

  const terminateTerminalRequest = useRequest(
    async () => {
      if (!selectedRunId) {
        return null;
      }
      await ctx.api.request({
        url: `agent-gateway/runs/${encodeURIComponent(selectedRunId)}/terminal:terminate`,
        method: 'post',
      });
      return true;
    },
    {
      manual: true,
      onSuccess() {
        refreshTerminalSnapshot();
        runsRequest.refresh();
        runDetailsRequest.refresh();
        ctx.message?.success(t('Terminal termination requested'));
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to terminate terminal')));
      },
    },
  );

  const resumeSessionRequest = useRequest(
    async (options: { run: RunRecord } & AgentSessionResumeInput) => {
      if (!options.run.agentSessionId) {
        throw new Error(t('No agent session'));
      }
      const response = await ctx.api.request<ResumeAgentSessionResult>({
        url: `agent-gateway/agent-sessions/${encodeURIComponent(options.run.agentSessionId)}/resume`,
        method: 'post',
        data: {
          message: options.message,
          idempotencyKey: options.idempotencyKey,
          resumedFromRunId: options.run.id,
        },
      });
      return getRequiredResponseData(response, t('Failed to resume session'));
    },
    {
      manual: true,
      onSuccess(result) {
        const nextRunId = String(result.runId);
        setConversationEventsState(null);
        setConversationEventsWarning(undefined);
        setSelectedRunId(nextRunId);
        setDetailOpen(true);
        replaceRunIdInLocationSearch(nextRunId);
        runsRequest.refresh();
        ctx.message?.success(result.deduped ? t('Continuation run already exists') : t('Continuation run created'));
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to resume session')));
      },
    },
  );

  useEffect(() => {
    if (!detailOpen || !selectedRunId) {
      return;
    }

    refreshTerminalSnapshot();
    refreshConversationEvents();
    const realtimeTimer = window.setInterval(() => {
      refreshTerminalSnapshot();
      refreshConversationEvents();
    }, 2000);
    const summaryTimer = window.setInterval(() => {
      refreshRuns();
      refreshRunDetails();
    }, 5000);
    return () => {
      window.clearInterval(realtimeTimer);
      window.clearInterval(summaryTimer);
    };
  }, [detailOpen, refreshConversationEvents, refreshRunDetails, refreshRuns, refreshTerminalSnapshot, selectedRunId]);

  const openRunDetails = useCallback((run: RunRecord) => {
    setConversationEventsState(null);
    setConversationEventsWarning(undefined);
    setSelectedRunId(run.id);
    setDetailOpen(true);
    replaceRunIdInLocationSearch(run.id);
  }, []);

  const closeRunDetails = useCallback(() => {
    setDetailOpen(false);
    setSelectedRunId(undefined);
    setConversationEventsState(null);
    setConversationEventsWarning(undefined);
    replaceRunIdInLocationSearch();
  }, []);

  const submitFilters = useCallback(
    (values: RunFilterFormValues) => {
      setRunFilters(normalizeRunFilters(values));
    },
    [setRunFilters],
  );

  const resetFilters = useCallback(() => {
    filterForm.resetFields();
    setRunFilters({});
  }, [filterForm]);

  const renderCancelButton = useCallback(
    (run: RunRecord) =>
      isCancelableRun(run) ? (
        <Tooltip title={t('Cancel run')}>
          <Button
            aria-label={t('Cancel run')}
            danger
            icon={<StopOutlined />}
            loading={cancelRunRequest.loading}
            onClick={() => cancelRunRequest.run(run)}
          />
        </Tooltip>
      ) : null,
    [cancelRunRequest, t],
  );

  const runColumns = useMemo<ColumnsType<RunRecord>>(
    () => [
      {
        title: t('Run code'),
        dataIndex: 'runCode',
        key: 'runCode',
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        key: 'status',
        width: 132,
        render: (value: string | undefined) => statusTag(value),
      },
      {
        title: t('Agent'),
        key: 'agent',
        render: (_value: unknown, record) => (
          <Space direction="vertical" size={0}>
            <Typography.Text>{record.nodeId || '-'}</Typography.Text>
            <Typography.Text type="secondary">{record.agentProfileId || '-'}</Typography.Text>
          </Space>
        ),
      },
      {
        title: t('Session'),
        key: 'session',
        width: 220,
        render: (_value: unknown, record) => <RunSessionSummary run={record} t={t} />,
      },
      {
        title: t('Source'),
        dataIndex: 'sourceType',
        key: 'sourceType',
        render: (value: string | null | undefined, record) =>
          [value, record.sourceCollection, record.sourceRecordId].filter(Boolean).join(' / ') || '-',
      },
      {
        title: t('Started at'),
        dataIndex: 'startedAt',
        key: 'startedAt',
        width: 180,
        render: (value: string | undefined) => formatDateTime(value),
      },
      {
        title: t('Finished at'),
        dataIndex: 'finishedAt',
        key: 'finishedAt',
        width: 180,
        render: (value: string | undefined) => formatDateTime(value),
      },
      {
        title: t('Actions'),
        key: 'actions',
        width: 112,
        render: (_value: unknown, record) => (
          <Space>
            <Tooltip title={t('View run details')}>
              <Button
                aria-label={t('View run details')}
                icon={<EyeOutlined />}
                onClick={() => openRunDetails(record)}
              />
            </Tooltip>
            {renderCancelButton(record)}
          </Space>
        ),
      },
    ],
    [openRunDetails, renderCancelButton, t],
  );

  const activeRunDetails = runDetailsRequest.data?.run.id === selectedRunId ? runDetailsRequest.data : null;
  const selectedRun = activeRunDetails?.run || runsRequest.data?.find((run) => run.id === selectedRunId);
  const terminalSnapshot = terminalSnapshotRequest.data;
  const latestConversationEvents = conversationEventsState?.runId === selectedRunId ? conversationEventsState : null;
  const timelineEvents = latestConversationEvents?.events || activeRunDetails?.conversationEvents || [];
  const timelineWarning =
    conversationEventsWarning || (latestConversationEvents ? undefined : activeRunDetails?.warnings.conversationEvents);
  const useLegacyTimelineFallback = canUseLegacyTimelineFallback(
    activeRunDetails?.run,
    timelineEvents.length,
    Boolean(timelineWarning),
  );
  const showTerminalStreamSmoke = isTerminalStreamSmokeEnabled();
  const terminalStreamAuth = useMemo(() => getTerminalStreamAuth(ctx), [ctx]);
  const terminalStream = useTerminalStream({
    runId: selectedRunId,
    enabled: detailOpen && Boolean(selectedRunId),
    token: terminalStreamAuth.token,
    authenticator: terminalStreamAuth.authenticator,
    role: terminalStreamAuth.role,
  });

  return (
    <section aria-label={t('Runs')}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t('Runs')}
          </Typography.Title>
          <Button icon={<ReloadOutlined />} onClick={runsRequest.refresh}>
            {t('Refresh')}
          </Button>
        </Space>

        <Form<RunFilterFormValues> form={filterForm} layout="inline" onFinish={submitFilters}>
          <Form.Item label={t('Status')} name="status">
            <Select
              allowClear
              style={{ width: 180 }}
              options={RUN_STATUS_OPTIONS.map((status) => ({
                value: status,
                label: status,
              }))}
            />
          </Form.Item>
          <Form.Item label={t('Node ID')} name="nodeId">
            <Input style={{ width: 220 }} />
          </Form.Item>
          <Form.Item label={t('Profile ID')} name="agentProfileId">
            <Input style={{ width: 220 }} />
          </Form.Item>
          <Form.Item label={t('Created at')} name="createdAtRange">
            <DatePicker.RangePicker />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" icon={<SearchOutlined />}>
                {t('Filter')}
              </Button>
              <Button onClick={resetFilters}>{t('Reset')}</Button>
            </Space>
          </Form.Item>
        </Form>

        <Table<RunRecord>
          columns={runColumns}
          dataSource={runsRequest.data || []}
          loading={runsRequest.loading}
          rowKey="id"
          locale={{ emptyText: <EmptyInline description={t('No runs yet')} /> }}
          pagination={false}
        />
      </Space>

      <Drawer
        title={selectedRun ? selectedRun.runCode : t('Run details')}
        open={detailOpen}
        onClose={closeRunDetails}
        width={1040}
        extra={selectedRun && isCancelableRun(selectedRun) ? renderCancelButton(selectedRun) : null}
        destroyOnClose
      >
        {runDetailsRequest.loading || (detailOpen && selectedRunId && !activeRunDetails) ? <Spin /> : null}
        {activeRunDetails ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={2} title={t('Run summary')}>
              <Descriptions.Item label={t('Status')}>{statusTag(activeRunDetails.run.status)}</Descriptions.Item>
              <Descriptions.Item label={t('Agent')}>
                {[activeRunDetails.run.nodeId, activeRunDetails.run.agentProfileId].filter(Boolean).join(' / ') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('Requested at')}>
                {formatDateTime(activeRunDetails.run.requestedAt)}
              </Descriptions.Item>
              <Descriptions.Item label={t('Started at')}>
                {formatDateTime(activeRunDetails.run.startedAt)}
              </Descriptions.Item>
              <Descriptions.Item label={t('Finished at')}>
                {formatDateTime(activeRunDetails.run.finishedAt)}
              </Descriptions.Item>
              <Descriptions.Item label={t('Terminal status')}>
                {activeRunDetails.run.terminalStatus ? statusTag(activeRunDetails.run.terminalStatus) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('Agent session')} span={2}>
                <RunSessionSummary run={activeRunDetails.run} t={t} />
                {!activeRunDetails.run.agentSessionId &&
                !activeRunDetails.run.agentSessionProvider &&
                !activeRunDetails.run.agentSessionProviderId ? (
                  <Typography.Text type="secondary" style={{ display: 'block' }}>
                    {t('No agent session')}
                  </Typography.Text>
                ) : null}
              </Descriptions.Item>
              <Descriptions.Item label={t('Continuation')} span={2}>
                {[activeRunDetails.run.continuationReason, activeRunDetails.run.parentRunId]
                  .filter(Boolean)
                  .join(' / ') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('Last terminal activity')}>
                {formatDateTime(activeRunDetails.run.terminalLastActivityAt)}
              </Descriptions.Item>
              <Descriptions.Item label={t('Error summary')}>
                {redactPreviewText(activeRunDetails.run.errorSummary) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('Result summary')} span={2}>
                <JsonPreview value={activeRunDetails.run.resultSummaryJson} />
              </Descriptions.Item>
            </Descriptions>

            <AgentTimeline
              t={t}
              events={timelineEvents}
              legacyEvents={activeRunDetails.events}
              useLegacyFallback={useLegacyTimelineFallback}
              warning={timelineWarning}
            />

            <AgentSessionResumeBox
              run={activeRunDetails.run}
              t={t}
              loading={resumeSessionRequest.loading}
              onResume={async (input) => {
                await resumeSessionRequest.runAsync({
                  run: activeRunDetails.run,
                  ...input,
                });
              }}
            />

            {showTerminalStreamSmoke ? <TerminalStreamSmokePanel runId={activeRunDetails.run.id} /> : null}

            <FastCollapse
              defaultActiveKey={['live-output']}
              openMotion={NO_COLLAPSE_MOTION}
              items={[
                {
                  key: 'live-output',
                  label: t('Live CLI Output'),
                  children: (
                    <TerminalPanel
                      runId={activeRunDetails.run.id}
                      t={t}
                      snapshot={terminalSnapshot}
                      stream={terminalStream}
                      loading={terminalSnapshotRequest.loading}
                      interrupting={interruptTerminalRequest.loading}
                      terminating={terminateTerminalRequest.loading}
                      onRefresh={refreshTerminalSnapshot}
                      onInterrupt={interruptTerminalRequest.run}
                      onTerminate={terminateTerminalRequest.run}
                    />
                  ),
                },
              ]}
            />

            <Tabs
              defaultActiveKey="logs"
              items={[
                {
                  key: 'logs',
                  label: t('Logs'),
                  forceRender: true,
                  children: (
                    <LogsPanel
                      t={t}
                      events={activeRunDetails.events}
                      apiCallLogs={activeRunDetails.apiCallLogs}
                      eventsWarning={activeRunDetails.warnings.events}
                      apiCallLogsWarning={activeRunDetails.warnings.apiCallLogs}
                    />
                  ),
                },
                {
                  key: 'artifacts',
                  label: t('Artifacts'),
                  forceRender: true,
                  children: (
                    <ArtifactsPanel
                      t={t}
                      artifacts={activeRunDetails.artifacts}
                      snapshots={activeRunDetails.snapshots}
                      artifactsWarning={activeRunDetails.warnings.artifacts}
                      snapshotsWarning={activeRunDetails.warnings.snapshots}
                    />
                  ),
                },
              ]}
            />
          </Space>
        ) : null}
      </Drawer>
    </section>
  );
}
