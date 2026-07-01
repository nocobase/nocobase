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
  SendOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import {
  Alert,
  Button,
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
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useT } from '../locale';
import {
  AgentGatewayContext,
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
  events: RunEventRecord[];
  artifacts: RunArtifactRecord[];
  snapshots: RunSnapshotRecord[];
  apiCallLogs: ApiCallLogRecord[];
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

const terminalOutputStyle: React.CSSProperties = {
  minHeight: 420,
  maxHeight: 520,
  overflow: 'auto',
  margin: 0,
  padding: 12,
  borderRadius: 6,
  background: '#111827',
  color: '#d1d5db',
  fontFamily: 'SFMono-Regular, Consolas, Liberation Mono, Menlo, monospace',
  fontSize: 12,
  lineHeight: 1.55,
  whiteSpace: 'pre-wrap',
};

function isCancelableRun(run: RunRecord) {
  return CANCELABLE_STATUSES.has(run.status);
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

function TerminalPanel({
  t,
  snapshot,
  loading,
  terminalInput,
  sending,
  interrupting,
  terminating,
  onInputChange,
  onRefresh,
  onSend,
  onInterrupt,
  onTerminate,
}: {
  t: TFunction;
  snapshot: TerminalSnapshot | null | undefined;
  loading: boolean;
  terminalInput: string;
  sending: boolean;
  interrupting: boolean;
  terminating: boolean;
  onInputChange(value: string): void;
  onRefresh(): void;
  onSend(): void;
  onInterrupt(): void;
  onTerminate(): void;
}) {
  const output = snapshot?.output || '';
  const terminalAvailable = Boolean(snapshot?.available);
  const inputEnabled = Boolean(snapshot?.inputEnabled);

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
        <Space wrap>
          <Typography.Text type="secondary">{snapshot?.sessionName || '-'}</Typography.Text>
          {snapshot?.terminalStatus ? statusTag(snapshot.terminalStatus) : null}
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
      <pre aria-label={t('Terminal output')} style={terminalOutputStyle}>
        {output || t('No terminal output yet')}
      </pre>

      <Space.Compact style={{ width: '100%' }}>
        <Input.TextArea
          aria-label={t('Terminal input')}
          value={terminalInput}
          autoSize={{ minRows: 2, maxRows: 4 }}
          disabled={!inputEnabled}
          onChange={(event) => onInputChange(event.target.value)}
        />
        <Button
          aria-label={t('Send terminal input')}
          type="primary"
          icon={<SendOutlined />}
          loading={sending}
          disabled={!inputEnabled || !terminalInput.trim()}
          onClick={onSend}
        >
          {t('Send')}
        </Button>
      </Space.Compact>
    </Space>
  );
}

function LogsPanel({
  t,
  events,
  apiCallLogs,
}: {
  t: TFunction;
  events: RunEventRecord[];
  apiCallLogs: ApiCallLogRecord[];
}) {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
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
}: {
  t: TFunction;
  artifacts: RunArtifactRecord[];
  snapshots: RunSnapshotRecord[];
}) {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
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
  const [filterForm] = Form.useForm<RunFilterFormValues>();
  const [runFilters, setRunFilters] = useState<Record<string, unknown>>({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string>();
  const [terminalInput, setTerminalInput] = useState('');

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

  const runDetailsRequest = useRequest(
    async () => {
      if (!selectedRunId || !detailOpen) {
        return null;
      }

      const [runResponse, eventsResponse, artifactsResponse, snapshotsResponse, apiCallLogsResponse] =
        await Promise.all([
          ctx.api.request<RunRecord>({
            url: `agent-gateway/runs:get/${encodeURIComponent(selectedRunId)}`,
            method: 'get',
          }),
          ctx.api.request<RunEventRecord[]>({
            url: `agent-gateway/runs/${encodeURIComponent(selectedRunId)}/events:list`,
            method: 'get',
          }),
          ctx.api.request<RunArtifactRecord[]>({
            url: `agent-gateway/runs/${encodeURIComponent(selectedRunId)}/artifacts:list`,
            method: 'get',
          }),
          ctx.api.request<RunSnapshotRecord[]>({
            url: `agent-gateway/runs/${encodeURIComponent(selectedRunId)}/snapshots:list`,
            method: 'get',
          }),
          ctx.api.request<ApiCallLogRecord[]>({
            url: `agent-gateway/runs/${encodeURIComponent(selectedRunId)}/api-call-logs:list`,
            method: 'get',
          }),
        ]);

      return {
        run: getRequiredResponseData(runResponse, t('Failed to load run details')),
        events: getResponseData(eventsResponse, []),
        artifacts: getResponseData(artifactsResponse, []),
        snapshots: getResponseData(snapshotsResponse, []),
        apiCallLogs: getResponseData(apiCallLogsResponse, []),
      } satisfies RunDetails;
    },
    {
      refreshDeps: [selectedRunId, detailOpen],
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to load run details')));
      },
    },
  );

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

  const sendTerminalRequest = useRequest(
    async () => {
      if (!selectedRunId) {
        return null;
      }
      await ctx.api.request({
        url: `agent-gateway/runs/${encodeURIComponent(selectedRunId)}/terminal:send`,
        method: 'post',
        data: {
          input: terminalInput,
          appendEnter: true,
        },
      });
      return true;
    },
    {
      manual: true,
      onSuccess() {
        setTerminalInput('');
        refreshTerminalSnapshot();
        runDetailsRequest.refresh();
        ctx.message?.success(t('Terminal input sent'));
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to send terminal input')));
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

  useEffect(() => {
    if (!detailOpen || !selectedRunId) {
      return;
    }

    refreshTerminalSnapshot();
    const timer = window.setInterval(() => {
      refreshTerminalSnapshot();
    }, 2000);
    return () => window.clearInterval(timer);
  }, [detailOpen, refreshTerminalSnapshot, selectedRunId]);

  const openRunDetails = useCallback((run: RunRecord) => {
    setSelectedRunId(run.id);
    setDetailOpen(true);
  }, []);

  const closeRunDetails = useCallback(() => {
    setDetailOpen(false);
    setSelectedRunId(undefined);
    setTerminalInput('');
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

  const selectedRun = runDetailsRequest.data?.run || runsRequest.data?.find((run) => run.id === selectedRunId);
  const terminalSnapshot = terminalSnapshotRequest.data;

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
        {runDetailsRequest.loading ? <Spin /> : null}
        {runDetailsRequest.data ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={2} title={t('Run summary')}>
              <Descriptions.Item label={t('Status')}>{statusTag(runDetailsRequest.data.run.status)}</Descriptions.Item>
              <Descriptions.Item label={t('Agent')}>
                {[runDetailsRequest.data.run.nodeId, runDetailsRequest.data.run.agentProfileId]
                  .filter(Boolean)
                  .join(' / ') || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('Requested at')}>
                {formatDateTime(runDetailsRequest.data.run.requestedAt)}
              </Descriptions.Item>
              <Descriptions.Item label={t('Started at')}>
                {formatDateTime(runDetailsRequest.data.run.startedAt)}
              </Descriptions.Item>
              <Descriptions.Item label={t('Finished at')}>
                {formatDateTime(runDetailsRequest.data.run.finishedAt)}
              </Descriptions.Item>
              <Descriptions.Item label={t('Terminal status')}>
                {runDetailsRequest.data.run.terminalStatus ? statusTag(runDetailsRequest.data.run.terminalStatus) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('Last terminal activity')}>
                {formatDateTime(runDetailsRequest.data.run.terminalLastActivityAt)}
              </Descriptions.Item>
              <Descriptions.Item label={t('Error summary')}>
                {redactPreviewText(runDetailsRequest.data.run.errorSummary) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('Result summary')} span={2}>
                <JsonPreview value={runDetailsRequest.data.run.resultSummaryJson} />
              </Descriptions.Item>
            </Descriptions>

            <Tabs
              defaultActiveKey="terminal"
              items={[
                {
                  key: 'terminal',
                  label: t('Terminal'),
                  children: (
                    <TerminalPanel
                      t={t}
                      snapshot={terminalSnapshot}
                      loading={terminalSnapshotRequest.loading}
                      terminalInput={terminalInput}
                      sending={sendTerminalRequest.loading}
                      interrupting={interruptTerminalRequest.loading}
                      terminating={terminateTerminalRequest.loading}
                      onInputChange={setTerminalInput}
                      onRefresh={refreshTerminalSnapshot}
                      onSend={sendTerminalRequest.run}
                      onInterrupt={interruptTerminalRequest.run}
                      onTerminate={terminateTerminalRequest.run}
                    />
                  ),
                },
                {
                  key: 'logs',
                  label: t('Logs'),
                  forceRender: true,
                  children: (
                    <LogsPanel
                      t={t}
                      events={runDetailsRequest.data.events}
                      apiCallLogs={runDetailsRequest.data.apiCallLogs}
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
                      artifacts={runDetailsRequest.data.artifacts}
                      snapshots={runDetailsRequest.data.snapshots}
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
