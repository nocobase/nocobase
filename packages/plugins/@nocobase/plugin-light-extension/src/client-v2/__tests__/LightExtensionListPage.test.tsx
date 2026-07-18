/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import { createMockClient, type CompiledFilter } from '@nocobase/client-v2';
import { FlowEngineProvider } from '@nocobase/flow-engine';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { vi } from 'vitest';

import type { UseLightExtensionRepoResult } from '../hooks/useLightExtensionRepo';
import { LightExtensionSyncHookError, type UseLightExtensionSyncResult } from '../hooks/useLightExtensionSync';
import LightExtensionListPage, {
  LIGHT_EXTENSION_REPO_FILTER_FIELD_NAMES,
  lightExtensionRepoFilterCollection,
  matchesLightExtensionRepoFilter,
} from '../pages/LightExtensionListPage';

const mocks = vi.hoisted(() => ({
  t: (key: string) => key,
  api: {
    listRepos: vi.fn(),
    createRepo: vi.fn(),
    updateRepo: vi.fn(),
    changeLifecycle: vi.fn(),
    deleteRepo: vi.fn(),
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
}));

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    useTranslation: () => ({
      t: mocks.t,
    }),
  };
});

vi.mock('../hooks/useLightExtensionRepo', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useLightExtensionRepo: () => mocks.api as unknown as UseLightExtensionRepoResult,
  };
});

vi.mock('../hooks/useLightExtensionSync', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../hooks/useLightExtensionSync')>();
  return {
    ...actual,
    useLightExtensionSync: () => mocks.sync as unknown as UseLightExtensionSyncResult,
  };
});

vi.mock('../components/LightExtensionSyncDrawer', async () => {
  const React = await import('react');

  interface MockSyncDrawerProps {
    open: boolean;
    repo: {
      id: string;
      name: string;
      normalizedName: string;
      title: string;
      description: string | null;
      lifecycleStatus: 'enabled' | 'disabled' | 'archived';
      healthStatus: 'pending' | 'ready' | 'warning' | 'error';
      headCommitId: string | null;
    };
    configurationPanel?: React.ReactNode;
    onClose: () => void;
    onRepoUpdated: (repo: MockSyncDrawerProps['repo'] & { entryCount: number }) => void;
  }

  const MockLightExtensionSyncDrawer = (props: MockSyncDrawerProps) => {
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
            props.onRepoUpdated({
              ...props.repo,
              headCommitId: 'head-after-pull',
              entryCount: 3,
            }),
          type: 'button',
        },
        'Mock Pull result',
      ),
      React.createElement('button', { onClick: props.onClose, type: 'button' }, 'Close sync'),
    );
  };

  return { default: MockLightExtensionSyncDrawer };
});

vi.mock('../pages/LightExtensionWorkspacePage', async () => {
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
    onFooterActionsChange?: (actions: FooterActions | null) => void;
    onRequestClose?: () => void;
  };

  const MockLightExtensionWorkspacePage = ({ onFooterActionsChange, onRequestClose }: WorkspacePageProps) => {
    React.useEffect(() => {
      onFooterActionsChange?.({
        dirty: true,
        disabled: false,
        loading: false,
        onCancel: () => onRequestClose?.(),
        onSave: noop,
        requestSave: async () => 'saved',
      });

      return () => onFooterActionsChange?.(null);
    }, [onFooterActionsChange, onRequestClose]);

    return React.createElement('div', null, 'Mock source workspace');
  };

  return {
    default: MockLightExtensionWorkspacePage,
  };
});

vi.mock('../components/LightExtensionClientAppsPanel', async () => {
  const React = await import('react');
  return {
    default: ({ repoId }: { repoId: string }) =>
      React.createElement('div', { 'aria-label': 'Custom frontend applications' }, `Client apps for ${repoId}`),
  };
});

function renderListPage(
  initialEntry = '/admin/settings/light-extension',
  setupApp?: (app: ReturnType<typeof createMockClient>) => void,
) {
  const app = createMockClient();
  app.apiMock.onGet('app:getInfo').reply(200, { data: { version: 'test' } });
  setupApp?.(app);

  return render(
    <FlowEngineProvider engine={app.flowEngine}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LightExtensionListPage />
        <LocationSearch />
      </MemoryRouter>
    </FlowEngineProvider>,
  );
}

function LocationSearch() {
  return <output data-testid="location-search">{useLocation().search}</output>;
}

