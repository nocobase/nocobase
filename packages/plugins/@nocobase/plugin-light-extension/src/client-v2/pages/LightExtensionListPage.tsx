/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { DownOutlined, PlusOutlined, ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import {
  CollectionFilter,
  DEFAULT_PAGE_SIZE,
  ExtendCollectionsProvider,
  Table,
  type CompiledFilter,
} from '@nocobase/client-v2';
import { useFlowEngine, type Collection, type CollectionOptions } from '@nocobase/flow-engine';
import { getDayRangeByParams } from '@nocobase/utils/client';
import { uid } from '@nocobase/utils/client';
import {
  Alert,
  Button,
  Card,
  Drawer,
  Dropdown,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Space,
  Switch,
  Tag,
  theme,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import type {
  LightExtensionRepoLifecycleStatus,
  LightExtensionRepoRecord,
  LightExtensionSyncSourceSummary,
} from '../../shared/types';
import LightExtensionCreateSourceSelector, {
  type LightExtensionCreateSource,
} from '../components/LightExtensionCreateSourceSelector';
import LightExtensionClientAppsPanel from '../components/LightExtensionClientAppsPanel';
import LightExtensionGitSourceFields, {
  createEmptyLightExtensionGitSourceDraft,
  type LightExtensionGitHubSourceValue,
  type LightExtensionGitSourceDraft,
} from '../components/LightExtensionGitSourceFields';
import LightExtensionSyncDrawer from '../components/LightExtensionSyncDrawer';
import { useLightExtensionRepo } from '../hooks/useLightExtensionRepo';
import {
  getLightExtensionSyncErrorTranslationKey,
  LightExtensionSyncHookError,
  useLightExtensionSync,
} from '../hooks/useLightExtensionSync';
import { useT } from '../locale';
import LightExtensionWorkspacePage, { type LightExtensionWorkspaceFooterActions } from './LightExtensionWorkspacePage';

interface CreateRepoFormValues {
  name: string;
  title: string;
  description?: string;
}

interface EditRepoFormValues {
  title: string;
  description?: string;
}

type Notice = {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

type ToggleLifecycleStatus = 'enabled' | 'disabled';
type DetailPanel = 'source' | 'sync' | 'client-apps';
type SyncConfigurationRequest = 'test' | 'configure';

const entryKinds = ['js-block', 'js-page', 'js-action', 'js-field', 'js-item', 'runjs'] as const;
const LIGHT_EXTENSION_REPO_FILTER_COLLECTION = 'lightExtensionRepoFilters';
const SOURCE_DRAWER_WIDTH = 'min(1280px, calc(100vw - 64px))';
const TABLE_ACTION_BUTTON_STYLE: React.CSSProperties = { height: 'auto', paddingInline: 0 };
export const LIGHT_EXTENSION_REPO_FILTER_FIELD_NAMES = [
  'name',
  'description',
  'updatedAt',
  'createdAt',
  'enabled',
] as const;
export const lightExtensionRepoFilterCollection: CollectionOptions = {
  name: LIGHT_EXTENSION_REPO_FILTER_COLLECTION,
  filterTargetKey: 'id',
  fields: [
    {
      name: 'name',
      type: 'string',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'Title',
        'x-component': 'Input',
      },
    },
    {
      name: 'description',
      type: 'text',
      interface: 'textarea',
      uiSchema: {
        type: 'string',
        title: 'Description',
        'x-component': 'Input.TextArea',
      },
    },
    {
      name: 'updatedAt',
      type: 'datetime',
      interface: 'datetime',
      uiSchema: {
        type: 'datetime',
        title: 'Updated at',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: true },
      },
    },
    {
      name: 'createdAt',
      type: 'datetime',
      interface: 'datetime',
      uiSchema: {
        type: 'datetime',
        title: 'Created at',
        'x-component': 'DatePicker',
        'x-component-props': { showTime: true },
      },
    },
    {
      name: 'enabled',
      type: 'boolean',
      interface: 'checkbox',
      uiSchema: {
        type: 'boolean',
        title: 'Enabled',
        'x-component': 'Checkbox',
      },
    },
  ],
};
const lightExtensionRepoFilterCollections = [lightExtensionRepoFilterCollection];

function LightExtensionListPage() {
  return (
    <ExtendCollectionsProvider collections={lightExtensionRepoFilterCollections}>
      <LightExtensionListPageInner />
    </ExtendCollectionsProvider>
  );
}

function LightExtensionListPageInner() {
  const { t } = useTranslation(NAMESPACE);
  const compileT = useT();
  const { token } = theme.useToken();
  const filterCollection = useLightExtensionRepoFilterCollection();
  const {
    changeLifecycle: changeLifecycleRequest,
    createRepo: createRepoRequest,
    deleteRepo: deleteRepoRequest,
    listRepos,
    updateRepo: updateRepoRequest,
  } = useLightExtensionRepo();
  const { createFromGit: createFromGitRequest } = useLightExtensionSync();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm<CreateRepoFormValues>();
  const [editForm] = Form.useForm<EditRepoFormValues>();
  const [repos, setRepos] = useState<LightExtensionRepoRecord[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(searchParams.get('repoId'));
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editTarget, setEditTarget] = useState<LightExtensionRepoRecord | null>(null);
  const [editing, setEditing] = useState(false);
  const [batchChanging, setBatchChanging] = useState<ToggleLifecycleStatus | null>(null);
  const [changingRepoIds, setChangingRepoIds] = useState<Set<string>>(() => new Set());
  const [removingRepoIds, setRemovingRepoIds] = useState<Set<string>>(() => new Set());
  const [removeTarget, setRemoveTarget] = useState<LightExtensionRepoRecord | null>(null);
  const [createSource, setCreateSource] = useState<LightExtensionCreateSource | undefined>({ mode: 'template' });
  const [createSourceKey, setCreateSourceKey] = useState(0);
  const [syncDrawerVersion, setSyncDrawerVersion] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [filterPayload, setFilterPayload] = useState<CompiledFilter>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [sourceFooterActions, setSourceFooterActions] = useState<LightExtensionWorkspaceFooterActions | null>(null);

  const urlPanel = parseDetailPanel(searchParams.get('panel'));
  const [activePanel, setActivePanel] = useState<DetailPanel | null>(urlPanel);
  const detailDrawerOpen = (activePanel === 'source' || activePanel === 'client-apps') && Boolean(selectedRepoId);
  const syncDrawerOpen = activePanel === 'sync' && Boolean(selectedRepoId);

  const resetCreateForm = useCallback(() => {
    form.resetFields();
    form.setFieldsValue({ name: createLightExtensionRepoName() });
    setCreateSource({ mode: 'template' });
    setCreateSourceKey((current) => current + 1);
  }, [form]);

  const loadRepos = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const nextRepos = await listRepos();
      setRepos(nextRepos);
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to load repositories') });
    } finally {
      setLoading(false);
    }
  }, [listRepos, t]);

  useEffect(() => {
    loadRepos();
  }, [loadRepos]);

  useEffect(() => {
    const repoId = searchParams.get('repoId');
    if (repoId !== selectedRepoId) {
      setSelectedRepoId(repoId);
    }
  }, [searchParams, selectedRepoId]);

  useEffect(() => {
    setActivePanel(urlPanel);
  }, [urlPanel]);

  useEffect(() => {
    if (searchParams.get('create') === '1') {
      resetCreateForm();
      setCreateOpen(true);
    }
  }, [resetCreateForm, searchParams]);

  useEffect(() => {
    if (activePanel !== 'source') {
      setSourceFooterActions(null);
    }
  }, [activePanel]);

  const selectedRepo = useMemo(() => repos.find((repo) => repo.id === selectedRepoId) || null, [repos, selectedRepoId]);
  const visibleRepos = useMemo(() => repos.filter((repo) => repo.lifecycleStatus !== 'archived'), [repos]);
  const filteredRepos = useMemo(
    () => visibleRepos.filter((repo) => matchesLightExtensionRepoFilter(repo, filterPayload)),
    [filterPayload, visibleRepos],
  );
  const selectedRepos = useMemo(
    () => visibleRepos.filter((repo) => selectedRowKeys.includes(repo.id)),
    [selectedRowKeys, visibleRepos],
  );

  const closeCreateModal = useCallback(() => {
    setCreateOpen(false);
    resetCreateForm();
    if (searchParams.has('create')) {
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('create');
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [resetCreateForm, searchParams, setSearchParams]);

  const openCreateModal = useCallback(() => {
    resetCreateForm();
    setCreateOpen(true);
  }, [resetCreateForm]);

  const openEditDrawer = useCallback(
    (repo: LightExtensionRepoRecord) => {
      editForm.resetFields();
      editForm.setFieldsValue({
        title: repo.title || repo.name,
        description: repo.description || undefined,
      });
      setEditTarget(repo);
    },
    [editForm],
  );

  const closeEditDrawer = useCallback(() => {
    if (editing) {
      return;
    }
    setEditTarget(null);
    editForm.resetFields();
  }, [editForm, editing]);

  const selectRepo = useCallback(
    (repoId: string, options: { panel?: DetailPanel; replace?: boolean } = {}) => {
      setSelectedRepoId(repoId);
      setActivePanel(options.panel || null);
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.set('repoId', repoId);
      if (options.panel) {
        nextSearchParams.set('panel', options.panel);
      }
      setSearchParams(nextSearchParams, { replace: options.replace });
    },
    [searchParams, setSearchParams],
  );

  const closeDetailDrawer = useCallback(() => {
    setActivePanel(null);
    setSourceFooterActions(null);
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('panel');
    setSearchParams(nextSearchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const createRepo = async () => {
    const values = await form.validateFields();
    if (!createSource) {
      return;
    }
    setCreating(true);
    try {
      const metadata = {
        name: values.name.trim(),
        title: values.title.trim(),
        description: values.description?.trim() || null,
      };
      const repo =
        createSource.mode === 'github'
          ? (
              await createFromGitRequest({
                ...metadata,
                provider: createSource.provider,
                config: createSource.config,
                ...(createSource.authRef ? { authRef: createSource.authRef } : {}),
              })
            ).repo
          : await createRepoRequest({
              ...metadata,
              ...(createSource.mode === 'zip' ? { zipBase64: createSource.zipBase64 } : {}),
            });
      setRepos((current) => [repo, ...current.filter((item) => item.id !== repo.id)]);
      setSelectedRepoId(repo.id);
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('create');
      nextSearchParams.set('repoId', repo.id);
      setSearchParams(nextSearchParams, { replace: true });
      setCreateOpen(false);
      form.resetFields();
      setCreateSource({ mode: 'template' });
      setCreateSourceKey((current) => current + 1);
      setNotice({
        type: 'success',
        message:
          createSource.mode === 'github'
            ? t('Repository created from GitHub and compiled')
            : createSource.mode === 'zip'
              ? t('Repository imported and compiled')
              : t('Repository created and compiled'),
      });
    } catch (error) {
      const syncErrorKey =
        error instanceof LightExtensionSyncHookError
          ? getLightExtensionSyncErrorTranslationKey(error.code) || 'Failed to create repository'
          : undefined;
      setNotice({
        type: 'error',
        message: syncErrorKey
          ? t(syncErrorKey)
          : error instanceof Error
            ? error.message
            : t('Failed to create repository'),
      });
    } finally {
      setCreating(false);
    }
  };

  const batchChangeLifecycle = useCallback(
    async (lifecycleStatus: ToggleLifecycleStatus) => {
      if (!selectedRepos.length) {
        return;
      }

      setBatchChanging(lifecycleStatus);
      setNotice(null);
      try {
        const results = await Promise.allSettled(
          selectedRepos.map((repo) => changeLifecycleRequest({ repoId: repo.id, lifecycleStatus })),
        );
        const updatedRepos = results
          .filter((result): result is PromiseFulfilledResult<LightExtensionRepoRecord> => result.status === 'fulfilled')
          .map((result) => result.value);

        if (updatedRepos.length) {
          const updatedRepoById = new Map(updatedRepos.map((repo) => [repo.id, repo]));
          setRepos((current) => current.map((repo) => updatedRepoById.get(repo.id) || repo));
        }

        const failedCount = results.length - updatedRepos.length;
        if (failedCount) {
          setNotice({ type: 'warning', message: t('Some repositories failed to update') });
          return;
        }

        setNotice({ type: 'success', message: t('Repositories updated') });
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to change lifecycle') });
      } finally {
        setBatchChanging(null);
      }
    },
    [changeLifecycleRequest, selectedRepos, t],
  );

  const changeRepoLifecycle = useCallback(
    async (repo: LightExtensionRepoRecord, lifecycleStatus: ToggleLifecycleStatus) => {
      if (repo.lifecycleStatus === lifecycleStatus) {
        return;
      }

      setChangingRepoIds((current) => new Set(current).add(repo.id));
      setNotice(null);
      try {
        const updatedRepo = await changeLifecycleRequest({ repoId: repo.id, lifecycleStatus });
        setRepos((current) => current.map((item) => (item.id === updatedRepo.id ? updatedRepo : item)));
        setNotice({ type: 'success', message: t('Repositories updated') });
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to change lifecycle') });
      } finally {
        setChangingRepoIds((current) => {
          const next = new Set(current);
          next.delete(repo.id);
          return next;
        });
      }
    },
    [changeLifecycleRequest, t],
  );

  const removeRepo = useCallback(
    async (repo: LightExtensionRepoRecord): Promise<boolean> => {
      setRemovingRepoIds((current) => new Set(current).add(repo.id));
      setNotice(null);
      try {
        await deleteRepoRequest(repo.id);

        setRepos((current) => current.filter((item) => item.id !== repo.id));
        setSelectedRowKeys((current) => current.filter((key) => key !== repo.id));
        if (selectedRepoId === repo.id) {
          setSelectedRepoId(null);
          const nextSearchParams = new URLSearchParams(searchParams);
          nextSearchParams.delete('repoId');
          nextSearchParams.delete('panel');
          setSearchParams(nextSearchParams, { replace: true });
        }
        setNotice({ type: 'success', message: t('Repository removed') });
        return true;
      } catch (error) {
        setNotice({
          type: 'error',
          message: error instanceof Error ? error.message : t('Failed to remove repository'),
        });
        return false;
      } finally {
        setRemovingRepoIds((current) => {
          const next = new Set(current);
          next.delete(repo.id);
          return next;
        });
      }
    },
    [deleteRepoRequest, searchParams, selectedRepoId, setSearchParams, t],
  );

  const confirmRemoveRepo = useCallback(async () => {
    if (!removeTarget) {
      return;
    }

    const removed = await removeRepo(removeTarget);
    if (removed) {
      setRemoveTarget(null);
    }
  }, [removeRepo, removeTarget]);

  const updateRepo = useCallback(
    async (values: EditRepoFormValues) => {
      if (!editTarget) {
        return;
      }

      setEditing(true);
      setNotice(null);
      try {
        const updatedRepo = await updateRepoRequest({
          repoId: editTarget.id,
          title: values.title.trim(),
          description: values.description?.trim() || null,
        });
        setRepos((current) => current.map((repo) => (repo.id === updatedRepo.id ? { ...repo, ...updatedRepo } : repo)));
        setEditTarget(null);
        editForm.resetFields();
        setNotice({ type: 'success', message: t('Repository updated') });
      } catch (error) {
        setNotice({
          type: 'error',
          message: error instanceof Error ? error.message : t('Failed to update repository'),
        });
      } finally {
        setEditing(false);
      }
    },
    [editForm, editTarget, t, updateRepoRequest],
  );

  const handleSyncRepoUpdated = useCallback(
    (updatedRepo: LightExtensionRepoRecord) => {
      setRepos((current) => current.map((repo) => (repo.id === updatedRepo.id ? updatedRepo : repo)));
      loadRepos();
    },
    [loadRepos],
  );

  const handleSyncConfigured = useCallback(
    (_source: LightExtensionSyncSourceSummary) => {
      setSyncDrawerVersion((current) => current + 1);
      setNotice({ type: 'success', message: t('Sync source configured') });
    },
    [t],
  );

  const handleSyncSourceChanged = useCallback(
    (source: LightExtensionSyncSourceSummary | null) => {
      if (!source) {
        setNotice({ type: 'success', message: t('Sync source disconnected') });
      }
    },
    [t],
  );

  const columns = useMemo<ColumnsType<LightExtensionRepoRecord>>(
    () => [
      {
        title: t('Title'),
        dataIndex: 'name',
        sorter: (left, right) =>
          compareText(left.title || left.name, right.title || right.name) || compareText(left.name, right.name),
        width: 220,
        render: (_value, repo) => (
          <Space direction="vertical" size={0} style={{ maxWidth: 200, minWidth: 0 }}>
            <Typography.Text ellipsis strong style={{ maxWidth: 200 }}>
              {repo.title || repo.name}
            </Typography.Text>
            <Typography.Text code ellipsis style={{ maxWidth: 200 }} type="secondary">
              {repo.name}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: t('Description'),
        dataIndex: 'description',
        sorter: (left, right) => compareText(left.description, right.description),
        render: (value: string | null) => (
          <Typography.Text ellipsis={{ tooltip: value || '-' }} style={{ maxWidth: 320 }} type="secondary">
            {value || '-'}
          </Typography.Text>
        ),
      },
      {
        title: t('Entries'),
        key: 'entries',
        sorter: (left, right) => getRepoEntryCount(left) - getRepoEntryCount(right),
        width: 250,
        render: (_value, repo) => {
          const kinds = entryKinds.filter((kind) => Boolean(repo.entryKinds?.[kind]));
          return kinds.length ? (
            <Space size={[4, 4]} wrap>
              {kinds.map((kind) => (
                <Tag key={kind}>
                  {t(kind)} {repo.entryKinds?.[kind]}
                </Tag>
              ))}
            </Space>
          ) : (
            <Typography.Text type="secondary">0</Typography.Text>
          );
        },
      },
      {
        title: t('Updated at'),
        dataIndex: 'updatedAt',
        sorter: (left, right) => getDateTimestamp(left.updatedAt) - getDateTimestamp(right.updatedAt),
        width: 180,
        render: (_value, repo) => (
          <Space direction="vertical" size={0}>
            <Typography.Text>{formatDate(repo.updatedAt)}</Typography.Text>
            <Typography.Text type="secondary">
              {t('Created at')}: {formatDate(repo.createdAt)}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: t('Enabled'),
        dataIndex: 'lifecycleStatus',
        align: 'center',
        sorter: (left, right) =>
          Number(left.lifecycleStatus === 'enabled') - Number(right.lifecycleStatus === 'enabled'),
        width: 100,
        render: (_value: LightExtensionRepoLifecycleStatus, repo) => (
          <span onClick={(event) => event.stopPropagation()}>
            <Switch
              aria-label={`${t('Enabled')} ${repo.title || repo.name}`}
              checked={repo.lifecycleStatus === 'enabled'}
              loading={changingRepoIds.has(repo.id)}
              onChange={(checked) => {
                changeRepoLifecycle(repo, checked ? 'enabled' : 'disabled');
              }}
              size="small"
            />
          </span>
        ),
      },
      {
        title: t('Actions'),
        key: 'actions',
        width: 460,
        render: (_value, repo) => (
          <Space size="small" onClick={(event) => event.stopPropagation()}>
            <Button
              aria-label={t('Edit code')}
              onClick={() => selectRepo(repo.id, { panel: 'source' })}
              size="small"
              style={TABLE_ACTION_BUTTON_STYLE}
              type="link"
            >
              {t('Edit code')}
            </Button>
            <Button
              aria-label={t('Sync code')}
              onClick={() => selectRepo(repo.id, { panel: 'sync' })}
              size="small"
              style={TABLE_ACTION_BUTTON_STYLE}
              type="link"
            >
              {t('Sync code')}
            </Button>
            <Button
              aria-label={`${t('Custom frontend')} ${repo.title || repo.name}`}
              onClick={() => selectRepo(repo.id, { panel: 'client-apps' })}
              size="small"
              style={TABLE_ACTION_BUTTON_STYLE}
              type="link"
            >
              {t('Custom frontend')}
            </Button>
            <Button
              aria-label={`${t('Edit details')} ${repo.title || repo.name}`}
              onClick={() => openEditDrawer(repo)}
              size="small"
              style={TABLE_ACTION_BUTTON_STYLE}
              type="link"
            >
              {t('Edit details')}
            </Button>
            <Button
              aria-label={t('Remove')}
              danger
              loading={removingRepoIds.has(repo.id)}
              onClick={() => setRemoveTarget(repo)}
              size="small"
              style={TABLE_ACTION_BUTTON_STYLE}
              type="link"
            >
              {t('Remove')}
            </Button>
          </Space>
        ),
      },
    ],
    [changeRepoLifecycle, changingRepoIds, openEditDrawer, removingRepoIds, selectRepo, t],
  );

  const batchActionItems: MenuProps['items'] = [
    {
      key: 'enabled',
      label: t('Enable selected'),
      onClick: () => batchChangeLifecycle('enabled'),
    },
    {
      key: 'disabled',
      label: t('Disable selected'),
      onClick: () => batchChangeLifecycle('disabled'),
    },
  ];
  const renderDrawerContent = () => {
    if (activePanel === 'source') {
      return (
        <LightExtensionWorkspacePage
          embedded
          onFooterActionsChange={setSourceFooterActions}
          onRequestClose={closeDetailDrawer}
        />
      );
    }

    if (activePanel === 'client-apps' && selectedRepo) {
      return <LightExtensionClientAppsPanel onChanged={loadRepos} repoId={selectedRepo.id} />;
    }

    return null;
  };

  return (
    <Card variant="borderless">
      {notice ? (
        <Alert
          closable
          message={notice.message}
          onClose={() => setNotice(null)}
          showIcon
          style={{ marginBottom: token.margin }}
          type={notice.type}
        />
      ) : null}

      <Flex align="center" justify="space-between" gap={token.marginSM} style={{ marginBottom: token.margin }} wrap>
        <CollectionFilter
          collection={filterCollection}
          filterableFieldNames={[...LIGHT_EXTENSION_REPO_FILTER_FIELD_NAMES]}
          onChange={setFilterPayload}
          t={compileT}
        />
        <Space wrap>
          {selectedRowKeys.length ? (
            <Typography.Text type="secondary">
              {t('Selected {{count}}').replace('{{count}}', String(selectedRowKeys.length))}
            </Typography.Text>
          ) : null}
          <Button icon={<ReloadOutlined />} loading={loading} onClick={loadRepos}>
            {t('Refresh')}
          </Button>
          <Dropdown disabled={!selectedRowKeys.length} menu={{ items: batchActionItems }} trigger={['click']}>
            <Button disabled={!selectedRowKeys.length} loading={Boolean(batchChanging)}>
              {t('Batch actions')} <DownOutlined />
            </Button>
          </Dropdown>
          <Button aria-label={t('Add new')} icon={<PlusOutlined />} onClick={openCreateModal} type="primary">
            {t('Add new')}
          </Button>
        </Space>
      </Flex>

      <Table<LightExtensionRepoRecord>
        columns={columns}
        dataSource={filteredRepos}
        loading={loading}
        locale={{
          emptyText: <Empty description={t('No light extensions yet')} image={Empty.PRESENTED_IMAGE_SIMPLE} />,
        }}
        pagination={{ pageSize: DEFAULT_PAGE_SIZE, showSizeChanger: true }}
        rowKey="id"
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        scroll={{ x: 1250 }}
        showIndex={false}
      />

      <Modal
        confirmLoading={creating}
        okButtonProps={{ disabled: !createSource }}
        okText={t('Create')}
        onCancel={closeCreateModal}
        onOk={createRepo}
        open={createOpen}
        title={t('Create light extension')}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            extra={t('The name is generated automatically and can be changed if needed.')}
            label={t('Name')}
            name="name"
            rules={[
              { required: true, message: t('Name is required') },
              { pattern: /^[a-z][a-z0-9._-]*$/, message: t('Name format is invalid') },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label={t('Title')}
            name="title"
            rules={[{ required: true, whitespace: true, message: t('Title is required') }]}
          >
            <Input autoFocus />
          </Form.Item>
          <Form.Item label={t('Description')} name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <LightExtensionCreateSourceSelector disabled={creating} key={createSourceKey} onChange={setCreateSource} />
        </Form>
      </Modal>

      <Drawer
        aria-label={t('Edit light extension')}
        destroyOnClose
        footer={
          <Flex justify="flex-end">
            <Space>
              <Button disabled={editing} onClick={closeEditDrawer}>
                {t('Cancel')}
              </Button>
              <Button form="light-extension-edit-form" htmlType="submit" loading={editing} type="primary">
                {t('Save')}
              </Button>
            </Space>
          </Flex>
        }
        maskClosable={!editing}
        onClose={closeEditDrawer}
        open={Boolean(editTarget)}
        title={t('Edit light extension')}
        width={520}
      >
        <Form form={editForm} id="light-extension-edit-form" layout="vertical" onFinish={updateRepo}>
          <Form.Item
            label={t('Title')}
            name="title"
            rules={[{ required: true, whitespace: true, message: t('Title is required') }]}
          >
            <Input autoFocus />
          </Form.Item>
          <Form.Item label={t('Description')} name="description">
            <Input.TextArea rows={4} />
          </Form.Item>
        </Form>
      </Drawer>

      <Modal
        cancelButtonProps={{ disabled: Boolean(removeTarget && removingRepoIds.has(removeTarget.id)) }}
        cancelText={t('Cancel')}
        closable={!removeTarget || !removingRepoIds.has(removeTarget.id)}
        confirmLoading={Boolean(removeTarget && removingRepoIds.has(removeTarget.id))}
        maskClosable={false}
        okButtonProps={{ danger: true }}
        okText={t('Remove')}
        onCancel={() => setRemoveTarget(null)}
        onOk={confirmRemoveRepo}
        open={Boolean(removeTarget)}
        title={t('Remove this repository?')}
      >
        <Space direction="vertical" size={token.marginSM} style={{ width: '100%' }}>
          <Typography.Text>
            {t('Repository to remove')}:{' '}
            <Typography.Text strong>{removeTarget?.title || removeTarget?.name}</Typography.Text>
          </Typography.Text>
          <Alert message={t('This action cannot be undone')} showIcon type="warning" />
        </Space>
      </Modal>

      <Drawer
        destroyOnClose
        onClose={closeDetailDrawer}
        open={detailDrawerOpen}
        styles={{
          body: { overflow: activePanel === 'source' ? 'hidden' : 'auto', padding: 16 },
        }}
        footer={
          activePanel === 'source' ? (
            <Flex justify="flex-end">
              <Space>
                <Button
                  disabled={sourceFooterActions?.loading}
                  onClick={sourceFooterActions?.onCancel || closeDetailDrawer}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  disabled={!sourceFooterActions || sourceFooterActions.disabled}
                  icon={<SaveOutlined />}
                  loading={sourceFooterActions?.loading}
                  onClick={sourceFooterActions?.onSave}
                  type="primary"
                >
                  {t('Save')}
                </Button>
              </Space>
            </Flex>
          ) : null
        }
        title={
          selectedRepo && activePanel
            ? `${detailPanelTitle(t, activePanel)}: ${selectedRepo.title || selectedRepo.name}`
            : null
        }
        width={SOURCE_DRAWER_WIDTH}
      >
        {detailDrawerOpen ? renderDrawerContent() : null}
      </Drawer>

      {selectedRepo ? (
        <LightExtensionSyncDrawer
          configurationPanel={
            <LightExtensionSyncConfigurationPanel onConfigured={handleSyncConfigured} repoId={selectedRepo.id} />
          }
          key={`${selectedRepo.id}:${syncDrawerVersion}`}
          onClose={closeDetailDrawer}
          onRepoUpdated={handleSyncRepoUpdated}
          onSyncSourceChanged={handleSyncSourceChanged}
          open={syncDrawerOpen}
          repo={selectedRepo}
        />
      ) : null}
    </Card>
  );
}

interface LightExtensionSyncConfigurationPanelProps {
  repoId: string;
  onConfigured: (source: LightExtensionSyncSourceSummary) => void;
}

function LightExtensionSyncConfigurationPanel({ repoId, onConfigured }: LightExtensionSyncConfigurationPanelProps) {
  const t = useT();
  const sync = useLightExtensionSync();
  const [draft, setDraft] = useState<LightExtensionGitSourceDraft>(createEmptyLightExtensionGitSourceDraft);
  const [source, setSource] = useState<LightExtensionGitHubSourceValue>();
  const [request, setRequest] = useState<SyncConfigurationRequest>();
  const [feedback, setFeedback] = useState<Notice | null>(null);
  const disabled = Boolean(request);

  const testConnection = async () => {
    if (!source) {
      return;
    }
    setRequest('test');
    setFeedback(null);
    try {
      await sync.testConnection({ repoId, ...source });
      setFeedback({ type: 'success', message: t('Connection successful') });
    } catch {
      setFeedback({ type: 'error', message: t('Unable to test connection') });
    } finally {
      setRequest(undefined);
    }
  };

  const configure = async () => {
    if (!source) {
      return;
    }
    setRequest('configure');
    setFeedback(null);
    try {
      const result = await sync.configure({ repoId, ...source });
      onConfigured(result.source);
    } catch {
      setFeedback({ type: 'error', message: t('Unable to configure sync source') });
    } finally {
      setRequest(undefined);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
      {feedback ? <Alert message={feedback.message} role="alert" showIcon type={feedback.type} /> : null}
      <Form layout="vertical">
        <LightExtensionGitSourceFields
          disabled={disabled}
          onChange={setDraft}
          onValidSourceChange={setSource}
          value={draft}
        />
      </Form>
      <Space wrap>
        <Button disabled={!source || disabled} loading={request === 'test'} onClick={testConnection}>
          {t('Test connection')}
        </Button>
        <Button disabled={!source || disabled} loading={request === 'configure'} onClick={configure} type="primary">
          {t('Configure')}
        </Button>
      </Space>
    </Space>
  );
}

function useLightExtensionRepoFilterCollection(): Collection | undefined {
  const engine = useFlowEngine();
  const ownsFilterCollectionRef = useRef(false);

  const collection = useMemo(() => {
    const dataSource = engine.context.dataSourceManager?.getDataSource?.('main');
    const existingCollection = dataSource?.getCollection?.(LIGHT_EXTENSION_REPO_FILTER_COLLECTION);

    if (existingCollection) {
      return existingCollection;
    }

    dataSource?.addCollection?.(lightExtensionRepoFilterCollection);
    const registeredCollection = dataSource?.getCollection?.(LIGHT_EXTENSION_REPO_FILTER_COLLECTION);

    if (registeredCollection) {
      ownsFilterCollectionRef.current = true;
    }

    return registeredCollection;
  }, [engine]);

  useEffect(() => {
    return () => {
      if (!ownsFilterCollectionRef.current) {
        return;
      }

      engine.context.dataSourceManager
        ?.getDataSource?.('main')
        ?.removeCollection?.(LIGHT_EXTENSION_REPO_FILTER_COLLECTION);
      ownsFilterCollectionRef.current = false;
    };
  }, [engine]);

  return collection;
}

function parseDetailPanel(value: string | null): DetailPanel | null {
  return value === 'source' || value === 'sync' || value === 'client-apps' ? value : null;
}

function detailPanelTitle(t: (key: string) => string, panel: DetailPanel): string {
  if (panel === 'source') {
    return t('Source');
  }
  return panel === 'sync' ? t('Sync code') : t('Custom frontend');
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function compareText(left?: string | null, right?: string | null): number {
  return String(left || '').localeCompare(String(right || ''), undefined, { numeric: true, sensitivity: 'base' });
}

function getRepoEntryCount(repo: LightExtensionRepoRecord): number {
  if (typeof repo.entryCount === 'number') {
    return repo.entryCount;
  }

  return entryKinds.reduce((total, kind) => total + (repo.entryKinds?.[kind] || 0), 0);
}

function getDateTimestamp(value?: string | null): number {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function normalizeSearchText(value: unknown): string {
  return String(value ?? '').toLowerCase();
}

function matchFilterValue(candidates: string[], operator: string, value: unknown): boolean {
  const expected = normalizeSearchText(value);
  if (!expected) {
    return true;
  }

  switch (operator) {
    case '$eq':
      return candidates.some((candidate) => candidate === expected);
    case '$ne':
      return candidates.every((candidate) => candidate !== expected);
    case '$notIncludes':
      return candidates.every((candidate) => !candidate.includes(expected));
    case '$in':
      return Array.isArray(value)
        ? value.map(normalizeSearchText).some((item) => candidates.includes(item))
        : candidates.includes(expected);
    case '$notIn':
      return Array.isArray(value)
        ? value.map(normalizeSearchText).every((item) => !candidates.includes(item))
        : !candidates.includes(expected);
    case '$empty':
      return candidates.every((candidate) => !candidate);
    case '$notEmpty':
      return candidates.some((candidate) => Boolean(candidate));
    case '$includes':
    default:
      return candidates.some((candidate) => candidate.includes(expected));
  }
}

function matchFilterField(candidates: string[], value: unknown): boolean {
  if (!isRecord(value)) {
    return matchFilterValue(candidates, '$includes', value);
  }

  const operatorEntries = Object.entries(value).filter(([operator]) => operator.startsWith('$'));
  if (!operatorEntries.length) {
    return true;
  }

  return operatorEntries.every(([operator, operatorValue]) => matchFilterValue(candidates, operator, operatorValue));
}

function matchBooleanFilter(value: boolean, filterValue: unknown): boolean {
  if (!isRecord(filterValue)) {
    return value === Boolean(filterValue);
  }

  return Object.entries(filterValue).every(([operator, operatorValue]) => {
    if (operator === '$isTruly') {
      return value;
    }
    if (operator === '$isFalsy') {
      return !value;
    }
    if (operator === '$ne') {
      return value !== Boolean(operatorValue);
    }
    if (operator === '$empty') {
      return false;
    }
    if (operator === '$notEmpty') {
      return true;
    }
    return value === Boolean(operatorValue);
  });
}

function matchDateFilter(value: string | null | undefined, filterValue: unknown): boolean {
  if (!isRecord(filterValue)) {
    return matchDateOperator(value, '$dateOn', filterValue);
  }

  return Object.entries(filterValue).every(([operator, operatorValue]) =>
    matchDateOperator(value, operator, operatorValue),
  );
}

function matchDateOperator(value: string | null | undefined, operator: string, operatorValue: unknown): boolean {
  if (operator === '$empty') {
    return !value;
  }
  if (operator === '$notEmpty') {
    return Boolean(value);
  }
  if (!value) {
    return false;
  }

  const valueTimestamp = getDateTimestamp(value);
  const range = resolveDateFilterRange(operatorValue);
  if (!valueTimestamp || !range) {
    return false;
  }

  const [startTimestamp, endTimestamp] = range;
  switch (operator) {
    case '$dateNotOn':
      return valueTimestamp < startTimestamp || valueTimestamp > endTimestamp;
    case '$dateBefore':
      return valueTimestamp < startTimestamp;
    case '$dateAfter':
      return valueTimestamp > endTimestamp;
    case '$dateNotBefore':
      return valueTimestamp >= startTimestamp;
    case '$dateNotAfter':
      return valueTimestamp <= endTimestamp;
    case '$dateBetween':
    case '$dateOn':
    default:
      return valueTimestamp >= startTimestamp && valueTimestamp <= endTimestamp;
  }
}

function resolveDateFilterRange(value: unknown): [number, number] | null {
  if (isDateRangeParams(value)) {
    try {
      return toTimestampRange(getDayRangeByParams(value));
    } catch {
      return null;
    }
  }
  if (Array.isArray(value)) {
    return toTimestampRange([String(value[0] || ''), String(value[1] || value[0] || '')]);
  }
  if (typeof value !== 'string' || !value) {
    return null;
  }

  if (/^\d{4}$/.test(value)) {
    return toTimestampRange([`${value}-01-01 00:00:00`, `${value}-12-31 23:59:59.999`]);
  }
  if (/^\d{4}-\d{2}$/.test(value)) {
    const start = new Date(`${value}-01T00:00:00`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return [start.getTime(), end.getTime()];
  }
  if (/^\d{4}Q[1-4]$/.test(value)) {
    const year = Number(value.slice(0, 4));
    const quarter = Number(value.slice(5));
    const start = new Date(year, (quarter - 1) * 3, 1);
    const end = new Date(year, quarter * 3, 0, 23, 59, 59, 999);
    return [start.getTime(), end.getTime()];
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return toTimestampRange([`${value} 00:00:00`, `${value} 23:59:59.999`]);
  }

  const timestamp = getDateTimestamp(value);
  return timestamp ? [timestamp, timestamp] : null;
}

function isDateRangeParams(value: unknown): value is Parameters<typeof getDayRangeByParams>[0] {
  return isRecord(value) && typeof value.type === 'string';
}

function toTimestampRange(values: [string, string]): [number, number] | null {
  const start = getDateTimestamp(values[0].replace(' ', 'T'));
  const end = getDateTimestamp(values[1].replace(' ', 'T'));
  return start && end ? [start, end] : null;
}

export function matchesLightExtensionRepoFilter(repo: LightExtensionRepoRecord, filter: CompiledFilter): boolean {
  if (!isRecord(filter)) {
    return true;
  }

  const results: boolean[] = [];
  if (Array.isArray(filter.$and)) {
    results.push(filter.$and.every((item) => matchesLightExtensionRepoFilter(repo, item as CompiledFilter)));
  }
  if (Array.isArray(filter.$or)) {
    results.push(filter.$or.some((item) => matchesLightExtensionRepoFilter(repo, item as CompiledFilter)));
  }
  if (Object.prototype.hasOwnProperty.call(filter, 'name')) {
    results.push(matchFilterField([normalizeSearchText(repo.name), normalizeSearchText(repo.title)], filter.name));
  }
  if (Object.prototype.hasOwnProperty.call(filter, 'description')) {
    results.push(matchFilterField([normalizeSearchText(repo.description)], filter.description));
  }
  if (Object.prototype.hasOwnProperty.call(filter, 'updatedAt')) {
    results.push(matchDateFilter(repo.updatedAt, filter.updatedAt));
  }
  if (Object.prototype.hasOwnProperty.call(filter, 'createdAt')) {
    results.push(matchDateFilter(repo.createdAt, filter.createdAt));
  }
  if (Object.prototype.hasOwnProperty.call(filter, 'enabled')) {
    results.push(matchBooleanFilter(repo.lifecycleStatus === 'enabled', filter.enabled));
  }

  return results.length ? results.every(Boolean) : true;
}

export function createLightExtensionRepoName(): string {
  return `l_${uid()}`;
}

export default LightExtensionListPage;
