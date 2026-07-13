/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ImportOutlined, PlusOutlined, ReloadOutlined, StopOutlined } from '@ant-design/icons';
import { Collection, useFlowContext } from '@nocobase/flow-engine';
import { CollectionFilter, CompiledFilter } from '@nocobase/client-v2';
import { useRequest } from 'ahooks';
import { Alert, Button, Card, Drawer, Flex, Form, Space, Spin, Table, Tabs, Tooltip } from 'antd';
import { TableProps, UploadProps } from 'antd';
import { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiUrl } from '../../shared/apiContract';
import { AgentTimeline } from '../components/AgentTimeline';
import { AgentSessionResumeInput } from '../components/AgentSessionResumeBox';
import { createDetailPageMeta, useRunObservabilityDetails } from '../hooks/useRunObservabilityDetails';
import { useTerminalStream } from '../hooks/useTerminalStream';
import { useT } from '../locale';
import { useRunDetailPolling } from '../features/runs/hooks/useRunDetailPolling';
import {
  BuildRunOptions,
  getBuildRunnerSelectOptions,
  getBuildSkillVersionSelectOptions,
  getDefaultBuildRunnerValue,
  getOptionalFormString,
  getTaskArtifactDeclarations,
  getTaskArtifactFormValues,
  hasSelectableBuildRunner,
  parseBuildRunnerValue,
} from './AgentGatewayTaskParameterFormItems';
import {
  formatDateTime,
  getApiErrorMessage,
  getRequiredResponseData,
  getResponseData,
  statusTag,
  uploadAgentGatewayFile,
} from './AgentGatewayPageUtils';
import {
  AgentGatewayPageContext,
  BuildTaskFormValues,
  ControlRequestResult,
  ControlRequestState,
  ControlRequestStatusPoll,
  CreateBuildRunResult,
  ExternalRunImportFormValues,
  ExternalRunImportResult,
  ResumeAgentSessionResult,
  RunDetailTabKey,
  RunDetails,
  RunListData,
  RunRecord,
  SkillUploadFormValues,
  SkillUploadResult,
  SkillVersionDetailRecord,
  TaskTemplateDetailRecord,
  TerminalSnapshot,
  TerminalSnapshotState,
} from './runs/types';
import {
  AgentSessionPanel,
  RunnerQueueAlert,
  RunRunnerSummary,
  RunSummaryPanel,
  RunTokenUsageSummary,
} from './runs/RunSummaryPanels';
import { formatRunDuration, getRunTaskTitle, isLiveRunStatus } from './runs/runFormatters';
import {
  getRunIdFromLocationSearch,
  getSkillVersionIdFromLocationSearch,
  getTaskTemplateIdFromLocationSearch,
  pushRunIdInLocationSearch,
  pushSkillVersionIdInLocationSearch,
  pushTaskTemplateIdInLocationSearch,
  replaceRunIdInLocationSearch,
  replaceSkillVersionIdInLocationSearch,
  replaceTaskTemplateIdInLocationSearch,
  useInitialRunDetailQuery,
  useInitialSkillVersionDetailQuery,
  useInitialTaskTemplateDetailQuery,
} from './runs/runLocation';
import {
  BuildTaskDrawer,
  DEFAULT_EXTERNAL_RUN_IMPORT_FORM_VALUES,
  DEFAULT_SKILL_UPLOAD_FORM_VALUES,
  ExternalRunImportDrawer,
  SkillUploadModal,
} from './runs/RunActionDrawers';
import { ArtifactsPanel, getArtifactDetailsWarning } from '../features/runs/artifacts/ArtifactsPanel';
import {
  ApiLogsPanel,
  LogsPanel,
  getRawLogDetailsWarning,
  getTimelineEmptyDescription,
  shouldCloseDanglingToolCalls,
} from '../features/runs/detail/RunLogsPanels';
import {
  RunTaskTemplateLink,
  RunTaskTemplateSkills,
  RunTaskTitle,
  SkillDetailDrawerContent,
  TaskTemplateDetailDrawerContent,
  getSkillVersionDetailDisplayLabel,
} from '../features/runs/detail/RelatedDetails';
import {
  DEFAULT_RUNS_PAGE_SIZE,
  EmptyInline,
  FastCollapse,
  NO_COLLAPSE_MOTION,
  RUNS_FILTER_FIELD_NAMES,
  RUN_SORT_FALLBACK,
  SKILL_DETAIL_DRAWER_WIDTH,
  TASK_RUN_DRAWER_WIDTH,
  findBuildTaskTemplate,
  getBuildTaskTemplateSelectOptions,
  getRunColumnSortOrder,
  getRunListMeta,
  getRunSortParam,
  getRunTaskTemplateFilterOptions,
  getRunsFilterCollectionOptions,
  getSkillVersionIds,
  isCancelableRun,
  isFormValidationError,
  isRunActionAllowed,
  readFileAsText,
  shouldUseDefaultBuildRunner,
} from '../features/runs/runShared';
import {
  TerminalPanel,
  canUseTerminalControl,
  createControlIdempotencyKey,
  createUnsupportedTerminalSnapshot,
  getRunCapability,
  isFinalControlStatus,
  shouldResetControlIdempotencyKey,
} from '../features/runs/terminal/TerminalPanel';

