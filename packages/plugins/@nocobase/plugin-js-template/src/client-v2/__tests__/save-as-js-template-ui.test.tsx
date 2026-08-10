/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { RunJSStudioToolbarContext } from '@nocobase/runjs/workspace/client-v2';
import { message } from 'antd';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  createSaveAsJsTemplateIdempotencyKey,
  createSaveAsJsTemplateContribution,
  SaveAsJsTemplate,
} from '../components/SaveAsJsTemplate';
import { JS_TEMPLATE_KIND_BY_MODEL_USE } from '../jsTemplateRunJSIntegrationContract';

const KIND_NAME_LABELS = {
  'js-block': 'JS Block name',
  'js-page': 'JS page name',
  'js-action': 'JS Action name',
  'js-field': 'JS Field name',
  'js-item': 'JS Item name',
} as const;

vi.mock('../locale', () => ({
  useT: () => (key: string) => key,
}));

describe('SaveAsJsTemplate', () => {
  it.each(
    Object.entries(JS_TEMPLATE_KIND_BY_MODEL_USE).map(
      ([modelUse, kind]) => [modelUse, KIND_NAME_LABELS[kind]] as const,
    ),
  )('uses the surface-specific name label for %s', async (modelUse, expectedLabel) => {
    const context = createContext(vi.fn());
    context.workspace.source.metadata = { modelUse };
    const request = vi.fn(async () => ({ data: { data: [] } }));

    render(<SaveAsJsTemplate api={{ request }} context={context} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save as JS Template' }));
    expect(await screen.findByLabelText(expectedLabel)).toBeTruthy();
  });

  it.each([
    ['js-block', 'JS Block name'],
    ['js-page', 'JS page name'],
    ['js-action', 'JS Action name'],
    ['js-field', 'JS Field name'],
    ['js-item', 'JS Item name'],
  ] as const)('uses generic editor metadata for %s hosts', async (jsTemplateKind, expectedLabel) => {
    const context = createContext(vi.fn());
    context.workspace.source.metadata = undefined;
    context.sourceMetadata = { jsTemplateKind };
    const request = vi.fn(async () => ({ data: { data: [] } }));

    render(<SaveAsJsTemplate api={{ request }} context={context} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save as JS Template' }));
    expect(await screen.findByLabelText(expectedLabel)).toBeTruthy();
  });

  it('does not render Save as JS Template for legacy nested RunJS locators', () => {
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

    render(<SaveAsJsTemplate api={{ request: vi.fn() }} context={context} />);

    expect(screen.queryByRole('button', { name: 'Save as JS Template' })).toBeNull();
  });

  it('does not render Save as JS Template for non-step locators', () => {
    const context = createContext(vi.fn());
    const locator = {
      kind: 'chart.option',
      modelUid: 'chart-1',
    } as const;
    context.locator = locator;
    context.workspace.locator = locator;

    render(<SaveAsJsTemplate api={{ request: vi.fn() }} context={context} />);

    expect(screen.queryByRole('button', { name: 'Save as JS Template' })).toBeNull();
  });

  it('does not render Save as JS Template for generic flow steps', () => {
    const context = createContext(vi.fn());
    context.workspace.source.metadata = { modelUse: 'GenericRunJSModel' };

    render(<SaveAsJsTemplate api={{ request: vi.fn() }} context={context} />);

    expect(screen.queryByRole('button', { name: 'Save as JS Template' })).toBeNull();
  });

  it('only contributes Save as JS Template for writable JS Page sources', () => {
    const contribution = createSaveAsJsTemplateContribution({ request: vi.fn() });
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
          { ...createProjectSummary('enabled'), id: 'jtp_enabled', name: 'enabled-project' },
          { ...createProjectSummary('disabled'), id: 'jtp_disabled', name: 'disabled-project' },
        ],
      },
    }));

    render(<SaveAsJsTemplate api={{ request }} context={createContext(vi.fn())} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save as JS Template' }));
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual(['existing', 'new']);
    fireEvent.click(await screen.findByRole('radio', { name: 'Existing Source Project' }));
    fireEvent.mouseDown(await screen.findByRole('combobox'));
    expect(await screen.findByText('enabled-project')).toBeTruthy();
    expect(screen.queryByText('disabled-project')).toBeNull();
  });

  it('cancels without submitting a Save as JS Template request', async () => {
    const request = vi.fn(async () => ({ data: { data: [] } }));

    render(<SaveAsJsTemplate api={{ request }} context={createContext(vi.fn())} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save as JS Template' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(screen.queryByLabelText('JS Block name')).toBeNull());
    expect(request).not.toHaveBeenCalledWith(expect.objectContaining({ url: 'jsTemplates:saveAsJsTemplate' }));
  });

  it('derives the same idempotency key for the same semantic request', () => {
    const first = {
      locator: { kind: 'flowModel.step', modelUid: 'fm_1' },
      destination: { type: 'existing', projectId: 'jtp_1' },
      files: [{ path: 'src/main.ts', content: 'return 1;' }],
    };
    const reordered = {
      files: [{ content: 'return 1;', path: 'src/main.ts' }],
      destination: { type: 'existing', projectId: 'jtp_1' },
      locator: { modelUid: 'fm_1', kind: 'flowModel.step' },
    };

    expect(createSaveAsJsTemplateIdempotencyKey(first)).toBe(createSaveAsJsTemplateIdempotencyKey(reordered));
    expect(createSaveAsJsTemplateIdempotencyKey(first)).not.toBe(
      createSaveAsJsTemplateIdempotencyKey({ ...first, files: [{ path: 'src/main.ts', content: 'return 2;' }] }),
    );
    expect(createSaveAsJsTemplateIdempotencyKey(first)).not.toBe(
      createSaveAsJsTemplateIdempotencyKey({ ...first, destination: { type: 'existing', projectId: 'jtp_other' } }),
    );
  });

  it('saves the current unsaved workspace in an existing Source Project', async () => {
    const onExternalBindingPersisted = vi.fn(async () => undefined);
    const request = vi.fn(async ({ url }: { url: string }) => {
      if (url === 'jsTemplateProjects:list') {
        return {
          data: {
            data: [
              {
                id: 'jtp_existing',
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
      if (url === 'jsTemplates:saveAsJsTemplate') {
        return {
          data: {
            data: {
              project: { id: 'jtp_existing' },
              template: { id: 'jtt_sales_kpi' },
              binding: {
                type: 'js-template-entry',
                projectId: 'jtp_existing',
                templateId: 'jtt_sales_kpi',
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
      type: 'js-template-entry',
      projectId: 'jtp_origin',
      templateId: 'jtt_origin',
      kind: 'js-page',
    };

    render(<SaveAsJsTemplate api={{ request }} context={context} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save as JS Template' }));
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith(expect.objectContaining({ url: 'jsTemplateProjects:list' })),
    );
    fireEvent.click(screen.getByRole('radio', { name: 'Existing Source Project' }));
    fireEvent.change(screen.getByLabelText('JS page name'), { target: { value: 'Sales page' } });
    fireEvent.mouseDown(screen.getByRole('combobox'));
    fireEvent.click(await screen.findByText('Shared tools'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'jsTemplates:saveAsJsTemplate',
          data: expect.objectContaining({
            idempotencyKey: expect.stringMatching(/^save-as-js-template-/),
            expectedOwnerFingerprint: 'owner_before',
            sourceRepoId: 'runjs_repo',
            sourceHeadCommitId: 'runjs_commit',
            originBinding: {
              type: 'js-template-entry',
              projectId: 'jtp_origin',
              templateId: 'jtt_origin',
              kind: 'js-page',
            },
            destination: { type: 'existing', projectId: 'jtp_existing' },
            files: [expect.objectContaining({ content: 'return unsaved;' })],
            templateName: 'sales-page',
            templateTitle: 'Sales page',
          }),
        }),
      );
    });
    expect(onExternalBindingPersisted).toHaveBeenCalledWith({
      sourceMode: 'js-template',
      sourceBinding: {
        type: 'js-template-entry',
        projectId: 'jtp_existing',
        templateId: 'jtt_sales_kpi',
        kind: 'js-page',
      },
    });
  });

  it('creates a new JS Template when no existing project is selected', async () => {
    const onExternalBindingPersisted = vi.fn(async () => undefined);
    const request = vi.fn(async ({ url }: { url: string }) => {
      if (url === 'jsTemplateProjects:list') {
        return { data: { data: [] } };
      }
      if (url === 'jsTemplates:saveAsJsTemplate') {
        return {
          data: {
            data: {
              project: { id: 'jtp_new' },
              template: { id: 'jtt_new' },
              binding: {
                type: 'js-template-entry',
                projectId: 'jtp_new',
                templateId: 'jtt_new',
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
    render(<SaveAsJsTemplate api={{ request }} context={context} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save as JS Template' }));
    fireEvent.click(await screen.findByRole('radio', { name: 'Create new Source Project' }));
    await screen.findByLabelText('Source Project name');
    expect(screen.queryByLabelText('JS Template title')).toBeNull();
    fireEvent.change(screen.getByLabelText('Source Project name'), { target: { value: '销售工具' } });
    fireEvent.change(screen.getByLabelText('JS page name'), { target: { value: '销售页面' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'jsTemplates:saveAsJsTemplate',
          data: expect.objectContaining({
            idempotencyKey: expect.stringMatching(/^save-as-js-template-/),
            destination: {
              type: 'new',
              name: expect.stringMatching(/^js-template-[a-z0-9]+$/),
              title: '销售工具',
            },
            templateName: expect.stringMatching(/^js-page-[a-z0-9]+$/),
            templateTitle: '销售页面',
          }),
        }),
      );
    });
  });

  it('shows the server Save as JS Template error instead of the generic request error', async () => {
    const requestError = Object.assign(new Error('Request failed with status code 409'), {
      response: {
        data: {
          errors: [{ message: 'JS Template entry already exists' }],
        },
      },
    });
    const request = vi.fn(async ({ url }: { url: string }) => {
      if (url === 'jsTemplateProjects:list') {
        return {
          data: {
            data: [
              {
                id: 'jtp_existing',
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

    render(<SaveAsJsTemplate api={{ request }} context={createContext(vi.fn())} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save as JS Template' }));
    fireEvent.click(await screen.findByRole('radio', { name: 'Existing Source Project' }));
    fireEvent.mouseDown(await screen.findByRole('combobox'));
    fireEvent.click(await screen.findByText('shared-tools'));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(showError).toHaveBeenCalledWith('JS Template entry already exists'));
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

function createProjectSummary(lifecycleStatus: 'enabled' | 'disabled') {
  return {
    id: `jtp_${lifecycleStatus}`,
    name: `${lifecycleStatus}-project`,
    normalizedName: `${lifecycleStatus}-project`,
    lifecycleStatus,
    healthStatus: 'ready' as const,
    headCommitId: 'commit_1',
  };
}
