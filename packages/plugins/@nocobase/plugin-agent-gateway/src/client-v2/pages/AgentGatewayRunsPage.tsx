/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EyeOutlined, ReloadOutlined, SearchOutlined, StopOutlined } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import {
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
  Tooltip,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useMemo, useState } from 'react';
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

export default function AgentGatewayRunsPage() {
  const t = useT();
  const ctx = useFlowContext() as unknown as AgentGatewayContext;
  const [filterForm] = Form.useForm<RunFilterFormValues>();
  const [runFilters, setRunFilters] = useState<Record<string, unknown>>({});
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRunId, setSelectedRunId] = useState<string>();

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

  const openRunDetails = useCallback((run: RunRecord) => {
    setSelectedRunId(run.id);
    setDetailOpen(true);
  }, []);

  const closeRunDetails = useCallback(() => {
    setDetailOpen(false);
    setSelectedRunId(undefined);
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
        render: (value: string | undefined) => statusTag(value),
      },
      {
        title: t('Node ID'),
        dataIndex: 'nodeId',
        key: 'nodeId',
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: t('Profile ID'),
        dataIndex: 'agentProfileId',
        key: 'agentProfileId',
        render: (value: string | null | undefined) => value || '-',
      },
      {
        title: t('Source'),
        dataIndex: 'sourceType',
        key: 'sourceType',
        render: (value: string | null | undefined, record) =>
          [value, record.sourceCollection, record.sourceRecordId].filter(Boolean).join(' / ') || '-',
      },
      {
        title: t('Requested at'),
        dataIndex: 'requestedAt',
        key: 'requestedAt',
        render: (value: string | undefined) => formatDateTime(value),
      },
      {
        title: t('Finished at'),
        dataIndex: 'finishedAt',
        key: 'finishedAt',
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
        title={t('Run details')}
        open={detailOpen}
        onClose={closeRunDetails}
        width={960}
        extra={selectedRun && isCancelableRun(selectedRun) ? renderCancelButton(selectedRun) : null}
        destroyOnClose
      >
        {runDetailsRequest.loading ? <Spin /> : null}
        {runDetailsRequest.data ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={2} title={t('Run summary')}>
              <Descriptions.Item label={t('Run code')}>{runDetailsRequest.data.run.runCode}</Descriptions.Item>
              <Descriptions.Item label={t('Status')}>{statusTag(runDetailsRequest.data.run.status)}</Descriptions.Item>
              <Descriptions.Item label={t('Node ID')}>{runDetailsRequest.data.run.nodeId || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('Profile ID')}>
                {runDetailsRequest.data.run.agentProfileId || '-'}
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
              <Descriptions.Item label={t('Error summary')}>
                {redactPreviewText(runDetailsRequest.data.run.errorSummary) || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('Result summary')} span={2}>
                <JsonPreview value={runDetailsRequest.data.run.resultSummaryJson} />
              </Descriptions.Item>
            </Descriptions>

            <Collapse
              defaultActiveKey={['events', 'artifacts', 'snapshots', 'apiCallLogs']}
              items={[
                {
                  key: 'events',
                  label: t('Events'),
                  children: runDetailsRequest.data.events.length ? (
                    <Table<RunEventRecord>
                      columns={[
                        { title: t('Sequence'), dataIndex: 'sequence', key: 'sequence' },
                        { title: t('Source'), dataIndex: 'source', key: 'source' },
                        { title: t('Level'), dataIndex: 'level', key: 'level' },
                        { title: t('Type'), dataIndex: 'eventType', key: 'eventType' },
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
                          render: (value: string | undefined) => formatDateTime(value),
                        },
                      ]}
                      dataSource={runDetailsRequest.data.events}
                      rowKey="id"
                      pagination={false}
                    />
                  ) : (
                    <EmptyInline description={t('No events yet')} />
                  ),
                },
                {
                  key: 'artifacts',
                  label: t('Artifacts'),
                  children: runDetailsRequest.data.artifacts.length ? (
                    <List
                      dataSource={runDetailsRequest.data.artifacts}
                      renderItem={(artifact) => (
                        <List.Item>
                          <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <Typography.Text strong>
                              {[artifact.artifactKey, artifact.artifactType, artifact.mimeType]
                                .filter(Boolean)
                                .join(' / ') || artifact.id}
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
                  ),
                },
                {
                  key: 'snapshots',
                  label: t('Snapshots'),
                  children: runDetailsRequest.data.snapshots.length ? (
                    <List
                      dataSource={runDetailsRequest.data.snapshots}
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
                  ),
                },
                {
                  key: 'apiCallLogs',
                  label: t('API call logs'),
                  children: runDetailsRequest.data.apiCallLogs.length ? (
                    <Table<ApiCallLogRecord>
                      columns={[
                        { title: t('Method'), dataIndex: 'method', key: 'method' },
                        { title: t('Path'), dataIndex: 'path', key: 'path' },
                        { title: t('Status code'), dataIndex: 'statusCode', key: 'statusCode' },
                        { title: t('Duration ms'), dataIndex: 'durationMs', key: 'durationMs' },
                        {
                          title: t('Created at'),
                          dataIndex: 'createdAt',
                          key: 'createdAt',
                          render: (value: string | undefined) => formatDateTime(value),
                        },
                        {
                          title: t('Error summary'),
                          dataIndex: 'errorSummary',
                          key: 'errorSummary',
                          render: (value: string | null | undefined) => value || '-',
                        },
                      ]}
                      expandable={{
                        expandedRowRender: (record) => (
                          <Space direction="vertical" size={8} style={{ width: '100%' }}>
                            <Typography.Text strong>{t('Request summary')}</Typography.Text>
                            <JsonPreview value={record.requestSummaryJson} />
                            <Typography.Text strong>{t('Response summary')}</Typography.Text>
                            <JsonPreview value={record.responseSummaryJson} />
                          </Space>
                        ),
                      }}
                      dataSource={runDetailsRequest.data.apiCallLogs}
                      rowKey="id"
                      pagination={false}
                    />
                  ) : (
                    <EmptyInline description={t('No API call logs yet')} />
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
