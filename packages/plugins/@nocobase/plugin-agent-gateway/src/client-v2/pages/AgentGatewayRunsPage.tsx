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
import { CollectionFilter } from '@nocobase/client-v2';
import { useRequest } from 'ahooks';
import { Alert, Button, Card, Drawer, Flex, Space, Spin, Table, Tooltip } from 'antd';
import { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AGENT_GATEWAY_API_ACTIONS } from '../../shared/apiContract';
import { AgentTimeline } from '../components/AgentTimeline';
import { AgentSessionResumeInput } from '../components/AgentSessionResumeBox';
import { createDetailPageMeta, useRunObservabilityDetails } from '../hooks/useRunObservabilityDetails';
import { useTerminalStream } from '../hooks/useTerminalStream';
import { useT } from '../locale';
import { useRunDetailPolling } from '../features/runs/hooks/useRunDetailPolling';
import {
  formatDateTime,
  getApiErrorMessage,
  getRequiredResponseData,
  getResponseData,
  requestAgentGatewayAction,
  statusTag,
} from './AgentGatewayPageUtils';
import {
  AgentGatewayPageContext,
  ControlRequestResult,
  ControlRequestState,
  ControlRequestStatusPoll,
  ResumeAgentSessionResult,
  RunListData,
  RunRecord,
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
  useInitialRunDetailQuery,
  useInitialSkillVersionDetailQuery,
  useInitialTaskTemplateDetailQuery,
} from './runs/runLocation';
import { BuildTaskDrawer, ExternalRunImportDrawer, SkillUploadModal } from './runs/RunActionDrawers';
import { ArtifactsPanel, getArtifactDetailsWarning } from '../features/runs/artifacts/ArtifactsPanel';
import {
  ApiLogsPanel,
  LogsPanel,
  getRawLogDetailsWarning,
  getTimelineEmptyDescription,
  shouldCloseDanglingToolCalls,
} from '../features/runs/detail/RunLogsPanels';
import { RunDetailTabs } from '../features/runs/detail/RunDetailTabs';
import {
  RunTaskTemplateLink,
  RunTaskTemplateSkills,
  RunTaskTitle,
  SkillDetailDrawerContent,
  TaskTemplateDetailDrawerContent,
  getSkillVersionDetailDisplayLabel,
} from '../features/runs/detail/RelatedDetails';
import {
  EmptyInline,
  FastCollapse,
  NO_COLLAPSE_MOTION,
  RUNS_FILTER_FIELD_NAMES,
  SKILL_DETAIL_DRAWER_WIDTH,
  TASK_RUN_DRAWER_WIDTH,
  getRunColumnSortOrder,
  getRunListMeta,
  getRunTaskTemplateFilterOptions,
  getRunsFilterCollectionOptions,
  isCancelableRun,
  isRunActionAllowed,
} from '../features/runs/runShared';
import { useActiveRunDetailRequests } from '../features/runs/hooks/useActiveRunDetailRequests';
import { useRelatedRunDetails } from '../features/runs/hooks/useRelatedRunDetails';
import { useRunActionDrawers } from '../features/runs/hooks/useRunActionDrawers';
import { useRunDetailController } from '../features/runs/hooks/useRunDetailController';
import { useRunListState } from '../features/runs/hooks/useRunListState';
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
  const [terminalSnapshotState, setTerminalSnapshotState] = useState<TerminalSnapshotState | null>(null);
  const [controlRequestState, setControlRequestState] = useState<ControlRequestState | null>(null);
  const controlIdempotencyKeysRef = useRef<Partial<Record<'interrupt' | 'terminate', { runId: string; key: string }>>>(
    {},
  );
  const selectedRunIdRef = useRef<string | undefined>(initialRunId);
  const clearTerminal = useCallback(() => setTerminalSnapshotState(null), []);
  const runListState = useRunListState();
  const { filters: runFilters, sort: runSort, pagination: runPagination } = runListState;
  const runDetail = useRunDetailController({ ctx, t, initialRunId, onClearTerminal: clearTerminal });
  const {
    open: detailOpen,
    selectedRunId,
    error: runDetailsError,
    activeTab: activeDetailTab,
    setActiveTab: setActiveDetailTab,
    request: runDetailsRequest,
    openById: openRunDetailById,
    openRun: openRunDetail,
    close: closeRunDetails,
  } = runDetail;
  const relatedDetails = useRelatedRunDetails({
    ctx,
    t,
    initialTaskTemplateId,
    initialSkillVersionId,
  });

  const runsRequest = useRequest(
    async () => {
      const response = await requestAgentGatewayAction<RunRecord[], RunListData['meta']>(
        ctx.api,
        AGENT_GATEWAY_API_ACTIONS.listRuns,
        {
          method: 'get',
          params: {
            ...(runFilters ? { filter: JSON.stringify(runFilters) } : {}),
            ...(runSort ? { sort: runSort } : {}),
            page: runPagination.current,
            pageSize: runPagination.pageSize,
          },
        },
      );
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
  const openRunById = useCallback(
    (runId: string) => {
      resetObservability();
      openRunDetailById(runId);
    },
    [openRunDetailById, resetObservability],
  );
  const openRunDetails = useCallback(
    (run: RunRecord) => {
      resetObservability();
      openRunDetail(run);
    },
    [openRunDetail, resetObservability],
  );
  const actionDrawers = useRunActionDrawers({ ctx, t, refreshRuns, openRunById });
  const { buildTask, externalRunImport, skillUpload } = actionDrawers;
  const { taskTemplate: taskTemplateDetail, skill: skillDetail } = relatedDetails;
  const openTaskTemplateDetails = taskTemplateDetail.openDetails;
  const openSkillDetails = skillDetail.openDetails;
  const handleRunFilterChange = runListState.handleFilterChange;
  const handleRunTableChange = runListState.handleTableChange;

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
      const response = await requestAgentGatewayAction<TerminalSnapshot | null>(
        ctx.api,
        AGENT_GATEWAY_API_ACTIONS.getTerminalSnapshot,
        {
          method: 'get',
          targetKey: requestRunId,
        },
      );
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
      const response = await requestAgentGatewayAction<RunRecord>(ctx.api, AGENT_GATEWAY_API_ACTIONS.cancelRun, {
        method: 'post',
        targetKey: run.id,
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
      const response = await requestAgentGatewayAction<ControlRequestResult>(
        ctx.api,
        AGENT_GATEWAY_API_ACTIONS.interruptTerminal,
        {
          method: 'post',
          targetKey: runId,
          data: {
            idempotencyKey: getControlIdempotencyKey('interrupt', runId),
          },
        },
      );
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
      const response = await requestAgentGatewayAction<ControlRequestResult>(
        ctx.api,
        AGENT_GATEWAY_API_ACTIONS.terminateTerminal,
        {
          method: 'post',
          targetKey: runId,
          data: {
            idempotencyKey: getControlIdempotencyKey('terminate', runId),
          },
        },
      );
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
      const response = await requestAgentGatewayAction<ControlRequestResult>(
        ctx.api,
        AGENT_GATEWAY_API_ACTIONS.getControlRequestStatus,
        {
          method: 'get',
          targetKey: poll.runId,
          params: {
            requestId: poll.controlRequestId,
          },
        },
      );
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
      const response = await requestAgentGatewayAction<ResumeAgentSessionResult>(
        ctx.api,
        AGENT_GATEWAY_API_ACTIONS.resumeAgentSession,
        {
          method: 'post',
          targetKey: options.run.agentSessionId,
          data: {
            message: options.message,
            idempotencyKey: options.idempotencyKey,
            resumedFromRunId: options.run.id,
          },
        },
      );
      return getRequiredResponseData(response, t('Failed to resume session'));
    },
    {
      manual: true,
      onSuccess(result) {
        const nextRunId = String(result.runId);
        openRunById(nextRunId);
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
    taskTemplateDetail.request.data &&
    taskTemplateDetail.selectedId &&
    (taskTemplateDetail.request.data.id === taskTemplateDetail.selectedId ||
      taskTemplateDetail.request.data.templateKey === taskTemplateDetail.selectedId)
      ? taskTemplateDetail.request.data
      : null;
  const selectedSkillVersion =
    skillDetail.request.data &&
    skillDetail.selectedId &&
    (skillDetail.request.data.id === skillDetail.selectedId ||
      skillDetail.request.data.skillVersionId === skillDetail.selectedId)
      ? skillDetail.request.data
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
      const response = await requestAgentGatewayAction<{
        ticket: string;
        runId?: string;
        protocols?: string[];
        expiresAt?: string;
      }>(ctx.api, AGENT_GATEWAY_API_ACTIONS.createTerminalStreamTicket, {
        method: 'post',
        targetKey: runId,
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

  useActiveRunDetailRequests({
    activeTab: activeDetailTab,
    detailOpen,
    selectedRunId,
    refreshConversationEvents,
    refreshTerminalSnapshot,
    runDetailsError,
    run: pollingRun,
    setTerminalSnapshotState,
    terminalStreamFallbackActive,
  });

  useEffect(() => {
    selectedRunIdRef.current = selectedRunId;
  }, [selectedRunId]);

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
        const controlRequestId = event.contentJson?.controlRequestId;
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
              <Button type="primary" icon={<PlusOutlined />} onClick={buildTask.openDrawer}>
                {t('New task run')}
              </Button>
              <Button icon={<ImportOutlined />} onClick={externalRunImport.openDrawer}>
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
          <RunDetailTabs
            t={t}
            activeKey={activeDetailTab}
            onChange={setActiveDetailTab}
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
        open={taskTemplateDetail.open}
        onClose={taskTemplateDetail.close}
        width={TASK_RUN_DRAWER_WIDTH}
        destroyOnClose
      >
        <TaskTemplateDetailDrawerContent
          template={selectedTaskTemplate}
          loading={taskTemplateDetail.request.loading}
          error={taskTemplateDetail.error}
          t={t}
        />
      </Drawer>

      <Drawer
        title={selectedSkillVersion ? getSkillVersionDetailDisplayLabel(selectedSkillVersion) : t('Skill detail')}
        open={skillDetail.open}
        onClose={skillDetail.close}
        width={SKILL_DETAIL_DRAWER_WIDTH}
        destroyOnClose
      >
        <SkillDetailDrawerContent
          skillVersion={selectedSkillVersion}
          loading={skillDetail.request.loading}
          error={skillDetail.error}
          t={t}
        />
      </Drawer>

      <BuildTaskDrawer
        t={t}
        open={buildTask.open}
        form={buildTask.form}
        loading={buildTask.loading}
        optionsLoading={buildTask.optionsLoading}
        hasOnlineRunner={buildTask.hasOnlineRunner}
        runnerOptions={buildTask.runnerOptions}
        skillVersionOptions={buildTask.skillVersionOptions}
        taskTemplateOptions={buildTask.taskTemplateOptions}
        defaultCwd={buildTask.defaultCwd}
        defaultRunner={buildTask.defaultRunner}
        onClose={buildTask.close}
        onSubmit={buildTask.submit}
        onTemplateChange={buildTask.handleTaskTemplateChange}
        onUploadSkill={buildTask.openSkillUpload}
      />

      <ExternalRunImportDrawer
        t={t}
        open={externalRunImport.open}
        form={externalRunImport.form}
        loading={externalRunImport.loading}
        logContent={externalRunImport.logContent}
        onClose={externalRunImport.close}
        onSubmit={externalRunImport.submit}
        onLogContentChange={externalRunImport.setLogContent}
        beforeUpload={externalRunImport.beforeUpload}
        onRemove={externalRunImport.onRemove}
      />

      <SkillUploadModal
        t={t}
        open={skillUpload.open}
        form={skillUpload.form}
        loading={skillUpload.loading}
        result={skillUpload.result}
        onClose={skillUpload.close}
        onSubmit={skillUpload.submit}
        beforeUpload={skillUpload.beforeUpload}
        onRemove={skillUpload.onRemove}
      />
    </section>
  );
}
