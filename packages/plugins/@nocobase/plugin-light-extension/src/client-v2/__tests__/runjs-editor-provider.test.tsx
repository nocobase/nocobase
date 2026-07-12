/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { FlowContext, FlowContextProvider, FlowEngine, FlowModel } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';

import { createRunJSLightExtensionEditorProvider } from '../components/RunJSLightExtensionEditorProvider';
import type { ApiClientLike } from '../api/lightExtensionEntriesRequests';

vi.mock('@nocobase/client-v2', async () => {
  const actual = await vi.importActual<typeof import('@nocobase/client-v2')>('@nocobase/client-v2');
  return {
    ...actual,
    CodeEditor: ({ value, onChange }: { value?: string; onChange?: (value: string) => void }) => (
      <textarea aria-label="runjs-code" value={value || ''} onChange={(event) => onChange?.(event.target.value)} />
    ),
  };
});

vi.mock('../components/JSBlockLightExtensionSourceField', () => ({
  RunJSLightExtensionSourceField: ({ value }: { value?: string | { entryId?: string } }) => (
    <div>source:{typeof value === 'string' ? value : value?.entryId || 'inline'}</div>
  ),
}));

vi.mock('../pages/LightExtensionWorkspacePage', () => {
  const MockLightExtensionWorkspacePage = ({
    repoId,
    initialPath,
    workspaceScope,
    defaultFilesCollapsed,
    entryId,
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
    onRequestClose?: () => void;
    onSaved?: () => void;
  }) => {
    React.useEffect(() => {
      onFooterActionsChange?.({
        dirty: true,
        disabled: false,
        loading: false,
        onCancel: () => onRequestClose?.(),
        onSave: () => onSaved?.(),
        requestSave: async () => {
          onSaved?.();
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
        <button type="button" onClick={onSaved}>
          save workspace
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
  children: React.ReactNode;
  model?: FlowModel;
  onClose: () => void;
}) {
  const { api, children, model, onClose } = props;
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

  return (
    <FlowContextProvider context={context}>
      {children}
      <div data-testid="editor-view-footer">{footer}</div>
    </FlowContextProvider>
  );
}

describe('RunJSLightExtensionEditorProvider', () => {
  it('only handles nested values after a light extension is selected', () => {
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

    const lightExtensionValue = {
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
        value: lightExtensionValue,
        locator: nestedLocator,
        surfaceStyle: 'value',
      }),
    ).toBe(true);

    render(
      <>
        {provider.renderEditor({
          value: lightExtensionValue,
          locator: nestedLocator,
          surfaceStyle: 'value',
        })}
      </>,
    );

    expect(screen.getByText('source:entry_1')).toBeInTheDocument();
    expect(screen.queryByLabelText('runjs-code')).not.toBeInTheDocument();
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
    fireEvent.click(screen.getByRole('button', { name: 'save workspace' }));
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

  it('refreshes the entry path by entryId before applying workspace access after a directory rename', async () => {
    const provider = createRunJSLightExtensionEditorProvider();
    const onPersistedChange = vi.fn();
    const api: ApiClientLike = {
      request: vi.fn(async () => ({
        data: {
          data: {
            id: 'lee_example',
            repoId: 'ler_example',
            entryName: 'stable-example',
            entryPath: 'src/client/js-blocks/renamed-example/index.tsx',
            kind: 'js-block',
            title: 'Example',
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
        entryName: 'stable-example',
        entryPath: 'src/client/js-blocks/old-example/index.tsx',
        kind: 'js-block' as const,
      },
    };

    render(
      <EditorViewHarness api={api} onClose={vi.fn()}>
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

    fireEvent.click(screen.getByRole('button', { name: 'save workspace' }));
    expect(onPersistedChange).toHaveBeenCalledWith({
      ...value,
      sourceBinding: {
        ...value.sourceBinding,
        entryPath: 'src/client/js-blocks/renamed-example/index.tsx',
        entryTitle: 'Example',
      },
    });
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
