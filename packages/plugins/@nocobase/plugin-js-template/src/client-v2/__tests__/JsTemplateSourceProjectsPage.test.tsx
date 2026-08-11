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
import JsTemplateSourceProjectsPage, { matchesJsTemplateProjectSearch } from '../pages/JsTemplateSourceProjectsPage';

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
  cache: {
    invalidateRuntime: vi.fn(),
    invalidateSettings: vi.fn(),
  },
  workspace: {
    dirty: true,
  },
}));

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

  it('shows one advanced Source Project row for a project containing two Template Entries', async () => {
    mocks.api.listProjects.mockResolvedValueOnce([
      {
        id: 'jtp_shared',
        name: 'shared-source',
        normalizedName: 'shared-source',
        title: 'Shared source',
        description: 'Contains two entries',
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: 'vscc_shared',
        templateCount: 2,
        templateKinds: { 'js-action': 1, 'js-block': 1 },
      },
    ]);

    renderListPage('/admin/settings/js-templates');

    expect(screen.getByRole('heading', { name: 'Source Projects' })).toBeInTheDocument();
    expect(screen.getByText('A Source Project can contain multiple reusable JS Templates.')).toBeInTheDocument();
    const projectRow = await screen.findByRole('row', { name: /Shared source shared-source/ });
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByRole('columnheader', { name: 'Source Project' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Templates' })).toBeInTheDocument();
    expect(within(projectRow).getByText('js-block 1')).toBeInTheDocument();
    expect(within(projectRow).getByText('js-action 1')).toBeInTheDocument();
  });

  it('gives every row action a unique accessible name using the project title or technical name', async () => {
    mocks.api.listProjects.mockResolvedValueOnce([
      createProjectSummary({ id: 'jtp_sales', name: 'sales-widgets', title: 'Sales widgets' }),
      createProjectSummary({ id: 'jtp_ops', name: 'ops-widgets', normalizedName: 'ops-widgets', title: '' }),
    ]);

    renderListPage();

    expect(await screen.findByRole('button', { name: 'Edit code Sales widgets' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit code ops-widgets' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sync code Sales widgets' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sync code ops-widgets' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit details Sales widgets' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit details ops-widgets' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Sales widgets' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove ops-widgets' })).toBeInTheDocument();
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
    const creationStatus = await screen.findByRole('status', { name: 'Creation status' });
    expect(within(creationStatus).getByText('Browser smoke')).toBeInTheDocument();
    expect(within(creationStatus).getByText('Creation pending')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('No Source Projects yet')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox', { name: 'Creation task Browser smoke' })).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Create Source Project' })).not.toBeInTheDocument();
    expect(mocks.createJobs.addAcceptedJob).toHaveBeenCalledTimes(1);
  });

  it('uploads an optional source ZIP through the combined create dialog', async () => {
    mocks.api.createProject.mockResolvedValueOnce({
      id: 'jtcj_imported',
      targetProjectId: 'jtp_imported',
      name: 'imported-smoke',
      title: 'Imported smoke',
      description: null,
      sourceType: 'zip',
      status: 'pending',
      resultProjectId: null,
      errorCode: null,
      errorMessage: null,
      startedAt: null,
      finishedAt: null,
      createdAt: '2026-07-27T00:00:00.000Z',
      updatedAt: '2026-07-27T00:00:00.000Z',
    });
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: /Add Source Project/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Create Source Project' });
    await userEvent.click(within(dialog).getByText('ZIP file'));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['zip-source'], 'imported-smoke.zip', { type: 'application/zip' });

    await userEvent.upload(input, file);
    await waitFor(() =>
      expect((within(dialog).getByLabelText('Name') as HTMLInputElement).value).toMatch(/^jt_[a-z0-9]+$/),
    );
    await userEvent.type(within(dialog).getByLabelText('Title'), 'Imported smoke');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(mocks.api.createProject).toHaveBeenCalledTimes(1));
    expect(mocks.api.createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringMatching(/^jt_[a-z0-9]+$/),
        title: 'Imported smoke',
        zipBase64: 'emlwLXNvdXJjZQ==',
      }),
    );
    expect(await screen.findByText('Creation pending')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Create Source Project' })).not.toBeInTheDocument();
  });

  it('creates from Git with an exclusive safe source payload and updates the URL', async () => {
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: /Add Source Project/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Create Source Project' });
    await userEvent.type(within(dialog).getByLabelText('Title'), 'Git smoke');
    await userEvent.click(within(dialog).getByText('Git source'));
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: 'Git repository URL' }),
      'https://git.example.com/nocobase/example.git',
    );
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Branch' }), 'main');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(mocks.sync.createFromGit).toHaveBeenCalledTimes(1));
    expect(mocks.sync.createFromGit).toHaveBeenCalledWith({
      name: expect.stringMatching(/^jt_[a-z0-9]+$/),
      title: 'Git smoke',
      description: null,
      provider: 'git',
      config: {
        url: 'https://git.example.com/nocobase/example.git',
        branch: 'main',
        subdirectory: null,
        transport: 'https',
      },
    });
    expect(mocks.sync.createFromGit.mock.calls[0][0]).not.toHaveProperty('zipBase64');
    expect(mocks.api.createProject).not.toHaveBeenCalled();
    expect(await screen.findByText('Git smoke')).toBeInTheDocument();
    expect(await screen.findByText('Creation pending')).toBeInTheDocument();
    expect(screen.getByTestId('location-search')).not.toHaveTextContent('projectId=jtp_git');
  });

  it('keeps Git create configuration in the modal when the request fails', async () => {
    mocks.sync.createFromGit.mockRejectedValueOnce(new Error('Git source could not be created'));
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: /Add Source Project/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Create Source Project' });
    await userEvent.type(within(dialog).getByLabelText('Title'), 'Git smoke');
    await userEvent.click(within(dialog).getByText('Git source'));
    const repositoryInput = within(dialog).getByRole('textbox', { name: 'Git repository URL' });
    await userEvent.type(repositoryInput, 'https://git.example.com/nocobase/example.git');
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'Branch' }), 'main');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('Git source could not be created')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Create Source Project' })).toBeInTheDocument();
    expect(repositoryInput).toHaveValue('https://git.example.com/nocobase/example.git');
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
    expect(
      await screen.findByText(
        'Source Project creation failed: Empty Git remote: The remote repository has no default branch. Enter a branch explicitly.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('JS_TEMPLATE_SYNC_CONFIG_INVALID')).not.toBeInTheDocument();
  });

  it('keeps the latest project list and loading state when an older load succeeds late', async () => {
    const initialProject = createProjectSummary();
    const staleLoad = createDeferred<JsTemplateProject[]>();
    const latestLoad = createDeferred<JsTemplateProject[]>();
    const currentLoad = createDeferred<JsTemplateProject[]>();
    mocks.api.listProjects
      .mockResolvedValueOnce([initialProject])
      .mockReturnValueOnce(staleLoad.promise)
      .mockReturnValueOnce(latestLoad.promise)
      .mockReturnValueOnce(currentLoad.promise);
    renderListPage('/admin/settings/js-templates?projectId=jtp_demo&panel=source');

    const saveButton = await screen.findByRole('button', { name: 'Mock save source' });
    await userEvent.click(saveButton);
    await waitFor(() => expect(mocks.api.listProjects).toHaveBeenCalledTimes(2));
    await userEvent.click(saveButton);
    await waitFor(() => expect(mocks.api.listProjects).toHaveBeenCalledTimes(3));

    await act(async () => {
      latestLoad.resolve([createProjectSummary({ title: 'Latest project' })]);
      await latestLoad.promise;
    });
    expect(await screen.findByText('Latest project')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh/ })).not.toHaveClass('ant-btn-loading');

    await userEvent.click(saveButton);
    await waitFor(() => expect(mocks.api.listProjects).toHaveBeenCalledTimes(4));
    expect(screen.getByRole('button', { name: /Refresh/ })).toHaveClass('ant-btn-loading');

    await act(async () => {
      staleLoad.resolve([createProjectSummary({ title: 'Stale project' })]);
      await staleLoad.promise;
    });
    expect(screen.queryByText('Stale project')).not.toBeInTheDocument();
    expect(screen.getByText('Latest project')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh/ })).toHaveClass('ant-btn-loading');

    await act(async () => {
      currentLoad.resolve([createProjectSummary({ title: 'Current project' })]);
      await currentLoad.promise;
    });
    expect(await screen.findByText('Current project')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh/ })).not.toHaveClass('ant-btn-loading');
  });

  it('ignores an older load rejection without showing its error or clearing the newer loading state', async () => {
    const staleLoad = createDeferred<JsTemplateProject[]>();
    const latestLoad = createDeferred<JsTemplateProject[]>();
    mocks.api.listProjects
      .mockResolvedValueOnce([createProjectSummary()])
      .mockReturnValueOnce(staleLoad.promise)
      .mockReturnValueOnce(latestLoad.promise);
    renderListPage('/admin/settings/js-templates?projectId=jtp_demo&panel=source');

    const saveButton = await screen.findByRole('button', { name: 'Mock save source' });
    await userEvent.click(saveButton);
    await waitFor(() => expect(mocks.api.listProjects).toHaveBeenCalledTimes(2));
    await userEvent.click(saveButton);
    await waitFor(() => expect(mocks.api.listProjects).toHaveBeenCalledTimes(3));

    await act(async () => {
      staleLoad.reject(new Error('Stale project load failed'));
      await staleLoad.promise.catch(() => undefined);
    });
    expect(screen.queryByText('Stale project load failed')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh/ })).toHaveClass('ant-btn-loading');

    await act(async () => {
      latestLoad.resolve([createProjectSummary({ title: 'Recovered project' })]);
      await latestLoad.promise;
    });
    expect(await screen.findByText('Recovered project')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh/ })).not.toHaveClass('ant-btn-loading');
  });

  it('does not restore an old lifecycle value when a list started before the mutation resolves late', async () => {
    const initialProject = createProjectSummary({ lifecycleStatus: 'enabled' });
    const staleLoad = createDeferred<JsTemplateProject[]>();
    mocks.api.listProjects.mockResolvedValueOnce([initialProject]).mockReturnValueOnce(staleLoad.promise);
    mocks.api.changeLifecycle.mockResolvedValueOnce({ ...initialProject, lifecycleStatus: 'disabled' });
    renderListPage();

    const enabledSwitch = await screen.findByRole('switch', { name: 'Enabled Demo' });
    await userEvent.click(screen.getByRole('button', { name: /Refresh/ }));
    await waitFor(() => expect(mocks.api.listProjects).toHaveBeenCalledTimes(2));
    fireEvent.click(enabledSwitch);

    await waitFor(() => expect(mocks.api.changeLifecycle).toHaveBeenCalledTimes(1));
    expect(enabledSwitch).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Source Projects updated')).toBeInTheDocument();

    await act(async () => {
      staleLoad.resolve([initialProject]);
      await staleLoad.promise;
    });

    expect(enabledSwitch).toHaveAttribute('aria-checked', 'false');
    expect(screen.getByText('Source Projects updated')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh/ })).not.toHaveClass('ant-btn-loading');
  });

  it('does not resurrect a deleted project when a list started before the deletion resolves late', async () => {
    const initialProject = createProjectSummary();
    const staleLoad = createDeferred<JsTemplateProject[]>();
    mocks.api.listProjects.mockResolvedValueOnce([initialProject]).mockReturnValueOnce(staleLoad.promise);
    mocks.api.deleteProject.mockResolvedValueOnce(initialProject);
    renderListPage();

    await screen.findByText('Demo');
    await userEvent.click(screen.getByRole('button', { name: /Refresh/ }));
    await waitFor(() => expect(mocks.api.listProjects).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole('button', { name: 'Remove Demo' }));
    await userEvent.click(
      within(await screen.findByRole('dialog', { name: 'Remove this Source Project?' })).getByRole('button', {
        name: 'Remove',
      }),
    );

    await waitFor(() => expect(screen.queryByText('demo')).not.toBeInTheDocument());
    expect(screen.getByText('Source Project removed')).toBeInTheDocument();

    await act(async () => {
      staleLoad.resolve([initialProject]);
      await staleLoad.promise;
    });

    expect(screen.queryByText('demo')).not.toBeInTheDocument();
    expect(screen.getByText('Source Project removed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh/ })).not.toHaveClass('ant-btn-loading');
  });

  it('ignores a load rejection made stale by an edit and preserves the newer notice', async () => {
    const initialProject = createProjectSummary({ description: 'Before edit' });
    const staleLoad = createDeferred<JsTemplateProject[]>();
    const updatedProject = { ...initialProject, title: 'Edited Demo', description: 'After edit' };
    mocks.api.listProjects.mockResolvedValueOnce([initialProject]).mockReturnValueOnce(staleLoad.promise);
    mocks.api.updateProject.mockResolvedValueOnce(updatedProject);
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Edit details Demo' }));
    await userEvent.click(screen.getByRole('button', { name: /Refresh/ }));
    await waitFor(() => expect(mocks.api.listProjects).toHaveBeenCalledTimes(2));
    const drawer = screen.getByRole('dialog', { name: 'Edit Source Project' });
    const titleInput = within(drawer).getByLabelText('Title');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Edited Demo');
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Edited Demo')).toBeInTheDocument();
    expect(screen.getByText('Source Project updated')).toBeInTheDocument();

    await act(async () => {
      staleLoad.reject(new Error('Old edit load failed'));
      await staleLoad.promise.catch(() => undefined);
    });

    expect(screen.queryByText('Old edit load failed')).not.toBeInTheDocument();
    expect(screen.getByText('Source Project updated')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh/ })).not.toHaveClass('ant-btn-loading');
  });

  it('does not show a transition notice when its project reload becomes stale', async () => {
    const pending = createJobSummary();
    const transitionLoad = createDeferred<JsTemplateProject[]>();
    const latestLoad = createDeferred<JsTemplateProject[]>();
    mocks.createJobs.initialJobs = [pending];
    mocks.api.listProjects
      .mockResolvedValueOnce([createProjectSummary()])
      .mockReturnValueOnce(transitionLoad.promise)
      .mockReturnValueOnce(latestLoad.promise);
    renderListPage('/admin/settings/js-templates?projectId=jtp_demo&panel=source');

    const saveButton = await screen.findByRole('button', { name: 'Mock save source' });
    await act(async () => {
      mocks.createJobs.update([createJobSummary({ status: 'succeeded', resultProjectId: pending.targetProjectId })]);
    });
    await waitFor(() => expect(mocks.api.listProjects).toHaveBeenCalledTimes(2));
    await userEvent.click(saveButton);
    await waitFor(() => expect(mocks.api.listProjects).toHaveBeenCalledTimes(3));

    await act(async () => {
      latestLoad.resolve([createProjectSummary({ title: 'Latest project' })]);
      await latestLoad.promise;
    });
    await act(async () => {
      transitionLoad.resolve([createProjectSummary({ title: 'Transition project' })]);
      await transitionLoad.promise;
    });

    expect(screen.getByText('Latest project')).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('Source Project creation succeeded: Demo')).not.toBeInTheDocument();
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
    expect(await screen.findByText('Source Project creation succeeded: Demo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit code Demo' })).toBeInTheDocument();
    expect(screen.getByText('Creation succeeded')).toBeInTheDocument();
    await act(async () => {
      mocks.createJobs.update([createJobSummary({ status: 'succeeded', resultProjectId: pending.targetProjectId })]);
    });
    expect(mocks.api.listProjects).toHaveBeenCalledTimes(2);
  });

  it('preserves the project reload error instead of replacing it with a creation success notice', async () => {
    const pending = createJobSummary();
    mocks.createJobs.initialJobs = [pending];
    mocks.cache.invalidateSettings.mockImplementationOnce(() => {
      throw new Error('Cache invalidation failed');
    });
    mocks.api.listProjects.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('Project refresh failed'));
    renderListPage();
    expect(await screen.findByText('Creation pending')).toBeInTheDocument();

    await act(async () => {
      mocks.createJobs.update([createJobSummary({ status: 'succeeded', resultProjectId: pending.targetProjectId })]);
    });

    expect(await screen.findByText('Project refresh failed')).toBeInTheDocument();
    expect(screen.queryByText('Source Project creation succeeded: Demo')).not.toBeInTheDocument();
    expect(screen.queryByText('Some JS Template caches could not be refreshed')).not.toBeInTheDocument();
    expect(mocks.cache.invalidateSettings).toHaveBeenCalledWith(expect.anything(), pending.targetProjectId);
    expect(mocks.cache.invalidateRuntime).toHaveBeenCalledWith(expect.anything(), pending.targetProjectId);
    expect(mocks.api.listProjects).toHaveBeenCalledTimes(2);
  });

  it.each(['settings', 'runtime'] as const)(
    'attempts both cache invalidators and reloads the created project when the %s invalidator throws',
    async (failedCache) => {
      const pending = createJobSummary();
      mocks.createJobs.initialJobs = [pending];
      mocks.api.listProjects.mockResolvedValueOnce([]).mockResolvedValueOnce([createProjectSummary()]);
      const invalidator = failedCache === 'settings' ? mocks.cache.invalidateSettings : mocks.cache.invalidateRuntime;
      invalidator.mockImplementationOnce(() => {
        throw new Error(`${failedCache} cache invalidation failed`);
      });
      renderListPage();
      expect(await screen.findByText('Creation pending')).toBeInTheDocument();

      await act(async () => {
        mocks.createJobs.update([createJobSummary({ status: 'succeeded', resultProjectId: pending.targetProjectId })]);
      });

      expect(await screen.findByText('Some JS Template caches could not be refreshed')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Edit code Demo' })).toBeInTheDocument();
      expect(screen.queryByText('Source Project creation succeeded: Demo')).not.toBeInTheDocument();
      expect(mocks.cache.invalidateSettings).toHaveBeenCalledWith(expect.anything(), pending.targetProjectId);
      expect(mocks.cache.invalidateRuntime).toHaveBeenCalledWith(expect.anything(), pending.targetProjectId);
      expect(mocks.api.listProjects).toHaveBeenCalledTimes(2);
    },
  );

  it('forgets disappeared job statuses before the same ID returns as terminal history', async () => {
    const pending = createJobSummary();
    mocks.createJobs.initialJobs = [pending];
    renderListPage();
    expect(await screen.findByText('Creation pending')).toBeInTheDocument();

    await act(async () => {
      mocks.createJobs.update([]);
      await Promise.resolve();
    });
    await act(async () => {
      mocks.createJobs.update([createJobSummary({ status: 'failed', errorMessage: 'Historical failure' })]);
    });

    expect(await screen.findByText('Historical failure')).toBeInTheDocument();
    expect(screen.queryByText('Source Project creation failed: Demo: Historical failure')).not.toBeInTheDocument();
    expect(mocks.api.listProjects).toHaveBeenCalledTimes(1);
  });

  it('baselines historical terminal jobs outside the project table and limits terminal status history', async () => {
    const activeJobs = Array.from({ length: 4 }, (_value, index) =>
      createJobSummary({
        id: `jtcj_active_${index + 1}`,
        name: `active-${index + 1}`,
        title: `Active ${index + 1}`,
        status: index % 2 ? 'running' : 'pending',
      }),
    );
    const historicalJobs = Array.from({ length: 20 }, (_value, index) =>
      createJobSummary({
        id: `jtcj_history_${index + 1}`,
        name: `history-${index + 1}`,
        title: `Historical ${index + 1}`,
        status: index % 2 ? 'failed' : 'succeeded',
        errorMessage: index % 2 ? `Historical failure ${index + 1}` : null,
      }),
    );
    mocks.createJobs.initialJobs = [...activeJobs, ...historicalJobs];
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

    renderListPage();

    const projectTable = screen.getByRole('table');
    expect(await within(projectTable).findByText('Sales widgets')).toBeInTheDocument();
    expect(within(projectTable).getByText('Ops widgets')).toBeInTheDocument();
    expect(within(projectTable).getAllByRole('row')).toHaveLength(3);
    expect(within(projectTable).queryByText('Creation succeeded')).not.toBeInTheDocument();

    const creationStatus = screen.getByRole('status', { name: 'Creation status' });
    for (const activeJob of activeJobs) {
      expect(within(creationStatus).getByText(activeJob.title || activeJob.name)).toBeInTheDocument();
    }
    expect(within(creationStatus).getByText('Historical 1')).toBeInTheDocument();
    expect(within(creationStatus).getByText('Historical 2')).toBeInTheDocument();
    expect(within(creationStatus).getByText('Historical 3')).toBeInTheDocument();
    expect(within(creationStatus).queryByText('Historical 4')).not.toBeInTheDocument();
    expect(screen.queryByText('Source Project creation succeeded: Historical 1')).not.toBeInTheDocument();
    expect(screen.queryByText(/Source Project creation failed: Historical/)).not.toBeInTheDocument();
    expect(mocks.api.listProjects).toHaveBeenCalledTimes(1);
  });

  it('notifies the newest terminal transition and refreshes once when the same batch includes a success', async () => {
    const newestFailed = createJobSummary({
      id: 'jtcj_newest',
      name: 'newest',
      title: 'Newest failed',
      status: 'pending',
    });
    const olderSucceeded = createJobSummary({
      id: 'jtcj_older',
      name: 'older',
      title: 'Older succeeded',
      status: 'running',
    });
    mocks.createJobs.initialJobs = [newestFailed, olderSucceeded];
    mocks.cache.invalidateSettings.mockImplementationOnce(() => {
      throw new Error('Cache invalidation failed');
    });
    renderListPage();
    expect(await screen.findByText('Newest failed')).toBeInTheDocument();

    const terminalJobs = [
      { ...newestFailed, status: 'failed' as const, errorMessage: 'Newest safe failure' },
      { ...olderSucceeded, status: 'succeeded' as const, resultProjectId: olderSucceeded.targetProjectId },
    ];
    await act(async () => {
      mocks.createJobs.update(terminalJobs);
    });

    await waitFor(() => expect(mocks.api.listProjects).toHaveBeenCalledTimes(2));
    expect(
      await screen.findByText('Source Project creation failed: Newest failed: Newest safe failure'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Source Project creation succeeded: Older succeeded')).not.toBeInTheDocument();
    expect(screen.queryByText('Some JS Template caches could not be refreshed')).not.toBeInTheDocument();

    await act(async () => {
      mocks.createJobs.update(terminalJobs);
    });
    expect(mocks.api.listProjects).toHaveBeenCalledTimes(2);
  });

  it('prioritizes the newest creation failure when an older success reload fails', async () => {
    const newestFailed = createJobSummary({
      id: 'jtcj_newest',
      name: 'newest',
      title: 'Newest failed',
      status: 'pending',
    });
    const olderSucceeded = createJobSummary({
      id: 'jtcj_older',
      name: 'older',
      title: 'Older succeeded',
      status: 'running',
    });
    mocks.createJobs.initialJobs = [newestFailed, olderSucceeded];
    mocks.api.listProjects.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('Project refresh failed'));
    renderListPage();
    expect(await screen.findByText('Newest failed')).toBeInTheDocument();

    await act(async () => {
      mocks.createJobs.update([
        { ...newestFailed, status: 'failed', errorMessage: 'Newest safe failure' },
        { ...olderSucceeded, status: 'succeeded', resultProjectId: olderSucceeded.targetProjectId },
      ]);
    });

    expect(
      await screen.findByText('Source Project creation failed: Newest failed: Newest safe failure'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Project refresh failed')).not.toBeInTheDocument();
    expect(screen.queryByText('Source Project creation succeeded: Older succeeded')).not.toBeInTheDocument();
    expect(mocks.api.listProjects).toHaveBeenCalledTimes(2);
  });

  it('keeps an initially failed creation until the user explicitly removes it', async () => {
    const failed = createJobSummary({
      status: 'failed',
      errorCode: 'JS_TEMPLATE_CREATE_FAILED',
      errorMessage: 'Safe failure',
    });
    mocks.createJobs.initialJobs = [failed];
    renderListPage();

    expect(await screen.findByText('Safe failure')).toBeInTheDocument();
    expect(screen.queryByText('Source Project creation failed: Demo: Safe failure')).not.toBeInTheDocument();
    expect(mocks.api.listProjects).toHaveBeenCalledTimes(1);
    expect(mocks.createJobs.dismiss).not.toHaveBeenCalled();
    const dismissButton = screen.getByRole('button', { name: 'Remove creation task Demo' });
    dismissButton.focus();
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(mocks.createJobs.dismiss).toHaveBeenCalledWith(failed.id));
    expect(screen.queryByText('Safe failure')).not.toBeInTheDocument();
  });

  it('maps a missing creation task dismissal to localized safe text', async () => {
    const succeeded = createJobSummary({ status: 'succeeded', resultProjectId: 'jtp_demo' });
    mocks.createJobs.initialJobs = [succeeded];
    mocks.createJobs.dismiss.mockRejectedValueOnce({
      response: {
        data: {
          errors: [
            {
              code: 'JS_TEMPLATE_CREATE_JOB_NOT_FOUND',
              message: 'Sensitive missing job detail',
            },
          ],
        },
      },
    });
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Remove creation task Demo' }));

    expect(await screen.findByText('Creation task is no longer available')).toBeInTheDocument();
    expect(screen.queryByText('Sensitive missing job detail')).not.toBeInTheDocument();
    expect(screen.getByText('Creation succeeded')).toBeInTheDocument();
  });

  it('uses a localized fallback and hides raw dismissal errors for unknown server failures', async () => {
    const succeeded = createJobSummary({ status: 'succeeded', resultProjectId: 'jtp_demo' });
    mocks.createJobs.initialJobs = [succeeded];
    mocks.createJobs.dismiss.mockRejectedValueOnce({
      response: {
        data: {
          errors: [
            {
              code: 'INTERNAL_SERVER_ERROR',
              message: 'Sensitive internal server detail',
            },
          ],
        },
      },
    });
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Remove creation task Demo' }));

    expect(await screen.findByText('Failed to remove creation task')).toBeInTheDocument();
    expect(screen.queryByText('Sensitive internal server detail')).not.toBeInTheDocument();
    expect(screen.getByText('Creation succeeded')).toBeInTheDocument();
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

  it('does not open an empty Source drawer for a missing deep-linked project', async () => {
    mocks.api.listProjects.mockResolvedValueOnce([]);
    renderListPage('/admin/settings/js-template?projectId=jtp_missing&panel=source');

    await waitFor(() => expect(screen.getByRole('button', { name: /Refresh/ })).not.toHaveClass('ant-btn-loading'));
    expect(screen.queryByText('Mock source workspace')).not.toBeInTheDocument();
    expect(screen.getByTestId('location-search')).toHaveTextContent('projectId=jtp_missing');
    expect(screen.getByTestId('location-search')).toHaveTextContent('panel=source');
  });

  it('opens Sync code from its row action, preserves unrelated query values, and wires Git configuration', async () => {
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
    renderListPage('/admin/settings/js-template?view=compact');

    await userEvent.click(await screen.findByRole('button', { name: 'Sync code Browser smoke' }));
    const drawer = await screen.findByRole('dialog', { name: 'Sync code' });
    expect(screen.getByTestId('location-search')).toHaveTextContent('view=compact');
    expect(screen.getByTestId('location-search')).toHaveTextContent('projectId=jtp_browser_smoke');
    expect(screen.getByTestId('location-search')).toHaveTextContent('panel=sync');

    await userEvent.type(
      within(drawer).getByRole('textbox', { name: 'Git repository URL' }),
      'https://git.example.com/nocobase/example.git',
    );
    await userEvent.type(within(drawer).getByRole('textbox', { name: 'Branch' }), 'main');
    await userEvent.click(within(drawer).getByRole('button', { name: 'Test connection' }));
    await waitFor(() =>
      expect(mocks.sync.testConnection).toHaveBeenCalledWith({
        projectId: 'jtp_browser_smoke',
        provider: 'git',
        config: {
          url: 'https://git.example.com/nocobase/example.git',
          branch: 'main',
          subdirectory: null,
          transport: 'https',
        },
      }),
    );
    expect(await within(drawer).findByText('Connection successful')).toBeInTheDocument();

    await userEvent.click(within(drawer).getByRole('button', { name: 'Configure' }));
    await waitFor(() => expect(mocks.sync.configure).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Git repository URL' })).toHaveValue(''));

    const refreshedDrawer = await screen.findByRole('dialog', { name: 'Sync code' });
    await userEvent.click(within(refreshedDrawer).getByRole('button', { name: 'Close sync' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Sync code' })).not.toBeInTheDocument());
    expect(screen.getByTestId('location-search')).toHaveTextContent('view=compact');
    expect(screen.getByTestId('location-search')).toHaveTextContent('projectId=jtp_browser_smoke');
    expect(screen.getByTestId('location-search')).not.toHaveTextContent('panel=sync');
  });

  it('updates list summaries directly from the complete project returned by a sync operation', async () => {
    const originalProject = {
      id: 'jtp_browser_smoke',
      name: 'browser-smoke',
      normalizedName: 'browser-smoke',
      title: 'Browser smoke',
      description: null,
      lifecycleStatus: 'enabled' as const,
      healthStatus: 'ready' as const,
      headCommitId: 'commit-1',
      templateCount: 1,
      templateKinds: { 'js-block': 1 },
    };
    const staleLoad = createDeferred<JsTemplateProject[]>();
    mocks.api.listProjects.mockResolvedValueOnce([originalProject]).mockReturnValueOnce(staleLoad.promise);
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: /Refresh/ }));
    await waitFor(() => expect(mocks.api.listProjects).toHaveBeenCalledTimes(2));
    fireEvent.click(await screen.findByRole('button', { name: 'Sync code Browser smoke' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Mock Pull result' }));

    expect(await screen.findByText('js-block 3')).toBeInTheDocument();
    await act(async () => {
      staleLoad.resolve([originalProject]);
      await staleLoad.promise;
    });
    expect(screen.getByText('js-block 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Refresh/ })).not.toHaveClass('ant-btn-loading');
  });

  it('edits the project display name and description in a drawer and refreshes the row immediately', async () => {
    mocks.api.listProjects.mockResolvedValueOnce([
      {
        id: 'jtp_sales',
        name: 'sales-widgets',
        normalizedName: 'sales-widgets',
        title: 'Sales widgets',
        description: 'Sales dashboard helpers',
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: null,
        templateCount: 2,
        templateKinds: {
          'js-block': 2,
        },
      },
    ]);
    mocks.api.updateProject.mockResolvedValueOnce({
      id: 'jtp_sales',
      name: 'sales-widgets',
      normalizedName: 'sales-widgets',
      title: 'Sales widgets updated',
      description: 'Updated dashboard helpers',
      lifecycleStatus: 'enabled',
      healthStatus: 'ready',
      headCommitId: null,
    });
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Edit details Sales widgets' }));

    const drawer = await screen.findByRole('dialog', { name: 'Edit Source Project' });
    const titleInput = within(drawer).getByLabelText('Title');
    const descriptionInput = within(drawer).getByLabelText('Description');
    expect(titleInput).toHaveValue('Sales widgets');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Sales widgets updated');
    await userEvent.clear(descriptionInput);
    await userEvent.type(descriptionInput, 'Updated dashboard helpers');
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mocks.api.updateProject).toHaveBeenCalledWith({
        projectId: 'jtp_sales',
        title: 'Sales widgets updated',
        description: 'Updated dashboard helpers',
      });
    });
    expect(await screen.findByText('Sales widgets updated')).toBeInTheDocument();
    expect(screen.getByText('Updated dashboard helpers')).toBeInTheDocument();
    expect(screen.getByText('js-block 2')).toBeInTheDocument();
  });

  it('validates a non-empty display title before updating a project', async () => {
    mocks.api.listProjects.mockResolvedValueOnce([
      {
        id: 'jtp_sales',
        name: 'sales-widgets',
        normalizedName: 'sales-widgets',
        title: 'Sales widgets',
        description: 'Sales dashboard helpers',
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: null,
      },
    ]);
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Edit details Sales widgets' }));

    const drawer = await screen.findByRole('dialog', { name: 'Edit Source Project' });
    await userEvent.clear(within(drawer).getByLabelText('Title'));
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save' }));

    expect(await within(drawer).findByText('Title is required')).toBeInTheDocument();
    expect(mocks.api.updateProject).not.toHaveBeenCalled();
  });

  it('clears the project description without changing its technical name', async () => {
    mocks.api.listProjects.mockResolvedValueOnce([
      {
        id: 'jtp_sales',
        name: 'sales-widgets',
        normalizedName: 'sales-widgets',
        title: 'Sales widgets',
        description: 'Sales dashboard helpers',
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: null,
      },
    ]);
    mocks.api.updateProject.mockResolvedValueOnce({
      id: 'jtp_sales',
      name: 'sales-widgets',
      normalizedName: 'sales-widgets',
      title: 'Sales widgets',
      description: null,
      lifecycleStatus: 'enabled',
      healthStatus: 'ready',
      headCommitId: null,
    });
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Edit details Sales widgets' }));

    const drawer = await screen.findByRole('dialog', { name: 'Edit Source Project' });
    await userEvent.clear(within(drawer).getByLabelText('Description'));
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mocks.api.updateProject).toHaveBeenCalledWith({
        projectId: 'jtp_sales',
        title: 'Sales widgets',
        description: null,
      });
    });
    expect(mocks.api.updateProject.mock.calls[0][0]).not.toHaveProperty('name');
    expect(screen.getByText('sales-widgets')).toBeInTheDocument();
  });

  it('matches trimmed keywords across name, title, and description with a lifecycle filter', () => {
    const project = {
      id: 'jtp_sales',
      name: 'sales-widgets',
      normalizedName: 'sales-widgets',
      title: 'Sales widgets',
      description: 'Sales dashboard helpers',
      lifecycleStatus: 'enabled' as const,
      healthStatus: 'ready' as const,
      headCommitId: null,
    };

    expect(matchesJsTemplateProjectSearch(project, ' SALES ', 'all')).toBe(true);
    expect(matchesJsTemplateProjectSearch(project, 'dashboard', 'enabled')).toBe(true);
    expect(matchesJsTemplateProjectSearch(project, 'widgets', 'disabled')).toBe(false);
    expect(matchesJsTemplateProjectSearch(project, 'missing', 'all')).toBe(false);
  });

  it('filters Source Projects with the All, Enabled, and Disabled lifecycle control', async () => {
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

    await userEvent.click(screen.getByRole('combobox', { name: 'Lifecycle status' }));
    await userEvent.click(await screen.findByText('All', { selector: '.ant-select-item-option-content' }));

    expect(await screen.findByText('Enabled project')).toBeInTheDocument();
    expect(screen.getByText('Disabled project')).toBeInTheDocument();
  });

  it('refreshes list summaries after source changes are saved', async () => {
    const originalProject = {
      id: 'jtp_browser_smoke',
      name: 'browser-smoke',
      normalizedName: 'browser-smoke',
      title: 'Browser smoke',
      description: null,
      lifecycleStatus: 'enabled' as const,
      healthStatus: 'ready' as const,
      headCommitId: 'commit-1',
      templateCount: 1,
      templateKinds: { 'js-block': 1 },
    };
    mocks.api.listProjects.mockResolvedValueOnce([originalProject]).mockResolvedValueOnce([
      {
        ...originalProject,
        headCommitId: 'commit-2',
        templateCount: 2,
        templateKinds: { 'js-block': 2 },
      },
    ]);
    renderListPage('/admin/settings/js-template?projectId=jtp_browser_smoke&panel=source');

    await userEvent.click(await screen.findByRole('button', { name: 'Mock save source' }));

    await waitFor(() => expect(mocks.api.listProjects).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('js-block 2')).toBeInTheDocument();
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

  it('disables a row lifecycle switch while a batch lifecycle request for that project is pending', async () => {
    const project = createProjectSummary({ lifecycleStatus: 'enabled' });
    const lifecycleRequest = createDeferred<JsTemplateProject>();
    mocks.api.listProjects.mockResolvedValueOnce([project]);
    mocks.api.changeLifecycle.mockReturnValueOnce(lifecycleRequest.promise);
    renderListPage();

    const enabledSwitch = await screen.findByRole('switch', { name: 'Enabled Demo' });
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Demo' }));
    await userEvent.click(screen.getByRole('button', { name: /Batch actions/ }));
    await userEvent.click(await screen.findByText('Disable selected'));

    await waitFor(() => expect(mocks.api.changeLifecycle).toHaveBeenCalledTimes(1));
    expect(enabledSwitch).toBeDisabled();
    await userEvent.click(enabledSwitch);
    expect(mocks.api.changeLifecycle).toHaveBeenCalledTimes(1);

    await act(async () => {
      lifecycleRequest.resolve({ ...project, lifecycleStatus: 'disabled' });
      await lifecycleRequest.promise;
    });
    await waitFor(() => expect(enabledSwitch).not.toBeDisabled());
    expect(enabledSwitch).toHaveAttribute('aria-checked', 'false');
  });

  it('does not start a batch lifecycle request over a selected project with a pending row request', async () => {
    const project = createProjectSummary({ lifecycleStatus: 'disabled' });
    const lifecycleRequest = createDeferred<JsTemplateProject>();
    mocks.api.listProjects.mockResolvedValueOnce([project]);
    mocks.api.changeLifecycle.mockReturnValueOnce(lifecycleRequest.promise);
    renderListPage();

    const enabledSwitch = await screen.findByRole('switch', { name: 'Enabled Demo' });
    await userEvent.click(enabledSwitch);
    await waitFor(() => expect(mocks.api.changeLifecycle).toHaveBeenCalledTimes(1));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select Demo' }));

    const batchButton = screen.getByRole('button', { name: /Batch actions/ });
    expect(batchButton).toHaveClass('ant-btn-loading');
    fireEvent.click(batchButton);
    expect(screen.queryByText('Disable selected')).not.toBeInTheDocument();
    expect(mocks.api.changeLifecycle).toHaveBeenCalledTimes(1);

    await act(async () => {
      lifecycleRequest.resolve({ ...project, lifecycleStatus: 'enabled' });
      await lifecycleRequest.promise;
    });
    await waitFor(() => expect(batchButton).not.toHaveClass('ant-btn-loading'));
    expect(enabledSwitch).toHaveAttribute('aria-checked', 'true');
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
    expect(screen.getByRole('status', { name: 'Creation status' })).toHaveTextContent('Independent creation');
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

  it('changes enablement from the row switch', async () => {
    mocks.api.listProjects.mockResolvedValueOnce([
      {
        id: 'jtp_sales',
        name: 'sales-widgets',
        normalizedName: 'sales-widgets',
        title: 'Sales widgets',
        description: null,
        lifecycleStatus: 'disabled',
        healthStatus: 'ready',
        headCommitId: null,
      },
    ]);
    mocks.api.changeLifecycle.mockResolvedValueOnce({
      id: 'jtp_sales',
      name: 'sales-widgets',
      normalizedName: 'sales-widgets',
      title: 'Sales widgets',
      description: null,
      lifecycleStatus: 'enabled',
      healthStatus: 'ready',
      headCommitId: null,
    });

    renderListPage();

    const enabledSwitch = await screen.findByRole('switch', { name: 'Enabled Sales widgets' });
    expect(enabledSwitch).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(enabledSwitch);

    await waitFor(() => expect(mocks.api.changeLifecycle).toHaveBeenCalledTimes(1));
    expect(mocks.api.changeLifecycle).toHaveBeenCalledWith({ projectId: 'jtp_sales', lifecycleStatus: 'enabled' });
  });

  it('removes a project from the row action', async () => {
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
    ]);
    mocks.api.deleteProject.mockResolvedValueOnce({
      id: 'jtp_sales',
      name: 'sales-widgets',
      normalizedName: 'sales-widgets',
      title: 'Sales widgets',
      description: null,
      lifecycleStatus: 'enabled',
      healthStatus: 'ready',
      headCommitId: null,
    });

    renderListPage();

    expect(await screen.findByText('Sales widgets')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: 'Remove Sales widgets' }));
    const dialog = await screen.findByRole('dialog', { name: 'Remove this Source Project?' });
    expect(dialog).toHaveTextContent('Source Project to remove');
    expect(within(dialog).getByText('Sales widgets')).toBeInTheDocument();
    expect(within(dialog).getByText('This action cannot be undone')).toBeInTheDocument();
    expect(mocks.api.deleteProject).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(mocks.api.deleteProject).toHaveBeenCalledWith('jtp_sales'));
    await waitFor(() => expect(screen.queryByText('sales-widgets')).not.toBeInTheDocument());
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
