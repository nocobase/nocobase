/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckCircleOutlined, ReloadOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useFlowContext } from '@nocobase/flow-engine';

import { NAMESPACE } from '../../constants';
import type {
  LightExtensionBulkUpgradeResult,
  LightExtensionReferenceImpactInput,
  LightExtensionReferenceImpactItem,
  LightExtensionReferenceImpactResult,
} from '../../shared/types';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';

type Notice = {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

type FlowContextWithApi = {
  api: ApiClientLike;
};

type ResourceResponse<T> = {
  data?: {
    data?: T;
  };
};

export interface ReferenceImpactPanelProps {
  input?: LightExtensionReferenceImpactInput;
  impact?: LightExtensionReferenceImpactResult | null;
  onImpactChange?: (impact: LightExtensionReferenceImpactResult) => void;
}

export const ReferenceImpactPanel: React.FC<ReferenceImpactPanelProps> = ({ input, impact, onImpactChange }) => {
  const { t } = useTranslation(NAMESPACE);
  const ctx = useFlowContext<FlowContextWithApi>();
  const inputKey = buildImpactInputKey(input);
  const normalizedInput = cloneImpactInput(input);
  const normalizedInputRef = React.useRef<LightExtensionReferenceImpactInput | undefined>(normalizedInput);
  normalizedInputRef.current = normalizedInput;
  const requestSeqRef = React.useRef(0);
  const [currentImpact, setCurrentImpact] = React.useState<LightExtensionReferenceImpactResult | null>(impact || null);
  const [selectedReferenceIds, setSelectedReferenceIds] = React.useState<React.Key[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [upgrading, setUpgrading] = React.useState(false);
  const [notice, setNotice] = React.useState<Notice | null>(null);

  React.useEffect(() => {
    if (impact) {
      setCurrentImpact(impact);
    }
  }, [impact]);

  const loadImpact = React.useCallback(
    async (options: { preserveNoticeOnError?: boolean } = {}) => {
      const requestInput = normalizedInputRef.current;
      if (!requestInput) {
        return false;
      }
      const requestSeq = requestSeqRef.current + 1;
      requestSeqRef.current = requestSeq;
      setLoading(true);
      if (!options.preserveNoticeOnError) {
        setNotice(null);
      }
      try {
        const result = await requestImpact(ctx.api, requestInput);
        if (requestSeq !== requestSeqRef.current) {
          return false;
        }
        setCurrentImpact(result);
        setSelectedReferenceIds([]);
        onImpactChange?.(result);
        return true;
      } catch (error) {
        if (requestSeq !== requestSeqRef.current) {
          return false;
        }
        if (options.preserveNoticeOnError) {
          setNotice((current) => ({
            type: 'warning',
            message: `${current?.message || t('Bulk upgrade completed')}. ${t('Reference impact refresh failed')}`,
          }));
          return false;
        }
        setNotice({
          type: 'error',
          message: error instanceof Error ? error.message : t('Failed to load reference impact'),
        });
        return false;
      } finally {
        if (requestSeq === requestSeqRef.current) {
          setLoading(false);
        }
      }
    },
    [ctx.api, onImpactChange, t],
  );

  React.useEffect(() => {
    if (normalizedInputRef.current) {
      requestSeqRef.current += 1;
      setCurrentImpact(null);
      setSelectedReferenceIds([]);
      setNotice(null);
    }
    loadImpact();
  }, [inputKey, loadImpact]);

  const selectedItems = React.useMemo(() => {
    const selected = new Set(selectedReferenceIds.map(String));
    return (currentImpact?.references || []).filter((item) => selected.has(item.reference.id));
  }, [currentImpact?.references, selectedReferenceIds]);

  const bulkUpgrade = async () => {
    if (
      !currentImpact ||
      (normalizedInput && currentImpact.toPublication.id !== normalizedInput.toPublicationId) ||
      selectedItems.length === 0
    ) {
      return;
    }
    setUpgrading(true);
    setNotice(null);
    try {
      const result = await requestBulkUpgrade(ctx.api, {
        toPublicationId: currentImpact.toPublication.id,
        referenceIds: selectedItems.map((item) => item.reference.id),
        expectedPublicationIdByReference: Object.fromEntries(
          selectedItems.map((item) => [item.reference.id, item.reference.publicationId]),
        ),
        expectedSettingsHashByReference: Object.fromEntries(
          selectedItems.map((item) => [item.reference.id, item.reference.settingsHash]),
        ),
      });
      setNotice({
        type: hasBlockedBulkUpgradeItems(result.summary) ? 'warning' : 'success',
        message: hasBlockedBulkUpgradeItems(result.summary)
          ? t('Bulk upgrade completed with blocked references')
          : t('Bulk upgrade completed'),
      });
      await loadImpact({
        preserveNoticeOnError: true,
      });
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : t('Failed to upgrade references'),
      });
    } finally {
      setUpgrading(false);
    }
  };

  const columns = React.useMemo<ColumnsType<LightExtensionReferenceImpactItem>>(
    () => [
      {
        title: t('Reference'),
        dataIndex: ['reference', 'ownerLocator', 'modelUid'],
        render: (_value, item) => (
          <Space direction="vertical" size={0}>
            <Typography.Text code>{item.reference.ownerLocator.modelUid}</Typography.Text>
            <Typography.Text type="secondary">{item.reference.ownerKind}</Typography.Text>
          </Space>
        ),
      },
      {
        title: t('Version policy'),
        dataIndex: ['reference', 'versionPolicy'],
        render: (value: string) => <Tag>{t(value)}</Tag>,
      },
      {
        title: t('Current publication'),
        dataIndex: ['reference', 'publicationId'],
        render: (value: string | null) => (value ? <Typography.Text code>{shortId(value)}</Typography.Text> : '-'),
      },
      {
        title: t('Target publication'),
        dataIndex: 'targetPublicationId',
        render: (value: string) => <Typography.Text code>{shortId(value)}</Typography.Text>,
      },
      {
        title: t('Settings validation'),
        dataIndex: 'settingsValidation',
        render: (_value, item) =>
          item.settingsValidation.compatible ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              {t('Compatible')}
            </Tag>
          ) : (
            <Space direction="vertical" size={0}>
              <Tag color="error" icon={<WarningOutlined />}>
                {t('Incompatible')}
              </Tag>
              {item.settingsValidation.issues.slice(0, 3).map((issue) => (
                <Typography.Text key={`${item.reference.id}-${issue.path}-${issue.code}`} type="secondary">
                  {issue.path}: {t(issue.code)}
                </Typography.Text>
              ))}
            </Space>
          ),
      },
      {
        title: t('Status'),
        dataIndex: 'upgradeBlockedReason',
        render: (value: string | undefined, item) => {
          if (value) {
            return <Tag color="warning">{t(value)}</Tag>;
          }
          if (!item.settingsValidation.compatible) {
            return <Tag color="error">{t('settings_invalid')}</Tag>;
          }
          return <Tag>{t('Ready')}</Tag>;
        },
      },
    ],
    [t],
  );

  if (!currentImpact && !input) {
    return <Empty description={t('Select a target publication')} />;
  }

  const rows = currentImpact?.references || [];
  const canBulkUpgrade =
    Boolean(currentImpact) &&
    (!normalizedInput || currentImpact?.toPublication.id === normalizedInput.toPublicationId) &&
    selectedItems.length > 0;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      {notice ? (
        <Alert closable message={notice.message} onClose={() => setNotice(null)} showIcon type={notice.type} />
      ) : null}
      <Space wrap>
        <Button icon={<ReloadOutlined />} loading={loading} onClick={loadImpact}>
          {t('Refresh')}
        </Button>
        <Button
          disabled={!canBulkUpgrade}
          icon={<SyncOutlined />}
          loading={upgrading}
          onClick={bulkUpgrade}
          type="primary"
        >
          {t('Bulk upgrade')}
        </Button>
        {currentImpact ? (
          <Typography.Text type="secondary">
            {t('References')}: {currentImpact.summary.total}
          </Typography.Text>
        ) : null}
      </Space>
      <Table
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={false}
        rowKey={(item) => item.reference.id}
        rowSelection={{
          selectedRowKeys: selectedReferenceIds,
          onChange: setSelectedReferenceIds,
          getCheckboxProps: (item) => ({
            disabled: Boolean(item.upgradeBlockedReason) || !item.settingsValidation.compatible,
          }),
        }}
      />
    </Space>
  );
};

