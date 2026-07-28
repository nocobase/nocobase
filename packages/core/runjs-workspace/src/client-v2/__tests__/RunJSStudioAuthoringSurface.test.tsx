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
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { runJSStudioProvider } from '../runjs-studio/RunJSStudioProvider';

const mocks = vi.hoisted(() => {
  const authoringSurfaces = new Map<string, CodeAuthoringSurface>();
  return {
    app: {
      aiManager: {
        authoringSurfaces: {
          get: (surfaceId: string) => authoringSurfaces.get(surfaceId),
          register: (surface: CodeAuthoringSurface) => {
            authoringSurfaces.set(surface.id, surface);
            return () => {
              if (authoringSurfaces.get(surface.id) === surface) {
                authoringSurfaces.delete(surface.id);
                surface.dispose?.();
              }
            };
          },
        },
      },
    },
    authoringSurfaces,
    request: vi.fn(),
    t: (key: string) => key,
    unstableTranslation: false,
  };
});

vi.mock('../../shared/path-normalize', () => ({
  normalizePath: (path: string) => String(path || '').replace(/\\/g, '/'),
}));

vi.mock('@nocobase/flow-engine', () => ({
  useFlowContext: () => ({ api: { request: mocks.request }, view: {} }),
}));

vi.mock('@nocobase/client-v2', () => ({
  CodeEditor: ({
    authoringSurfaceId,
    onChange,
    placeholder,
    readonly,
    runButton,
    value,
  }: {
    authoringSurfaceId?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    readonly?: boolean;
    runButton?: React.ReactNode;
    value?: string;
  }) => (
    <div data-authoring-surface-id={authoringSurfaceId} data-testid="mock-code-editor">
      <textarea
        aria-label={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={readonly}
        value={value || ''}
      />
      {runButton}
    </div>
  ),
  useApp: () => mocks.app,
  useFullscreenOverlay: () => {
    const [container, setContainer] = React.useState<HTMLDivElement | null>(null);
    return {
      container,
      enterFullscreen: vi.fn(),
      exitFullscreen: vi.fn(),
      isFullscreen: false,
      placeholderRef: setContainer,
      placeholderStyle: {},
      toggleFullscreen: vi.fn(),
    };
  },
}));

vi.mock('../locale', () => ({
  useT: () => (mocks.unstableTranslation ? (key: string) => key : mocks.t),
}));

const locator = {
  kind: 'flowModel.step',
  modelUid: 'fm_1',
  flowKey: 'settings',
  stepKey: 'runjs',
  paramPath: ['code'],
} as const;

const repository = {
  id: 'repo-1',
  repoId: 'repo-1',
  ownerType: 'runjs-source',
  ownerId: 'owner-1',
  name: 'source',
  status: 'active',
  defaultRef: 'head',
  headCommitId: 'commit-1',
  headSeq: 1,
};

const openResult = {
  locator,
  locatorKind: 'flowModel.step',
  repositoryIdentity: { ownerType: 'runjs-source', ownerId: 'owner-1', name: 'source' },
  legacy: {
    code: 'return 1;',
    version: 'v2',
    label: 'JS block / Write JavaScript',
    surfaceStyle: 'value',
    language: 'typescript',
    entryPath: 'src/client/index.tsx',
    ownerFingerprint: 'owner-fingerprint-1',
  },
  ownerFingerprint: 'owner-fingerprint-1',
  source: {
    label: 'JS block / Write JavaScript',
    kind: 'flowModel.step',
    surfaceStyle: 'value',
    runtimeVersion: 'v2',
    language: 'typescript',
    ownerFingerprint: 'owner-fingerprint-1',
    metadata: {},
  },
  repository,
  files: [{ path: 'src/client/index.tsx', content: 'return 1;', language: 'typescript', mode: '100644' }],
  permissions: { canRead: true, canWrite: true, canSave: true },
  history: { items: [] },
};

function renderEditor() {
  return render(
    <>
      {runJSStudioProvider.renderEditor({
        value: { code: 'return 1;', version: 'v2' },
        onChange: vi.fn(),
        locator,
        scene: 'block',
        workspaceTypeScriptContextResolver: () => ({
          declarationFiles: [
            {
              path: 'types/generated-context.d.ts',
              content: 'declare const generatedContext: string;',
              language: 'typescript',
            },
          ],
        }),
      })}
    </>,
  );
}

async function getSurface() {
  await waitFor(() => expect(mocks.authoringSurfaces.size).toBe(1));
  const surface = Array.from(mocks.authoringSurfaces.values())[0];
  if (!surface) {
    throw new Error('Expected a registered authoring surface');
  }
  return surface;
}

describe('RunJS Studio authoring surface', () => {
  beforeEach(() => {
    mocks.authoringSurfaces.clear();
    mocks.unstableTranslation = false;
    mocks.request.mockImplementation(({ url, data }: { url: string; data?: { entryPath?: string } }) => {
      if (url === 'runJSSources:open') {
        return Promise.resolve({ data: { data: openResult } });
      }
      if (url === 'runJSSources:compilePreview') {
        return Promise.resolve({
          data: {
            data: {
              locator,
              locatorKind: 'flowModel.step',
              artifact: {
                code: 'compiled code',
                version: 'v2',
                sourceMap: null,
                diagnostics: [],
                filesHash: 'files-hash-2',
                entryPath: data?.entryPath || 'src/client/index.tsx',
              },
            },
          },
        });
      }
      return Promise.resolve({ data: { data: {} } });
    });
  });

  it('reads unsaved files, applies CRUD to the draft, and validates without saving', async () => {
    const rendered = renderEditor();
    const surface = await getSurface();
    expect(await screen.findByTestId('mock-code-editor')).toHaveAttribute('data-authoring-surface-id', surface.id);

    const initial = await surface.getSnapshot();
    expect(initial.files).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'src/client/index.tsx', kind: 'source', writable: true }),
        expect.objectContaining({ path: 'types/generated-context.d.ts', kind: 'virtual', writable: false }),
      ]),
    );
    fireEvent.change(screen.getByLabelText('Edit file content'), { target: { value: 'return unsavedValue;' } });
    await expect(surface.read(['src/client/index.tsx'])).resolves.toEqual([
      expect.objectContaining({ content: 'return unsavedValue;' }),
    ]);

    const edited = await surface.getSnapshot();
    const entry = edited.files.find((file) => file.path === 'src/client/index.tsx');
    const createAndUpdate = await surface.prepareChanges({
      baseSnapshotId: edited.snapshotId,
      changes: [
        {
          type: 'update',
          path: 'src/client/index.tsx',
          baseHash: entry?.hash || '',
          content: "import { helper } from './helper';\nreturn helper;",
        },
        { type: 'create', path: 'src/client/helper.ts', content: 'export const helper = 2;', language: 'typescript' },
      ],
    });
    await act(async () => {
      await surface.applyPreparedChanges(createAndUpdate.planId);
    });

    const withHelper = await surface.getSnapshot();
    const helper = withHelper.files.find((file) => file.path === 'src/client/helper.ts');
    const removeHelper = await surface.prepareChanges({
      baseSnapshotId: withHelper.snapshotId,
      changes: [{ type: 'delete', path: 'src/client/helper.ts', baseHash: helper?.hash || '' }],
    });
    await act(async () => {
      await surface.applyPreparedChanges(removeHelper.planId);
    });

    await expect(surface.validateDraft()).resolves.toMatchObject({ stale: false, diagnostics: [] });
    expect(screen.getByLabelText('Edit file content')).toHaveValue(
      "import { helper } from './helper';\nreturn helper;",
    );
    expect(mocks.request.mock.calls.some(([request]) => request.url === 'runJSSources:save')).toBe(false);

    rendered.unmount();
    expect(mocks.authoringSurfaces.size).toBe(0);
  });

  it('keeps the registered surface alive when the studio rerenders after applying a draft', async () => {
    mocks.unstableTranslation = true;
    const rendered = renderEditor();
    const surface = await getSurface();
    const snapshot = await surface.getSnapshot();
    const entry = snapshot.files.find((file) => file.path === 'src/client/index.tsx');
    const plan = await surface.prepareChanges({
      baseSnapshotId: snapshot.snapshotId,
      changes: [
        {
          type: 'update',
          path: 'src/client/index.tsx',
          baseHash: entry?.hash || '',
          content: 'return 2;',
        },
      ],
    });

    await act(async () => {
      await surface.applyPreparedChanges(plan.planId);
    });

    await waitFor(() => expect(mocks.authoringSurfaces.get(surface.id)).toBe(surface));
    await expect(surface.validateDraft()).resolves.toMatchObject({ stale: false, diagnostics: [] });

    rendered.unmount();
  });
});