export { ArtifactContentPreview, sanitizeHtmlArtifactPreview } from '../features/runs/artifacts/ArtifactsPanel';

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
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns),
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
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.getTaskTemplate, selectedTaskTemplateId),
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
      const response = await ctx.api.request<SkillVersionDetailRecord>({
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.getSkillVersion, selectedSkillVersionId),
        method: 'get',
      });
      return getRequiredResponseData(response, t('Failed to load skill detail'));
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
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.listRunOptions),
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
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.createTaskRun),
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
          pushRunIdInLocationSearch(nextRunId);
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
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.importExternalRun),
        method: 'post',
        data: {
          provider: values.provider || 'codex',
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
          pushRunIdInLocationSearch(nextRunId);
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
      const { file, ...skillValues } = values;
      const uploadId = await uploadAgentGatewayFile(ctx.api, file, 'skill-version');
      const response = await ctx.api.request<SkillUploadResult>({
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.createSkillVersionFromUpload),
        method: 'post',
        data: { ...skillValues, uploadId },
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
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.getRun, selectedRunId),
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
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot, requestRunId),
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
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.cancelRun, run.id),
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
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.interruptTerminal, runId),
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
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.terminateTerminal, runId),
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
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus, poll.runId),
        method: 'get',
        params: {
          requestId: poll.controlRequestId,
        },
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
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.resumeAgentSession, options.run.agentSessionId),
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
        pushRunIdInLocationSearch(nextRunId);
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
      pushRunIdInLocationSearch(run.id);
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
    pushTaskTemplateIdInLocationSearch(templateId);
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
    pushSkillVersionIdInLocationSearch(skillVersionId);
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
  const createStreamTicket = useCallback(
    async (runId: string) => {
      const response = await ctx.api.request<{
        ticket: string;
        runId?: string;
        protocols?: string[];
        expiresAt?: string;
      }>({
        url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket, runId),
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

  const detailPollingEnabled =
    Boolean(detailOpen && selectedRunId && !runDetailsError && pollingRun?.id === selectedRunId) && Boolean(pollingRun);
  const pollingActionPermissions = selectedRunActionPermissions || {};
  const pollTerminalFallback =
    activeDetailTab === 'agent-sessions' &&
    isRunActionAllowed(pollingActionPermissions, 'readTerminal') &&
    Boolean(pollingRun && getRunCapability(pollingRun, 'terminalOutput')) &&
    terminalStreamFallbackActive;
  const pollConversation =
    activeDetailTab === 'summary' && isRunActionAllowed(pollingActionPermissions, 'readSessionMessages');

  useRunDetailPolling({
    enabled: detailPollingEnabled,
    live: isLiveRunStatus(pollingRun?.status),
    pollTerminalFallback,
    pollConversation,
    refreshTerminalSnapshot,
    refreshConversationEvents,
    refreshRunDetails,
    refreshRuns,
  });

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
  }, [
    activeDetailTab,
    detailOpen,
    pollingRun,
    refreshConversationEvents,
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
          <Flex role="toolbar" aria-label={t('Actions')} justify="space-between" align="center" gap={8} wrap="wrap">
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
            aria-label={t('Runs')}
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
            aria-label={t('Run details')}
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

      <BuildTaskDrawer
        t={t}
        open={buildTaskOpen}
        form={buildTaskForm}
        loading={createBuildTaskRequest.loading}
        optionsLoading={buildRunOptionsRequest.loading}
        hasOnlineRunner={hasOnlineBuildRunner}
        runnerOptions={buildRunnerSelectOptions}
        skillVersionOptions={buildSkillVersionSelectOptions}
        taskTemplateOptions={buildTaskTemplateSelectOptions}
        defaultCwd={defaultBuildTaskCwd}
        defaultRunner={defaultBuildRunnerValue}
        onClose={closeBuildTask}
        onSubmit={submitBuildTask}
        onTemplateChange={handleBuildTaskTemplateChange}
        onUploadSkill={openSkillUploadModal}
      />

      <ExternalRunImportDrawer
        t={t}
        open={externalRunImportOpen}
        form={externalRunImportForm}
        loading={importExternalRunRequest.loading}
        logContent={externalRunLogContent}
        onClose={closeExternalRunImport}
        onSubmit={submitExternalRunImport}
        onLogContentChange={setExternalRunLogContent}
        beforeUpload={handleExternalLogBeforeUpload}
        onRemove={handleExternalLogRemove}
      />

      <SkillUploadModal
        t={t}
        open={skillUploadOpen}
        form={skillUploadForm}
        loading={uploadSkillVersionRequest.loading}
        result={skillUploadResult}
        onClose={closeSkillUploadModal}
        onSubmit={submitSkillUpload}
        beforeUpload={handleSkillZipBeforeUpload}
        onRemove={handleSkillZipRemove}
      />
    </section>
  );
}
