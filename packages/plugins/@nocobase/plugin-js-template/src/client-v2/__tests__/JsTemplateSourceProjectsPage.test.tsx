/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { createMockClient } from '@nocobase/client-v2';
import { FlowEngineProvider } from '@nocobase/flow-engine';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { vi } from 'vitest';

import type { UseJsTemplateProjectResult } from '../hooks/useJsTemplateProject';
import type { UseJsTemplateCreateJobsResult } from '../hooks/useJsTemplateCreateJobs';
import type { JsTemplateCreateJobSummary, JsTemplateProject } from '../../shared/types';
import { JsTemplateSyncHookError, type UseJsTemplateSyncResult } from '../hooks/useJsTemplateSync';
import JsTemplateSourceProjectsPage from '../pages/JsTemplateSourceProjectsPage';

const mocks = vi.hoisted(() => ({
  t: (key: string) => key,
  api: {
    listProjects: vi.fn(),
    createProject: vi.fn(),
    updateProject: vi.fn(),
    changeLifecycle: vi.fn(),
    deleteProject: vi.fn(),
    listCommits: vi.fn(),
    pull: vi.fn(),
  },
  sync: {
    get: vi.fn(),
    configure: vi.fn(),
    disconnect: vi.fn(),
    testConnection: vi.fn(),
    plan: vi.fn(),
    pull: vi.fn(),
    push: vi.fn(),
    createFromGit: vi.fn(),
  },
  createJobs: {
    initialJobs: [] as JsTemplateCreateJobSummary[],
    error: null as Error | null,
    addAcceptedJob: vi.fn(),
    refresh: vi.fn(async () => undefined),
    dismiss: vi.fn(),
    update: vi.fn(),
  },
  notification: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn(),
  },
  cache: {
    invalidateRuntime: vi.fn(),
    invalidateSettings: vi.fn(),
  },
  workspace: {
    dirty: true,
  },
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  return {
    ...actual,
    App: {
      ...actual.App,
      useApp: () => ({ message: {}, modal: {}, notification: mocks.notification }),
    },
  };
});

vi.mock('../resolvers/JsTemplateRuntimeCacheRegistry', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../resolvers/JsTemplateRuntimeCacheRegistry')>();
  return {
    ...actual,
    invalidateJsTemplateRuntimeCache: mocks.cache.invalidateRuntime,
  };
});

vi.mock('../resolvers/JsTemplateSettingsDescriptorCache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../resolvers/JsTemplateSettingsDescriptorCache')>();
  return {
    ...actual,
    invalidateJsTemplateSettingsDescriptorCache: mocks.cache.invalidateSettings,
  };
});

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: mocks.t,
    }),
  };
});

vi.mock('../hooks/useJsTemplateProject', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useJsTemplateProject: () => mocks.api as unknown as UseJsTemplateProjectResult,
  };
});

vi.mock('../hooks/useJsTemplateSync', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../hooks/useJsTemplateSync')>();
  return {
    ...actual,
    useJsTemplateSync: () => mocks.sync as unknown as UseJsTemplateSyncResult,
  };
});

vi.mock('../hooks/useJsTemplateCreateJobs', async () => {
  const React = await import('react');
  return {
    useJsTemplateCreateJobs: (): UseJsTemplateCreateJobsResult => {
      const [jobs, setJobs] = React.useState<UseJsTemplateCreateJobsResult['jobs']>(mocks.createJobs.initialJobs);
      React.useEffect(() => {
        mocks.createJobs.update.mockImplementation((nextJobs: JsTemplateCreateJobSummary[]) => setJobs(nextJobs));
      }, []);
      return {
        jobs,
        loading: false,
        error: mocks.createJobs.error,
        addAcceptedJob: (job) => {
          mocks.createJobs.addAcceptedJob(job);
          setJobs((current) => [job, ...current.filter((item) => item.id !== job.id)]);
        },
        refresh: mocks.createJobs.refresh,
        dismiss: async (jobId) => {
          await mocks.createJobs.dismiss(jobId);
          setJobs((current) => current.filter((job) => job.id !== jobId));
        },
      };
    },
  };
});