describe('LightExtensionListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.api.listRepos.mockResolvedValue([]);
    mocks.api.createRepo.mockResolvedValue({
      id: 'ler_browser_smoke',
      name: 'browser-smoke',
      normalizedName: 'browser-smoke',
      title: 'Browser smoke',
      description: null,
      lifecycleStatus: 'enabled',
      healthStatus: 'pending',
      headCommitId: null,
    });
    mocks.api.listCommits.mockResolvedValue([]);
    mocks.api.pull.mockResolvedValue({
      repo: { id: 'ler_browser_smoke' },
      commit: null,
      tree: null,
      unchanged: false,
      files: [],
    });
    mocks.api.deleteRepo.mockResolvedValue({
      id: 'ler_browser_smoke',
      name: 'browser-smoke',
      normalizedName: 'browser-smoke',
      title: 'Browser smoke',
      description: null,
      lifecycleStatus: 'enabled',
      healthStatus: 'pending',
      headCommitId: null,
    });
    mocks.api.updateRepo.mockResolvedValue({
      id: 'ler_browser_smoke',
      name: 'browser-smoke',
      normalizedName: 'browser-smoke',
      title: 'Browser smoke updated',
      description: 'Updated description',
      lifecycleStatus: 'enabled',
      healthStatus: 'pending',
      headCommitId: null,
    });
    mocks.sync.createFromGit.mockResolvedValue({
      repo: {
        id: 'ler_github',
        name: 'github-smoke',
        normalizedName: 'github-smoke',
        title: 'GitHub smoke',
        description: null,
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: 'github-head',
      },
      source: {
        provider: 'github',
        config: { owner: 'nocobase', repository: 'example', branch: '', subdirectory: null },
        status: 'active',
        remoteTargetVersion: 1,
        revision: 'github-head',
        credentialConfigured: false,
        authRefDisplay: null,
      },
      plan: {},
    });
    mocks.sync.testConnection.mockResolvedValue({
      ok: true,
      provider: 'github',
      config: { owner: 'nocobase', repository: 'example', branch: '', subdirectory: null },
      revision: 'github-head',
      credentialConfigured: false,
      authRefDisplay: null,
    });
    mocks.sync.configure.mockResolvedValue({
      repoId: 'ler_browser_smoke',
      source: {
        provider: 'github',
        config: { owner: 'nocobase', repository: 'example', branch: '', subdirectory: null },
        status: 'active',
        remoteTargetVersion: 1,
        revision: 'github-head',
        credentialConfigured: false,
        authRefDisplay: null,
      },
    });
  });

  it('opens the create dialog from the query parameter', async () => {
    renderListPage('/admin/settings/light-extension?create=1');

    const dialog = await screen.findByRole('dialog', { name: 'Create light extension' });
    expect((within(dialog).getByLabelText('Name') as HTMLInputElement).value).toMatch(/^l_[a-z0-9]+$/);
    await userEvent.type(within(dialog).getByLabelText('Title'), 'Browser smoke');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(mocks.api.createRepo).toHaveBeenCalledTimes(1));
    expect(mocks.api.createRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringMatching(/^l_[a-z0-9]+$/),
        title: 'Browser smoke',
        description: null,
      }),
    );
    expect(mocks.api.createRepo.mock.calls[0][0]).not.toHaveProperty('zipBase64');
    expect(await screen.findByText('Repository created and compiled')).toBeInTheDocument();
  });

  it('shows one add-new button that opens the combined create dialog', async () => {
    renderListPage();

    expect(await screen.findByRole('button', { name: /filter/i })).toBeEnabled();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Batch actions/ })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /Add new/ }));

    const dialog = await screen.findByRole('dialog', { name: 'Create light extension' });
    expect(within(dialog).getByLabelText('Title')).toBeRequired();
    expect((within(dialog).getByLabelText('Name') as HTMLInputElement).value).toMatch(/^l_[a-z0-9]+$/);
    expect(
      within(dialog).getByText('The name is generated automatically and can be changed if needed.'),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole('radio', { name: 'Template' })).toBeChecked();
    expect(within(dialog).getByRole('radio', { name: 'ZIP file' })).not.toBeChecked();
    expect(within(dialog).getByRole('radio', { name: 'GitHub source' })).not.toBeChecked();
    expect(screen.queryByText('Create empty')).not.toBeInTheDocument();
    expect(screen.queryByText('Add new from import')).not.toBeInTheDocument();
  });

  it('keeps the filter action enabled when rendered through a legacy app shell', async () => {
    renderListPage('/admin/settings/light-extension', (app) => {
      app.dataSourceManager = {
        getDataSource: vi.fn(() => ({})),
      };
    });

    expect(await screen.findByRole('button', { name: /filter/i })).toBeEnabled();
  });

  it('uploads an optional source ZIP through the combined create dialog', async () => {
    mocks.api.createRepo.mockResolvedValueOnce({
      id: 'ler_imported',
      name: 'imported-smoke',
      normalizedName: 'imported-smoke',
      title: 'Imported smoke',
      description: null,
      lifecycleStatus: 'enabled',
      healthStatus: 'pending',
      headCommitId: 'commit-import',
    });
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: /Add new/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Create light extension' });
    await userEvent.click(within(dialog).getByText('ZIP file'));
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['zip-source'], 'imported-smoke.zip', { type: 'application/zip' });

    await userEvent.upload(input, file);
    await waitFor(() =>
      expect((within(dialog).getByLabelText('Name') as HTMLInputElement).value).toMatch(/^l_[a-z0-9]+$/),
    );
    await userEvent.type(within(dialog).getByLabelText('Title'), 'Imported smoke');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(mocks.api.createRepo).toHaveBeenCalledTimes(1));
    expect(mocks.api.createRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: expect.stringMatching(/^l_[a-z0-9]+$/),
        title: 'Imported smoke',
        zipBase64: 'emlwLXNvdXJjZQ==',
      }),
    );
    expect(await screen.findByText('Repository imported and compiled')).toBeInTheDocument();
  });

  it('creates from GitHub with an exclusive safe source payload and updates the URL', async () => {
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: /Add new/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Create light extension' });
    await userEvent.type(within(dialog).getByLabelText('Title'), 'GitHub smoke');
    await userEvent.click(within(dialog).getByText('GitHub source'));
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'GitHub repository' }), 'nocobase/example');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(mocks.sync.createFromGit).toHaveBeenCalledTimes(1));
    expect(mocks.sync.createFromGit).toHaveBeenCalledWith({
      name: expect.stringMatching(/^l_[a-z0-9]+$/),
      title: 'GitHub smoke',
      description: null,
      provider: 'github',
      config: {
        owner: 'nocobase',
        repository: 'example',
        branch: '',
        subdirectory: null,
      },
    });
    expect(mocks.sync.createFromGit.mock.calls[0][0]).not.toHaveProperty('zipBase64');
    expect(mocks.api.createRepo).not.toHaveBeenCalled();
    expect(await screen.findByText('GitHub smoke')).toBeInTheDocument();
    expect(screen.getByTestId('location-search')).toHaveTextContent('repoId=ler_github');
  });

  it('keeps GitHub create configuration in the modal when the request fails', async () => {
    mocks.sync.createFromGit.mockRejectedValueOnce(new Error('GitHub source could not be created'));
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: /Add new/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Create light extension' });
    await userEvent.type(within(dialog).getByLabelText('Title'), 'GitHub smoke');
    await userEvent.click(within(dialog).getByText('GitHub source'));
    const repositoryInput = within(dialog).getByRole('textbox', { name: 'GitHub repository' });
    await userEvent.type(repositoryInput, 'nocobase/example');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    expect(await screen.findByText('GitHub source could not be created')).toBeInTheDocument();
    expect(screen.getByRole('dialog', { name: 'Create light extension' })).toBeInTheDocument();
    expect(repositoryInput).toHaveValue('nocobase/example');
  });

  it('shows an actionable message instead of a raw GitHub rate-limit error code', async () => {
    mocks.sync.createFromGit.mockRejectedValueOnce(
      new LightExtensionSyncHookError({
        operation: 'createFromGit',
        code: 'LIGHT_EXTENSION_SYNC_RATE_LIMITED',
        status: 429,
        message: 'LIGHT_EXTENSION_SYNC_RATE_LIMITED',
      }),
    );
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: /Add new/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Create light extension' });
    await userEvent.type(within(dialog).getByLabelText('Title'), 'GitHub rate limit');
    await userEvent.click(within(dialog).getByText('GitHub source'));
    await userEvent.type(within(dialog).getByRole('textbox', { name: 'GitHub repository' }), 'nocobase/example');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    expect(
      await screen.findByText('GitHub API rate limit reached. Try again later or configure a GitHub token.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('LIGHT_EXTENSION_SYNC_RATE_LIMITED')).not.toBeInTheDocument();
  });

  it('shows repository details directly in the table without detail or diagnostics actions', async () => {
    mocks.api.listRepos.mockResolvedValueOnce([
      {
        id: 'ler_sales',
        name: 'sales-widgets',
        normalizedName: 'sales-widgets',
        title: 'Sales widgets',
        description: 'Sales dashboard helpers',
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: 'commit-1234567890',
        entryCount: 4,
        entryKinds: {
          'js-block': 1,
          'js-action': 1,
          runjs: 2,
        },
        createdAt: '2026-07-08T00:00:00.000Z',
        updatedAt: '2026-07-09T00:00:00.000Z',
        lastCompiledAt: '2026-07-09T00:00:00.000Z',
      },
    ]);
    renderListPage();

    expect(await screen.findByText('Sales widgets')).toBeInTheDocument();
    expect(screen.getByText('Sales dashboard helpers')).toBeInTheDocument();
    expect(screen.getByText('js-block 1')).toBeInTheDocument();
    expect(screen.getByText('js-action 1')).toBeInTheDocument();
    expect(screen.getByText('runjs 2')).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: 'Status' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'View details' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Reference contract diagnostics' })).not.toBeInTheDocument();

    const row = screen.getByText('Sales widgets').closest('tr');
    if (!row) {
      throw new Error('Expected the light extension table row to be rendered');
    }
    const sourceAction = within(row).getByRole('button', { name: 'Edit code' });
    const syncAction = within(row).getByRole('button', { name: 'Sync code' });
    const clientAppAction = within(row).getByRole('button', { name: 'Custom frontend Sales widgets' });
    const editAction = within(row).getByRole('button', { name: 'Edit details Sales widgets' });
    const removeAction = within(row).getByRole('button', { name: 'Remove' });
    expect(sourceAction).toHaveClass('ant-btn-link');
    expect(sourceAction).toHaveTextContent('Edit code');
    expect(syncAction).toHaveClass('ant-btn-link');
    expect(syncAction).toHaveTextContent('Sync code');
    expect(clientAppAction).toHaveClass('ant-btn-link');
    expect(clientAppAction).toHaveTextContent('Custom frontend');
    expect(editAction).toHaveClass('ant-btn-link');
    expect(editAction).toHaveTextContent('Edit details');
    expect(removeAction).toHaveClass('ant-btn-link');
    expect(removeAction).toHaveTextContent('Remove');
    expect(sourceAction.querySelector('.anticon')).not.toBeInTheDocument();
    expect(syncAction.querySelector('.anticon')).not.toBeInTheDocument();
    expect(clientAppAction.querySelector('.anticon')).not.toBeInTheDocument();
    expect(editAction.querySelector('.anticon')).not.toBeInTheDocument();
    expect(removeAction.querySelector('.anticon')).not.toBeInTheDocument();
    expect(
      within(row)
        .getAllByRole('button')
        .map((button) => button.textContent),
    ).toEqual(['Edit code', 'Sync code', 'Custom frontend', 'Edit details', 'Remove']);
  });

  it('opens client-app management separately from the RunJS source workspace', async () => {
    mocks.api.listRepos.mockResolvedValueOnce([
      {
        id: 'ler_customer',
        name: 'customer',
        normalizedName: 'customer',
        title: 'Customer',
        description: null,
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: 'commit-1',
      },
    ]);
    renderListPage('/admin/settings/light-extension?view=compact');

    await userEvent.click(await screen.findByRole('button', { name: 'Custom frontend Customer' }));

    expect(await screen.findByLabelText('Custom frontend applications')).toHaveTextContent(
      'Client apps for ler_customer',
    );
    expect(screen.queryByText('Mock source workspace')).not.toBeInTheDocument();
    expect(screen.getByTestId('location-search')).toHaveTextContent('panel=client-apps');
    expect(screen.getByTestId('location-search')).toHaveTextContent('repoId=ler_customer');
  });

  it('restores the Sync code drawer directly from URL state', async () => {
    mocks.api.listRepos.mockResolvedValueOnce([
      {
        id: 'ler_browser_smoke',
        name: 'browser-smoke',
        normalizedName: 'browser-smoke',
        title: 'Browser smoke',
        description: null,
        lifecycleStatus: 'enabled',
        healthStatus: 'pending',
        headCommitId: 'commit-1',
      },
    ]);

    renderListPage('/admin/settings/light-extension?repoId=ler_browser_smoke&panel=sync');

    expect(await screen.findByRole('dialog', { name: 'Sync code' })).toBeInTheDocument();
    expect(screen.queryByText('Mock source workspace')).not.toBeInTheDocument();
  });

  it('opens Sync code from its row action, preserves unrelated query values, and wires GitHub configuration', async () => {
    mocks.api.listRepos.mockResolvedValueOnce([
      {
        id: 'ler_browser_smoke',
        name: 'browser-smoke',
        normalizedName: 'browser-smoke',
        title: 'Browser smoke',
        description: null,
        lifecycleStatus: 'enabled',
        healthStatus: 'pending',
        headCommitId: 'commit-1',
      },
    ]);
    renderListPage('/admin/settings/light-extension?view=compact');

    await userEvent.click(await screen.findByRole('button', { name: 'Sync code' }));
    const drawer = await screen.findByRole('dialog', { name: 'Sync code' });
    expect(screen.getByTestId('location-search')).toHaveTextContent('view=compact');
    expect(screen.getByTestId('location-search')).toHaveTextContent('repoId=ler_browser_smoke');
    expect(screen.getByTestId('location-search')).toHaveTextContent('panel=sync');

    await userEvent.type(within(drawer).getByRole('textbox', { name: 'GitHub repository' }), 'nocobase/example');
    await userEvent.click(within(drawer).getByRole('button', { name: 'Test connection' }));
    await waitFor(() =>
      expect(mocks.sync.testConnection).toHaveBeenCalledWith({
        repoId: 'ler_browser_smoke',
        provider: 'github',
        config: { owner: 'nocobase', repository: 'example', branch: '', subdirectory: null },
      }),
    );
    expect(await within(drawer).findByText('Connection successful')).toBeInTheDocument();

    await userEvent.click(within(drawer).getByRole('button', { name: 'Configure' }));
    await waitFor(() => expect(mocks.sync.configure).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'GitHub repository' })).toHaveValue(''));

    const refreshedDrawer = await screen.findByRole('dialog', { name: 'Sync code' });
    await userEvent.click(within(refreshedDrawer).getByRole('button', { name: 'Close sync' }));
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Sync code' })).not.toBeInTheDocument());
    expect(screen.getByTestId('location-search')).toHaveTextContent('view=compact');
    expect(screen.getByTestId('location-search')).toHaveTextContent('repoId=ler_browser_smoke');
    expect(screen.getByTestId('location-search')).not.toHaveTextContent('panel=sync');
  });

  it('refreshes list summaries from the server after a sync operation returns an updated repository', async () => {
    const originalRepo = {
      id: 'ler_browser_smoke',
      name: 'browser-smoke',
      normalizedName: 'browser-smoke',
      title: 'Browser smoke',
      description: null,
      lifecycleStatus: 'enabled' as const,
      healthStatus: 'ready' as const,
      headCommitId: 'commit-1',
      entryCount: 1,
      entryKinds: { 'js-block': 1 },
    };
    mocks.api.listRepos.mockResolvedValueOnce([originalRepo]).mockResolvedValueOnce([
      {
        ...originalRepo,
        headCommitId: 'head-after-pull',
        entryCount: 3,
        entryKinds: { 'js-block': 3 },
      },
    ]);
    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Sync code' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Mock Pull result' }));

    await waitFor(() => expect(mocks.api.listRepos).toHaveBeenCalledTimes(2));
    expect(await screen.findByText('js-block 3')).toBeInTheDocument();
  });

  it('edits the repository display name and description in a drawer and refreshes the row immediately', async () => {
    mocks.api.listRepos.mockResolvedValueOnce([
      {
        id: 'ler_sales',
        name: 'sales-widgets',
        normalizedName: 'sales-widgets',
        title: 'Sales widgets',
        description: 'Sales dashboard helpers',
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: null,
        entryCount: 2,
        entryKinds: {
          'js-block': 2,
        },
      },
    ]);
    mocks.api.updateRepo.mockResolvedValueOnce({
      id: 'ler_sales',
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

    const drawer = await screen.findByRole('dialog', { name: 'Edit light extension' });
    const titleInput = within(drawer).getByLabelText('Title');
    const descriptionInput = within(drawer).getByLabelText('Description');
    expect(titleInput).toHaveValue('Sales widgets');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Sales widgets updated');
    await userEvent.clear(descriptionInput);
    await userEvent.type(descriptionInput, 'Updated dashboard helpers');
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mocks.api.updateRepo).toHaveBeenCalledWith({
        repoId: 'ler_sales',
        title: 'Sales widgets updated',
        description: 'Updated dashboard helpers',
      });
    });
    expect(await screen.findByText('Sales widgets updated')).toBeInTheDocument();
    expect(screen.getByText('Updated dashboard helpers')).toBeInTheDocument();
    expect(screen.getByText('js-block 2')).toBeInTheDocument();
  });

  it('validates a non-empty display title before updating a repository', async () => {
    mocks.api.listRepos.mockResolvedValueOnce([
      {
        id: 'ler_sales',
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

    const drawer = await screen.findByRole('dialog', { name: 'Edit light extension' });
    await userEvent.clear(within(drawer).getByLabelText('Title'));
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save' }));

    expect(await within(drawer).findByText('Title is required')).toBeInTheDocument();
    expect(mocks.api.updateRepo).not.toHaveBeenCalled();
  });

  it('clears the repository description without changing its technical name', async () => {
    mocks.api.listRepos.mockResolvedValueOnce([
      {
        id: 'ler_sales',
        name: 'sales-widgets',
        normalizedName: 'sales-widgets',
        title: 'Sales widgets',
        description: 'Sales dashboard helpers',
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: null,
      },
    ]);
    mocks.api.updateRepo.mockResolvedValueOnce({
      id: 'ler_sales',
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

    const drawer = await screen.findByRole('dialog', { name: 'Edit light extension' });
    await userEvent.clear(within(drawer).getByLabelText('Description'));
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mocks.api.updateRepo).toHaveBeenCalledWith({
        repoId: 'ler_sales',
        title: 'Sales widgets',
        description: null,
      });
    });
    expect(mocks.api.updateRepo.mock.calls[0][0]).not.toHaveProperty('name');
    expect(screen.getByText('sales-widgets')).toBeInTheDocument();
  });

  it('makes every data column sortable except actions', async () => {
    mocks.api.listRepos.mockResolvedValueOnce([
      {
        id: 'ler_zeta',
        name: 'zeta-widgets',
        normalizedName: 'zeta-widgets',
        title: 'Zeta widgets',
        description: 'Second description',
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: null,
        entryCount: 2,
        createdAt: '2026-07-09T00:00:00.000Z',
        updatedAt: '2026-07-10T00:00:00.000Z',
      },
      {
        id: 'ler_alpha',
        name: 'alpha-widgets',
        normalizedName: 'alpha-widgets',
        title: 'Alpha widgets',
        description: 'First description',
        lifecycleStatus: 'disabled',
        healthStatus: 'ready',
        headCommitId: null,
        entryCount: 1,
        createdAt: '2026-07-08T00:00:00.000Z',
        updatedAt: '2026-07-09T00:00:00.000Z',
      },
    ]);
    renderListPage();

    expect(await screen.findByText('Zeta widgets')).toBeInTheDocument();
    expect(document.querySelectorAll('th.ant-table-column-has-sorters')).toHaveLength(5);
    expect(screen.getByRole('columnheader', { name: 'Actions' })).not.toHaveClass('ant-table-column-has-sorters');

    await userEvent.click(screen.getByText('Title'));

    await waitFor(() => {
      const dataRows = screen.getAllByRole('row').slice(1);
      expect(within(dataRows[0]).getByText('Alpha widgets')).toBeInTheDocument();
    });
  });

  it('provides the requested repository filters and evaluates their values', () => {
    expect(LIGHT_EXTENSION_REPO_FILTER_FIELD_NAMES).toEqual([
      'name',
      'description',
      'updatedAt',
      'createdAt',
      'enabled',
    ]);
    expect(lightExtensionRepoFilterCollection.fields?.map((field) => field.name)).toEqual(
      LIGHT_EXTENSION_REPO_FILTER_FIELD_NAMES,
    );

    const repo = {
      id: 'ler_sales',
      name: 'sales-widgets',
      normalizedName: 'sales-widgets',
      title: 'Sales widgets',
      description: 'Sales dashboard helpers',
      lifecycleStatus: 'enabled' as const,
      healthStatus: 'ready' as const,
      headCommitId: null,
      createdAt: '2026-07-08T06:00:00.000Z',
      updatedAt: '2026-07-09T08:00:00.000Z',
    };
    const filter: CompiledFilter = {
      $and: [
        { name: { $includes: 'sales' } },
        { description: { $includes: 'dashboard' } },
        { updatedAt: { $dateOn: '2026-07-09' } },
        { createdAt: { $dateBefore: '2026-07-09' } },
        { enabled: { $isTruly: true } },
      ],
    };

    expect(matchesLightExtensionRepoFilter(repo, filter)).toBe(true);
    expect(matchesLightExtensionRepoFilter(repo, { enabled: { $isFalsy: true } })).toBe(false);
  });

  it('opens the source workspace drawer as a large side panel', async () => {
    mocks.api.listRepos.mockResolvedValueOnce([
      {
        id: 'ler_browser_smoke',
        name: 'browser-smoke',
        normalizedName: 'browser-smoke',
        title: 'Browser smoke',
        description: null,
        lifecycleStatus: 'enabled',
        healthStatus: 'pending',
        headCommitId: 'commit-1',
      },
    ]);
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_browser_smoke' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: 1, byteSize: 10 },
      unchanged: false,
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'export default function SalesKpiBlock() { return null; }\n',
          language: 'typescript',
          size: 10,
          blobHash: 'blob-1',
          pathHash: 'path-1',
          pathLowerHash: 'path-lower-1',
          mode: '',
        },
      ],
    });

    renderListPage('/admin/settings/light-extension?repoId=ler_browser_smoke&panel=source');

    await screen.findByText('Mock source workspace');
    await waitFor(() => {
      expect(document.querySelector('.ant-drawer-content-wrapper')).toHaveStyle({
        width: 'min(1280px, calc(100vw - 64px))',
      });
    });

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => {
      expect(document.querySelector('.ant-drawer-open')).not.toBeInTheDocument();
    });
  });

  it('supports multi-select batch enablement changes', async () => {
    mocks.api.listRepos.mockResolvedValueOnce([
      {
        id: 'ler_sales',
        name: 'sales-widgets',
        normalizedName: 'sales-widgets',
        title: 'Sales widgets',
        description: null,
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: null,
      },
      {
        id: 'ler_ops',
        name: 'ops-widgets',
        normalizedName: 'ops-widgets',
        title: 'Ops widgets',
        description: null,
        lifecycleStatus: 'enabled',
        healthStatus: 'pending',
        headCommitId: null,
      },
    ]);
    mocks.api.changeLifecycle.mockImplementation(async ({ repoId, lifecycleStatus }) => ({
      id: repoId,
      name: repoId,
      normalizedName: repoId,
      title: repoId,
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
    expect(mocks.api.changeLifecycle).toHaveBeenCalledWith({ repoId: 'ler_sales', lifecycleStatus: 'disabled' });
    expect(mocks.api.changeLifecycle).toHaveBeenCalledWith({ repoId: 'ler_ops', lifecycleStatus: 'disabled' });
  });

  it('changes enablement from the row switch', async () => {
    mocks.api.listRepos.mockResolvedValueOnce([
      {
        id: 'ler_sales',
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
      id: 'ler_sales',
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
    expect(mocks.api.changeLifecycle).toHaveBeenCalledWith({ repoId: 'ler_sales', lifecycleStatus: 'enabled' });
  });

  it('removes a repository from the row action', async () => {
    mocks.api.listRepos.mockResolvedValueOnce([
      {
        id: 'ler_sales',
        name: 'sales-widgets',
        normalizedName: 'sales-widgets',
        title: 'Sales widgets',
        description: null,
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: null,
      },
    ]);
    mocks.api.deleteRepo.mockResolvedValueOnce({
      id: 'ler_sales',
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
    await userEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    const dialog = await screen.findByRole('dialog', { name: 'Remove this repository?' });
    expect(dialog).toHaveTextContent('Repository to remove');
    expect(within(dialog).getByText('Sales widgets')).toBeInTheDocument();
    expect(within(dialog).getByText('This action cannot be undone')).toBeInTheDocument();
    expect(mocks.api.deleteRepo).not.toHaveBeenCalled();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove' }));

    await waitFor(() => expect(mocks.api.deleteRepo).toHaveBeenCalledWith('ler_sales'));
    await waitFor(() => expect(screen.queryByText('sales-widgets')).not.toBeInTheDocument());
  });
});
