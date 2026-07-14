/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { StopOutlined } from '@ant-design/icons';
import { Alert, Button, Drawer, Space, Spin, Tooltip } from 'antd';
import React from 'react';

import { AgentTimeline } from '../../../components/AgentTimeline';
import { createDetailPageMeta, useRunObservabilityDetails } from '../../../hooks/useRunObservabilityDetails';
import { AgentSessionPanel, RunnerQueueAlert, RunSummaryPanel } from '../../../pages/runs/RunSummaryPanels';
import { getRunTaskTitle } from '../../../pages/runs/runFormatters';
import type { AgentGatewayPageContext, RunListData, TFunction } from '../../../pages/runs/types';
import { ArtifactsPanel, getArtifactDetailsWarning } from '../artifacts/ArtifactsPanel';
import { useRunDetailController } from '../hooks/useRunDetailController';
import { useRunMutations } from '../hooks/useRunMutations';
import { useRunTerminalController } from '../hooks/useRunTerminalController';
import {
  FastCollapse,
  NO_COLLAPSE_MOTION,
  TASK_RUN_DRAWER_WIDTH,
  isCancelableRun,
  isRunActionAllowed,
} from '../runShared';
import {
  ApiLogsPanel,
  LogsPanel,
  getRawLogDetailsWarning,
  getTimelineEmptyDescription,
  shouldCloseDanglingToolCalls,
} from './RunLogsPanels';
import { RunDetailTabs } from './RunDetailTabs';
import { TerminalPanel, canUseTerminalControl, getRunCapability } from '../terminal/TerminalPanel';

interface RunDetailDrawerProps {
  ctx: AgentGatewayPageContext;
  t: TFunction;
  controller: ReturnType<typeof useRunDetailController>;
  runListData: RunListData;
  refreshRuns(): void;
}

