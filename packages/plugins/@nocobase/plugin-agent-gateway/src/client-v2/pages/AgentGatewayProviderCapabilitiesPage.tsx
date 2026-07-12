/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useFlowContext } from '@nocobase/flow-engine';
import { useRequest } from 'ahooks';
import { Button, Card, Empty, Flex, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useMemo } from 'react';
import { AGENT_GATEWAY_API_ACTIONS, getAgentGatewayApiUrl } from '../../shared/apiContract';
import {
  AGENT_CAPABILITY_KEYS,
  AgentCapabilityKey,
  getAgentProviderKey,
  normalizeAgentProviderCapabilities,
} from '../../shared/providerCapabilities';
import { useT } from '../locale';
import { AgentGatewayContext, getResponseData, statusTag } from './AgentGatewayPageUtils';

interface NodeRecord {
  id: string;
  nodeKey: string;
}

interface AgentProfileRecord {
  id: string;
  profileKey: string;
  provider?: string | null;
  displayName?: string;
  status?: string;
  capabilitiesJson?: Record<string, unknown>;
}

interface RunRecord {
  id: string;
  runCode?: string;
  status?: string;
  agentProvider?: string | null;
  agentProviderCapabilitySource?: string | null;
  agentProviderCapabilitiesJson?: Record<string, unknown>;
  agentProfileId?: string | null;
  sourceType?: string | null;
  agentSessionId?: string | null;
  agentSessionProviderId?: string | null;
  terminalBackend?: string | null;
  terminalStatus?: string | null;
  agentGatewayActionPermissionsJson?: {
    resumeAgentSession?: boolean;
    readTerminal?: boolean;
    readArtifacts?: boolean;
    readRawLogs?: boolean;
    interruptRun?: boolean;
    terminateRun?: boolean;
  };
  agentGatewayControlActionsJson?: {
    interruptRun?: boolean;
    terminateRun?: boolean;
  };
}

interface ProviderCapabilityRow {
  id: string;
  nodeKey: string;
  profileKey: string;
  displayName: string;
  status?: string;
  provider: string;
  capabilitySource: string;
  capabilities: Record<string, unknown>;
  runId?: string;
  runCode?: string;
  runStatus?: string;
  agentSessionId?: string | null;
  agentSessionProviderId?: string | null;
  terminalBackend?: string | null;
  terminalStatus?: string | null;
  actionPermissions: NonNullable<RunRecord['agentGatewayActionPermissionsJson']>;
  controlActions: NonNullable<RunRecord['agentGatewayControlActionsJson']>;
}

type DetailControlKey = 'resume' | 'liveOutput' | 'interrupt' | 'terminate' | 'rawLogs' | 'artifacts';
type ServerResponseKey =
  | 'resume'
  | 'liveMessage'
  | 'stdinMessage'
  | 'interrupt'
  | 'terminate'
  | 'terminalOutput'
  | 'rawLogs'
  | 'artifacts';
type ServerResponseExpectation =
  | 'allowed'
  | '200 available'
  | '200 unavailable'
  | '403 denied'
  | '403 disabled'
  | '409 unsupported'
  | '409 unavailable';

const RESUMABLE_RUN_STATUSES = new Set(['succeeded', 'failed', 'canceled', 'timeout', 'abandoned']);
const TERMINAL_CONTROL_RUN_STATUSES = new Set(['claimed', 'syncing_skills', 'running']);

const COMPACT_CAPABILITY_KEYS: AgentCapabilityKey[] = [
  'structuredEvents',
  'terminalOutput',
  'resumeSession',
  'liveSemanticMessage',
  'stdinMessage',
  'interrupt',
  'terminate',
  'artifacts',
];

const DETAIL_CONTROL_CAPABILITIES: Array<{ key: DetailControlKey; label: string }> = [
  { key: 'resume', label: 'Resume' },
  { key: 'liveOutput', label: 'Live output' },
  { key: 'interrupt', label: 'Interrupt' },
  { key: 'terminate', label: 'Terminate' },
  { key: 'rawLogs', label: 'Raw logs' },
  { key: 'artifacts', label: 'Artifacts' },
];

