/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { ExtendCollectionsProvider, type CompiledFilter } from '@nocobase/client-v2';
import { useFlowContext, useFlowEngine, type Collection, type CollectionOptions } from '@nocobase/flow-engine';
import { getDayRangeByParams } from '@nocobase/utils/client';
import { uid } from '@nocobase/utils/client';
import { Alert, Button, Card, Form, Space, theme } from 'antd';
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
import { JsTemplateCreationStatus } from './source-project-list/JsTemplateCreationStatus';
import { JsTemplateListTable } from './source-project-list/JsTemplateListTable';
import { JsTemplateListToolbar } from './source-project-list/JsTemplateListToolbar';
import { JsTemplateProjectOverlays } from './source-project-list/JsTemplateProjectOverlays';
import { JsTemplateSourceDrawer } from './source-project-list/JsTemplateSourceDrawer';
import { JsTemplateSyncDrawerShell } from './source-project-list/JsTemplateSyncDrawerShell';
import type {
  CreateProjectFormValues,
  EditProjectFormValues,
  ToggleLifecycleStatus,
} from './source-project-list/types';
import type { JsTemplateSourceProjectWorkspaceFooterActions } from './JsTemplateSourceProjectWorkspacePage';

type Notice = {
  type: 'success' | 'info' | 'warning' | 'error';
  message: string;
};

type DetailPanel = 'source' | 'sync';
type SyncConfigurationRequest = 'test' | 'configure';
type FlowContextWithApi = {
  api: ApiClientLike;
};