export function RunDetailDrawer({ ctx, t, controller, runListData, refreshRuns }: RunDetailDrawerProps) {
  const { open, selectedRunId, error, activeTab, setActiveTab, request, openById, close } = controller;
  const activeRunDetails = !error && selectedRunId && request.data?.run?.id === selectedRunId ? request.data : null;
  const selectedRun = activeRunDetails?.run || runListData.runs.find((run) => run.id === selectedRunId);
  const observabilityRun = activeRunDetails?.run;
  const rawLogDetailsWarning = getRawLogDetailsWarning(observabilityRun, t);
  const artifactDetailsWarning = getArtifactDetailsWarning(observabilityRun, t);
  const observability = useRunObservabilityDetails({
    api: ctx.api,
    t,
    selectedRunId,
    run: observabilityRun,
    enabled: open && !error,
    activeTab,
    conversationEnabled: Boolean(
      observabilityRun && isRunActionAllowed(observabilityRun.agentGatewayActionPermissionsJson, 'readSessionMessages'),
    ),
    conversationDisabledWarning: t('Agent Gateway session message read permission required'),
    rawLogsWarning: rawLogDetailsWarning,
    artifactsWarning: artifactDetailsWarning,
  });
  const mutations = useRunMutations({
    ctx,
    t,
    openRunById: openById,
    refreshRunDetails: request.refresh,
    refreshRuns,
  });
  const terminal = useRunTerminalController({
    ctx,
    t,
    activeTab,
    detailOpen: open,
    selectedRunId,
    runDetailsError: error,
    run: activeRunDetails?.run,
    runEvents: observability.events.state?.events,
    refreshConversationEvents: observability.conversation.refresh,
    refreshRunDetails: request.refresh,
    refreshRuns,
  });

  const actionPermissions = activeRunDetails?.run.agentGatewayActionPermissionsJson || {};
  const canResumeAgentSession =
    isRunActionAllowed(actionPermissions, 'resumeAgentSession') &&
    Boolean(activeRunDetails?.run && getRunCapability(activeRunDetails.run, 'resumeSession'));
  const canReadSessionMessages = isRunActionAllowed(actionPermissions, 'readSessionMessages');
  const controlActions = activeRunDetails?.run.agentGatewayControlActionsJson || {};
  const terminalControlAvailable = canUseTerminalControl(activeRunDetails?.run, terminal.snapshot);
  const latestConversationEvents = observability.conversation.state;
  const timelineEvents = latestConversationEvents?.events || activeRunDetails?.conversationEvents || [];
  const timelineWarning =
    observability.conversation.warning ||
    (latestConversationEvents ? undefined : activeRunDetails?.warnings.conversationEvents);
  const timelineLoading =
    observability.conversation.loading ||
    Boolean(
      activeRunDetails &&
        activeTab === 'summary' &&
        canReadSessionMessages &&
        !latestConversationEvents &&
        !timelineEvents.length &&
        !timelineWarning,
    );
  const eventDetails = observability.events.state;
  const artifactDetails = observability.artifacts.state;
  const apiLogDetails = observability.apiLogs.state;

  const cancelButton =
    selectedRun &&
    isCancelableRun(selectedRun) &&
    isRunActionAllowed(selectedRun.agentGatewayActionPermissionsJson, 'cancelRun') ? (
      <Tooltip title={t('Cancel run')}>
        <Button
          aria-label={t('Cancel run')}
          danger
          icon={<StopOutlined />}
          loading={mutations.cancelRunRequest.loading}
          onClick={() => mutations.cancelRunRequest.run(selectedRun)}
        />
      </Tooltip>
    ) : null;

  return (
    <Drawer
      title={selectedRun ? getRunTaskTitle(selectedRun, t) : t('Run details')}
      open={open}
      onClose={close}
      width={TASK_RUN_DRAWER_WIDTH}
      extra={cancelButton}
      destroyOnClose
    >
      {error ? <Alert type="warning" showIcon message={t('Run details unavailable')} description={error} /> : null}
      {!error && open && selectedRunId && !activeRunDetails ? <Spin /> : null}
      {activeRunDetails ? (
        <RunDetailTabs
          t={t}
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'summary',
              label: t('Summary'),
              children: (
                <Space direction="vertical" size={16} style={{ width: '100%' }}>
                  <RunnerQueueAlert run={activeRunDetails.run} t={t} />
                  {latestConversationEvents?.hasMoreBefore ? (
                    <Button loading={observability.conversation.loading} onClick={observability.conversation.loadOlder}>
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
                    resumeLoading={mutations.resumeSessionRequest.loading}
                    onResume={async (input) => {
                      await mutations.resumeSessionRequest.runAsync({ run: activeRunDetails.run, ...input });
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
                            snapshot={terminal.snapshot}
                            stream={terminal.stream}
                            loading={terminal.snapshotRequest.loading}
                            interrupting={terminal.interruptRequest.loading}
                            terminating={terminal.terminateRequest.loading}
                            controlRequestState={terminal.controlRequestState}
                            canReadTerminal={terminal.canReadTerminal}
                            canInterrupt={terminalControlAvailable && controlActions.interruptRun === true}
                            canTerminate={terminalControlAvailable && controlActions.terminateRun === true}
                            onRefresh={terminal.refreshTerminalSnapshot}
                            onInterrupt={() => terminal.interruptRequest.run(activeRunDetails.run.id)}
                            onTerminate={() => terminal.terminateRequest.run(activeRunDetails.run.id)}
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
                  events={eventDetails?.events || []}
                  eventsWarning={eventDetails?.warning || rawLogDetailsWarning}
                  hasMoreBefore={eventDetails?.hasMoreBefore}
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
                  artifacts={artifactDetails?.artifacts || []}
                  snapshots={artifactDetails?.snapshots || []}
                  artifactMeta={artifactDetails?.artifactMeta || createDetailPageMeta()}
                  snapshotMeta={artifactDetails?.snapshotMeta || createDetailPageMeta()}
                  artifactContentEntries={observability.artifacts.contentEntries}
                  artifactsWarning={artifactDetails?.warnings.artifacts || artifactDetailsWarning}
                  snapshotsWarning={artifactDetails?.warnings.snapshots || artifactDetailsWarning}
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
                  apiCallLogs={apiLogDetails?.apiCallLogs || []}
                  meta={apiLogDetails?.meta || createDetailPageMeta()}
                  apiCallLogsWarning={apiLogDetails?.warning || rawLogDetailsWarning}
                  loading={observability.apiLogs.loading}
                  onPageChange={observability.apiLogs.changePage}
                />
              ),
            },
          ]}
        />
      ) : null}
    </Drawer>
  );
}
