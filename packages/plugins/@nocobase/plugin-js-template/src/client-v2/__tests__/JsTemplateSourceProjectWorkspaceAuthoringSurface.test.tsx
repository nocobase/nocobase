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

import type { UseJsTemplateProjectResult } from '../hooks/useJsTemplateProject';
import JsTemplateSourceProjectWorkspacePage from '../pages/JsTemplateSourceProjectWorkspacePage';
import type { JsTemplateWorkspaceScope } from '../workspace/jsTemplateWorkspaceAccess';

const entryPath = 'src/client/js-blocks/sales-kpi/index.tsx';
const templateScope: JsTemplateWorkspaceScope = { mode: 'template', entryPath, kind: 'js-block' };

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
  },
  authoring: {
    surface: undefined as CodeAuthoringSurface | undefined,
    register: vi.fn(),
    unregister: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: mocks.t }),
}));

vi.mock('@nocobase/client-v2', async () => {
  const app = {
    aiManager: {
      authoringSurfaces: {
        register: mocks.authoring.register,
      },
    },
  };
  return {
    useApp: () => app,
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

vi.mock('../components/DiagnosticsPanel', () => ({ default: () => null }));

vi.mock('../runjs-studio', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    inferLanguageFromPath: (path: string) => {
      if (path.endsWith('.tsx')) return 'typescriptreact';
      if (path.endsWith('.ts')) return 'typescript';
      if (path.endsWith('.json')) return 'json';
      return 'plaintext';
    },
    mergeHistoryItems: <T,>(current: T[], next: T[]) => [...current, ...next],
    summarizeWorkspaceChanges: () => ({ files: 1, additions: 1, deletions: 1 }),
    useRunJSWorkspaceT: () => (key: string) => key,
    FilesPanel: () => <div data-testid="files-panel" />,
    VersionHistoryDock: () => null,
    RestoreVersionModal: () => null,
    SaveVersionModal: () => null,
    CloseConfirmModal: () => null,
    CodeTab: ({
      activeFile,
      authoringSurfaceId,
      onChange,
      readOnly,
      workspaceFiles,
    }: {
      activeFile?: { path: string; content: string };
      authoringSurfaceId?: string;
      onChange: (content: string) => void;
      readOnly?: boolean;
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
          readOnly={readOnly}
          value={activeFile?.content || ''}
        />
      </div>
    ),
  };
});

vi.mock('../hooks/useJsTemplateProject', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useJsTemplateProject: () => ({ ...mocks.api }) as unknown as UseJsTemplateProjectResult,
  };
});

function getRegisteredSurface(): CodeAuthoringSurface {
  const surface = mocks.authoring.surface;
  if (!surface) {
    throw new Error('Expected a registered authoring surface');
  }
  return surface;
}

function renderTemplateWorkspace() {
  return render(
    <MemoryRouter>
      <JsTemplateSourceProjectWorkspacePage
        embedded
        templateId="jtt-sales-kpi"
        initialPath={entryPath}
        projectId="jtp_sales"
        workspaceScope={templateScope}
      />
    </MemoryRouter>,
  );
}

function renderProjectWorkspace() {
  return render(
    <MemoryRouter>
      <JsTemplateSourceProjectWorkspacePage embedded projectId="jtp_sales" />
    </MemoryRouter>,
  );
}

