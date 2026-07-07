/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CheckCircleOutlined,
  CloudUploadOutlined,
  ReloadOutlined,
  RollbackOutlined,
  RocketOutlined,
} from '@ant-design/icons';
import { Alert, Button, Empty, Flex, Popconfirm, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import type {
  LightExtensionDiagnostic,
  LightExtensionEntryRecord,
  LightExtensionPublicationMetadataRecord,
  LightExtensionRepoRecord,
} from '../../shared/types';
import DiagnosticsPanel from '../components/DiagnosticsPanel';
import { useLightExtensionRepo } from '../hooks/useLightExtensionRepo';
import {
  LightExtensionPublicationHookError,
  useLightExtensionPublications,
} from '../hooks/useLightExtensionPublications';

type Notice = {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

interface LightExtensionPublicationsPageProps {
  embedded?: boolean;
}

function LightExtensionPublicationsPage({ embedded = false }: LightExtensionPublicationsPageProps) {
  const { t } = useTranslation(NAMESPACE);
  const [searchParams] = useSearchParams();
  const repoId = searchParams.get('repoId') || '';
  const { getRepo, listEntries } = useLightExtensionRepo();
  const {
    activatePublication: activatePublicationRequest,
    isLoading: isPublicationOperationLoading,
    listPublications,
    publish,
  } = useLightExtensionPublications();
  const [repo, setRepo] = useState<LightExtensionRepoRecord | null>(null);
  const [entries, setEntries] = useState<LightExtensionEntryRecord[]>([]);
  const [publications, setPublications] = useState<LightExtensionPublicationMetadataRecord[]>([]);
  const [diagnostics, setDiagnostics] = useState<LightExtensionDiagnostic[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadData = useCallback(
    async (options: { resetNotice?: boolean } = {}) => {
      if (!repoId) {
        return false;
      }

      setLoading(true);
      if (options.resetNotice !== false) {
        setNotice(null);
      }
      try {
        const [nextRepo, nextEntries, nextPublications] = await Promise.all([
          getRepo(repoId),
          listEntries(repoId),
          listPublications(repoId),
        ]);
        setRepo(nextRepo);
        setEntries(nextEntries);
        setPublications(nextPublications);
        setDiagnostics(nextEntries.flatMap((entry) => entry.diagnostics || []));
        return true;
      } catch (error) {
        setNotice({
          type: 'error',
          message: error instanceof Error ? error.message : t('Failed to load publications'),
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [getRepo, listEntries, listPublications, repoId, t],
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  const entryById = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries]);
  const publishableEntries = useMemo(
    () => entries.filter((entry) => entry.healthStatus !== 'missing' && entry.healthStatus !== 'disabled'),
    [entries],
  );

  const publishEntries = async (activate: boolean) => {
    if (!repo?.headCommitId) {
      setNotice({ type: 'warning', message: t('Repository has no head commit to publish') });
      return;
    }
    if (publishableEntries.length === 0) {
      setNotice({ type: 'warning', message: t('No publishable entries') });
      return;
    }

    setNotice(null);
    try {
      const result = await publish({
        repoId,
        entryIds: publishableEntries.map((entry) => entry.id),
        commitId: repo.headCommitId,
        clientRequestId: buildClientRequestId(activate ? 'publish_activate' : 'publish'),
        activate,
        expectedCurrentPublicationIdByEntry: activate
          ? Object.fromEntries(publishableEntries.map((entry) => [entry.id, entry.activePublicationId]))
          : undefined,
      });
      const nextDiagnostics = [
        ...result.diagnostics,
        ...result.entryResults.flatMap((entry) => entry.diagnostics || []),
      ];
      const refreshed = await loadData({ resetNotice: false });
      if (refreshed) {
        setDiagnostics(nextDiagnostics);
        setNotice({
          type: result.status === 'success' ? 'success' : 'warning',
          message: activate ? t('Publish and activate completed') : t('Publish completed'),
        });
      }
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to publish') });
    }
  };

  const activatePublication = useCallback(
    async (publication: LightExtensionPublicationMetadataRecord) => {
      const entry = entryById.get(publication.entryId);
      if (!entry) {
        setNotice({ type: 'warning', message: t('Entry is not loaded. Refresh and retry.') });
        return;
      }

      setNotice(null);
      try {
        await activatePublicationRequest({
          entryId: publication.entryId,
          toPublicationId: publication.id,
          expectedCurrentPublicationId: entry.activePublicationId,
        });
        if (await loadData({ resetNotice: false })) {
          setNotice({ type: 'success', message: t('Publication activated') });
        }
      } catch (error) {
        const message =
          error instanceof LightExtensionPublicationHookError && error.status === 409
            ? t('Active publication changed. Refresh and retry.')
            : error instanceof Error
              ? error.message
              : t('Failed to activate publication');
        setNotice({
          type: error instanceof LightExtensionPublicationHookError && error.status === 409 ? 'warning' : 'error',
          message,
        });
      }
    },
    [activatePublicationRequest, entryById, loadData, t],
  );

  const columns = useMemo<ColumnsType<LightExtensionPublicationMetadataRecord>>(
    () => [
      {
        title: t('Entry'),
        dataIndex: 'entryId',
        render: (value: string) => {
          const entry = entryById.get(value);
          return (
            <Space direction="vertical" size={0}>
              <Typography.Text strong>{entry?.title || entry?.entryName || value}</Typography.Text>
              <Typography.Text code>{value}</Typography.Text>
            </Space>
          );
        },
      },
      {
        title: t('Publication'),
        dataIndex: 'id',
        render: (value: string, publication) => {
          const activePublicationId = entryById.get(publication.entryId)?.activePublicationId;
          return (
            <Space direction="vertical" size={0}>
              <Typography.Text code>{shortId(value)}</Typography.Text>
              {activePublicationId === value ? (
                <Tag color="success" icon={<CheckCircleOutlined />}>
                  {t('Active')}
                </Tag>
              ) : null}
            </Space>
          );
        },
      },
      {
        title: t('Commit'),
        dataIndex: 'commitId',
        render: (value: string) => <Typography.Text code>{shortId(value)}</Typography.Text>,
      },
      {
        title: t('Runtime'),
        dataIndex: 'runtimeVersion',
        render: (_value, publication) => (
          <Space direction="vertical" size={0}>
            <Typography.Text>{publication.runtimeVersion}</Typography.Text>
            <Typography.Text type="secondary">{publication.surfaceStyle}</Typography.Text>
          </Space>
        ),
      },
      {
        title: t('Settings'),
        dataIndex: 'settingsSchemaHash',
        render: (value: string) =>
          value ? <Tag color="success">{t('Settings snapshot')}</Tag> : <Tag>{t('No settings')}</Tag>,
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
      {
        title: t('Created at'),
        dataIndex: 'createdAt',
        render: (value: string | null) => formatDate(value),
      },
      {
        title: t('Actions'),
        key: 'actions',
        render: (_value, publication) => {
          const entry = entryById.get(publication.entryId);
          const isActive = entry?.activePublicationId === publication.id;
          const actionLabel = entry?.activePublicationId ? t('Rollback') : t('Activate');
          return (
            <Space wrap>
              <Tooltip title={isActive ? t('Publication is active') : actionLabel}>
                <Button
                  disabled={isActive}
                  icon={entry?.activePublicationId ? <RollbackOutlined /> : <RocketOutlined />}
                  loading={isPublicationOperationLoading('activatePublication')}
                  onClick={() => activatePublication(publication)}
                  size="small"
                >
                  {actionLabel}
                </Button>
              </Tooltip>
            </Space>
          );
        },
      },
    ],
    [activatePublication, entryById, isPublicationOperationLoading, t],
  );

  if (!repoId) {
    return (
      <Flex vertical gap={16} style={{ padding: embedded ? 0 : 24 }}>
        {!embedded ? (
          <Typography.Title level={3} style={{ margin: 0 }}>
            {t('Publications')}
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
            {repo?.title || repo?.name || t('Publications')}
          </Typography.Title>
          <Typography.Text type="secondary">{repoId}</Typography.Text>
        </Space>
        <Space wrap>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => loadData()}>
            {t('Refresh')}
          </Button>
          <Popconfirm
            cancelText={t('Cancel')}
            okText={t('Publish')}
            onConfirm={() => publishEntries(false)}
            title={t('Publish current head commit?')}
          >
            <Button
              disabled={!repo?.headCommitId || publishableEntries.length === 0}
              icon={<CloudUploadOutlined />}
              loading={isPublicationOperationLoading('publish')}
            >
              {t('Publish')}
            </Button>
          </Popconfirm>
          <Popconfirm
            cancelText={t('Cancel')}
            okText={t('Publish and activate')}
            onConfirm={() => publishEntries(true)}
            title={t('Publish and activate current head commit?')}
          >
            <Button
              disabled={!repo?.headCommitId || publishableEntries.length === 0}
              icon={<RocketOutlined />}
              loading={isPublicationOperationLoading('publish')}
              type="primary"
            >
              {t('Publish and activate')}
            </Button>
          </Popconfirm>
        </Space>
      </Flex>

      {notice ? (
        <Alert closable message={notice.message} onClose={() => setNotice(null)} showIcon type={notice.type} />
      ) : null}

      <Table
        columns={columns}
        dataSource={publications}
        expandable={{
          expandedRowRender: (publication) => <DiagnosticsPanel diagnostics={publication.diagnostics} />,
          rowExpandable: (publication) => publication.diagnostics.length > 0,
        }}
        loading={loading}
        pagination={false}
        rowKey="id"
      />

      <DiagnosticsPanel diagnostics={diagnostics} title={t('Publish diagnostics')} />
    </Flex>
  );
}

function buildClientRequestId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function shortId(value: string): string {
  return value.length > 12 ? value.slice(0, 12) : value;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default LightExtensionPublicationsPage;
