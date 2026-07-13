/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { EnterOutlined, PoweroffOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Space, Tooltip, Typography } from 'antd';
import React from 'react';
import { AgentCapabilityKey, isAgentCapabilitySupported } from '../../../../shared/providerCapabilities';
import { LazyReadonlyXtermOutput } from '../../../components/LazyReadonlyXtermOutput';
import { UseTerminalStreamState } from '../../../hooks/useTerminalStream';
import { formatDateTime, getObjectRecord, statusTag } from '../../../pages/AgentGatewayPageUtils';
import { ControlRequestState, RunRecord, TerminalSnapshot, TFunction } from '../../../pages/runs/types';
import { TERMINAL_CONTROL_RUN_STATUSES } from '../runShared';

export function canUseTerminalControl(run: RunRecord | undefined, snapshot: TerminalSnapshot | null | undefined) {
  if (!run || !TERMINAL_CONTROL_RUN_STATUSES.has(run.status)) {
    return false;
  }
  const outputUnsupported = snapshot?.unsupportedCapability === 'terminalOutput';
  const backend = outputUnsupported ? run.terminalBackend : snapshot?.backend ?? run.terminalBackend;
  const terminalStatus = outputUnsupported ? run.terminalStatus : snapshot?.terminalStatus ?? run.terminalStatus;
  return backend === 'tmux' && terminalStatus === 'active' && (outputUnsupported || snapshot?.available !== false);
}

export function createControlIdempotencyKey(action: 'interrupt' | 'terminate', runId: string) {
  const randomValue = globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2);
  return `ag_control:${action}:${runId}:${randomValue}`;
}

export function isFinalControlStatus(status?: ControlRequestState['status']) {
  return status === 'succeeded' || status === 'failed';
}

export function getHttpErrorStatus(error: unknown) {
  const status = getObjectRecord(getObjectRecord(error).response).status;
  return typeof status === 'number' ? status : null;
}

export function shouldResetControlIdempotencyKey(error: unknown) {
  const status = getHttpErrorStatus(error);
  return status !== null && status >= 400 && status < 500;
}

export function getTextFingerprint(text: string) {
  const sample = text.length > 1024 ? `${text.slice(0, 256)}:${text.slice(-768)}` : text;
  let hash = 2166136261;
  for (let index = 0; index < sample.length; index += 1) {
    hash ^= sample.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `${text.length}:${(hash >>> 0).toString(36)}`;
}

export function getTerminalResetKey(
  runId: string,
  snapshot: TerminalSnapshot | null | undefined,
  useStreamOutput: boolean,
) {
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

export function getRunCapability(run: RunRecord, capability: AgentCapabilityKey) {
  const capabilities = run.capabilitiesSnapshotJson;
  if (!capabilities || !Object.keys(capabilities).length) {
    return true;
  }
  return isAgentCapabilitySupported(run.provider || 'generic-cli', capabilities, capability);
}

export function createUnsupportedTerminalSnapshot(run: RunRecord): TerminalSnapshot {
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

export function getControlRequestStatusText(t: TFunction, status: ControlRequestState['status']) {
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

export function TerminalPanel({
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