async function requestImpact(
  api: ApiClientLike,
  input: LightExtensionReferenceImpactInput,
): Promise<LightExtensionReferenceImpactResult> {
  const response = await api.request<ResourceResponse<LightExtensionReferenceImpactResult>>({
    url: 'lightExtensionReferences:impact',
    method: 'post',
    data: input,
  });
  return unwrapResourceResponse(response);
}

async function requestBulkUpgrade(
  api: ApiClientLike,
  input: {
    toPublicationId: string;
    referenceIds: string[];
    expectedPublicationIdByReference: Record<string, string | null>;
    expectedSettingsHashByReference: Record<string, string>;
  },
): Promise<LightExtensionBulkUpgradeResult> {
  const response = await api.request<ResourceResponse<LightExtensionBulkUpgradeResult>>({
    url: 'lightExtensionReferences:bulkUpgrade',
    method: 'post',
    data: input,
  });
  return unwrapResourceResponse(response);
}

function unwrapResourceResponse<T>(response: ResourceResponse<T>): T {
  if (isRecord(response.data) && 'data' in response.data) {
    return response.data.data as T;
  }
  return response.data as T;
}

function hasBlockedBulkUpgradeItems(result: LightExtensionBulkUpgradeResult['summary']): boolean {
  return Boolean(result.conflict || result.incompatible || result.skipped || result.missing);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function buildImpactInputKey(input?: LightExtensionReferenceImpactInput): string {
  if (!input) {
    return '';
  }
  return JSON.stringify({
    repoId: input.repoId || '',
    entryId: input.entryId || '',
    publicationId: input.publicationId || '',
    toPublicationId: input.toPublicationId,
    referenceIds: [...(input.referenceIds || [])].sort(),
    ownerLocator: input.ownerLocator
      ? {
          kind: input.ownerLocator.kind,
          modelUid: input.ownerLocator.modelUid,
          use: input.ownerLocator.use,
        }
      : null,
  });
}

function cloneImpactInput(input?: LightExtensionReferenceImpactInput): LightExtensionReferenceImpactInput | undefined {
  if (!input) {
    return undefined;
  }
  return {
    ...input,
    ownerLocator: input.ownerLocator ? { ...input.ownerLocator } : undefined,
    referenceIds: input.referenceIds ? [...input.referenceIds] : undefined,
  };
}

function shortId(value: string): string {
  return value.length > 12 ? value.slice(0, 12) : value;
}

export default ReferenceImpactPanel;
