/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ApplicationContext, RunJSSourceResolverRegistry } from '@nocobase/client-v2';
import { FlowContext, FlowContextProvider, FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';

import {
  createRunJSLightExtensionEditorProvider,
  waitForHostRefreshCommit,
} from '../components/RunJSLightExtensionEditorProvider';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';
import { createLightExtensionRunJSResolver } from '../resolvers/LightExtensionRunJSResolver';
import { getOrCreateLightExtensionRuntimeCache } from '../resolvers/LightExtensionRuntimeCacheRegistry';
import { getLightExtensionSettingsDescriptorCache } from '../resolvers/LightExtensionSettingsDescriptorCache';

vi.mock('../pages/LightExtensionWorkspacePage', () => {
  const MockLightExtensionWorkspacePage = ({
    repoId,
    initialPath,
    workspaceScope,
    defaultFilesCollapsed,
    entryId,
    onMoveToInline,
    onPreview,
    onFooterActionsChange,
    onRequestClose,
    onSaved,
  }: {
    repoId?: string;
    initialPath?: string;
    workspaceScope?: unknown;
    defaultFilesCollapsed?: boolean;
    entryId?: string | null;
    onMoveToInline?: (input: {
      entryPath: string;
      files: Array<{ path: string; content: string }>;
      version: string;
    }) => void | Promise<void>;
    onPreview?: (artifact: { code: string; version: string; entryPath: string }) => void | Promise<void>;
    onFooterActionsChange?: (
      actions: {
        dirty: boolean;
        disabled: boolean;
        loading: boolean;
        onCancel: () => void;
        onSave: () => void;
        requestSave: () => Promise<'saved'>;
      } | null,
    ) => void;
    onRequestClose?: () => void | Promise<void>;
    onSaved?: () => void | Promise<void>;
  }) => {
    const saveAndClose = async () => {
      await onSaved?.();
      await onRequestClose?.();
    };

    React.useEffect(() => {
      onFooterActionsChange?.({
        dirty: true,
        disabled: false,
        loading: false,
        onCancel: () => onRequestClose?.(),
        onSave: () => onSaved?.(),
        requestSave: async () => {
          await onSaved?.();
          return 'saved';
        },
      });
      return () => onFooterActionsChange?.(null);
    }, [onFooterActionsChange, onRequestClose, onSaved]);

    return (
      <div
        data-default-files-collapsed={String(Boolean(defaultFilesCollapsed))}
        data-entry-id={entryId || ''}
        data-workspace-scope={JSON.stringify(workspaceScope)}
      >
        workspace:{repoId}:{initialPath}
        {onPreview ? (
          <button
            type="button"
            onClick={() =>
              onPreview({
                code: 'ctx.render(<div>workspace preview</div>);',
                version: 'v2',
                entryPath: initialPath || '',
              })
            }
          >
            preview workspace
          </button>
        ) : null}
        {onMoveToInline ? (
          <button
            type="button"
            onClick={() =>
              onMoveToInline({
                entryPath: initialPath || '',
                files: [
                  { path: initialPath || '', content: 'ctx.render(<div>working copy</div>);' },
                  { path: 'src/shared/format.ts', content: 'export const format = () => "ok";' },
                ],
                version: 'v2',
              })
            }
          >
            move workspace to inline
          </button>
        ) : null}
        <button type="button" onClick={onSaved}>
          save workspace
        </button>
        <button type="button" onClick={saveAndClose}>
          save workspace and close
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
  const [footer, setFooter] = React.useState<React.ReactNode>(null);
  const context = React.useMemo(() => {
    const nextContext = new FlowContext();
    nextContext.defineProperty('view', {
      value: {
        close: onClose,
        setFooter,
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

  const content = (
    <FlowContextProvider context={context}>
      {children}
      <div data-testid="editor-view-footer">{footer}</div>
    </FlowContextProvider>
  );

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
  it('never handles nested RunJS values, including stale light-extension bindings', () => {
    const provider = createRunJSLightExtensionEditorProvider();
    const nestedLocator = {
      kind: 'flowModel.nestedRunJS' as const,
      modelUid: 'form_1',
      containerFlowKey: 'formModelSettings',
      containerStepKey: 'assignRules',
      valuePath: ['value', 0, 'value'],
      scene: 'formValue',
    };

    expect(
      provider.canHandle?.({
        value: { code: 'return 1;', version: 'v2' },
        locator: nestedLocator,
        surfaceStyle: 'value',
      }),
    ).toBe(false);
    expect(
      provider.canHandle?.({
        value: { code: 'return 1;', version: 'v2' },
        surfaceStyle: 'value',
      }),
    ).toBe(false);
    expect(
      provider.canHandle?.({
        value: { code: 'return 1;', version: 'v2' },
        locator: nestedLocator,
        surfaceStyle: 'action',
      }),
    ).toBe(false);
    expect(
      provider.canHandle?.({
        value: { code: 'return 1;', version: 'v2' },
        locator: {
          kind: 'flowModel.step',
          modelUid: 'model_1',
          flowKey: 'jsSettings',
          stepKey: 'runJs',
          paramPath: ['code'],
        },
        surfaceStyle: 'value',
      }),
    ).toBe(false);

    const staleLightExtensionValue = {
      code: '',
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry',
        repoId: 'repo_1',
        entryId: 'entry_1',
        entryPath: 'src/client/runjs/example/index.ts',
        kind: 'runjs',
      },
    };
    expect(
      provider.canHandle?.({
        value: staleLightExtensionValue,
        locator: nestedLocator,
        surfaceStyle: 'value',
      }),
    ).toBe(false);
  });

  it('opens the selected light extension workspace for JS block render editors', () => {
    const provider = createRunJSLightExtensionEditorProvider();
    const onChange = vi.fn();
    const onPersistedChange = vi.fn();
    const onPreview = vi.fn();
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
      onPreview,
    };

    expect(provider.canHandle?.(props)).toBe(true);
    render(<>{provider.renderEditor(props)}</>);

    expect(screen.getByTestId('light-extension-source-workspace-editor')).toHaveStyle({
      height: 'calc(100vh - 96px)',
      minHeight: 0,
      minWidth: 0,
      overflow: 'hidden',
    });
    expect(screen.getByText('workspace:ler_example:src/client/js-blocks/example/index.tsx')).toHaveAttribute(
      'data-workspace-scope',
      JSON.stringify({
        mode: 'entry',
        entryPath: 'src/client/js-blocks/example/index.tsx',
        kind: 'js-block',
      }),
    );
    expect(screen.getByText('workspace:ler_example:src/client/js-blocks/example/index.tsx')).toHaveAttribute(
      'data-default-files-collapsed',
      'true',
    );
    expect(screen.getByText('workspace:ler_example:src/client/js-blocks/example/index.tsx')).toHaveAttribute(
      'data-entry-id',
      'lee_example',
    );
    fireEvent.click(screen.getByRole('button', { name: 'preview workspace' }));
    expect(onPreview).toHaveBeenCalledWith({
      ...props.value,
      code: 'ctx.render(<div>workspace preview</div>);',
      version: 'v2',
      sourceMode: 'inline',
    });
    fireEvent.click(screen.getByRole('button', { name: 'save workspace', exact: true }));
    expect(onPersistedChange).toHaveBeenCalledWith(props.value);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('temporarily previews JS block workspace code and restores the persisted binding on cancel', async () => {
    const provider = createRunJSLightExtensionEditorProvider();
    const engine = new FlowEngine();
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
      uid: 'model_1',
      flowEngine: engine,
      stepParams: {
        jsSettings: {
          runJs: value,
        },
      },
    });
    const rerender = vi.spyOn(model, 'rerender').mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <EditorViewHarness model={model} onClose={onClose}>
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
        })}
      </EditorViewHarness>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'preview workspace' }));
    await waitFor(() =>
      expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
        code: 'ctx.render(<div>workspace preview</div>);',
        sourceMode: 'inline',
        sourceBinding: value.sourceBinding,
      }),
    );

    const footer = await screen.findByTestId('editor-view-footer');
    fireEvent.click(within(footer).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject(value);
    expect(rerender).toHaveBeenCalledTimes(2);
  });

  it('moves the current JS block workspace back to inline code and closes without restoring the old binding', async () => {
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
                entryPath: 'src/client/js-blocks/example/index.tsx',
                kind: 'js-block',
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
        entryPath: 'src/client/js-blocks/example/index.tsx',
        kind: 'js-block' as const,
      },
      settings: { title: 'Revenue' },
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

    fireEvent.click(await screen.findByRole('button', { name: 'move workspace to inline' }));

    await waitFor(() => {
      expect(api.request).toHaveBeenCalledWith({
        url: 'lightExtensions:moveToInline',
        method: 'post',
        data: {
          locator: {
            kind: 'flowModel.step',
            modelUid: 'model_1',
            flowKey: 'jsSettings',
            stepKey: 'runJs',
            paramPath: ['code'],
          },
          repoId: 'ler_example',
          entryId: 'lee_example',
          entryPath: 'src/client/js-blocks/example/index.tsx',
          kind: 'js-block',
          version: 'v2',
          files: [
            {
              path: 'src/client/js-blocks/example/index.tsx',
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
    expect(onClose).toHaveBeenCalledTimes(1);
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
    const resolverApi: ApiClientLike = {
      request: vi.fn(async (options) => {
        if (options.url !== 'lightExtensionEntries:listSelectable') {
          throw new Error(`Unexpected resolver request: ${options.url}`);
        }
        return {
          data: {
            data: [
              {
                id: 'lee_example',
                repoId: 'ler_example',
                kind: 'js-block',
                entryName: 'stable-example',
                entryPath: 'src/client/js-blocks/renamed-example/index.tsx',
                title: 'Example refreshed',
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
    const descriptorCache = getLightExtensionSettingsDescriptorCache(resolverApi);
    descriptorCache.primeScope('ler_example', 'js-block', [
      {
        id: 'lee_example',
        repoId: 'ler_example',
        kind: 'js-block',
        entryName: 'stable-example',
        entryPath: 'src/client/js-blocks/old-example/index.tsx',
        title: 'Old example',
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
    const invalidateRuntimeRepo = vi.fn();
    getOrCreateLightExtensionRuntimeCache(resolverApi, () => ({
      invalidateRepo: invalidateRuntimeRepo,
      clear: vi.fn(),
    }));
    const resolver = createLightExtensionRunJSResolver(resolverApi);
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
      expect(screen.getByText('workspace:ler_example:src/client/js-blocks/renamed-example/index.tsx')).toHaveAttribute(
        'data-workspace-scope',
        JSON.stringify({
          mode: 'entry',
          entryPath: 'src/client/js-blocks/renamed-example/index.tsx',
          kind: 'js-block',
        }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'save workspace', exact: true }));
    await waitFor(() => {
      expect(onPersistedChange).toHaveBeenCalledWith({
        ...value,
        code: 'ctx.render(<div>refreshed runtime</div>);',
        version: 'v3',
        sourceBinding: {
          ...value.sourceBinding,
          entryPath: 'src/client/js-blocks/renamed-example/index.tsx',
          entryTitle: 'Example refreshed',
        },
      });
    });
    expect(descriptorCache.get(value.sourceBinding)).toMatchObject({
      entryId: 'lee_example',
      settingsSchemaHash: 'new-schema',
      schema: {
        type: 'object',
        properties: {
          refreshedLabel: { type: 'string', title: 'Refreshed label' },
        },
      },
    });
    expect(invalidateRuntimeRepo).toHaveBeenCalledWith('ler_example');
    expect(resolverApi.request).toHaveBeenCalledWith({
      url: 'lightExtensionEntries:listSelectable',
      method: 'post',
      data: { repoId: 'ler_example', kind: 'js-block' },
    });
    unregisterResolver();
  });

  it('waits for the persisted host update before closing the embedded editor after save', async () => {
    const provider = createRunJSLightExtensionEditorProvider();
    const onClose = vi.fn();
    const requestAnimationFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      queueMicrotask(() => callback(performance.now()));
      return 1;
    });
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

    fireEvent.click(screen.getByRole('button', { name: 'save workspace and close', exact: true }));
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
    requestAnimationFrame.mockRestore();
  });

  it('waits for the next animation frame before completing a host refresh commit', async () => {
    let animationFrame: FrameRequestCallback | undefined;
    const requestAnimationFrame = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      animationFrame = callback;
      return 1;
    });
    let completed = false;
    const refreshCommit = waitForHostRefreshCommit().then(() => {
      completed = true;
    });

    await Promise.resolve();
    expect(completed).toBe(false);
    animationFrame?.(performance.now());
    await refreshCommit;
    expect(completed).toBe(true);
    requestAnimationFrame.mockRestore();
  });

  it('places cancel and save actions in the editor view footer', async () => {
    const provider = createRunJSLightExtensionEditorProvider();
    const onClose = vi.fn();
    const onPersistedChange = vi.fn();
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
      <EditorViewHarness onClose={onClose}>
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

    const footer = await screen.findByTestId('editor-view-footer');
    await waitFor(() => expect(within(footer).getByRole('button', { name: 'Cancel' })).toBeInTheDocument());
    expect(within(footer).getByRole('button', { name: 'Save' })).toBeInTheDocument();

    fireEvent.click(within(footer).getByRole('button', { name: 'Save' }));
    expect(onPersistedChange).toHaveBeenCalledWith(value);

    fireEvent.click(within(footer).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('opens scoped workspaces for flow model JS action entries', () => {
    const provider = createRunJSLightExtensionEditorProvider();
    const props = {
      value: {
        code: 'ctx.message.success("ok");',
        version: 'v2',
        sourceMode: 'light-extension',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: 'ler_example',
          entryId: 'lee_action',
          entryPath: 'src/client/js-actions/approve/index.ts',
          kind: 'js-action',
        },
      },
      locator: {
        kind: 'flowModel.step' as const,
        modelUid: 'action_1',
        flowKey: 'clickSettings',
        stepKey: 'runJs',
        paramPath: ['code'],
      },
      surfaceStyle: 'action' as const,
    };

    expect(provider.canHandle?.(props)).toBe(true);
    render(<>{provider.renderEditor(props)}</>);

    expect(screen.getByText('workspace:ler_example:src/client/js-actions/approve/index.ts')).toHaveAttribute(
      'data-workspace-scope',
      JSON.stringify({
        mode: 'entry',
        entryPath: 'src/client/js-actions/approve/index.ts',
        kind: 'js-action',
      }),
    );
  });
});
