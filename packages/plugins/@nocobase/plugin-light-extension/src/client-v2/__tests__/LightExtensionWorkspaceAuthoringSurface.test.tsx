/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { CodeAuthoringSurface } from '@nocobase/client-v2';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { LightExtensionWorkspacePreviewResult } from '../../shared/types';
import type { UseLightExtensionRepoResult } from '../hooks/useLightExtensionRepo';
import LightExtensionWorkspacePage from '../pages/LightExtensionWorkspacePage';
import type { LightExtensionWorkspaceScope } from '../workspace/lightExtensionWorkspaceAccess';

const entryPath = 'src/client/js-blocks/sales-kpi/index.tsx';
const entryScope: LightExtensionWorkspaceScope = { mode: 'entry', entryPath, kind: 'js-block' };

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
  authoring: {
    surface: undefined as CodeAuthoringSurface | undefined,
    register: vi.fn(),
    activate: vi.fn(),
    unregister: vi.fn(),
  },
  preview: {
    hook: vi.fn(() => ({ enabled: false, diagnostics: [], status: 'idle' })),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mocks.t }),
}));

vi.mock('@nocobase/client-v2', async () => {
  const ReactModule = await vi.importActual<typeof import('react')>('react');
  return {
    ApplicationContext: ReactModule.createContext({
      aiManager: {
        authoringSurfaces: {
          register: mocks.authoring.register,
          activate: mocks.authoring.activate,
        },
      },
    }),
    useFullscreenOverlay: () => {
      const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
      return {
        isFullscreen: false,
        toggleFullscreen: vi.fn(),
        placeholderRef: setContainer,
        placeholderStyle: {},
        container,
      };
    },
  };
});

vi.mock('../browser-preview/BrowserPreviewSession', () => ({
  isBrowserProvisionalPreviewEnabled: () => false,
}));

vi.mock('../browser-preview/useBrowserProvisionalPreview', () => ({
  getLightExtensionPreviewSurfaceStyle: () => 'page',
  useBrowserProvisionalPreview: mocks.preview.hook,
}));

vi.mock('../components/DiagnosticsPanel', () => ({ default: () => null }));

vi.mock('../vsc-file/public-api', () => ({
  buildLineDiff: () => [],
  inferLanguageFromPath: (path: string) => {
    if (path.endsWith('.tsx')) return 'typescriptreact';
    if (path.endsWith('.ts')) return 'typescript';
    if (path.endsWith('.json')) return 'json';
    return 'plaintext';
  },
  mergeHistoryItems: <T,>(current: T[], next: T[]) => [...current, ...next],
  summarizeWorkspaceChanges: () => ({ files: 1, additions: 1, deletions: 1 }),
  useVscFileT: () => (key: string) => key,
  FilesPanel: () => <div data-testid="files-panel" />,
  VersionHistoryDock: () => null,
  RestoreVersionModal: () => null,
  SaveVersionModal: () => null,
  CloseConfirmModal: () => null,
  CodeTab: ({
    activeFile,
    authoringSurfaceId,
    onAuthoringSurfaceActivate,
    onChange,
    workspaceFiles,
  }: {
    activeFile?: { path: string; content: string };
    authoringSurfaceId?: string;
    onAuthoringSurfaceActivate?: (surfaceId: string) => void;
    onChange: (content: string) => void;
    workspaceFiles: Array<{ path: string }>;
  }) => (
    <div
      data-authoring-surface-id={authoringSurfaceId}
      data-testid="code-tab"
      data-workspace-paths={workspaceFiles.map((file) => file.path).join(',')}
    >
      <span data-testid="active-path">{activeFile?.path}</span>
      <textarea
        aria-label="Edit file content"
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => {
          if (authoringSurfaceId) {
            onAuthoringSurfaceActivate?.(authoringSurfaceId);
          }
        }}
        value={activeFile?.content || ''}
      />
    </div>
  ),
}));