vi.mock('../components/JsTemplateSyncDrawer', async () => {
  const React = await import('react');

  interface MockSyncDrawerProps {
    open: boolean;
    project: {
      id: string;
      name: string;
      normalizedName: string;
      title: string;
      description: string | null;
      lifecycleStatus: 'enabled' | 'disabled';
      healthStatus: 'pending' | 'ready' | 'warning' | 'error';
      headCommitId: string | null;
      templateKinds?: Record<string, number>;
    };
    configurationPanel?: React.ReactNode;
    onClose: () => void;
    onProjectUpdated: (project: MockSyncDrawerProps['project'] & { templateCount: number }) => void;
  }

  const MockJsTemplateSyncDrawer = (props: MockSyncDrawerProps) => {
    if (!props.open) {
      return null;
    }

    return React.createElement(
      'div',
      { 'aria-label': 'Sync code', role: 'dialog' },
      props.configurationPanel,
      React.createElement(
        'button',
        {
          onClick: () =>
            props.onProjectUpdated({
              ...props.project,
              headCommitId: 'head-after-pull',
              templateCount: 3,
              templateKinds: { 'js-block': 3 },
            }),
          type: 'button',
        },
        'Mock Pull result',
      ),
      React.createElement('button', { onClick: props.onClose, type: 'button' }, 'Close sync'),
    );
  };

  return { default: MockJsTemplateSyncDrawer };
});

vi.mock('../pages/JsTemplateSourceProjectWorkspacePage', async () => {
  const React = await import('react');
  const noop = () => undefined;

  type FooterActions = {
    dirty: boolean;
    disabled: boolean;
    loading: boolean;
    onCancel: () => void;
    onSave: () => void;
    requestSave: () => Promise<'saved'>;
  };
  type WorkspacePageProps = {
    defaultFilesCollapsed?: boolean;
    onFooterActionsChange?: (actions: FooterActions | null) => void;
    onRequestClose?: () => void;
    onSaved?: () => void | Promise<void>;
  };

  const MockJsTemplateSourceProjectWorkspacePage = ({
    defaultFilesCollapsed,
    onFooterActionsChange,
    onRequestClose,
    onSaved,
  }: WorkspacePageProps) => {
    React.useEffect(() => {
      onFooterActionsChange?.({
        dirty: mocks.workspace.dirty,
        disabled: false,
        loading: false,
        onCancel: () => onRequestClose?.(),
        onSave: noop,
        requestSave: async () => 'saved',
      });

      return () => onFooterActionsChange?.(null);
    }, [onFooterActionsChange, onRequestClose]);

    return React.createElement(
      'div',
      { 'data-default-files-collapsed': String(Boolean(defaultFilesCollapsed)) },
      'Mock source workspace',
      React.createElement('button', { onClick: onSaved, type: 'button' }, 'Mock save source'),
    );
  };

  return {
    default: MockJsTemplateSourceProjectWorkspacePage,
  };
});

function renderListPage(initialEntry = '/admin/settings/js-templates') {
  const app = createMockClient();
  app.apiMock.onGet('app:getInfo').reply(200, { data: { version: 'test' } });

  return render(
    <FlowEngineProvider engine={app.flowEngine}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <JsTemplateSourceProjectsPage />
        <LocationSearch />
      </MemoryRouter>
    </FlowEngineProvider>,
  );
}

function LocationSearch() {
  return <output data-testid="location-search">{useLocation().search}</output>;
}

describe('JsTemplateSourceProjectsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.api.listProjects.mockReset();
    mocks.cache.invalidateRuntime.mockReset();
    mocks.cache.invalidateSettings.mockReset();
    mocks.createJobs.dismiss.mockReset();
    mocks.notification.error.mockReset();
    mocks.notification.success.mockReset();
    mocks.notification.warning.mockReset();
    mocks.createJobs.initialJobs = [];
    mocks.workspace.dirty = true;
    mocks.createJobs.error = null;
    mocks.api.listProjects.mockResolvedValue([]);
    mocks.api.createProject.mockResolvedValue({
      id: 'jtcj_browser_smoke',
      targetProjectId: 'jtp_browser_smoke',
      name: 'browser-smoke',
      title: 'Browser smoke',
      description: null,
      sourceType: 'starter',
      status: 'pending',
      resultProjectId: null,
      errorCode: null,
      errorMessage: null,
      startedAt: null,
      finishedAt: null,
      createdAt: '2026-07-27T00:00:00.000Z',
      updatedAt: '2026-07-27T00:00:00.000Z',
    });
    mocks.api.listCommits.mockResolvedValue([]);
    mocks.api.pull.mockResolvedValue({
      project: { id: 'jtp_browser_smoke' },
      commit: null,
      tree: null,
      unchanged: false,
      files: [],
    });
    mocks.api.deleteProject.mockResolvedValue({
      id: 'jtp_browser_smoke',
      name: 'browser-smoke',
      normalizedName: 'browser-smoke',
      title: 'Browser smoke',
      description: null,
      lifecycleStatus: 'enabled',
      healthStatus: 'pending',
      headCommitId: null,
    });
    mocks.api.updateProject.mockResolvedValue({
      id: 'jtp_browser_smoke',
      name: 'browser-smoke',
      normalizedName: 'browser-smoke',
      title: 'Browser smoke updated',
      description: 'Updated description',
      lifecycleStatus: 'enabled',
      healthStatus: 'pending',
      headCommitId: null,
    });
    mocks.sync.createFromGit.mockResolvedValue({
      id: 'jtcj_git',
      targetProjectId: 'jtp_git',
      name: 'git-smoke',
      title: 'Git smoke',
      description: null,
      sourceType: 'git',
      status: 'pending',
      resultProjectId: null,
      errorCode: null,
      errorMessage: null,
      startedAt: null,
      finishedAt: null,
      createdAt: '2026-07-27T00:00:00.000Z',
      updatedAt: '2026-07-27T00:00:00.000Z',
    });
    mocks.sync.testConnection.mockResolvedValue({
      ok: true,
      provider: 'git',
      config: gitConfig(),
      revision: 'git-head',
      credentialConfigured: false,
      authRefDisplay: null,
    });
    mocks.sync.configure.mockResolvedValue({
      projectId: 'jtp_browser_smoke',
      source: {
        provider: 'git',
        config: gitConfig(),
        status: 'active',
        remoteTargetVersion: 1,
        revision: 'git-head',
        credentialConfigured: false,
        authRefDisplay: null,
      },
    });
  });

  it('shows a safe error when creation jobs cannot be loaded', async () => {
    mocks.createJobs.error = new Error('JS Template creation job request failed');

    renderListPage();

    expect(await screen.findByText('Failed to load creation jobs')).toBeInTheDocument();
    expect(screen.queryByText('JS Template creation job request failed')).not.toBeInTheDocument();
  });

  it('gives every row action a unique accessible name using the project title or technical name', async () => {
    mocks.api.listProjects.mockResolvedValueOnce([
      createProjectSummary({ id: 'jtp_sales', name: 'sales-widgets', title: 'Sales widgets' }),
      createProjectSummary({ id: 'jtp_ops', name: 'ops-widgets', normalizedName: 'ops-widgets', title: '' }),
    ]);

    renderListPage();

    expect(await screen.findByRole('button', { name: 'Edit code Sales widgets' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit code ops-widgets' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit code Sales widgets' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Edit code ops-widgets' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More actions Sales widgets' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More actions ops-widgets' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'More actions Sales widgets' }));
    expect(await screen.findByRole('menuitem', { name: 'Sync code Sales widgets' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Edit details Sales widgets' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Remove Sales widgets' })).toBeInTheDocument();
  });

  it('opens Edit code from the keyboard-accessible project title link', async () => {
    mocks.api.listProjects.mockResolvedValueOnce([createProjectSummary({ title: 'Keyboard project' })]);
    renderListPage('/admin/settings/js-template?view=compact');

    const projectLink = await screen.findByRole('link', { name: 'Edit code Keyboard project' });
    projectLink.focus();
    await userEvent.keyboard(' ');

    expect(await screen.findByText('Mock source workspace')).toBeInTheDocument();
    expect(screen.getByTestId('location-search')).toHaveTextContent('view=compact');
    expect(screen.getByTestId('location-search')).toHaveTextContent('projectId=jtp_demo');
    expect(screen.getByTestId('location-search')).toHaveTextContent('panel=source');
  });

  it('opens the create dialog from the query parameter', async () => {
    renderListPage('/admin/settings/js-template?create=1');

    const dialog = await screen.findByRole('dialog', { name: 'Create Source Project' });
    expect((within(dialog).getByLabelText('Name') as HTMLInputElement).value).toMatch(/^jt_[a-z0-9]+$/);
    await userEvent.type(within(dialog).getByLabelText('Title'), 'Browser smoke');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(mocks.api.createProject).toHaveBeenCalledTimes(1));
    expect(mocks.api.createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringMatching(/^jt_[a-z0-9]+$/),
        title: 'Browser smoke',
        description: null,
      }),
    );
    expect(mocks.api.createProject.mock.calls[0][0]).not.toHaveProperty('zipBase64');
    const table = screen.getByRole('table');
    const creationRow = await within(table).findByRole('row', { name: /Browser smoke browser-smoke Creation pending/ });
    expect(within(table).getAllByRole('row')[1]).toBe(creationRow);
    expect(screen.queryByText('Creation status')).not.toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Creation task Browser smoke' })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Create Source Project' })).not.toBeInTheDocument();
    expect(mocks.createJobs.addAcceptedJob).toHaveBeenCalledTimes(1);
  });

  it('shows an actionable message instead of a raw provider error code', async () => {
    mocks.sync.createFromGit.mockRejectedValueOnce(
      new JsTemplateSyncHookError({
        operation: 'createFromGit',
        code: 'JS_TEMPLATE_SYNC_RATE_LIMITED',
        status: 429,
        message: 'JS_TEMPLATE_SYNC_RATE_LIMITED',
      }),
    );
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: /Add Source Project/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Create Source Project' });
    await userEvent.type(within(dialog).getByLabelText('Title'), 'Git remote error');
    await userEvent.click(within(dialog).getByText('Git source'));
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Git repository URL' }),
      'https://git.example.com/nocobase/example.git',
    );
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Branch' }), 'main');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('The Git remote is temporarily unavailable. Try again later.')).toBeInTheDocument();
    expect(screen.queryByText('JS_TEMPLATE_SYNC_RATE_LIMITED')).not.toBeInTheDocument();
  });

  it('submits an unresolved branch and explains when an empty remote needs an explicit branch', async () => {
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: /Add Source Project/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Create Source Project' });
    await userEvent.type(within(dialog).getByLabelText('Title'), 'Empty Git remote');
    await userEvent.click(within(dialog).getByText('Git source'));
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Git repository URL' }),
      'https://git.example.com/nocobase/empty.git',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() =>
      expect(mocks.sync.createFromGit).toHaveBeenCalledWith(
        expect.objectContaining({ config: expect.objectContaining({ branch: null }) }),
      ),
    );
    expect(await screen.findByText('Creation pending')).toBeInTheDocument();
    await act(async () => {
      mocks.createJobs.update([
        createJobSummary({
          id: 'jtcj_git',
          targetProjectId: 'jtp_git',
          name: 'git-smoke',
          title: 'Empty Git remote',
          sourceType: 'git',
          status: 'failed',
          errorCode: 'JS_TEMPLATE_SYNC_CONFIG_INVALID',
          errorReasonCode: 'default-branch-unavailable',
          errorMessage: 'JS_TEMPLATE_SYNC_CONFIG_INVALID',
        }),
      ]);
    });
    expect(mocks.notification.error).toHaveBeenCalledWith(
      expect.objectContaining({
        message:
          'Source Project creation failed: Empty Git remote: The remote repository has no default branch. Enter a branch explicitly.',
      }),
    );
    expect(screen.queryByText('JS_TEMPLATE_SYNC_CONFIG_INVALID')).not.toBeInTheDocument();
  });

  it('refreshes the ready project and notifies once after an observed creation succeeds', async () => {
    const pending = createJobSummary();
    mocks.createJobs.initialJobs = [pending];
    mocks.api.listProjects.mockResolvedValueOnce([]).mockResolvedValueOnce([
      {
        id: pending.targetProjectId,
        name: pending.name,
        normalizedName: pending.name,
        title: pending.title,
        description: null,
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: 'commit-ready',
      },
    ]);
    renderListPage();
    expect(await screen.findByText('Creation pending')).toBeInTheDocument();

    await act(async () => {
      mocks.createJobs.update([createJobSummary({ status: 'succeeded', resultProjectId: pending.targetProjectId })]);
    });

    await waitFor(() => expect(mocks.api.listProjects).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('button', { name: 'Edit code Demo' })).toBeInTheDocument();
    expect(mocks.notification.success).toHaveBeenCalledTimes(1);
    expect(mocks.notification.success).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Source Project creation succeeded: Demo' }),
    );
    expect(screen.queryByText('Creation succeeded')).not.toBeInTheDocument();
    expect(screen.queryByText('Source Project creation succeeded: Demo')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    await act(async () => {
      mocks.createJobs.update([createJobSummary({ status: 'succeeded', resultProjectId: pending.targetProjectId })]);
    });
    expect(mocks.api.listProjects).toHaveBeenCalledTimes(2);
    expect(mocks.notification.success).toHaveBeenCalledTimes(1);
  });

  it('notifies an initially failed job once and retries its auto-dismiss without concurrent requests', async () => {
    const failed = createJobSummary({
      status: 'failed',
      errorCode: 'JS_TEMPLATE_CREATE_FAILED',
      errorMessage: 'Safe failure',
    });
    const firstDismiss = createDeferred<void>();
    mocks.createJobs.initialJobs = [failed];
    mocks.createJobs.dismiss.mockReturnValueOnce(firstDismiss.promise).mockResolvedValueOnce(undefined);
    renderListPage();

    await waitFor(() => expect(mocks.createJobs.dismiss).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Safe failure')).not.toBeInTheDocument();
    expect(mocks.notification.error).toHaveBeenCalledTimes(1);
    expect(mocks.notification.error).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Source Project creation failed: Demo: Safe failure' }),
    );

    await act(async () => {
      mocks.createJobs.update([failed]);
    });
    expect(mocks.createJobs.dismiss).toHaveBeenCalledTimes(1);

    await act(async () => {
      firstDismiss.reject(new Error('Temporary dismiss failure'));
      await firstDismiss.promise.catch(() => undefined);
    });
    await act(async () => {
      mocks.createJobs.update([{ ...failed }]);
    });
    await waitFor(() => expect(mocks.createJobs.dismiss).toHaveBeenCalledTimes(2));
    expect(mocks.notification.error).toHaveBeenCalledTimes(1);
  });

  it('restores the Sync code drawer directly from URL state', async () => {
    mocks.api.listProjects.mockResolvedValueOnce([
      {
        id: 'jtp_browser_smoke',
        name: 'browser-smoke',
        normalizedName: 'browser-smoke',
        title: 'Browser smoke',
        description: null,
        lifecycleStatus: 'enabled',
        healthStatus: 'pending',
        headCommitId: 'commit-1',
      },
    ]);

    renderListPage('/admin/settings/js-template?projectId=jtp_browser_smoke&panel=sync');

    expect(await screen.findByRole('dialog', { name: 'Sync code' })).toBeInTheDocument();
    expect(screen.queryByText('Mock source workspace')).not.toBeInTheDocument();
  });

  it('opens a valid Source Project deep link only after its project has loaded', async () => {
    const initialLoad = createDeferred<JsTemplateProject[]>();
    mocks.api.listProjects.mockReturnValueOnce(initialLoad.promise);
    renderListPage('/admin/settings/js-template?projectId=jtp_demo&panel=source');

    await waitFor(() => expect(mocks.api.listProjects).toHaveBeenCalledTimes(1));
    expect(screen.queryByText('Mock source workspace')).not.toBeInTheDocument();

    await act(async () => {
      initialLoad.resolve([createProjectSummary()]);
      await initialLoad.promise;
    });

    expect(await screen.findByText('Mock source workspace')).toBeInTheDocument();
  });

  it('filters Source Projects with the All, Enabled, and Disabled lifecycle control', async () => {
    mocks.createJobs.initialJobs = [createJobSummary({ title: 'Creation ignores lifecycle filter' })];
    mocks.api.listProjects.mockResolvedValueOnce([
      {
        id: 'jtp_enabled',
        name: 'enabled-project',
        normalizedName: 'enabled-project',
        title: 'Enabled project',
        description: null,
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: null,
      },
      {
        id: 'jtp_disabled',
        name: 'disabled-project',
        normalizedName: 'disabled-project',
        title: 'Disabled project',
        description: null,
        lifecycleStatus: 'disabled',
        healthStatus: 'ready',
        headCommitId: null,
      },
    ]);
    renderListPage();

    expect(await screen.findByText('Enabled project')).toBeInTheDocument();
    expect(screen.getByText('Disabled project')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('combobox', { name: 'Lifecycle status' }));
    await userEvent.click(await screen.findByText('Disabled', { selector: '.ant-select-item-option-content' }));

    await waitFor(() => expect(screen.queryByText('Enabled project')).not.toBeInTheDocument());
    expect(screen.getByText('Disabled project')).toBeInTheDocument();
    expect(screen.getByText('Creation ignores lifecycle filter')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('combobox', { name: 'Lifecycle status' }));
    await userEvent.click(await screen.findByText('All', { selector: '.ant-select-item-option-content' }));

    expect(await screen.findByText('Enabled project')).toBeInTheDocument();
    expect(screen.getByText('Disabled project')).toBeInTheDocument();
  });

  it('supports multi-select batch enablement changes', async () => {
    mocks.api.listProjects.mockResolvedValueOnce([
      {
        id: 'jtp_sales',
        name: 'sales-widgets',
        normalizedName: 'sales-widgets',
        title: 'Sales widgets',
        description: null,
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: null,
      },
      {
        id: 'jtp_ops',
        name: 'ops-widgets',
        normalizedName: 'ops-widgets',
        title: 'Ops widgets',
        description: null,
        lifecycleStatus: 'enabled',
        healthStatus: 'pending',
        headCommitId: null,
      },
    ]);
    mocks.api.changeLifecycle.mockImplementation(async ({ projectId, lifecycleStatus }) => ({
      id: projectId,
      name: projectId,
      normalizedName: projectId,
      title: projectId,
      description: null,
      lifecycleStatus,
      healthStatus: 'ready',
      headCommitId: null,
    }));

    renderListPage();

    expect(await screen.findByText('Sales widgets')).toBeInTheDocument();
    const batchButton = screen.getByRole('button', { name: /Batch actions/ });
    expect(batchButton).toBeDisabled();

    const checkboxes = await screen.findAllByRole('checkbox');
    await userEvent.click(checkboxes[1]);
    await userEvent.click(checkboxes[2]);
    expect(batchButton).toBeEnabled();

    await userEvent.click(batchButton);
    await userEvent.click(await screen.findByText('Disable selected'));

    await waitFor(() => expect(mocks.api.changeLifecycle).toHaveBeenCalledTimes(2));
    expect(mocks.api.changeLifecycle).toHaveBeenCalledWith({ projectId: 'jtp_sales', lifecycleStatus: 'disabled' });
    expect(mocks.api.changeLifecycle).toHaveBeenCalledWith({ projectId: 'jtp_ops', lifecycleStatus: 'disabled' });
  });

  it('prunes hidden selection, keeps visible selection, and never batches a hidden project', async () => {
    mocks.createJobs.initialJobs = [createJobSummary({ id: 'jtcj_active', title: 'Independent creation' })];
    mocks.api.listProjects.mockResolvedValueOnce([
      {
        id: 'jtp_sales',
        name: 'sales-widgets',
        normalizedName: 'sales-widgets',
        title: 'Sales widgets',
        description: null,
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: null,
      },
      {
        id: 'jtp_ops',
        name: 'ops-widgets',
        normalizedName: 'ops-widgets',
        title: 'Ops widgets',
        description: null,
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: null,
      },
    ]);
    mocks.api.changeLifecycle.mockImplementation(async ({ projectId, lifecycleStatus }) => ({
      id: projectId,
      name: projectId,
      normalizedName: projectId,
      title: projectId,
      description: null,
      lifecycleStatus,
      healthStatus: 'ready',
      headCommitId: null,
    }));

    renderListPage();

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Select Sales widgets' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Ops widgets' }));
    expect(screen.getByText('Selected 2')).toBeInTheDocument();

    await userEvent.type(screen.getByRole('textbox', { name: 'Search Source Projects' }), 'sales');

    await waitFor(() => expect(screen.queryByText('Ops widgets')).not.toBeInTheDocument());
    expect(screen.getByText('Selected 1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Batch actions/ })).toBeEnabled();
    const tableRows = within(screen.getByRole('table')).getAllByRole('row');
    expect(tableRows[1]).toHaveTextContent('Independent creation');
    expect(tableRows[1]).toHaveTextContent('Creation pending');
    expect(within(tableRows[1]).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(mocks.api.changeLifecycle).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: /Batch actions/ }));
    await userEvent.click(await screen.findByText('Disable selected'));

    await waitFor(() => expect(mocks.api.changeLifecycle).toHaveBeenCalledTimes(1));
    expect(mocks.api.changeLifecycle).toHaveBeenCalledWith({ projectId: 'jtp_sales', lifecycleStatus: 'disabled' });
    expect(mocks.api.changeLifecycle).not.toHaveBeenCalledWith({
      projectId: 'jtp_ops',
      lifecycleStatus: 'disabled',
    });
  });
});

