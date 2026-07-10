/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckCircleOutlined, ReloadOutlined, ToolOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFlowContext } from '@nocobase/flow-engine';

import { NAMESPACE } from '../../constants';
import type {
  LightExtensionReferenceContractDiagnosticsResult,
  LightExtensionReferenceOwnerAdapterContract,
  LightExtensionReferenceRebuildItem,
} from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';

type FlowContextWithApi = {
  api: ApiClientLike;
};

type ResourceResponse<T> = {
  data?: {
    data?: T;
  };
};

interface ReferenceContractDiagnosticsPanelProps {
  repoId?: string | null;
}

export const ReferenceContractDiagnosticsPanel: React.FC<ReferenceContractDiagnosticsPanelProps> = ({ repoId }) => {
  const { t } = useTranslation(NAMESPACE);
  const ctx = useFlowContext<FlowContextWithApi>();
  const [diagnostics, setDiagnostics] = React.useState<LightExtensionReferenceContractDiagnosticsResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [dryRunning, setDryRunning] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadDiagnostics = React.useCallback(
    async (dryRun = false) => {
      if (dryRun) {
        setDryRunning(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        setDiagnostics(await requestReferenceDiagnostics(ctx.api, { repoId: repoId || undefined, dryRun }));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : t('Failed to load reference contract diagnostics'));
      } finally {
        if (dryRun) {
          setDryRunning(false);
        } else {
          setLoading(false);
        }
      }
    },
    [ctx.api, repoId, t],
  );

  React.useEffect(() => {
    loadDiagnostics();
  }, [loadDiagnostics]);

  const adapterColumns = React.useMemo<ColumnsType<LightExtensionReferenceOwnerAdapterContract>>(
    () => [
      {
        title: t('Owner kind'),
        dataIndex: 'kind',
        render: (value: string, adapter) => (
          <Space direction="vertical" size={0}>
            <Typography.Text code>{value}</Typography.Text>
            <Typography.Text type="secondary">{adapter.ownerKind}</Typography.Text>
          </Space>
        ),
      },
      {
        title: t('Adapter status'),
        dataIndex: 'status',
        render: (value: LightExtensionReferenceOwnerAdapterContract['status']) =>
          value === 'active' ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              {t('Active adapter')}
            </Tag>
          ) : (
            <Tag color="default">{t('Waiting for host task')}</Tag>
          ),
      },
      {
        title: t('Locator contract'),
        dataIndex: 'locatorContract',
      },
      {
        title: t('Inherited contracts'),
        key: 'contracts',
        render: (_value, adapter) => (
          <Space wrap size={4}>
            {adapter.supportsRebuild ? <Tag>{t('Rebuild dry-run')}</Tag> : null}
          </Space>
        ),
      },
      {
        title: t('Host task'),
        dataIndex: 'implementationTask',
        render: (value: string | undefined) => value || '-',
      },
    ],
    [t],
  );

  const rebuildColumns = React.useMemo<ColumnsType<LightExtensionReferenceRebuildItem>>(
    () => [
      {
        title: t('Action'),
        dataIndex: 'action',
        render: (value: string) => <Tag>{t(value)}</Tag>,
      },
      {
        title: t('Owner kind'),
        dataIndex: 'ownerKind',
        render: (value: string, item) => (
          <Space direction="vertical" size={0}>
            <Typography.Text>{item.kind || '-'}</Typography.Text>
            <Typography.Text type="secondary">{value}</Typography.Text>
          </Space>
        ),
      },
      {
        title: t('Owner locator hash'),
        dataIndex: 'ownerLocatorHash',
        render: (value: string) => <Typography.Text code>{shortHash(value)}</Typography.Text>,
      },
      {
        title: t('Entry'),
        dataIndex: 'entryId',
        render: (value: string | undefined) => (value ? <Typography.Text code>{value}</Typography.Text> : '-'),
      },
      {
        title: t('Status'),
        dataIndex: 'resolvedStatus',
        render: (value: string | undefined, item) => t(value || item.reasonCode || '-'),
      },
    ],
    [t],
  );

  const rebuildItems = diagnostics?.rebuild?.items || [];

  return (
    <Space direction="vertical" size={16} style={{ width: '100%' }}>
      {error ? <Alert closable message={error} onClose={() => setError(null)} showIcon type="error" /> : null}
      <Space wrap>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={() => loadDiagnostics()}>
          {t('Refresh')}
        </Button>
        <Button
          disabled={!repoId}
          icon={<ToolOutlined />}
          loading={dryRunning}
          onClick={() => loadDiagnostics(true)}
          type="primary"
        >
          {t('Rebuild dry-run')}
        </Button>
        {diagnostics?.rebuild ? (
          <Typography.Text type="secondary">
            {t('Scanned')}: {diagnostics.rebuild.scanned} / {t('Upserted')}: {diagnostics.rebuild.upserted} /{' '}
            {t('Removed')}: {diagnostics.rebuild.removed}
          </Typography.Text>
        ) : null}
      </Space>
      <Table
        columns={adapterColumns}
        dataSource={diagnostics?.ownerAdapters || []}
        loading={loading}
        pagination={false}
        rowKey="kind"
      />
      {diagnostics?.rebuild ? (
        rebuildItems.length ? (
          <Table columns={rebuildColumns} dataSource={rebuildItems} pagination={false} rowKey={rebuildItemKey} />
        ) : (
          <Empty description={t('No rebuild changes')} />
        )
      ) : null}
    </Space>
  );
};

async function requestReferenceDiagnostics(
  api: ApiClientLike,
  input: { repoId?: string; dryRun?: boolean },
): Promise<LightExtensionReferenceContractDiagnosticsResult> {
  const response = await api.request<ResourceResponse<LightExtensionReferenceContractDiagnosticsResult>>({
    url: 'lightExtensionReferences:diagnostics',
    method: 'post',
    data: input,
  });
  return unwrapResourceResponse(response);
}

function rebuildItemKey(item: LightExtensionReferenceRebuildItem): string {
  return `${item.action}:${item.ownerLocatorHash}:${item.repoId || ''}:${item.entryId || ''}:${item.reasonCode || ''}`;
}

function shortHash(value: string): string {
  return value.length > 18 ? `${value.slice(0, 15)}...` : value;
}

function unwrapResourceResponse<T>(response: ResourceResponse<T>): T {
  if (isRecord(response.data) && 'data' in response.data) {
    return response.data.data as T;
  }
  return response.data as T;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
