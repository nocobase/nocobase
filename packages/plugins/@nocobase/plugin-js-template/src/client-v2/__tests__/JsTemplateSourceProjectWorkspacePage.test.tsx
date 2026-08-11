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
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { JsTemplateHookError, type UseJsTemplateProjectResult } from '../hooks/useJsTemplateProject';
import JsTemplateSourceProjectWorkspacePage, {
  type JsTemplateSourceProjectWorkspaceFooterActions,
} from '../pages/JsTemplateSourceProjectWorkspacePage';
import type { JsTemplateWorkspaceScope } from '../workspace/jsTemplateWorkspaceAccess';

const mocks = vi.hoisted(() => ({
  t: (key: string) => key,
  api: {
    getProject: vi.fn(),
    inspectSourceArchive: vi.fn(),
    pull: vi.fn(),
    pullCommit: vi.fn(),
    saveSource: vi.fn(),
    compileWorkspacePreview: vi.fn(),
    listCommits: vi.fn(),
    diffCommits: vi.fn(),
  },
  apiClient: { request: vi.fn() },
  archive: {
    buildJsTemplateWorkspaceArchiveFileName: vi.fn(() => 'sales-widgets.zip'),
    createJsTemplateWorkspaceArchive: vi.fn(),
    downloadJsTemplateWorkspaceArchive: vi.fn(() => true),
    readJsTemplateWorkspaceArchive: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mocks.t,
  }),
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/client-v2')>();

  return {
    ...actual,
    useApp: () => ({
      apiClient: mocks.apiClient,
      aiManager: {
        authoringSurfaces: {
          register: () => vi.fn(),
        },
      },
    }),
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
  };
});

vi.mock('../workspace/jsTemplateWorkspaceArchive', () => ({
  buildJsTemplateWorkspaceArchiveFileName: mocks.archive.buildJsTemplateWorkspaceArchiveFileName,
  createJsTemplateWorkspaceArchive: mocks.archive.createJsTemplateWorkspaceArchive,
  downloadJsTemplateWorkspaceArchive: mocks.archive.downloadJsTemplateWorkspaceArchive,
  readJsTemplateWorkspaceArchive: mocks.archive.readJsTemplateWorkspaceArchive,
}));

