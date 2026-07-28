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
import { ApplicationContext, type RunJSEditorProviderRenderProps } from '@nocobase/client-v2';
import { FlowContext, FlowContextProvider, FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';

import { createRunJSLightExtensionEditorProvider } from '../components/RunJSLightExtensionEditorProvider';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { resolveInlineLightExtensionWorkspaceJsonSchema } from '../workspace/lightExtensionWorkspaceJsonSchema';

vi.mock('../pages/LightExtensionWorkspacePage', () => {
  const MockLightExtensionWorkspacePage = ({
    repoId,
    initialPath,
    workspaceScope,
    entryId,
    onMoveToInline,
    onPreview,
    onRequestClose,
    onSaved,
  }: {
    repoId?: string;
    initialPath?: string;
    workspaceScope?: { kind?: string };
    entryId?: string | null;
    onMoveToInline?: (input: {
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
    const moveWorkspaceToInline = async () => {
      try {
        await onMoveToInline?.({
          entryPath: initialPath || '',
          files: [
            { path: initialPath || '', content: 'ctx.render(<div>working copy</div>);' },
            { path: 'src/shared/format.ts', content: 'export const format = () => "ok";' },
          ],
          version: 'v2',
        });
      } catch {
        // The real workspace reports copyback failures without closing the editor.
      }
    };

    return (
      <div>
        workspace:{repoId}:{entryId}:{initialPath}:{workspaceScope?.kind}
        {onMoveToInline ? (
          <button type="button" onClick={moveWorkspaceToInline}>
            move workspace to inline
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
    default: MockLightExtensionWorkspacePage,
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

describe('RunJSLightExtensionEditorProvider', () => {
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
    sourceMode: 'light-extension',
    sourceBinding: {
      type: 'light-extension-entry' as const,
      repoId: 'repo_1',
      entryId: 'entry_1',
      entryPath: 'src/client/js-blocks/example/index.tsx',
      kind: 'js-block' as const,
    },
  };

  it.each([
    [
      'supported step metadata',
      { value: { code: '', version: 'v2' }, locator: stepLocator, sourceMetadata: { lightExtensionKind: 'js-block' } },
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
        sourceMetadata: { lightExtensionKind: 'js-block' },
      },
      false,
    ],
    [
      'supported source locator',
      {
        value: { code: '', version: 'v2' },
        locator: { kind: 'chart.option' as const, modelUid: 'chart-1' },
        sourceLocator: stepLocator,
        sourceMetadata: { lightExtensionKind: 'js-block' },
      },
      true,
    ],
  ])('routes %s', (_name, props, expected) => {
    const provider = createRunJSLightExtensionEditorProvider();
    expect(provider.canHandle?.(props)).toBe(expected);
  });

  it('delegates non-step locators to the next editor provider', () => {
    const provider = createRunJSLightExtensionEditorProvider();
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
    const provider = createRunJSLightExtensionEditorProvider();
    const onChange = vi.fn();
    const onPersistedChange = vi.fn();
    const props = {
      value: {
        code: 'ctx.render(<div />);',
        version: 'v2',
        sourceMode: 'light-extension',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: 'ler_example',
          entryId: 'lee_example',
          entryPath: 'src/client/js-blocks/example/index.tsx',
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
    render(<>{provider.renderEditor(props)}</>);

    expect(
      screen.getByText('workspace:ler_example:lee_example:src/client/js-blocks/example/index.tsx:js-block'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'save workspace and close' }));
    await waitFor(() => expect(onPersistedChange).toHaveBeenCalledWith(props.value));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('previews a light extension JS block through its rendered FlowModel surface and restores it on close', async () => {
    const provider = createRunJSLightExtensionEditorProvider();
    const onClose = vi.fn();
    const value = {
      code: 'ctx.render(<div>persisted</div>);',
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry' as const,
        repoId: 'ler_example',
        entryId: 'lee_example',
        entryPath: 'src/client/js-blocks/example/index.tsx',
        kind: 'js-block' as const,
      },
    };
    const model = new FlowModel({
      uid: 'model_js_block_external',
      flowEngine: new FlowEngine(),
      stepParams: { jsSettings: { runJs: value } },
    });
    const rerender = vi.spyOn(model, 'rerender').mockResolvedValue(undefined);

    render(
      <EditorViewHarness model={model} onClose={onClose}>
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

    fireEvent.click(screen.getByRole('button', { name: 'preview workspace' }));
    await waitFor(() =>
      expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
        code: 'ctx.render(<div>preview</div>);',
        version: 'v2',
        sourceMode: 'inline',
      }),
    );

    fireEvent.click(screen.getByRole('button', { name: 'close workspace' }));
    await waitFor(() => expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject(value));
    expect(rerender).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('moves a JS Page workspace back to inline once while preserving settings and the new source snapshot', async () => {
    const provider = createRunJSLightExtensionEditorProvider();
    const onPersistedChange = vi.fn();
    const onClose = vi.fn();
    const sourceRef = {
      type: 'vsc-file' as const,
      repoId: 'runjs_repo_1',
      commitId: 'runjs_commit_2',
      entry: 'src/client/index.tsx',
    };
    const api: ApiClientLike = {
      request: vi.fn(async (options) => {
        if (options.url === 'lightExtensionEntries:get') {
          return {
            data: {
              data: {
                id: 'lee_example',
                repoId: 'ler_example',
                entryName: 'example',
                entryPath: 'src/client/js-pages/example/index.tsx',
                kind: 'js-page',
                title: 'Example',
              },
            },
          };
        }
        if (options.url === 'lightExtensions:moveToInline') {
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
    const value = {
      code: 'ctx.render(<div>persisted light extension</div>);',
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry' as const,
        repoId: 'ler_example',
        entryId: 'lee_example',
        entryPath: 'src/client/js-pages/example/index.tsx',
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
          sourceMetadata: { lightExtensionKind: 'js-page', modelUse: 'JSPageModel' },
          surfaceStyle: 'render',
          onPersistedChange,
        })}
      </EditorViewHarness>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'move workspace to inline' }));

    await waitFor(() =>
      expect(api.request).toHaveBeenCalledWith(expect.objectContaining({ url: 'lightExtensions:moveToInline' })),
    );
    expect(onPersistedChange).toHaveBeenCalledWith({
      ...value,
      code: 'ctx.render(<div>inline workspace</div>);',
      version: 'v2',
      sourceMode: 'inline',
      sourceBinding: undefined,
      sourceRef,
    });
    expect(onPersistedChange).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('keeps the JS Page external binding when copyback fails', async () => {
    const provider = createRunJSLightExtensionEditorProvider();
    const onPersistedChange = vi.fn();
    const onClose = vi.fn();
    const api: ApiClientLike = {
      request: vi.fn(async (options) => {
        if (options.url === 'lightExtensionEntries:get') {
          return {
            data: {
              data: {
                id: 'lee_page',
                repoId: 'ler_pages',
                entryName: 'page',
                entryPath: 'src/client/js-pages/page/index.tsx',
                kind: 'js-page',
              },
            },
          };
        }
        if (options.url === 'lightExtensions:moveToInline') {
          throw new Error('copyback failed');
        }
        throw new Error(`Unexpected request: ${options.url}`);
      }),
    };
    const value = {
      code: 'ctx.render(ctx.page.uid);',
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry' as const,
        repoId: 'ler_pages',
        entryId: 'lee_page',
        entryPath: 'src/client/js-pages/page/index.tsx',
        kind: 'js-page' as const,
      },
      settings: { title: 'Page' },
    };

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
          sourceMetadata: { lightExtensionKind: 'js-page', modelUse: 'JSPageModel' },
          surfaceStyle: 'render',
          onPersistedChange,
        })}
      </EditorViewHarness>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'move workspace to inline' }));

    await waitFor(() => {
      expect(api.request).toHaveBeenCalledWith(expect.objectContaining({ url: 'lightExtensions:moveToInline' }));
    });
    expect(onPersistedChange).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
    expect(
      screen.getByText('workspace:ler_pages:lee_page:src/client/js-pages/page/index.tsx:js-page'),
    ).toBeInTheDocument();
  });

  it('wraps inline light-extension-capable flow steps with entry.json schema and settings type resolvers', () => {
    const provider = createRunJSLightExtensionEditorProvider();
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
      sourceMetadata: { lightExtensionKind: 'js-block' },
      renderNext,
    };

    expect(provider.canHandle?.(props)).toBe(true);
    render(<>{provider.renderEditor(props)}</>);

    expect(screen.getByText('inline studio')).toBeInTheDocument();
    const overrides = renderNext.mock.calls[0]?.[0] as Partial<RunJSEditorProviderRenderProps>;
    expect(overrides.workspaceJsonSchemaResolver).toBe(resolveInlineLightExtensionWorkspaceJsonSchema);
    expect(overrides.workspaceTypeScriptContextResolver).toEqual(expect.any(Function));
    expect(resolveInlineLightExtensionWorkspaceJsonSchema('src/client/entry.json')).toBeTruthy();
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
    expect(typeScriptContext?.globalContextType).toBe('LightExtensionActiveEntryContext');
    expect(
      typeScriptContext?.declarationFiles?.find((file) => file.path.endsWith('/collection-table.d.ts'))?.content,
    ).toContain('columns?: Array<{}>;');
  });

  it.each([
    ['js-block', 'blocks', 'JSBlockModel'],
    ['js-page', 'pages', 'JSPageModel'],
    ['js-field', 'fields', 'JSColumnModel'],
    ['js-action', 'actions', 'JSActionModel'],
    ['js-item', 'items', 'JSItemModel'],
  ] as const)('opens the scoped %s workspace', async (kind, directory, modelUse) => {
    const provider = createRunJSLightExtensionEditorProvider();
    const api: ApiClientLike = { request: vi.fn(async () => ({ data: { data: {} } })) };
    const entryPath = `src/client/js-${directory}/example/index.tsx`;

    render(
      <EditorViewHarness appApi={api} onClose={vi.fn()}>
        {provider.renderEditor({
          value: {
            code: 'ctx.render(null);',
            version: 'v2',
            sourceMode: 'light-extension',
            sourceBinding: {
              type: 'light-extension-entry',
              repoId: 'ler_example',
              entryId: `lee_${kind}`,
              entryPath,
              kind,
            },
          },
          locator: { ...stepLocator, modelUid: `model_${kind}` },
          sourceMetadata: { lightExtensionKind: kind, modelUse },
          surfaceStyle: kind === 'js-action' ? 'action' : 'render',
        })}
      </EditorViewHarness>,
    );

    expect(screen.getByText(`workspace:ler_example:lee_${kind}:${entryPath}:${kind}`)).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'move workspace to inline' })).toBeInTheDocument();
  });

  it('refreshes the entry path by entryId before applying workspace access after a directory rename', async () => {
    const provider = createRunJSLightExtensionEditorProvider();
    const onPersistedChange = vi.fn();
    const workspaceApi: ApiClientLike = {
      request: vi.fn(async (options) => {
        if (options.url !== 'lightExtensionEntries:get') {
          throw new Error(`Unexpected workspace request: ${options.url}`);
        }
        return {
          data: {
            data: {
              id: 'lee_example',
              repoId: 'ler_example',
              entryName: 'stable-example',
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
    const value = {
      code: 'ctx.render(<div />);',
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry' as const,
        repoId: 'ler_example',
        entryId: 'lee_example',
        entryName: 'stable-example',
        entryPath: 'src/client/js-blocks/old-example/index.tsx',
        kind: 'js-block' as const,
      },
    };
    render(
      <EditorViewHarness api={workspaceApi} onClose={vi.fn()}>
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
        screen.getByText('workspace:ler_example:lee_example:src/client/js-blocks/renamed-example/index.tsx:js-block'),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'save workspace and close' }));
    await waitFor(() => {
      expect(onPersistedChange).toHaveBeenCalledWith({
        ...value,
        code: 'ctx.render(<div>refreshed runtime</div>);',
        version: 'v3',
        sourceBinding: {
          ...value.sourceBinding,
          entryPath: 'src/client/js-blocks/renamed-example/index.tsx',
          entryTitle: 'stable-example',
        },
      });
    });
  });

  it('waits for the persisted host update before closing the embedded editor after save', async () => {
    const provider = createRunJSLightExtensionEditorProvider();
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
            id: 'lee_example',
            repoId: 'ler_example',
            entryName: 'example',
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
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry' as const,
        repoId: 'ler_example',
        entryId: 'lee_example',
        entryPath: 'src/client/js-blocks/example/index.tsx',
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

    fireEvent.click(screen.getByRole('button', { name: 'save workspace and close' }));
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
