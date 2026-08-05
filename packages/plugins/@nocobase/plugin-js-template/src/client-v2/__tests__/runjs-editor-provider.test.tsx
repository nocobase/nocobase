/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  ApplicationContext,
  RunJSSourceResolverRegistry,
  type RunJSEditorProviderRenderProps,
} from '@nocobase/client-v2';
import { FlowContext, FlowContextProvider, FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';

import {
  createDetachJsTemplateToInlineIdempotencyKey,
  createJsTemplateRunJSEditorProvider,
} from '../components/RunJSJsTemplateEditorProvider';
import type { ApiClientLike } from '../api/jsTemplatesRequests';
import { createJsTemplateRunJSResolver } from '../resolvers/JsTemplateRunJSResolver';
import { getOrCreateJsTemplateRuntimeCache } from '../resolvers/JsTemplateRuntimeCacheRegistry';
import { getJsTemplateSettingsDescriptorCache } from '../resolvers/JsTemplateSettingsDescriptorCache';
import { resolveInlineJsTemplateWorkspaceJsonSchema } from '../workspace/jsTemplateWorkspaceJsonSchema';

const workspacePageMockState = vi.hoisted(() => ({
  detachToInlineCompleted: false,
  detachToInlineCode: 'ctx.render(<div>working copy</div>);',
}));

vi.mock('../pages/JsTemplateWorkspacePage', () => {
  const MockJsTemplateWorkspacePage = ({
    projectId,
    initialPath,
    workspaceScope,
    templateId,
    onDetachJsTemplateToInline,
    onPreview,
    onRequestClose,
    onSaved,
  }: {
    projectId?: string;
    initialPath?: string;
    workspaceScope?: { kind?: string };
    templateId?: string | null;
    onDetachJsTemplateToInline?: (input: {
      expectedProjectHeadCommitId: string;
      entryPath: string;
      files: Array<{ path: string; content: string }>;
      version: string;
    }) => void | Promise<void>;
    onPreview?: (artifact: { code: string; version: string; entryPath: string }) => void | Promise<void>;
    onRequestClose?: () => void | Promise<void>;
    onSaved?: () => void | Promise<void>;
  }) => {
    const saveAndClose = async () => {
      await onSaved?.();
      await onRequestClose?.();
    };
    const detachWorkspaceToInline = async () => {
      try {
        await onDetachJsTemplateToInline?.({
          expectedProjectHeadCommitId: 'project_head_1',
          entryPath: initialPath || '',
          files: [
            { path: initialPath || '', content: workspacePageMockState.detachToInlineCode },
            { path: 'src/shared/format.ts', content: 'export const format = () => "ok";' },
          ],
          version: 'v2',
        });
        workspacePageMockState.detachToInlineCompleted = true;
      } catch {
        // The real workspace reports copyback failures without closing the editor.
      }
    };

    return (
      <div>
        workspace:{projectId}:{templateId}:{initialPath}:{workspaceScope?.kind}
        {onDetachJsTemplateToInline ? (
          <button type="button" onClick={detachWorkspaceToInline}>
            detach workspace to Inline
          </button>
        ) : null}
        {onPreview ? (
          <button
            type="button"
            onClick={() =>
              onPreview({
                code: 'ctx.render(<div>preview</div>);',
                version: 'v2',
                entryPath: initialPath || '',
              })
            }
          >
            preview workspace
          </button>
        ) : null}
        <button type="button" onClick={onSaved}>
          save workspace
        </button>
        <button type="button" onClick={saveAndClose}>
          save workspace and close
        </button>
        <button type="button" onClick={onRequestClose}>
          close workspace
        </button>
      </div>
    );
  };

  return {
    default: MockJsTemplateWorkspacePage,
  };
});

function EditorViewHarness(props: {
  api?: ApiClientLike;
  appApi?: ApiClientLike;
  children: React.ReactNode;
  model?: FlowModel;
  onClose: () => void;
}) {
  const { api, appApi, children, model, onClose } = props;
  const context = React.useMemo(() => {
    const nextContext = new FlowContext();
    nextContext.defineProperty('view', {
      value: {
        close: onClose,
      },
    });
    if (api) {
      nextContext.defineProperty('api', { value: api });
    }
    if (model) {
      nextContext.defineProperty('model', { value: model });
    }
    return nextContext;
  }, [api, model, onClose]);

  const content = <FlowContextProvider context={context}>{children}</FlowContextProvider>;

  if (!appApi) {
    return content;
  }

  return (
    <ApplicationContext.Provider
      value={{ apiClient: appApi } as unknown as React.ContextType<typeof ApplicationContext>}
    >
      {content}
    </ApplicationContext.Provider>
  );
}

describe('RunJSJsTemplateEditorProvider', () => {
  const stepLocator = {
    kind: 'flowModel.step' as const,
    modelUid: 'model_1',
    flowKey: 'jsSettings',
    stepKey: 'runJs',
    paramPath: ['code'],
  };
  const externalValue = {
    code: '',
    version: 'v2',
    sourceMode: 'js-template',
    sourceBinding: {
      type: 'js-template-entry' as const,
      projectId: 'jtp_1',
      templateId: 'jtt_1',
      kind: 'js-block' as const,
    },
  };

  it('creates detach-to-inline keys with secure-context randomUUID', () => {
    const originalCrypto = globalThis.crypto;
    const randomUUID = vi.fn(() => '123e4567-e89b-42d3-a456-426614174000');
    vi.stubGlobal('crypto', { randomUUID });
    try {
      expect(createDetachJsTemplateToInlineIdempotencyKey()).toBe(
        'detach-to-inline-123e4567-e89b-42d3-a456-426614174000',
      );
      expect(randomUUID).toHaveBeenCalledTimes(1);
    } finally {
      vi.stubGlobal('crypto', originalCrypto);
    }
  });

  it('creates UUID v4 detach-to-inline keys without secure-context randomUUID', () => {
    const originalCrypto = globalThis.crypto;
    vi.stubGlobal('crypto', {});
    try {
      expect(createDetachJsTemplateToInlineIdempotencyKey()).toMatch(
        /^detach-to-inline-[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u,
      );
    } finally {
      vi.stubGlobal('crypto', originalCrypto);
    }
  });

  it.each([
    [
      'supported step metadata',
      { value: { code: '', version: 'v2' }, locator: stepLocator, sourceMetadata: { jsTemplateKind: 'js-block' } },
      true,
    ],
    ['inline without metadata', { value: { code: '', version: 'v2' }, locator: stepLocator }, false],
    ['external binding', { value: externalValue, locator: stepLocator }, true],
    [
      'unsupported locator',
      { value: externalValue, locator: { kind: 'chart.option' as const, modelUid: 'chart-1' } },
      false,
    ],
    [
      'unsupported source locator',
      {
        value: externalValue,
        locator: stepLocator,
        sourceLocator: { kind: 'chart.option' as const, modelUid: 'chart-1' },
        sourceMetadata: { jsTemplateKind: 'js-block' },
      },
      false,
    ],
    [
      'supported source locator',
      {
        value: { code: '', version: 'v2' },
        locator: { kind: 'chart.option' as const, modelUid: 'chart-1' },
        sourceLocator: stepLocator,
        sourceMetadata: { jsTemplateKind: 'js-block' },
      },
      true,
    ],
  ])('routes %s', (_name, props, expected) => {
    const provider = createJsTemplateRunJSEditorProvider();
    expect(provider.canHandle?.(props)).toBe(expected);
  });

  it('delegates non-step locators to the next editor provider', () => {
    const provider = createJsTemplateRunJSEditorProvider();
    const renderNext = vi.fn(() => <div>inline fallback</div>);

    render(
      <>
        {provider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator: { kind: 'chart.option', modelUid: 'chart-1' },
          renderNext,
        })}
      </>,
    );

    expect(screen.getByText('inline fallback')).toBeInTheDocument();
    expect(renderNext).toHaveBeenCalledWith();
  });

  it('keeps the saved value after saving and closing a JS block workspace', async () => {
    const provider = createJsTemplateRunJSEditorProvider();
    const onChange = vi.fn();
    const onPersistedChange = vi.fn();
    const api: ApiClientLike = {
      request: vi.fn(async (options) => {
        if (options.url !== 'jsTemplates:get') {
          throw new Error(`Unexpected request: ${options.url}`);
        }
        return {
          data: {
            data: {
              id: 'jtt_example',
              projectId: 'jtp_example',
              templateName: 'example',
              entryPath: 'src/client/js-blocks/example/index.tsx',
              kind: 'js-block',
            },
          },
        };
      }),
    };
    const props = {
      value: {
        code: 'ctx.render(<div />);',
        version: 'v2',
        sourceMode: 'js-template',
        sourceBinding: {
          type: 'js-template-entry',
          projectId: 'jtp_example',
          templateId: 'jtt_example',
          kind: 'js-block',
        },
      },
      locator: {
        kind: 'flowModel.step' as const,
        modelUid: 'model_1',
        flowKey: 'jsSettings',
        stepKey: 'runJs',
        paramPath: ['code'],
      },
      surfaceStyle: 'render' as const,
      height: '100%',
      minHeight: '320px',
      onChange,
      onPersistedChange,
    };

    expect(provider.canHandle?.(props)).toBe(true);
    render(
      <EditorViewHarness api={api} onClose={vi.fn()}>
        {provider.renderEditor(props)}
      </EditorViewHarness>,
    );

    expect(
      await screen.findByText('workspace:jtp_example:jtt_example:src/client/js-blocks/example/index.tsx:js-block'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'preview workspace' })).not.toBeInTheDocument();
    fireEvent.click(await screen.findByRole('button', { name: 'save workspace and close' }));
    await waitFor(() => expect(onPersistedChange).toHaveBeenCalledWith(props.value));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('previews a JS Template JS block through its rendered FlowModel surface and restores it on close', async () => {
    const provider = createJsTemplateRunJSEditorProvider();
    const onClose = vi.fn();
    const api: ApiClientLike = {
      request: vi.fn(async (options) => {
        if (options.url !== 'jsTemplates:get') {
          throw new Error(`Unexpected request: ${options.url}`);
        }
        return {
          data: {
            data: {
              id: 'jtt_example',
              projectId: 'jtp_example',
              templateName: 'example',
              entryPath: 'src/client/js-blocks/example/index.tsx',
              kind: 'js-block',
            },
          },
        };
      }),
    };
    const value = {
      code: 'ctx.render(<div>persisted</div>);',
      version: 'v2',
      sourceMode: 'js-template',
      sourceBinding: {
        type: 'js-template-entry' as const,
        projectId: 'jtp_example',
        templateId: 'jtt_example',
        kind: 'js-block' as const,
      },
    };
    const model = new FlowModel({
      uid: 'model_js_block_external',
      flowEngine: new FlowEngine(),
      stepParams: { jsSettings: { runJs: value } },
    });
    render(
      <EditorViewHarness api={api} model={model} onClose={onClose}>
        {provider.renderEditor({
          value,
          locator: {
            kind: 'flowModel.step',
            modelUid: model.uid,
            flowKey: 'jsSettings',
            stepKey: 'runJs',
            paramPath: ['code'],
            versionPath: ['version'],
          },
          surfaceStyle: 'render',
        })}
      </EditorViewHarness>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'preview workspace' }));
    await waitFor(() =>
      expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
        code: 'ctx.render(<div>preview</div>);',
        version: 'v2',
        sourceMode: 'inline',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'close workspace' }));
    await waitFor(() => expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject(value));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('waits for Host persistence when detaching a JS Page workspace to Inline', async () => {
    const provider = createJsTemplateRunJSEditorProvider();
    let resolveHostRefresh: (() => void) | undefined;
    const onPersistedChange = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveHostRefresh = resolve;
        }),
    );
    const onClose = vi.fn();
    const sourceRef = {
      type: 'vsc-file' as const,
      repoId: 'runjs_repo_1',
      commitId: 'runjs_commit_2',
      entry: 'src/client/index.tsx',
    };
    const api: ApiClientLike = {
      request: vi.fn(async (options) => {
        if (options.url === 'jsTemplates:get') {
          return {
            data: {
              data: {
                id: 'jtt_example',
                projectId: 'jtp_example',
                templateName: 'example',
                entryPath: 'src/client/js-pages/example/index.tsx',
                kind: 'js-page',
                title: 'Example',
              },
            },
          };
        }
        if (options.url === 'jsTemplates:detachToInline') {
          return {
            data: {
              data: {
                runJSRepoId: sourceRef.repoId,
                commitId: sourceRef.commitId,
                ownerFingerprint: 'owner_after',
                code: 'ctx.render(<div>inline workspace</div>);',
                version: 'v2',
                entryPath: sourceRef.entry,
                filesHash: 'files_hash',
                sourceRef,
              },
            },
          };
        }
        throw new Error(`Unexpected request: ${options.url}`);
      }),
    };
    const runtimeInvalidator = getOrCreateJsTemplateRuntimeCache(api, () => ({
      invalidateProject: vi.fn(),
      clear: vi.fn(),
    }));
    const value = {
      code: 'ctx.render(<div>persisted JS Template</div>);',
      version: 'v2',
      sourceMode: 'js-template',
      sourceBinding: {
        type: 'js-template-entry' as const,
        projectId: 'jtp_example',
        templateId: 'jtt_example',
        kind: 'js-page' as const,
      },
      settings: { title: 'Revenue' },
      sourceRef: {
        type: 'vsc-file' as const,
        repoId: 'old_inline_repo',
        commitId: 'old_inline_commit',
        entry: 'src/client/index.tsx',
      },
    };

    workspacePageMockState.detachToInlineCompleted = false;
    workspacePageMockState.detachToInlineCode = 'ctx.render(<div>working copy</div>);';
    render(
      <EditorViewHarness api={api} onClose={onClose}>
        {provider.renderEditor({
          value,
          locator: {
            kind: 'flowModel.step',
            modelUid: 'page_1',
            flowKey: 'jsSettings',
            stepKey: 'runJs',
            paramPath: ['code'],
          },
          sourceMetadata: { jsTemplateKind: 'js-page', modelUse: 'JSPageModel' },
          surfaceStyle: 'render',
          onPersistedChange,
          renderNext: () => <div>inline workspace editor</div>,
        })}
      </EditorViewHarness>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'detach workspace to Inline' }));

    await waitFor(() => {
      expect(api.request).toHaveBeenCalledWith({
        url: 'jsTemplates:detachToInline',
        method: 'post',
        data: {
          idempotencyKey: expect.stringMatching(/^detach-to-inline-/),
          locator: {
            kind: 'flowModel.step',
            modelUid: 'page_1',
            flowKey: 'jsSettings',
            stepKey: 'runJs',
            paramPath: ['code'],
          },
          projectId: 'jtp_example',
          templateId: 'jtt_example',
          expectedProjectHeadCommitId: 'project_head_1',
          entryPath: 'src/client/js-pages/example/index.tsx',
          kind: 'js-page',
          version: 'v2',
          files: [
            {
              path: 'src/client/js-pages/example/index.tsx',
              content: 'ctx.render(<div>working copy</div>);',
            },
            { path: 'src/shared/format.ts', content: 'export const format = () => "ok";' },
          ],
        },
      });
    });
    expect(onPersistedChange).toHaveBeenCalledWith({
      ...value,
      code: 'ctx.render(<div>inline workspace</div>);',
      version: 'v2',
      sourceMode: 'inline',
      sourceBinding: undefined,
      sourceRef,
    });
    expect(onPersistedChange).toHaveBeenCalledTimes(1);
    expect(workspacePageMockState.detachToInlineCompleted).toBe(false);
    await act(async () => {
      resolveHostRefresh?.();
    });
    await waitFor(() => expect(workspacePageMockState.detachToInlineCompleted).toBe(true));
    expect(screen.queryByRole('button', { name: 'detach workspace to Inline' })).not.toBeInTheDocument();
    expect(screen.getByText('inline workspace editor')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(runtimeInvalidator.invalidateProject).toHaveBeenCalledWith('jtp_example');
  });

  it('reuses the detach-to-inline key for an exact retry and rotates it after the request changes', async () => {
    const provider = createJsTemplateRunJSEditorProvider();
    const onPersistedChange = vi.fn();
    const onClose = vi.fn();
    const api: ApiClientLike = {
      request: vi.fn(async (options) => {
        if (options.url === 'jsTemplates:get') {
          return {
            data: {
              data: {
                id: 'jtt_page',
                projectId: 'jtp_pages',
                templateName: 'page',
                entryPath: 'src/client/js-pages/page/index.tsx',
                kind: 'js-page',
              },
            },
          };
        }
        if (options.url === 'jsTemplates:detachToInline') {
          throw new Error('copyback failed');
        }
        throw new Error(`Unexpected request: ${options.url}`);
      }),
    };
    const value = {
      code: 'ctx.render(ctx.page.uid);',
      version: 'v2',
      sourceMode: 'js-template',
      sourceBinding: {
        type: 'js-template-entry' as const,
        projectId: 'jtp_pages',
        templateId: 'jtt_page',
        kind: 'js-page' as const,
      },
      settings: { title: 'Page' },
    };

    workspacePageMockState.detachToInlineCompleted = false;
    workspacePageMockState.detachToInlineCode = 'ctx.render(<div>working copy</div>);';
    render(
      <EditorViewHarness api={api} onClose={onClose}>
        {provider.renderEditor({
          value,
          locator: {
            kind: 'flowModel.step',
            modelUid: 'page_failed',
            flowKey: 'jsSettings',
            stepKey: 'runJs',
            paramPath: ['code'],
          },
          sourceMetadata: { jsTemplateKind: 'js-page', modelUse: 'JSPageModel' },
          surfaceStyle: 'render',
          onPersistedChange,
        })}
      </EditorViewHarness>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'detach workspace to Inline' }));

    await waitFor(() => {
      expect(api.request).toHaveBeenCalledWith(expect.objectContaining({ url: 'jsTemplates:detachToInline' }));
    });
    fireEvent.click(screen.getByRole('button', { name: 'detach workspace to Inline' }));
    await waitFor(() => {
      expect(
        vi.mocked(api.request).mock.calls.filter(([options]) => options.url === 'jsTemplates:detachToInline'),
      ).toHaveLength(2);
    });
    workspacePageMockState.detachToInlineCode = 'ctx.render(<div>changed working copy</div>);';
    fireEvent.click(screen.getByRole('button', { name: 'detach workspace to Inline' }));
    await waitFor(() => {
      expect(
        vi.mocked(api.request).mock.calls.filter(([options]) => options.url === 'jsTemplates:detachToInline'),
      ).toHaveLength(3);
    });
    const detachRequests = vi
      .mocked(api.request)
      .mock.calls.filter(([options]) => options.url === 'jsTemplates:detachToInline')
      .map(([options]) => options.data as { idempotencyKey: string });
    expect(detachRequests[0].idempotencyKey).toMatch(/^detach-to-inline-/);
    expect(detachRequests[1].idempotencyKey).toBe(detachRequests[0].idempotencyKey);
    expect(detachRequests[2].idempotencyKey).not.toBe(detachRequests[0].idempotencyKey);
    expect(onPersistedChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(
      screen.getByText('workspace:jtp_pages:jtt_page:src/client/js-pages/page/index.tsx:js-page'),
    ).toBeInTheDocument();
  });

  it('wraps inline js-template-capable flow steps with entry.json schema and settings type resolvers', () => {
    const provider = createJsTemplateRunJSEditorProvider();
    const renderNext = vi.fn(() => <div>inline studio</div>);
    const props = {
      value: {
        code: 'ctx.render(<div />);',
        version: 'v2',
        sourceMode: 'inline',
        settings: { title: 'Revenue' },
      },
      locator: {
        kind: 'flowModel.step' as const,
        modelUid: 'model_1',
        flowKey: 'jsSettings',
        stepKey: 'runJs',
        paramPath: ['code'],
      },
      sourceMetadata: { jsTemplateKind: 'js-block' },
      renderNext,
    };

    expect(provider.canHandle?.(props)).toBe(true);
    render(<>{provider.renderEditor(props)}</>);

    expect(screen.getByText('inline studio')).toBeInTheDocument();
    const overrides = renderNext.mock.calls[0]?.[0] as Partial<RunJSEditorProviderRenderProps>;
    expect(overrides.workspaceJsonSchemaResolver).toBe(resolveInlineJsTemplateWorkspaceJsonSchema);
    expect(overrides.workspaceTypeScriptContextResolver).toEqual(expect.any(Function));
    expect(resolveInlineJsTemplateWorkspaceJsonSchema('src/client/entry.json')).toBeTruthy();
    const typeScriptContext = overrides.workspaceTypeScriptContextResolver?.('src/client/index.tsx', [
      { path: 'src/client/index.tsx', content: 'ctx.settings.columns;' },
      {
        path: 'src/client/entry.json',
        content: JSON.stringify({
          schemaVersion: 1,
          key: 'collection-table',
          settings: {
            columns: { type: 'array', items: { type: 'object' } },
            pageSize: { type: 'integer' },
          },
        }),
      },
    ]);
    expect(typeScriptContext?.globalContextType).toBe('JsTemplateActiveTemplateContext');
    expect(
      typeScriptContext?.declarationFiles?.find((file) => file.path.endsWith('/collection-table.d.ts'))?.content,
    ).toContain('columns?: Array<{}>;');
  });

  it('previews inline JS block code through its rendered FlowModel surface and restores it on close', async () => {
    const provider = createJsTemplateRunJSEditorProvider();
    const value = {
      code: 'ctx.render(<div>persisted</div>);',
      version: 'v2',
      sourceMode: 'inline',
    };
    const engine = new FlowEngine();
    const model = new FlowModel({
      uid: 'model_js_block',
      flowEngine: engine,
      stepParams: {
        jsSettings: {
          runJs: value,
        },
      },
    });
    const renderNext = vi.fn(() => <div>inline studio</div>);
    const rendered = render(
      <EditorViewHarness model={model} onClose={vi.fn()}>
        {provider.renderEditor({
          value,
          locator: {
            kind: 'flowModel.step',
            modelUid: model.uid,
            flowKey: 'jsSettings',
            stepKey: 'runJs',
            paramPath: ['code'],
            versionPath: ['version'],
          },
          sourceMetadata: { jsTemplateKind: 'js-block' },
          surfaceStyle: 'render',
          renderNext,
        })}
      </EditorViewHarness>,
    );
    const overrides = renderNext.mock.calls[0]?.[0] as Partial<RunJSEditorProviderRenderProps>;

    await act(async () => {
      await overrides.onPreview?.({
        ...value,
        code: 'ctx.render(<div>preview</div>);',
      });
    });

    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      code: 'ctx.render(<div>preview</div>);',
      version: 'v2',
      sourceMode: 'inline',
    });

    rendered.unmount();
    await waitFor(() => expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject(value));
  });

  it.each([
    ['js-block', 'blocks', 'JSBlockModel'],
    ['js-page', 'pages', 'JSPageModel'],
    ['js-field', 'fields', 'JSColumnModel'],
    ['js-action', 'actions', 'JSActionModel'],
    ['js-item', 'items', 'JSItemModel'],
  ] as const)('opens the scoped %s workspace', async (kind, directory, modelUse) => {
    const provider = createJsTemplateRunJSEditorProvider();
    const entryPath = `src/client/js-${directory}/example/index.tsx`;
    const api: ApiClientLike = {
      request: vi.fn(async (options) => {
        if (options.url !== 'jsTemplates:get') {
          throw new Error(`Unexpected request: ${options.url}`);
        }
        return {
          data: {
            data: {
              id: `jtt_${kind}`,
              projectId: 'jtp_example',
              templateName: 'example',
              entryPath,
              kind,
            },
          },
        };
      }),
    };

    render(
      <EditorViewHarness appApi={api} onClose={vi.fn()}>
        {provider.renderEditor({
          value: {
            code: 'ctx.render(null);',
            version: 'v2',
            sourceMode: 'js-template',
            sourceBinding: {
              type: 'js-template-entry',
              projectId: 'jtp_example',
              templateId: `jtt_${kind}`,
              kind,
            },
          },
          locator: { ...stepLocator, modelUid: `model_${kind}` },
          sourceMetadata: { jsTemplateKind: kind, modelUse },
          surfaceStyle: kind === 'js-action' ? 'action' : 'render',
        })}
      </EditorViewHarness>,
    );

    expect(await screen.findByText(`workspace:jtp_example:jtt_${kind}:${entryPath}:${kind}`)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'detach workspace to Inline' })).toBeInTheDocument();
  });

  it('refreshes the entry path by templateId before applying workspace access after a directory rename', async () => {
    const provider = createJsTemplateRunJSEditorProvider();
    const onPersistedChange = vi.fn();
    const workspaceApi: ApiClientLike = {
      request: vi.fn(async (options) => {
        if (options.url !== 'jsTemplates:get') {
          throw new Error(`Unexpected workspace request: ${options.url}`);
        }
        return {
          data: {
            data: {
              id: 'jtt_example',
              projectId: 'jtp_example',
              templateName: 'stable-example',
              entryPath: 'src/client/js-blocks/renamed-example/index.tsx',
              kind: 'js-block',
              title: 'Example refreshed',
              runtimeArtifact: {
                code: 'ctx.render(<div>refreshed runtime</div>);',
                version: 'v3',
                entryPath: 'src/client/js-blocks/renamed-example/index.tsx',
              },
            },
          },
        };
      }),
    };
    const resolverApi: ApiClientLike = {
      request: vi.fn(async (options) => {
        if (options.url !== 'jsTemplates:listSelectable') {
          throw new Error(`Unexpected resolver request: ${options.url}`);
        }
        return {
          data: {
            data: [
              {
                id: 'jtt_example',
                projectId: 'jtp_example',
                kind: 'js-block',
                templateName: 'stable-example',
                entryPath: 'src/client/js-blocks/renamed-example/index.tsx',
                title: 'Example refreshed',
                category: null,
                settingsSchema: {
                  type: 'object',
                  properties: {
                    refreshedLabel: { type: 'string', title: 'Refreshed label' },
                  },
                },
                settingsSchemaHash: 'new-schema',
                settingsDefaultsHash: 'new-defaults',
                runtimeCodeHash: 'new-runtime',
                runtimeAvailable: true,
              },
            ],
          },
        };
      }),
    };
    const value = {
      code: 'ctx.render(<div />);',
      version: 'v2',
      sourceMode: 'js-template',
      sourceBinding: {
        type: 'js-template-entry' as const,
        projectId: 'jtp_example',
        templateId: 'jtt_example',
        kind: 'js-block' as const,
      },
    };
    const descriptorCache = getJsTemplateSettingsDescriptorCache(resolverApi);
    descriptorCache.primeScope('jtp_example', 'js-block', [
      {
        id: 'jtt_example',
        projectId: 'jtp_example',
        kind: 'js-block',
        templateName: 'stable-example',
        entryPath: 'src/client/js-blocks/old-example/index.tsx',
        title: 'Old example',
        category: null,
        settingsSchema: {
          type: 'object',
          properties: {
            oldLabel: { type: 'string' },
          },
        },
        settingsSchemaHash: 'old-schema',
        settingsDefaultsHash: 'old-defaults',
        runtimeCodeHash: 'old-runtime',
        runtimeAvailable: true,
      },
    ]);
    const invalidateRuntimeProject = vi.fn();
    getOrCreateJsTemplateRuntimeCache(resolverApi, () => ({
      invalidateProject: invalidateRuntimeProject,
      clear: vi.fn(),
    }));
    const resolver = createJsTemplateRunJSResolver(resolverApi);
    const invalidateResolverCache = vi.spyOn(resolver, 'invalidateCache');
    const unregisterResolver = RunJSSourceResolverRegistry.registerResolver(resolver);

    render(
      <EditorViewHarness api={workspaceApi} appApi={resolverApi} onClose={vi.fn()}>
        {provider.renderEditor({
          value,
          locator: {
            kind: 'flowModel.step',
            modelUid: 'model_1',
            flowKey: 'jsSettings',
            stepKey: 'runJs',
            paramPath: ['code'],
          },
          surfaceStyle: 'render',
          onPersistedChange,
        })}
      </EditorViewHarness>,
    );

    await waitFor(() => {
      expect(
        screen.getByText('workspace:jtp_example:jtt_example:src/client/js-blocks/renamed-example/index.tsx:js-block'),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'save workspace and close' }));
    await waitFor(() => {
      expect(onPersistedChange).toHaveBeenCalledWith({
        ...value,
        code: 'ctx.render(<div>refreshed runtime</div>);',
        version: 'v3',
        sourceBinding: value.sourceBinding,
      });
    });
    expect(descriptorCache.get(value.sourceBinding)).toMatchObject({
      entryId: 'jtt_example',
      settingsSchemaHash: 'new-schema',
      schema: {
        type: 'object',
        properties: {
          refreshedLabel: { type: 'string', title: 'Refreshed label' },
        },
      },
    });
    expect(invalidateResolverCache).toHaveBeenCalledWith('jtp_example');
    expect(invalidateRuntimeProject).toHaveBeenCalledWith('jtp_example');
    expect(resolverApi.request).toHaveBeenCalledWith({
      url: 'jsTemplates:listSelectable',
      method: 'post',
    });
    unregisterResolver();
  });

  it('waits for the persisted host update before closing the embedded editor after save', async () => {
    const provider = createJsTemplateRunJSEditorProvider();
    const onClose = vi.fn();
    let resolvePersistedChange: (() => void) | undefined;
    const onPersistedChange = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolvePersistedChange = resolve;
        }),
    );
    const api: ApiClientLike = {
      request: vi.fn(async () => ({
        data: {
          data: {
            id: 'jtt_example',
            projectId: 'jtp_example',
            templateName: 'example',
            entryPath: 'src/client/js-blocks/example/index.tsx',
            kind: 'js-block',
            title: 'Example',
            runtimeArtifact: {
              code: 'ctx.render(<div>saved</div>);',
              version: 'v3',
              entryPath: 'src/client/js-blocks/example/index.tsx',
            },
          },
        },
      })),
    };
    const value = {
      code: 'ctx.render(<div />);',
      version: 'v2',
      sourceMode: 'js-template',
      sourceBinding: {
        type: 'js-template-entry' as const,
        projectId: 'jtp_example',
        templateId: 'jtt_example',
        kind: 'js-block' as const,
      },
    };

    render(
      <EditorViewHarness api={api} onClose={onClose}>
        {provider.renderEditor({
          value,
          locator: {
            kind: 'flowModel.step',
            modelUid: 'model_1',
            flowKey: 'jsSettings',
            stepKey: 'runJs',
            paramPath: ['code'],
          },
          surfaceStyle: 'render',
          onPersistedChange,
        })}
      </EditorViewHarness>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'save workspace and close' }));
    await waitFor(() => {
      expect(onPersistedChange).toHaveBeenCalled();
    });
    expect(onClose).not.toHaveBeenCalled();

    await act(async () => {
      resolvePersistedChange?.();
      await Promise.resolve();
    });
    await waitFor(() => {
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });
});