describe('JsTemplateWorkspace authoring surface', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authoring.surface = undefined;
    mocks.authoring.register.mockImplementation((surface: CodeAuthoringSurface) => {
      mocks.authoring.surface = surface;
      return mocks.authoring.unregister;
    });
    mocks.api.getProject.mockResolvedValue({
      id: 'jtp_sales',
      name: 'sales-widgets',
      title: 'Sales widgets',
      lifecycleStatus: 'enabled',
      permissions: { canWriteSource: true },
    });
    mocks.api.pull.mockResolvedValue({
      project: { id: 'jtp_sales' },
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
        {
          path: 'src/client/js-actions/secret/entry.json',
          content: '{"schemaVersion":1,"key":"secret","title":"Secret"}',
          language: 'json',
        },
        {
          path: 'src/client/js-fields/status-tag/entry.json',
          content: '{"schemaVersion":1,"key":"status-tag","title":"Status tag"}',
          language: 'json',
        },
        {
          path: 'src/client/js-items/total-preview/entry.json',
          content: '{"schemaVersion":1,"key":"total-preview","title":"Total preview"}',
          language: 'json',
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

  it('projects the template scope, applies draft changes, and validates without saving', async () => {
    renderTemplateWorkspace();
    await screen.findByTestId('code-tab');
    await waitFor(() => expect(mocks.authoring.register).toHaveBeenCalledTimes(1));
    const surface = getRegisteredSurface();
    const snapshot = await surface.getSnapshot();

    expect(surface.id).toBe(
      'js-template:jtp_sales:template:jtt-sales-kpi:js-block:src%2Fclient%2Fjs-blocks%2Fsales-kpi%2Findex.tsx',
    );
    expect(snapshot.files.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        entryPath,
        'src/client/js-blocks/sales-kpi/entry.json',
        'src/shared/currency.ts',
        'tsconfig.json',
        '.js-template/types/sdk.d.ts',
      ]),
    );
    expect(snapshot.files.map((file) => file.path)).not.toEqual(
      expect.arrayContaining(['src/client/js-actions/secret/index.ts', 'README.md']),
    );
    const descriptorMeta = snapshot.files.find((file) => file.path.endsWith('/entry.json'));
    expect(descriptorMeta).toMatchObject({ writable: true });
    expect(snapshot.files.find((file) => file.path === 'src/shared/currency.ts')).toMatchObject({ writable: false });
    expect(snapshot.files.find((file) => file.path === '.js-template/types/sdk.d.ts')).toMatchObject({
      kind: 'virtual',
      writable: false,
    });
    const indexMeta = snapshot.files.find((file) => file.path === entryPath);
    if (!indexMeta || !descriptorMeta) {
      throw new Error('Expected entry source and descriptor metadata');
    }
    const descriptorContent = '{"schemaVersion":1,"key":"sales-kpi","settings":{"refresh":{"type":"boolean"}}}';
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
        {
          type: 'update',
          path: descriptorMeta.path,
          baseHash: descriptorMeta.hash,
          content: descriptorContent,
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
    await expect(surface.read([descriptorMeta.path])).resolves.toEqual([
      expect.objectContaining({ path: descriptorMeta.path, content: descriptorContent, writable: true }),
    ]);
    expect(mocks.api.saveSource).not.toHaveBeenCalled();
    expect(mocks.api.compileWorkspacePreview).not.toHaveBeenCalled();
    await expect(surface.validateDraft()).resolves.toMatchObject({
      stale: false,
      diagnostics: [],
      validationPassed: true,
    });
    expect(mocks.api.compileWorkspacePreview).toHaveBeenCalledWith(
      expect.objectContaining({
        projectId: 'jtp_sales',
        templateId: 'jtt-sales-kpi',
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

  it('registers the whole project and applies multi-template descriptor changes without saving', async () => {
    renderProjectWorkspace();
    await screen.findByTestId('code-tab');
    await waitFor(() => expect(mocks.authoring.register).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId('code-tab')).toHaveAttribute(
      'data-authoring-surface-id',
      'js-template:jtp_sales:project',
    );

    const surface = getRegisteredSurface();
    const snapshot = await surface.getSnapshot();
    const descriptorPaths = [
      'src/client/js-actions/secret/entry.json',
      'src/client/js-blocks/sales-kpi/entry.json',
      'src/client/js-fields/status-tag/entry.json',
      'src/client/js-items/total-preview/entry.json',
    ];

    expect(surface.id).toBe('js-template:jtp_sales:project');
    expect(snapshot.files.map((file) => file.path)).toEqual(
      expect.arrayContaining([
        ...descriptorPaths,
        'README.md',
        'src/shared/currency.ts',
        '.js-template/types/sdk.d.ts',
      ]),
    );
    expect(snapshot.files.find((file) => file.path === 'README.md')).toMatchObject({ writable: true });
    expect(snapshot.files.find((file) => file.path === '.js-template/types/sdk.d.ts')).toMatchObject({
      kind: 'virtual',
      writable: false,
    });

    const descriptorMetas = snapshot.files.filter((file) => descriptorPaths.includes(file.path));
    expect(descriptorMetas).toHaveLength(descriptorPaths.length);
    expect(descriptorMetas).toEqual(
      expect.arrayContaining(descriptorPaths.map((path) => expect.objectContaining({ path, writable: true }))),
    );

    const plan = await surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: descriptorMetas.map((file) => {
        const segments = file.path.split('/');
        const key = segments[segments.length - 2];
        return {
          type: 'update' as const,
          path: file.path,
          baseHash: file.hash,
          content: JSON.stringify({ schemaVersion: 1, key, title: `中文标题-${key}` }),
        };
      }),
    });

    await act(async () => {
      await surface.applyPreparedChanges(plan.planId);
    });

    const updatedFiles = await surface.read(descriptorPaths);
    expect(updatedFiles).toHaveLength(descriptorPaths.length);
    expect(updatedFiles.every((file) => file.content.includes('中文标题-'))).toBe(true);
    expect(mocks.api.saveSource).not.toHaveBeenCalled();

    const nextSnapshot = await surface.getSnapshot();
    const protectedDescriptor = nextSnapshot.files.find((file) => file.path === descriptorPaths[0]);
    if (!protectedDescriptor) {
      throw new Error('Expected a protected project descriptor');
    }
    await expect(
      surface.prepareChanges({
        baseSnapshotId: nextSnapshot.snapshotId,
        changes: [{ type: 'delete', path: protectedDescriptor.path, baseHash: protectedDescriptor.hash }],
      }),
    ).rejects.toMatchObject({ code: 'PATH_ACCESS_DENIED' });

    await expect(surface.validateDraft()).resolves.toMatchObject({
      stale: false,
      diagnostics: [],
      validationPassed: true,
    });
    const previewInput = mocks.api.compileWorkspacePreview.mock.calls.at(-1)?.[0];
    expect(previewInput).toMatchObject({
      projectId: 'jtp_sales',
      files: expect.arrayContaining(
        descriptorPaths.map((path) => expect.objectContaining({ path, content: expect.stringContaining('中文标题-') })),
      ),
    });
    expect(previewInput).not.toHaveProperty('templateId');
    expect(previewInput).not.toHaveProperty('kind');
    expect(previewInput).not.toHaveProperty('entryPath');
    expect(mocks.api.saveSource).not.toHaveBeenCalled();
  });

  it('creates a missing entry descriptor but rejects deleting it', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      project: { id: 'jtp_sales' },
      commit: { id: 'commit-1' },
      files: [
        {
          path: entryPath,
          content: 'export default function SalesKpi() { return null; }\n',
          language: 'typescriptreact',
        },
      ],
    });
    renderTemplateWorkspace();
    await screen.findByTestId('code-tab');
    await waitFor(() => expect(mocks.authoring.register).toHaveBeenCalledTimes(1));
    const surface = getRegisteredSurface();
    const snapshot = await surface.getSnapshot();
    const descriptorPath = 'src/client/js-blocks/sales-kpi/entry.json';
    const descriptorContent = '{"schemaVersion":1,"key":"sales-kpi"}';

    const createPlan = await surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [{ type: 'create', path: descriptorPath, content: descriptorContent, language: 'json' }],
    });
    await act(async () => {
      await surface.applyPreparedChanges(createPlan.planId);
    });

    const nextSnapshot = await surface.getSnapshot();
    const descriptorMeta = nextSnapshot.files.find((file) => file.path === descriptorPath);
    expect(descriptorMeta).toMatchObject({ writable: true });
    await expect(surface.read([descriptorPath])).resolves.toEqual([
      expect.objectContaining({ path: descriptorPath, content: descriptorContent }),
    ]);
    if (!descriptorMeta) {
      throw new Error('Expected created entry descriptor metadata');
    }
    await expect(
      surface.prepareChanges({
        baseSnapshotId: nextSnapshot.snapshotId,
        changes: [{ type: 'delete', path: descriptorPath, baseHash: descriptorMeta.hash }],
      }),
    ).rejects.toMatchObject({ code: 'PATH_ACCESS_DENIED' });
    expect(mocks.api.saveSource).not.toHaveBeenCalled();
  });

  it('keeps source readable but disables editing and AI authoring without save permission', async () => {
    mocks.api.getProject.mockResolvedValue({
      id: 'jtp_sales',
      name: 'sales-widgets',
      title: 'Sales widgets',
      lifecycleStatus: 'enabled',
      permissions: { canWriteSource: false },
    });

    renderProjectWorkspace();

    await screen.findByTestId('code-tab');
    expect(screen.getByLabelText('Edit file content')).toHaveAttribute('readonly');
    expect(screen.getByTestId('code-tab')).not.toHaveAttribute('data-authoring-surface-id');
    expect(mocks.authoring.register).not.toHaveBeenCalled();
    expect(mocks.api.getProject).toHaveBeenCalledWith('jtp_sales');
    expect(mocks.api.pull).toHaveBeenCalledWith({ projectId: 'jtp_sales', includeContent: 'all' });
  });
});
