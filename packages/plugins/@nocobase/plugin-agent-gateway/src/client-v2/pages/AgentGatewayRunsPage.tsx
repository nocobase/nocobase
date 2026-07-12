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
  ImportOutlined,
  PoweroffOutlined,
  PlusOutlined,
  ReloadOutlined,
  StopOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { Collection, type CollectionOptions, type DataSource, useFlowContext } from '@nocobase/flow-engine';
import { CollectionFilter, type CompiledFilter } from '@nocobase/client-v2';
import { useRequest } from 'ahooks';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  List,
  Modal,
  Pagination,
  Select,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
  Upload,
} from 'antd';
import type { TableProps, UploadProps } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import type { CSSMotionProps } from 'rc-motion';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AgentCapabilityKey,
  isAgentCapabilitySupported,
  normalizeAgentProviderCapabilities,
} from '../../shared/providerCapabilities';
import {
  ACTIVE_RUN_STATUSES as ACTIVE_RUN_STATUS_VALUES,
  CLAIMABLE_RUN_STATUS,
  HEARTBEAT_RUN_STATUSES,
  IMPORTING_RUN_STATUS,
  LEASE_OWNING_RUN_STATUSES,
  STALLED_RUN_STATUS,
  TERMINAL_CONTROL_RUN_STATUSES as TERMINAL_CONTROL_RUN_STATUS_VALUES,
} from '../../shared/runState';
import { AgentTimeline, AgentTimelineEventRecord } from '../components/AgentTimeline';
import { AgentSessionResumeBox, AgentSessionResumeInput } from '../components/AgentSessionResumeBox';
import { LazyReadonlyXtermOutput } from '../components/LazyReadonlyXtermOutput';
import { TerminalStreamSmokePanel, isTerminalStreamSmokeEnabled } from '../components/TerminalStreamSmokePanel';
import {
  ApiCallLogRecord,
  ArtifactContentEntry,
  DetailPageMeta,
  RunArtifactRecord,
  RunEventRecord,
  RunSnapshotRecord,
  createDetailPageMeta,
  useRunObservabilityDetails,
} from '../hooks/useRunObservabilityDetails';
import { useTerminalStream, UseTerminalStreamState } from '../hooks/useTerminalStream';
import { useT } from '../locale';
import {
  AgentGatewayTaskParameterFormItems,
  BuildRunOptions,
  BuildSkillVersionOption,
  BuildTaskArtifactDeclarationFormValue,
  getBuildRunnerSelectOptions,
  getBuildSkillVersionSelectOptions,
  getDefaultBuildRunnerValue,
  getOptionalFormString,
  getTaskArtifactDeclarations,
  getTaskArtifactFormValues,
  hasSelectableBuildRunner,
  OPENCODE_UI_BATCH_SKILL_KEY,
  parseBuildRunnerValue,
} from './AgentGatewayTaskParameterFormItems';
import {
  AgentGatewayContext,
  JsonPreview,
  JsonRecord,
  formatDateTime,
  getApiErrorMessage,
  getObjectRecord,
  getRequiredResponseData,
  getResponseData,
  redactExternalUrlPreviewJson,
  redactPreviewText,
  statusTag,
  uploadAgentGatewayFile,
} from './AgentGatewayPageUtils';

interface RunRecord {
  id: string;
  runCode: string;
  taskTitle?: string | null;
  status: string;
  nodeId?: string | null;
  agentProfileId?: string | null;
  sourceType?: string | null;
  sourceCollection?: string | null;
  sourceRecordId?: string | null;
  taskTemplateId?: string | null;
  taskTemplateJson?: RunTaskTemplateSummary | null;
  cancelRequested?: boolean;
  resultSummaryJson?: JsonRecord;
  tokenUsageJson?: TokenUsageRecord | null;
  errorSummary?: string | null;
  terminalBackend?: string | null;
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
  agentProvider?: string | null;
  agentProviderCapabilitySource?: string | null;
  agentProviderCapabilitiesJson?: JsonRecord;
  agentSessionCapabilitiesJson?: JsonRecord;
  agentGatewayActionPermissionsJson?: {
    resumeAgentSession?: boolean;
    readSessionMessages?: boolean;
    readTerminal?: boolean;
    readArtifacts?: boolean;
    readRawLogs?: boolean;
    cancelRun?: boolean;
  };
  agentGatewayControlActionsJson?: {
    interruptRun?: boolean;
    terminateRun?: boolean;
  };
  runnerStatusJson?: RunnerStatusRecord;
  requestedAt?: string;
  queuedAt?: string;
  claimedAt?: string;
  startedAt?: string;
  finishedAt?: string;
  createdAt?: string;
}

interface RunTaskTemplateSummary {
  id: string;
  templateKey: string;
  displayName?: string;
  skillVersionIds?: string[];
  skills?: BuildSkillVersionOption[];
}

interface TaskTemplateDetailRecord {
  id: string;
  templateKey: string;
  displayName?: string | null;
  description?: string | null;
  status?: string | null;
  defaultTitle?: string | null;
  defaultPrompt?: string | null;
  cwd?: string | null;
  skillVersionIdsJson?: string[];
  artifactRoot?: string | null;
  artifactsJson?: JsonRecord[];
}

interface SkillVersionDetailRecord {
  id: string;
  skillVersionId?: string;
  skillId?: string | null;
  skillKey?: string | null;
  displayName?: string | null;
  skillStatus?: string | null;
  versionLabel?: string;
  status?: string;
  sourceType?: string | null;
  sourceSha256?: string | null;
  sourceSizeBytes?: number | null;
  sourceUploadedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

interface TokenUsageRecord extends JsonRecord {
  inputTokens?: number | string | null;
  cachedInputTokens?: number | string | null;
  outputTokens?: number | string | null;
  reasoningOutputTokens?: number | string | null;
  totalTokens?: number | string | null;
}

interface TerminalSnapshot {
  backend?: string | null;
  terminalStatus?: string | null;
  runStatus?: string;
  available: boolean;
  output: string;
  capturedAt: string;
  inputEnabled: boolean;
  unsupported?: boolean;
  unsupportedCapability?: AgentCapabilityKey;
  message?: string;
}

interface TerminalSnapshotState {
  runId: string;
  snapshot: TerminalSnapshot | null;
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

type RunActionPermissionKey = keyof NonNullable<RunRecord['agentGatewayActionPermissionsJson']>;

interface ResumeAgentSessionResult {
  runId: string;
  runCode?: string;
  agentSessionId: string;
  parentRunId?: string;
  resumedFromRunId?: string;
  deduped: boolean;
}

interface ControlRequestResult {
  runId?: string;
  controlRequestId?: string;
  controlRequestStatus?: 'accepted' | 'delivered' | 'succeeded' | 'failed';
}

interface ControlRequestState {
  action: 'interrupt' | 'terminate';
  runId: string;
  status: 'accepted' | 'delivered' | 'succeeded' | 'failed';
  controlRequestId?: string;
}

interface ControlRequestStatusPoll {
  action: 'interrupt' | 'terminate';
  runId: string;
  controlRequestId: string;
}

interface RunnerStatusRecord {
  online?: boolean;
  reason?: string;
  nodeId?: string | null;
  nodeKey?: string | null;
  nodeStatus?: string | null;
  lastHeartbeatAt?: string | null;
  agentProfileId?: string | null;
  profileKey?: string | null;
  profileProvider?: string | null;
  profileStatus?: string | null;
}

interface RunListMeta {
  count?: number;
  page?: number;
  pageSize?: number;
  totalPage?: number;
  taskTemplates?: RunTaskTemplateFilterOption[];
}

interface RunListData {
  runs: RunRecord[];
  meta: RunListMeta;
}

interface RunTaskTemplateFilterOption {
  id: string;
  templateKey?: string;
  displayName?: string;
}

type RunDetailTabKey = 'summary' | 'agent-sessions' | 'logs' | 'artifacts' | 'api-logs';

interface BuildTaskFormValues {
  taskTemplateId?: string;
  title?: string;
  prompt?: string;
  skillVersionIds?: string[];
  runner?: string;
  cwd?: string;
  artifactRoot?: string;
  artifactDeclarations?: BuildTaskArtifactDeclarationFormValue[];
}

interface SkillUploadFormValues {
  skillKey?: string;
  displayName?: string;
  versionLabel?: string;
}

interface SkillUploadResult {
  skillId?: string;
  skillKey?: string;
  skillVersionId: string;
  versionLabel?: string;
  status?: string;
  idempotent?: boolean;
}

interface CreateBuildRunResult {
  runId: string;
  runCode?: string;
  run?: RunRecord;
  runnerStatus?: RunnerStatusRecord;
}

interface ExternalRunImportFormValues {
  provider?: string;
  format?: string;
  title?: string;
  instruction?: string;
  status?: string;
  externalRunKey: string;
  providerSessionId?: string;
  sourceCollection?: string;
  sourceRecordId?: string;
  outputAgentRunField?: string;
}

interface ExternalRunImportResult {
  runId?: string;
  runCode?: string;
  run?: RunRecord;
  deduped?: boolean;
}

type ReadableArtifactItemKind = 'message' | 'tool' | 'error' | 'event';

interface ReadableArtifactItem {
  key: string;
  kind: ReadableArtifactItemKind;
  label: string;
  text: string;
  defaultOpen: boolean;
}

interface ReadableArtifactPreview {
  mode: 'jsonl' | 'json' | 'text';
  summary: string;
  items: ReadableArtifactItem[];
  text: string;
  rawPreview: string;
  rawTruncated: boolean;
}

type TFunction = (key: string, options?: Record<string, unknown>) => string;
type AgentGatewayPageContext = AgentGatewayContext & {
  dataSourceManager?: {
    getDataSource(key: string): DataSource | undefined;
  };
};

const RUN_STATUS_OPTIONS = [
  'queued',
  'claimed',
  'syncing_skills',
  'running',
  IMPORTING_RUN_STATUS,
  'finalizing',
  'canceling',
  'stalled',
  'succeeded',
  'failed',
  'canceled',
  'timeout',
  'abandoned',
];

const CANCELABLE_STATUSES = new Set<string>([
  CLAIMABLE_RUN_STATUS,
  IMPORTING_RUN_STATUS,
  ...HEARTBEAT_RUN_STATUSES,
  STALLED_RUN_STATUS,
]);
const TERMINAL_CONTROL_RUN_STATUSES = new Set<string>(TERMINAL_CONTROL_RUN_STATUS_VALUES);
const LEGACY_TIMELINE_FALLBACK_STATUSES = new Set(['succeeded']);
const LIVE_RUN_STATUSES = new Set<string>([CLAIMABLE_RUN_STATUS, IMPORTING_RUN_STATUS, ...LEASE_OWNING_RUN_STATUSES]);
const DANGLING_TOOL_LIVE_RUN_STATUSES = new Set<string>([
  CLAIMABLE_RUN_STATUS,
  IMPORTING_RUN_STATUS,
  ...ACTIVE_RUN_STATUS_VALUES,
]);
const RUN_DETAIL_QUERY_PARAM = 'runId';
const TASK_TEMPLATE_DETAIL_QUERY_PARAM = 'templateId';
const SKILL_VERSION_DETAIL_QUERY_PARAM = 'skillVersionId';
const DEFAULT_RUNS_PAGE_SIZE = 20;
const DETAIL_PAGE_SIZE_OPTIONS = ['10', '20', '50', '100'];
const TASK_RUN_DRAWER_WIDTH = 1040;
const SKILL_DETAIL_DRAWER_WIDTH = 720;
const DEFAULT_SKILL_UPLOAD_FORM_VALUES: SkillUploadFormValues = {
  skillKey: OPENCODE_UI_BATCH_SKILL_KEY,
  displayName: 'NB OpenCode UI Batch',
  versionLabel: 'local',
};
const DEFAULT_EXTERNAL_RUN_IMPORT_FORM_VALUES: ExternalRunImportFormValues = {
  provider: 'codex',
  format: 'codex-jsonl',
  status: 'succeeded',
  externalRunKey: '',
};
const RUNS_FILTER_FIELD_NAMES = ['taskTemplateId', 'status', 'nodeId', 'agentProfileId', 'createdAt'];
const RUN_SORT_FALLBACK = '-createdAt';

function getRunsFilterCollectionOptions(
  taskTemplateOptions: Array<{ label: string; value: string }>,
): CollectionOptions {
  return {
    name: 'agentGatewayRunsFilter',
    title: '{{t("Runs")}}',
    filterTargetKey: 'id',
    fields: [
      {
        type: 'string',
        name: 'taskTemplateId',
        interface: 'select',
        uiSchema: {
          type: 'string',
          title: '{{t("Task template")}}',
          'x-component': 'Select',
          enum: taskTemplateOptions,
        },
      },
      {
        type: 'string',
        name: 'status',
        interface: 'select',
        uiSchema: {
          type: 'string',
          title: '{{t("Status")}}',
          'x-component': 'Select',
          enum: RUN_STATUS_OPTIONS.map((status) => ({
            label: status,
            value: status,
          })),
        },
      },
      {
        type: 'string',
        name: 'nodeId',
        interface: 'input',
        uiSchema: {
          type: 'string',
          title: '{{t("Node ID")}}',
          'x-component': 'Input',
        },
      },
      {
        type: 'string',
        name: 'agentProfileId',
        interface: 'input',
        uiSchema: {
          type: 'string',
          title: '{{t("Profile ID")}}',
          'x-component': 'Input',
        },
      },
      {
        type: 'date',
        name: 'createdAt',
        interface: 'createdAt',
        uiSchema: {
          type: 'datetime',
          title: '{{t("Created at")}}',
          'x-component': 'DatePicker',
        },
      },
    ],
  };
}

function readFileAsText(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => {
      reject(reader.error || new Error('Failed to read file'));
    };
    reader.readAsText(file);
  });
}

function getSkillVersionIds(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && Boolean(item)) : [];
}
const ARTIFACT_PREVIEW_MAX_ITEMS = 80;
const ARTIFACT_ITEM_TEXT_MAX_CHARS = 4000;
const ARTIFACT_RAW_PREVIEW_MAX_CHARS = 24 * 1024;
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

function isLiveRunStatus(status?: string) {
  return Boolean(status && LIVE_RUN_STATUSES.has(status));
}

function shouldCloseDanglingToolCalls(status?: string) {
  return !status || !DANGLING_TOOL_LIVE_RUN_STATUSES.has(status);
}

function getTimestampMs(value?: string | null) {
  if (!value) {
    return null;
  }
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

function getRunDurationStart(run: RunRecord) {
  return run.startedAt || run.claimedAt || run.queuedAt || run.requestedAt || run.createdAt;
}

function formatCompactDuration(durationMs: number) {
  const totalSeconds = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, '0')}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  }
  return `${seconds}s`;
}

function formatRunDuration(run: RunRecord, nowMs = Date.now()) {
  const startMs = getTimestampMs(getRunDurationStart(run));
  if (startMs === null) {
    return '-';
  }
  const finishedMs = getTimestampMs(run.finishedAt);
  const endMs = finishedMs ?? (isLiveRunStatus(run.status) ? nowMs : null);
  if (endMs === null) {
    return '-';
  }
  return formatCompactDuration(endMs - startMs);
}

function getTokenUsageNumber(value: unknown) {
  const numberValue = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(numberValue) && numberValue >= 0 ? numberValue : null;
}

function formatTokenCount(value: unknown) {
  const numberValue = getTokenUsageNumber(value);
  if (numberValue === null) {
    return '-';
  }
  if (numberValue >= 1_000_000) {
    return `${(numberValue / 1_000_000).toFixed(1)}M`;
  }
  if (numberValue >= 1_000) {
    return `${(numberValue / 1_000).toFixed(1)}K`;
  }
  return String(Math.round(numberValue));
}

