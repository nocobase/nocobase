/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  InboxOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { Alert, Button, Flex, Form, Input, Modal, Popconfirm, Space, Table, Tag, Tooltip, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { LIGHT_EXTENSION_SETTINGS_KEY, NAMESPACE } from '../../constants';
import type { LightExtensionRepoLifecycleStatus, LightExtensionRepoRecord } from '../../shared/types';
import { LightExtensionHookError, toLifecycleInput, useLightExtensionRepo } from '../hooks/useLightExtensionRepo';

interface CreateRepoFormValues {
  name: string;
  title?: string;
  description?: string;
}

type Notice = {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

const lifecycleColor: Record<LightExtensionRepoLifecycleStatus, string> = {
  enabled: 'success',
  disabled: 'default',
  archived: 'warning',
};

const healthColor: Record<string, string> = {
  draft: 'default',
  ready: 'success',
  partial_failed: 'warning',
  scan_failed: 'error',
};

export const settingsPath = {
  list: `/admin/settings/${LIGHT_EXTENSION_SETTINGS_KEY}`,
  source: (repoId: string) =>
    `/admin/settings/${LIGHT_EXTENSION_SETTINGS_KEY}/source?repoId=${encodeURIComponent(repoId)}`,
  entries: (repoId: string) =>
    `/admin/settings/${LIGHT_EXTENSION_SETTINGS_KEY}/entries?repoId=${encodeURIComponent(repoId)}`,
  publications: (repoId: string) =>
    `/admin/settings/${LIGHT_EXTENSION_SETTINGS_KEY}/publications?repoId=${encodeURIComponent(repoId)}`,
};

function LightExtensionListPage() {
  const { t } = useTranslation(NAMESPACE);
  const api = useLightExtensionRepo();
  const [form] = Form.useForm<CreateRepoFormValues>();
  const [repos, setRepos] = useState<LightExtensionRepoRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadRepos = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      setRepos(await api.listRepos());
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to load repositories') });
    } finally {
      setLoading(false);
    }
  }, [api, t]);

  useEffect(() => {
    loadRepos();
  }, [loadRepos]);

  const createRepo = async () => {
    const values = await form.validateFields();
    setCreating(true);
    try {
      const repo = await api.createRepo({
        name: values.name,
        title: values.title || null,
        description: values.description || null,
      });
      setRepos((current) => [repo, ...current.filter((item) => item.id !== repo.id)]);
      form.resetFields();
      setCreateOpen(false);
      setNotice({ type: 'success', message: t('Repository created') });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to create repository') });
    } finally {
      setCreating(false);
    }
  };

  const changeLifecycle = useCallback(
    async (repo: LightExtensionRepoRecord, lifecycleStatus: LightExtensionRepoLifecycleStatus) => {
      setNotice(null);
      try {
        const updated = await api.changeLifecycle(toLifecycleInput(repo, lifecycleStatus));
        setRepos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to change lifecycle') });
      }
    },
    [api, t],
  );

  const archiveRepo = useCallback(
    async (repo: LightExtensionRepoRecord) => {
      setNotice(null);
      try {
        const updated = await api.archiveRepo({ repoId: repo.id, expectedVersion: repo.version });
        setRepos((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setNotice({ type: 'success', message: t('Repository archived') });
      } catch (error) {
        setNotice({
          type: 'error',
          message: error instanceof Error ? error.message : t('Failed to archive repository'),
        });
      }
    },
    [api, t],
  );

  const deleteRepo = useCallback(
    async (repo: LightExtensionRepoRecord) => {
      setNotice(null);
      try {
        await api.deleteRepo(repo.id);
        setRepos((current) => current.filter((item) => item.id !== repo.id));
        setNotice({ type: 'success', message: t('Repository deleted') });
      } catch (error) {
        const message =
          error instanceof LightExtensionHookError && error.status === 409
            ? t('Repository is still referenced. Archive it instead.')
            : error instanceof Error
              ? error.message
              : t('Failed to delete repository');
        setNotice({
          type: error instanceof LightExtensionHookError && error.status === 409 ? 'warning' : 'error',
          message,
        });
      }
    },
    [api, t],
  );

  const columns = useMemo<ColumnsType<LightExtensionRepoRecord>>(
    () => [
      {
        title: t('Name'),
        dataIndex: 'name',
        render: (_value, repo) => (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>{repo.title || repo.name}</Typography.Text>
            <Typography.Text code>{repo.name}</Typography.Text>
          </Space>
        ),
      },
      {
        title: t('Lifecycle'),
        dataIndex: 'lifecycleStatus',
        render: (value: LightExtensionRepoLifecycleStatus) => <Tag color={lifecycleColor[value]}>{t(value)}</Tag>,
      },
      {
        title: t('Health'),
        dataIndex: 'healthStatus',
        render: (value: string) => <Tag color={healthColor[value] || 'default'}>{t(value)}</Tag>,
      },
      {
        title: t('Head commit'),
        dataIndex: 'headCommitId',
        render: (value: string | null) => (value ? <Typography.Text code>{shortCommit(value)}</Typography.Text> : '-'),
      },
      {
        title: t('Last scanned at'),
        dataIndex: 'lastScannedAt',
        render: (value: string | null) => formatDate(value),
      },
      {
        title: t('Last error'),
        dataIndex: 'lastError',
        ellipsis: true,
        render: (value: string | null) => (value ? <Tooltip title={value}>{value}</Tooltip> : '-'),
      },
      {
        title: t('Actions'),
        key: 'actions',
        render: (_value, repo) => (
          <Space wrap>
            <Tooltip
              title={repo.lifecycleStatus === 'archived' ? t('Archived repositories are read-only') : t('Open source')}
            >
              <Button disabled={repo.lifecycleStatus === 'archived'} icon={<EditOutlined />} size="small">
                <Link to={settingsPath.source(repo.id)}>{t('Source')}</Link>
              </Button>
            </Tooltip>
            <Button icon={<EyeOutlined />} size="small">
              <Link to={settingsPath.entries(repo.id)}>{t('Entries')}</Link>
            </Button>
            {repo.lifecycleStatus === 'enabled' ? (
              <Button size="small" onClick={() => changeLifecycle(repo, 'disabled')}>
                {t('Disable')}
              </Button>
            ) : null}
            {repo.lifecycleStatus === 'disabled' ? (
              <Button size="small" onClick={() => changeLifecycle(repo, 'enabled')}>
                {t('Enable')}
              </Button>
            ) : null}
            {repo.lifecycleStatus !== 'archived' ? (
              <Popconfirm
                cancelText={t('Cancel')}
                okText={t('Archive')}
                onConfirm={() => archiveRepo(repo)}
                title={t('Archive this repository?')}
              >
                <Button icon={<InboxOutlined />} size="small">
                  {t('Archive')}
                </Button>
              </Popconfirm>
            ) : null}
            <Popconfirm
              cancelText={t('Cancel')}
              okText={t('Delete')}
              okButtonProps={{ danger: true }}
              onConfirm={() => deleteRepo(repo)}
              title={t('Delete this repository?')}
            >
              <Button danger icon={<DeleteOutlined />} size="small">
                {t('Delete')}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [archiveRepo, changeLifecycle, deleteRepo, t],
  );

  return (
    <Flex vertical gap={16} style={{ padding: 24 }}>
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <Typography.Title level={3} style={{ margin: 0 }}>
          {t('Light extensions')}
        </Typography.Title>
        <Space>
          <Button aria-label={t('Refresh')} icon={<ReloadOutlined />} loading={loading} onClick={loadRepos} />
          <Button icon={<PlusOutlined />} onClick={() => setCreateOpen(true)} type="primary">
            {t('Create light extension')}
          </Button>
        </Space>
      </Flex>

      {notice ? (
        <Alert closable message={notice.message} onClose={() => setNotice(null)} showIcon type={notice.type} />
      ) : null}

      <Table columns={columns} dataSource={repos} loading={loading} pagination={false} rowKey="id" size="middle" />

      <Modal
        confirmLoading={creating}
        okText={t('Create')}
        onCancel={() => setCreateOpen(false)}
        onOk={createRepo}
        open={createOpen}
        title={t('Create light extension')}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('Name')}
            name="name"
            rules={[
              { required: true, message: t('Name is required') },
              { pattern: /^[a-z0-9][a-z0-9-]*$/, message: t('Name must be a lowercase slug') },
            ]}
          >
            <Input autoFocus />
          </Form.Item>
          <Form.Item label={t('Title')} name="title">
            <Input />
          </Form.Item>
          <Form.Item label={t('Description')} name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </Flex>
  );
}

function shortCommit(value: string): string {
  return value.length > 12 ? value.slice(0, 12) : value;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default LightExtensionListPage;
