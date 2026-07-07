/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { render, screen, waitFor, within } from '@testing-library/react';
import { createMockClient } from '@nocobase/client-v2';
import { FlowEngineProvider } from '@nocobase/flow-engine';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import type { UseLightExtensionRepoResult } from '../hooks/useLightExtensionRepo';
import LightExtensionListPage from '../pages/LightExtensionListPage';

const mocks = vi.hoisted(() => ({
  t: (key: string) => key,
  api: {
    listRepos: vi.fn(),
    createRepo: vi.fn(),
    getRepo: vi.fn(),
    changeLifecycle: vi.fn(),
    archiveRepo: vi.fn(),
    deleteRepo: vi.fn(),
    listEntries: vi.fn(),
    listCommits: vi.fn(),
    pull: vi.fn(),
    scanEntries: vi.fn(),
    listPublications: vi.fn(),
    publish: vi.fn(),
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

vi.mock('../hooks/useLightExtensionPublications', () => ({
  useLightExtensionPublications: () => ({
    listPublications: mocks.api.listPublications,
    publish: mocks.api.publish,
  }),
}));

vi.mock('../pages/LightExtensionWorkspacePage', async () => {
  const React = await import('react');
  const noop = () => undefined;

  type FooterActions = {
    disabled: boolean;
    loading: boolean;
    onCancel: () => void;
    onSave: () => void;
  };
  type WorkspacePageProps = {
    onFooterActionsChange?: (actions: FooterActions | null) => void;
    onRequestClose?: () => void;
  };

  const MockLightExtensionWorkspacePage = ({ onFooterActionsChange }: WorkspacePageProps) => {
    React.useEffect(() => {
      onFooterActionsChange?.({
        disabled: false,
        loading: false,
        onCancel: noop,
        onSave: noop,
      });

      return () => onFooterActionsChange?.(null);
    }, [onFooterActionsChange]);

    return React.createElement('div', null, 'Mock source workspace');
  };

  return {
    default: MockLightExtensionWorkspacePage,
  };
});

function renderListPage(initialEntry = '/admin/settings/light-extension') {
  const app = createMockClient();
  app.apiMock.onGet('app:getInfo').reply(200, { data: { version: 'test' } });

  return render(
    <FlowEngineProvider engine={app.flowEngine}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <LightExtensionListPage />
      </MemoryRouter>
    </FlowEngineProvider>,
  );
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
      version: 1,
      lifecycleStatus: 'enabled',
      healthStatus: 'draft',
      headCommitId: null,
    });
    mocks.api.getRepo.mockResolvedValue({
      id: 'ler_browser_smoke',
      name: 'browser-smoke',
      normalizedName: 'browser-smoke',
      title: 'Browser smoke',
      description: null,
      version: 1,
      lifecycleStatus: 'enabled',
      healthStatus: 'draft',
      headCommitId: null,
    });
    mocks.api.listEntries.mockResolvedValue([]);
    mocks.api.listCommits.mockResolvedValue([]);
    mocks.api.pull.mockResolvedValue({
      repo: { id: 'ler_browser_smoke' },
      commit: null,
      tree: null,
      unchanged: false,
      files: [],
    });
    mocks.api.scanEntries.mockResolvedValue({
      repo: { id: 'ler_browser_smoke' },
      commitId: null,
      accepted: true,
      diagnostics: [],
      entries: [],
      capabilities: {},
    });
    mocks.api.listPublications.mockResolvedValue([]);
    mocks.api.publish.mockResolvedValue({
      repo: { id: 'ler_browser_smoke' },
      commitId: 'commit-1',
      clientRequestId: 'request-1',
      status: 'success',
      httpStatus: 200,
      diagnostics: [],
      entryResults: [],
    });
    mocks.api.deleteRepo.mockResolvedValue({ deleted: true, repoId: 'ler_browser_smoke' });
  });

  it('opens the create dialog from the query parameter', async () => {
    renderListPage('/admin/settings/light-extension?create=1');

    const dialog = await screen.findByRole('dialog', { name: 'Create light extension' });
    await userEvent.type(within(dialog).getByLabelText('Name'), 'browser-smoke');
    await userEvent.type(within(dialog).getByLabelText('Title'), 'Browser smoke');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Create' }));

    await waitFor(() => expect(mocks.api.createRepo).toHaveBeenCalledTimes(1));
    expect(mocks.api.createRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'browser-smoke',
        title: 'Browser smoke',
        description: null,
        initialFiles: [],
      }),
    );
  });

  it('shows the standard settings toolbar with filter, refresh, and add-new import actions', async () => {
    renderListPage();

    expect(await screen.findByText('Filter')).toBeInTheDocument();
    expect(screen.getByText('Refresh')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Batch actions/ })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: /Add new/ }));

    expect(await screen.findByText('Create empty')).toBeInTheDocument();
    expect(await screen.findByText('Add new from import')).toBeInTheDocument();
  });

  it('imports a JS Block package and publishes the active entry', async () => {
    mocks.api.createRepo.mockResolvedValueOnce({
      id: 'ler_imported',
      name: 'imported-smoke-import',
      normalizedName: 'imported-smoke-import',
      title: 'Imported smoke',
      description: null,
      version: 1,
      lifecycleStatus: 'enabled',
      healthStatus: 'draft',
      headCommitId: 'commit-import',
    });
    mocks.api.scanEntries.mockResolvedValueOnce({
      repo: { id: 'ler_imported' },
      commitId: 'commit-import',
      accepted: true,
      diagnostics: [],
      entries: [
        {
          created: true,
          entry: {
            id: 'lee_imported',
            repoId: 'ler_imported',
            target: 'client',
            kind: 'js-block',
            entryName: 'imported-smoke',
            entryPath: 'src/client/js-blocks/imported-smoke/index.tsx',
            metaPath: 'src/client/js-blocks/imported-smoke/meta.json',
            settingsPath: null,
            title: 'Imported smoke',
            description: null,
            category: null,
            icon: null,
            tags: null,
            sort: null,
            settingsSchema: null,
            activePublicationId: null,
            healthStatus: 'ready',
            diagnostics: [],
          },
        },
      ],
      capabilities: {},
    });

    renderListPage();

    await userEvent.click(await screen.findByRole('button', { name: /Add new/ }));
    await userEvent.click(await screen.findByText('Add new from import'));
    const dialog = await screen.findByRole('dialog', { name: 'Add new from import' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(
      [
        JSON.stringify({
          repo: {
            name: 'imported-smoke',
            title: 'Imported smoke',
          },
          files: [
            {
              path: 'src/client/js-blocks/imported-smoke/index.tsx',
              content: 'ctx.render(<div>Imported smoke block</div>);',
              language: 'typescript',
            },
            {
              path: 'src/client/js-blocks/imported-smoke/meta.json',
              content: '{"title":"Imported smoke"}',
              language: 'json',
            },
          ],
        }),
      ],
      'imported-smoke.json',
      { type: 'application/json' },
    );

    await userEvent.upload(input, file);
    await waitFor(() => expect(within(dialog).getByLabelText('Name')).toHaveValue('imported-smoke-import'));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Import' }));

    await waitFor(() => expect(mocks.api.createRepo).toHaveBeenCalledTimes(1));
    expect(mocks.api.createRepo).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'imported-smoke-import',
        initialFiles: expect.arrayContaining([
          expect.objectContaining({
            path: 'src/client/js-blocks/imported-smoke/index.tsx',
            content: 'ctx.render(<div>Imported smoke block</div>);',
          }),
        ]),
      }),
    );
    expect(mocks.api.scanEntries).toHaveBeenCalledWith('ler_imported');
    expect(mocks.api.publish).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: 'ler_imported',
        entryIds: ['lee_imported'],
        commitId: 'commit-import',
        activate: true,
        expectedCurrentPublicationIdByEntry: {
          lee_imported: null,
        },
      }),
    );
    expect(await screen.findByText('Repository imported and published')).toBeInTheDocument();
  });

  it('opens repository overview in a drawer from the view action', async () => {
    mocks.api.listRepos.mockResolvedValueOnce([
      {
        id: 'ler_sales',
        name: 'sales-widgets',
        normalizedName: 'sales-widgets',
        title: 'Sales widgets',
        description: 'Sales dashboard helpers',
        version: 1,
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: 'commit-1234567890',
      },
    ]);
    mocks.api.getRepo.mockResolvedValueOnce({
      id: 'ler_sales',
      name: 'sales-widgets',
      normalizedName: 'sales-widgets',
      title: 'Sales widgets',
      description: 'Sales dashboard helpers',
      version: 1,
      lifecycleStatus: 'enabled',
      healthStatus: 'ready',
      headCommitId: 'commit-1234567890',
    });
    mocks.api.listEntries.mockResolvedValueOnce([
      {
        id: 'lee_sales',
        repoId: 'ler_sales',
        target: 'client',
        kind: 'js-block',
        entryName: 'sales-kpi',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        metaPath: null,
        settingsPath: null,
        title: 'Sales KPI',
        description: null,
        category: null,
        icon: null,
        tags: null,
        sort: null,
        settingsSchema: null,
        activePublicationId: 'lep_sales',
        healthStatus: 'ready',
        diagnostics: [],
      },
    ]);
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1234567890' },
      tree: { hash: 'tree-1', entryCount: 1, byteSize: 10 },
      unchanged: false,
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          language: 'typescript',
          size: 10,
          blobHash: 'blob-1',
          pathHash: 'path-1',
          pathLowerHash: 'path-lower-1',
          mode: '',
        },
      ],
    });
    mocks.api.listPublications.mockResolvedValueOnce([{ id: 'lep_sales', entryId: 'lee_sales', repoId: 'ler_sales' }]);

    renderListPage();

    expect(await screen.findByRole('button', { name: /Add new/ })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Export' })).toBeInTheDocument();
    expect(screen.queryByText('Light extension repositories')).not.toBeInTheDocument();
    expect(screen.queryByText('Core settings only')).not.toBeInTheDocument();
    expect(screen.queryByText('Repository overview')).not.toBeInTheDocument();
    expect(screen.queryByText('Ready')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Entries' })).not.toBeInTheDocument();

    await userEvent.click(await screen.findByRole('button', { name: 'View details' }));

    expect(await screen.findByText('Repository overview')).toBeInTheDocument();
    expect(await screen.findAllByText('Sales widgets')).toHaveLength(2);
    expect(await screen.findByText('src')).toBeInTheDocument();
  });

  it('opens the source workspace drawer as a large side panel', async () => {
    mocks.api.listRepos.mockResolvedValueOnce([
      {
        id: 'ler_browser_smoke',
        name: 'browser-smoke',
        normalizedName: 'browser-smoke',
        title: 'Browser smoke',
        description: null,
        version: 1,
        lifecycleStatus: 'enabled',
        healthStatus: 'draft',
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
        version: 1,
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
        version: 1,
        lifecycleStatus: 'enabled',
        healthStatus: 'draft',
        headCommitId: null,
      },
    ]);
    mocks.api.changeLifecycle.mockImplementation(async ({ repoId, lifecycleStatus }) => ({
      id: repoId,
      name: repoId,
      normalizedName: repoId,
      title: repoId,
      description: null,
      version: 2,
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
    expect(mocks.api.changeLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ repoId: 'ler_sales', lifecycleStatus: 'disabled' }),
    );
    expect(mocks.api.changeLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ repoId: 'ler_ops', lifecycleStatus: 'disabled' }),
    );
  });

  it('changes enablement from the row switch', async () => {
    mocks.api.listRepos.mockResolvedValueOnce([
      {
        id: 'ler_sales',
        name: 'sales-widgets',
        normalizedName: 'sales-widgets',
        title: 'Sales widgets',
        description: null,
        version: 1,
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
      version: 2,
      lifecycleStatus: 'enabled',
      healthStatus: 'ready',
      headCommitId: null,
    });

    renderListPage();

    const enabledSwitch = await screen.findByRole('switch', { name: 'Enabled Sales widgets' });
    expect(enabledSwitch).toHaveAttribute('aria-checked', 'false');

    await userEvent.click(enabledSwitch);

    await waitFor(() => expect(mocks.api.changeLifecycle).toHaveBeenCalledTimes(1));
    expect(mocks.api.changeLifecycle).toHaveBeenCalledWith(
      expect.objectContaining({ repoId: 'ler_sales', lifecycleStatus: 'enabled' }),
    );
  });

  it('removes a repository from the row action', async () => {
    mocks.api.listRepos.mockResolvedValueOnce([
      {
        id: 'ler_sales',
        name: 'sales-widgets',
        normalizedName: 'sales-widgets',
        title: 'Sales widgets',
        description: null,
        version: 1,
        lifecycleStatus: 'enabled',
        healthStatus: 'ready',
        headCommitId: null,
      },
    ]);
    mocks.api.deleteRepo.mockResolvedValueOnce({ deleted: true, repoId: 'ler_sales' });

    renderListPage();

    expect(await screen.findByText('Sales widgets')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: 'Remove' }));
    expect(await screen.findByText('Remove this repository?')).toBeInTheDocument();

    const removeButtons = await screen.findAllByRole('button', { name: 'Remove' });
    await userEvent.click(removeButtons[removeButtons.length - 1]);

    await waitFor(() => expect(mocks.api.deleteRepo).toHaveBeenCalledWith('ler_sales'));
    await waitFor(() => expect(screen.queryByText('Sales widgets')).not.toBeInTheDocument());
  });
});
