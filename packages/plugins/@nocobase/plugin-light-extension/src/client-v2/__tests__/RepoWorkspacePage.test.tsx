/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import type { UseLightExtensionRepoResult } from '../hooks/useLightExtensionRepo';
import LightExtensionWorkspacePage from '../pages/LightExtensionWorkspacePage';

const mocks = vi.hoisted(() => ({
  t: (key: string) => key,
  api: {
    getRepo: vi.fn(),
    pull: vi.fn(),
    pullCommit: vi.fn(),
    saveSource: vi.fn(),
    compilePreview: vi.fn(),
    scanEntries: vi.fn(),
    listCommits: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mocks.t,
  }),
}));

vi.mock('@nocobase/client-v2', () => ({
  useFullscreenOverlay: () => {
    const [placeholderEl, setPlaceholderEl] = React.useState<HTMLDivElement | null>(null);

    return {
      isFullscreen: false,
      toggleFullscreen: () => {},
      enterFullscreen: () => {},
      exitFullscreen: () => {},
      placeholderRef: setPlaceholderEl,
      placeholderStyle: {},
      container: placeholderEl,
    };
  },
}));

vi.mock('@nocobase/plugin-vsc-file/client-v2', () => {
  return {
    useVscFileT: () => mocks.t,
    FilesPanel: ({
      files,
      folders,
      onCreate,
      onCreateFolder,
      onOpen,
    }: {
      files: Array<{ path: string }>;
      folders: string[];
      onCreate: (parentPath?: string) => string | undefined;
      onCreateFolder: (parentPath?: string) => string | undefined;
      onOpen: (path: string) => void;
    }) => (
      <div data-testid="runjs-files-panel">
        <button onClick={() => onCreate('src/client')} type="button">
          New default file
        </button>
        <button onClick={() => onCreateFolder('src/client')} type="button">
          New default folder
        </button>
        {folders.map((folder) => (
          <span key={folder}>{folder}</span>
        ))}
        {files.map((file) => (
          <button key={file.path} onClick={() => onOpen(file.path)} type="button">
            {file.path.split('/').pop()}
          </button>
        ))}
      </div>
    ),
    VersionHistoryDock: ({
      historyItems,
      onSelect,
    }: {
      historyItems: Array<{ id: string; message: string; seq: number }>;
      onSelect: (commit: { id: string; message: string; seq: number }) => void;
    }) => (
      <div data-testid="runjs-history-dock">
        {historyItems.map((commit) => (
          <button key={commit.id} onClick={() => onSelect(commit)} type="button">
            Restore v{commit.seq}
          </button>
        ))}
      </div>
    ),
    CodeTab: ({
      activeFile,
      onChange,
      showRunButton,
      workspaceFiles,
    }: {
      activeFile?: { content: string; path: string };
      onChange: (value: string) => void;
      showRunButton?: boolean;
      workspaceFiles: Array<{ content: string; path: string }>;
    }) => (
      <div
        data-show-run-button={String(showRunButton)}
        data-testid="runjs-code-tab"
        data-workspace-file-contents={JSON.stringify(workspaceFiles.map((file) => [file.path, file.content]))}
        data-workspace-files={workspaceFiles.map((file) => file.path).join(',')}
      >
        {activeFile ? <span>{activeFile.path}</span> : null}
        <textarea
          aria-label="Edit file content"
          onChange={(event) => onChange(event.target.value)}
          value={activeFile?.content || ''}
        />
      </div>
    ),
    RestoreVersionModal: ({
      commit,
      onCancel,
      onRestore,
    }: {
      commit: { seq: number } | null;
      onCancel: () => void;
      onRestore: () => void;
    }) =>
      commit ? (
        <div aria-label={`Restore v${commit.seq}?`} role="dialog">
          <button onClick={onCancel} type="button">
            Cancel
          </button>
          <button onClick={onRestore} type="button">
            Restore
          </button>
        </div>
      ) : null,
    CloseConfirmModal: ({
      onCancel,
      onCloseWithoutSaving,
      open,
    }: {
      onCancel: () => void;
      onCloseWithoutSaving: () => void;
      open: boolean;
    }) =>
      open ? (
        <div aria-label="Unsaved changes" role="dialog">
          <button onClick={onCloseWithoutSaving} type="button">
            Discard changes
          </button>
          <button onClick={onCancel} type="button">
            Cancel
          </button>
        </div>
      ) : null,
  };
});

