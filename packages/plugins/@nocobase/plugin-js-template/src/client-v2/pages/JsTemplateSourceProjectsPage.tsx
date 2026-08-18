/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { useFlowContext } from '@nocobase/flow-engine';
import { uid } from '@nocobase/utils/client';
import { Alert, App, Button, Card, Form, Space, theme, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { NAMESPACE } from '../../constants';
import type { JsTemplateCreateJobSummary, JsTemplateProject, JsTemplateSyncSourceSummary } from '../../shared/types';
import type { JsTemplateCreateSource } from '../components/JsTemplateCreateSourceSelector';
import JsTemplateGitSourceFields, {
  createEmptyJsTemplateGitSourceDraft,
  type JsTemplateGitSourceValue,
  type JsTemplateGitSourceDraft,
} from '../components/JsTemplateGitSourceFields';
import { useJsTemplateProject } from '../hooks/useJsTemplateProject';
import { useJsTemplateCreateJobs } from '../hooks/useJsTemplateCreateJobs';
import {
  getJsTemplateSyncErrorTranslationKey,
  JsTemplateSyncHookError,
  useJsTemplateSync,
} from '../hooks/useJsTemplateSync';
import { useT } from '../locale';
import type { ApiClientLike } from '../api/jsTemplatesRequests';
import { invalidateJsTemplateRuntimeCache } from '../resolvers/JsTemplateRuntimeCacheRegistry';
import { invalidateJsTemplateSettingsDescriptorCache } from '../resolvers/JsTemplateSettingsDescriptorCache';
import { JsTemplateSourceProjectTable } from './source-project-list/JsTemplateSourceProjectTable';
import { JsTemplateSourceProjectToolbar } from './source-project-list/JsTemplateSourceProjectToolbar';
import { JsTemplateProjectOverlays } from './source-project-list/JsTemplateProjectOverlays';
import { JsTemplateSourceDrawer } from './source-project-list/JsTemplateSourceDrawer';
import { JsTemplateSyncDrawerShell } from './source-project-list/JsTemplateSyncDrawerShell';
import {
  collectCreateJobTransitions,
  matchesJsTemplateProjectSearch,
  retainVisibleProjectSelection,
} from './source-project-list/logic';
import type {
  CreateProjectFormValues,
  EditProjectFormValues,
  JsTemplateProjectLifecycleFilter,
  ToggleLifecycleStatus,
} from './source-project-list/types';
import type { JsTemplateSourceProjectWorkspaceFooterActions } from './JsTemplateSourceProjectWorkspacePage';

type Notice = {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

type LoadProjectsResult =
  | { status: 'applied'; projects: JsTemplateProject[] }
  | { status: 'failed'; message: string }
  | { status: 'stale' };

type LoadProjectsOptions = {
  reportFailure?: boolean;
};

type ProjectsUpdater = (projects: JsTemplateProject[]) => JsTemplateProject[];

type DetailPanel = 'source' | 'sync';
type SyncConfigurationRequest = 'test' | 'configure';
type FlowContextWithApi = {
  api: ApiClientLike;
};

function JsTemplateSourceProjectsPage() {
  return <JsTemplateSourceProjectsPageInner />;
}

function JsTemplateSourceProjectsPageInner() {
  const { t } = useTranslation(NAMESPACE);
  const { notification } = App.useApp();
  const flowContext = useFlowContext() as FlowContextWithApi;
  const { token } = theme.useToken();
  const {
    changeLifecycle: changeLifecycleRequest,
    createProject: createProjectRequest,
    deleteProject: deleteProjectRequest,
    listProjects,
    updateProject: updateProjectRequest,
  } = useJsTemplateProject();
  const { createFromGit: createFromGitRequest } = useJsTemplateSync();
  const {
    jobs: createJobs,
    loading: createJobsLoading,
    error: createJobsError,
    addAcceptedJob,
    dismiss: dismissCreateJob,
  } = useJsTemplateCreateJobs();
  const [searchParams, setSearchParams] = useSearchParams();
  const [form] = Form.useForm<CreateProjectFormValues>();
  const [editForm] = Form.useForm<EditProjectFormValues>();
  const createAttemptRef = useRef<{ fingerprint: string; idempotencyKey: string } | null>(null);
  const [projects, setProjects] = useState<JsTemplateProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(searchParams.get('projectId'));
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editTarget, setEditTarget] = useState<JsTemplateProject | null>(null);
  const [editing, setEditing] = useState(false);
  const [batchChanging, setBatchChanging] = useState<ToggleLifecycleStatus | null>(null);
  const [changingProjectIds, setChangingProjectIds] = useState<Set<string>>(() => new Set());
  const [removingProjectIds, setRemovingProjectIds] = useState<Set<string>>(() => new Set());
  const [removeTarget, setRemoveTarget] = useState<JsTemplateProject | null>(null);
  const [createSource, setCreateSource] = useState<JsTemplateCreateSource | undefined>({ mode: 'starter' });
  const [createSourceKey, setCreateSourceKey] = useState(0);
  const [syncDrawerVersion, setSyncDrawerVersion] = useState(0);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [keyword, setKeyword] = useState('');
  const [lifecycleFilter, setLifecycleFilter] = useState<JsTemplateProjectLifecycleFilter>('all');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [sourceFooterActions, setSourceFooterActions] = useState<JsTemplateSourceProjectWorkspaceFooterActions | null>(
    null,
  );
  const loadProjectsRequestSequenceRef = useRef(0);
  const projectsStateRevisionRef = useRef(0);
  const lifecyclePendingProjectIdsRef = useRef<Set<string>>(new Set());
  const previousCreateJobStatusesRef = useRef<Map<string, JsTemplateCreateJobSummary['status']> | null>(null);
  const createJobTransitionBatchRef = useRef(0);
  const notifiedFailedCreateJobIdsRef = useRef<Set<string>>(new Set());
  const dismissingFailedCreateJobIdsRef = useRef<Set<string>>(new Set());
  const notifiedSucceededCreateJobIdsRef = useRef<Set<string>>(new Set());

  const urlPanel = parseDetailPanel(searchParams.get('panel'));
  const [activePanel, setActivePanel] = useState<DetailPanel | null>(urlPanel);

  const updateProjects = useCallback((updater: ProjectsUpdater) => {
    projectsStateRevisionRef.current += 1;
    setProjects(updater);
  }, []);

  const beginLifecycleChanges = useCallback((projectIds: string[]): boolean => {
    if (projectIds.some((projectId) => lifecyclePendingProjectIdsRef.current.has(projectId))) {
      return false;
    }

    const next = new Set(lifecyclePendingProjectIdsRef.current);
    projectIds.forEach((projectId) => next.add(projectId));
    lifecyclePendingProjectIdsRef.current = next;
    setChangingProjectIds(next);
    return true;
  }, []);

  const finishLifecycleChanges = useCallback((projectIds: string[]) => {
    const next = new Set(lifecyclePendingProjectIdsRef.current);
    projectIds.forEach((projectId) => next.delete(projectId));
    lifecyclePendingProjectIdsRef.current = next;
    setChangingProjectIds(next);
  }, []);

  const resetCreateForm = useCallback(() => {
    form.resetFields();
    form.setFieldsValue({ name: createJsTemplateProjectName() });
    setCreateSource({ mode: 'starter' });
    setCreateSourceKey((current) => current + 1);
  }, [form]);

  const loadProjects = useCallback(
    async (options: LoadProjectsOptions = {}): Promise<LoadProjectsResult> => {
      const requestSequence = loadProjectsRequestSequenceRef.current + 1;
      const stateRevision = projectsStateRevisionRef.current;
      loadProjectsRequestSequenceRef.current = requestSequence;
      setLoading(true);
      setNotice(null);
      try {
        const nextProjects = await listProjects();
        if (
          loadProjectsRequestSequenceRef.current !== requestSequence ||
          projectsStateRevisionRef.current !== stateRevision
        ) {
          return { status: 'stale' };
        }
        setProjects(nextProjects);
        return { status: 'applied', projects: nextProjects };
      } catch (error) {
        if (
          loadProjectsRequestSequenceRef.current !== requestSequence ||
          projectsStateRevisionRef.current !== stateRevision
        ) {
          return { status: 'stale' };
        }
        const message = error instanceof Error ? error.message : t('Failed to load Source Projects');
        if (options.reportFailure !== false) {
          setNotice({ type: 'error', message });
        }
        return { status: 'failed', message };
      } finally {
        if (loadProjectsRequestSequenceRef.current === requestSequence) {
          setLoading(false);
        }
      }
    },
    [listProjects, t],
  );

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateJobTransitions = useCallback(
    async (jobs: JsTemplateCreateJobSummary[], batch: number) => {
      try {
        const succeededJobs = jobs.filter((job) => job.status === 'succeeded');
        let cacheInvalidationFailed = false;
        for (const job of succeededJobs) {
          if (job.resultProjectId) {
            try {
              invalidateJsTemplateSettingsDescriptorCache(flowContext.api, job.resultProjectId);
            } catch {
              cacheInvalidationFailed = true;
            }
            try {
              invalidateJsTemplateRuntimeCache(flowContext.api, job.resultProjectId);
            } catch {
              cacheInvalidationFailed = true;
            }
          }
        }

        let reloadResult: LoadProjectsResult | null = null;
        if (succeededJobs.length) {
          reloadResult = await loadProjects({ reportFailure: false });
          if (createJobTransitionBatchRef.current !== batch || reloadResult.status === 'stale') {
            return;
          }
        }
        if (createJobTransitionBatchRef.current !== batch) {
          return;
        }

        if (reloadResult?.status === 'failed') {
          notification.error({ message: reloadResult.message, placement: 'topRight', role: 'alert' });
          return;
        }

        if (cacheInvalidationFailed) {
          notification.warning({
            message: t('Some JS Template caches could not be refreshed'),
            placement: 'topRight',
            role: 'alert',
          });
          return;
        }

        if (reloadResult?.status !== 'applied') {
          return;
        }
        const reloadedProjects = reloadResult.projects;
        const succeededJob = succeededJobs.find((job) => {
          const projectId = job.resultProjectId || job.targetProjectId;
          return reloadedProjects.some((project) => project.id === projectId);
        });
        if (!succeededJob || notifiedSucceededCreateJobIdsRef.current.has(succeededJob.id)) {
          return;
        }
        notifiedSucceededCreateJobIdsRef.current.add(succeededJob.id);
        notification.success({
          message: t('Source Project creation succeeded: {{name}}').replace(
            '{{name}}',
            succeededJob.title || succeededJob.name,
          ),
          placement: 'topRight',
          role: 'status',
        });
      } catch {
        if (createJobTransitionBatchRef.current === batch) {
          notification.error({
            message: t('Failed to process creation task update'),
            placement: 'topRight',
            role: 'alert',
          });
        }
      }
    },
    [flowContext.api, loadProjects, notification, t],
  );

  const handleFailedCreateJobs = useCallback(
    async (failedJobs: JsTemplateCreateJobSummary[]) => {
      for (const job of failedJobs) {
        if (!notifiedFailedCreateJobIdsRef.current.has(job.id)) {
          notifiedFailedCreateJobIdsRef.current.add(job.id);
          const errorKey = getJsTemplateSyncErrorTranslationKey(job.errorCode, job.errorReasonCode);
          notification.error({
            message: `${t('Source Project creation failed: {{name}}').replace('{{name}}', job.title || job.name)}: ${
              errorKey ? t(errorKey) : job.errorMessage || t('Source Project creation failed')
            }`,
            placement: 'topRight',
            role: 'alert',
          });
        }

        if (dismissingFailedCreateJobIdsRef.current.has(job.id)) {
          continue;
        }
        dismissingFailedCreateJobIdsRef.current.add(job.id);
        try {
          await dismissCreateJob(job.id);
        } catch {
          // Polling retains the failed job and retries its soft dismissal without repeating the user notification.
        } finally {
          dismissingFailedCreateJobIdsRef.current.delete(job.id);
        }
      }
    },
    [dismissCreateJob, notification, t],
  );

  useEffect(() => {
    if (!createJobsLoading) {
      handleFailedCreateJobs(createJobs.filter((job) => job.status === 'failed'));
    }
  }, [createJobs, createJobsLoading, handleFailedCreateJobs]);

  useEffect(() => {
    if (createJobsLoading) {
      return;
    }

    const { transitionedJobs, nextStatuses } = collectCreateJobTransitions(
      previousCreateJobStatusesRef.current,
      createJobs,
    );
    previousCreateJobStatusesRef.current = nextStatuses;

    const succeededJobs = transitionedJobs.filter((job) => job.status === 'succeeded');
    if (!succeededJobs.length) {
      return;
    }

    createJobTransitionBatchRef.current += 1;
    handleCreateJobTransitions(succeededJobs, createJobTransitionBatchRef.current);
  }, [createJobs, createJobsLoading, handleCreateJobTransitions]);

  useEffect(() => {
    const projectId = searchParams.get('projectId');
    if (projectId !== selectedProjectId) {
      setSelectedProjectId(projectId);
    }
  }, [searchParams, selectedProjectId]);

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

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) || null,
    [projects, selectedProjectId],
  );
  const detailDrawerOpen = activePanel === 'source' && Boolean(selectedProject);
  const syncDrawerOpen = activePanel === 'sync' && Boolean(selectedProject);
  const filteredProjects = useMemo(
    () => projects.filter((project) => matchesJsTemplateProjectSearch(project, keyword, lifecycleFilter)),
    [keyword, lifecycleFilter, projects],
  );
  const selectedProjects = useMemo(
    () => filteredProjects.filter((project) => selectedRowKeys.includes(project.id)),
    [filteredProjects, selectedRowKeys],
  );

  useEffect(() => {
    const filteredProjectIds = filteredProjects.map((project) => project.id);
    setSelectedRowKeys((current) => {
      const visible = retainVisibleProjectSelection(current, filteredProjectIds);
      return visible.length === current.length ? current : visible;
    });
  }, [filteredProjects]);

  const handleKeywordChange = useCallback((nextKeyword: string) => {
    setKeyword(nextKeyword);
  }, []);

  const handleLifecycleFilterChange = useCallback((nextFilter: JsTemplateProjectLifecycleFilter) => {
    setLifecycleFilter(nextFilter);
  }, []);

  const handleSelectedRowKeysChange = useCallback(
    (nextSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(
        retainVisibleProjectSelection(
          nextSelectedRowKeys,
          filteredProjects.map((project) => project.id),
        ),
      );
    },
    [filteredProjects],
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
    (project: JsTemplateProject) => {
      editForm.resetFields();
      editForm.setFieldsValue({
        title: project.title || project.name,
        description: project.description || undefined,
      });
      setEditTarget(project);
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

  const selectProject = useCallback(
    (projectId: string, options: { panel?: DetailPanel; replace?: boolean } = {}) => {
      setSelectedProjectId(projectId);
      setActivePanel(options.panel || null);
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.set('projectId', projectId);
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

  const createProject = async () => {
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
      const requestFingerprint = JSON.stringify({ metadata, createSource });
      const currentAttempt = createAttemptRef.current;
      const idempotencyKey =
        currentAttempt?.fingerprint === requestFingerprint
          ? currentAttempt.idempotencyKey
          : createJsTemplateCreateJobIdempotencyKey();
      createAttemptRef.current = { fingerprint: requestFingerprint, idempotencyKey };
      const acceptedJob =
        createSource.mode === 'git'
          ? await createFromGitRequest({
              idempotencyKey,
              ...metadata,
              provider: createSource.provider,
              config: createSource.config,
              ...(createSource.authRef ? { authRef: createSource.authRef } : {}),
            })
          : await createProjectRequest({
              idempotencyKey,
              ...metadata,
              ...(createSource.mode === 'zip' ? { zipBase64: createSource.zipBase64 } : {}),
            });
      addAcceptedJob(acceptedJob);
      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('create');
      setSearchParams(nextSearchParams, { replace: true });
      setCreateOpen(false);
      form.resetFields();
      setCreateSource({ mode: 'starter' });
      setCreateSourceKey((current) => current + 1);
      createAttemptRef.current = null;
      setNotice(null);
    } catch (error) {
      const syncErrorKey =
        error instanceof JsTemplateSyncHookError
          ? getJsTemplateSyncErrorTranslationKey(
              error.code,
              typeof error.details?.reasonCode === 'string' ? error.details.reasonCode : undefined,
            ) || 'Failed to create Source Project'
          : undefined;
      setNotice({
        type: 'error',
        message: syncErrorKey
          ? t(syncErrorKey)
          : error instanceof Error
            ? error.message
            : t('Failed to create Source Project'),
      });
    } finally {
      setCreating(false);
    }
  };

  const batchChangeLifecycle = useCallback(
    async (lifecycleStatus: ToggleLifecycleStatus) => {
      const selectedProjectIds = new Set(selectedRowKeys);
      const batchProjects = filteredProjects.filter((project) => selectedProjectIds.has(project.id));
      if (!batchProjects.length) {
        return;
      }

      const batchProjectIds = batchProjects.map((project) => project.id);
      if (!beginLifecycleChanges(batchProjectIds)) {
        return;
      }

      setBatchChanging(lifecycleStatus);
      setNotice(null);
      try {
        const results = await Promise.allSettled(
          batchProjects.map((project) => changeLifecycleRequest({ projectId: project.id, lifecycleStatus })),
        );
        const updatedProjects = results
          .filter((result): result is PromiseFulfilledResult<JsTemplateProject> => result.status === 'fulfilled')
          .map((result) => result.value);

        if (updatedProjects.length) {
          const updatedProjectById = new Map(updatedProjects.map((project) => [project.id, project]));
          updateProjects((current) => current.map((project) => updatedProjectById.get(project.id) || project));
        }

        const failedCount = results.length - updatedProjects.length;
        if (failedCount) {
          setNotice({ type: 'warning', message: t('Some Source Projects failed to update') });
          return;
        }

        setNotice({ type: 'success', message: t('Source Projects updated') });
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to change lifecycle') });
      } finally {
        finishLifecycleChanges(batchProjectIds);
        setBatchChanging(null);
      }
    },
    [
      beginLifecycleChanges,
      changeLifecycleRequest,
      filteredProjects,
      finishLifecycleChanges,
      selectedRowKeys,
      t,
      updateProjects,
    ],
  );

  const changeProjectLifecycle = useCallback(
    async (project: JsTemplateProject, lifecycleStatus: ToggleLifecycleStatus) => {
      if (project.lifecycleStatus === lifecycleStatus) {
        return;
      }

      if (!beginLifecycleChanges([project.id])) {
        return;
      }

      setNotice(null);
      try {
        const updatedProject = await changeLifecycleRequest({ projectId: project.id, lifecycleStatus });
        updateProjects((current) => current.map((item) => (item.id === updatedProject.id ? updatedProject : item)));
        setNotice({ type: 'success', message: t('Source Projects updated') });
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to change lifecycle') });
      } finally {
        finishLifecycleChanges([project.id]);
      }
    },
    [beginLifecycleChanges, changeLifecycleRequest, finishLifecycleChanges, t, updateProjects],
  );

  const removeProject = useCallback(
    async (project: JsTemplateProject): Promise<boolean> => {
      setRemovingProjectIds((current) => new Set(current).add(project.id));
      setNotice(null);
      try {
        await deleteProjectRequest(project.id);

        updateProjects((current) => current.filter((item) => item.id !== project.id));
        setSelectedRowKeys((current) => current.filter((key) => key !== project.id));
        if (selectedProjectId === project.id) {
          setSelectedProjectId(null);
          const nextSearchParams = new URLSearchParams(searchParams);
          nextSearchParams.delete('projectId');
          nextSearchParams.delete('panel');
          setSearchParams(nextSearchParams, { replace: true });
        }
        setNotice({ type: 'success', message: t('Source Project removed') });
        return true;
      } catch (error) {
        setNotice({
          type: 'error',
          message: error instanceof Error ? error.message : t('Failed to remove Source Project'),
        });
        return false;
      } finally {
        setRemovingProjectIds((current) => {
          const next = new Set(current);
          next.delete(project.id);
          return next;
        });
      }
    },
    [deleteProjectRequest, searchParams, selectedProjectId, setSearchParams, t, updateProjects],
  );

  const confirmRemoveProject = useCallback(async () => {
    if (!removeTarget) {
      return;
    }

    const removed = await removeProject(removeTarget);
    if (removed) {
      setRemoveTarget(null);
    }
  }, [removeProject, removeTarget]);

  const updateProject = useCallback(
    async (values: EditProjectFormValues) => {
      if (!editTarget) {
        return;
      }

      setEditing(true);
      setNotice(null);
      try {
        const updatedProject = await updateProjectRequest({
          projectId: editTarget.id,
          title: values.title.trim(),
          description: values.description?.trim() || null,
        });
        updateProjects((current) =>
          current.map((project) => (project.id === updatedProject.id ? { ...project, ...updatedProject } : project)),
        );
        setEditTarget(null);
        editForm.resetFields();
        setNotice({ type: 'success', message: t('Source Project updated') });
      } catch (error) {
        setNotice({
          type: 'error',
          message: error instanceof Error ? error.message : t('Failed to update Source Project'),
        });
      } finally {
        setEditing(false);
      }
    },
    [editForm, editTarget, t, updateProjectRequest, updateProjects],
  );

  const handleSyncProjectUpdated = useCallback(
    (updatedProject: JsTemplateProject) => {
      updateProjects((current) =>
        current.map((project) => (project.id === updatedProject.id ? updatedProject : project)),
      );
    },
    [updateProjects],
  );

  const handleSyncConfigured = useCallback(
    (_source: JsTemplateSyncSourceSummary) => {
      setSyncDrawerVersion((current) => current + 1);
      setNotice({ type: 'success', message: t('Sync source configured') });
    },
    [t],
  );

  const handleSyncSourceChanged = useCallback(
    (source: JsTemplateSyncSourceSummary | null) => {
      if (!source) {
        setNotice({ type: 'success', message: t('Sync source disconnected') });
      }
    },
    [t],
  );

  const handleWorkspaceSaved = useCallback(async () => {
    await loadProjects();
  }, [loadProjects]);

  return (
    <Card variant="borderless">
      <Space direction="vertical" size={0} style={{ marginBottom: token.margin }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t('Source Projects')}
        </Typography.Title>
        <Typography.Text type="secondary">
          {t('A Source Project can contain multiple reusable JS Templates.')}
        </Typography.Text>
      </Space>

      {createJobsError ? (
        <Alert
          message={t('Failed to load creation jobs')}
          showIcon
          style={{ marginBottom: token.margin }}
          type="error"
        />
      ) : null}
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

      <JsTemplateSourceProjectToolbar
        batchChanging={Boolean(batchChanging) || selectedProjects.some((project) => changingProjectIds.has(project.id))}
        gap={token.marginSM}
        keyword={keyword}
        lifecycleFilter={lifecycleFilter}
        loading={loading}
        marginBottom={token.margin}
        onAdd={openCreateModal}
        onBatchChangeLifecycle={batchChangeLifecycle}
        onKeywordChange={handleKeywordChange}
        onLifecycleFilterChange={handleLifecycleFilterChange}
        onRefresh={loadProjects}
        selectedCount={selectedProjects.length}
        t={t}
      />

      <JsTemplateSourceProjectTable
        changingProjectIds={changingProjectIds}
        creationJobs={createJobs}
        loading={loading || createJobsLoading}
        onChangeLifecycle={changeProjectLifecycle}
        onEditProject={openEditDrawer}
        onRemoveProject={setRemoveTarget}
        onSelectProject={(projectId, panel) => selectProject(projectId, { panel })}
        onSelectedRowKeysChange={handleSelectedRowKeysChange}
        projects={filteredProjects}
        removingProjectIds={removingProjectIds}
        selectedRowKeys={selectedRowKeys}
        t={t}
      />

      <JsTemplateProjectOverlays
        createForm={form}
        createOpen={createOpen}
        createSource={createSource}
        createSourceKey={createSourceKey}
        creating={creating}
        editForm={editForm}
        editing={editing}
        editTarget={editTarget}
        marginSM={token.marginSM}
        onCancelCreate={closeCreateModal}
        onCancelEdit={closeEditDrawer}
        onCancelRemove={() => setRemoveTarget(null)}
        onConfirmCreate={createProject}
        onConfirmRemove={confirmRemoveProject}
        onCreateSourceChange={setCreateSource}
        onUpdateProject={updateProject}
        removeTarget={removeTarget}
        removing={Boolean(removeTarget && removingProjectIds.has(removeTarget.id))}
        t={t}
      />

      <JsTemplateSourceDrawer
        footerActions={sourceFooterActions}
        onClose={closeDetailDrawer}
        onFooterActionsChange={setSourceFooterActions}
        onSaved={handleWorkspaceSaved}
        open={detailDrawerOpen}
        project={selectedProject}
        t={t}
      />

      <JsTemplateSyncDrawerShell
        configurationPanel={
          selectedProject ? (
            <JsTemplateSyncConfigurationPanel onConfigured={handleSyncConfigured} projectId={selectedProject.id} />
          ) : null
        }
        onClose={closeDetailDrawer}
        onProjectUpdated={handleSyncProjectUpdated}
        onSyncSourceChanged={handleSyncSourceChanged}
        open={syncDrawerOpen}
        project={selectedProject}
        version={syncDrawerVersion}
      />
    </Card>
  );
}

interface JsTemplateSyncConfigurationPanelProps {
  projectId: string;
  onConfigured: (source: JsTemplateSyncSourceSummary) => void;
}

function JsTemplateSyncConfigurationPanel({ projectId, onConfigured }: JsTemplateSyncConfigurationPanelProps) {
  const t = useT();
  const sync = useJsTemplateSync();
  const [draft, setDraft] = useState<JsTemplateGitSourceDraft>(createEmptyJsTemplateGitSourceDraft);
  const [source, setSource] = useState<JsTemplateGitSourceValue>();
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
      await sync.testConnection({ projectId, ...source });
      setFeedback({ type: 'success', message: t('Connection successful') });
    } catch (error) {
      const errorKey =
        error instanceof JsTemplateSyncHookError
          ? getJsTemplateSyncErrorTranslationKey(
              error.code,
              typeof error.details?.reasonCode === 'string' ? error.details.reasonCode : undefined,
            )
          : undefined;
      setFeedback({ type: 'error', message: t(errorKey || 'Unable to test connection') });
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
      const result = await sync.configure({ projectId, ...source });
      onConfigured(result.source);
    } catch (error) {
      const errorKey =
        error instanceof JsTemplateSyncHookError
          ? getJsTemplateSyncErrorTranslationKey(
              error.code,
              typeof error.details?.reasonCode === 'string' ? error.details.reasonCode : undefined,
            )
          : undefined;
      setFeedback({ type: 'error', message: t(errorKey || 'Unable to configure sync source') });
    } finally {
      setRequest(undefined);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ display: 'flex' }}>
      {feedback ? <Alert message={feedback.message} role="alert" showIcon type={feedback.type} /> : null}
      <Form layout="vertical">
        <JsTemplateGitSourceFields
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

function parseDetailPanel(value: string | null): DetailPanel | null {
  return value === 'source' || value === 'sync' ? value : null;
}

function getServerErrorCode(error: unknown): string | null {
  const errorRecord = toRecord(error);
  const response = toRecord(errorRecord?.response);
  const responseData = toRecord(response?.data);
  const payload = responseData || errorRecord;
  const errors = payload?.errors;
  if (Array.isArray(errors)) {
    for (const item of errors) {
      const code = toRecord(item)?.code;
      if (typeof code === 'string' && code) {
        return code;
      }
    }
  }

  const nestedCode = toRecord(payload?.error)?.code;
  if (typeof nestedCode === 'string' && nestedCode) {
    return nestedCode;
  }
  return typeof payload?.code === 'string' && payload.code ? payload.code : null;
}

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function createJsTemplateProjectName(): string {
  return `jt_${uid()}`;
}

export function createJsTemplateCreateJobIdempotencyKey(): string {
  const randomUuid = globalThis.crypto?.randomUUID;
  if (typeof randomUuid === 'function') {
    return `create-source-project-${randomUuid.call(globalThis.crypto)}`;
  }
  return `create-source-project-${uid()}`;
}

export default JsTemplateSourceProjectsPage;
