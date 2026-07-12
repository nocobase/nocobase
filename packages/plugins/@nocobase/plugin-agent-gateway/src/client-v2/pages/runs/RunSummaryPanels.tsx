/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { Alert, Descriptions, Space, Tag, Typography } from 'antd';

import { normalizeAgentProviderCapabilities } from '../../../shared/providerCapabilities';
import { AgentSessionResumeBox, AgentSessionResumeInput } from '../../components/AgentSessionResumeBox';
import { formatDateTime, getObjectRecord, redactPreviewText, statusTag } from '../AgentGatewayPageUtils';
import {
  formatRunDuration,
  formatTokenCount,
  getRunTaskTitle,
  getRunnerReasonMessage,
  getTokenUsageNumber,
  getTokenUsageTotal,
  hasTokenUsage,
  isLiveRunStatus,
} from './runFormatters';
import type { JsonRecord } from '../AgentGatewayPageUtils';
import type { RunRecord, TFunction, TokenUsageRecord } from './types';

export function RunTokenUsageSummary({ usage, t }: { usage?: TokenUsageRecord | null; t: TFunction }) {
  if (!hasTokenUsage(usage)) {
    return <Typography.Text type="secondary">-</Typography.Text>;
  }
  const secondaryParts = [
    ['Input', usage?.inputTokens],
    ['Output', usage?.outputTokens],
    ['Cached', usage?.cachedInputTokens],
    ['Reasoning', usage?.reasoningOutputTokens],
  ]
    .map(([label, value]) => {
      const tokens = getTokenUsageNumber(value);
      return tokens === null ? '' : `${t(String(label))}: ${formatTokenCount(tokens)}`;
    })
    .filter(Boolean);
  return (
    <Space direction="vertical" size={0}>
      <Typography.Text>{`${t('Total')}: ${formatTokenCount(getTokenUsageTotal(usage))}`}</Typography.Text>
      {secondaryParts.length ? <Typography.Text type="secondary">{secondaryParts.join(' / ')}</Typography.Text> : null}
    </Space>
  );
}

export function RunRunnerSummary({ run, t }: { run: RunRecord; t: TFunction }) {
  const runnerStatus = run.runnerStatusJson;
  const nodeLabel = runnerStatus?.nodeKey || runnerStatus?.nodeId || run.nodeId;
  const profileLabel = runnerStatus?.profileKey || runnerStatus?.agentProfileId || run.agentProfileId;
  const profileProvider =
    runnerStatus?.profileProvider && runnerStatus.profileProvider !== profileLabel
      ? runnerStatus.profileProvider
      : null;
  const profileSummary = [profileLabel, profileProvider].filter(Boolean).join(' / ');
  if (!nodeLabel && !profileSummary) {
    return (
      <Typography.Text type="secondary">{isLiveRunStatus(run.status) ? t('Waiting for runner') : '-'}</Typography.Text>
    );
  }
  return (
    <Space direction="vertical" size={0}>
      <Typography.Text>{nodeLabel || t('Waiting for runner')}</Typography.Text>
      {profileSummary ? <Typography.Text type="secondary">{profileSummary}</Typography.Text> : null}
    </Space>
  );
}

function RunSessionSummary({ run, t }: { run: RunRecord; t: TFunction }) {
  const providerSummary = [run.agentSessionProvider, run.agentSessionProviderId].filter(Boolean).join(' / ');
  if (!providerSummary && !run.agentSessionId) {
    return <Typography.Text type="secondary">{t('No agent session')}</Typography.Text>;
  }
  return (
    <Space direction="vertical" size={0}>
      <Typography.Text>{providerSummary || t('Agent session')}</Typography.Text>
      {run.agentSessionId ? <Typography.Text type="secondary">{run.agentSessionId}</Typography.Text> : null}
    </Space>
  );
}

export function RunnerQueueAlert({ run, t }: { run: RunRecord; t: TFunction }) {
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

function getResultSummaryStatus(value: JsonRecord) {
  return typeof value.status === 'string' && value.status ? value.status : '';
}

function getResultSummaryExitCode(value: JsonRecord) {
  return typeof value.exitCode === 'number' && Number.isFinite(value.exitCode) ? value.exitCode : null;
}

function getDeclaredArtifactCount(value: JsonRecord) {
  const declaredArtifacts = getObjectRecord(value.declaredArtifacts);
  const count = declaredArtifacts.declaredArtifactCount;
  if (typeof count === 'number' && Number.isFinite(count)) {
    return count;
  }
  return Array.isArray(declaredArtifacts.declaredArtifactKeys) ? declaredArtifacts.declaredArtifactKeys.length : null;
}

function ResultSummaryPreview({ t, value }: { t: TFunction; value?: JsonRecord }) {
  const summary = getObjectRecord(value);
  const status = getResultSummaryStatus(summary);
  const exitCode = getResultSummaryExitCode(summary);
  const declaredArtifactCount = getDeclaredArtifactCount(summary);
  if (!status && exitCode === null && declaredArtifactCount === null) {
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
      {exitCode !== null ? <Tag>{`${t('Exit code')}: ${exitCode}`}</Tag> : null}
      {declaredArtifactCount !== null ? <Tag>{`${t('Artifacts')}: ${declaredArtifactCount}`}</Tag> : null}
    </Space>
  );
}

export function RunSummaryPanel({ run, t }: { run: RunRecord; t: TFunction }) {
  return (
    <Descriptions bordered size="small" column={2} title={t('Run summary')}>
      <Descriptions.Item label={t('Task')} span={2}>
        <Typography.Text strong>{getRunTaskTitle(run, t)}</Typography.Text>
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
  );
}

export function AgentSessionPanel({
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
