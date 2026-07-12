/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { RunJSStudioToolbarContext } from '@nocobase/plugin-vsc-file/client-v2';
import { message } from 'antd';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { MoveSourceToLightExtension } from '../components/MoveSourceToLightExtension';

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

describe('MoveSourceToLightExtension', () => {
  it.each([
    ['JSBlockModel', 'JS Block name'],
    ['JSActionModel', 'JS Action name'],
    ['JSFieldModel', 'JS Field name'],
    ['JSItemModel', 'JS Item name'],
  ])('uses the surface-specific name label for %s', async (modelUse, expectedLabel) => {
    const context = createContext(vi.fn());
    context.workspace.source.metadata = { modelUse };
    const request = vi.fn(async () => ({ data: { data: [] } }));

    render(<MoveSourceToLightExtension api={{ request }} context={context} />);

    fireEvent.click(screen.getByRole('button', { name: 'Move to light extension' }));
    expect(await screen.findByLabelText(expectedLabel)).toBeTruthy();
  });

  it('uses the RunJS name label for nested RunJS sources', async () => {
    const context = createContext(vi.fn());
    const locator = {
      kind: 'flowModel.nestedRunJS',
      modelUid: 'fm_1',
      containerFlowKey: 'settings',
      containerStepKey: 'configure',
      valuePath: ['runJs'],
      scene: 'field-linkage',
    } as const;
    context.locator = locator;
    context.workspace.locator = locator;
    const request = vi.fn(async () => ({ data: { data: [] } }));

    render(<MoveSourceToLightExtension api={{ request }} context={context} />);

    fireEvent.click(screen.getByRole('button', { name: 'Move to light extension' }));
    expect(await screen.findByLabelText('RunJS name')).toBeTruthy();
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
                entryName: 'js-block-write-javascript',
                entryPath: 'src/client/js-blocks/js-block-write-javascript/index.tsx',
                kind: 'js-block',
              },
              ownerFingerprint: 'owner_after',
            },
          },
        };
      }
      throw new Error(`Unexpected request: ${url}`);
    });
    const context = createContext(onExternalBindingPersisted);

    render(<MoveSourceToLightExtension api={{ request }} context={context} />);

    fireEvent.click(screen.getByRole('button', { name: 'Move to light extension' }));
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: 'lightExtensionRepos:list' })),
    );
    fireEvent.change(screen.getByLabelText('JS Block name'), { target: { value: 'Sales KPI' } });
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
            destination: { type: 'existing', repoId: 'ler_existing' },
            files: [expect.objectContaining({ content: 'return unsaved;' })],
            entryName: 'sales-kpi',
            entryTitle: 'Sales KPI',
          }),
        }),
      );
    });
    expect(onExternalBindingPersisted).toHaveBeenCalledWith(
      expect.objectContaining({
        sourceMode: 'light-extension',
        sourceBinding: expect.objectContaining({ entryId: 'lee_sales_kpi' }),
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
                entryName: 'js-block-write-javascript',
                entryPath: 'src/client/js-blocks/js-block-write-javascript/index.tsx',
                kind: 'js-block',
              },
            },
          },
        };
      }
      throw new Error(`Unexpected request: ${url}`);
    });

    render(<MoveSourceToLightExtension api={{ request }} context={createContext(onExternalBindingPersisted)} />);

    fireEvent.click(screen.getByRole('button', { name: 'Move to light extension' }));
    await screen.findByLabelText('Light extension name');
    expect(screen.queryByLabelText('Light extension title')).toBeNull();
    expect(screen.queryByLabelText('Entry name')).toBeNull();
    expect(screen.queryByLabelText('Entry title')).toBeNull();
    fireEvent.change(screen.getByLabelText('Light extension name'), { target: { value: '销售工具' } });
    fireEvent.change(screen.getByLabelText('JS Block name'), { target: { value: '销售看板' } });
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
            entryName: expect.stringMatching(/^js-block-[a-z0-9]+$/),
            entryTitle: '销售看板',
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