function getTokenUsageTotal(usage?: TokenUsageRecord | null) {
  if (!usage) {
    return null;
  }
  const totalTokens = getTokenUsageNumber(usage.totalTokens);
  if (totalTokens !== null) {
    return totalTokens;
  }
  const inputTokens = getTokenUsageNumber(usage.inputTokens);
  const outputTokens = getTokenUsageNumber(usage.outputTokens);
  if (inputTokens !== null || outputTokens !== null) {
    return (inputTokens || 0) + (outputTokens || 0);
  }
  return null;
}

function hasTokenUsage(usage?: TokenUsageRecord | null) {
  return getTokenUsageTotal(usage) !== null || getTokenUsageNumber(usage?.cachedInputTokens) !== null;
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

function getTimelineEmptyDescription(run: RunRecord | undefined, t: TFunction) {
  if (isLiveRunStatus(run?.status)) {
    return t('Waiting for live task updates from the agent');
  }
  return t('No task messages yet');
}

function canUseTerminalControl(run: RunRecord | undefined, snapshot: TerminalSnapshot | null | undefined) {
  if (!run || !TERMINAL_CONTROL_RUN_STATUSES.has(run.status)) {
    return false;
  }
  const outputUnsupported = snapshot?.unsupportedCapability === 'terminalOutput';
  const backend = outputUnsupported ? run.terminalBackend : snapshot?.backend ?? run.terminalBackend;
  const terminalStatus = outputUnsupported ? run.terminalStatus : snapshot?.terminalStatus ?? run.terminalStatus;
  return backend === 'tmux' && terminalStatus === 'active' && (outputUnsupported || snapshot?.available !== false);
}

function createControlIdempotencyKey(action: 'interrupt' | 'terminate', runId: string) {
  const randomValue = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  return `ag_control:${action}:${runId}:${randomValue}`;
}

function isFinalControlStatus(status?: ControlRequestState['status']) {
  return status === 'succeeded' || status === 'failed';
}

function getHttpErrorStatus(error: unknown) {
  const status = getObjectRecord(getObjectRecord(error).response).status;
  return typeof status === 'number' ? status : null;
}

function shouldResetControlIdempotencyKey(error: unknown) {
  const status = getHttpErrorStatus(error);
  return status !== null && status >= 400 && status < 500;
}

function getNumberMetaValue(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function getRunTaskTemplateMetaOptions(value: unknown): RunTaskTemplateFilterOption[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => {
      const record = getObjectRecord(item);
      return {
        id: getStringValue(record.id),
        templateKey: getStringValue(record.templateKey),
        displayName: getStringValue(record.displayName),
      };
    })
    .filter((template) => Boolean(template.id));
}

function getRunListMeta(value: unknown): RunListMeta {
  const record = getObjectRecord(value);
  return {
    count: getNumberMetaValue(record.count),
    page: getNumberMetaValue(record.page),
    pageSize: getNumberMetaValue(record.pageSize),
    totalPage: getNumberMetaValue(record.totalPage),
    taskTemplates: getRunTaskTemplateMetaOptions(record.taskTemplates),
  };
}

function getRunTaskTemplateFilterOptions(runListData: RunListData) {
  const optionsById = new Map<string, { label: string; value: string }>();
  const addTemplate = (template: RunTaskTemplateFilterOption | RunTaskTemplateSummary | null | undefined) => {
    if (!template?.id) {
      return;
    }
    optionsById.set(template.id, {
      value: template.id,
      label: template.displayName || template.templateKey || template.id,
    });
  };

  for (const template of runListData.meta.taskTemplates || []) {
    addTemplate(template);
  }
  for (const run of runListData.runs) {
    addTemplate(run.taskTemplateJson);
  }

  return [...optionsById.values()].sort((left, right) => left.label.localeCompare(right.label));
}

function getRunSortParam(sorter: Parameters<NonNullable<TableProps<RunRecord>['onChange']>>[2]) {
  const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
  if (!activeSorter?.order) {
    return undefined;
  }
  const columnKey = typeof activeSorter.columnKey === 'string' ? activeSorter.columnKey : '';
  const field = typeof activeSorter.field === 'string' ? activeSorter.field : '';
  const sortField = columnKey || field;
  if (!sortField) {
    return undefined;
  }
  return activeSorter.order === 'descend' ? `-${sortField}` : sortField;
}

function getRunColumnSortOrder(runSort: string | undefined, columnKey: string) {
  if (runSort === columnKey) {
    return 'ascend' as const;
  }
  if (runSort === `-${columnKey}`) {
    return 'descend' as const;
  }
  return null;
}

function EmptyInline({ description }: { description: string }) {
  return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={description} />;
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

function getTaskTemplateIdFromLocationSearch() {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return new URLSearchParams(window.location.search).get(TASK_TEMPLATE_DETAIL_QUERY_PARAM) || undefined;
}

function replaceTaskTemplateIdInLocationSearch(templateId?: string) {
  if (typeof window === 'undefined') {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  if (templateId) {
    params.set(TASK_TEMPLATE_DETAIL_QUERY_PARAM, templateId);
    params.delete(SKILL_VERSION_DETAIL_QUERY_PARAM);
  } else {
    params.delete(TASK_TEMPLATE_DETAIL_QUERY_PARAM);
  }
  const search = params.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}

function getSkillVersionIdFromLocationSearch() {
  if (typeof window === 'undefined') {
    return undefined;
  }
  return new URLSearchParams(window.location.search).get(SKILL_VERSION_DETAIL_QUERY_PARAM) || undefined;
}

function replaceSkillVersionIdInLocationSearch(skillVersionId?: string) {
  if (typeof window === 'undefined') {
    return;
  }
  const params = new URLSearchParams(window.location.search);
  if (skillVersionId) {
    params.set(SKILL_VERSION_DETAIL_QUERY_PARAM, skillVersionId);
    params.delete(TASK_TEMPLATE_DETAIL_QUERY_PARAM);
  } else {
    params.delete(SKILL_VERSION_DETAIL_QUERY_PARAM);
  }
  const search = params.toString();
  const nextUrl = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`;
  window.history.replaceState(window.history.state, '', nextUrl);
}

function useInitialRunDetailQuery() {
  return useState(() => getRunIdFromLocationSearch())[0];
}

function useInitialTaskTemplateDetailQuery() {
  return useState(() => getTaskTemplateIdFromLocationSearch())[0];
}

function useInitialSkillVersionDetailQuery() {
  return useState(() => getSkillVersionIdFromLocationSearch())[0];
}

function getBuildTaskTemplateSelectOptions(options: BuildRunOptions | undefined) {
  return (options?.taskTemplates || []).map((template) => ({
    value: template.id,
    label: template.displayName || template.templateKey,
  }));
}

function findBuildTaskTemplate(options: BuildRunOptions | undefined, templateId?: string) {
  if (!templateId) {
    return null;
  }
  return (
    (options?.taskTemplates || []).find(
      (template) => template.id === templateId || template.templateKey === templateId,
    ) || null
  );
}

function findBuildRunnerNodeByValue(options: BuildRunOptions | undefined, value?: string) {
  const { nodeId, agentProfileId } = parseBuildRunnerValue(value);
  if (!nodeId || !agentProfileId) {
    return null;
  }
  for (const node of options?.nodes || []) {
    if (node.id !== nodeId) {
      continue;
    }
    const profile = (node.profiles || []).find((item) => item.id === agentProfileId);
    if (profile) {
      return {
        node,
        profile,
      };
    }
  }
  return null;
}

function shouldUseDefaultBuildRunner(
  options: BuildRunOptions | undefined,
  currentValue: string | undefined,
  defaultValue: string | undefined,
) {
  if (!defaultValue || currentValue === defaultValue) {
    return false;
  }
  if (!currentValue) {
    return true;
  }
  const currentRunner = findBuildRunnerNodeByValue(options, currentValue);
  const defaultRunner = findBuildRunnerNodeByValue(options, defaultValue);
  if (!currentRunner) {
    return true;
  }
  return currentRunner.node.online === false && defaultRunner?.node.online === true;
}

function getRunnerReasonMessage(t: TFunction, reason?: string) {
  const messages: Record<string, string> = {
    ready: t('Runner is ready'),
    'missing-node': t('Runner node is not selected or no longer exists'),
    'node-inactive': t('Runner node is disabled'),
    'missing-profile': t('Runner profile is not selected or no longer exists'),
    'profile-inactive': t('Runner profile is disabled'),
    'heartbeat-stale': t('Runner heartbeat is stale; start or reconnect the daemon'),
  };
  return messages[reason || ''] || t('Waiting for runner');
}

function isRunActionAllowed(
  permissions: RunRecord['agentGatewayActionPermissionsJson'] | undefined,
  action: RunActionPermissionKey,
) {
  return permissions?.[action] === true;
}

function getRunTaskTitle(run: RunRecord, t: TFunction) {
  const title =
    getStringValue(run.taskTitle).trim() || getStringValue(getObjectRecord(run.resultSummaryJson).title).trim();
  return title || run.runCode || t('Untitled task');
}

function RunTaskTitle({ run, t, onOpen }: { run: RunRecord; t: TFunction; onOpen?: (run: RunRecord) => void }) {
  const title = getRunTaskTitle(run, t);
  if (onOpen) {
    return (
      <Typography.Link
        href="#"
        strong
        aria-label={t('View run details')}
        ellipsis
        title={title}
        onClick={(event) => {
          event.preventDefault();
          onOpen(run);
        }}
        style={{ display: 'inline-block', maxWidth: 300 }}
      >
        {title}
      </Typography.Link>
    );
  }
  return (
    <Typography.Text strong ellipsis={{ tooltip: title }} style={{ display: 'inline-block', maxWidth: 300 }}>
      {title}
    </Typography.Text>
  );
}

function RunTaskTemplateLink({ run, onOpen }: { run: RunRecord; onOpen: (templateId: string) => void }) {
  const template = run.taskTemplateJson;
  const label = template?.displayName || template?.templateKey || run.taskTemplateId || '';
  const templateId = template?.id || run.taskTemplateId || '';
  if (!label) {
    return <Typography.Text type="secondary">-</Typography.Text>;
  }
  if (!templateId) {
    return (
      <Typography.Text ellipsis={{ tooltip: label }} style={{ display: 'inline-block', maxWidth: 220 }}>
        {label}
      </Typography.Text>
    );
  }
  return (
    <Typography.Link
      href="#"
      ellipsis
      title={label}
      onClick={(event) => {
        event.preventDefault();
        onOpen(templateId);
      }}
      style={{ display: 'inline-block', maxWidth: 220 }}
    >
      {label}
    </Typography.Link>
  );
}

function getSkillVersionLabel(skillVersion: BuildSkillVersionOption) {
  return [skillVersion.displayName || skillVersion.skillKey || skillVersion.id, skillVersion.versionLabel]
    .filter(Boolean)
    .join(' / ');
}

function getSkillVersionDetailDisplayLabel(skillVersion: SkillVersionDetailRecord) {
  return [
    skillVersion.displayName || skillVersion.skillKey || skillVersion.skillId || skillVersion.id,
    skillVersion.versionLabel,
  ]
    .filter(Boolean)
    .join(' / ');
}

function RunTaskTemplateSkills({ run, onOpen }: { run: RunRecord; onOpen: (skillVersionId: string) => void }) {
  const skills = run.taskTemplateJson?.skills || [];
  if (!skills.length) {
    return <Typography.Text type="secondary">-</Typography.Text>;
  }
  return (
    <Space wrap size={[4, 0]}>
      {skills.map((skillVersion) => {
        const label = getSkillVersionLabel(skillVersion);
        return (
          <Typography.Link
            key={skillVersion.id}
            href="#"
            onClick={(event) => {
              event.preventDefault();
              onOpen(skillVersion.id);
            }}
          >
            {label}
          </Typography.Link>
        );
      })}
    </Space>
  );
}

function TaskTemplateDetailDrawerContent({
  template,
  loading,
  error,
  t,
}: {
  template: TaskTemplateDetailRecord | null | undefined;
  loading: boolean;
  error?: string;
  t: TFunction;
}) {
  if (error) {
    return <Alert type="warning" showIcon message={t('Task template details unavailable')} description={error} />;
  }
  if (loading && !template) {
    return <Spin />;
  }
  if (!template) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('Task template details unavailable')} />;
  }

  const skillVersionIds = Array.isArray(template.skillVersionIdsJson) ? template.skillVersionIdsJson : [];
  const artifacts = Array.isArray(template.artifactsJson) ? template.artifactsJson : [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Descriptions bordered size="small" column={1}>
        <Descriptions.Item label={t('Template key')}>{template.templateKey || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('Display name')}>{template.displayName || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('Description')}>{template.description || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('Status')}>{statusTag(template.status || 'active')}</Descriptions.Item>
        <Descriptions.Item label={t('Default title')}>{template.defaultTitle || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('Prompt')}>
          {template.defaultPrompt ? (
            <Typography.Paragraph style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
              {template.defaultPrompt}
            </Typography.Paragraph>
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t('Working directory')}>{template.cwd || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('Skills')}>
          {skillVersionIds.length ? (
            <Space size={[4, 4]} wrap>
              {skillVersionIds.map((skillVersionId) => (
                <Tag key={skillVersionId}>{skillVersionId}</Tag>
              ))}
            </Space>
          ) : (
            '-'
          )}
        </Descriptions.Item>
        <Descriptions.Item label={t('Artifact root')}>{template.artifactRoot || '-'}</Descriptions.Item>
      </Descriptions>
      {artifacts.length ? (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {t('Artifacts')}
          </Typography.Title>
          <JsonPreview value={artifacts} />
        </Space>
      ) : null}
    </Space>
  );
}

function SkillDetailDrawerContent({
  skillVersion,
  loading,
  error,
  t,
}: {
  skillVersion: SkillVersionDetailRecord | null | undefined;
  loading: boolean;
  error?: string;
  t: TFunction;
}) {
  if (error) {
    return <Alert type="warning" showIcon message={t('Skill details unavailable')} description={error} />;
  }
  if (loading && !skillVersion) {
    return <Spin />;
  }
  if (!skillVersion) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('Skill details unavailable')} />;
  }

  return (
    <Descriptions bordered size="small" column={1}>
      <Descriptions.Item label={t('Skill')}>{skillVersion.displayName || '-'}</Descriptions.Item>
      <Descriptions.Item label={t('Skill key')}>{skillVersion.skillKey || '-'}</Descriptions.Item>
      <Descriptions.Item label={t('Skill ID')}>{skillVersion.skillId || '-'}</Descriptions.Item>
      <Descriptions.Item label={t('Skill version ID')}>
        {skillVersion.skillVersionId || skillVersion.id}
      </Descriptions.Item>
      <Descriptions.Item label={t('Version label')}>{skillVersion.versionLabel || '-'}</Descriptions.Item>
      <Descriptions.Item label={t('Status')}>
        <Space size={4} wrap>
          {statusTag(skillVersion.status)}
          {skillVersion.skillStatus && skillVersion.skillStatus !== skillVersion.status
            ? statusTag(skillVersion.skillStatus)
            : null}
        </Space>
      </Descriptions.Item>
      <Descriptions.Item label={t('Source')}>
        {[skillVersion.sourceType, skillVersion.sourceSha256].filter(Boolean).join(' / ') || '-'}
      </Descriptions.Item>
      <Descriptions.Item label={t('Content size')}>{skillVersion.sourceSizeBytes ?? '-'}</Descriptions.Item>
      <Descriptions.Item label={t('Uploaded at')}>
        {formatDateTime(skillVersion.sourceUploadedAt || undefined)}
      </Descriptions.Item>
      <Descriptions.Item label={t('Created at')}>
        {formatDateTime(skillVersion.createdAt || undefined)}
      </Descriptions.Item>
      <Descriptions.Item label={t('Updated at')}>
        {formatDateTime(skillVersion.updatedAt || undefined)}
      </Descriptions.Item>
    </Descriptions>
  );
}

function RunTokenUsageSummary({ usage, t }: { usage?: TokenUsageRecord | null; t: TFunction }) {
  if (!hasTokenUsage(usage)) {
    return <Typography.Text type="secondary">-</Typography.Text>;
  }

  const inputTokens = getTokenUsageNumber(usage?.inputTokens);
  const outputTokens = getTokenUsageNumber(usage?.outputTokens);
  const cachedInputTokens = getTokenUsageNumber(usage?.cachedInputTokens);
  const reasoningOutputTokens = getTokenUsageNumber(usage?.reasoningOutputTokens);
  const secondaryParts = [
    inputTokens !== null ? `${t('Input')}: ${formatTokenCount(inputTokens)}` : '',
    outputTokens !== null ? `${t('Output')}: ${formatTokenCount(outputTokens)}` : '',
    cachedInputTokens !== null ? `${t('Cached')}: ${formatTokenCount(cachedInputTokens)}` : '',
    reasoningOutputTokens !== null ? `${t('Reasoning')}: ${formatTokenCount(reasoningOutputTokens)}` : '',
  ].filter(Boolean);

  return (
    <Space direction="vertical" size={0}>
      <Typography.Text>{`${t('Total')}: ${formatTokenCount(getTokenUsageTotal(usage))}`}</Typography.Text>
      {secondaryParts.length ? <Typography.Text type="secondary">{secondaryParts.join(' / ')}</Typography.Text> : null}
    </Space>
  );
}

function RunRunnerSummary({ run, t }: { run: RunRecord; t: TFunction }) {
  const runnerStatus = run.runnerStatusJson;
  const nodeLabel = runnerStatus?.nodeKey || runnerStatus?.nodeId || run.nodeId;
  const profileLabel = runnerStatus?.profileKey || runnerStatus?.agentProfileId || run.agentProfileId;
  const profileProvider =
    runnerStatus?.profileProvider && runnerStatus.profileProvider !== profileLabel
      ? runnerStatus.profileProvider
      : null;
  const profileSummary = [profileLabel, profileProvider].filter(Boolean).join(' / ');

  if (nodeLabel || profileSummary) {
    return (
      <Space direction="vertical" size={0}>
        <Typography.Text>{nodeLabel || t('Waiting for runner')}</Typography.Text>
        {profileSummary ? <Typography.Text type="secondary">{profileSummary}</Typography.Text> : null}
      </Space>
    );
  }

  return (
    <Typography.Text type="secondary">{isLiveRunStatus(run.status) ? t('Waiting for runner') : '-'}</Typography.Text>
  );
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

  return <Typography.Text type="secondary">{t('No agent session')}</Typography.Text>;
}

function RunnerQueueAlert({ run, t }: { run: RunRecord; t: TFunction }) {
  const runnerStatus = run.runnerStatusJson;
  if (!runnerStatus || (run.status !== 'queued' && runnerStatus.online !== false)) {
    return null;
  }
  const details = [
    runnerStatus.nodeKey || runnerStatus.nodeId,
    runnerStatus.profileKey || runnerStatus.agentProfileId,
    runnerStatus.lastHeartbeatAt ? `${t('Last heartbeat')}: ${formatDateTime(runnerStatus.lastHeartbeatAt)}` : '',
  ]
    .filter(Boolean)
    .join(' / ');
  return (
    <Alert
      type={runnerStatus.online === false ? 'warning' : 'info'}
      showIcon
      message={run.status === 'queued' ? t('Queued: waiting for runner') : t('Runner status')}
      description={[getRunnerReasonMessage(t, runnerStatus.reason), details].filter(Boolean).join('\n')}
      style={{ whiteSpace: 'pre-line' }}
    />
  );
}

function RunSummaryPanel({ run, t }: { run: RunRecord; t: TFunction }) {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Descriptions bordered size="small" column={2} title={t('Run summary')}>
        <Descriptions.Item label={t('Task')} span={2}>
          <RunTaskTitle run={run} t={t} />
        </Descriptions.Item>
        <Descriptions.Item label={t('Status')}>{statusTag(run.status)}</Descriptions.Item>
        <Descriptions.Item label={t('Runner')}>
          <RunRunnerSummary run={run} t={t} />
        </Descriptions.Item>
        <Descriptions.Item label={t('Requested at')}>{formatDateTime(run.requestedAt)}</Descriptions.Item>
        <Descriptions.Item label={t('Started at')}>{formatDateTime(run.startedAt)}</Descriptions.Item>
        <Descriptions.Item label={t('Time')}>{formatRunDuration(run)}</Descriptions.Item>
        <Descriptions.Item label={t('Tokens')}>
          <RunTokenUsageSummary usage={run.tokenUsageJson} t={t} />
        </Descriptions.Item>
        <Descriptions.Item label={t('Terminal status')}>
          {run.terminalStatus ? statusTag(run.terminalStatus) : '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('Last terminal activity')}>
          {formatDateTime(run.terminalLastActivityAt)}
        </Descriptions.Item>
        <Descriptions.Item label={t('Provider capabilities')} span={2}>
          <Space wrap>
            {Object.entries(
              normalizeAgentProviderCapabilities(run.agentProvider || 'generic-cli', run.agentProviderCapabilitiesJson),
            )
              .filter(([key]) =>
                [
                  'structuredEvents',
                  'terminalOutput',
                  'resumeSession',
                  'liveSemanticMessage',
                  'stdinMessage',
                  'interrupt',
                  'terminate',
                  'artifacts',
                ].includes(key),
              )
              .map(([key, value]) => (
                <Typography.Text key={key} type={value === true ? undefined : 'secondary'}>
                  {t(key)}: {value === true ? t('Yes') : t('No')}
                </Typography.Text>
              ))}
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label={t('Continuation')} span={2}>
          {[run.continuationReason, run.parentRunId].filter(Boolean).join(' / ') || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('Error summary')} span={2}>
          {redactPreviewText(run.errorSummary) || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('Result summary')} span={2}>
          <ResultSummaryPreview t={t} value={run.resultSummaryJson} />
        </Descriptions.Item>
      </Descriptions>
    </Space>
  );
}

function getResultSummaryStatus(value: JsonRecord) {
  const status = value.status;
  return typeof status === 'string' && status ? status : '';
}

function getResultSummaryExitCode(value: JsonRecord) {
  const exitCode = value.exitCode;
  return typeof exitCode === 'number' && Number.isFinite(exitCode) ? exitCode : null;
}

function getDeclaredArtifactCount(value: JsonRecord) {
  const declaredArtifacts = getObjectRecord(value.declaredArtifacts);
  const count = declaredArtifacts.declaredArtifactCount;
  if (typeof count === 'number' && Number.isFinite(count)) {
    return count;
  }

  const keys = declaredArtifacts.declaredArtifactKeys;
  return Array.isArray(keys) ? keys.length : null;
}

function ResultSummaryPreview({ t, value }: { t: TFunction; value?: JsonRecord }) {
  const summary = getObjectRecord(value);
  const status = getResultSummaryStatus(summary);
  const exitCode = getResultSummaryExitCode(summary);
  const declaredArtifactCount = getDeclaredArtifactCount(summary);
  const hasSummary = status || exitCode !== null || declaredArtifactCount !== null;

  if (!hasSummary) {
    return <Typography.Text type="secondary">{t('No result summary')}</Typography.Text>;
  }

  return (
    <Space wrap size={6}>
      {status ? (
        <Space size={4}>
          <Typography.Text type="secondary">{t('Status')}:</Typography.Text>
          {statusTag(status)}
        </Space>
      ) : null}
      {exitCode !== null ? (
        <Tag>
          {t('Exit code')}: {exitCode}
        </Tag>
      ) : null}
      {declaredArtifactCount !== null ? (
        <Tag>
          {t('Artifacts')}: {declaredArtifactCount}
        </Tag>
      ) : null}
    </Space>
  );
}

function AgentSessionPanel({
  run,
  t,
  canResumeAgentSession,
  resumeLoading,
  onResume,
}: {
  run: RunRecord;
  t: TFunction;
  canResumeAgentSession: boolean;
  resumeLoading: boolean;
  onResume(input: AgentSessionResumeInput): Promise<void>;
}) {
  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      <Descriptions bordered size="small" column={1} title={t('Agent Sessions')}>
        <Descriptions.Item label={t('Session')}>
          <RunSessionSummary run={run} t={t} />
          {!run.agentSessionId && !run.agentSessionProvider && !run.agentSessionProviderId ? (
            <Typography.Text type="secondary" style={{ display: 'block' }}>
              {t('No agent session')}
            </Typography.Text>
          ) : null}
        </Descriptions.Item>
        <Descriptions.Item label={t('Continuation')}>
          {[run.continuationReason, run.parentRunId].filter(Boolean).join(' / ') || '-'}
        </Descriptions.Item>
      </Descriptions>
      {canResumeAgentSession ? (
        <AgentSessionResumeBox run={run} t={t} loading={resumeLoading} onResume={onResume} />
      ) : null}
    </Space>
  );
}

function getTextFingerprint(text: string) {
  const sample = text.length > 1024 ? `${text.slice(0, 256)}:${text.slice(-768)}` : text;
  let hash = 2166136261;
  for (let index = 0; index < sample.length; index += 1) {
    hash ^= sample.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${text.length}:${(hash >>> 0).toString(36)}`;
}

function getTerminalResetKey(runId: string, snapshot: TerminalSnapshot | null | undefined, useStreamOutput: boolean) {
  if (useStreamOutput) {
    return [runId, 'stream', 'live'].join(':');
  }
  const output = snapshot?.output || '';
  return [
    runId,
    'snapshot',
    snapshot?.terminalStatus || 'unknown',
    snapshot?.available === false ? 'unavailable' : 'available',
    snapshot?.unsupportedCapability || 'supported',
    getTextFingerprint(output),
  ].join(':');
}

function getRunCapability(run: RunRecord, capability: AgentCapabilityKey) {
  const capabilities = run.agentProviderCapabilitiesJson;
  if (!capabilities || !Object.keys(capabilities).length) {
    return true;
  }
  return isAgentCapabilitySupported(run.agentProvider || 'generic-cli', capabilities, capability);
}

function getRawLogDetailsWarning(run: RunRecord | undefined, t: TFunction) {
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

function getArtifactDetailsWarning(run: RunRecord | undefined, t: TFunction) {
  if (!run) {
    return undefined;
  }
  if (!isRunActionAllowed(run.agentGatewayActionPermissionsJson, 'readArtifacts')) {
    return t('Agent Gateway artifact read permission required');
  }
  if (!getRunCapability(run, 'artifacts')) {
    return t('Artifacts are not supported by this provider');
  }
  return undefined;
}

function createUnsupportedTerminalSnapshot(run: RunRecord): TerminalSnapshot {
  return {
    backend: run.terminalBackend,
    terminalStatus: run.terminalStatus,
    runStatus: run.status,
    available: false,
    output: '',
    capturedAt: run.terminalLastActivityAt || run.startedAt || run.requestedAt || '',
    inputEnabled: false,
    unsupported: true,
    unsupportedCapability: 'terminalOutput',
    message: 'Agent CLI terminal output is not supported by this provider',
  };
}

function getControlRequestStatusText(t: TFunction, status: ControlRequestState['status']) {
  switch (status) {
    case 'accepted':
      return t('Control request accepted');
    case 'delivered':
      return t('Control request delivered');
    case 'succeeded':
      return t('Control request succeeded');
    case 'failed':
      return t('Control request failed');
    default:
      return t('Control request accepted');
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
  controlRequestState,
  canReadTerminal,
  canInterrupt,
  canTerminate,
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
  controlRequestState?: ControlRequestState | null;
  canReadTerminal: boolean;
  canInterrupt: boolean;
  canTerminate: boolean;
  onRefresh(): void;
  onInterrupt(): void;
  onTerminate(): void;
}) {
  const output = snapshot?.output || '';
  const terminalAvailable = Boolean(snapshot?.available);
  const terminalOutputSupported = snapshot?.unsupportedCapability !== 'terminalOutput';
  const streamHasOutput = stream.hasStreamOutput || stream.chunks.length > 0 || Boolean(stream.previewText);
  const snapshotHasOutput = Boolean(output);
  const streamUnavailable =
    stream.connectionState === 'closed' || stream.connectionState === 'error' || Boolean(stream.lastErrorCode);
  const useSnapshotFallback = !streamHasOutput || (streamUnavailable && snapshotHasOutput);
  const useStreamOutput = streamHasOutput && !useSnapshotFallback;
  const outputMode = useStreamOutput
    ? t('Live stream')
    : snapshotHasOutput
      ? t('Snapshot fallback')
      : t('Waiting for output');
  const xtermResetKey = getTerminalResetKey(runId, snapshot, useStreamOutput);
  const fallbackOutput = output || t('No terminal output yet');

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Space wrap style={{ justifyContent: 'space-between', width: '100%' }}>
        <Space wrap>
          <Typography.Text type="secondary">{t('Agent CLI')}</Typography.Text>
          {snapshot?.terminalStatus ? statusTag(snapshot.terminalStatus) : null}
          <Typography.Text type="secondary">{t('Stream')}</Typography.Text>
          {statusTag(stream.connectionState)}
          <Typography.Text data-testid="agent-gateway-xterm-output-mode" type="secondary">
            {outputMode}
          </Typography.Text>
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
          {canReadTerminal && terminalOutputSupported ? (
            <Tooltip title={t('Refresh terminal')}>
              <Button
                aria-label={t('Refresh terminal')}
                icon={<ReloadOutlined />}
                loading={loading}
                onClick={onRefresh}
              />
            </Tooltip>
          ) : null}
          {canInterrupt ? (
            <Tooltip title={t('Interrupt')}>
              <Button
                aria-label={t('Interrupt')}
                icon={<EnterOutlined />}
                loading={interrupting}
                onClick={onInterrupt}
              />
            </Tooltip>
          ) : null}
          {canTerminate ? (
            <Tooltip title={t('Terminate')}>
              <Button
                aria-label={t('Terminate')}
                danger
                icon={<PoweroffOutlined />}
                loading={terminating}
                onClick={onTerminate}
              />
            </Tooltip>
          ) : null}
        </Space>
      </Space>

      {!canReadTerminal ? (
        <Alert type="warning" showIcon message={t('Agent Gateway terminal read permission required')} />
      ) : null}
      {canReadTerminal && !terminalAvailable ? (
        <Alert
          type="info"
          showIcon
          message={
            snapshot?.unsupported
              ? t('Terminal output is not supported by this provider')
              : t('No terminal session yet')
          }
        />
      ) : null}
      {controlRequestState ? (
        <Alert
          data-testid="agent-gateway-control-request-state"
          type={controlRequestState.status === 'failed' ? 'error' : 'info'}
          showIcon
          message={getControlRequestStatusText(t, controlRequestState.status)}
        />
      ) : null}
      {stream.lastErrorCode === 'TERMINAL_OFFSET_GAP' ? (
        <Alert
          data-testid="agent-gateway-terminal-offset-gap"
          type="warning"
          showIcon
          message={t('Live output gap detected. Showing saved terminal output when available.')}
        />
      ) : null}
      {streamUnavailable && snapshotHasOutput ? (
        <Alert
          data-testid="agent-gateway-terminal-snapshot-fallback"
          type="info"
          showIcon
          message={t('Live stream unavailable; showing terminal snapshots')}
        />
      ) : null}
      {canReadTerminal && terminalOutputSupported ? (
        <LazyReadonlyXtermOutput
          ariaLabel={t('Readonly live terminal output')}
          chunks={useStreamOutput ? stream.chunks : []}
          emptyText={t('No terminal output yet')}
          initialOutput={useStreamOutput ? '' : fallbackOutput}
          resetKey={xtermResetKey}
        />
      ) : null}
    </Space>
  );
}

function createRunLifecycleEvents(run: RunRecord, t: TFunction): RunEventRecord[] {
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

function isHeartbeatRunEvent(record: RunEventRecord) {
  const source = record.source || '';
  const eventType = record.eventType || '';
  return source.includes('heartbeat') || eventType.includes('heartbeat');
}

function isHarnessStageRunEvent(record: RunEventRecord) {
  const payload = getObjectRecord(record.payloadJson);
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

function getRunEventStageLabel(record: RunEventRecord) {
  const { phase, status } = getRunEventStageParts(record);
  return [phase, status].filter(Boolean).join(' / ');
}

function getRunEventStageParts(record: RunEventRecord) {
  const payload = getObjectRecord(record.payloadJson);
  const phase = getStringValue(payload.phase) || record.eventType || '-';
  const status = getStringValue(payload.status);
  return { phase, status };
}

function LogsPanel({
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
  const expandedRowRender = (record: RunEventRecord) => <JsonPreview value={record.payloadJson} />;
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

function isHeartbeatApiCallLog(record: ApiCallLogRecord) {
  return Boolean(record.path && /\/heartbeat$/.test(record.path));
}

function getApiLogTimeMs(record: ApiCallLogRecord) {
  if (!record.createdAt) {
    return null;
  }
  const time = Date.parse(record.createdAt);
  return Number.isFinite(time) ? time : null;
}

function getHeartbeatApiLogSummary(apiCallLogs: ApiCallLogRecord[]) {
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

function ApiLogsPanel({
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

function getStringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function truncateArtifactPreviewText(text: string, maxChars: number) {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars)}\n\n[${'...'} ${text.length - maxChars} chars truncated]`;
}

function decodeCommonEscapedWhitespace(text: string) {
  const escapedNewlineCount = (text.match(/\\n/g) || []).length;
  const newlineCount = (text.match(/\n/g) || []).length;
  if (escapedNewlineCount < 2 || escapedNewlineCount < newlineCount) {
    return text;
  }
  return text
    .replace(/\\r\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t');
}

function normalizeArtifactReadableText(text: string, maxChars = ARTIFACT_ITEM_TEXT_MAX_CHARS) {
  return truncateArtifactPreviewText(decodeCommonEscapedWhitespace(redactPreviewText(text) || ''), maxChars);
}

function getArtifactRawPreview(contentText: string) {
  const rawPreview = truncateArtifactPreviewText(contentText, ARTIFACT_RAW_PREVIEW_MAX_CHARS);
  return {
    rawPreview,
    rawTruncated: rawPreview.length !== contentText.length,
  };
}

function getJsonPreviewText(value: unknown) {
  return normalizeArtifactReadableText(JSON.stringify(redactExternalUrlPreviewJson(value), null, 2));
}

function tryParseJson(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return undefined;
  }
}

function parseJsonlArtifact(contentText: string) {
  const lines = contentText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    return null;
  }

  const values: unknown[] = [];
  let failedCount = 0;
  for (const line of lines) {
    const value = tryParseJson(line);
    if (value === undefined) {
      failedCount += 1;
      continue;
    }
    values.push(value);
  }

  if (values.length < 2 || failedCount > Math.max(2, Math.floor(lines.length * 0.1))) {
    return null;
  }

  return {
    values,
    failedCount,
    totalCount: lines.length,
  };
}

function getArtifactItemLabel(t: TFunction, kind: ReadableArtifactItemKind, label: string) {
  const colors: Record<ReadableArtifactItemKind, string> = {
    message: 'blue',
    tool: 'purple',
    error: 'red',
    event: 'default',
  };
  const kindLabel: Record<ReadableArtifactItemKind, string> = {
    message: t('Message'),
    tool: t('Tool call'),
    error: t('Error'),
    event: t('Event'),
  };
  return (
    <Space size={8} wrap>
      <Tag color={colors[kind]}>{kindLabel[kind]}</Tag>
      <Typography.Text>{label}</Typography.Text>
    </Space>
  );
}

function getReadableArtifactItem(value: unknown, index: number, t: TFunction): ReadableArtifactItem | null {
  const record = getObjectRecord(value);
  const type = getStringValue(record.type);
  const item = getObjectRecord(record.item);
  const itemType = getStringValue(item.type);
  const itemId = getStringValue(item.id) || `${index + 1}`;
  const status = getStringValue(item.status);
  const key = `${itemId}-${index}`;

  if (itemType === 'agent_message') {
    const text = getStringValue(item.text);
    if (!text) {
      return null;
    }
    return {
      key,
      kind: 'message',
      label: `${t('Agent message')} #${index + 1}`,
      text: normalizeArtifactReadableText(text),
      defaultOpen: true,
    };
  }

  if (itemType === 'error') {
    const text = getStringValue(item.message) || getJsonPreviewText(value);
    return {
      key,
      kind: 'error',
      label: `${t('Error')} #${index + 1}`,
      text: normalizeArtifactReadableText(text),
      defaultOpen: true,
    };
  }

  if (itemType === 'command_execution') {
    const output = getStringValue(item.aggregated_output);
    const command = getStringValue(item.command);
    if (!output && type === 'item.started') {
      return null;
    }
    return {
      key,
      kind: 'tool',
      label: [t('Tool call'), status, itemId ? `#${itemId}` : null].filter(Boolean).join(' '),
      text: normalizeArtifactReadableText(output || command || t('No tool output')),
      defaultOpen: false,
    };
  }

  if (['thread.started', 'turn.started', 'turn.completed'].includes(type)) {
    return null;
  }

  const text =
    getStringValue(record.message) ||
    getStringValue(record.text) ||
    getStringValue(item.text) ||
    getStringValue(item.message) ||
    getJsonPreviewText(value);
  if (!text) {
    return null;
  }

  return {
    key,
    kind: 'event',
    label: type || `${t('Event')} #${index + 1}`,
    text: normalizeArtifactReadableText(text),
    defaultOpen: false,
  };
}

function buildReadableArtifactPreview(contentText: string, t: TFunction): ReadableArtifactPreview {
  const { rawPreview, rawTruncated } = getArtifactRawPreview(contentText);
  const jsonl = parseJsonlArtifact(contentText);
  if (jsonl) {
    const items = jsonl.values
      .map((value, index) => getReadableArtifactItem(value, index, t))
      .filter((item): item is ReadableArtifactItem => Boolean(item))
      .slice(0, ARTIFACT_PREVIEW_MAX_ITEMS);
    return {
      mode: 'jsonl',
      summary: `${t('Readable JSONL preview')}: ${items.length}/${jsonl.values.length}`,
      items,
      text: items.length ? '' : normalizeArtifactReadableText(contentText),
      rawPreview,
      rawTruncated,
    };
  }

  const parsedJson = tryParseJson(contentText.trim());
  if (parsedJson !== undefined) {
    return {
      mode: 'json',
      summary: t('Readable JSON preview'),
      items: [],
      text: getJsonPreviewText(parsedJson),
      rawPreview,
      rawTruncated,
    };
  }

  return {
    mode: 'text',
    summary: t('Readable text preview'),
    items: [],
    text: normalizeArtifactReadableText(contentText, ARTIFACT_RAW_PREVIEW_MAX_CHARS),
    rawPreview,
    rawTruncated,
  };
}

function ArtifactPreviewText({ text }: { text: string }) {
  return (
    <Typography.Paragraph
      style={{
        background: '#f6f8fa',
        border: '1px solid #edf0f2',
        borderRadius: 6,
        margin: 0,
        maxHeight: 360,
        overflow: 'auto',
        padding: 12,
        whiteSpace: 'pre-wrap',
      }}
    >
      {text}
    </Typography.Paragraph>
  );
}

function ArtifactContentPreview({
  artifact,
  contentText,
  t,
}: {
  artifact: RunArtifactRecord;
  contentText: string | null | undefined;
  t: TFunction;
}) {
  const normalizedContentText = contentText || '';
  const preview = useMemo(() => buildReadableArtifactPreview(normalizedContentText, t), [normalizedContentText, t]);
  if (!normalizedContentText) {
    return <Typography.Text type="secondary">{t('No inline artifact text')}</Typography.Text>;
  }

  if (artifact.mimeType === 'text/html') {
    return (
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Typography.Text type="secondary">{t('HTML artifact preview')}</Typography.Text>
        <iframe
          sandbox=""
          srcDoc={normalizedContentText}
          title={artifact.artifactKey || artifact.id}
          style={{
            background: '#fff',
            border: '1px solid #edf0f2',
            borderRadius: 6,
            height: 420,
            width: '100%',
          }}
        />
        <Collapse
          size="small"
          items={[
            {
              key: 'raw',
              label: t('Raw artifact text'),
              children: <ArtifactPreviewText text={preview.rawPreview} />,
            },
          ]}
        />
      </Space>
    );
  }

  if ((artifact.mimeType || '').startsWith('image/') && normalizedContentText.startsWith('data:image/')) {
    return (
      <Space direction="vertical" size={8} style={{ width: '100%' }}>
        <Typography.Text type="secondary">{t('Image artifact preview')}</Typography.Text>
        <img
          alt={artifact.artifactKey || artifact.id}
          src={normalizedContentText}
          style={{
            border: '1px solid #edf0f2',
            borderRadius: 6,
            maxHeight: 420,
            maxWidth: '100%',
            objectFit: 'contain',
          }}
        />
      </Space>
    );
  }

  const defaultActiveKey = preview.items
    .filter((item) => item.defaultOpen)
    .slice(0, 3)
    .map((item) => item.key);
  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      <Typography.Text type="secondary">{preview.summary}</Typography.Text>
      {preview.items.length ? (
        <Collapse
          size="small"
          defaultActiveKey={defaultActiveKey}
          items={preview.items.map((item) => ({
            key: item.key,
            label: getArtifactItemLabel(t, item.kind, item.label),
            children: <ArtifactPreviewText text={item.text} />,
          }))}
        />
      ) : (
        <ArtifactPreviewText text={preview.text} />
      )}
      <Collapse
        size="small"
        items={[
          {
            key: 'raw',
            label: preview.rawTruncated ? t('Raw artifact text (truncated)') : t('Raw artifact text'),
            children: <ArtifactPreviewText text={preview.rawPreview} />,
          },
        ]}
      />
    </Space>
  );
}

function ArtifactLazyPreview({
  artifact,
  entry,
  t,
  onLoad,
}: {
  artifact: RunArtifactRecord;
  entry?: ArtifactContentEntry;
  t: TFunction;
  onLoad(artifact: RunArtifactRecord, force?: boolean): Promise<void>;
}) {
  const inlineContentAvailable = artifact.contentText !== undefined;
  const loaded = entry?.loaded || inlineContentAvailable;
  const contentText = entry?.loaded ? entry.contentText : artifact.contentText;
  const handleChange = async (activeKeys: string | string[]) => {
    const keys = Array.isArray(activeKeys) ? activeKeys : [activeKeys];
    if (keys.includes('preview') && !loaded && !entry?.loading) {
      await onLoad(artifact);
    }
  };
  return (
    <Collapse
      size="small"
      onChange={handleChange}
      items={[
        {
          key: 'preview',
          label: t('Preview'),
          children: entry?.loading ? (
            <Spin size="small" />
          ) : entry?.warning ? (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Alert type="warning" showIcon message={entry.warning} />
              <Button size="small" onClick={async () => await onLoad(artifact, true)}>
                {t('Retry')}
              </Button>
            </Space>
          ) : loaded ? (
            <ArtifactContentPreview artifact={artifact} contentText={contentText} t={t} />
          ) : (
            <Spin size="small" />
          ),
        },
      ]}
    />
  );
}

function getArtifactDisplayPriority(artifact: RunArtifactRecord) {
  const mimeType = artifact.mimeType || '';
  const artifactType = artifact.artifactType || '';
  const searchableText = [
    artifact.artifactKey,
    artifact.artifactType,
    artifact.mimeType,
    artifact.metadataJson?.relativePath,
  ]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();
  if (mimeType === 'text/html' || artifactType === 'html-report' || searchableText.includes('report.html')) {
    return 0;
  }
  if (mimeType.startsWith('image/') || artifactType === 'image' || searchableText.includes('browser-screenshots')) {
    return 1;
  }
  if (searchableText.includes('browser-verification')) {
    return 2;
  }
  if (mimeType.includes('json') || artifactType === 'json-report') {
    return 3;
  }
  return 4;
}

function compareArtifactsForDisplay(first: RunArtifactRecord, second: RunArtifactRecord) {
  const priorityDelta = getArtifactDisplayPriority(first) - getArtifactDisplayPriority(second);
  if (priorityDelta !== 0) {
    return priorityDelta;
  }
  const firstLabel = first.artifactKey || first.id;
  const secondLabel = second.artifactKey || second.id;
  return firstLabel.localeCompare(secondLabel);
}

interface ArtifactDisplayGroup {
  key: string;
  label: string;
  artifacts: RunArtifactRecord[];
}

function getArtifactDisplayGroup(artifact: RunArtifactRecord, t: TFunction) {
  const metadata = getObjectRecord(artifact.metadataJson);
  const groupLabel = getStringValue(metadata.artifactGroupLabel) || getStringValue(metadata.groupLabel);
  const groupKey = getStringValue(metadata.artifactGroupKey) || getStringValue(metadata.groupKey) || groupLabel;
  return {
    key: groupKey ? `group:${groupKey}` : 'group:default',
    label: groupLabel || groupKey || t('Default artifacts'),
  };
}

function groupArtifactsForDisplay(artifacts: RunArtifactRecord[], t: TFunction) {
  const groups: ArtifactDisplayGroup[] = [];
  const groupIndex = new Map<string, ArtifactDisplayGroup>();
  for (const artifact of artifacts) {
    const groupInfo = getArtifactDisplayGroup(artifact, t);
    let group = groupIndex.get(groupInfo.key);
    if (!group) {
      group = {
        ...groupInfo,
        artifacts: [],
      };
      groupIndex.set(group.key, group);
      groups.push(group);
    }
    group.artifacts.push(artifact);
  }
  return groups;
}

function getArtifactOverviewCounts(artifacts: RunArtifactRecord[]) {
  return {
    htmlReports: artifacts.filter((artifact) => getArtifactDisplayPriority(artifact) === 0).length,
    screenshots: artifacts.filter((artifact) => getArtifactDisplayPriority(artifact) === 1).length,
    manifests: artifacts.filter((artifact) => artifact.artifactType === 'artifact-manifest').length,
    truncated: artifacts.filter(
      (artifact) => artifact.truncated === true || getObjectRecord(artifact.metadataJson).truncated === true,
    ).length,
    total: artifacts.length,
  };
}

function ArtifactList({
  t,
  artifacts,
  loading,
  contentEntries,
  onLoadContent,
}: {
  t: TFunction;
  artifacts: RunArtifactRecord[];
  loading?: boolean;
  contentEntries: Record<string, ArtifactContentEntry>;
  onLoadContent(artifact: RunArtifactRecord, force?: boolean): Promise<void>;
}) {
  return (
    <List
      dataSource={artifacts}
      loading={loading}
      renderItem={(artifact) => (
        <List.Item>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Typography.Text strong>
              {[artifact.artifactKey, artifact.artifactType, artifact.mimeType].filter(Boolean).join(' / ') ||
                artifact.id}
            </Typography.Text>
            <Space wrap size={6}>
              {artifact.storageMode ? <Tag>{artifact.storageMode}</Tag> : null}
              {artifact.truncated ? <Tag color="orange">{t('Truncated')}</Tag> : null}
              {artifact.originalSizeBytes ? (
                <Tag>
                  {t('Original size')}: {String(artifact.originalSizeBytes)}
                </Tag>
              ) : null}
              {artifact.previewBytes ? (
                <Tag>
                  {t('Preview size')}: {String(artifact.previewBytes)}
                </Tag>
              ) : null}
            </Space>
            <ArtifactLazyPreview artifact={artifact} entry={contentEntries[artifact.id]} t={t} onLoad={onLoadContent} />
            <JsonPreview value={redactExternalUrlPreviewJson(artifact.metadataJson)} />
          </Space>
        </List.Item>
      )}
    />
  );
}

function isFormValidationError(value: unknown) {
  return Array.isArray(getObjectRecord(value).errorFields);
}

function ArtifactsPanel({
  t,
  artifacts,
  snapshots,
  artifactMeta,
  snapshotMeta,
  artifactContentEntries,
  artifactsWarning,
  snapshotsWarning,
  artifactsLoading,
  snapshotsLoading,
  onArtifactPageChange,
  onSnapshotPageChange,
  onLoadArtifactContent,
}: {
  t: TFunction;
  artifacts: RunArtifactRecord[];
  snapshots: RunSnapshotRecord[];
  artifactMeta: DetailPageMeta;
  snapshotMeta: DetailPageMeta;
  artifactContentEntries: Record<string, ArtifactContentEntry>;
  artifactsWarning?: string;
  snapshotsWarning?: string;
  artifactsLoading?: boolean;
  snapshotsLoading?: boolean;
  onArtifactPageChange(page: number, pageSize: number): void;
  onSnapshotPageChange(page: number, pageSize: number): void;
  onLoadArtifactContent(artifact: RunArtifactRecord, force?: boolean): Promise<void>;
}) {
  const displayArtifacts = useMemo(() => [...artifacts].sort(compareArtifactsForDisplay), [artifacts]);
  const artifactGroups = useMemo(() => groupArtifactsForDisplay(displayArtifacts, t), [displayArtifacts, t]);
  const overviewCounts = useMemo(() => getArtifactOverviewCounts(displayArtifacts), [displayArtifacts]);

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {artifactsWarning ? <Alert type="warning" showIcon message={artifactsWarning} /> : null}
      {displayArtifacts.length ? (
        <Space size={[8, 8]} wrap>
          <Tag>
            {t('Artifacts')}: {artifactMeta.count}
          </Tag>
          <Tag color={overviewCounts.htmlReports ? 'blue' : undefined}>
            {t('HTML reports')}: {overviewCounts.htmlReports}
          </Tag>
          <Tag color={overviewCounts.screenshots ? 'green' : undefined}>
            {t('Screenshots')}: {overviewCounts.screenshots}
          </Tag>
          <Tag color={overviewCounts.manifests ? 'purple' : undefined}>
            {t('Artifact manifests')}: {overviewCounts.manifests}
          </Tag>
          <Tag color={overviewCounts.truncated ? 'orange' : undefined}>
            {t('Truncated')}: {overviewCounts.truncated}
          </Tag>
        </Space>
      ) : null}
      {displayArtifacts.length || artifactsLoading ? (
        artifactGroups.length > 1 ? (
          <Tabs
            destroyInactiveTabPane
            items={artifactGroups.map((group) => ({
              key: group.key,
              label: `${group.label} (${group.artifacts.length})`,
              children: (
                <ArtifactList
                  t={t}
                  artifacts={group.artifacts}
                  loading={artifactsLoading}
                  contentEntries={artifactContentEntries}
                  onLoadContent={onLoadArtifactContent}
                />
              ),
            }))}
          />
        ) : (
          <ArtifactList
            t={t}
            artifacts={displayArtifacts}
            loading={artifactsLoading}
            contentEntries={artifactContentEntries}
            onLoadContent={onLoadArtifactContent}
          />
        )
      ) : (
        <EmptyInline description={t('No artifacts yet')} />
      )}
      {artifactMeta.count > artifactMeta.pageSize ? (
        <Pagination
          current={artifactMeta.page}
          pageSize={artifactMeta.pageSize}
          total={artifactMeta.count}
          showSizeChanger
          pageSizeOptions={DETAIL_PAGE_SIZE_OPTIONS}
          showTotal={(total) => `${t('Total')}: ${total}`}
          onChange={onArtifactPageChange}
        />
      ) : null}

      <Typography.Title level={5} style={{ margin: 0 }}>
        {t('Snapshots')}
      </Typography.Title>
      {snapshotsWarning ? <Alert type="warning" showIcon message={snapshotsWarning} /> : null}
      {snapshots.length || snapshotsLoading ? (
        <List
          dataSource={snapshots}
          loading={snapshotsLoading}
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
      {snapshotMeta.count > snapshotMeta.pageSize ? (
        <Pagination
          current={snapshotMeta.page}
          pageSize={snapshotMeta.pageSize}
          total={snapshotMeta.count}
          showSizeChanger
          pageSizeOptions={DETAIL_PAGE_SIZE_OPTIONS}
          showTotal={(total) => `${t('Total')}: ${total}`}
          onChange={onSnapshotPageChange}
        />
      ) : null}
    </Space>
  );
}

export default function AgentGatewayRunsPage() {
  const t = useT();
  const ctx = useFlowContext() as unknown as AgentGatewayPageContext;
  const initialRunId = useInitialRunDetailQuery();
  const initialTaskTemplateId = useInitialTaskTemplateDetailQuery();
  const initialSkillVersionId = useInitialSkillVersionDetailQuery();
  const [buildTaskForm] = Form.useForm<BuildTaskFormValues>();
  const [externalRunImportForm] = Form.useForm<ExternalRunImportFormValues>();
  const [skillUploadForm] = Form.useForm<SkillUploadFormValues>();
  const [runFilters, setRunFilters] = useState<CompiledFilter>();
  const [runSort, setRunSort] = useState<string | undefined>(RUN_SORT_FALLBACK);
  const [runPagination, setRunPagination] = useState({
    current: 1,
    pageSize: DEFAULT_RUNS_PAGE_SIZE,
  });
  const [buildTaskOpen, setBuildTaskOpen] = useState(false);
  const [externalRunImportOpen, setExternalRunImportOpen] = useState(false);
  const [externalRunLogContent, setExternalRunLogContent] = useState('');
  const [skillUploadOpen, setSkillUploadOpen] = useState(false);
  const [skillZipFile, setSkillZipFile] = useState<File | null>(null);
  const [skillUploadResult, setSkillUploadResult] = useState<SkillUploadResult | null>(null);
  const [detailOpen, setDetailOpen] = useState(Boolean(initialRunId));
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>(initialRunId);
  const [runDetailsError, setRunDetailsError] = useState<string>();
  const [taskTemplateDetailOpen, setTaskTemplateDetailOpen] = useState(Boolean(initialTaskTemplateId));
  const [selectedTaskTemplateId, setSelectedTaskTemplateId] = useState<string | undefined>(initialTaskTemplateId);
  const [taskTemplateDetailsError, setTaskTemplateDetailsError] = useState<string>();
  const [skillDetailOpen, setSkillDetailOpen] = useState(Boolean(initialSkillVersionId));
  const [selectedSkillVersionId, setSelectedSkillVersionId] = useState<string | undefined>(initialSkillVersionId);
  const [skillDetailsError, setSkillDetailsError] = useState<string>();
  const [activeDetailTab, setActiveDetailTab] = useState<RunDetailTabKey>('summary');
  const [terminalSnapshotState, setTerminalSnapshotState] = useState<TerminalSnapshotState | null>(null);
  const [controlRequestState, setControlRequestState] = useState<ControlRequestState | null>(null);
  const controlIdempotencyKeysRef = useRef<Partial<Record<'interrupt' | 'terminate', { runId: string; key: string }>>>(
    {},
  );
  const selectedRunIdRef = useRef<string | undefined>(initialRunId);
  const terminalSnapshotRequestKeyRef = useRef<string>();

  const syncRunDetailFromLocation = useCallback(() => {
    const runId = getRunIdFromLocationSearch();
    if (!runId) {
      setDetailOpen(false);
      setSelectedRunId(undefined);
      setRunDetailsError(undefined);
      setActiveDetailTab('summary');
      setTerminalSnapshotState(null);
      setControlRequestState(null);
      return;
    }
    setSelectedRunId(runId);
    setRunDetailsError(undefined);
    setActiveDetailTab('summary');
    setTerminalSnapshotState(null);
    setDetailOpen(true);
  }, []);

  const syncRelatedDetailsFromLocation = useCallback(() => {
    const templateId = getTaskTemplateIdFromLocationSearch();
    const skillVersionId = templateId ? undefined : getSkillVersionIdFromLocationSearch();
    setSelectedTaskTemplateId(templateId);
    setTaskTemplateDetailOpen(Boolean(templateId));
    setTaskTemplateDetailsError(undefined);
    setSelectedSkillVersionId(skillVersionId);
    setSkillDetailOpen(Boolean(skillVersionId));
    setSkillDetailsError(undefined);
  }, []);

  const runsRequest = useRequest(
    async () => {
      const response = await ctx.api.request<RunRecord[]>({
        url: 'agentGatewayApi:listRuns',
        method: 'get',
        params: {
          ...(runFilters ? { filter: JSON.stringify(runFilters) } : {}),
          ...(runSort ? { sort: runSort } : {}),
          page: runPagination.current,
          pageSize: runPagination.pageSize,
        },
      });
      return {
        runs: getResponseData(response, []),
        meta: getRunListMeta(response.data?.meta),
      };
    },
    {
      refreshDeps: [runFilters, runPagination.current, runPagination.pageSize, runSort],
    },
  );
  const { refresh: refreshRuns } = runsRequest;

  const taskTemplateDetailsRequest = useRequest(
    async () => {
      if (!selectedTaskTemplateId || !taskTemplateDetailOpen) {
        return null;
      }
      const response = await ctx.api.request<TaskTemplateDetailRecord>({
        url: `agentGatewayApi:getTaskTemplate/${encodeURIComponent(selectedTaskTemplateId)}`,
        method: 'get',
      });
      return getRequiredResponseData(response, t('Failed to load task template detail'));
    },
    {
      refreshDeps: [selectedTaskTemplateId, taskTemplateDetailOpen],
      onSuccess() {
        setTaskTemplateDetailsError(undefined);
      },
      onError(error) {
        const message = getApiErrorMessage(error, t('Failed to load task template detail'));
        setTaskTemplateDetailsError(message);
        ctx.message?.error(message);
      },
    },
  );

  const skillVersionDetailsRequest = useRequest(
    async () => {
      if (!selectedSkillVersionId || !skillDetailOpen) {
        return null;
      }
      const response = await ctx.api.request<SkillVersionDetailRecord[]>({
        url: 'agentGatewayApi:listSkillVersions',
        method: 'get',
      });
      const skillVersions = getResponseData(response, []);
      return (
        skillVersions.find(
          (skillVersion) =>
            skillVersion.id === selectedSkillVersionId || skillVersion.skillVersionId === selectedSkillVersionId,
        ) || null
      );
    },
    {
      refreshDeps: [selectedSkillVersionId, skillDetailOpen],
      onSuccess() {
        setSkillDetailsError(undefined);
      },
      onError(error) {
        const message = getApiErrorMessage(error, t('Failed to load skill detail'));
        setSkillDetailsError(message);
        ctx.message?.error(message);
      },
    },
  );

  const buildRunOptionsRequest = useRequest(
    async () => {
      const response = await ctx.api.request<BuildRunOptions>({
        url: 'agentGatewayApi:listRunOptions',
        method: 'get',
      });
      return getResponseData(response, {});
    },
    {
      manual: true,
    },
  );

  const buildRunnerSelectOptions = useMemo(
    () => getBuildRunnerSelectOptions(buildRunOptionsRequest.data, t),
    [buildRunOptionsRequest.data, t],
  );
  const hasOnlineBuildRunner = useMemo(
    () => hasSelectableBuildRunner(buildRunOptionsRequest.data),
    [buildRunOptionsRequest.data],
  );
  const buildSkillVersionSelectOptions = useMemo(
    () => getBuildSkillVersionSelectOptions(buildRunOptionsRequest.data),
    [buildRunOptionsRequest.data],
  );
  const buildTaskTemplateSelectOptions = useMemo(
    () => getBuildTaskTemplateSelectOptions(buildRunOptionsRequest.data),
    [buildRunOptionsRequest.data],
  );
  const defaultBuildRunnerValue = useMemo(
    () => getDefaultBuildRunnerValue(buildRunOptionsRequest.data),
    [buildRunOptionsRequest.data],
  );
  const defaultBuildTaskCwd = buildRunOptionsRequest.data?.defaultCwd || '';

  const createBuildTaskRequest = useRequest(
    async (values: BuildTaskFormValues) => {
      const runner = parseBuildRunnerValue(values.runner || defaultBuildRunnerValue);
      const artifacts = getTaskArtifactDeclarations(values.artifactDeclarations);
      const artifactRoot = getOptionalFormString(values.artifactRoot);
      const response = await ctx.api.request<CreateBuildRunResult>({
        url: 'agentGatewayApi:createTaskRun',
        method: 'post',
        data: {
          taskTemplateId: values.taskTemplateId,
          title: values.title,
          prompt: values.prompt,
          skillVersionIds: values.skillVersionIds,
          cwd: values.cwd || defaultBuildTaskCwd || '.',
          ...(artifactRoot ? { artifactRoot } : {}),
          ...(artifacts.length ? { artifacts } : {}),
          nodeId: runner.nodeId,
          agentProfileId: runner.agentProfileId,
        },
      });
      return getRequiredResponseData(response, t('Failed to create task run'));
    },
    {
      manual: true,
      onSuccess(result) {
        const nextRunId = result.runId || result.run?.id;
        buildTaskForm.resetFields();
        setBuildTaskOpen(false);
        if (nextRunId) {
          setTerminalSnapshotState(null);
          setRunDetailsError(undefined);
          setActiveDetailTab('summary');
          setSelectedRunId(nextRunId);
          setDetailOpen(true);
          replaceRunIdInLocationSearch(nextRunId);
        }
        refreshRuns();
        ctx.message?.success(t('Task run created'));
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to create task run')));
      },
    },
  );

  const importExternalRunRequest = useRequest(
    async (values: ExternalRunImportFormValues & { logContent: string }) => {
      const response = await ctx.api.request<ExternalRunImportResult>({
        url: 'agent-gateway/external-runs:import',
        method: 'post',
        data: {
          provider: values.provider || 'codex',
          format: values.format || 'codex-jsonl',
          title: values.title,
          instruction: values.instruction,
          status: values.status || 'succeeded',
          externalRunKey: values.externalRunKey,
          providerSessionId: values.providerSessionId,
          sourceCollection: values.sourceCollection,
          sourceRecordId: values.sourceRecordId,
          outputAgentRunField: values.outputAgentRunField,
          logs: values.logContent
            ? [
                {
                  format: values.format || 'codex-jsonl',
                  contentText: values.logContent,
                },
              ]
            : [],
        },
      });
      return getRequiredResponseData(response, t('Failed to import external run'));
    },
    {
      manual: true,
      onSuccess(result) {
        const nextRunId = result.runId || result.run?.id;
        externalRunImportForm.resetFields();
        setExternalRunLogContent('');
        setExternalRunImportOpen(false);
        if (nextRunId) {
          setTerminalSnapshotState(null);
          setRunDetailsError(undefined);
          setActiveDetailTab('summary');
          setSelectedRunId(nextRunId);
          setDetailOpen(true);
          replaceRunIdInLocationSearch(nextRunId);
        }
        refreshRuns();
        ctx.message?.success(result.deduped ? t('External run already imported') : t('External run imported'));
      },
      onError(error) {
        ctx.message?.error(getApiErrorMessage(error, t('Failed to import external run')));
      },
    },
  );

  const uploadSkillVersionRequest = useRequest(
    async (values: SkillUploadFormValues & { file: File }) => {
      const uploadId = await uploadAgentGatewayFile(ctx.api, values.file, 'skill-version');
      const response = await ctx.api.request<SkillUploadResult>({
        url: 'agentGatewayApi:createSkillVersionFromUpload',
        method: 'post',
        data: { ...values, file: undefined, uploadId },
      });
      return getRequiredResponseData(response, t('Failed to upload skill'));
    },
    {
      manual: true,
      onSuccess(result) {
        const currentSkillVersionIds = getSkillVersionIds(buildTaskForm.getFieldValue('skillVersionIds'));
        buildTaskForm.setFieldValue('skillVersionIds', [
          ...new Set([...currentSkillVersionIds, result.skillVersionId]),
        ]);
        setSkillUploadResult(result);
        setSkillZipFile(null);
        skillUploadForm.resetFields();
        setSkillUploadOpen(false);
        buildRunOptionsRequest.run();
        ctx.message?.success(t('Skill uploaded'));
      },
      onError() {
        ctx.message?.error(t('Failed to upload skill'));
      },
    },
  );

  const runDetailsRequest = useRequest(
    async (): Promise<RunDetails | null> => {
      if (!selectedRunId || !detailOpen) {
        return null;
      }

      const runResponse = await ctx.api.request<RunRecord>({
        url: `agentGatewayApi:getRun/${encodeURIComponent(selectedRunId)}`,
        method: 'get',
      });
      const run = getRequiredResponseData(runResponse, t('Failed to load run details'));

      return {
        run,
        conversationEvents: [],
        events: [],
        artifacts: [],
        snapshots: [],
        apiCallLogs: [],
        warnings: {},
      } satisfies RunDetails;
    },
    {
      refreshDeps: [selectedRunId, detailOpen],
      onSuccess(data) {
        if (!data?.run?.id || data.run.id !== selectedRunId) {
          return;
        }
        setRunDetailsError(undefined);
        if (!isRunActionAllowed(data.run.agentGatewayActionPermissionsJson, 'readTerminal')) {
          setTerminalSnapshotState(null);
        }
      },
      onError(error) {
        const message = getApiErrorMessage(error, t('Failed to load run details'));
        setRunDetailsError(message);
        setTerminalSnapshotState(null);
        ctx.message?.error(message);
      },
    },
  );
  const { refresh: refreshRunDetails } = runDetailsRequest;
  const observabilityRun =
    !runDetailsError && selectedRunId && runDetailsRequest.data?.run?.id === selectedRunId
      ? runDetailsRequest.data.run
      : undefined;
  const rawLogDetailsWarning = getRawLogDetailsWarning(observabilityRun, t);
  const artifactDetailsWarning = getArtifactDetailsWarning(observabilityRun, t);
  const observability = useRunObservabilityDetails({
    api: ctx.api,
    t,
    selectedRunId,
    run: observabilityRun,
    enabled: detailOpen && !runDetailsError,
    activeTab: activeDetailTab,
    conversationEnabled: Boolean(
      observabilityRun && isRunActionAllowed(observabilityRun.agentGatewayActionPermissionsJson, 'readSessionMessages'),
    ),
    conversationDisabledWarning: t('Agent Gateway session message read permission required'),
    rawLogsWarning: rawLogDetailsWarning,
    artifactsWarning: artifactDetailsWarning,
  });
  const resetObservability = observability.reset;
  const refreshConversationEvents = observability.conversation.refresh;

  const terminalSnapshotRequest = useRequest(
    async (requestRunId: string) => {
      if (
        requestRunId !== selectedRunIdRef.current ||
        !detailOpen ||
        runDetailsError ||
        runDetailsRequest.data?.run?.id !== requestRunId
      ) {
        return null;
      }
      const run = runDetailsRequest.data.run;
      if (!isRunActionAllowed(run.agentGatewayActionPermissionsJson, 'readTerminal')) {
        return null;
      }
      if (!getRunCapability(run, 'terminalOutput')) {
        return {
          runId: run.id,
          snapshot: createUnsupportedTerminalSnapshot(run),
        } satisfies TerminalSnapshotState;
      }
      const response = await ctx.api.request<TerminalSnapshot | null>({
        url: `agent-gateway/runs/${encodeURIComponent(requestRunId)}/terminal:snapshot`,
        method: 'get',
      });
      return {
        runId: requestRunId,
        snapshot: getResponseData(response, null),
      } satisfies TerminalSnapshotState;
    },
    {
      manual: true,
      onSuccess(data) {
        if (!data || data.runId !== selectedRunId) {
          return;
        }
        setTerminalSnapshotState(data);
      },
      onError(error, [requestRunId]) {
        if (requestRunId !== selectedRunIdRef.current) {
          return;
        }
        setTerminalSnapshotState(null);
        ctx.message?.error(getApiErrorMessage(error, t('Failed to load terminal')));
      },
    },
  );
  const runTerminalSnapshotRequest = terminalSnapshotRequest.run;
  const refreshTerminalSnapshot = useCallback(() => {
    const runId = selectedRunIdRef.current;
    if (runId) {
      runTerminalSnapshotRequest(runId);
    }
  }, [runTerminalSnapshotRequest]);

  const getControlIdempotencyKey = useCallback((action: 'interrupt' | 'terminate', runId: string) => {
    if (!runId) {
      return '';
    }
    const existing = controlIdempotencyKeysRef.current[action];
    if (existing?.runId === runId) {
      return existing.key;
    }
    const key = createControlIdempotencyKey(action, runId);
    controlIdempotencyKeysRef.current[action] = {
      runId,
      key,
    };
    return key;
  }, []);

  const resetControlIdempotencyKey = useCallback((action: 'interrupt' | 'terminate') => {
    delete controlIdempotencyKeysRef.current[action];
  }, []);

  const cancelRunRequest = useRequest(
    async (run: RunRecord) => {
      const response = await ctx.api.request<RunRecord>({
        url: `agentGatewayApi:cancelRun/${encodeURIComponent(run.id)}`,
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
    async (runId: string) => {
      if (!runId) {
        return null;
      }
      const response = await ctx.api.request<ControlRequestResult>({
        url: `agent-gateway/runs/${encodeURIComponent(runId)}/terminal:interrupt`,
        method: 'post',
        data: {
          idempotencyKey: getControlIdempotencyKey('interrupt', runId),
        },
      });
      return {
        runId,
        result: getResponseData(response, {}),
      };
    },
    {
      manual: true,
      onSuccess(payload) {
        if (!payload || selectedRunIdRef.current !== payload.runId) {
          return;
        }
        const { result, runId } = payload;
        const status = result?.controlRequestStatus || 'accepted';
        setControlRequestState({
          action: 'interrupt',
          runId,
          status,
          controlRequestId: result?.controlRequestId,
        });
        if (isFinalControlStatus(status)) {
          resetControlIdempotencyKey('interrupt');
        }
        refreshTerminalSnapshot();
        runDetailsRequest.refresh();
        ctx.message?.success(t('Control request accepted'));
      },
      onError(error) {
        if (shouldResetControlIdempotencyKey(error)) {
          resetControlIdempotencyKey('interrupt');
        }
        ctx.message?.error(getApiErrorMessage(error, t('Failed to interrupt terminal')));
      },
    },
  );

  const terminateTerminalRequest = useRequest(
    async (runId: string) => {
      if (!runId) {
        return null;
      }
      const response = await ctx.api.request<ControlRequestResult>({
        url: `agent-gateway/runs/${encodeURIComponent(runId)}/terminal:terminate`,
        method: 'post',
        data: {
          idempotencyKey: getControlIdempotencyKey('terminate', runId),
        },
      });
      return {
        runId,
        result: getResponseData(response, {}),
      };
    },
    {
      manual: true,
      onSuccess(payload) {
        if (!payload || selectedRunIdRef.current !== payload.runId) {
          return;
        }
        const { result, runId } = payload;
        const status = result?.controlRequestStatus || 'accepted';
        setControlRequestState({
          action: 'terminate',
          runId,
          status,
          controlRequestId: result?.controlRequestId,
        });
        if (isFinalControlStatus(status)) {
          resetControlIdempotencyKey('terminate');
        }
        refreshTerminalSnapshot();
        runsRequest.refresh();
        runDetailsRequest.refresh();
        ctx.message?.success(t('Control request accepted'));
      },
      onError(error) {
        if (shouldResetControlIdempotencyKey(error)) {
          resetControlIdempotencyKey('terminate');
        }
        ctx.message?.error(getApiErrorMessage(error, t('Failed to terminate terminal')));
      },
    },
  );

  const refreshControlRequestStatus = useCallback(
    async (poll: ControlRequestStatusPoll) => {
      const response = await ctx.api.request<ControlRequestResult>({
        url: `agent-gateway/runs/${encodeURIComponent(poll.runId)}/control-requests/${encodeURIComponent(
          poll.controlRequestId,
        )}:get`,
        method: 'get',
      });
      const result = getResponseData(response, {});
      if (!result.controlRequestId || result.controlRequestId !== poll.controlRequestId) {
        return;
      }
      const status = result.controlRequestStatus;
      if (!status) {
        return;
      }
      setControlRequestState((previous) =>
        previous?.controlRequestId === result.controlRequestId && previous.runId === poll.runId
          ? {
              ...previous,
              status,
            }
          : previous,
      );
      if (isFinalControlStatus(status)) {
        resetControlIdempotencyKey(poll.action);
      }
    },
    [ctx.api, resetControlIdempotencyKey],
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
        setTerminalSnapshotState(null);
        resetObservability();
        setActiveDetailTab('summary');
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
  const selectedRunActionPermissions = runDetailsError
    ? undefined
    : runDetailsRequest.data?.run?.agentGatewayActionPermissionsJson;

  const pollingRun = runDetailsRequest.data?.run;

  const openRunDetails = useCallback(
    (run: RunRecord) => {
      setRunDetailsError(undefined);
      setActiveDetailTab('summary');
      setTerminalSnapshotState(null);
      resetObservability();
      setSelectedRunId(run.id);
      setDetailOpen(true);
      replaceRunIdInLocationSearch(run.id);
    },
    [resetObservability],
  );

  const openTaskTemplateDetails = useCallback((templateId: string) => {
    setSelectedTaskTemplateId(templateId);
    setTaskTemplateDetailsError(undefined);
    setTaskTemplateDetailOpen(true);
    setSelectedSkillVersionId(undefined);
    setSkillDetailsError(undefined);
    setSkillDetailOpen(false);
    replaceTaskTemplateIdInLocationSearch(templateId);
  }, []);

  const closeTaskTemplateDetails = useCallback(() => {
    setTaskTemplateDetailOpen(false);
    setSelectedTaskTemplateId(undefined);
    setTaskTemplateDetailsError(undefined);
    replaceTaskTemplateIdInLocationSearch();
  }, []);

  const openSkillDetails = useCallback((skillVersionId: string) => {
    setSelectedSkillVersionId(skillVersionId);
    setSkillDetailsError(undefined);
    setSkillDetailOpen(true);
    setSelectedTaskTemplateId(undefined);
    setTaskTemplateDetailsError(undefined);
    setTaskTemplateDetailOpen(false);
    replaceSkillVersionIdInLocationSearch(skillVersionId);
  }, []);

  const closeSkillDetails = useCallback(() => {
    setSkillDetailOpen(false);
    setSelectedSkillVersionId(undefined);
    setSkillDetailsError(undefined);
    replaceSkillVersionIdInLocationSearch();
  }, []);

  const closeRunDetails = useCallback(() => {
    setDetailOpen(false);
    setSelectedRunId(undefined);
    setRunDetailsError(undefined);
    setActiveDetailTab('summary');
    setTerminalSnapshotState(null);
    resetObservability();
    replaceRunIdInLocationSearch();
  }, [resetObservability]);

  const handleRunFilterChange = useCallback((filter: CompiledFilter) => {
    setRunPagination((current) => ({
      ...current,
      current: 1,
    }));
    setRunFilters(filter);
  }, []);

  const handleRunTableChange = useCallback<NonNullable<TableProps<RunRecord>['onChange']>>(
    (pagination, _filters, sorter) => {
      const nextSort = getRunSortParam(sorter) || RUN_SORT_FALLBACK;
      setRunPagination((current) => ({
        current: nextSort === runSort ? pagination.current || current.current : 1,
        pageSize: pagination.pageSize || current.pageSize,
      }));
      setRunSort(nextSort);
    },
    [runSort],
  );

  const openBuildTask = useCallback(() => {
    buildRunOptionsRequest.run();
    buildTaskForm.setFieldsValue({
      cwd: buildTaskForm.getFieldValue('cwd') || defaultBuildTaskCwd,
      runner: buildTaskForm.getFieldValue('runner') || defaultBuildRunnerValue,
    });
    setBuildTaskOpen(true);
  }, [buildRunOptionsRequest, buildTaskForm, defaultBuildRunnerValue, defaultBuildTaskCwd]);

  const closeBuildTask = useCallback(() => {
    setBuildTaskOpen(false);
  }, []);

  const openExternalRunImport = useCallback(() => {
    externalRunImportForm.setFieldsValue(DEFAULT_EXTERNAL_RUN_IMPORT_FORM_VALUES);
    setExternalRunLogContent('');
    setExternalRunImportOpen(true);
  }, [externalRunImportForm]);

  const closeExternalRunImport = useCallback(() => {
    setExternalRunImportOpen(false);
    setExternalRunLogContent('');
    externalRunImportForm.resetFields();
  }, [externalRunImportForm]);

  const openSkillUploadModal = useCallback(() => {
    setSkillZipFile(null);
    setSkillUploadResult(null);
    skillUploadForm.setFieldsValue(DEFAULT_SKILL_UPLOAD_FORM_VALUES);
    setSkillUploadOpen(true);
  }, [skillUploadForm]);

  const closeSkillUploadModal = useCallback(() => {
    setSkillUploadOpen(false);
    setSkillZipFile(null);
    setSkillUploadResult(null);
    skillUploadForm.resetFields();
  }, [skillUploadForm]);

  const handleBuildTaskTemplateChange = useCallback(
    (templateId?: string) => {
      const template = findBuildTaskTemplate(buildRunOptionsRequest.data, templateId);
      if (!template) {
        return;
      }
      buildTaskForm.setFieldsValue({
        title: template.defaultTitle || '',
        prompt: template.defaultPrompt || '',
        cwd: template.cwd || defaultBuildTaskCwd || '.',
        skillVersionIds: template.skillVersionIds || [],
        artifactRoot: template.artifactRoot,
        artifactDeclarations: getTaskArtifactFormValues(template.artifacts),
      });
    },
    [buildRunOptionsRequest.data, buildTaskForm, defaultBuildTaskCwd],
  );

  const submitSkillUpload = useCallback(async () => {
    try {
      const values = await skillUploadForm.validateFields();
      if (!skillZipFile) {
        ctx.message?.error(t('Skill ZIP file is required'));
        return;
      }
      uploadSkillVersionRequest.run({
        ...values,
        file: skillZipFile,
      });
    } catch (error) {
      if (!isFormValidationError(error)) {
        ctx.message?.error(t('Failed to upload skill'));
      }
    }
  }, [ctx.message, skillUploadForm, skillZipFile, t, uploadSkillVersionRequest]);

  const handleSkillZipBeforeUpload = useCallback<NonNullable<UploadProps['beforeUpload']>>(
    async (file) => {
      try {
        setSkillZipFile(file);
      } catch {
        setSkillZipFile(null);
        ctx.message?.error(t('Failed to read skill ZIP file'));
      }
      return false;
    },
    [ctx.message, t],
  );

  const handleSkillZipRemove = useCallback<NonNullable<UploadProps['onRemove']>>(() => {
    setSkillZipFile(null);
    return true;
  }, []);

  const handleExternalLogBeforeUpload = useCallback<NonNullable<UploadProps['beforeUpload']>>(
    async (file) => {
      try {
        setExternalRunLogContent(await readFileAsText(file));
      } catch {
        setExternalRunLogContent('');
        ctx.message?.error(t('Failed to read log file'));
      }
      return false;
    },
    [ctx.message, t],
  );

  const handleExternalLogRemove = useCallback<NonNullable<UploadProps['onRemove']>>(() => {
    setExternalRunLogContent('');
    return true;
  }, []);

  const submitBuildTask = useCallback(async () => {
    try {
      const values = await buildTaskForm.validateFields();
      createBuildTaskRequest.run({
        ...buildTaskForm.getFieldsValue(true),
        ...values,
      });
    } catch (error) {
      if (!isFormValidationError(error)) {
        ctx.message?.error(t('Failed to create task run'));
      }
    }
  }, [buildTaskForm, createBuildTaskRequest, ctx.message, t]);

  const submitExternalRunImport = useCallback(async () => {
    try {
      const values = await externalRunImportForm.validateFields();
      importExternalRunRequest.run({
        ...values,
        logContent: externalRunLogContent,
      });
    } catch (error) {
      if (!isFormValidationError(error)) {
        ctx.message?.error(t('Failed to import external run'));
      }
    }
  }, [ctx.message, externalRunImportForm, externalRunLogContent, importExternalRunRequest, t]);

  const renderCancelButton = useCallback(
    (run: RunRecord) => {
      const canCancelRun = isRunActionAllowed(run.agentGatewayActionPermissionsJson, 'cancelRun');
      return isCancelableRun(run) && canCancelRun ? (
        <Tooltip title={t('Cancel run')}>
          <Button
            aria-label={t('Cancel run')}
            danger
            icon={<StopOutlined />}
            loading={cancelRunRequest.loading}
            onClick={() => cancelRunRequest.run(run)}
          />
        </Tooltip>
      ) : null;
    },
    [cancelRunRequest, t],
  );

  const runColumns = useMemo<ColumnsType<RunRecord>>(
    () => [
      {
        title: t('Task'),
        dataIndex: 'runCode',
        key: 'runCode',
        width: 320,
        sorter: true,
        sortOrder: getRunColumnSortOrder(runSort, 'runCode'),
        render: (_value: unknown, record) => <RunTaskTitle run={record} t={t} onOpen={openRunDetails} />,
      },
      {
        title: t('Task template'),
        dataIndex: 'taskTemplateId',
        key: 'taskTemplateId',
        width: 220,
        sorter: true,
        sortOrder: getRunColumnSortOrder(runSort, 'taskTemplateId'),
        render: (_value: string | null | undefined, record) => (
          <RunTaskTemplateLink run={record} onOpen={openTaskTemplateDetails} />
        ),
      },
      {
        title: t('Skills'),
        key: 'taskTemplateSkills',
        width: 240,
        render: (_value: unknown, record) => <RunTaskTemplateSkills run={record} onOpen={openSkillDetails} />,
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        key: 'status',
        width: 132,
        sorter: true,
        sortOrder: getRunColumnSortOrder(runSort, 'status'),
        render: (value: string | undefined) => statusTag(value),
      },
      {
        title: t('Runner'),
        key: 'runner',
        width: 220,
        render: (_value: unknown, record) => <RunRunnerSummary run={record} t={t} />,
      },
      {
        title: t('Source'),
        dataIndex: 'sourceType',
        key: 'sourceType',
        sorter: true,
        sortOrder: getRunColumnSortOrder(runSort, 'sourceType'),
        render: (value: string | null | undefined, record) =>
          [value, record.sourceCollection, record.sourceRecordId].filter(Boolean).join(' / ') || '-',
      },
      {
        title: t('Started at'),
        dataIndex: 'startedAt',
        key: 'startedAt',
        width: 180,
        sorter: true,
        sortOrder: getRunColumnSortOrder(runSort, 'startedAt'),
        render: (value: string | undefined) => formatDateTime(value),
      },
      {
        title: t('Time'),
        key: 'duration',
        width: 120,
        render: (_value: unknown, record) => formatRunDuration(record),
      },
      {
        title: t('Tokens'),
        key: 'tokens',
        width: 180,
        render: (_value: unknown, record) => <RunTokenUsageSummary usage={record.tokenUsageJson} t={t} />,
      },
    ],
    [openRunDetails, openSkillDetails, openTaskTemplateDetails, runSort, t],
  );

  const activeRunDetails =
    !runDetailsError && selectedRunId && runDetailsRequest.data?.run?.id === selectedRunId
      ? runDetailsRequest.data
      : null;
  const activeRunEventsDetails = observability.events.state;
  const activeRunArtifactsDetails = observability.artifacts.state;
  const activeRunApiLogsDetails = observability.apiLogs.state;
  const runListData = useMemo<RunListData>(() => runsRequest.data || { runs: [], meta: {} }, [runsRequest.data]);
  const runListTotal = runListData.meta.count ?? runListData.runs.length;
  const runTaskTemplateFilterOptions = useMemo(() => getRunTaskTemplateFilterOptions(runListData), [runListData]);
  const runsFilterCollection = useMemo(() => {
    const collection = new Collection(getRunsFilterCollectionOptions(runTaskTemplateFilterOptions));
    const dataSource = ctx.dataSourceManager?.getDataSource('main');
    if (dataSource) {
      collection.setDataSource(dataSource);
    }
    return collection;
  }, [ctx.dataSourceManager, runTaskTemplateFilterOptions]);
  const { current: runPageCurrent, pageSize: runPageSize } = runPagination;
  const runTablePagination = useMemo<TablePaginationConfig>(
    () => ({
      current: runPageCurrent,
      pageSize: runPageSize,
      total: runListTotal,
      showSizeChanger: true,
      pageSizeOptions: ['10', '20', '50', '100'],
      showTotal: (total) => t('Total {{count}} runs', { count: total }),
    }),
    [runListTotal, runPageCurrent, runPageSize, t],
  );
  const selectedRun = activeRunDetails?.run || runListData.runs.find((run) => run.id === selectedRunId);
  const selectedTaskTemplate =
    taskTemplateDetailsRequest.data &&
    selectedTaskTemplateId &&
    (taskTemplateDetailsRequest.data.id === selectedTaskTemplateId ||
      taskTemplateDetailsRequest.data.templateKey === selectedTaskTemplateId)
      ? taskTemplateDetailsRequest.data
      : null;
  const selectedSkillVersion =
    skillVersionDetailsRequest.data &&
    selectedSkillVersionId &&
    (skillVersionDetailsRequest.data.id === selectedSkillVersionId ||
      skillVersionDetailsRequest.data.skillVersionId === selectedSkillVersionId)
      ? skillVersionDetailsRequest.data
      : null;
  const actionPermissions = activeRunDetails?.run.agentGatewayActionPermissionsJson || {};
  const canResumeAgentSession =
    isRunActionAllowed(actionPermissions, 'resumeAgentSession') &&
    Boolean(activeRunDetails?.run && getRunCapability(activeRunDetails.run, 'resumeSession'));
  const canReadSessionMessages = isRunActionAllowed(actionPermissions, 'readSessionMessages');
  const canReadTerminal = isRunActionAllowed(actionPermissions, 'readTerminal');
  const canStreamTerminal =
    activeDetailTab === 'agent-sessions' &&
    canReadTerminal &&
    isLiveRunStatus(activeRunDetails?.run.status) &&
    Boolean(activeRunDetails?.run && getRunCapability(activeRunDetails.run, 'terminalOutput'));
  const terminalSnapshot =
    canReadTerminal && !runDetailsError && terminalSnapshotState && terminalSnapshotState.runId === selectedRunId
      ? terminalSnapshotState.snapshot
      : null;
  const controlActions = activeRunDetails?.run.agentGatewayControlActionsJson || {};
  const terminalControlAvailable = canUseTerminalControl(activeRunDetails?.run, terminalSnapshot);
  const latestConversationEvents = observability.conversation.state;
  const timelineEvents = latestConversationEvents?.events || activeRunDetails?.conversationEvents || [];
  const timelineWarning =
    observability.conversation.warning ||
    (latestConversationEvents ? undefined : activeRunDetails?.warnings.conversationEvents);
  const timelineLoading =
    observability.conversation.loading ||
    Boolean(
      activeRunDetails &&
        activeDetailTab === 'summary' &&
        canReadSessionMessages &&
        !latestConversationEvents &&
        !timelineEvents.length &&
        !timelineWarning,
    );
  const logEvents = activeRunEventsDetails?.events || [];
  const logEventsWarning = activeRunEventsDetails?.warning || rawLogDetailsWarning;
  const displayArtifacts = activeRunArtifactsDetails?.artifacts || [];
  const displaySnapshots = activeRunArtifactsDetails?.snapshots || [];
  const artifactMeta = activeRunArtifactsDetails?.artifactMeta || createDetailPageMeta();
  const snapshotMeta = activeRunArtifactsDetails?.snapshotMeta || createDetailPageMeta();
  const artifactContentEntries = observability.artifacts.contentEntries;
  const artifactsWarning = activeRunArtifactsDetails?.warnings.artifacts || artifactDetailsWarning;
  const snapshotsWarning = activeRunArtifactsDetails?.warnings.snapshots || artifactDetailsWarning;
  const apiCallLogs = activeRunApiLogsDetails?.apiCallLogs || [];
  const apiCallLogsMeta = activeRunApiLogsDetails?.meta || createDetailPageMeta();
  const apiCallLogsWarning = activeRunApiLogsDetails?.warning || rawLogDetailsWarning;
  const useLegacyTimelineFallback = canUseLegacyTimelineFallback(
    activeRunDetails?.run,
    timelineEvents.length,
    Boolean(timelineWarning),
  );
  const showTerminalStreamSmoke = isTerminalStreamSmokeEnabled();
  const createStreamTicket = useCallback(
    async (runId: string) => {
      const response = await ctx.api.request<{
        ticket: string;
        ticketProof: string;
        authProof?: string;
        authenticator?: string;
        role?: string | null;
        runId?: string;
        protocols?: string[];
        expiresAt?: string;
      }>({
        url: `agent-gateway/runs/${encodeURIComponent(runId)}/terminal-stream-tickets:create`,
        method: 'post',
      });
      return getRequiredResponseData(response, t('Failed to create terminal stream ticket'));
    },
    [ctx.api, t],
  );
  const terminalStream = useTerminalStream({
    runId: selectedRunId,
    enabled: detailOpen && canStreamTerminal && Boolean(activeRunDetails?.run.id === selectedRunId),
    createStreamTicket,
  });
  const terminalStreamFallbackActive =
    canStreamTerminal && (terminalStream.connectionState !== 'live' || Boolean(terminalStream.lastErrorCode));

  useEffect(() => {
    if (!detailOpen || !selectedRunId || runDetailsError || pollingRun?.id !== selectedRunId) {
      terminalSnapshotRequestKeyRef.current = undefined;
      return;
    }
    const run = pollingRun;
    const pollActionPermissions = selectedRunActionPermissions || {};
    const canPollTerminal =
      activeDetailTab === 'agent-sessions' && isRunActionAllowed(pollActionPermissions, 'readTerminal');
    const terminalOutputSupported = getRunCapability(run, 'terminalOutput');
    const canPollSessionMessages =
      activeDetailTab === 'summary' && isRunActionAllowed(pollActionPermissions, 'readSessionMessages');

    if (!canPollTerminal) {
      terminalSnapshotRequestKeyRef.current = undefined;
    } else if (!terminalOutputSupported) {
      terminalSnapshotRequestKeyRef.current = `${run.id}:unsupported`;
      setTerminalSnapshotState((previous) => {
        if (previous?.runId === run.id && previous.snapshot?.unsupportedCapability === 'terminalOutput') {
          return previous;
        }
        return {
          runId: run.id,
          snapshot: createUnsupportedTerminalSnapshot(run),
        };
      });
    } else {
      const snapshotRequestKey = `${run.id}:${isLiveRunStatus(run.status) ? 'live' : 'settled'}`;
      const needsInitialSnapshot = terminalSnapshotRequestKeyRef.current !== snapshotRequestKey;
      terminalSnapshotRequestKeyRef.current = snapshotRequestKey;
      if (needsInitialSnapshot || terminalStreamFallbackActive) {
        refreshTerminalSnapshot();
      }
    }
    if (canPollSessionMessages) {
      refreshConversationEvents();
    }
    if (!isLiveRunStatus(run.status)) {
      return;
    }

    const realtimeTimer =
      terminalStreamFallbackActive || canPollSessionMessages
        ? window.setInterval(() => {
            if (terminalStreamFallbackActive) {
              refreshTerminalSnapshot();
            }
            if (canPollSessionMessages) {
              refreshConversationEvents();
            }
          }, 2000)
        : undefined;
    const summaryTimer = window.setInterval(() => {
      refreshRuns();
      refreshRunDetails();
    }, 5000);
    return () => {
      if (realtimeTimer !== undefined) {
        window.clearInterval(realtimeTimer);
      }
      window.clearInterval(summaryTimer);
    };
  }, [
    activeDetailTab,
    detailOpen,
    pollingRun,
    refreshConversationEvents,
    refreshRunDetails,
    refreshRuns,
    refreshTerminalSnapshot,
    runDetailsError,
    selectedRunActionPermissions,
    selectedRunId,
    terminalStreamFallbackActive,
  ]);

  useEffect(() => {
    selectedRunIdRef.current = selectedRunId;
  }, [selectedRunId]);

  useEffect(() => {
    if (
      !buildTaskOpen ||
      !shouldUseDefaultBuildRunner(
        buildRunOptionsRequest.data,
        buildTaskForm.getFieldValue('runner'),
        defaultBuildRunnerValue,
      )
    ) {
      return;
    }
    buildTaskForm.setFieldValue('runner', defaultBuildRunnerValue);
  }, [buildRunOptionsRequest.data, buildTaskForm, buildTaskOpen, defaultBuildRunnerValue]);

  useEffect(() => {
    if (!buildTaskOpen || !defaultBuildTaskCwd || buildTaskForm.getFieldValue('cwd')) {
      return;
    }
    buildTaskForm.setFieldValue('cwd', defaultBuildTaskCwd);
  }, [buildTaskForm, buildTaskOpen, defaultBuildTaskCwd]);

  useEffect(() => {
    syncRunDetailFromLocation();
    window.addEventListener('popstate', syncRunDetailFromLocation);
    return () => {
      window.removeEventListener('popstate', syncRunDetailFromLocation);
    };
  }, [syncRunDetailFromLocation]);

  useEffect(() => {
    syncRelatedDetailsFromLocation();
    window.addEventListener('popstate', syncRelatedDetailsFromLocation);
    return () => {
      window.removeEventListener('popstate', syncRelatedDetailsFromLocation);
    };
  }, [syncRelatedDetailsFromLocation]);

  useEffect(() => {
    setControlRequestState(null);
    controlIdempotencyKeysRef.current = {};
  }, [selectedRunId]);

  useEffect(() => {
    if (!controlRequestState?.controlRequestId || isFinalControlStatus(controlRequestState.status)) {
      return;
    }
    const poll = {
      action: controlRequestState.action,
      runId: controlRequestState.runId,
      controlRequestId: controlRequestState.controlRequestId,
    };
    const runPoll = () => {
      refreshControlRequestStatus(poll).catch(() => {
        // Keep the accepted state visible; the next interval can retry.
      });
    };
    if (controlRequestState.status === 'accepted') {
      runPoll();
    }
    const timer = window.setInterval(() => {
      runPoll();
    }, 2000);
    return () => {
      window.clearInterval(timer);
    };
  }, [
    controlRequestState?.action,
    controlRequestState?.controlRequestId,
    controlRequestState?.runId,
    controlRequestState?.status,
    refreshControlRequestStatus,
  ]);

  useEffect(() => {
    if (!controlRequestState?.controlRequestId || !activeRunDetails) {
      return;
    }
    if (controlRequestState.runId !== activeRunDetails.run.id) {
      return;
    }
    const nextStatus = (activeRunEventsDetails?.events || []).reduce<ControlRequestState['status'] | null>(
      (status, event) => {
        const controlRequestId = event.payloadJson?.controlRequestId;
        if (controlRequestId !== controlRequestState.controlRequestId) {
          return status;
        }
        const eventType = event.eventType || '';
        if (event.source !== 'terminal-control') {
          return status;
        }
        if (eventType.endsWith('.succeeded')) {
          return 'succeeded';
        }
        if (eventType.endsWith('.failed')) {
          return 'failed';
        }
        if (eventType.endsWith('.delivered') && status !== 'succeeded' && status !== 'failed') {
          return 'delivered';
        }
        return status;
      },
      null,
    );
    if (!nextStatus) {
      return;
    }
    if (controlRequestState.status === nextStatus) {
      return;
    }
    setControlRequestState({
      ...controlRequestState,
      status: nextStatus,
    });
    if (nextStatus === 'succeeded' || nextStatus === 'failed') {
      resetControlIdempotencyKey(controlRequestState.action);
    }
  }, [activeRunDetails, activeRunEventsDetails?.events, controlRequestState, resetControlIdempotencyKey]);

  return (
    <section aria-label={t('Runs')}>
      <Card variant="borderless">
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Flex justify="space-between" align="center" gap={8} wrap="wrap">
            <CollectionFilter
              collection={runsFilterCollection}
              filterableFieldNames={RUNS_FILTER_FIELD_NAMES}
              initialValue={runFilters}
              onChange={handleRunFilterChange}
              t={t}
            />
            <Space wrap>
              <Button type="primary" icon={<PlusOutlined />} onClick={openBuildTask}>
                {t('New task run')}
              </Button>
              <Button icon={<ImportOutlined />} onClick={openExternalRunImport}>
                {t('Import external run')}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={runsRequest.refresh}>
                {t('Refresh')}
              </Button>
            </Space>
          </Flex>

          <Table<RunRecord>
            columns={runColumns}
            dataSource={runListData.runs}
            loading={runsRequest.loading && !runsRequest.data}
            rowKey="id"
            locale={{ emptyText: <EmptyInline description={t('No runs yet')} /> }}
            pagination={runTablePagination}
            onChange={handleRunTableChange}
          />
        </Space>
      </Card>

      <Drawer
        title={selectedRun ? getRunTaskTitle(selectedRun, t) : t('Run details')}
        open={detailOpen}
        onClose={closeRunDetails}
        width={TASK_RUN_DRAWER_WIDTH}
        extra={selectedRun && isCancelableRun(selectedRun) ? renderCancelButton(selectedRun) : null}
        destroyOnClose
      >
        {runDetailsError ? (
          <Alert type="warning" showIcon message={t('Run details unavailable')} description={runDetailsError} />
        ) : null}
        {!runDetailsError && detailOpen && selectedRunId && !activeRunDetails ? <Spin /> : null}
        {activeRunDetails ? (
          <Tabs
            activeKey={activeDetailTab}
            onChange={(key) => setActiveDetailTab(key as RunDetailTabKey)}
            destroyInactiveTabPane
            items={[
              {
                key: 'summary',
                label: t('Summary'),
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <RunnerQueueAlert run={activeRunDetails.run} t={t} />
                    {latestConversationEvents?.hasMoreBefore ? (
                      <Button
                        loading={observability.conversation.loading}
                        onClick={observability.conversation.loadOlder}
                      >
                        {t('Load older messages')}
                      </Button>
                    ) : null}
                    <AgentTimeline
                      t={t}
                      events={timelineEvents}
                      legacyEvents={activeRunDetails.events}
                      useLegacyFallback={useLegacyTimelineFallback}
                      closeDanglingToolCalls={shouldCloseDanglingToolCalls(activeRunDetails.run.status)}
                      warning={timelineWarning}
                      emptyDescription={getTimelineEmptyDescription(activeRunDetails.run, t)}
                      loading={timelineLoading}
                    />
                    <RunSummaryPanel run={activeRunDetails.run} t={t} />
                  </Space>
                ),
              },
              {
                key: 'agent-sessions',
                label: t('Agent Sessions'),
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <AgentSessionPanel
                      run={activeRunDetails.run}
                      t={t}
                      canResumeAgentSession={canResumeAgentSession}
                      resumeLoading={resumeSessionRequest.loading}
                      onResume={async (input) => {
                        await resumeSessionRequest.runAsync({
                          run: activeRunDetails.run,
                          ...input,
                        });
                      }}
                    />
                    {showTerminalStreamSmoke && canStreamTerminal ? (
                      <TerminalStreamSmokePanel runId={activeRunDetails.run.id} />
                    ) : null}
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
                              controlRequestState={controlRequestState}
                              canReadTerminal={canReadTerminal}
                              canInterrupt={terminalControlAvailable && controlActions.interruptRun === true}
                              canTerminate={terminalControlAvailable && controlActions.terminateRun === true}
                              onRefresh={refreshTerminalSnapshot}
                              onInterrupt={() => interruptTerminalRequest.run(activeRunDetails.run.id)}
                              onTerminate={() => terminateTerminalRequest.run(activeRunDetails.run.id)}
                            />
                          ),
                        },
                      ]}
                    />
                  </Space>
                ),
              },
              {
                key: 'logs',
                label: t('Logs'),
                children: (
                  <LogsPanel
                    t={t}
                    run={activeRunDetails.run}
                    events={logEvents}
                    eventsWarning={logEventsWarning}
                    hasMoreBefore={activeRunEventsDetails?.hasMoreBefore}
                    loading={observability.events.loading}
                    onLoadOlder={observability.events.loadOlder}
                  />
                ),
              },
              {
                key: 'artifacts',
                label: t('Artifacts'),
                children: (
                  <ArtifactsPanel
                    t={t}
                    artifacts={displayArtifacts}
                    snapshots={displaySnapshots}
                    artifactMeta={artifactMeta}
                    snapshotMeta={snapshotMeta}
                    artifactContentEntries={artifactContentEntries}
                    artifactsWarning={artifactsWarning}
                    snapshotsWarning={snapshotsWarning}
                    artifactsLoading={observability.artifacts.artifactLoading}
                    snapshotsLoading={observability.artifacts.snapshotLoading}
                    onArtifactPageChange={observability.artifacts.changeArtifactPage}
                    onSnapshotPageChange={observability.artifacts.changeSnapshotPage}
                    onLoadArtifactContent={observability.artifacts.loadContent}
                  />
                ),
              },
              {
                key: 'api-logs',
                label: t('API Logs'),
                children: (
                  <ApiLogsPanel
                    t={t}
                    apiCallLogs={apiCallLogs}
                    meta={apiCallLogsMeta}
                    apiCallLogsWarning={apiCallLogsWarning}
                    loading={observability.apiLogs.loading}
                    onPageChange={observability.apiLogs.changePage}
                  />
                ),
              },
            ]}
          />
        ) : null}
      </Drawer>

      <Drawer
        title={
          selectedTaskTemplate
            ? selectedTaskTemplate.displayName || selectedTaskTemplate.templateKey
            : t('Task template detail')
        }
        open={taskTemplateDetailOpen}
        onClose={closeTaskTemplateDetails}
        width={TASK_RUN_DRAWER_WIDTH}
        destroyOnClose
      >
        <TaskTemplateDetailDrawerContent
          template={selectedTaskTemplate}
          loading={taskTemplateDetailsRequest.loading}
          error={taskTemplateDetailsError}
          t={t}
        />
      </Drawer>

      <Drawer
        title={selectedSkillVersion ? getSkillVersionDetailDisplayLabel(selectedSkillVersion) : t('Skill detail')}
        open={skillDetailOpen}
        onClose={closeSkillDetails}
        width={SKILL_DETAIL_DRAWER_WIDTH}
        destroyOnClose
      >
        <SkillDetailDrawerContent
          skillVersion={selectedSkillVersion}
          loading={skillVersionDetailsRequest.loading}
          error={skillDetailsError}
          t={t}
        />
      </Drawer>

      <Drawer
        title={t('New task run')}
        open={buildTaskOpen}
        onClose={closeBuildTask}
        width={TASK_RUN_DRAWER_WIDTH}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={closeBuildTask}>{t('Close')}</Button>
            <Button
              type="primary"
              loading={createBuildTaskRequest.loading}
              disabled={buildRunOptionsRequest.loading || !hasOnlineBuildRunner}
              onClick={submitBuildTask}
            >
              {t('Create')}
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          {buildRunnerSelectOptions.length ? null : (
            <Alert type="warning" showIcon message={t('No active runner profiles yet')} />
          )}
          {buildRunnerSelectOptions.length && !hasOnlineBuildRunner ? (
            <Alert
              type="warning"
              showIcon
              message={t('No online runner is available. Start or reconnect the daemon.')}
            />
          ) : null}
          <Form<BuildTaskFormValues>
            form={buildTaskForm}
            layout="vertical"
            initialValues={{
              cwd: defaultBuildTaskCwd,
              runner: defaultBuildRunnerValue,
            }}
          >
            <Form.Item label={t('Task template')} name="taskTemplateId">
              <Select
                allowClear
                loading={buildRunOptionsRequest.loading}
                onChange={handleBuildTaskTemplateChange}
                options={buildTaskTemplateSelectOptions}
                optionFilterProp="label"
                placeholder={t('Select task template')}
                showSearch
              />
            </Form.Item>
            <AgentGatewayTaskParameterFormItems
              t={t}
              loading={buildRunOptionsRequest.loading}
              runnerSelectOptions={buildRunnerSelectOptions}
              skillVersionSelectOptions={buildSkillVersionSelectOptions}
              promptRequired
              runnerRequired
              onUploadSkill={openSkillUploadModal}
            />
          </Form>
        </Space>
      </Drawer>

      <Drawer
        title={t('Import external run')}
        open={externalRunImportOpen}
        onClose={closeExternalRunImport}
        width={TASK_RUN_DRAWER_WIDTH}
        destroyOnClose
        extra={
          <Space>
            <Button onClick={closeExternalRunImport}>{t('Close')}</Button>
            <Button type="primary" loading={importExternalRunRequest.loading} onClick={submitExternalRunImport}>
              {t('Import')}
            </Button>
          </Space>
        }
      >
        <Form<ExternalRunImportFormValues>
          form={externalRunImportForm}
          layout="vertical"
          initialValues={DEFAULT_EXTERNAL_RUN_IMPORT_FORM_VALUES}
        >
          <Form.Item
            label={t('Provider')}
            name="provider"
            rules={[{ required: true, message: t('Provider is required') }]}
          >
            <Select
              onChange={(provider) => {
                const defaultFormats: Record<string, string> = {
                  codex: 'codex-jsonl',
                  opencode: 'opencode-jsonl',
                  'claude-code': 'claude-code-jsonl',
                  'generic-cli': 'text',
                };
                externalRunImportForm.setFieldValue('format', defaultFormats[String(provider)] || 'text');
              }}
              options={[
                { value: 'codex', label: 'Codex' },
                { value: 'opencode', label: 'OpenCode' },
                { value: 'claude-code', label: 'Claude Code' },
                { value: 'generic-cli', label: t('Generic CLI') },
              ]}
            />
          </Form.Item>
          <Form.Item
            label={t('Log format')}
            name="format"
            rules={[{ required: true, message: t('Log format is required') }]}
          >
            <Select
              options={[
                { value: 'codex-jsonl', label: 'Codex JSONL' },
                { value: 'opencode-jsonl', label: 'OpenCode JSONL' },
                { value: 'claude-code-jsonl', label: 'Claude Code JSONL' },
                { value: 'text', label: t('Plain text') },
              ]}
            />
          </Form.Item>
          <Form.Item label={t('Title')} name="title">
            <Input />
          </Form.Item>
          <Form.Item label={t('Prompt')} name="instruction">
            <Input.TextArea autoSize={{ minRows: 3, maxRows: 8 }} />
          </Form.Item>
          <Form.Item label={t('Status')} name="status" rules={[{ required: true, message: t('Status is required') }]}>
            <Select
              options={['running', 'succeeded', 'failed', 'canceled', 'timeout', 'abandoned'].map((status) => ({
                value: status,
                label: status,
              }))}
            />
          </Form.Item>
          <Form.Item
            label={t('External run key')}
            name="externalRunKey"
            rules={[{ required: true, whitespace: true, message: t('External run key is required') }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label={t('Log file')}>
            <Upload
              accept=".jsonl,.ndjson,.json,.log,.txt,text/plain,application/json,application/x-ndjson"
              beforeUpload={handleExternalLogBeforeUpload}
              maxCount={1}
              onRemove={handleExternalLogRemove}
            >
              <Button icon={<UploadOutlined />}>{t('Upload')}</Button>
            </Upload>
          </Form.Item>
          <Form.Item label={t('Raw log')}>
            <Input.TextArea
              aria-label={t('Raw log')}
              autoSize={{ minRows: 8, maxRows: 16 }}
              value={externalRunLogContent}
              onChange={(event) => setExternalRunLogContent(event.target.value)}
            />
          </Form.Item>
          <FastCollapse
            ghost
            size="small"
            openMotion={NO_COLLAPSE_MOTION}
            items={[
              {
                key: 'advanced',
                label: t('Advanced'),
                children: (
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Form.Item label={t('Provider session ID')} name="providerSessionId">
                      <Input />
                    </Form.Item>
                    <Form.Item label={t('Source collection')} name="sourceCollection">
                      <Input />
                    </Form.Item>
                    <Form.Item label={t('Source record ID')} name="sourceRecordId">
                      <Input />
                    </Form.Item>
                    <Form.Item label={t('Output Agent run field')} name="outputAgentRunField">
                      <Input />
                    </Form.Item>
                  </Space>
                ),
              },
            ]}
          />
        </Form>
      </Drawer>

      <Modal
        title={t('Upload skill')}
        open={skillUploadOpen}
        onCancel={closeSkillUploadModal}
        onOk={submitSkillUpload}
        confirmLoading={uploadSkillVersionRequest.loading}
        okText={t('Upload')}
        cancelText={t('Close')}
        destroyOnClose
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Form<SkillUploadFormValues>
            form={skillUploadForm}
            layout="vertical"
            initialValues={DEFAULT_SKILL_UPLOAD_FORM_VALUES}
          >
            <Form.Item
              label={t('Skill key')}
              name="skillKey"
              rules={[{ required: true, message: t('Skill key is required') }]}
            >
              <Input />
            </Form.Item>
            <Form.Item label={t('Display name')} name="displayName">
              <Input />
            </Form.Item>
            <Form.Item
              label={t('Version label')}
              name="versionLabel"
              rules={[{ required: true, message: t('Version label is required') }]}
            >
              <Input placeholder="local" />
            </Form.Item>
            <Form.Item label={t('Skill ZIP file')} required>
              <Upload
                accept=".zip,application/zip"
                beforeUpload={handleSkillZipBeforeUpload}
                maxCount={1}
                onRemove={handleSkillZipRemove}
              >
                <Button icon={<UploadOutlined />}>{t('Select ZIP')}</Button>
              </Upload>
            </Form.Item>
          </Form>

          {skillUploadResult ? (
            <Alert
              type="success"
              showIcon
              message={t('Skill uploaded')}
              description={[skillUploadResult.skillKey, skillUploadResult.versionLabel, skillUploadResult.status]
                .filter(Boolean)
                .join(' / ')}
            />
          ) : null}
        </Space>
      </Modal>
    </section>
  );
}