const JS_TEMPLATE_PROJECT_FILTER_COLLECTION = 'jsTemplateProjectFilters';
export const JS_TEMPLATE_PROJECT_FILTER_FIELD_NAMES = [
  'name',
  'description',
  'updatedAt',
  'createdAt',
  'enabled',
] as const;
export const jsTemplateProjectFilterCollection: CollectionOptions = {
  name: JS_TEMPLATE_PROJECT_FILTER_COLLECTION,
  hidden: true,
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
const jsTemplateProjectFilterCollections = [jsTemplateProjectFilterCollection];

function JsTemplateSourceProjectsPage() {
  return (
    <ExtendCollectionsProvider collections={jsTemplateProjectFilterCollections}>
      <JsTemplateSourceProjectsPageInner />
    </ExtendCollectionsProvider>
  );
}

function JsTemplateSourceProjectsPageInner() {
  const { t } = useTranslation(NAMESPACE);
  const flowContext = useFlowContext() as FlowContextWithApi;
  const compileT = useT();
  const { token } = theme.useToken();
  const filterCollection = useJsTemplateProjectFilterCollection();
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
  const [filterPayload, setFilterPayload] = useState<CompiledFilter>();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [sourceFooterActions, setSourceFooterActions] = useState<JsTemplateSourceProjectWorkspaceFooterActions | null>(
    null,
  );
  const previousCreateJobStatusesRef = useRef<Map<string, JsTemplateCreateJobSummary['status']> | null>(null);
  const createJobTransitionBatchRef = useRef(0);
  const [dismissingCreateJobIds, setDismissingCreateJobIds] = useState<Set<string>>(() => new Set());

  const urlPanel = parseDetailPanel(searchParams.get('panel'));
  const [activePanel, setActivePanel] = useState<DetailPanel | null>(urlPanel);
  const detailDrawerOpen = activePanel === 'source' && Boolean(selectedProjectId);
  const syncDrawerOpen = activePanel === 'sync' && Boolean(selectedProjectId);

  const resetCreateForm = useCallback(() => {
    form.resetFields();
    form.setFieldsValue({ name: createJsTemplateProjectName() });
    setCreateSource({ mode: 'starter' });
    setCreateSourceKey((current) => current + 1);
  }, [form]);

  const loadProjects = useCallback(async () => {
    setLoading(true);
    setNotice(null);
    try {
      const nextProjects = await listProjects();
      setProjects(nextProjects);
      return true;
    } catch (error) {
      setNotice({
        type: 'error',
        message: error instanceof Error ? error.message : t('Failed to load Source Projects'),
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [listProjects, t]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleCreateJobTransitions = useCallback(
    async (jobs: JsTemplateCreateJobSummary[], batch: number) => {
      const succeededJobs = jobs.filter((job) => job.status === 'succeeded');
      for (const job of succeededJobs) {
        if (job.resultProjectId) {
          invalidateJsTemplateSettingsDescriptorCache(flowContext.api, job.resultProjectId);
          invalidateJsTemplateRuntimeCache(flowContext.api, job.resultProjectId);
        }
      }

      if (succeededJobs.length) {
        await loadProjects();
      }
      if (createJobTransitionBatchRef.current !== batch) {
        return;
      }

      const latestJob = jobs[0];
      if (latestJob.status === 'succeeded') {
        setNotice({
          type: 'success',
          message: t('Source Project creation succeeded: {{name}}').replace(
            '{{name}}',
            latestJob.title || latestJob.name,
          ),
        });
        return;
      }

      const errorKey = getJsTemplateSyncErrorTranslationKey(latestJob.errorCode, latestJob.errorReasonCode);
      setNotice({
        type: 'error',
        message: `${t('Source Project creation failed: {{name}}').replace(
          '{{name}}',
          latestJob.title || latestJob.name,
        )}: ${errorKey ? t(errorKey) : latestJob.errorMessage || t('Source Project creation failed')}`,
      });
    },
    [flowContext.api, loadProjects, t],
  );

  useEffect(() => {
    if (createJobsLoading) {
      return;
    }

    const previousStatuses = previousCreateJobStatusesRef.current;
    if (!previousStatuses) {
      previousCreateJobStatusesRef.current = new Map(createJobs.map((job) => [job.id, job.status]));
      return;
    }

    const transitionedJobs = createJobs.filter((job) => {
      const previousStatus = previousStatuses.get(job.id);
      return isActiveCreateJobStatus(previousStatus) && isTerminalCreateJobStatus(job.status);
    });
    for (const job of createJobs) {
      previousStatuses.set(job.id, job.status);
    }

    if (!transitionedJobs.length) {
      return;
    }

    createJobTransitionBatchRef.current += 1;
    handleCreateJobTransitions(transitionedJobs, createJobTransitionBatchRef.current).catch(() => undefined);
  }, [createJobs, createJobsLoading, handleCreateJobTransitions]);

  const dismissTerminalCreateJob = useCallback(
    async (jobId: string) => {
      setDismissingCreateJobIds((current) => new Set(current).add(jobId));
      try {
        await dismissCreateJob(jobId);
      } catch {
        setNotice({ type: 'error', message: t('Failed to remove creation task') });
      } finally {
        setDismissingCreateJobIds((current) => {
          const next = new Set(current);
          next.delete(jobId);
          return next;
        });
      }
    },
    [dismissCreateJob, t],
  );

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
  const visibleProjects = useMemo(
    () => projects.filter((project) => project.lifecycleStatus !== 'archived'),
    [projects],
  );
  const filteredProjects = useMemo(
    () => visibleProjects.filter((project) => matchesJsTemplateProjectFilter(project, filterPayload)),
    [filterPayload, visibleProjects],
  );
  const selectedProjects = useMemo(
    () => filteredProjects.filter((project) => selectedRowKeys.includes(project.id)),
    [filteredProjects, selectedRowKeys],
  );

  const handleFilterChange = useCallback((nextFilterPayload: CompiledFilter) => {
    setFilterPayload(nextFilterPayload);
    setSelectedRowKeys([]);
  }, []);

  const handleSelectedRowKeysChange = useCallback(
    (nextSelectedRowKeys: React.Key[]) => {
      const filteredProjectIds = new Set<React.Key>(filteredProjects.map((project) => project.id));
      setSelectedRowKeys(nextSelectedRowKeys.filter((key) => filteredProjectIds.has(key)));
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
      const acceptedJob =
        createSource.mode === 'git'
          ? await createFromGitRequest({
              ...metadata,
              provider: createSource.provider,
              config: createSource.config,
              ...(createSource.authRef ? { authRef: createSource.authRef } : {}),
            })
          : await createProjectRequest({
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
          setProjects((current) => current.map((project) => updatedProjectById.get(project.id) || project));
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
        setBatchChanging(null);
      }
    },
    [changeLifecycleRequest, filteredProjects, selectedRowKeys, t],
  );

  const changeProjectLifecycle = useCallback(
    async (project: JsTemplateProject, lifecycleStatus: ToggleLifecycleStatus) => {
      if (project.lifecycleStatus === lifecycleStatus) {
        return;
      }

      setChangingProjectIds((current) => new Set(current).add(project.id));
      setNotice(null);
      try {
        const updatedProject = await changeLifecycleRequest({ projectId: project.id, lifecycleStatus });
        setProjects((current) => current.map((item) => (item.id === updatedProject.id ? updatedProject : item)));
        setNotice({ type: 'success', message: t('Source Projects updated') });
      } catch (error) {
        setNotice({ type: 'error', message: error instanceof Error ? error.message : t('Failed to change lifecycle') });
      } finally {
        setChangingProjectIds((current) => {
          const next = new Set(current);
          next.delete(project.id);
          return next;
        });
      }
    },
    [changeLifecycleRequest, t],
  );

  const removeProject = useCallback(
    async (project: JsTemplateProject): Promise<boolean> => {
      setRemovingProjectIds((current) => new Set(current).add(project.id));
      setNotice(null);
      try {
        await deleteProjectRequest(project.id);

        setProjects((current) => current.filter((item) => item.id !== project.id));
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
    [deleteProjectRequest, searchParams, selectedProjectId, setSearchParams, t],
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
        setProjects((current) =>
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
    [editForm, editTarget, t, updateProjectRequest],
  );

  const handleSyncProjectUpdated = useCallback(
    (updatedProject: JsTemplateProject) => {
      setProjects((current) => current.map((project) => (project.id === updatedProject.id ? updatedProject : project)));
      loadProjects();
    },
    [loadProjects],
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

      <JsTemplateCreationStatus
        dismissingJobIds={dismissingCreateJobIds}
        jobs={createJobs}
        marginBottom={token.margin}
        onDismiss={dismissTerminalCreateJob}
        t={t}
      />

      <JsTemplateListToolbar
        batchChanging={Boolean(batchChanging)}
        compileT={compileT}
        filterCollection={filterCollection}
        filterFieldNames={JS_TEMPLATE_PROJECT_FILTER_FIELD_NAMES}
        gap={token.marginSM}
        loading={loading}
        marginBottom={token.margin}
        onAdd={openCreateModal}
        onBatchChangeLifecycle={batchChangeLifecycle}
        onFilterChange={handleFilterChange}
        onRefresh={loadProjects}
        selectedCount={selectedProjects.length}
        t={t}
      />

      <JsTemplateListTable
        changingProjectIds={changingProjectIds}
        loading={loading}
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

function useJsTemplateProjectFilterCollection(): Collection | undefined {
  const engine = useFlowEngine();
  const ownsFilterCollectionRef = useRef(false);

  const collection = useMemo(() => {
    const dataSource = engine.context.dataSourceManager?.getDataSource?.('main');
    const existingCollection = dataSource?.getCollection?.(JS_TEMPLATE_PROJECT_FILTER_COLLECTION);

    if (existingCollection) {
      return existingCollection;
    }

    dataSource?.addCollection?.(jsTemplateProjectFilterCollection);
    const registeredCollection = dataSource?.getCollection?.(JS_TEMPLATE_PROJECT_FILTER_COLLECTION);

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
        ?.removeCollection?.(JS_TEMPLATE_PROJECT_FILTER_COLLECTION);
      ownsFilterCollectionRef.current = false;
    };
  }, [engine]);

  return collection;
}

function parseDetailPanel(value: string | null): DetailPanel | null {
  return value === 'source' || value === 'sync' ? value : null;
}

function isActiveCreateJobStatus(status: JsTemplateCreateJobSummary['status'] | undefined): boolean {
  return status === 'pending' || status === 'running';
}

function isTerminalCreateJobStatus(status: JsTemplateCreateJobSummary['status']): boolean {
  return status === 'succeeded' || status === 'failed';
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

export function matchesJsTemplateProjectFilter(project: JsTemplateProject, filter: CompiledFilter): boolean {
  if (!isRecord(filter)) {
    return true;
  }

  const results: boolean[] = [];
  if (Array.isArray(filter.$and)) {
    results.push(filter.$and.every((item) => matchesJsTemplateProjectFilter(project, item as CompiledFilter)));
  }
  if (Array.isArray(filter.$or)) {
    results.push(filter.$or.some((item) => matchesJsTemplateProjectFilter(project, item as CompiledFilter)));
  }
  if (Object.prototype.hasOwnProperty.call(filter, 'name')) {
    results.push(
      matchFilterField([normalizeSearchText(project.name), normalizeSearchText(project.title)], filter.name),
    );
  }
  if (Object.prototype.hasOwnProperty.call(filter, 'description')) {
    results.push(matchFilterField([normalizeSearchText(project.description)], filter.description));
  }
  if (Object.prototype.hasOwnProperty.call(filter, 'updatedAt')) {
    results.push(matchDateFilter(project.updatedAt, filter.updatedAt));
  }
  if (Object.prototype.hasOwnProperty.call(filter, 'createdAt')) {
    results.push(matchDateFilter(project.createdAt, filter.createdAt));
  }
  if (Object.prototype.hasOwnProperty.call(filter, 'enabled')) {
    results.push(matchBooleanFilter(project.lifecycleStatus === 'enabled', filter.enabled));
  }

  return results.length ? results.every(Boolean) : true;
}

export function createJsTemplateProjectName(): string {
  return `jt_${uid()}`;
}

export default JsTemplateSourceProjectsPage;