vi.mock('../hooks/useLightExtensionRepo', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useLightExtensionRepo: () => ({ ...mocks.api }) as unknown as UseLightExtensionRepoResult,
    getLightExtensionErrorDiagnostics: (error: unknown) =>
      error && typeof error === 'object' && Array.isArray((error as { diagnostics?: unknown }).diagnostics)
        ? (error as { diagnostics: unknown[] }).diagnostics
        : [],
  };
});

describe('LightExtensionWorkspacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.api.getRepo.mockResolvedValue({
      id: 'ler_sales',
      name: 'sales-widgets',
      normalizedName: 'sales-widgets',
      title: 'Sales widgets',
      version: 1,
      lifecycleStatus: 'enabled',
      healthStatus: 'draft',
      headCommitId: 'commit-1',
    });
    mocks.api.pull.mockResolvedValue({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: 1, byteSize: 45 },
      unchanged: false,
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'export default function SalesKpi() { return null; }\n',
          language: 'typescript',
          size: 50,
          blobHash: 'blob-1',
          pathHash: 'path-1',
          pathLowerHash: 'path-lower-1',
          mode: '',
        },
      ],
    });
    mocks.api.pullCommit.mockResolvedValue({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: 1, byteSize: 45 },
      unchanged: false,
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'export default function SalesKpi() { return null; }\n',
          language: 'typescript',
          size: 50,
          blobHash: 'blob-1',
          pathHash: 'path-1',
          pathLowerHash: 'path-lower-1',
          mode: '',
        },
      ],
    });
    mocks.api.saveSource.mockResolvedValue({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-2' },
      tree: { hash: 'tree-2', entryCount: 1, byteSize: 55 },
      scan: {
        repo: { id: 'ler_sales' },
        commitId: 'commit-2',
        accepted: true,
        diagnostics: [],
        entries: [],
        capabilities: {},
      },
      compile: {
        status: 'success',
        entries: [],
      },
      diagnostics: [],
    });
    mocks.api.compilePreview.mockResolvedValue({
      repo: { id: 'ler_sales' },
      commitId: 'commit-1',
      accepted: true,
      diagnostics: [],
      entries: [],
    });
    mocks.api.scanEntries.mockResolvedValue({
      repo: { id: 'ler_sales' },
      commitId: 'commit-2',
      accepted: true,
      diagnostics: [],
      entries: [
        {
          created: false,
          entry: {
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
            compiledCommitId: 'commit-2',
            runtimeArtifact: {
              code: 'ctx.render("Sales KPI");',
              version: 'v2',
              entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
            },
            runtimeVersion: 'v2',
            surfaceStyle: 'render',
            runtimeCodeHash: 'runtime_hash',
            filesHash: 'files_hash',
            settingsDefaultsHash: 'settings_defaults_hash',
            compiledAt: '2026-07-09T00:00:00.000Z',
            healthStatus: 'ready',
            diagnostics: [],
          },
        },
      ],
      capabilities: {},
    });
    mocks.api.listCommits.mockResolvedValue([]);
  });

  it('loads files and saves edited source through the light extension API', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    expect(screen.getByTestId('runjs-code-tab')).toHaveAttribute('data-show-run-button', 'false');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'export default function SalesKpi() { return "ok"; }\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => expect(mocks.api.saveSource).toHaveBeenCalledTimes(1));
    expect(mocks.api.saveSource).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: 'ler_sales',
        baseCommitId: 'commit-1',
        message: 'Update light extension source',
        allowEmptyCommit: true,
        files: [
          expect.objectContaining({
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            content: 'export default function SalesKpi() { return "ok"; }\n',
            operation: 'upsert',
          }),
        ],
      }),
    );
    expect(await screen.findByText('Source saved and compiled')).toBeInTheDocument();
  });

  it('does not reload source when hook state updates replace the hook result object', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByText('src/client/js-blocks/sales-kpi/index.tsx');
    expect(mocks.api.getRepo).toHaveBeenCalledTimes(1);
    expect(mocks.api.pull).toHaveBeenCalledTimes(1);

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(mocks.api.getRepo).toHaveBeenCalledTimes(1);
    expect(mocks.api.pull).toHaveBeenCalledTimes(1);
  });

  it('seeds an empty repository with the multi-kind light extension template and saves it as one batch', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-empty', entryCount: 0, byteSize: 0 },
      unchanged: false,
      files: [],
    });

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getAllByText('README.md').length).toBeGreaterThan(0));
    expect(screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-files')).toContain(
      'src/shared/light-extension-sdk.d.ts',
    );
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => expect(mocks.api.saveSource).toHaveBeenCalledTimes(1));
    const pushedFiles = mocks.api.saveSource.mock.calls[0][0].files;
    const pushedPaths = pushedFiles.map((file) => file.path);
    expect(pushedPaths).toEqual(
      expect.arrayContaining([
        'README.md',
        'light-extension.json',
        'tsconfig.json',
        'src/shared/format.ts',
        'src/shared/light-extension-sdk.d.ts',
        'src/client/js-blocks/sales-kpi/index.tsx',
        'src/client/js-fields/phone-link/index.tsx',
        'src/client/js-actions/show-message/index.ts',
        'src/client/js-items/row-menu-label/index.tsx',
        'src/client/runjs/normalize-form-values/index.ts',
        'src/client/events/log-page-open/index.ts',
      ]),
    );
    expect(pushedFiles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'src/client/js-fields/phone-link/index.tsx',
          content: expect.stringContaining('ctx.render(<PhoneLink />);'),
        }),
        expect.objectContaining({
          path: 'src/client/js-items/row-menu-label/index.tsx',
          content: 'ctx.render(<span>Row menu</span>);\n',
        }),
      ]),
    );
    const phoneFieldFile = pushedFiles.find((file) => file.path === 'src/client/js-fields/phone-link/index.tsx');
    expect(phoneFieldFile?.content).toContain('return <a href={"tel:" + value}>{value}</a>;');
    expect(phoneFieldFile?.content).not.toContain('ctx.readOnly');
  });

  it('creates missing repo root files from the reused default new-file entry', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    const defaultFileButton = screen.getByRole('button', { name: 'New default file' });
    fireEvent.click(defaultFileButton);
    await waitFor(() => expect(screen.getAllByText('README.md').length).toBeGreaterThan(0));
    fireEvent.click(defaultFileButton);
    await waitFor(() => expect(screen.getAllByText('light-extension.json').length).toBeGreaterThan(0));
    fireEvent.click(defaultFileButton);
    await waitFor(() => expect(screen.getAllByText('tsconfig.json').length).toBeGreaterThan(0));
    await waitFor(() =>
      expect(screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-files')).toContain(
        'src/shared/light-extension-sdk.d.ts',
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => expect(mocks.api.saveSource).toHaveBeenCalledTimes(1));
    expect(mocks.api.saveSource.mock.calls[0][0].files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'README.md',
          content: '# Light extension source\n',
          operation: 'upsert',
        }),
        expect.objectContaining({
          path: 'light-extension.json',
          content: '{\n  "schemaVersion": 1\n}\n',
          operation: 'upsert',
        }),
        expect.objectContaining({
          path: 'tsconfig.json',
          content: expect.stringContaining('@nocobase/light-extension-sdk/shared'),
          operation: 'upsert',
        }),
        expect.objectContaining({
          path: 'src/shared/light-extension-sdk.d.ts',
          content: expect.stringContaining('@nocobase/light-extension-sdk/client'),
          operation: 'upsert',
        }),
      ]),
    );
  });

  it('creates future client kind files from the reused default file entry after repo scaffolding exists', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: 5, byteSize: 180 },
      unchanged: false,
      files: [
        {
          path: 'README.md',
          content: '# Light extension source\n',
          language: 'markdown',
        },
        {
          path: 'light-extension.json',
          content: '{\n  "schemaVersion": 1\n}\n',
          language: 'json',
        },
        {
          path: 'tsconfig.json',
          content: '{}\n',
          language: 'json',
        },
        {
          path: 'src/shared/light-extension-sdk.d.ts',
          content: '',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'export default function SalesKpi() { return null; }\n',
          language: 'typescript',
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    fireEvent.click(screen.getByRole('button', { name: 'New default file' }));
    expect(await screen.findByText('src/client/js-fields/phone-link/index.tsx')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => expect(mocks.api.saveSource).toHaveBeenCalledTimes(1));
    expect(mocks.api.saveSource.mock.calls[0][0].files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'src/client/js-fields/phone-link/index.tsx',
          content: expect.stringContaining('ctx.render(<PhoneLink />);'),
          operation: 'upsert',
        }),
      ]),
    );
  });

  it('creates future client kind folders directly under src/client from the reused default folder entry', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: 5, byteSize: 180 },
      unchanged: false,
      files: [
        {
          path: 'README.md',
          content: '# Light extension source\n',
          language: 'markdown',
        },
        {
          path: 'light-extension.json',
          content: '{\n  "schemaVersion": 1\n}\n',
          language: 'json',
        },
        {
          path: 'tsconfig.json',
          content: '{}\n',
          language: 'json',
        },
        {
          path: 'src/shared/light-extension-sdk.d.ts',
          content: '',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'export default function SalesKpi() { return null; }\n',
          language: 'typescript',
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    fireEvent.click(screen.getByRole('button', { name: 'New default folder' }));
    expect(await screen.findByText('src/client/js-fields')).toBeInTheDocument();
  });

  it('injects generated multi-entry settings type files into the source workspace editor', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: 4, byteSize: 260 },
      unchanged: false,
      files: [
        {
          path: 'src/client/js-blocks/product-list/index.tsx',
          content:
            'import type { Settings } from "light-extension:settings/client/js-block/product-list";\nctx.render(null as unknown as Settings);\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/product-list/settings.json',
          content:
            '{"type":"object","properties":{"title":{"type":"string","default":"Products"},"pageSize":{"type":"integer","default":5}}}',
          language: 'json',
        },
        {
          path: 'src/client/js-blocks/order-list/index.tsx',
          content: 'ctx.render(null);\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/order-list/settings.json',
          content: '{"type":"object","properties":{"orderStatus":{"type":"string"},"limit":{"type":"integer"}}}',
          language: 'json',
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    expect(screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-files')).toContain(
      '.light-extension/types/client/js-block/product-list.d.ts',
    );
    expect(screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-files')).toContain(
      '.light-extension/types/client/js-block/order-list.d.ts',
    );
    expect(screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-files')).toContain(
      '.light-extension/types/modules.d.ts',
    );
    expect(screen.queryByRole('button', { name: /Settings type preview/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Download settings types/ })).toBeNull();
    expect(screen.queryByTestId('light-extension-settings-type-preview')).toBeNull();
    expect(screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-file-contents')).toContain(
      'orderStatus?: string;',
    );
  });

  it('overlays the current SDK shim for existing source repositories with an outdated shim', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: 3, byteSize: 260 },
      unchanged: false,
      files: [
        {
          path: 'src/shared/light-extension-sdk.d.ts',
          content:
            'declare module "@nocobase/light-extension-sdk/client" { export interface LightExtensionSettingsContext<TSettings = unknown> { settings: TSettings; } }\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/product-list/index.tsx',
          content: 'import type { Settings } from "light-extension:settings/client/js-block/product-list";\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/product-list/settings.json',
          content: '{"type":"object","properties":{"title":{"type":"string"}}}',
          language: 'json',
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    const codeTab = await screen.findByTestId('runjs-code-tab');
    const workspaceFileContents = codeTab.getAttribute('data-workspace-file-contents') || '';
    expect(workspaceFileContents).toContain('JSBlockContext');
    expect(workspaceFileContents).toContain('RunJSContext');
  });

  it('shows persisted save diagnostics after validation failure', async () => {
    mocks.api.saveSource.mockRejectedValueOnce(
      Object.assign(new Error('Light extension scan completed with validation errors'), {
        diagnostics: [
          {
            code: 'import_not_allowed',
            severity: 'error',
            message: 'Import "react" is not allowed',
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            kind: 'js-block',
            entryName: 'sales-kpi',
          },
        ],
      }),
    );

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByText('src/client/js-blocks/sales-kpi/index.tsx');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'import React from "react";\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));

    await screen.findByText('Import "react" is not allowed');
    expect(screen.getByText('import_not_allowed')).toBeInTheDocument();
  });

  it('opens diagnostic source locations after save validation failure', async () => {
    mocks.api.saveSource.mockRejectedValueOnce(
      Object.assign(new Error('Light extension source workspace is invalid'), {
        diagnostics: [
          {
            code: 'RUNJS_IMPORT_NOT_FOUND',
            severity: 'error',
            message: 'Import target was not found',
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            line: 1,
            column: 8,
            kind: 'js-block',
            entryName: 'sales-kpi',
          },
        ],
      }),
    );

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByText('src/client/js-blocks/sales-kpi/index.tsx');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'import Missing from "./missing";\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));

    expect(await screen.findByText('Import target was not found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Line 1/ }));
    expect(await screen.findByText('Opened diagnostic source')).toBeInTheDocument();
  });

  it('loads a history version through pullCommit instead of pull ref', async () => {
    mocks.api.listCommits.mockResolvedValueOnce([
      {
        id: 'commit-1',
        repoId: 'ler_sales',
        hash: 'hash-1',
        seq: 1,
        parentCommitId: null,
        treeHash: 'tree-1',
        message: 'Initial source',
        authorId: null,
        metadata: {},
        createdAt: '2026-07-07T07:12:00.000Z',
      },
    ]);
    mocks.api.pullCommit.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: 1, byteSize: 40 },
      unchanged: false,
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'export default function Restored() { return null; }\n',
          language: 'typescript',
          size: 40,
          blobHash: 'blob-history',
          pathHash: 'path-1',
          pathLowerHash: 'path-lower-1',
          mode: '',
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByText('src/client/js-blocks/sales-kpi/index.tsx');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'export default function Dirty() { return null; }\n' },
    });
    fireEvent.click(await screen.findByRole('button', { name: 'Restore v1' }));
    const dialog = await screen.findByRole('dialog', { name: 'Restore v1?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Restore' }));

    await waitFor(() => expect(mocks.api.pullCommit).toHaveBeenCalledTimes(1));
    expect(mocks.api.pullCommit).toHaveBeenCalledWith(
      expect.objectContaining({ repoId: 'ler_sales', commitId: 'commit-1', includeContent: 'all' }),
    );
    expect(mocks.api.pull).toHaveBeenCalledWith(
      expect.objectContaining({ repoId: 'ler_sales', includeContent: 'all' }),
    );
    expect(mocks.api.pull).not.toHaveBeenCalledWith(expect.objectContaining({ ref: 'commit-1' }));
    expect(screen.getByLabelText('Edit file content')).toHaveValue(
      'export default function Restored() { return null; }\n',
    );
  });
});