vi.mock('../hooks/useLightExtensionRepo', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useLightExtensionRepo: () => ({ ...mocks.api }) as unknown as UseLightExtensionRepoResult,
  };
});

function getRegisteredSurface(): CodeAuthoringSurface {
  const surface = mocks.authoring.surface;
  if (!surface) {
    throw new Error('Expected a registered authoring surface');
  }
  return surface;
}

function renderEntryWorkspace(browserProvisionalPreview = false) {
  return render(
    <MemoryRouter>
      <LightExtensionWorkspacePage
        browserProvisionalPreview={browserProvisionalPreview}
        embedded
        entryId="entry-sales-kpi"
        initialPath={entryPath}
        repoId="ler_sales"
        workspaceScope={entryScope}
      />
    </MemoryRouter>,
  );
}

describe('LightExtensionWorkspace authoring surface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authoring.surface = undefined;
    mocks.authoring.register.mockImplementation((surface: CodeAuthoringSurface) => {
      mocks.authoring.surface = surface;
      return mocks.authoring.unregister;
    });
    mocks.api.getRepo.mockResolvedValue({
      id: 'ler_sales',
      name: 'sales-widgets',
      title: 'Sales widgets',
      lifecycleStatus: 'enabled',
    });
    mocks.api.pull.mockResolvedValue({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      files: [
        {
          path: entryPath,
          content: 'export default function SalesKpi() { return null; }\n',
          language: 'typescriptreact',
        },
        {
          path: 'src/client/js-blocks/sales-kpi/entry.json',
          content: '{"schemaVersion":1,"key":"sales-kpi"}',
          language: 'json',
        },
        {
          path: 'src/client/js-actions/secret/index.ts',
          content: 'export const secret = true;\n',
          language: 'typescript',
        },
        { path: 'src/shared/currency.ts', content: 'export const currency = "USD";\n', language: 'typescript' },
        { path: 'tsconfig.json', content: '{}\n', language: 'json' },
        { path: 'README.md', content: 'private repository notes\n', language: 'markdown' },
      ],
    });
    mocks.api.pullCommit.mockResolvedValue({ files: [] });
    mocks.api.listCommits.mockResolvedValue([]);
    mocks.api.inspectSourceArchive.mockResolvedValue({ files: [] });
    mocks.api.compileWorkspacePreview.mockResolvedValue({ accepted: true, diagnostics: [] });
  });

  it('projects only entry dependencies and applies source-only changes without preview or save', async () => {
    renderEntryWorkspace(true);
    await screen.findByTestId('code-tab');
    await waitFor(() => expect(mocks.authoring.register).toHaveBeenCalledTimes(1));
    const surface = getRegisteredSurface();
    const snapshot = await surface.getSnapshot();

    expect(surface.id).toBe(
      'light-extension:ler_sales:entry:entry-sales-kpi:js-block:src%2Fclient%2Fjs-blocks%2Fsales-kpi%2Findex.tsx',
    );
    expect(snapshot.files.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        entryPath,
        'src/client/js-blocks/sales-kpi/entry.json',
        'src/shared/currency.ts',
        'tsconfig.json',
        '.light-extension/types/sdk.d.ts',
      ]),
    );
    expect(snapshot.files.map((file) => file.path)).not.toEqual(
      expect.arrayContaining(['src/client/js-actions/secret/index.ts', 'README.md']),
    );
    expect(snapshot.files.find((file) => file.path.endsWith('/entry.json'))).toMatchObject({ writable: false });
    expect(snapshot.files.find((file) => file.path === 'src/shared/currency.ts')).toMatchObject({ writable: false });
    expect(snapshot.files.find((file) => file.path === '.light-extension/types/sdk.d.ts')).toMatchObject({
      kind: 'virtual',
      writable: false,
      persisted: false,
    });
    const indexMeta = snapshot.files.find((file) => file.path === entryPath);
    if (!indexMeta) {
      throw new Error('Expected entry source metadata');
    }
    const plan = await surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [
        {
          type: 'update',
          path: entryPath,
          baseHash: indexMeta.hash,
          content: "import { formatCurrency } from './formatCurrency';\nexport default formatCurrency;\n",
        },
        {
          type: 'create',
          path: 'src/client/js-blocks/sales-kpi/formatCurrency.ts',
          content: 'export const formatCurrency = () => "USD";\n',
          language: 'typescript',
        },
      ],
    });

    await act(async () => {
      await surface.applyPreparedChanges(plan.planId);
    });

    await waitFor(async () => {
      const nextSnapshot = await surface.getSnapshot();
      expect(nextSnapshot.files.map((file) => file.path)).toContain('src/client/js-blocks/sales-kpi/formatCurrency.ts');
    });
    expect(mocks.api.saveSource).not.toHaveBeenCalled();
    expect(mocks.api.compileWorkspacePreview).not.toHaveBeenCalled();
    expect(mocks.preview.hook).toHaveBeenLastCalledWith(
      expect.objectContaining({ enabled: true, suppressBuild: true }),
    );
    expect(mocks.authoring.activate).not.toHaveBeenCalled();
    fireEvent.focus(screen.getByLabelText('Edit file content'));
    expect(mocks.authoring.activate).toHaveBeenCalledWith(surface.id);

    await act(async () => {
      await surface.reveal('src/client/js-blocks/sales-kpi/formatCurrency.ts', {
        start: { line: 1, column: 8 },
      });
    });
    expect(screen.getByTestId('active-path')).toHaveTextContent('src/client/js-blocks/sales-kpi/formatCurrency.ts');
  });

  it('validates the complete source tree, filters diagnostics, and marks results stale after manual edits', async () => {
    let resolveCompile: ((result: LightExtensionWorkspacePreviewResult) => void) | undefined;
    mocks.api.compileWorkspacePreview.mockImplementationOnce(
      () =>
        new Promise<LightExtensionWorkspacePreviewResult>((resolve) => {
          resolveCompile = resolve;
        }),
    );
    renderEntryWorkspace();
    await screen.findByTestId('code-tab');
    await waitFor(() => expect(mocks.authoring.register).toHaveBeenCalledTimes(1));
    const surface = getRegisteredSurface();
    const validationPromise = surface.validateDraft();

    fireEvent.change(screen.getByLabelText('Edit file content'), { target: { value: 'manual edit\n' } });
    await act(async () => {
      resolveCompile?.({
        accepted: false,
        diagnostics: [
          {
            code: 'entry_error',
            severity: 'error',
            message: 'Entry error imported from src/client/js-actions/secret/index.ts',
            path: entryPath,
            line: 3,
            column: 7,
            kind: 'js-block',
            entryName: 'sales-kpi',
          },
          {
            code: 'secret_error',
            severity: 'error',
            message: 'Secret error in src/client/js-actions/secret/index.ts',
            path: 'src/client/js-actions/secret/index.ts',
            kind: 'js-action',
            entryName: 'secret',
          },
          {
            code: 'other_entry_error',
            severity: 'warning',
            message: 'Other entry failed',
            kind: 'js-action',
            entryName: 'secret',
          },
        ],
      });
    });
    const result = await validationPromise;

    expect(result).toMatchObject({ stale: true, saved: false });
    expect(result.diagnostics).toEqual([
      expect.objectContaining({
        code: 'entry_error',
        message: 'Entry error imported from [redacted light extension entry path]',
        path: entryPath,
        range: { start: { line: 3, column: 7 } },
      }),
    ]);
    expect(mocks.api.compileWorkspacePreview).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: 'ler_sales',
        entryId: 'entry-sales-kpi',
        entryPath,
        files: expect.arrayContaining([
          expect.objectContaining({ path: entryPath }),
          expect.objectContaining({ path: 'src/client/js-actions/secret/index.ts' }),
          expect.objectContaining({ path: 'src/shared/currency.ts' }),
        ]),
      }),
    );
    expect(mocks.api.saveSource).not.toHaveBeenCalled();
  });
});