vi.mock('@nocobase/runjs/workspace/client-v2', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@nocobase/runjs/workspace/client-v2')>();
  return {
    ...actual,
    inferLanguageFromPath: (path: string) => {
      const extension = path.split('.').pop();
      return extension === 'ts' || extension === 'tsx' ? 'typescript' : extension || 'text';
    },
    mergeHistoryItems: <T extends { id: string }>(current: T[], next: T[]) => {
      const itemsById = new Map(current.map((item) => [item.id, item]));
      next.forEach((item) => itemsById.set(item.id, item));
      return Array.from(itemsById.values());
    },
    useRunJSWorkspaceT: () => mocks.t,
    FilesPanel: ({
      files,
      folders,
      defaultCreateParentPath,
      getPathAccess,
      onCreate,
      onCreateFolder,
      onExportWorkspace,
      onImportWorkspace,
      onOpen,
      onRenameFolder,
    }: {
      files: Array<{ path: string }>;
      folders: string[];
      defaultCreateParentPath?: string;
      getPathAccess?: (path: string, pathType: 'file' | 'folder') => { canWrite?: boolean; reason?: string };
      onCreate: (parentPath?: string) => string | undefined;
      onCreateFolder?: (parentPath?: string) => string | undefined;
      onExportWorkspace?: () => void;
      onImportWorkspace?: () => void;
      onOpen: (path: string) => void;
      onRenameFolder: (path: string, nextPath: string) => boolean;
    }) => (
      <div data-testid="runjs-files-panel">
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
        {onCreateFolder ? (
          <button onClick={() => onCreateFolder('src/client/js-blocks')} type="button">
            New js-block folder
          </button>
        ) : null}
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
              onClick={() => onOpen(file.path)}
              type="button"
            >
              {file.path.split('/').pop()}
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
      onViewDiff,
      restoreDisabled,
    }: {
      hasMore: boolean;
      historyItems: Array<{ id: string; message: string; seq: number; parentCommitId: string | null }>;
      onLoadMore: () => void;
      onSelect: (commit: { id: string; message: string; seq: number; parentCommitId: string | null }) => void;
      onViewDiff?: (commit: { id: string; message: string; seq: number; parentCommitId: string | null }) => void;
      restoreDisabled?: boolean;
    }) => (
      <div data-testid="runjs-history-dock">
        {historyItems.map((commit) => (
          <React.Fragment key={commit.id}>
            <button disabled={restoreDisabled} onClick={() => onSelect(commit)} type="button">
              Restore v{commit.seq}
            </button>
            {commit.parentCommitId && onViewDiff ? (
              <button onClick={() => onViewDiff(commit)} type="button">
                Changes v{commit.seq}
              </button>
            ) : null}
          </React.Fragment>
        ))}
        {hasMore ? (
          <button onClick={onLoadMore} type="button">
            Load more
          </button>
        ) : null}
      </div>
    ),
    CommitDiffModal: ({
      commit,
      diff,
    }: {
      commit: { seq: number } | null;
      diff: { files: Array<{ path: string }> } | null;
    }) =>
      commit ? (
        <div aria-label={`Commit changes v${commit.seq}`} role="dialog">
          {diff?.files.map((file) => <span key={file.path}>{file.path}</span>)}
        </div>
      ) : null,
    CodeTab: ({
      activeFile,
      onChange,
      onRunPreview,
      scene,
      showRunButton,
      previewing,
      readOnly,
      toolbarActions,
      workspaceFiles,
    }: {
      activeFile?: { content: string; path: string };
      onChange: (value: string) => void;
      onRunPreview?: () => void;
      scene?: string;
      showRunButton?: boolean;
      previewing?: boolean;
      readOnly?: boolean;
      toolbarActions?: React.ReactNode;
      workspaceFiles: Array<{ content: string; path: string }>;
    }) => (
      <div
        data-has-run={String(Boolean(onRunPreview))}
        data-scene={scene || ''}
        data-show-run-button={String(showRunButton)}
        data-testid="runjs-code-tab"
        data-workspace-file-contents={JSON.stringify(workspaceFiles.map((file) => [file.path, file.content]))}
        data-workspace-files={workspaceFiles.map((file) => file.path).join(',')}
      >
        {showRunButton ? (
          <button disabled={!onRunPreview} onClick={onRunPreview} type="button">
            {previewing ? 'Running' : 'Run'}
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
vi.mock('../hooks/useJsTemplateProject', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useJsTemplateProject: () => ({ ...mocks.api }) as unknown as UseJsTemplateProjectResult,
  };
});

function createSaveResult() {
  return {
    project: { id: 'jtp_sales' },
    commit: { id: 'commit-2' },
    tree: { hash: 'tree-2', entryCount: 1, byteSize: 55 },
    compile: {
      status: 'success',
      templates: [],
    },
    diagnostics: [],
  };
}

function createDeferred<T>() {
  let resolvePromise!: (value: T | PromiseLike<T>) => void;
  let rejectPromise!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  return { promise, reject: rejectPromise, resolve: resolvePromise };
}

async function confirmSaveVersion(message: string) {
  const saveDialog = await screen.findByRole('dialog', { name: 'Save version' });
  fireEvent.change(within(saveDialog).getByLabelText('Version message'), {
    target: { value: message },
  });
  fireEvent.click(within(saveDialog).getByRole('button', { name: 'Save' }));
}

describe('JsTemplateSourceProjectWorkspacePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.api.getProject.mockResolvedValue({
      id: 'jtp_sales',
      name: 'sales-widgets',
      normalizedName: 'sales-widgets',
      title: 'Sales widgets',
      lifecycleStatus: 'enabled',
      healthStatus: 'pending',
      headCommitId: 'commit-1',
    });
    mocks.api.pull.mockResolvedValue({
      project: { id: 'jtp_sales' },
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
      project: { id: 'jtp_sales' },
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
        runtimeVersion: 'v2',
        entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      },
    });
    mocks.api.inspectSourceArchive.mockResolvedValue({ files: [] });
    mocks.api.listCommits.mockResolvedValue([]);
    mocks.api.diffCommits.mockResolvedValue({
      files: [],
      summary: { added: 0, modified: 0, deleted: 0, unchanged: 0, renamed: 0 },
    });
    mocks.archive.createJsTemplateWorkspaceArchive.mockResolvedValue(
      new Blob(['workspace'], { type: 'application/zip' }),
    );
    mocks.archive.downloadJsTemplateWorkspaceArchive.mockReturnValue(true);
    mocks.archive.readJsTemplateWorkspaceArchive.mockResolvedValue('zip-base64');
  });

  it('keeps Project B metadata, files, and base head when Project A succeeds late', async () => {
    const projectA = {
      id: 'jtp_a',
      name: 'project-a',
      normalizedName: 'project-a',
      title: 'Project A',
      lifecycleStatus: 'enabled' as const,
      healthStatus: 'pending' as const,
      headCommitId: 'commit-a',
    };
    const projectB = {
      id: 'jtp_b',
      name: 'project-b',
      normalizedName: 'project-b',
      title: 'Project B',
      lifecycleStatus: 'enabled' as const,
      healthStatus: 'pending' as const,
      headCommitId: 'commit-b',
    };
    const projectARequest = createDeferred<typeof projectA>();
    mocks.api.getProject.mockImplementation((projectId: string) =>
      projectId === projectA.id ? projectARequest.promise : Promise.resolve(projectB),
    );
    mocks.api.pull.mockImplementation(async ({ projectId }: { projectId: string }) => ({
      project: { id: projectId },
      commit: { id: projectId === projectA.id ? 'commit-a' : 'commit-b' },
      tree: { hash: `tree-${projectId}`, entryCount: 1, byteSize: 24 },
      unchanged: false,
      files: [
        {
          path: `src/client/${projectId}.tsx`,
          content: `export default '${projectId}';\n`,
          language: 'typescript',
        },
      ],
    }));

    const view = render(
      <MemoryRouter>
        <JsTemplateSourceProjectWorkspacePage projectId={projectA.id} />
      </MemoryRouter>,
    );
    await waitFor(() => expect(mocks.api.getProject).toHaveBeenCalledWith(projectA.id));

    view.rerender(
      <MemoryRouter>
        <JsTemplateSourceProjectWorkspacePage projectId={projectB.id} />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Project B')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit file content')).toHaveValue("export default 'jtp_b';\n");

    await act(async () => {
      projectARequest.resolve(projectA);
      await projectARequest.promise;
    });

    await waitFor(() => expect(screen.getByText('Project B')).toBeInTheDocument());
    expect(screen.getByLabelText('Edit file content')).toHaveValue("export default 'jtp_b';\n");
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: "export default 'jtp_b_updated';\n" },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await confirmSaveVersion('Update Project B');
    await waitFor(() => expect(mocks.api.saveSource).toHaveBeenCalledTimes(1));
    expect(mocks.api.saveSource).toHaveBeenCalledWith(
      expect.objectContaining({ expectedHeadCommitId: 'commit-b', projectId: projectB.id }),
    );
  });

  it('ignores a late Project A load error after Project B succeeds', async () => {
    const projectARequest = createDeferred<{
      id: string;
      name: string;
      normalizedName: string;
      title: string;
      lifecycleStatus: 'enabled';
      healthStatus: 'pending';
      headCommitId: string;
    }>();
    const projectB = {
      id: 'jtp_b',
      name: 'project-b',
      normalizedName: 'project-b',
      title: 'Project B',
      lifecycleStatus: 'enabled' as const,
      healthStatus: 'pending' as const,
      headCommitId: 'commit-b',
    };
    mocks.api.getProject.mockImplementation((projectId: string) =>
      projectId === 'jtp_a' ? projectARequest.promise : Promise.resolve(projectB),
    );
    mocks.api.pull.mockResolvedValue({
      project: { id: projectB.id },
      commit: { id: 'commit-b' },
      tree: { hash: 'tree-b', entryCount: 1, byteSize: 24 },
      unchanged: false,
      files: [
        {
          path: 'src/client/project-b.tsx',
          content: "export default 'project-b';\n",
          language: 'typescript',
        },
      ],
    });

    const view = render(
      <MemoryRouter>
        <JsTemplateSourceProjectWorkspacePage projectId="jtp_a" />
      </MemoryRouter>,
    );
    await waitFor(() => expect(mocks.api.getProject).toHaveBeenCalledWith('jtp_a'));

    view.rerender(
      <MemoryRouter>
        <JsTemplateSourceProjectWorkspacePage projectId={projectB.id} />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Project B')).toBeInTheDocument();

    await act(async () => {
      projectARequest.reject(new Error('Project A failed'));
      await expect(projectARequest.promise).rejects.toThrow('Project A failed');
    });

    await waitFor(() => expect(screen.getByText('Project B')).toBeInTheDocument());
    expect(screen.getByLabelText('Edit file content')).toHaveValue("export default 'project-b';\n");
    expect(screen.queryByText('Project A failed')).not.toBeInTheDocument();
  });

  it('keeps current Project B loading when stale Project A finishes', async () => {
    let footerActions: JsTemplateSourceProjectWorkspaceFooterActions | null = null;
    const projectB = {
      id: 'jtp_b',
      name: 'project-b',
      normalizedName: 'project-b',
      title: 'Project B',
      lifecycleStatus: 'enabled' as const,
      healthStatus: 'pending' as const,
      headCommitId: 'commit-b',
    };
    const projectARequest = createDeferred<typeof projectB>();
    const projectBPullResult = {
      project: { id: projectB.id },
      commit: { id: 'commit-b' },
      tree: { hash: 'tree-b', entryCount: 1, byteSize: 24 },
      unchanged: false,
      files: [
        {
          path: 'src/client/project-b.tsx',
          content: "export default 'project-b';\n",
          language: 'typescript',
        },
      ],
    };
    const currentProjectBPullRequest = createDeferred<typeof projectBPullResult>();
    let projectBPullCount = 0;
    const handleFooterActionsChange = (actions: JsTemplateSourceProjectWorkspaceFooterActions | null) => {
      footerActions = actions;
    };
    mocks.api.getProject.mockImplementation((projectId: string) =>
      projectId === 'jtp_a' ? projectARequest.promise : Promise.resolve(projectB),
    );
    mocks.api.pull.mockImplementation(({ projectId }: { projectId: string }) => {
      if (projectId !== projectB.id) {
        throw new Error(`Unexpected pull for ${projectId}`);
      }
      projectBPullCount += 1;
      return projectBPullCount === 1 ? Promise.resolve(projectBPullResult) : currentProjectBPullRequest.promise;
    });

    const view = render(
      <MemoryRouter>
        <JsTemplateSourceProjectWorkspacePage
          onFooterActionsChange={handleFooterActionsChange}
          projectId={projectB.id}
        />
      </MemoryRouter>,
    );
    expect(await screen.findByText('Project B')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: "export default 'project-b-edited';\n" },
    });
    await waitFor(() => expect(footerActions?.disabled).toBe(false));

    view.rerender(
      <MemoryRouter>
        <JsTemplateSourceProjectWorkspacePage onFooterActionsChange={handleFooterActionsChange} projectId="jtp_a" />
      </MemoryRouter>,
    );
    await waitFor(() => expect(mocks.api.getProject).toHaveBeenCalledWith('jtp_a'));

    view.rerender(
      <MemoryRouter>
        <JsTemplateSourceProjectWorkspacePage
          onFooterActionsChange={handleFooterActionsChange}
          projectId={projectB.id}
        />
      </MemoryRouter>,
    );
    await waitFor(() => expect(projectBPullCount).toBe(2));
    expect(screen.getByText('Project B')).toBeInTheDocument();
    expect(screen.getByText('Loading source')).toBeInTheDocument();
    expect(footerActions?.disabled).toBe(true);

    await act(async () => {
      projectARequest.reject(new Error('Stale Project A failed'));
      await expect(projectARequest.promise).rejects.toThrow('Stale Project A failed');
    });

    await waitFor(() => expect(screen.getByText('Project B')).toBeInTheDocument());
    expect(screen.getByText('Loading source')).toBeInTheDocument();
    expect(screen.queryByText('Stale Project A failed')).not.toBeInTheDocument();
    expect(footerActions?.disabled).toBe(true);

    await act(async () => {
      currentProjectBPullRequest.resolve(projectBPullResult);
      await currentProjectBPullRequest.promise;
    });

    await waitFor(() => expect(screen.queryByText('Loading source')).not.toBeInTheDocument());
    expect(screen.getByText('Project B')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit file content')).toHaveValue("export default 'project-b';\n");
  });

  it('saves only dirty source changes without compiling a workspace preview first', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings/js-template?panel=source&projectId=jtp_sales']}>
        <JsTemplateSourceProjectWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
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
        projectId: 'jtp_sales',
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
      new JsTemplateHookError({
        operation: 'saveSource',
        code: 'RUNJS_COMPILE_FAILED',
        status: 422,
        message: 'JS Template source cannot be compiled',
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
      <MemoryRouter initialEntries={['/admin/settings/js-template?panel=source&projectId=jtp_sales']}>
        <JsTemplateSourceProjectWorkspacePage onRequestClose={onRequestClose} onSaved={onSaved} />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: "const count: number = 'invalid';\nctx.render(<div>{count}</div>);\n" },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await confirmSaveVersion('Invalid source');

    expect(await screen.findByText('JS Template source cannot be compiled')).toBeInTheDocument();
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
      new JsTemplateHookError({
        operation: 'saveSource',
        code: 'JS_TEMPLATE_SOURCE_OUTDATED',
        status: 409,
        message: 'JS Template source changed after the workspace was opened',
      }),
    );

    render(
      <MemoryRouter initialEntries={['/admin/settings/js-template?panel=source&projectId=jtp_sales']}>
        <JsTemplateSourceProjectWorkspacePage onRequestClose={onRequestClose} onSaved={onSaved} />
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
    let footerActions: JsTemplateSourceProjectWorkspaceFooterActions | null = null;
    let rejectSave: ((reason?: unknown) => void) | undefined;
    const onRequestClose = vi.fn();
    const onSaved = vi.fn();
    const pendingSave = new Promise<ReturnType<typeof createSaveResult>>((_resolve, reject) => {
      rejectSave = reject;
    });
    mocks.api.saveSource.mockReturnValueOnce(pendingSave);

    render(
      <MemoryRouter>
        <JsTemplateSourceProjectWorkspacePage
          embedded
          onFooterActionsChange={(actions) => {
            footerActions = actions;
          }}
          onRequestClose={onRequestClose}
          onSaved={onSaved}
          projectId="jtp_sales"
        />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'export default function SalesKpi() { return "offline edit"; }\n' },
    });
    await waitFor(() => expect(footerActions?.disabled).toBe(false));
    let hostSavePromise: ReturnType<JsTemplateSourceProjectWorkspaceFooterActions['requestSave']> | undefined;
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

  it('runs the current unsaved entry workspace through the host preview', async () => {
    const onPreview = vi.fn(async () => undefined);
    const workspaceScope: JsTemplateWorkspaceScope = {
      mode: 'template',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      kind: 'js-block',
    };

    render(
      <MemoryRouter>
        <JsTemplateSourceProjectWorkspacePage
          embedded
          templateId="jtt_sales_kpi"
          onPreview={onPreview}
          projectId="jtp_sales"
          workspaceScope={workspaceScope}
        />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    expect(screen.getByTestId('runjs-code-tab')).toHaveAttribute('data-show-run-button', 'true');
    expect(screen.getByTestId('runjs-code-tab')).toHaveAttribute('data-has-run', 'true');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'ctx.render(<div>unsaved run</div>);\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Run' }));

    await waitFor(() => expect(onPreview).toHaveBeenCalledTimes(1));
    expect(onPreview).toHaveBeenCalledWith({
      code: 'ctx.render(<div>preview</div>);',
      runtimeVersion: 'v2',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
    });
    expect(mocks.api.saveSource).not.toHaveBeenCalled();
  });

  it('blocks detaching an unsaved entry workspace to Inline', async () => {
    const onDetachJsTemplateToInline = vi.fn(async () => undefined);
    const confirmSpy = vi.spyOn(Modal, 'confirm').mockImplementation((config) => {
      config.onOk?.(() => undefined);
      return {
        destroy: vi.fn(),
        update: vi.fn(),
      } as ReturnType<typeof Modal.confirm>;
    });
    const workspaceScope: JsTemplateWorkspaceScope = {
      mode: 'template',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      kind: 'js-block',
    };

    render(
      <MemoryRouter>
        <JsTemplateSourceProjectWorkspacePage
          embedded
          templateId="jtt_sales_kpi"
          onDetachJsTemplateToInline={onDetachJsTemplateToInline}
          projectId="jtp_sales"
          workspaceScope={workspaceScope}
        />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'ctx.render(<div>unsaved inline detach</div>);\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Detach to Inline' }));

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(onDetachJsTemplateToInline).not.toHaveBeenCalled();
    expect(
      await screen.findByText(
        'This workspace has unsaved changes. Save them first, or close and discard them before detaching to Inline.',
      ),
    ).toBeInTheDocument();
    confirmSpy.mockRestore();
  });

  it('offers detaching the committed Project Head to Inline', async () => {
    const onDetachJsTemplateToInline = vi.fn(async () => undefined);
    const confirmSpy = vi.spyOn(Modal, 'confirm').mockImplementation((config) => {
      config.onOk?.(() => undefined);
      return {
        destroy: vi.fn(),
        update: vi.fn(),
      } as ReturnType<typeof Modal.confirm>;
    });
    const workspaceScope: JsTemplateWorkspaceScope = {
      mode: 'template',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      kind: 'js-block',
    };

    render(
      <MemoryRouter>
        <JsTemplateSourceProjectWorkspacePage
          embedded
          templateId="jtt_sales_kpi"
          onDetachJsTemplateToInline={onDetachJsTemplateToInline}
          projectId="jtp_sales"
          workspaceScope={workspaceScope}
        />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    fireEvent.click(screen.getByRole('button', { name: 'Detach to Inline' }));

    expect(confirmSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Detach to Inline?',
        content:
          'The committed Project Head for this template and its referenced files will be copied to inline code. The JS Template will remain unchanged.',
        okText: 'Detach to Inline',
        transitionName: '',
        maskTransitionName: '',
      }),
    );
    await waitFor(() =>
      expect(onDetachJsTemplateToInline).toHaveBeenCalledWith({
        expectedProjectHeadCommitId: 'commit-1',
      }),
    );
    confirmSpy.mockRestore();
  });

  it('renames an entry directory without changing its entry.json key', async () => {
    const descriptorContent = '{\n  "schemaVersion": 1,\n  "key": "stable-sales-kpi",\n  "title": "Sales KPI"\n}\n';
    mocks.api.pull.mockResolvedValueOnce({
      project: { id: 'jtp_sales' },
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
      <MemoryRouter initialEntries={['/admin/settings/js-template?panel=source&projectId=jtp_sales']}>
        <JsTemplateSourceProjectWorkspacePage />
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

  it('renames a new empty entry directory before its descriptor is created', async () => {
    const errorSpy = vi.spyOn(message, 'error');

    render(
      <MemoryRouter initialEntries={['/admin/settings/js-template?panel=source&projectId=jtp_sales']}>
        <JsTemplateSourceProjectWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    fireEvent.click(screen.getByRole('button', { name: 'New js-block folder' }));
    fireEvent.click(screen.getByRole('button', { name: 'Rename folder src/client/js-blocks/folder', exact: true }));

    expect(errorSpy).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Rename folder src/client/js-blocks/folder-renamed', exact: true }),
    ).toBeInTheDocument();
    errorSpy.mockRestore();
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
      project: { id: 'jtp_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: files.length, byteSize: 90 },
      unchanged: false,
      files,
    });
    const errorSpy = vi.spyOn(message, 'error');

    render(
      <MemoryRouter initialEntries={['/admin/settings/js-template?panel=source&projectId=jtp_sales']}>
        <JsTemplateSourceProjectWorkspacePage />
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

  it('limits embedded entry workspaces to the selected entry and public files', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      project: { id: 'jtp_sales' },
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
        projectId: 'jtp_sales',
        hash: 'hash-1',
        seq: 1,
        parentCommitId: null,
        treeHash: 'tree-1',
        message: 'Initial source',
        authorId: null,
        metadata: {},
      },
    ]);
    const workspaceScope: JsTemplateWorkspaceScope = {
      mode: 'template',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      kind: 'js-block',
    };

    render(
      <MemoryRouter>
        <JsTemplateSourceProjectWorkspacePage
          initialPath={workspaceScope.entryPath}
          projectId="jtp_sales"
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
      'Other JS Templates are read-only here',
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

  it('exports the current unsaved template-scoped workspace from the files panel', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      project: { id: 'jtp_sales' },
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
    mocks.archive.createJsTemplateWorkspaceArchive.mockResolvedValueOnce(archive);
    const workspaceScope: JsTemplateWorkspaceScope = {
      mode: 'template',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      kind: 'js-block',
    };

    render(
      <MemoryRouter>
        <JsTemplateSourceProjectWorkspacePage
          initialPath={workspaceScope.entryPath}
          projectId="jtp_sales"
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

    await waitFor(() => expect(mocks.archive.createJsTemplateWorkspaceArchive).toHaveBeenCalledTimes(1));
    expect(mocks.archive.createJsTemplateWorkspaceArchive).toHaveBeenCalledWith([
      expect.objectContaining({ path: 'README.md', content: '# Sales widgets\n' }),
      expect.objectContaining({
        path: 'src/client/js-blocks/sales-kpi/index.tsx',
        content: 'ctx.render(<div>Unsaved sales</div>);\n',
      }),
      expect.objectContaining({ path: 'src/shared/format.ts', content: 'export const format = String;\n' }),
    ]);
    expect(mocks.archive.downloadJsTemplateWorkspaceArchive).toHaveBeenCalledWith(archive, 'sales-widgets.zip');
    expect(mocks.api.saveSource).not.toHaveBeenCalled();
  });

  it('imports template-scoped ZIP files into local editor state while preserving read-only templates', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      project: { id: 'jtp_sales' },
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
    const workspaceScope: JsTemplateWorkspaceScope = {
      mode: 'template',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      kind: 'js-block',
    };

    render(
      <MemoryRouter>
        <JsTemplateSourceProjectWorkspacePage
          initialPath={workspaceScope.entryPath}
          projectId="jtp_sales"
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
    expect(mocks.archive.readJsTemplateWorkspaceArchive).toHaveBeenCalledWith(zipFile, 'Failed to read source ZIP');
    expect(mocks.api.inspectSourceArchive).toHaveBeenCalledWith({
      projectId: 'jtp_sales',
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

  it('rejects a template-scoped ZIP that does not include the current template source file', async () => {
    mocks.api.inspectSourceArchive.mockResolvedValueOnce({
      files: [
        {
          path: 'src/shared/format.ts',
          content: 'export const format = String;\n',
          language: 'typescript',
        },
      ],
    });
    const workspaceScope: JsTemplateWorkspaceScope = {
      mode: 'template',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      kind: 'js-block',
    };

    render(
      <MemoryRouter>
        <JsTemplateSourceProjectWorkspacePage
          initialPath={workspaceScope.entryPath}
          projectId="jtp_sales"
          workspaceScope={workspaceScope}
        />
      </MemoryRouter>,
    );

    await screen.findByTestId('runjs-code-tab');
    const zipFile = new File(['zip'], 'missing-entry.zip', { type: 'application/zip' });
    fireEvent.change(screen.getByLabelText('Import workspace'), {
      target: { files: [zipFile] },
    });

    expect(await screen.findByText('ZIP does not contain the current template source file')).toBeInTheDocument();
    expect(screen.getByLabelText('Edit file content')).toHaveValue(
      'export default function SalesKpi() { return null; }\n',
    );
    expect(mocks.api.saveSource).not.toHaveBeenCalled();
  });

  it('restores only editable template-scoped files into the unsaved editor state', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      project: { id: 'jtp_sales' },
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
        projectId: 'jtp_sales',
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
      project: { id: 'jtp_sales' },
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
    const workspaceScope: JsTemplateWorkspaceScope = {
      mode: 'template',
      entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
      kind: 'js-block',
    };

    render(
      <MemoryRouter>
        <JsTemplateSourceProjectWorkspacePage
          initialPath={workspaceScope.entryPath}
          projectId="jtp_sales"
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

  it('does not seed or save an empty project in the client workspace', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      project: { id: 'jtp_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-empty', entryCount: 0, byteSize: 0 },
      unchanged: false,
      files: [],
    });

    render(
      <MemoryRouter initialEntries={['/admin/settings/js-template?panel=source&projectId=jtp_sales']}>
        <JsTemplateSourceProjectWorkspacePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Empty Source Project')).toBeInTheDocument();
    expect(screen.queryByTestId('runjs-code-tab')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save/ })).toBeDisabled();
    expect(mocks.api.saveSource).not.toHaveBeenCalled();
  });

  it('creates missing repo root files from the reused default new-file entry', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings/js-template?panel=source&projectId=jtp_sales']}>
        <JsTemplateSourceProjectWorkspacePage />
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
          content: expect.stringContaining('src/client/js-blocks/<template-name>/index.tsx'),
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
      expect.arrayContaining([expect.objectContaining({ path: expect.stringMatching(/^\.js-template\/types\//) })]),
    );
  });

  it('keeps generated SDK declarations out of saveSource changes', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      project: { id: 'jtp_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-1', entryCount: 2, byteSize: 260 },
      unchanged: false,
      files: [
        {
          path: 'src/client/js-blocks/product-list/index.tsx',
          content: 'import type { Settings } from "js-template:settings/client/js-block/product-list";\n',
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
      <MemoryRouter initialEntries={['/admin/settings/js-template?panel=source&projectId=jtp_sales']}>
        <JsTemplateSourceProjectWorkspacePage initialPath="src/client/js-blocks/product-list/index.tsx" />
      </MemoryRouter>,
    );

    const codeTab = await screen.findByTestId('runjs-code-tab');
    const workspaceFileContents = codeTab.getAttribute('data-workspace-file-contents') || '';
    expect(workspaceFileContents).toContain('JSBlockContext');
    expect(workspaceFileContents).toContain('RunJSContext');

    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: {
        value:
          'import type { Settings } from "js-template:settings/client/js-block/product-list";\nctx.render(null as unknown as Settings);\n',
      },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));
    await confirmSaveVersion('Update product list');

    await waitFor(() => expect(mocks.api.saveSource).toHaveBeenCalledTimes(1));
    expect(mocks.api.saveSource.mock.calls[0][0].files).toEqual([
      expect.objectContaining({ path: 'src/client/js-blocks/product-list/index.tsx', operation: 'upsert' }),
    ]);
  });

  it('opens the permission-protected commit diff from version history', async () => {
    mocks.api.listCommits.mockResolvedValueOnce([
      {
        id: 'commit-2',
        projectId: 'jtp_sales',
        hash: 'hash-2',
        seq: 2,
        parentCommitId: 'commit-1',
        treeHash: 'tree-2',
        message: 'Update source',
        authorId: null,
        metadata: {},
      },
    ]);
    mocks.api.diffCommits.mockResolvedValueOnce({
      files: [
        {
          status: 'modified',
          path: 'src/client/js-blocks/sales-kpi/index.tsx',
          pathHash: 'path-1',
          additions: 2,
          deletions: 1,
          tooLarge: false,
        },
      ],
      summary: { added: 0, modified: 1, deleted: 0, unchanged: 0, renamed: 0 },
    });

    render(
      <MemoryRouter initialEntries={['/admin/settings/js-template?panel=source&projectId=jtp_sales']}>
        <JsTemplateSourceProjectWorkspacePage />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Changes v2' }));
    await waitFor(() => {
      expect(mocks.api.diffCommits).toHaveBeenCalledWith({
        projectId: 'jtp_sales',
        fromCommitId: 'commit-1',
        toCommitId: 'commit-2',
      });
    });
    const dialog = await screen.findByRole('dialog', { name: /Commit changes.*v2/ });
    expect(dialog).toBeInTheDocument();
    expect(within(dialog).getByText('src/client/js-blocks/sales-kpi/index.tsx')).toBeInTheDocument();
  });

  it('loads older history pages without duplicating commits', async () => {
    const initialCommits = Array.from({ length: 20 }, (_, index) => ({
      id: `commit-${40 - index}`,
      projectId: 'jtp_sales',
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
      <MemoryRouter initialEntries={['/admin/settings/js-template?panel=source&projectId=jtp_sales']}>
        <JsTemplateSourceProjectWorkspacePage />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Load more' }));

    await waitFor(() => expect(mocks.api.listCommits).toHaveBeenCalledTimes(2));
    expect(mocks.api.listCommits).toHaveBeenNthCalledWith(2, {
      projectId: 'jtp_sales',
      limit: 20,
      beforeSeq: 21,
    });
    expect(await screen.findByRole('button', { name: 'Restore v20' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'Restore v21' })).toHaveLength(1);
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Load more' })).toBeNull());
  });
});
