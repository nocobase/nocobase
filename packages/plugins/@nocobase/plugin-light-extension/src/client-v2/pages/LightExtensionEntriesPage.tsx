/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { CheckCircleOutlined, ReloadOutlined, ScanOutlined } from '@ant-design/icons';
import { Alert, Button, Empty, Flex, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import type { LightExtensionDiagnostic, LightExtensionEntryRecord, LightExtensionRepoRecord } from '../../shared/types';
import DiagnosticsPanel from '../components/DiagnosticsPanel';
import { getLightExtensionErrorDiagnostics, useLightExtensionRepo } from '../hooks/useLightExtensionRepo';

interface LightExtensionEntriesPageProps {
  embedded?: boolean;
}

const healthColor: Record<string, string> = {
  ready: 'success',
  failed: 'error',
  missing: 'warning',
  disabled: 'default',
};

function LightExtensionEntriesPage({ embedded = false }: LightExtensionEntriesPageProps) {
  const { t } = useTranslation(NAMESPACE);
  const [searchParams] = useSearchParams();
  const repoId = searchParams.get('repoId') || '';
  const { getRepo, listEntries, scanEntries: scanEntriesRequest } = useLightExtensionRepo();
  const [repo, setRepo] = useState<LightExtensionRepoRecord | null>(null);
  const [entries, setEntries] = useState<LightExtensionEntryRecord[]>([]);
  const [diagnostics, setDiagnostics] = useState<LightExtensionDiagnostic[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'info' | 'warning' | 'error'; message: string } | null>(
    null,
  );

  const loadEntries = useCallback(async () => {
    if (!repoId) {
      return;
    }

    setLoading(true);
    setNotice(null);
    try {
      const [nextRepo, nextEntries] = await Promise.all([getRepo(repoId), listEntries(repoId)]);
      setRepo(nextRepo);
      setEntries(nextEntries);
      setDiagnostics(nextEntries.flatMap((entry) => entry.diagnostics || []));
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to load entries') });
    } finally {
      setLoading(false);
    }
  }, [getRepo, listEntries, repoId, t]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const scanEntries = async () => {
    if (!repoId) {
      return;
    }

    setScanning(true);
    setNotice(null);
    try {
      const result = await scanEntriesRequest(repoId);
      setRepo(result.repo);
      setEntries(result.entries.map((item) => item.entry));
      setDiagnostics(result.diagnostics);
      setNotice({
        type: result.accepted ? 'success' : 'warning',
        message: result.accepted ? t('Scan completed') : t('Scan completed with diagnostics'),
      });
    } catch (error) {
      setDiagnostics(getLightExtensionErrorDiagnostics(error) as LightExtensionDiagnostic[]);
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to scan entries') });
      await loadEntries();
    } finally {
      setScanning(false);
    }
  };

  const columns = useMemo<ColumnsType<LightExtensionEntryRecord>>(
    () => [
      {
        title: t('Title'),
        dataIndex: 'title',
        render: (_value, entry) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{entry.title || entry.entryName}</Typography.Text>
            <Typography.Text code>{entry.entryName}</Typography.Text>
          </Space>
        ),
      },
      {
        title: t('Kind'),
        dataIndex: 'kind',
        render: (value: string) => <Tag>{t(value)}</Tag>,
      },
      {
        title: t('Entry path'),
        dataIndex: 'entryPath',
        render: (value: string) => <Typography.Text code>{value}</Typography.Text>,
      },
      {
        title: t('Health'),
        dataIndex: 'healthStatus',
        render: (value: string) => <Tag color={healthColor[value] || 'default'}>{t(value)}</Tag>,
      },
      {
        title: t('Settings'),
        dataIndex: 'settingsPath',
        render: (value: string | null) =>
          value ? <Tag color="success">{t('Settings schema')}</Tag> : <Tag>{t('No settings')}</Tag>,
      },
      {
        title: t('Active publication'),
        dataIndex: 'activePublicationId',
        render: (value: string | null) =>
          value ? (
            <Tag color="success" icon={<CheckCircleOutlined />}>
              {shortId(value)}
            </Tag>
          ) : (
            <Tag>{t('No active publication')}</Tag>
          ),
      },
      {
        title: t('Diagnostics'),
        dataIndex: 'diagnostics',
        render: (value: LightExtensionDiagnostic[]) => {
          const errorCount = value.filter((item) => item.severity === 'error').length;
          const warningCount = value.filter((item) => item.severity === 'warning').length;
          return (
            <Space>
              <Tag color={errorCount > 0 ? 'error' : 'default'}>
                {t('Errors')}: {errorCount}
              </Tag>
              <Tag color={warningCount > 0 ? 'warning' : 'default'}>
                {t('Warnings')}: {warningCount}
              </Tag>
            </Space>
          );
        },
      },
    ],
    [t],
  );

  if (!repoId) {
    return (
      <Flex vertical gap={16} style={{ padding: embedded ? 0 : 24 }}>
        {!embedded ? (
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t('Entries')}
          </Typography.Title>
        ) : null}
        <Empty description={t('Select a repository from the light extension list')} />
      </Flex>
    );
  }

  return (
    <Flex vertical gap={16} style={{ padding: embedded ? 0 : 24 }}>
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <Space direction="vertical" size={0}>
          <Typography.Title level={3} style={{ margin: 0 }}>
            {repo?.title || repo?.name || t('Entries')}
          </Typography.Title>
          <Typography.Text type="secondary">{repoId}</Typography.Text>
        </Space>
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadEntries}>
            {t('Refresh')}
          </Button>
          <Button icon={<ScanOutlined />} loading={scanning} onClick={scanEntries} type="primary">
            {t('Scan')}
          </Button>
        </Space>
      </Flex>

      {notice ? (
        <Alert closable message={notice.message} onClose={() => setNotice(null)} showIcon type={notice.type} />
      ) : null}

      <Table
        columns={columns}
        dataSource={entries}
        expandable={{
          expandedRowRender: (entry) => <DiagnosticsPanel diagnostics={entry.diagnostics} />,
          rowExpandable: (entry) => entry.diagnostics.length > 0,
        }}
        loading={loading}
        pagination={false}
        rowKey="id"
      />

      <DiagnosticsPanel diagnostics={diagnostics} title={t('Scan diagnostics')} />
    </Flex>
  );
}

export default LightExtensionEntriesPage;

function shortId(value: string): string {
  return value.length > 12 ? value.slice(0, 12) : value;
}