const SERVER_RESPONSE_CAPABILITIES: Array<{
  key: ServerResponseKey;
  label: string;
}> = [
  { key: 'resume', label: 'Resume' },
  { key: 'liveMessage', label: 'Live message' },
  { key: 'stdinMessage', label: 'CLI stdin' },
  { key: 'interrupt', label: 'Interrupt' },
  { key: 'terminate', label: 'Terminate' },
  { key: 'terminalOutput', label: 'Terminal output' },
  { key: 'rawLogs', label: 'Raw logs' },
  { key: 'artifacts', label: 'Artifacts' },
];

function CapabilityTag({ supported, label }: { supported: boolean; label: string }) {
  return (
    <Tag color={supported ? 'green' : 'default'} icon={supported ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
      {label}
    </Tag>
  );
}

function getCurrentAdminPrefix() {
  if (typeof window === 'undefined') {
    return '/admin';
  }
  if (window.location.pathname.startsWith('/v2/admin')) {
    return '/v2/admin';
  }
  if (window.location.pathname.startsWith('/v/admin')) {
    return '/v/admin';
  }
  return '/admin';
}

function getRunDetailUrl(runId: string) {
  return `${getCurrentAdminPrefix()}/settings/agent-gateway/runs?runId=${encodeURIComponent(runId)}`;
}

function isCapabilityEnabled(row: ProviderCapabilityRow, capability: AgentCapabilityKey) {
  return row.capabilities[capability] === true;
}

function isActionAllowed(row: ProviderCapabilityRow, action: keyof ProviderCapabilityRow['actionPermissions']) {
  return row.actionPermissions[action] === true;
}

function isControlPermissionAllowed(row: ProviderCapabilityRow, action: 'interruptRun' | 'terminateRun') {
  return row.actionPermissions[action] === true;
}

function hasResumableSession(row: ProviderCapabilityRow) {
  return Boolean(row.agentSessionId && row.agentSessionProviderId) && RESUMABLE_RUN_STATUSES.has(row.runStatus || '');
}

function hasActiveTerminalControlSurface(row: ProviderCapabilityRow) {
  return (
    TERMINAL_CONTROL_RUN_STATUSES.has(row.runStatus || '') &&
    row.terminalBackend === 'tmux' &&
    row.terminalStatus === 'active'
  );
}

function getDetailControlVisible(row: ProviderCapabilityRow, key: DetailControlKey) {
  switch (key) {
    case 'resume':
      return (
        isActionAllowed(row, 'resumeAgentSession') &&
        isCapabilityEnabled(row, 'resumeSession') &&
        hasResumableSession(row)
      );
    case 'liveOutput':
      return isActionAllowed(row, 'readTerminal') && isCapabilityEnabled(row, 'terminalOutput');
    case 'interrupt':
      return row.controlActions.interruptRun === true;
    case 'terminate':
      return row.controlActions.terminateRun === true;
    case 'rawLogs':
      return isActionAllowed(row, 'readRawLogs') && isCapabilityEnabled(row, 'structuredEvents');
    case 'artifacts':
      return isActionAllowed(row, 'readArtifacts') && isCapabilityEnabled(row, 'artifacts');
    default:
      return false;
  }
}

function getServerResponseExpectation(row: ProviderCapabilityRow, key: ServerResponseKey): ServerResponseExpectation {
  switch (key) {
    case 'resume':
      if (!isActionAllowed(row, 'resumeAgentSession')) {
        return '403 denied';
      }
      if (!isCapabilityEnabled(row, 'resumeSession')) {
        return '409 unsupported';
      }
      return hasResumableSession(row) ? 'allowed' : '409 unavailable';
    case 'liveMessage':
      return '409 unsupported';
    case 'stdinMessage':
      return '403 disabled';
    case 'interrupt':
      if (!isControlPermissionAllowed(row, 'interruptRun')) {
        return '403 denied';
      }
      if (!isCapabilityEnabled(row, 'interrupt')) {
        return '409 unsupported';
      }
      return row.controlActions.interruptRun === true && hasActiveTerminalControlSurface(row)
        ? 'allowed'
        : '409 unavailable';
    case 'terminate':
      if (!isControlPermissionAllowed(row, 'terminateRun')) {
        return '403 denied';
      }
      if (!isCapabilityEnabled(row, 'terminate')) {
        return '409 unsupported';
      }
      return row.controlActions.terminateRun === true && hasActiveTerminalControlSurface(row)
        ? 'allowed'
        : '409 unavailable';
    case 'terminalOutput':
      if (!isActionAllowed(row, 'readTerminal')) {
        return '403 denied';
      }
      return isCapabilityEnabled(row, 'terminalOutput') ? '200 unavailable' : '409 unsupported';
    case 'rawLogs':
      if (!isActionAllowed(row, 'readRawLogs')) {
        return '403 denied';
      }
      return isCapabilityEnabled(row, 'structuredEvents') ? 'allowed' : '409 unsupported';
    case 'artifacts':
      if (!isActionAllowed(row, 'readArtifacts')) {
        return '403 denied';
      }
      return isCapabilityEnabled(row, 'artifacts') ? 'allowed' : '409 unsupported';
    default:
      return '409 unsupported';
  }
}

function getServerResponseColor(expectation: ServerResponseExpectation) {
  if (expectation === 'allowed' || expectation === '200 available') {
    return 'green';
  }
  if (expectation === '200 unavailable') {
    return 'default';
  }
  return 'orange';
}

export default function AgentGatewayProviderCapabilitiesPage() {
  const t = useT();
  const ctx = useFlowContext() as unknown as AgentGatewayContext;

  const matrixRequest = useRequest(async () => {
    const nodeResponse = await ctx.api.request<NodeRecord[]>({
      url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.listNodes),
      method: 'get',
    });
    const nodes = getResponseData(nodeResponse, []);
    const profileGroups = await Promise.all(
      nodes.map(async (node) => {
        const profileResponse = await ctx.api.request<AgentProfileRecord[]>({
          url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.listNodeProfiles, node.id),
          method: 'get',
        });
        return {
          node,
          profiles: getResponseData(profileResponse, []),
        };
      }),
    );
    const runResponse = await ctx.api.request<RunRecord[]>({
      url: getAgentGatewayApiUrl(AGENT_GATEWAY_API_ACTIONS.listRuns),
      method: 'get',
    });
    const runs = getResponseData(runResponse, []);
    return profileGroups.flatMap(({ node, profiles }) =>
      profiles.map((profile) => {
        const run =
          runs.find((item) => item.agentProfileId === profile.id && item.sourceType === 'provider-capability-seed') ||
          runs.find((item) => item.agentProfileId === profile.id);
        const provider = getAgentProviderKey(run?.agentProvider || profile.provider);
        const rawCapabilities = run?.agentProviderCapabilitiesJson || profile.capabilitiesJson;
        return {
          id: profile.id,
          nodeKey: node.nodeKey,
          profileKey: profile.profileKey,
          displayName: profile.displayName || profile.profileKey,
          status: profile.status,
          provider,
          capabilitySource: run?.agentProviderCapabilitySource || (run ? 'run' : 'profile'),
          capabilities: normalizeAgentProviderCapabilities(provider, rawCapabilities),
          runId: run?.id,
          runCode: run?.runCode,
          runStatus: run?.status,
          agentSessionId: run?.agentSessionId,
          agentSessionProviderId: run?.agentSessionProviderId,
          terminalBackend: run?.terminalBackend,
          terminalStatus: run?.terminalStatus,
          actionPermissions: run?.agentGatewayActionPermissionsJson || {},
          controlActions: run?.agentGatewayControlActionsJson || {},
        } satisfies ProviderCapabilityRow;
      }),
    );
  });

  const summary = useMemo(() => {
    const rows = matrixRequest.data || [];
    return AGENT_CAPABILITY_KEYS.reduce<Record<string, number>>((result, key) => {
      result[key] = rows.filter((row) => row.capabilities[key] === true).length;
      return result;
    }, {});
  }, [matrixRequest.data]);

  const columns = useMemo<ColumnsType<ProviderCapabilityRow>>(
    () => [
      {
        title: t('Provider'),
        dataIndex: 'provider',
        key: 'provider',
        width: 130,
        filters: ['codex', 'opencode', 'claude-code', 'generic-cli'].map((provider) => ({
          text: provider,
          value: provider,
        })),
        onFilter: (value, record) => record.provider === value,
        render: (value: string, record) => (
          <Space size={[4, 4]} wrap>
            <Tag>{value}</Tag>
            <Tag color="blue">{record.capabilitySource}</Tag>
          </Space>
        ),
      },
      {
        title: t('Profile key'),
        dataIndex: 'profileKey',
        key: 'profileKey',
        width: 160,
      },
      {
        title: t('Node key'),
        dataIndex: 'nodeKey',
        key: 'nodeKey',
        width: 180,
      },
      {
        title: t('Status'),
        dataIndex: 'status',
        key: 'status',
        width: 100,
        render: (value: string | undefined) => statusTag(value),
      },
      {
        title: t('Run detail'),
        dataIndex: 'runCode',
        key: 'runDetail',
        width: 220,
        render: (_value: string | undefined, record) =>
          record.runId ? (
            <Button type="link" href={getRunDetailUrl(record.runId)} style={{ paddingInline: 0 }}>
              {record.runCode || record.runId}
            </Button>
          ) : (
            <Typography.Text type="secondary">-</Typography.Text>
          ),
      },
      {
        title: t('Run state'),
        key: 'runState',
        width: 220,
        render: (_value: unknown, record) => (
          <Space wrap size={[4, 4]}>
            {record.runStatus ? statusTag(record.runStatus) : <Typography.Text type="secondary">-</Typography.Text>}
            {record.terminalBackend ? <Tag>{record.terminalBackend}</Tag> : null}
            {record.terminalStatus ? statusTag(record.terminalStatus) : null}
          </Space>
        ),
      },
      {
        title: t('Detail controls'),
        key: 'detailControls',
        width: 360,
        render: (_value: unknown, record) => (
          <Space wrap size={[4, 4]}>
            {DETAIL_CONTROL_CAPABILITIES.map((item) => {
              const visible = getDetailControlVisible(record, item.key);
              return (
                <CapabilityTag
                  key={item.key}
                  supported={visible}
                  label={`${t(item.label)}: ${visible ? t('Visible') : t('Hidden')}`}
                />
              );
            })}
          </Space>
        ),
      },
      {
        title: t('Server response'),
        key: 'serverResponse',
        width: 460,
        render: (_value: unknown, record) => (
          <Space wrap size={[4, 4]}>
            {SERVER_RESPONSE_CAPABILITIES.map((item) => {
              const expectation = getServerResponseExpectation(record, item.key);
              return (
                <Tag key={item.key} color={getServerResponseColor(expectation)}>
                  {t(item.label)}: {expectation === 'allowed' ? t('Allowed') : t(expectation)}
                </Tag>
              );
            })}
          </Space>
        ),
      },
      ...COMPACT_CAPABILITY_KEYS.map((key) => ({
        title: t(key),
        dataIndex: ['capabilities', key],
        key,
        width: 140,
        render: (value: unknown) => (
          <CapabilityTag supported={value === true} label={value === true ? t('Yes') : t('No')} />
        ),
      })),
    ],
    [t],
  );

  return (
    <section aria-label={t('Provider Capabilities')}>
      <Card variant="borderless">
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Flex justify="flex-end">
            <Button icon={<ReloadOutlined />} onClick={matrixRequest.refresh}>
              {t('Refresh')}
            </Button>
          </Flex>

          <Space wrap>
            {COMPACT_CAPABILITY_KEYS.map((key) => (
              <Tag key={key}>
                {t(key)}: {summary[key] || 0}
              </Tag>
            ))}
          </Space>

          <Table<ProviderCapabilityRow>
            columns={columns}
            dataSource={matrixRequest.data || []}
            loading={matrixRequest.loading}
            rowKey="id"
            size="small"
            scroll={{ x: 2580 }}
            locale={{
              emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('No agent profiles yet')} />,
            }}
            pagination={false}
          />
        </Space>
      </Card>
    </section>
  );
}
