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
    push: vi.fn(),
    compilePreview: vi.fn(),
    scanEntries: vi.fn(),
    listCommits: vi.fn(),
    publish: vi.fn(),
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
    FilesPanel: ({ files, onOpen }: { files: Array<{ path: string }>; onOpen: (path: string) => void }) => (
      <div data-testid="runjs-files-panel">
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
    }: {
      activeFile?: { content: string; path: string };
      onChange: (value: string) => void;
      showRunButton?: boolean;
    }) => (
      <div data-show-run-button={String(showRunButton)} data-testid="runjs-code-tab">
        {activeFile ? <span>{activeFile.path}</span> : null}
        <textarea
          aria-label="Edit file content"
          onChange={(event) => onChange(event.target.value)}
          value={activeFile?.content || ''}
        />
      </div>
    ),
    PublishModal: ({
      commitMessage,
      onCancel,
      onCommitMessageChange,
      onPublish,
      open,
    }: {
      commitMessage: string;
      onCancel: () => void;
      onCommitMessageChange: (value: string) => void;
      onPublish: () => void;
      open: boolean;
    }) =>
      open ? (
        <div aria-label="Commit message" role="dialog">
          <input
            aria-label="Commit message"
            onChange={(event) => onCommitMessageChange(event.target.value)}
            value={commitMessage}
          />
          <button onClick={onCancel} type="button">
            Cancel
          </button>
          <button disabled={!commitMessage.trim()} onClick={onPublish} type="button">
            Save
          </button>
        </div>
      ) : null,
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

vi.mock('../hooks/useLightExtensionPublications', () => ({
  useLightExtensionPublications: () => ({
    publish: mocks.api.publish,
  }),
}));

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
    mocks.api.push.mockResolvedValue({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-2' },
      tree: { hash: 'tree-2', entryCount: 1, byteSize: 55 },
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
            activePublicationId: null,
            healthStatus: 'ready',
            diagnostics: [],
          },
        },
      ],
      capabilities: {},
    });
    mocks.api.listCommits.mockResolvedValue([]);
    mocks.api.publish.mockResolvedValue({
      repo: { id: 'ler_sales' },
      commitId: 'commit-2',
      clientRequestId: 'request-1',
      status: 'success',
      httpStatus: 200,
      diagnostics: [],
      entryResults: [
        {
          entryId: 'lee_sales',
          entryName: 'sales-kpi',
          kind: 'js-block',
          status: 'created',
          diagnostics: [],
        },
      ],
    });
  });

  it('loads files and saves edited source through the light extension API', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByText('src/client/js-blocks/sales-kpi/index.tsx');
    expect(screen.getByTestId('runjs-code-tab')).toHaveAttribute('data-show-run-button', 'false');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'export default function SalesKpi() { return "ok"; }\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Commit message' });
    fireEvent.change(within(dialog).getByLabelText('Commit message'), {
      target: { value: 'Update source' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mocks.api.push).toHaveBeenCalledTimes(1));
    expect(mocks.api.push).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: 'ler_sales',
        baseCommitId: 'commit-1',
        message: 'Update source',
        files: [
          expect.objectContaining({
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            content: 'export default function SalesKpi() { return "ok"; }\n',
            operation: 'upsert',
          }),
        ],
      }),
    );
    await waitFor(() => expect(mocks.api.scanEntries).toHaveBeenCalledWith('ler_sales'));
    await waitFor(() =>
      expect(mocks.api.publish).toHaveBeenCalledWith(
        expect.objectContaining({
          repoId: 'ler_sales',
          entryIds: ['lee_sales'],
          commitId: 'commit-2',
          activate: true,
          expectedCurrentPublicationIdByEntry: {
            lee_sales: null,
          },
        }),
      ),
    );
    expect(await screen.findByText('Source saved and published')).toBeInTheDocument();
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

  it('seeds an empty repository with the default JS Block template and saves it as one batch', async () => {
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

    await screen.findByText('src/client/js-blocks/sales-kpi/index.tsx');
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    const dialog = await screen.findByRole('dialog', { name: 'Commit message' });
    fireEvent.change(within(dialog).getByLabelText('Commit message'), {
      target: { value: 'Seed source' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mocks.api.push).toHaveBeenCalledTimes(1));
    expect(mocks.api.push.mock.calls[0][0].files.map((file) => file.path)).toEqual([
      'src/client/js-blocks/sales-kpi/index.tsx',
      'src/client/js-blocks/sales-kpi/meta.json',
      'src/client/js-blocks/sales-kpi/settings.json',
    ]);
  });

  it('shows persisted save diagnostics after validation failure', async () => {
    mocks.api.push.mockRejectedValueOnce(
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
    const dialog = await screen.findByRole('dialog', { name: 'Commit message' });
    fireEvent.change(within(dialog).getByLabelText('Commit message'), {
      target: { value: 'Invalid source' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await screen.findByText('Import "react" is not allowed');
    expect(screen.getByText('import_not_allowed')).toBeInTheDocument();
  });

  it('opens diagnostic source locations after save validation failure', async () => {
    mocks.api.push.mockRejectedValueOnce(
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
    const dialog = await screen.findByRole('dialog', { name: 'Commit message' });
    fireEvent.change(within(dialog).getByLabelText('Commit message'), {
      target: { value: 'Invalid source' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

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
