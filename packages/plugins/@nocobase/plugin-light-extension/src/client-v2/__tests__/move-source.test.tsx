/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { RunJSStudioToolbarContext } from '../vsc-file/public-api';
import { message } from 'antd';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  createMoveSourceIdempotencyKey,
  createMoveSourceToLightExtensionContribution,
  MoveSourceToLightExtension,
} from '../components/MoveSourceToLightExtension';

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

describe('MoveSourceToLightExtension', () => {
  it.each([
    ['JSBlockModel', 'JS Block name'],
    ['JSPageModel', 'JS page name'],
    ['JSActionModel', 'JS Action name'],
    ['JSRecordActionModel', 'JS Action name'],
    ['JSCollectionActionModel', 'JS Action name'],
    ['JSFormActionModel', 'JS Action name'],
    ['FilterFormJSActionModel', 'JS Action name'],
    ['JSFieldModel', 'JS Field name'],
    ['JSEditableFieldModel', 'JS Field name'],
    ['JSColumnModel', 'JS Field name'],
    ['JSItemModel', 'JS Item name'],
    ['JSItemActionModel', 'JS Item name'],
  ])('uses the surface-specific name label for %s', async (modelUse, expectedLabel) => {
    const context = createContext(vi.fn());
    context.workspace.source.metadata = { modelUse };
    const request = vi.fn(async () => ({ data: { data: [] } }));

    render(<MoveSourceToLightExtension api={{ request }} context={context} />);

    fireEvent.click(screen.getByRole('button', { name: 'Move to light extension' }));
    expect(await screen.findByLabelText(expectedLabel)).toBeTruthy();
  });

  it.each([
    ['js-block', 'JS Block name'],
    ['js-page', 'JS page name'],
    ['js-action', 'JS Action name'],
    ['js-field', 'JS Field name'],
    ['js-item', 'JS Item name'],
  ] as const)('uses generic editor metadata for %s hosts', async (lightExtensionKind, expectedLabel) => {
    const context = createContext(vi.fn());
    context.workspace.source.metadata = undefined;
    context.sourceMetadata = { lightExtensionKind };
    const request = vi.fn(async () => ({ data: { data: [] } }));

    render(<MoveSourceToLightExtension api={{ request }} context={context} />);

    fireEvent.click(screen.getByRole('button', { name: 'Move to light extension' }));
    expect(await screen.findByLabelText(expectedLabel)).toBeTruthy();
  });

  it('does not render Move Source for legacy nested RunJS locators', () => {
    const context = createContext(vi.fn());
    const locator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'fm_1',
      containerFlowKey: 'settings',
      containerStepKey: 'configure',
      valuePath: ['runJs'],
      scene: 'field-linkage',
    } as unknown as RunJSStudioToolbarContext['locator'];
    context.locator = locator;
    context.workspace.locator = locator;
    context.workspace.legacy.surfaceStyle = 'value';
    context.workspace.source.surfaceStyle = 'value';

    render(<MoveSourceToLightExtension api={{ request: vi.fn() }} context={context} />);

    expect(screen.queryByRole('button', { name: 'Move to light extension' })).toBeNull();
  });

  it('does not render Move Source for non-step locators', () => {
    const context = createContext(vi.fn());
    const locator = {
      kind: 'chart.option',
      modelUid: 'chart-1',
    } as const;
    context.locator = locator;
    context.workspace.locator = locator;

    render(<MoveSourceToLightExtension api={{ request: vi.fn() }} context={context} />);

    expect(screen.queryByRole('button', { name: 'Move to light extension' })).toBeNull();
  });

  it('does not render Move Source for generic flow steps', () => {
    const context = createContext(vi.fn());
    context.workspace.source.metadata = { modelUse: 'GenericRunJSModel' };

    render(<MoveSourceToLightExtension api={{ request: vi.fn() }} context={context} />);

    expect(screen.queryByRole('button', { name: 'Move to light extension' })).toBeNull();
  });

  it('only contributes the Move action for writable JS Page sources', () => {
    const contribution = createMoveSourceToLightExtensionContribution({ request: vi.fn() });
    const context = createContext(vi.fn());
    context.workspace.source.metadata = { modelUse: 'JSPageModel' };

    expect(contribution.isVisible?.(context)).toBe(true);
    context.readOnly = true;
    expect(contribution.isVisible?.(context)).toBe(false);
    context.readOnly = false;
    context.workspace.permissions.canWrite = false;
    expect(contribution.isVisible?.(context)).toBe(false);
  });

  it('only offers enabled destination repositories', async () => {
    const request = vi.fn(async () => ({
      data: {
        data: [
          { ...createRepoSummary('enabled'), id: 'ler_enabled', name: 'enabled-repo' },
          { ...createRepoSummary('disabled'), id: 'ler_disabled', name: 'disabled-repo' },
          { ...createRepoSummary('archived'), id: 'ler_archived', name: 'archived-repo' },
        ],
      },
    }));

    render(<MoveSourceToLightExtension api={{ request }} context={createContext(vi.fn())} />);

    fireEvent.click(screen.getByRole('button', { name: 'Move to light extension' }));
    fireEvent.click(await screen.findByRole('radio', { name: 'Existing light extension' }));
    fireEvent.mouseDown(await screen.findByRole('combobox'));
    expect(await screen.findByText('enabled-repo')).toBeTruthy();
    expect(screen.queryByText('disabled-repo')).toBeNull();
    expect(screen.queryByText('archived-repo')).toBeNull();
  });

  it('selects and submits the application default destination with a stable idempotency key', async () => {
    const request = vi.fn(async ({ url }: { url: string }) => {
      if (url === 'lightExtensionRepos:list') {
        return { data: { data: [] } };
      }
      if (url === 'lightExtensions:moveSource') {
        return {
          data: {
            data: {
              binding: {
                type: 'light-extension-entry',
                repoId: 'ler_default',
                entryId: 'lee_default',
                entryName: 'js-block',
                entryPath: 'src/client/js-blocks/js-block/index.tsx',
                kind: 'js-block',
              },
            },
          },
        };
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    render(<MoveSourceToLightExtension api={{ request }} context={createContext(vi.fn())} />);

    fireEvent.click(screen.getByRole('button', { name: 'Move to light extension' }));
    const defaultDestination = await screen.findByRole('radio', { name: 'Application default light extension' });
    expect(defaultDestination).toBeChecked();
    fireEvent.click(screen.getByRole('button', { name: 'Move' }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'lightExtensions:moveSource',
          data: expect.objectContaining({
            destination: { type: 'default' },
            idempotencyKey: expect.stringMatching(/^move-source-[a-z0-9]+-[a-z0-9]+$/),
          }),
        }),
      );
    });
  });

  it('derives the same idempotency key for the same semantic request', () => {
    const first = {
      locator: { kind: 'flowModel.step', modelUid: 'fm_1' },
      destination: { type: 'default' },
      files: [{ path: 'src/main.ts', content: 'return 1;' }],
    };
    const reordered = {
      files: [{ content: 'return 1;', path: 'src/main.ts' }],
      destination: { type: 'default' },
      locator: { modelUid: 'fm_1', kind: 'flowModel.step' },
    };

    expect(createMoveSourceIdempotencyKey(first)).toBe(createMoveSourceIdempotencyKey(reordered));
    expect(createMoveSourceIdempotencyKey(first)).not.toBe(
      createMoveSourceIdempotencyKey({ ...first, files: [{ path: 'src/main.ts', content: 'return 2;' }] }),
    );
    expect(createMoveSourceIdempotencyKey(first)).not.toBe(
      createMoveSourceIdempotencyKey({ ...first, destination: { type: 'existing', repoId: 'ler_other' } }),
    );
  });

  it('submits the current unsaved workspace to an existing light extension', async () => {
    const onExternalBindingPersisted = vi.fn(async () => undefined);
    const request = vi.fn(async ({ url }: { url: string }) => {
      if (url === 'lightExtensionRepos:list') {
        return {
          data: {
            data: [
              {
                id: 'ler_existing',
                name: 'shared-tools',
                normalizedName: 'shared-tools',
                title: 'Shared tools',
                lifecycleStatus: 'enabled',
                healthStatus: 'ready',
                headCommitId: 'commit_1',
              },
            ],
          },
        };
      }
      if (url === 'lightExtensions:moveSource') {
        return {
          data: {
            data: {
              repo: { id: 'ler_existing' },
              entry: { id: 'lee_sales_kpi' },
              binding: {
                type: 'light-extension-entry',
                repoId: 'ler_existing',
                entryId: 'lee_sales_kpi',
                entryName: 'sales-page',
                entryPath: 'src/client/js-pages/sales-page/index.tsx',
                kind: 'js-page',
              },
              ownerFingerprint: 'owner_after',
            },
          },
        };
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    const context = createContext(onExternalBindingPersisted);
    context.workspace.source.metadata = { modelUse: 'JSPageModel' };
    context.workspace.source.label = 'JavaScript page / Write JavaScript';
    context.sourceBinding = {
      type: 'light-extension-entry',
      repoId: 'ler_origin',
      entryId: 'lee_origin',
      kind: 'js-page',
    };

    render(<MoveSourceToLightExtension api={{ request }} context={context} />);

    fireEvent.click(screen.getByRole('button', { name: 'Move to light extension' }));
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: 'lightExtensionRepos:list' })),
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Existing light extension' }));
    fireEvent.change(screen.getByLabelText('JS page name'), { target: { value: 'Sales page' } });
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByText('Shared tools'));
    fireEvent.click(screen.getByRole('button', { name: 'Move' }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'lightExtensions:moveSource',
          data: expect.objectContaining({
            expectedOwnerFingerprint: 'owner_before',
            sourceRepoId: 'runjs_repo',
            sourceHeadCommitId: 'runjs_commit',
            originBinding: {
              type: 'light-extension-entry',
              repoId: 'ler_origin',
              entryId: 'lee_origin',
              kind: 'js-page',
            },
            destination: { type: 'existing', repoId: 'ler_existing' },
            files: [expect.objectContaining({ content: 'return unsaved;' })],
            entryName: 'sales-page',
            entryTitle: 'Sales page',
          }),
        }),
      );
    });
    expect(onExternalBindingPersisted).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'light-extension',
        sourceBinding: expect.objectContaining({
          entryId: 'lee_sales_kpi',
          entryPath: 'src/client/js-pages/sales-page/index.tsx',
          kind: 'js-page',
        }),
      }),
    );
  });

  it('creates a new light extension when no existing repository is selected', async () => {
    const onExternalBindingPersisted = vi.fn(async () => undefined);
    const request = vi.fn(async ({ url }: { url: string }) => {
      if (url === 'lightExtensionRepos:list') {
        return { data: { data: [] } };
      }
      if (url === 'lightExtensions:moveSource') {
        return {
          data: {
            data: {
              binding: {
                type: 'light-extension-entry',
                repoId: 'ler_new',
                entryId: 'lee_new',
                entryName: 'sales-page',
                entryPath: 'src/client/js-pages/sales-page/index.tsx',
                kind: 'js-page',
              },
            },
          },
        };
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    const context = createContext(onExternalBindingPersisted);
    context.workspace.source.metadata = { modelUse: 'JSPageModel' };
    context.workspace.source.label = 'JavaScript page / Write JavaScript';
    render(<MoveSourceToLightExtension api={{ request }} context={context} />);

    fireEvent.click(screen.getByRole('button', { name: 'Move to light extension' }));
    fireEvent.click(await screen.findByRole('radio', { name: 'Create new light extension' }));
    await screen.findByLabelText('Light extension name');
    expect(screen.queryByLabelText('Light extension title')).toBeNull();
    expect(screen.queryByLabelText('Entry name')).toBeNull();
    expect(screen.queryByLabelText('Entry title')).toBeNull();
    fireEvent.change(screen.getByLabelText('Light extension name'), { target: { value: '销售工具' } });
    fireEvent.change(screen.getByLabelText('JS page name'), { target: { value: '销售页面' } });
    fireEvent.click(screen.getByRole('button', { name: 'Move' }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'lightExtensions:moveSource',
          data: expect.objectContaining({
            destination: {
              type: 'new',
              name: expect.stringMatching(/^light-extension-[a-z0-9]+$/),
              title: '销售工具',
            },
            entryName: expect.stringMatching(/^js-page-[a-z0-9]+$/),
            entryTitle: '销售页面',
          }),
        }),
      );
    });
  });

  it('shows the server move error instead of the generic request error', async () => {
    const requestError = Object.assign(new Error('Request failed with status code 409'), {
      response: {
        data: {
          errors: [{ message: 'Light extension entry already exists' }],
        },
      },
    });
    const request = vi.fn(async ({ url }: { url: string }) => {
      if (url === 'lightExtensionRepos:list') {
        return {
          data: {
            data: [
              {
                id: 'ler_existing',
                name: 'shared-tools',
                normalizedName: 'shared-tools',
                lifecycleStatus: 'enabled',
                healthStatus: 'ready',
                headCommitId: 'commit_1',
              },
            ],
          },
        };
      }
      throw requestError;
    });
    const showError = vi.spyOn(message, 'error');

    render(<MoveSourceToLightExtension api={{ request }} context={createContext(vi.fn())} />);

    fireEvent.click(screen.getByRole('button', { name: 'Move to light extension' }));
    fireEvent.click(await screen.findByRole('radio', { name: 'Existing light extension' }));
    fireEvent.mouseDown(await screen.findByRole('combobox'));
    fireEvent.click(await screen.findByText('shared-tools'));
    fireEvent.click(screen.getByRole('button', { name: 'Move' }));

    await waitFor(() => expect(showError).toHaveBeenCalledWith('Light extension entry already exists'));
    showError.mockRestore();
  });
});