function createJobSummary(overrides: Partial<JsTemplateCreateJobSummary> = {}): JsTemplateCreateJobSummary {
  return {
    id: 'jtcj_demo',
    targetProjectId: 'jtp_demo',
    name: 'demo',
    title: 'Demo',
    description: null,
    sourceType: 'starter',
    status: 'pending',
    resultProjectId: null,
    errorCode: null,
    errorMessage: null,
    startedAt: null,
    finishedAt: null,
    createdAt: '2026-07-27T00:00:00.000Z',
    updatedAt: '2026-07-27T00:00:01.000Z',
    ...overrides,
  };
}

function createProjectSummary(overrides: Partial<JsTemplateProject> = {}): JsTemplateProject {
  return {
    id: 'jtp_demo',
    name: 'demo',
    normalizedName: 'demo',
    title: 'Demo',
    description: null,
    lifecycleStatus: 'enabled',
    healthStatus: 'ready',
    headCommitId: 'commit-ready',
    ...overrides,
  };
}

function createDeferred<T>() {
  let resolveDeferred!: (value: T | PromiseLike<T>) => void;
  let rejectDeferred!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolveDeferred = resolve;
    rejectDeferred = reject;
  });
  return { promise, reject: rejectDeferred, resolve: resolveDeferred };
}

function gitConfig() {
  return {
    url: 'https://git.example.com/nocobase/example.git',
    branch: 'main',
    subdirectory: null,
    transport: 'https' as const,
  };
}
