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
import { FlowContext, FlowContextProvider } from '@nocobase/flow-engine';
import { describe, expect, it, vi } from 'vitest';

import { createRunJSLightExtensionEditorProvider } from '../components/RunJSLightExtensionEditorProvider';

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
  RunJSLightExtensionSourceField: ({ value, onChange }: { value?: string; onChange?: (value: string) => void }) => (
    <button type="button" onClick={() => onChange?.('light-extension')}>
      source:{value || 'inline'}
    </button>
  ),
}));

vi.mock('../pages/LightExtensionWorkspacePage', () => {
  const MockLightExtensionWorkspacePage = ({
    repoId,
    initialPath,
    workspaceScope,
    onFooterActionsChange,
    onRequestClose,
    onSaved,
  }: {
    repoId?: string;
    initialPath?: string;
    workspaceScope?: unknown;
    onFooterActionsChange?: (
      actions: {
        disabled: boolean;
        loading: boolean;
        onCancel: () => void;
        onSave: () => void;
      } | null,
    ) => void;
    onRequestClose?: () => void;
    onSaved?: () => void;
  }) => {
    React.useEffect(() => {
      onFooterActionsChange?.({
        disabled: false,
        loading: false,
        onCancel: () => onRequestClose?.(),
        onSave: () => onSaved?.(),
      });
      return () => onFooterActionsChange?.(null);
    }, [onFooterActionsChange, onRequestClose, onSaved]);

    return (
      <div data-workspace-scope={JSON.stringify(workspaceScope)}>
        workspace:{repoId}:{initialPath}
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

function EditorViewHarness(props: { children: React.ReactNode; onClose: () => void }) {
  const { children, onClose } = props;
  const [footer, setFooter] = React.useState<React.ReactNode>(null);
  const context = React.useMemo(() => {
    const nextContext = new FlowContext();
    nextContext.defineProperty('view', {
      value: {
        close: onClose,
        setFooter,
      },
    });
    return nextContext;
  }, [onClose]);

  return (
    <FlowContextProvider context={context}>
      {children}
      <div data-testid="editor-view-footer">{footer}</div>
    </FlowContextProvider>
  );
}

describe('RunJSLightExtensionEditorProvider', () => {
  it('handles nested value/action RunJS editors and preserves inline edits', async () => {
    const provider = createRunJSLightExtensionEditorProvider();
    const onChange = vi.fn();
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
    ).toBe(true);
    expect(
      provider.canHandle?.({
        value: { code: 'return 1;', version: 'v2' },
        surfaceStyle: 'value',
      }),
    ).toBe(true);
    expect(
      provider.canHandle?.({
        value: { code: 'return 1;', version: 'v2' },
        locator: nestedLocator,
        surfaceStyle: 'action',
      }),
    ).toBe(true);
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

    render(
      <>
        {provider.renderEditor({
          value: { code: 'return 1;', version: 'v2' },
          locator: nestedLocator,
          surfaceStyle: 'value',
          onChange,
        })}
      </>,
    );

    fireEvent.change(screen.getByLabelText('runjs-code'), {
      target: { value: 'return 2;' },
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith({
        code: 'return 2;',
        version: 'v2',
        sourceMode: 'inline',
      });
    });
  });

  it('opens the selected light extension workspace for JS block render editors', () => {
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
    fireEvent.click(screen.getByRole('button', { name: 'save workspace' }));
    expect(onPersistedChange).toHaveBeenCalledWith(props.value);
    expect(onChange).not.toHaveBeenCalled();
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
