/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import {
  CodeOutlined,
  DeleteOutlined,
  DownOutlined,
  DownloadOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  ScanOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import {
  CollectionFilter,
  DEFAULT_PAGE_SIZE,
  ExtendCollectionsProvider,
  Table,
  type CompiledFilter,
} from '@nocobase/client-v2';
import { useFlowEngine, type Collection, type CollectionOptions } from '@nocobase/flow-engine';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Drawer,
  Dropdown,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Skeleton,
  Space,
  Switch,
  Tag,
  theme,
  Tree,
  Typography,
  Upload,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DataNode } from 'antd/es/tree';
import type { MenuProps } from 'antd';
import type { RcFile } from 'rc-upload/lib/interface';
import type { UploadFile } from 'antd/es/upload/interface';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import type {
  LightExtensionEntryRecord,
  LightExtensionPublicationMetadataRecord,
  LightExtensionPublishResult,
  LightExtensionPulledFile,
  LightExtensionRepoLifecycleStatus,
  LightExtensionRepoRecord,
  LightExtensionScanResult,
} from '../../shared/types';
import { toLifecycleInput, useLightExtensionRepo } from '../hooks/useLightExtensionRepo';
import { useLightExtensionPublications } from '../hooks/useLightExtensionPublications';
import { useT } from '../locale';
import LightExtensionWorkspacePage, { type LightExtensionWorkspaceFooterActions } from './LightExtensionWorkspacePage';

interface CreateRepoFormValues {
  name: string;
  title?: string;
  description?: string;
}

type ImportRepoFormValues = CreateRepoFormValues;

