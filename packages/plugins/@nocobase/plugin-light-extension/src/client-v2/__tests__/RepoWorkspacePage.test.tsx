/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Modal, message } from 'antd';
import { LIGHT_EXTENSION_ENTRY_SCHEMA_URI } from '@nocobase/light-extension-sdk/schema';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES } from '../../shared/default-template';
import { LightExtensionHookError, type UseLightExtensionRepoResult } from '../hooks/useLightExtensionRepo';
import LightExtensionWorkspacePage, {
  type LightExtensionWorkspaceFooterActions,
} from '../pages/LightExtensionWorkspacePage';
import type { LightExtensionWorkspaceScope } from '../workspace/lightExtensionWorkspaceAccess';

const mocks = vi.hoisted(() => ({
  t: (key: string) => key,
  api: {
    getRepo: vi.fn(),
    inspectSourceArchive: vi.fn(),
    pull: vi.fn(),
    pullCommit: vi.fn(),
    saveSource: vi.fn(),
    compileWorkspacePreview: vi.fn(),
    listCommits: vi.fn(),
  },
  archive: {
    buildLightExtensionWorkspaceArchiveFileName: vi.fn(() => 'sales-widgets.zip'),
    createLightExtensionWorkspaceArchive: vi.fn(),
    downloadLightExtensionWorkspaceArchive: vi.fn(() => true),
    readLightExtensionWorkspaceArchive: vi.fn(),
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

vi.mock('../workspace/lightExtensionWorkspaceArchive', () => ({
  buildLightExtensionWorkspaceArchiveFileName: mocks.archive.buildLightExtensionWorkspaceArchiveFileName,
  createLightExtensionWorkspaceArchive: mocks.archive.createLightExtensionWorkspaceArchive,
  downloadLightExtensionWorkspaceArchive: mocks.archive.downloadLightExtensionWorkspaceArchive,
  readLightExtensionWorkspaceArchive: mocks.archive.readLightExtensionWorkspaceArchive,
}));

vi.mock('../vsc-file/public-api', () => {
  return {
    buildLineDiff: () => [],
    inferLanguageFromPath: (path: string) => {
      const extension = path.split('.').pop();
      return extension === 'ts' || extension === 'tsx' ? 'typescript' : extension || 'text';
    },
    mergeHistoryItems: <T extends { id: string }>(current: T[], next: T[]) => {
      const itemsById = new Map(current.map((item) => [item.id, item]));
      next.forEach((item) => itemsById.set(item.id, item));
      return Array.from(itemsById.values());
    },
    useVscFileT: () => mocks.t,
    FilesPanel: ({
      collapsed,
      files,
      folders,
      defaultCreateParentPath,
      getPathAccess,
      onCreate,
      onCreateFolder,
      onDelete,
      onExportWorkspace,
      onImportWorkspace,
      onOpen,
      onRename,
      onRenameFolder,
    }: {
      collapsed: boolean;
      files: Array<{ path: string }>;
      folders: string[];
      defaultCreateParentPath?: string;
      getPathAccess?: (path: string, pathType: 'file' | 'folder') => { canWrite?: boolean; reason?: string };
      onCreate: (parentPath?: string) => string | undefined;
      onCreateFolder: (parentPath?: string) => string | undefined;
      onDelete: (path: string) => void;
      onExportWorkspace?: () => void;
      onImportWorkspace?: () => void;
      onOpen: (path: string) => void;
      onRename: (path: string, nextPath: string) => boolean;
      onRenameFolder: (path: string, nextPath: string) => boolean;
    }) => (
      <div data-collapsed={String(collapsed)} data-testid="runjs-files-panel">
        {onExportWorkspace ? (
          <button onClick={onExportWorkspace} type="button">
            Export workspace
          </button>
        ) : null}
        {onImportWorkspace ? (
          <button onClick={onImportWorkspace} type="button">
            Import workspace
          </button>
        ) : null}
        <button onClick={() => onCreate(defaultCreateParentPath || 'src/client')} type="button">
          New default file
        </button>
        <button onClick={() => onCreateFolder(defaultCreateParentPath || 'src/client')} type="button">
          New default folder
        </button>
        {folders.map((folder) => {
          const access = getPathAccess?.(folder, 'folder');
          return (
            <div key={folder}>
              <span data-can-write={String(access?.canWrite !== false)} data-reason={access?.reason || ''}>
                {folder}
              </span>
              <button onClick={() => onRenameFolder(folder, `${folder}-renamed`)} type="button">
                Rename folder {folder}
              </button>
            </div>
          );
        })}
        {files.map((file) => (
          <div key={file.path}>
            <button
              data-can-write={String(getPathAccess?.(file.path, 'file').canWrite !== false)}
              data-file-path={file.path}
              onClick={() => onOpen(file.path)}
              type="button"
            >
              {file.path.split('/').pop()}
            </button>
            <button onClick={() => onRename(file.path, `${file.path}.renamed`)} type="button">
              Rename file {file.path}
            </button>
            <button onClick={() => onDelete(file.path)} type="button">
              Delete file {file.path}
            </button>
          </div>
        ))}
      </div>
    ),
    VersionHistoryDock: ({
      hasMore,
      historyItems,
      onLoadMore,
      onSelect,
      restoreDisabled,
    }: {
      hasMore: boolean;
      historyItems: Array<{ id: string; message: string; seq: number }>;
      onLoadMore: () => void;
      onSelect: (commit: { id: string; message: string; seq: number }) => void;
      restoreDisabled?: boolean;
    }) => (
      <div data-testid="runjs-history-dock">
        {historyItems.map((commit) => (
          <button disabled={restoreDisabled} key={commit.id} onClick={() => onSelect(commit)} type="button">
            Restore v{commit.seq}
          </button>
        ))}
        {hasMore ? (
          <button onClick={onLoadMore} type="button">
            Load more
          </button>
        ) : null}
      </div>
    ),
    CodeTab: ({
      activeFile,
      onChange,
      onCheck,
      scene,
      showCheckButton,
      checking,
      readOnly,
      toolbarActions,
      workspaceFiles,
      runJSGlobalContextType,
      onFilesCollapsedChange,
      filesCollapsed,
      jsonSchemaResolver,
    }: {
      activeFile?: { content: string; path: string };
      onChange: (value: string) => void;
      onCheck?: () => void;
      scene?: string;
      showCheckButton?: boolean;
      checking?: boolean;
      readOnly?: boolean;
      toolbarActions?: React.ReactNode;
      workspaceFiles: Array<{ content: string; path: string }>;
      runJSGlobalContextType?: string;
      onFilesCollapsedChange: (collapsed: boolean) => void;
      filesCollapsed: boolean;
      jsonSchemaResolver?: (
        path: string,
        files: Array<{ content: string; path: string }>,
      ) => { uri: string } | undefined;
    }) => (
      <div
        data-has-check={String(Boolean(onCheck))}
        data-scene={scene || ''}
        data-show-check-button={String(showCheckButton)}
        data-testid="runjs-code-tab"
        data-runjs-global-context-type={runJSGlobalContextType || ''}
        data-json-schema-uri={activeFile ? jsonSchemaResolver?.(activeFile.path, workspaceFiles)?.uri || '' : ''}
        data-workspace-file-contents={JSON.stringify(workspaceFiles.map((file) => [file.path, file.content]))}
        data-workspace-files={workspaceFiles.map((file) => file.path).join(',')}
      >
        <button onClick={() => onFilesCollapsedChange(!filesCollapsed)} type="button">
          {filesCollapsed ? 'Expand files' : 'Collapse files'}
        </button>
        {showCheckButton ? (
          <button disabled={!onCheck} onClick={onCheck} type="button">
            {checking ? 'Checking' : 'Check'}
          </button>
        ) : null}
        {toolbarActions}
        {activeFile ? <span>{activeFile.path}</span> : null}
        <textarea
          aria-label="Edit file content"
          onChange={(event) => onChange(event.target.value)}
          readOnly={readOnly}
          value={activeFile?.content || ''}
        />
      </div>
    ),
    RestoreVersionModal: ({
      commit,
      onCancel,
      onRestore,
      scopeDescription,
      showRestoreSecondaryNote,
    }: {
      commit: { message?: string; seq: number } | null;
      onCancel: () => void;
      onRestore: () => void;
      scopeDescription?: string;
      showRestoreSecondaryNote?: boolean;
    }) =>
      commit ? (
        <div aria-label={`Restore v${commit.seq}?`} role="dialog">
          <strong>Target version: v{commit.seq}</strong>
          {commit.message ? <span>{commit.message}</span> : null}
          {scopeDescription ? <span>{scopeDescription}</span> : null}
          {showRestoreSecondaryNote !== false ? <span>It will not create a version until you save.</span> : null}
          <button onClick={onCancel} type="button">
            Cancel
          </button>
          <button onClick={onRestore} type="button">
            Restore
          </button>
        </div>
      ) : null,
    SaveVersionModal: ({
      onCancel,
      onSave,
      onVersionMessageChange,
      open,
      summary,
      versionMessage,
    }: {
      onCancel: () => void;
      onSave: () => void;
      onVersionMessageChange: (value: string) => void;
      open: boolean;
      summary: { files: number };
      versionMessage: string;
    }) =>
      open ? (
        <div aria-label="Save version" role="dialog">
          <span>{summary.files} changed files</span>
          <input
            aria-label="Version message"
            onChange={(event) => onVersionMessageChange(event.target.value)}
            value={versionMessage}
          />
          <button onClick={onCancel} type="button">
            Cancel
          </button>
          <button disabled={versionMessage.trim().length < 3} onClick={onSave} type="button">
            Save
          </button>
        </div>
      ) : null,
    summarizeWorkspaceChanges: () => ({ files: 1, additions: 1, deletions: 1 }),
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
  };
});

function createSaveResult() {
  return {
    repo: { id: 'ler_sales' },
    commit: { id: 'commit-2' },
    tree: { hash: 'tree-2', entryCount: 1, byteSize: 55 },
    compile: {
      status: 'success',
      entries: [],
    },
    diagnostics: [],
  };
}

async function confirmSaveVersion(message: string) {
  const saveDialog = await screen.findByRole('dialog', { name: 'Save version' });
  fireEvent.change(within(saveDialog).getByLabelText('Version message'), {
    target: { value: message },
  });
  fireEvent.click(within(saveDialog).getByRole('button', { name: 'Save' }));
}

describe('LightExtensionWorkspacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.api.getRepo.mockResolvedValue({
      id: 'ler_sales',
      name: 'sales-widgets',
      normalizedName: 'sales-widgets',
      title: 'Sales widgets',
      lifecycleStatus: 'enabled',
      healthStatus: 'pending',
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
    mocks.api.saveSource.mockResolvedValue(createSaveResult());
    mocks.api.compileWorkspacePreview.mockResolvedValue({
      accepted: true,
      diagnostics: [],
      artifact: {
        code: 'ctx.render(<div>preview</div>);',
        version: 'v2',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      },
    });
    mocks.api.inspectSourceArchive.mockResolvedValue({ files: [] });
    mocks.api.listCommits.mockResolvedValue([]);
    mocks.archive.createLightExtensionWorkspaceArchive.mockResolvedValue(
      new Blob(['workspace'], { type: 'application/zip' }),
    );
    mocks.archive.downloadLightExtensionWorkspaceArchive.mockReturnValue(true);
    mocks.archive.readLightExtensionWorkspaceArchive.mockResolvedValue('zip-base64');
  });

  it('shows only a global loading state while the initial workspace is loading', async () => {
    let resolveRepo: ((value: unknown) => void) | undefined;
    mocks.api.getRepo.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveRepo = resolve;
        }),
    );

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage embedded />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('status')).toHaveTextContent('Loading source');
    expect(screen.queryByTestId('runjs-files-panel')).not.toBeInTheDocument();
    expect(screen.queryByTestId('runjs-history-dock')).not.toBeInTheDocument();
    expect(screen.queryByTestId('runjs-code-tab')).not.toBeInTheDocument();

    await act(async () => {
      resolveRepo?.({
        id: 'ler_sales',
        name: 'sales-widgets',
        normalizedName: 'sales-widgets',
        title: 'Sales widgets',
        lifecycleStatus: 'enabled',
        healthStatus: 'pending',
        headCommitId: 'commit-1',
      });
    });

    expect(await screen.findByTestId('runjs-code-tab')).toBeInTheDocument();
  });

  it('starts embedded field-value workspaces with files collapsed and keeps diagnostics inside the workspace shell', async () => {
    render(
      <MemoryRouter>
        <LightExtensionWorkspacePage defaultFilesCollapsed embedded repoId="ler_sales" />
      </MemoryRouter>,
    );

    const workspace = await screen.findByTestId('light-extension-runjs-studio-workspace');
    expect(screen.queryByTestId('runjs-files-panel')).not.toBeInTheDocument();
    expect(within(workspace).getByTestId('light-extension-workspace-diagnostics')).toHaveTextContent('Diagnostics');

    fireEvent.click(within(workspace).getByRole('button', { name: 'Expand files' }));
    expect(await screen.findByTestId('runjs-files-panel')).toHaveAttribute('data-collapsed', 'false');
  });

  it('saves only dirty source changes without compiling a workspace preview first', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    expect(screen.getByTestId('runjs-code-tab')).toHaveAttribute('data-show-check-button', 'false');
    expect(screen.getByTestId('runjs-code-tab')).toHaveAttribute('data-has-check', 'false');
    expect(screen.getByTestId('runjs-code-tab')).toHaveAttribute('data-scene', '');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'export default function SalesKpi() { return "ok"; }\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await confirmSaveVersion('Update sales KPI');

    await waitFor(() => expect(mocks.api.saveSource).toHaveBeenCalledTimes(1));
    expect(mocks.api.compileWorkspacePreview).not.toHaveBeenCalled();
    expect(mocks.api.saveSource).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: 'ler_sales',
        expectedHeadCommitId: 'commit-1',
        message: 'Update sales KPI',
        files: [
          expect.objectContaining({
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            content: 'export default function SalesKpi() { return "ok"; }\n',
            operation: 'upsert',
          }),
        ],
      }),
    );
    const saveInput = mocks.api.saveSource.mock.calls[0][0];
    expect(saveInput.expectedHeadCommitId).toBe('commit-1');
    expect(saveInput).not.toHaveProperty('baseCommitId');
    expect(saveInput).not.toHaveProperty('baseOwnerFingerprint');
    expect(screen.queryByText('Source saved and compiled')).not.toBeInTheDocument();
  });

  it('keeps local edits open and shows diagnostics when saveSource rejects invalid source with 422', async () => {
    const onRequestClose = vi.fn();
    const onSaved = vi.fn();
    mocks.api.saveSource.mockRejectedValueOnce(
      new LightExtensionHookError({
        operation: 'saveSource',
        code: 'RUNJS_COMPILE_FAILED',
        status: 422,
        message: 'Light extension source cannot be compiled',
        details: {
          diagnostics: [
            {
              code: 'RUNJS_COMPILE_FAILED',
              severity: 'error',
              path: 'src/client/js-blocks/sales-kpi/index.tsx',
              message: "Type 'string' is not assignable to type 'number'.",
            },
          ],
        },
      }),
    );

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage onRequestClose={onRequestClose} onSaved={onSaved} />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: "const count: number = 'invalid';\nctx.render(<div>{count}</div>);\n" },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await confirmSaveVersion('Invalid source');

    expect(await screen.findByText('Light extension source cannot be compiled')).toBeInTheDocument();
    expect(screen.getByText("Type 'string' is not assignable to type 'number'.")).toBeInTheDocument();
    expect(screen.getByLabelText('Edit file content')).toHaveValue(
      "const count: number = 'invalid';\nctx.render(<div>{count}</div>);\n",
    );
    expect(screen.getByRole('button', { name: /Save/ })).toBeEnabled();
    expect(mocks.api.saveSource).toHaveBeenCalledTimes(1);
    expect(mocks.api.compileWorkspacePreview).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    expect(onRequestClose).not.toHaveBeenCalled();
  });

  it('keeps local edits and shows refresh guidance when the source head is outdated', async () => {
    const onRequestClose = vi.fn();
    const onSaved = vi.fn();
    mocks.api.saveSource.mockRejectedValueOnce(
      new LightExtensionHookError({
        operation: 'saveSource',
        code: 'LIGHT_EXTENSION_SOURCE_OUTDATED',
        status: 409,
        message: 'Light extension source changed after the workspace was opened',
      }),
    );

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage onRequestClose={onRequestClose} onSaved={onSaved} />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'export default function SalesKpi() { return "local edit"; }\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await confirmSaveVersion('Save stale workspace');

    expect(
      await screen.findByText('Source changed remotely. Refresh the latest source and reapply your changes.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Edit file content')).toHaveValue(
      'export default function SalesKpi() { return "local edit"; }\n',
    );
    expect(mocks.api.saveSource).toHaveBeenCalledWith(expect.objectContaining({ expectedHeadCommitId: 'commit-1' }));
    expect(mocks.api.compileWorkspacePreview).not.toHaveBeenCalled();
    expect(mocks.api.pull).toHaveBeenCalledTimes(1);
    expect(onSaved).not.toHaveBeenCalled();
    expect(onRequestClose).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await confirmSaveVersion('Retry stale workspace');

    await waitFor(() => expect(mocks.api.saveSource).toHaveBeenCalledTimes(2));
    expect(mocks.api.saveSource.mock.calls[1][0]).toEqual(
      expect.objectContaining({ expectedHeadCommitId: 'commit-1' }),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it('restores save controls after a network error and rejects the embedded save request without closing', async () => {
    let footerActions: LightExtensionWorkspaceFooterActions | null = null;
    let rejectSave: ((reason?: unknown) => void) | undefined;
    const onRequestClose = vi.fn();
    const onSaved = vi.fn();
    const pendingSave = new Promise<ReturnType<typeof createSaveResult>>((_resolve, reject) => {
      rejectSave = reject;
    });
    mocks.api.saveSource.mockReturnValueOnce(pendingSave);

    render(
      <MemoryRouter>
        <LightExtensionWorkspacePage
          embedded
          onFooterActionsChange={(actions) => {
            footerActions = actions;
          }}
          onRequestClose={onRequestClose}
          onSaved={onSaved}
          repoId="ler_sales"
        />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'export default function SalesKpi() { return "offline edit"; }\n' },
    });
    await waitFor(() => expect(footerActions?.disabled).toBe(false));
    let hostSavePromise: ReturnType<LightExtensionWorkspaceFooterActions['requestSave']> | undefined;
    act(() => {
      hostSavePromise = footerActions?.requestSave();
    });
    await confirmSaveVersion('Save while offline');

    await act(async () => {
      rejectSave?.(new Error('Network unavailable'));
      await expect(hostSavePromise).rejects.toThrow('Network unavailable');
    });
    expect(await screen.findByText('Network unavailable')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit file content')).toHaveValue(
      'export default function SalesKpi() { return "offline edit"; }\n',
    );
    await waitFor(() => expect(footerActions?.loading).toBe(false));
    expect(footerActions?.disabled).toBe(false);
    expect(mocks.api.saveSource).toHaveBeenCalledTimes(1);
    expect(mocks.api.compileWorkspacePreview).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
    expect(onRequestClose).not.toHaveBeenCalled();
  });

  it('checks the current unsaved entry workspace without saving or applying the artifact', async () => {
    const workspaceScope: LightExtensionWorkspaceScope = {
      mode: 'entry',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      kind: 'js-block',
    };

    render(
      <MemoryRouter>
        <LightExtensionWorkspacePage
          embedded
          entryId="lee_sales_kpi"
          repoId="ler_sales"
          workspaceScope={workspaceScope}
        />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    expect(screen.getByTestId('runjs-code-tab')).toHaveAttribute('data-show-check-button', 'true');
    expect(screen.getByTestId('runjs-code-tab')).toHaveAttribute('data-has-check', 'true');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'ctx.render(<div>unsaved preview</div>);\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check' }));

    await waitFor(() => expect(mocks.api.compileWorkspacePreview).toHaveBeenCalledTimes(1));
    expect(mocks.api.compileWorkspacePreview).toHaveBeenCalledWith({
      repoId: 'ler_sales',
      entryId: 'lee_sales_kpi',
      kind: 'js-block',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      runtimeVersion: 'v2',
      files: [
        expect.objectContaining({
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>unsaved preview</div>);\n',
        }),
      ],
    });
    expect(mocks.api.saveSource).not.toHaveBeenCalled();
    expect(await screen.findByText('Source check passed')).toBeInTheDocument();
  });

  it('offers moving the current unsaved entry workspace back to inline code', async () => {
    const onMoveToInline = vi.fn(async () => undefined);
    const confirmSpy = vi.spyOn(Modal, 'confirm').mockImplementation((config) => {
      config.onOk?.(() => undefined);
      return {
        destroy: vi.fn(),
        update: vi.fn(),
      } as ReturnType<typeof Modal.confirm>;
    });
    const workspaceScope: LightExtensionWorkspaceScope = {
      mode: 'entry',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      kind: 'js-block',
    };

    render(
      <MemoryRouter>
        <LightExtensionWorkspacePage
          embedded
          entryId="lee_sales_kpi"
          onMoveToInline={onMoveToInline}
          repoId="ler_sales"
          workspaceScope={workspaceScope}
        />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'ctx.render(<div>unsaved inline move</div>);\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Move to inline code' }));

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Move to inline code?',
        okText: 'Move to inline code',
      }),
    );
    await waitFor(() =>
      expect(onMoveToInline).toHaveBeenCalledWith({
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
        version: 'v2',
        files: [
          expect.objectContaining({
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            content: 'ctx.render(<div>unsaved inline move</div>);\n',
          }),
        ],
      }),
    );
    confirmSpy.mockRestore();
  });

  it('renames an entry directory without changing its entry.json key', async () => {
    const descriptorContent = '{\n  "schemaVersion": 1,\n  "key": "stable-sales-kpi",\n  "title": "Sales KPI"\n}\n';
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: 2, byteSize: 90 },
      unchanged: false,
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>Sales KPI</div>);\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/entry.json',
          content: descriptorContent,
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
    fireEvent.click(screen.getByRole('button', { name: 'Rename folder src/client/js-blocks/sales-kpi', exact: true }));
    const workspaceContents = new Map<string, string>(
      JSON.parse(screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-file-contents') || '[]'),
    );
    expect(workspaceContents.get('src/client/js-blocks/sales-kpi-renamed/entry.json')).toBe(descriptorContent);
    expect(workspaceContents.get('src/client/js-blocks/sales-kpi-renamed/index.tsx')).toBe(
      'ctx.render(<div>Sales KPI</div>);\n',
    );

    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await confirmSaveVersion('Rename sales KPI directory');
    await waitFor(() => expect(mocks.api.saveSource).toHaveBeenCalledTimes(1));
    expect(mocks.api.saveSource.mock.calls[0][0].files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'src/client/js-blocks/sales-kpi/index.tsx', operation: 'delete' }),
        expect.objectContaining({ path: 'src/client/js-blocks/sales-kpi/entry.json', operation: 'delete' }),
        expect.objectContaining({
          path: 'src/client/js-blocks/sales-kpi-renamed/index.tsx',
          operation: 'upsert',
        }),
        expect.objectContaining({
          path: 'src/client/js-blocks/sales-kpi-renamed/entry.json',
          content: descriptorContent,
          operation: 'upsert',
        }),
      ]),
    );
    expect(mocks.api.saveSource.mock.calls[0][0].expectedHeadCommitId).toBe('commit-1');
  });

  it('recomputes the canonical entry.json Schema after file creation, entry rename, selection, and deletion', async () => {
    const descriptorPath = 'src/client/js-blocks/sales-kpi/entry.json';
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: 3, byteSize: 120 },
      unchanged: false,
      files: [
        {
          path: descriptorPath,
          content: '{"schemaVersion":1,"key":"sales-kpi"}',
          language: 'json',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/data.json',
          content: '{"schemaVersion":2}',
          language: 'json',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>Sales KPI</div>);\n',
          language: 'typescript',
        },
      ],
    });

    render(
      <MemoryRouter>
        <LightExtensionWorkspacePage initialPath={descriptorPath} repoId="ler_sales" />
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('runjs-code-tab')).toHaveAttribute(
      'data-json-schema-uri',
      LIGHT_EXTENSION_ENTRY_SCHEMA_URI,
    );

    fireEvent.click(screen.getByRole('button', { name: 'data.json' }));
    expect(screen.getByTestId('runjs-code-tab')).toHaveAttribute('data-json-schema-uri', '');

    fireEvent.click(screen.getByRole('button', { name: 'entry.json' }));
    expect(screen.getByTestId('runjs-code-tab')).toHaveAttribute(
      'data-json-schema-uri',
      LIGHT_EXTENSION_ENTRY_SCHEMA_URI,
    );

    fireEvent.click(screen.getByRole('button', { name: 'New default file' }));
    expect(screen.getByTestId('runjs-code-tab')).toHaveAttribute('data-json-schema-uri', '');

    fireEvent.click(screen.getByRole('button', { name: 'entry.json' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rename folder src/client/js-blocks/sales-kpi', exact: true }));
    expect(screen.getByTestId('runjs-code-tab')).toHaveAttribute(
      'data-json-schema-uri',
      LIGHT_EXTENSION_ENTRY_SCHEMA_URI,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Delete file src/client/js-blocks/sales-kpi-renamed/entry.json' }),
    );
    expect(screen.getByTestId('runjs-code-tab')).toHaveAttribute('data-json-schema-uri', '');
  });

  it.each([
    ['missing entry.json', undefined, 'Entry descriptor is missing'],
    ['invalid entry key', '{"schemaVersion":1,"key":"Invalid Key"}', 'Entry descriptor key is invalid'],
  ])('blocks entry directory rename for %s', async (_label, descriptorContent, expectedError) => {
    const files = [
      {
        path: 'src/client/js-blocks/sales-kpi/index.tsx',
        content: 'ctx.render(<div>Sales KPI</div>);\n',
        language: 'typescript',
      },
      ...(descriptorContent
        ? [
            {
              path: 'src/client/js-blocks/sales-kpi/entry.json',
              content: descriptorContent,
              language: 'json',
            },
          ]
        : []),
    ];
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: files.length, byteSize: 90 },
      unchanged: false,
      files,
    });
    const errorSpy = vi.spyOn(message, 'error');

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    fireEvent.click(screen.getByRole('button', { name: 'Rename folder src/client/js-blocks/sales-kpi', exact: true }));

    expect(errorSpy).toHaveBeenCalledWith(expectedError);
    expect(screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-files')).toContain(
      'src/client/js-blocks/sales-kpi/index.tsx',
    );
    expect(screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-files')).not.toContain(
      'src/client/js-blocks/sales-kpi-renamed/index.tsx',
    );
    errorSpy.mockRestore();
  });

  it('shows save progress and closes an embedded workspace after the persisted save completes', async () => {
    let footerActions: LightExtensionWorkspaceFooterActions | null = null;
    let resolveSave: ((value: ReturnType<typeof createSaveResult>) => void) | undefined;
    let resolveSavedRefresh: (() => void) | undefined;
    const pendingSave = new Promise<ReturnType<typeof createSaveResult>>((resolve) => {
      resolveSave = resolve;
    });
    const pendingSavedRefresh = new Promise<void>((resolve) => {
      resolveSavedRefresh = resolve;
    });
    const onRequestClose = vi.fn();
    const onSaved = vi.fn(() => pendingSavedRefresh);
    mocks.api.saveSource.mockReturnValueOnce(pendingSave);

    render(
      <MemoryRouter>
        <LightExtensionWorkspacePage
          embedded
          onFooterActionsChange={(actions) => {
            footerActions = actions;
          }}
          onRequestClose={onRequestClose}
          onSaved={onSaved}
          repoId="ler_sales"
        />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'export default function SalesKpi() { return "saved"; }\n' },
    });
    await waitFor(() => expect(footerActions?.disabled).toBe(false));
    const hostSavePromise = footerActions?.requestSave();

    const saveDialog = await screen.findByRole('dialog', { name: 'Save version' });
    fireEvent.change(within(saveDialog).getByLabelText('Version message'), {
      target: { value: 'Save from JS block' },
    });
    fireEvent.click(within(saveDialog).getByRole('button', { name: 'Save' }));

    expect(await screen.findByRole('dialog', { name: 'Saving changes' })).toBeInTheDocument();
    expect(screen.getByText('Saving source files')).toBeInTheDocument();
    expect(screen.getByText('Compiling light extension')).toBeInTheDocument();
    expect(mocks.api.saveSource).toHaveBeenCalledTimes(1);
    expect(mocks.api.compileWorkspacePreview).not.toHaveBeenCalled();
    expect(onRequestClose).not.toHaveBeenCalled();

    await act(async () => {
      resolveSave?.(createSaveResult());
      await pendingSave;
    });

    await waitFor(() => expect(onSaved).toHaveBeenCalledTimes(1));
    expect(onRequestClose).not.toHaveBeenCalled();

    await act(async () => {
      resolveSavedRefresh?.();
      await pendingSavedRefresh;
    });

    await waitFor(() => expect(onRequestClose).toHaveBeenCalledTimes(1));
    await expect(hostSavePromise).resolves.toBe('saved');
    expect(screen.queryByRole('dialog', { name: 'Saving changes' })).not.toBeInTheDocument();
    expect(screen.queryByText('Source saved and compiled')).not.toBeInTheDocument();
  });

  it('limits embedded entry workspaces to the selected entry and public files', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: 4, byteSize: 180 },
      unchanged: false,
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>Sales</div>);\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/other/index.tsx',
          content: 'ctx.render(<div>Other</div>);\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-actions/approve/index.ts',
          content: 'ctx.message.success("approved");\n',
          language: 'typescript',
        },
        {
          path: 'src/shared/format.ts',
          content: 'export const format = String;\n',
          language: 'typescript',
        },
      ],
    });
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
      },
    ]);
    const workspaceScope: LightExtensionWorkspaceScope = {
      mode: 'entry',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      kind: 'js-block',
    };

    render(
      <MemoryRouter>
        <LightExtensionWorkspacePage
          initialPath={workspaceScope.entryPath}
          repoId="ler_sales"
          workspaceScope={workspaceScope}
        />
      </MemoryRouter>,
    );

    const blockEntryButtons = await screen.findAllByRole('button', { name: 'index.tsx' });
    expect(blockEntryButtons[0]).toHaveAttribute('data-can-write', 'false');
    expect(blockEntryButtons[1]).toHaveAttribute('data-can-write', 'true');
    expect(screen.getByRole('button', { name: 'index.ts' })).toHaveAttribute('data-can-write', 'false');
    expect(screen.getByRole('button', { name: 'format.ts' })).toHaveAttribute('data-can-write', 'true');
    expect(screen.getByText('src/client/js-blocks/sales-kpi')).toHaveAttribute('data-reason', '');
    expect(screen.getByText('src/client/js-blocks/other')).toHaveAttribute(
      'data-reason',
      'Other light extension entries are read-only here',
    );
    expect(screen.getByLabelText('Edit file content')).not.toHaveAttribute('readonly');
    expect(screen.getByRole('button', { name: 'Restore v1' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'index.ts' }));
    expect(screen.getByLabelText('Edit file content')).toHaveAttribute('readonly');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'ctx.message.error("changed");\n' },
    });
    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'format.ts' }));
    expect(screen.getByLabelText('Edit file content')).not.toHaveAttribute('readonly');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'export const format = (value: unknown) => String(value);\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await confirmSaveVersion('Update shared formatter');

    await waitFor(() => expect(mocks.api.saveSource).toHaveBeenCalledTimes(1));
    expect(mocks.api.saveSource.mock.calls[0][0].files).toEqual([
      expect.objectContaining({
        path: 'src/shared/format.ts',
        operation: 'upsert',
      }),
    ]);
  });

  it('exports the current unsaved entry-scoped workspace from the files panel', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: 4, byteSize: 180 },
      unchanged: false,
      files: [
        {
          path: 'README.md',
          content: '# Sales widgets\n',
          language: 'markdown',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>Saved sales</div>);\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/other/index.tsx',
          content: 'ctx.render(<div>Other</div>);\n',
          language: 'typescript',
        },
        {
          path: 'src/shared/format.ts',
          content: 'export const format = String;\n',
          language: 'typescript',
        },
      ],
    });
    const archive = new Blob(['entry workspace'], { type: 'application/zip' });
    mocks.archive.createLightExtensionWorkspaceArchive.mockResolvedValueOnce(archive);
    const workspaceScope: LightExtensionWorkspaceScope = {
      mode: 'entry',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      kind: 'js-block',
    };

    render(
      <MemoryRouter>
        <LightExtensionWorkspacePage
          initialPath={workspaceScope.entryPath}
          repoId="ler_sales"
          workspaceScope={workspaceScope}
        />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    expect(screen.getByRole('button', { name: 'Import workspace' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export workspace' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'ctx.render(<div>Unsaved sales</div>);\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Export workspace' }));

    await waitFor(() => expect(mocks.archive.createLightExtensionWorkspaceArchive).toHaveBeenCalledTimes(1));
    expect(mocks.archive.createLightExtensionWorkspaceArchive).toHaveBeenCalledWith([
      expect.objectContaining({ path: 'README.md', content: '# Sales widgets\n' }),
      expect.objectContaining({
        path: 'src/client/js-blocks/sales-kpi/index.tsx',
        content: 'ctx.render(<div>Unsaved sales</div>);\n',
      }),
      expect.objectContaining({ path: 'src/shared/format.ts', content: 'export const format = String;\n' }),
    ]);
    expect(mocks.archive.downloadLightExtensionWorkspaceArchive).toHaveBeenCalledWith(archive, 'sales-widgets.zip');
    expect(mocks.api.saveSource).not.toHaveBeenCalled();
  });

  it('imports entry-scoped ZIP files into local editor state while preserving read-only entries', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: 4, byteSize: 180 },
      unchanged: false,
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>Current sales</div>);\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/other/index.tsx',
          content: 'ctx.render(<div>Current other</div>);\n',
          language: 'typescript',
        },
        {
          path: 'src/shared/format.ts',
          content: 'export const format = String;\n',
          language: 'typescript',
        },
        {
          path: 'src/shared/obsolete.ts',
          content: 'export const obsolete = true;\n',
          language: 'typescript',
        },
      ],
    });
    mocks.api.inspectSourceArchive.mockResolvedValueOnce({
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>Imported sales</div>);\n',
          language: 'typescript',
        },
        {
          path: 'src/shared/format.ts',
          content: 'export const format = (value: unknown) => String(value);\n',
          language: 'typescript',
        },
        {
          path: 'src/shared/imported.ts',
          content: 'export const imported = true;\n',
          language: 'typescript',
        },
      ],
    });
    const confirmSpy = vi.spyOn(Modal, 'confirm').mockImplementation((config) => {
      config.onOk?.(() => undefined);
      return {
        destroy: vi.fn(),
        update: vi.fn(),
      } as ReturnType<typeof Modal.confirm>;
    });
    const workspaceScope: LightExtensionWorkspaceScope = {
      mode: 'entry',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      kind: 'js-block',
    };

    render(
      <MemoryRouter>
        <LightExtensionWorkspacePage
          initialPath={workspaceScope.entryPath}
          repoId="ler_sales"
          workspaceScope={workspaceScope}
        />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'ctx.render(<div>Unsaved local sales</div>);\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Import workspace' }));
    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Import workspace',
        okText: 'Import',
      }),
    );

    const zipFile = new File(['zip'], 'sales.zip', { type: 'application/zip' });
    fireEvent.change(screen.getByLabelText('Import workspace'), {
      target: { files: [zipFile] },
    });

    await waitFor(() => expect(mocks.api.inspectSourceArchive).toHaveBeenCalledTimes(1));
    expect(mocks.archive.readLightExtensionWorkspaceArchive).toHaveBeenCalledWith(zipFile, 'Failed to read source ZIP');
    expect(mocks.api.inspectSourceArchive).toHaveBeenCalledWith({
      repoId: 'ler_sales',
      zipBase64: 'zip-base64',
    });
    await waitFor(() =>
      expect(screen.getByLabelText('Edit file content')).toHaveValue('ctx.render(<div>Imported sales</div>);\n'),
    );
    const workspaceContents = new Map<string, string>(
      JSON.parse(screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-file-contents') || '[]'),
    );
    expect(workspaceContents.get('src/client/js-blocks/other/index.tsx')).toBe(
      'ctx.render(<div>Current other</div>);\n',
    );
    expect(workspaceContents.get('src/shared/format.ts')).toBe(
      'export const format = (value: unknown) => String(value);\n',
    );
    expect(workspaceContents.get('src/shared/imported.ts')).toBe('export const imported = true;\n');
    expect(workspaceContents.has('src/shared/obsolete.ts')).toBe(false);
    expect(screen.getByRole('button', { name: /Save/ })).toBeEnabled();
    expect(mocks.api.saveSource).not.toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('rejects an entry-scoped ZIP that does not include the current entry file', async () => {
    mocks.api.inspectSourceArchive.mockResolvedValueOnce({
      files: [
        {
          path: 'src/shared/format.ts',
          content: 'export const format = String;\n',
          language: 'typescript',
        },
      ],
    });
    const workspaceScope: LightExtensionWorkspaceScope = {
      mode: 'entry',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      kind: 'js-block',
    };

    render(
      <MemoryRouter>
        <LightExtensionWorkspacePage
          initialPath={workspaceScope.entryPath}
          repoId="ler_sales"
          workspaceScope={workspaceScope}
        />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    const zipFile = new File(['zip'], 'missing-entry.zip', { type: 'application/zip' });
    fireEvent.change(screen.getByLabelText('Import workspace'), {
      target: { files: [zipFile] },
    });

    expect(await screen.findByText('ZIP does not contain the current entry file')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit file content')).toHaveValue(
      'export default function SalesKpi() { return null; }\n',
    );
    expect(mocks.api.saveSource).not.toHaveBeenCalled();
  });

  it('restores only editable entry-scoped files into the unsaved editor state', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-2' },
      tree: { hash: 'tree-2', entryCount: 5, byteSize: 240 },
      unchanged: false,
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>Current sales</div>);\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/other/index.tsx',
          content: 'ctx.render(<div>Current other</div>);\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-actions/approve/index.ts',
          content: 'ctx.message.success("current approval");\n',
          language: 'typescript',
        },
        {
          path: 'src/shared/format.ts',
          content: 'export const format = String;\n',
          language: 'typescript',
        },
        {
          path: 'src/shared/obsolete.ts',
          content: 'export const obsolete = true;\n',
          language: 'typescript',
        },
      ],
    });
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
      },
    ]);
    mocks.api.pullCommit.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: 5, byteSize: 220 },
      unchanged: false,
      files: [
        {
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          content: 'ctx.render(<div>Restored sales</div>);\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/other/index.tsx',
          content: 'ctx.render(<div>Historical other</div>);\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-actions/approve/index.ts',
          content: 'ctx.message.success("historical approval");\n',
          language: 'typescript',
        },
        {
          path: 'src/shared/format.ts',
          content: 'export const format = (value: unknown) => String(value);\n',
          language: 'typescript',
        },
        {
          path: 'src/shared/new-helper.ts',
          content: 'export const helper = true;\n',
          language: 'typescript',
        },
      ],
    });
    const workspaceScope: LightExtensionWorkspaceScope = {
      mode: 'entry',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      kind: 'js-block',
    };

    render(
      <MemoryRouter>
        <LightExtensionWorkspacePage
          initialPath={workspaceScope.entryPath}
          repoId="ler_sales"
          workspaceScope={workspaceScope}
        />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Restore v1' }));
    const dialog = await screen.findByRole('dialog', { name: 'Restore v1?' });
    expect(within(dialog).getByText('Target version: v1')).toBeInTheDocument();
    expect(within(dialog).getByText('Initial source')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Only editable files in this workspace will be restored. Read-only files will remain unchanged.',
      ),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('It will not create a version until you save.')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Restore' }));

    await waitFor(() => expect(mocks.api.pullCommit).toHaveBeenCalledTimes(1));
    const workspaceContents = new Map<string, string>(
      JSON.parse(screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-file-contents') || '[]'),
    );
    expect(workspaceContents.get('src/client/js-blocks/sales-kpi/index.tsx')).toBe(
      'ctx.render(<div>Restored sales</div>);\n',
    );
    expect(workspaceContents.get('src/client/js-blocks/other/index.tsx')).toBe(
      'ctx.render(<div>Current other</div>);\n',
    );
    expect(workspaceContents.get('src/client/js-actions/approve/index.ts')).toBe(
      'ctx.message.success("current approval");\n',
    );
    expect(workspaceContents.get('src/shared/format.ts')).toBe(
      'export const format = (value: unknown) => String(value);\n',
    );
    expect(workspaceContents.get('src/shared/new-helper.ts')).toBe('export const helper = true;\n');
    expect(workspaceContents.has('src/shared/obsolete.ts')).toBe(false);
    expect(screen.getByRole('button', { name: /Save/ })).toBeEnabled();
    expect(mocks.api.saveSource).not.toHaveBeenCalled();
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

  it('opens a persisted default first version without local changes', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-default', entryCount: DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES.length, byteSize: 1024 },
      unchanged: false,
      files: DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES.map((file, index) => ({
        ...file,
        blobHash: `blob-${index}`,
        mode: file.mode || '',
        pathHash: `path-${index}`,
        pathLowerHash: `path-lower-${index}`,
        size: file.content?.length || 0,
      })),
    });

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findAllByText('README.md');
    expect(screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-files')).toContain(
      'src/client/js-blocks/welcome-card/index.tsx',
    );
    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();
    expect(mocks.api.saveSource).not.toHaveBeenCalled();
  });

  it('does not seed or save an empty repository in the client workspace', async () => {
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

    expect(await screen.findByText('Empty repository')).toBeInTheDocument();
    expect(screen.queryByTestId('runjs-code-tab')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();
    expect(mocks.api.saveSource).not.toHaveBeenCalled();
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
    await waitFor(() => expect(screen.getAllByText('tsconfig.json').length).toBeGreaterThan(0));

    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await confirmSaveVersion('Add repository files');

    await waitFor(() => expect(mocks.api.saveSource).toHaveBeenCalledTimes(1));
    expect(mocks.api.saveSource.mock.calls[0][0].files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'README.md',
          content: expect.stringContaining('src/client/js-blocks/<entry-name>/index.tsx'),
          operation: 'upsert',
        }),
        expect.objectContaining({
          path: 'tsconfig.json',
          content: expect.stringContaining('"moduleResolution": "Node"'),
          operation: 'upsert',
        }),
      ]),
    );
    expect(mocks.api.saveSource.mock.calls[0][0].files).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ path: expect.stringMatching(/^\.light-extension\/types\//) })]),
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
    expect(await screen.findByText('src/client/js-pages/hello-page/index.tsx')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await confirmSaveVersion('Add JS page example');

    await waitFor(() => expect(mocks.api.saveSource).toHaveBeenCalledTimes(1));
    expect(mocks.api.saveSource.mock.calls[0][0].files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'src/client/js-pages/hello-page/index.tsx',
          content: DEFAULT_LIGHT_EXTENSION_TEMPLATE_FILES.find(
            (file) => file.path === 'src/client/js-pages/hello-page/index.tsx',
          )?.content,
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
    expect(await screen.findByText('src/client/js-pages')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'New default folder' }));
    expect(await screen.findByText('src/client/js-fields')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'New default folder' }));
    expect(await screen.findByText('src/client/js-actions')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'New default folder' }));
    expect(await screen.findByText('src/client/js-items')).toBeInTheDocument();
    expect(screen.queryByText('src/client/runjs')).not.toBeInTheDocument();
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
          path: 'src/client/js-blocks/product-list/entry.json',
          content:
            '{"schemaVersion":1,"key":"product-list","settings":{"title":{"type":"string","default":"Products"},"pageSize":{"type":"integer","default":5}}}',
          language: 'json',
        },
        {
          path: 'src/client/js-blocks/order-list/index.tsx',
          content: 'ctx.render(null);\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/order-list/entry.json',
          content:
            '{"schemaVersion":1,"key":"order-list","settings":{"orderStatus":{"type":"string"},"limit":{"type":"integer"}}}',
          language: 'json',
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage initialPath="src/client/js-blocks/product-list/index.tsx" />
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
    expect(screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-files')).toContain(
      '.light-extension/types/sdk.d.ts',
    );
    expect(screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-files')).toContain(
      '.light-extension/types/__active-entry-context.d.ts',
    );
    expect(screen.getByTestId('runjs-code-tab')).toHaveAttribute(
      'data-runjs-global-context-type',
      'LightExtensionActiveEntryContext',
    );
    expect(screen.queryByRole('button', { name: /Settings type preview/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Download settings types/ })).toBeNull();
    expect(screen.queryByTestId('light-extension-settings-type-preview')).toBeNull();
    expect(screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-file-contents')).toContain(
      'orderStatus?: string;',
    );
    expect(screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-file-contents')).toContain(
      'light-extension:settings/client/js-block/product-list',
    );

    const orderListButton = screen
      .getByTestId('runjs-files-panel')
      .querySelector<HTMLButtonElement>('[data-file-path="src/client/js-blocks/order-list/index.tsx"]');
    expect(orderListButton).not.toBeNull();
    fireEvent.click(orderListButton as HTMLButtonElement);
    await waitFor(() => {
      const workspaceFiles = JSON.parse(
        screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-file-contents') || '[]',
      ) as Array<[string, string]>;
      expect(
        workspaceFiles.find(([path]) => path === '.light-extension/types/__active-entry-context.d.ts')?.[1],
      ).toContain('light-extension:settings/client/js-block/order-list');
    });
    const activeContextFiles = JSON.parse(
      screen.getByTestId('runjs-code-tab').getAttribute('data-workspace-file-contents') || '[]',
    ) as Array<[string, string]>;
    expect(
      activeContextFiles.filter(([path]) => path === '.light-extension/types/__active-entry-context.d.ts'),
    ).toHaveLength(1);
  });

  it('keeps generated SDK declarations out of saveSource changes', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: 2, byteSize: 260 },
      unchanged: false,
      files: [
        {
          path: 'src/client/js-blocks/product-list/index.tsx',
          content: 'import type { Settings } from "light-extension:settings/client/js-block/product-list";\n',
          language: 'typescript',
        },
        {
          path: 'src/client/js-blocks/product-list/entry.json',
          content: '{"schemaVersion":1,"key":"product-list","settings":{"title":{"type":"string"}}}',
          language: 'json',
        },
      ],
    });

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage initialPath="src/client/js-blocks/product-list/index.tsx" />
      </MemoryRouter>,
    );

    const codeTab = await screen.findByTestId('runjs-code-tab');
    const workspaceFileContents = codeTab.getAttribute('data-workspace-file-contents') || '';
    expect(workspaceFileContents).toContain('JSBlockContext');
    expect(workspaceFileContents).toContain('RunJSContext');

    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: {
        value:
          'import type { Settings } from "light-extension:settings/client/js-block/product-list";\nctx.render(null as unknown as Settings);\n',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await confirmSaveVersion('Update product list');

    await waitFor(() => expect(mocks.api.saveSource).toHaveBeenCalledTimes(1));
    expect(mocks.api.saveSource.mock.calls[0][0].files).toEqual([
      expect.objectContaining({ path: 'src/client/js-blocks/product-list/index.tsx', operation: 'upsert' }),
    ]);
  });

  it('shows persisted save diagnostics after validation failure', async () => {
    mocks.api.saveSource.mockRejectedValueOnce(
      new LightExtensionHookError({
        operation: 'saveSource',
        code: 'RUNJS_COMPILE_FAILED',
        status: 422,
        message: 'Light extension source cannot be compiled',
        details: {
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
        },
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
    await confirmSaveVersion('Check invalid import');

    await screen.findByText('Import "react" is not allowed');
    expect(screen.getByText('import_not_allowed')).toBeInTheDocument();
  });

  it('opens diagnostic source locations after save validation failure', async () => {
    mocks.api.saveSource.mockRejectedValueOnce(
      new LightExtensionHookError({
        operation: 'saveSource',
        code: 'LIGHT_EXTENSION_SOURCE_INVALID',
        status: 422,
        message: 'Light extension source workspace is invalid',
        details: {
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
        },
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
    await confirmSaveVersion('Check missing import');

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

  it('loads older history pages without duplicating commits', async () => {
    const initialCommits = Array.from({ length: 20 }, (_, index) => ({
      id: `commit-${40 - index}`,
      repoId: 'ler_sales',
      hash: `hash-${40 - index}`,
      seq: 40 - index,
      parentCommitId: index === 19 ? null : `commit-${39 - index}`,
      treeHash: `tree-${40 - index}`,
      message: `Source v${40 - index}`,
      authorId: null,
      metadata: {},
      createdAt: '2026-07-07T07:12:00.000Z',
    }));
    const olderCommit = {
      ...initialCommits[19],
      id: 'commit-20',
      hash: 'hash-20',
      seq: 20,
      treeHash: 'tree-20',
      message: 'Source v20',
    };
    mocks.api.listCommits
      .mockResolvedValueOnce(initialCommits)
      .mockResolvedValueOnce([initialCommits[19], olderCommit]);

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension?panel=source&repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Load more' }));

    await waitFor(() => expect(mocks.api.listCommits).toHaveBeenCalledTimes(2));
    expect(mocks.api.listCommits).toHaveBeenNthCalledWith(2, {
      repoId: 'ler_sales',
      limit: 20,
      beforeSeq: 21,
    });
    expect(await screen.findByRole('button', { name: 'Restore v20' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Restore v21' })).toHaveLength(1);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull());
  });
});
