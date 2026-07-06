/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    push: vi.fn(),
    compilePreview: vi.fn(),
    scanEntries: vi.fn(),
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mocks.t,
  }),
}));

vi.mock('@nocobase/client-v2', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    CodeEditor: ({
      value,
      onChange,
      placeholder,
      readonly,
    }: {
      value?: string;
      onChange?: (value: string) => void;
      placeholder?: string;
      readonly?: boolean;
    }) => (
      <textarea
        aria-label={placeholder}
        onChange={(event) => onChange?.(event.target.value)}
        readOnly={readonly}
        value={value || ''}
      />
    ),
  };
});

vi.mock('../hooks/useLightExtensionRepo', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    useLightExtensionRepo: () => mocks.api as unknown as UseLightExtensionRepoResult,
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
      entries: [],
      capabilities: {},
    });
  });

  it('loads files and saves edited source through the light extension API', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension/source?repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByText('src/client/js-blocks/sales-kpi/index.tsx');
    fireEvent.change(screen.getByLabelText('Edit file content'), {
      target: { value: 'export default function SalesKpi() { return "ok"; }\n' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => expect(mocks.api.push).toHaveBeenCalledTimes(1));
    expect(mocks.api.push).toHaveBeenCalledWith(
      expect.objectContaining({
        repoId: 'ler_sales',
        baseCommitId: 'commit-1',
        files: [
          expect.objectContaining({
            path: 'src/client/js-blocks/sales-kpi/index.tsx',
            content: 'export default function SalesKpi() { return "ok"; }\n',
            operation: 'upsert',
          }),
        ],
      }),
    );
  });

  it('creates a JS Block template and sends the three files as one save batch', async () => {
    mocks.api.pull.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commit: { id: 'commit-1' },
      tree: { hash: 'tree-empty', entryCount: 0, byteSize: 0 },
      unchanged: false,
      files: [],
    });

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension/source?repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByText('Empty repository');
    fireEvent.click(screen.getByRole('button', { name: /Add JS Block template/ }));
    fireEvent.click(screen.getByRole('button', { name: /Save/ }));

    await waitFor(() => expect(mocks.api.push).toHaveBeenCalledTimes(1));
    expect(mocks.api.push.mock.calls[0][0].files.map((file) => file.path)).toEqual([
      'src/client/js-blocks/sales-kpi/index.tsx',
      'src/client/js-blocks/sales-kpi/meta.json',
      'src/client/js-blocks/sales-kpi/settings.json',
    ]);
  });

  it('shows persisted scan diagnostics after validation failure', async () => {
    mocks.api.scanEntries.mockRejectedValueOnce(
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
      <MemoryRouter initialEntries={['/admin/settings/light-extension/source?repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByText('src/client/js-blocks/sales-kpi/index.tsx');
    fireEvent.click(screen.getByRole('button', { name: /Scan/ }));

    await screen.findByText('Import "react" is not allowed');
    expect(screen.getByText('import_not_allowed')).toBeInTheDocument();
  });

  it('runs compile preview and opens diagnostic source locations', async () => {
    mocks.api.compilePreview.mockResolvedValueOnce({
      repo: { id: 'ler_sales' },
      commitId: 'commit-1',
      accepted: false,
      diagnostics: [],
      entries: [
        {
          entryId: 'lee_sales',
          repoId: 'ler_sales',
          target: 'client',
          kind: 'js-block',
          entryName: 'sales-kpi',
          entryPath: 'src/client/js-blocks/sales-kpi/index.tsx',
          activePublicationId: null,
          status: 'failed',
          accepted: false,
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
      ],
    });

    render(
      <MemoryRouter initialEntries={['/admin/settings/light-extension/source?repoId=ler_sales']}>
        <LightExtensionWorkspacePage />
      </MemoryRouter>,
    );

    await screen.findByText('src/client/js-blocks/sales-kpi/index.tsx');
    fireEvent.click(screen.getByRole('button', { name: /Compile preview/ }));

    await waitFor(() => expect(mocks.api.compilePreview).toHaveBeenCalledWith({ repoId: 'ler_sales' }));
    expect(await screen.findByText('Import target was not found')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Line 1/ }));
    expect(await screen.findByText('Opened diagnostic source')).toBeInTheDocument();
  });
});