type Notice = {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

type RepoOverview = {
  repoId: string;
  entries: LightExtensionEntryRecord[];
  publications: LightExtensionPublicationMetadataRecord[];
  files: LightExtensionPulledFile[];
};

type ToggleLifecycleStatus = 'enabled' | 'disabled';
type DetailPanel = 'source' | 'overview';

const overviewKinds = ['js-block', 'js-action', 'js-field', 'js-item', 'runjs', 'event'] as const;
const LIGHT_EXTENSION_REPO_FILTER_COLLECTION = 'lightExtensionRepoFilters';
const SOURCE_DRAWER_WIDTH = 'min(1280px, calc(100vw - 64px))';
const lightExtensionRepoFilterCollection: CollectionOptions = {
  name: LIGHT_EXTENSION_REPO_FILTER_COLLECTION,
  filterTargetKey: 'id',
  fields: [
    {
      name: 'name',
      type: 'string',
      interface: 'input',
      uiSchema: {
        type: 'string',
        title: 'Name',
        'x-component': 'Input',
      },
    },
    {
      name: 'title',
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
      name: 'lifecycleStatus',
      type: 'string',
      interface: 'select',
      uiSchema: {
        type: 'string',
        title: 'Enable status',
        'x-component': 'Select',
        enum: [
          { label: 'Enabled', value: 'enabled' },
          { label: 'Disabled', value: 'disabled' },
        ],
      },
    },
  ],
};
const lightExtensionRepoFilterCollections = [lightExtensionRepoFilterCollection];

type ImportedLightExtensionPackage = {
  repo?: {
    name?: string;
    title?: string | null;
    description?: string | null;
  };
  files: LightExtensionPulledFile[];
};

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
    getRepo,
    listEntries,
    listRepos,
    pull,
    scanEntries: scanEntriesRequest,
  } = useLightExtensionRepo();
  const { listPublications, publish } = useLightExtensionPublications();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm<CreateRepoFormValues>();
  const [importForm] = Form.useForm<ImportRepoFormValues>();
  const [repos, setRepos] = useState<LightExtensionRepoRecord[]>([]);
  const [selectedRepoId, setSelectedRepoId] = useState<string | null>(searchParams.get('repoId'));
  const [overview, setOverview] = useState<RepoOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [batchChanging, setBatchChanging] = useState<ToggleLifecycleStatus | null>(null);
  const [changingRepoIds, setChangingRepoIds] = useState<Set<string>>(() => new Set());
  const [exportingRepoIds, setExportingRepoIds] = useState<Set<string>>(() => new Set());
  const [removingRepoIds, setRemovingRepoIds] = useState<Set<string>>(() => new Set());
  const [importFileList, setImportFileList] = useState<UploadFile[]>([]);
  const [importPackage, setImportPackage] = useState<ImportedLightExtensionPackage | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [filterPayload, setFilterPayload] = useState<CompiledFilter>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [sourceFooterActions, setSourceFooterActions] = useState<LightExtensionWorkspaceFooterActions | null>(null);

  const urlPanel = parseDetailPanel(searchParams.get('panel'));
  const [activePanel, setActivePanel] = useState<DetailPanel | null>(urlPanel);
  const detailDrawerOpen = Boolean(activePanel && selectedRepoId);

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
      setCreateOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activePanel !== 'source') {
      setSourceFooterActions(null);
    }
  }, [activePanel]);

  const loadSelectedOverview = useCallback(async () => {
    if (!selectedRepoId || activePanel !== 'overview') {
      setOverview(null);
      setOverviewError(null);
      return;
    }

    setOverviewLoading(true);
    setOverviewError(null);
    try {
      const [nextRepo, nextEntries, nextPublications, pullResult] = await Promise.all([
        getRepo(selectedRepoId),
        listEntries(selectedRepoId),
        listPublications(selectedRepoId),
        pull({ repoId: selectedRepoId, includeContent: 'none' }).catch(() => null),
      ]);
      setRepos((current) => upsertRepo(current, nextRepo));
      setOverview({
        repoId: selectedRepoId,
        entries: nextEntries,
        publications: nextPublications,
        files: pullResult?.files || [],
      });
    } catch (error) {
      setOverview({
        repoId: selectedRepoId,
        entries: [],
        publications: [],
        files: [],
      });
      setOverviewError(error instanceof Error ? error.message : t('Failed to load entries'));
    } finally {
      setOverviewLoading(false);
    }
  }, [activePanel, getRepo, listEntries, listPublications, pull, selectedRepoId, t]);

  useEffect(() => {
    loadSelectedOverview();
  }, [loadSelectedOverview]);

  const selectedRepo = useMemo(() => repos.find((repo) => repo.id === selectedRepoId) || null, [repos, selectedRepoId]);
  const selectedOverview = overview?.repoId === selectedRepoId ? overview : null;
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
    if (searchParams.has('create')) {
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('create');
      setSearchParams(nextSearchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const openCreateModal = useCallback(() => {
    form.resetFields();
    setCreateOpen(true);
  }, [form]);

  const closeImportModal = useCallback(() => {
    setImportOpen(false);
    setImportFileList([]);
    setImportPackage(null);
    setImportError(null);
    importForm.resetFields();
  }, [importForm]);

  const openImportModal = useCallback(() => {
    setImportFileList([]);
    setImportPackage(null);
    setImportError(null);
    importForm.resetFields();
    setImportOpen(true);
  }, [importForm]);

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
    setCreating(true);
    try {
      const repo = await createRepoRequest({
        name: values.name,
        title: values.title || null,
        description: values.description || null,
        initialFiles: [],
      });
      setRepos((current) => [repo, ...current.filter((item) => item.id !== repo.id)]);
      setSelectedRepoId(repo.id);
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('create');
      nextSearchParams.set('repoId', repo.id);
      setSearchParams(nextSearchParams, { replace: true });
      form.resetFields();
      setCreateOpen(false);
      setNotice({ type: 'success', message: t('Repository created') });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to create repository') });
    } finally {
      setCreating(false);
    }
  };

  const readImportFile = useCallback(
    async (file: RcFile) => {
      setImportError(null);
      try {
        const text = await readFileAsText(file);
        let rawPackage: unknown;
        try {
          rawPackage = JSON.parse(text);
        } catch {
          throw new Error(t('Invalid import file'));
        }
        const parsedPackage = normalizeImportedLightExtensionPackage(rawPackage, t);
        setImportPackage(parsedPackage);
        setImportFileList([
          {
            uid: file.uid,
            name: file.name,
            status: 'done',
          },
        ]);
        importForm.setFieldsValue({
          name: toImportRepoName(parsedPackage.repo?.name || file.name.replace(/\.json$/i, '')),
          title: parsedPackage.repo?.title || undefined,
          description: parsedPackage.repo?.description || undefined,
        });
      } catch (error) {
        setImportPackage(null);
        setImportFileList([]);
        setImportError(error instanceof Error ? error.message : t('Failed to read import file'));
      }
    },
    [importForm, t],
  );

  const importRepo = async () => {
    const values = await importForm.validateFields();
    if (!importPackage) {
      setImportError(t('Import file is required'));
      return;
    }

    setImporting(true);
    try {
      const repo = await createRepoRequest({
        name: values.name,
        title: values.title || null,
        description: values.description || null,
        initialFiles: importPackage.files.map((file) => ({
          path: file.path,
          content: file.content,
          size: file.size,
          language: file.language,
          mode: file.mode,
        })),
        message: t('Import light extension'),
      });
      const publishOutcome = repo.headCommitId
        ? await publishCurrentHead({
            commitId: repo.headCommitId,
            publish,
            repoId: repo.id,
            scanEntries: scanEntriesRequest,
          })
        : { published: false };
      setRepos((current) => [repo, ...current.filter((item) => item.id !== repo.id)]);
      setSelectedRepoId(repo.id);
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.set('repoId', repo.id);
      setSearchParams(nextSearchParams, { replace: true });
      closeImportModal();
      setNotice({
        type: publishOutcome.published ? 'success' : 'warning',
        message: publishOutcome.published
          ? t('Repository imported and published')
          : t('Repository imported, but no publishable JS block was found'),
      });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to import repository') });
    } finally {
      setImporting(false);
    }
  };

  const scanSelectedRepo = useCallback(async () => {
    if (!selectedRepoId) {
      return;
    }

    setScanning(true);
    setNotice(null);
    try {
      const result = await scanEntriesRequest(selectedRepoId);
      setRepos((current) => current.map((item) => (item.id === result.repo.id ? result.repo : item)));
      setOverview((current) =>
        current?.repoId === selectedRepoId
          ? {
              ...current,
              entries: result.entries.map((item) => item.entry),
            }
          : current,
      );
      setNotice({
        type: result.accepted ? 'success' : 'warning',
        message: result.accepted ? t('Scan completed') : t('Scan completed with diagnostics'),
      });
    } catch (error) {
      setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to scan entries') });
    } finally {
      setScanning(false);
    }
  }, [scanEntriesRequest, selectedRepoId, t]);

  const batchChangeLifecycle = useCallback(
    async (lifecycleStatus: ToggleLifecycleStatus) => {
      if (!selectedRepos.length) {
        return;
      }

      setBatchChanging(lifecycleStatus);
      setNotice(null);
      try {
        const results = await Promise.allSettled(
          selectedRepos.map((repo) => changeLifecycleRequest(toLifecycleInput(repo, lifecycleStatus))),
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
        const updatedRepo = await changeLifecycleRequest(toLifecycleInput(repo, lifecycleStatus));
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
    async (repo: LightExtensionRepoRecord) => {
      setRemovingRepoIds((current) => new Set(current).add(repo.id));
      setNotice(null);
      try {
        const result = await deleteRepoRequest(repo.id);
        if (!result.deleted) {
          throw new Error(t('Failed to remove repository'));
        }

        setRepos((current) => current.filter((item) => item.id !== repo.id));
        setSelectedRowKeys((current) => current.filter((key) => key !== repo.id));
        if (selectedRepoId === repo.id) {
          setSelectedRepoId(null);
          setOverview(null);
          const nextSearchParams = new URLSearchParams(searchParams);
          nextSearchParams.delete('repoId');
          nextSearchParams.delete('panel');
          setSearchParams(nextSearchParams, { replace: true });
        }
        setNotice({ type: 'success', message: t('Repository removed') });
      } catch (error) {
        setNotice({
          type: 'error',
          message: error instanceof Error ? error.message : t('Failed to remove repository'),
        });
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

  const exportRepo = useCallback(
    async (repo: LightExtensionRepoRecord) => {
      setNotice(null);
      setExportingRepoIds((current) => new Set(current).add(repo.id));
      try {
        const result = await pull({ repoId: repo.id, includeContent: 'all' });
        downloadJsonFile(`${repo.name}.light-extension.json`, {
          repo: {
            id: repo.id,
            name: repo.name,
            title: repo.title,
            description: repo.description,
            lifecycleStatus: repo.lifecycleStatus,
            headCommitId: repo.headCommitId,
          },
          commit: result.commit,
          tree: result.tree,
          files: result.files || [],
        });
        setNotice({ type: 'success', message: t('Repository exported') });
      } catch (error) {
        setNotice({
          type: 'error',
          message: error instanceof Error ? error.message : t('Failed to export repository'),
        });
      } finally {
        setExportingRepoIds((current) => {
          const next = new Set(current);
          next.delete(repo.id);
          return next;
        });
      }
    },
    [pull, t],
  );

  const columns = useMemo<ColumnsType<LightExtensionRepoRecord>>(
    () => [
      {
        title: t('Name'),
        dataIndex: 'name',
        width: 260,
        render: (_value, repo) => (
          <Space direction="vertical" size={0} style={{ maxWidth: 230, minWidth: 0 }}>
            <Typography.Text ellipsis strong style={{ maxWidth: 230 }}>
              {repo.title || repo.name}
            </Typography.Text>
            <Typography.Text ellipsis style={{ maxWidth: 230 }} type="secondary">
              {repo.description || repo.name}
            </Typography.Text>
          </Space>
        ),
      },
      {
        title: t('Updated at'),
        dataIndex: 'updatedAt',
        width: 180,
        render: (_value, repo) => formatDate(repo.lastPublishedAt || repo.updatedAt || repo.lastScannedAt),
      },
      {
        title: t('Enabled'),
        dataIndex: 'lifecycleStatus',
        align: 'center',
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
        width: 170,
        render: (_value, repo) => (
          <Space size={4} onClick={(event) => event.stopPropagation()}>
            <Button
              aria-label={t('Open source')}
              icon={<CodeOutlined />}
              onClick={() => selectRepo(repo.id, { panel: 'source' })}
              size="small"
            />
            <Button
              aria-label={t('Export')}
              icon={<DownloadOutlined />}
              loading={exportingRepoIds.has(repo.id)}
              onClick={() => exportRepo(repo)}
              size="small"
            />
            <Button
              aria-label={t('View details')}
              icon={<EyeOutlined />}
              onClick={() => selectRepo(repo.id, { panel: 'overview' })}
              size="small"
            />
            <Popconfirm
              cancelText={t('Cancel')}
              okButtonProps={{ danger: true }}
              okText={t('Remove')}
              onConfirm={() => removeRepo(repo)}
              title={t('Remove this repository?')}
            >
              <Button
                aria-label={t('Remove')}
                danger
                icon={<DeleteOutlined />}
                loading={removingRepoIds.has(repo.id)}
                size="small"
              />
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [changeRepoLifecycle, changingRepoIds, exportRepo, exportingRepoIds, removeRepo, removingRepoIds, selectRepo, t],
  );

  const entryStats = useMemo(() => buildEntryStats(selectedOverview?.entries || []), [selectedOverview?.entries]);
  const treeData = useMemo(() => buildTreeData(selectedOverview?.files || []), [selectedOverview?.files]);
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
  const addNewItems: MenuProps['items'] = [
    {
      key: 'empty',
      label: t('Create empty'),
      onClick: openCreateModal,
    },
    {
      key: 'import',
      label: t('Add new from import'),
      onClick: openImportModal,
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

    if (activePanel !== 'overview' || !selectedRepo) {
      return null;
    }

    return (
      <Flex vertical gap={18}>
        <Flex align="flex-start" justify="space-between" gap={12}>
          <Space direction="vertical" size={2} style={{ minWidth: 0 }}>
            <Typography.Text type="secondary">{t('Repository overview')}</Typography.Text>
            <Space wrap size={8}>
              <Typography.Title level={4} style={{ margin: 0 }}>
                {selectedRepo.title || selectedRepo.name}
              </Typography.Title>
              <Tag color={selectedRepo.lifecycleStatus === 'enabled' ? 'success' : 'default'}>
                {t(selectedRepo.lifecycleStatus === 'enabled' ? 'enabled' : 'disabled')}
              </Tag>
            </Space>
            <Typography.Text code ellipsis>
              {selectedRepo.name}
            </Typography.Text>
          </Space>
        </Flex>

        <section>
          <Typography.Text strong>{t('Basic information')}</Typography.Text>
          <Descriptions
            column={1}
            items={[
              { key: 'description', label: t('Description'), children: selectedRepo.description || '-' },
              { key: 'createdAt', label: t('Created at'), children: formatDate(selectedRepo.createdAt) },
              { key: 'updatedAt', label: t('Updated at'), children: formatDate(selectedRepo.updatedAt) },
              { key: 'headCommitId', label: t('Head commit'), children: shortCommit(selectedRepo.headCommitId) },
            ]}
            size="small"
          />
        </section>

        <section>
          <Flex align="center" justify="space-between">
            <Typography.Text strong>{t('Latest scan and publish status')}</Typography.Text>
            <Button icon={<ScanOutlined />} loading={scanning} onClick={scanSelectedRepo} size="small">
              {t('Scan')}
            </Button>
          </Flex>
          <Descriptions
            column={1}
            items={[
              { key: 'lastScannedAt', label: t('Last scanned at'), children: formatDate(selectedRepo.lastScannedAt) },
              {
                key: 'activePublications',
                label: t('Active publications'),
                children: selectedOverview?.entries.filter((entry) => entry.activePublicationId).length || 0,
              },
              { key: 'publications', label: t('Publications'), children: selectedOverview?.publications.length || 0 },
            ]}
            size="small"
            style={{ marginTop: 10 }}
          />
          {selectedRepo.lastError ? <Alert message={selectedRepo.lastError} showIcon type="error" /> : null}
        </section>

        <section>
          <Typography.Text strong>{t('Scanned entry counts')}</Typography.Text>
          {overviewLoading ? (
            <Skeleton active paragraph={{ rows: 2 }} title={false} />
          ) : (
            <div
              style={{
                display: 'grid',
                gap: 8,
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                marginTop: 10,
              }}
            >
              {overviewKinds.map((kind) => (
                <div
                  key={kind}
                  style={{
                    border: `1px solid ${token.colorBorderSecondary}`,
                    borderRadius: token.borderRadius,
                    minWidth: 0,
                    padding: token.paddingSM,
                  }}
                >
                  <Typography.Text type="secondary">{t(kind)}</Typography.Text>
                  <Typography.Title level={4} style={{ margin: 0 }}>
                    {entryStats[kind] || 0}
                  </Typography.Title>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <Flex align="center" justify="space-between" gap={8}>
            <Typography.Text strong>{t('File structure')}</Typography.Text>
            <Button
              icon={<CodeOutlined />}
              onClick={() => selectRepo(selectedRepo.id, { panel: 'source' })}
              size="small"
            >
              {t('Open source')}
            </Button>
          </Flex>
          {overviewError ? <Alert message={overviewError} showIcon style={{ marginTop: 10 }} type="warning" /> : null}
          {overviewLoading ? (
            <Skeleton active paragraph={{ rows: 5 }} title={false} />
          ) : treeData.length ? (
            <Tree
              defaultExpandAll
              key={selectedOverview?.files.map((file) => file.path).join('|')}
              selectable={false}
              style={{ marginTop: 10 }}
              treeData={treeData}
            />
          ) : (
            <Empty description={t('Empty repository')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
          )}
        </section>
      </Flex>
    );
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
          filterableFieldNames={['name', 'title', 'description', 'lifecycleStatus']}
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
          <Dropdown menu={{ items: addNewItems }} trigger={['click']}>
            <Button aria-label={t('Add new')} icon={<PlusOutlined />} type="primary">
              {t('Add new')} <DownOutlined />
            </Button>
          </Dropdown>
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
        scroll={{ x: 720 }}
        showIndex={false}
      />

      <Modal
        confirmLoading={creating}
        okText={t('Create')}
        onCancel={closeCreateModal}
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

      <Modal
        confirmLoading={importing}
        okText={t('Import')}
        onCancel={closeImportModal}
        onOk={importRepo}
        open={importOpen}
        title={t('Add new from import')}
      >
        <Form form={importForm} layout="vertical">
          <Form.Item label={t('Import file')} required>
            <Upload.Dragger
              accept=".json,application/json"
              beforeUpload={(file) => {
                readImportFile(file);
                return false;
              }}
              fileList={importFileList}
              maxCount={1}
              onRemove={() => {
                setImportFileList([]);
                setImportPackage(null);
                setImportError(null);
                return true;
              }}
            >
              <p className="ant-upload-drag-icon">
                <UploadOutlined />
              </p>
              <p className="ant-upload-text">{t('Click or drag a light extension export file to this area')}</p>
            </Upload.Dragger>
            {importError ? (
              <Alert message={importError} showIcon style={{ marginTop: token.marginSM }} type="error" />
            ) : null}
          </Form.Item>
          <Form.Item
            label={t('Name')}
            name="name"
            rules={[
              { required: true, message: t('Name is required') },
              { pattern: /^[a-z0-9][a-z0-9-]*$/, message: t('Name must be a lowercase slug') },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item label={t('Title')} name="title">
            <Input />
          </Form.Item>
          <Form.Item label={t('Description')} name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        destroyOnClose
        onClose={closeDetailDrawer}
        open={detailDrawerOpen}
        styles={{
          body: activePanel === 'source' ? { overflow: 'hidden', padding: 16 } : { overflow: 'auto', padding: 24 },
        }}
        footer={
          activePanel === 'source' ? (
            <Flex justify="flex-end">
              <Space>
                <Button onClick={closeDetailDrawer}>{t('Cancel')}</Button>
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
        width={activePanel === 'source' ? SOURCE_DRAWER_WIDTH : 560}
      >
        {detailDrawerOpen ? renderDrawerContent() : null}
      </Drawer>
    </Card>
  );
}

function useLightExtensionRepoFilterCollection(): Collection | undefined {
  const engine = useFlowEngine();

  return useMemo(() => {
    return engine.context.dataSourceManager
      ?.getDataSource?.('main')
      ?.getCollection?.(LIGHT_EXTENSION_REPO_FILTER_COLLECTION);
  }, [engine]);
}

function parseDetailPanel(value: string | null): DetailPanel | null {
  return value === 'source' || value === 'overview' ? value : null;
}

function detailPanelTitle(t: (key: string) => string, panel: DetailPanel): string {
  const titles: Record<DetailPanel, string> = {
    source: t('Source'),
    overview: t('Details'),
  };
  return titles[panel];
}

function upsertRepo(repos: LightExtensionRepoRecord[], repo: LightExtensionRepoRecord): LightExtensionRepoRecord[] {
  if (repos.some((item) => item.id === repo.id)) {
    return repos.map((item) => (item.id === repo.id ? repo : item));
  }

  return [repo, ...repos];
}

function shortCommit(value?: string | null): string {
  if (!value) {
    return '-';
  }

  return value.length > 12 ? value.slice(0, 12) : value;
}

function formatDate(value?: string | null): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function buildEntryStats(entries: LightExtensionEntryRecord[]): Record<string, number> {
  return entries.reduce<Record<string, number>>((result, entry) => {
    result[entry.kind] = (result[entry.kind] || 0) + 1;
    return result;
  }, {});
}

function buildTreeData(files: LightExtensionPulledFile[]): DataNode[] {
  const root: DataNode[] = [];
  const folderByKey = new Map<string, DataNode>();

  files
    .map((file) => file.path)
    .sort((left, right) => left.localeCompare(right))
    .forEach((path) => {
      const segments = path.split('/').filter(Boolean);
      let children = root;
      let currentKey = '';

      segments.forEach((segment, index) => {
        currentKey = currentKey ? `${currentKey}/${segment}` : segment;
        const isLeaf = index === segments.length - 1;

        if (isLeaf) {
          children.push({
            key: currentKey,
            title: segment,
            isLeaf: true,
          });
          return;
        }

        let folder = folderByKey.get(currentKey);
        if (!folder) {
          folder = {
            key: currentKey,
            title: segment,
            children: [],
          };
          folderByKey.set(currentKey, folder);
          children.push(folder);
        }
        children = folder.children ||= [];
      });
    });

  return root;
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

function matchesLightExtensionRepoFilter(repo: LightExtensionRepoRecord, filter: CompiledFilter): boolean {
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
    results.push(matchFilterField([normalizeSearchText(repo.name)], filter.name));
  }
  if (Object.prototype.hasOwnProperty.call(filter, 'title')) {
    results.push(matchFilterField([normalizeSearchText(repo.title)], filter.title));
  }
  if (Object.prototype.hasOwnProperty.call(filter, 'description')) {
    results.push(matchFilterField([normalizeSearchText(repo.description)], filter.description));
  }
  if (Object.prototype.hasOwnProperty.call(filter, 'lifecycleStatus')) {
    results.push(matchFilterField([normalizeSearchText(repo.lifecycleStatus)], filter.lifecycleStatus));
  }

  return results.length ? results.every(Boolean) : true;
}

function readFileAsText(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error || new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

function normalizeImportedLightExtensionPackage(
  value: unknown,
  t: (key: string, options?: Record<string, unknown>) => string,
): ImportedLightExtensionPackage {
  if (!isRecord(value)) {
    throw new Error(t('Invalid import file'));
  }

  const repo = isRecord(value.repo) ? value.repo : {};
  const files = Array.isArray(value.files) ? value.files : [];
  const normalizedFiles = files
    .map((file): LightExtensionPulledFile | null => {
      if (!isRecord(file) || typeof file.path !== 'string' || typeof file.content !== 'string') {
        return null;
      }

      return {
        path: file.path,
        content: file.content,
        size: typeof file.size === 'number' ? file.size : file.content.length,
        language: typeof file.language === 'string' ? file.language : '',
        mode: typeof file.mode === 'string' ? file.mode : '',
        blobHash: typeof file.blobHash === 'string' ? file.blobHash : '',
        pathHash: typeof file.pathHash === 'string' ? file.pathHash : '',
        pathLowerHash: typeof file.pathLowerHash === 'string' ? file.pathLowerHash : '',
      };
    })
    .filter((file): file is LightExtensionPulledFile => Boolean(file));

  if (!normalizedFiles.length) {
    throw new Error(t('Import file does not contain files'));
  }

  return {
    repo: {
      name: typeof repo.name === 'string' ? repo.name : undefined,
      title: typeof repo.title === 'string' ? repo.title : undefined,
      description: typeof repo.description === 'string' ? repo.description : undefined,
    },
    files: normalizedFiles,
  };
}

function toImportRepoName(value: string): string {
  const normalized = value
    .replace(/\.light-extension$/i, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();

  return `${normalized || 'light-extension'}-import`;
}

type PublishCurrentHeadInput = {
  repoId: string;
  commitId: string;
  scanEntries: (repoId: string) => Promise<LightExtensionScanResult>;
  publish: (input: {
    repoId: string;
    entryIds: string[];
    commitId: string;
    clientRequestId: string;
    activate: boolean;
    expectedCurrentPublicationIdByEntry: Record<string, string | null>;
  }) => Promise<LightExtensionPublishResult>;
};

async function publishCurrentHead(input: PublishCurrentHeadInput): Promise<{ published: boolean }> {
  const scanResult = await input.scanEntries(input.repoId);
  const publishableEntries = getReadyJsBlockEntries(scanResult);

  if (!publishableEntries.length) {
    return {
      published: false,
    };
  }

  const publishResult = await input.publish({
    repoId: input.repoId,
    entryIds: publishableEntries.map((entry) => entry.id),
    commitId: input.commitId,
    clientRequestId: buildClientRequestId('light_extension_import'),
    activate: true,
    expectedCurrentPublicationIdByEntry: Object.fromEntries(
      publishableEntries.map((entry) => [entry.id, entry.activePublicationId]),
    ),
  });

  return {
    published: publishResult.status !== 'failed',
  };
}

function getReadyJsBlockEntries(scanResult: LightExtensionScanResult): LightExtensionEntryRecord[] {
  return scanResult.entries
    .map((item) => item.entry)
    .filter((entry) => entry.kind === 'js-block' && entry.healthStatus === 'ready');
}

function buildClientRequestId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function downloadJsonFile(fileName: string, value: unknown) {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  try {
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(url);
  }
}

export default LightExtensionListPage;