function createContext(
  onExternalBindingPersisted: RunJSStudioToolbarContext['onExternalBindingPersisted'],
): RunJSStudioToolbarContext {
  return {
    locator: {
      kind: 'flowModel.step',
      modelUid: 'fm_1',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
    },
    workspace: {
      locator: {
        kind: 'flowModel.step',
        modelUid: 'fm_1',
        flowKey: 'jsSettings',
        stepKey: 'runJs',
        paramPath: ['code'],
      },
      locatorKind: 'flowModel.step',
      repositoryIdentity: { ownerType: 'runjs-source', ownerId: 'fm_1', name: 'source' },
      repository: {
        id: 'runjs_repo',
        repoId: 'runjs_repo',
        ownerType: 'runjs-source',
        ownerId: 'fm_1',
        name: 'source',
        status: 'active',
        defaultRef: 'head',
        headCommitId: 'runjs_commit',
        headSeq: 1,
      },
      legacy: {
        code: 'return saved;',
        version: 'v2',
        label: 'JS block / Write JavaScript',
        surfaceStyle: 'render',
        language: 'typescript',
        ownerFingerprint: 'owner_before',
      },
      ownerFingerprint: 'owner_before',
      source: {
        label: 'JS block / Write JavaScript',
        kind: 'flowModel.step',
        surfaceStyle: 'render',
        runtimeVersion: 'v2',
        language: 'typescript',
        ownerFingerprint: 'owner_before',
        metadata: { modelUse: 'JSBlockModel' },
      },
      files: [],
      permissions: { canRead: true, canWrite: true, canSave: true },
      history: { items: [] },
    },
    files: [{ path: 'src/main.tsx', content: 'return unsaved;' }],
    entryPath: 'src/main.tsx',
    version: 'v2',
    readOnly: false,
    onExternalBindingPersisted,
  };
}

function createRepoSummary(lifecycleStatus: 'enabled' | 'disabled' | 'archived') {
  return {
    id: `ler_${lifecycleStatus}`,
    name: `${lifecycleStatus}-repo`,
    normalizedName: `${lifecycleStatus}-repo`,
    lifecycleStatus,
    healthStatus: 'ready' as const,
    headCommitId: 'commit_1',
  };
}
