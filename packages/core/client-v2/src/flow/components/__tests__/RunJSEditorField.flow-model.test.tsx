/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FlowContextProvider, FlowEngine, FlowModel, FlowRuntimeContext, FlowStepContext } from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RunJSEditorField, RunJSEditorRegistry } from '../runjs-studio';

vi.mock('../code-editor', () => ({
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
      readOnly={readonly}
      value={value || ''}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

type FlowModelHarnessOptions = Omit<ConstructorParameters<typeof FlowModel>[0], 'flowEngine'>;

function createFlowModelHarness(options: string | FlowModelHarnessOptions = 'fm_1') {
  const modelOptions = typeof options === 'string' ? { uid: options } : options;
  const engine = new FlowEngine();
  const model = new FlowModel({ ...modelOptions, flowEngine: engine });
  const flowContext = new FlowRuntimeContext(model, 'jsSettings', 'settings');

  return {
    flowContext,
    model,
    renderEditor(element: React.ReactElement, params: Record<string, unknown> = {}) {
      return render(
        <FlowContextProvider context={flowContext}>
          <FlowStepContext.Provider value={{ params, path: `${model.uid}_jsSettings_runJs` }}>
            {element}
          </FlowStepContext.Provider>
        </FlowContextProvider>,
      );
    },
  };
}

describe('RunJSEditorField FlowModel integration', () => {
  afterEach(() => {
    RunJSEditorRegistry.clear();
  });

  it('generates flowModel.step locators from flow settings context and syncs saved values locally', async () => {
    const harness = createFlowModelHarness();
    const { model } = harness;
    const onChange = vi.fn();
    const saveStepParams = vi.spyOn(model, 'saveStepParams').mockResolvedValue(undefined);
    const rerender = vi.spyOn(model, 'rerender').mockResolvedValue(undefined);
    let capturedLocator: unknown;

    RunJSEditorRegistry.registerProvider({
      key: 'flow-model-step-provider',
      canHandle: (props) => props.locator?.kind === 'flowModel.step',
      renderEditor: (props) => {
        capturedLocator = props.locator;
        return (
          <button type="button" onClick={() => props.onChange?.({ code: 'return 2;', version: 'v2' })}>
            {props.locator?.kind}
          </button>
        );
      },
    });

    harness.renderEditor(
      <RunJSEditorField
        locatorFactory="flowModel.step"
        surfaceStyle="render"
        value={{ code: 'return 1;', version: 'v2' }}
        onChange={onChange}
      />,
    );

    expect(capturedLocator).toEqual({
      kind: 'flowModel.step',
      modelUid: 'fm_1',
      flowKey: 'jsSettings',
      stepKey: 'runJs',
      paramPath: ['code'],
      versionPath: ['version'],
    });

    fireEvent.click(screen.getByRole('button', { name: 'flowModel.step' }));

    expect(onChange).toHaveBeenCalledWith({ code: 'return 2;', version: 'v2' });
    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      code: 'return 2;',
      version: 'v2',
    });
    await waitFor(() => {
      expect(saveStepParams).toHaveBeenCalledTimes(1);
      expect(rerender).toHaveBeenCalledTimes(1);
    });
  });

  it.each([
    {
      name: 'light extension binding',
      uid: 'fm_1',
      params: {
        code: 'ctx.render(<div />);',
        version: 'v2',
        sourceMode: 'light-extension',
        sourceBinding: {
          type: 'light-extension-entry',
          repoId: 'ler_example',
          entryId: 'lee_example',
          kind: 'js-block',
        },
        settings: { title: 'Example' },
      },
      expected: {
        sourceMode: 'light-extension',
        sourceBinding: { repoId: 'ler_example', entryId: 'lee_example' },
        settings: { title: 'Example' },
      },
    },
    {
      name: 'inline sourceRef and falsy settings',
      uid: 'fm_inline',
      params: {
        code: 'ctx.render(<div />);',
        version: 'v2',
        sourceMode: 'inline',
        sourceRef: {
          type: 'vsc-file',
          repoId: 'repo_inline',
          commitId: 'commit_2',
          entry: 'src/client/index.tsx',
        },
        settings: { enabled: false, count: 0, label: '', nested: { hiddenValue: 'keep-me' } },
      },
      expected: {
        sourceMode: 'inline',
        sourceRef: {
          type: 'vsc-file',
          repoId: 'repo_inline',
          commitId: 'commit_2',
          entry: 'src/client/index.tsx',
        },
        settings: { enabled: false, count: 0, label: '', nested: { hiddenValue: 'keep-me' } },
      },
    },
  ])('passes complete $name values to providers', ({ uid, params, expected }) => {
    const harness = createFlowModelHarness(uid);
    let capturedValue: unknown;

    RunJSEditorRegistry.registerProvider({
      key: 'workspace-provider',
      renderEditor: (props) => {
        capturedValue = props.value;
        return <div>workspace</div>;
      },
    });
    harness.renderEditor(
      <RunJSEditorField locatorFactory="flowModel.step" surfaceStyle="render" value="ctx.render(<div />);" />,
      params,
    );

    expect(screen.getByText('workspace')).toBeInTheDocument();
    expect(capturedValue).toMatchObject(expected);
  });

  it.each([
    { code: 'return 1;', expectedVersion: 'v1' },
    { code: '', expectedVersion: 'v2' },
  ])('uses $expectedVersion for string editor values without a persisted version', ({ code, expectedVersion }) => {
    const harness = createFlowModelHarness();
    let capturedValue: unknown;

    RunJSEditorRegistry.registerProvider({
      key: 'effective-version-provider',
      renderEditor: (props) => {
        capturedValue = props.value;
        return <div>effective version</div>;
      },
    });
    harness.renderEditor(<RunJSEditorField locatorFactory="flowModel.step" value={code} />, { code });

    expect(capturedValue).toMatchObject({ code, version: expectedVersion });
  });

  it.each([
    { value: { code: 'return 1;' }, expectedVersion: 'v1' },
    { value: { code: '' }, expectedVersion: 'v2' },
  ])('uses $expectedVersion for object editor values without a persisted version', ({ value, expectedVersion }) => {
    const harness = createFlowModelHarness();
    let capturedValue: unknown;

    RunJSEditorRegistry.registerProvider({
      key: 'effective-object-version-provider',
      renderEditor: (props) => {
        capturedValue = props.value;
        return <div>effective object version</div>;
      },
    });
    harness.renderEditor(<RunJSEditorField locatorFactory="flowModel.step" value={value} />, value);

    expect(capturedValue).toMatchObject({ ...value, version: expectedVersion });
  });

  it.each<{
    name: string;
    unsafeProps: { paramPath?: string[]; flowKey?: string; stepKey?: string };
  }>([
    { name: 'param path', unsafeProps: { paramPath: ['__proto__', 'polluted'] } },
    { name: 'flow key', unsafeProps: { flowKey: '__proto__' } },
    { name: 'step key', unsafeProps: { stepKey: 'constructor' } },
  ])('does not generate or sync an unsafe $name', ({ unsafeProps }) => {
    const harness = createFlowModelHarness();
    const setStepParams = vi.spyOn(harness.model, 'setStepParams');
    let capturedLocator: unknown;

    RunJSEditorRegistry.registerProvider({
      key: 'unsafe-flow-step-provider',
      renderEditor: (props) => {
        capturedLocator = props.locator;
        return (
          <button type="button" onClick={() => props.onChange?.({ code: 'polluted', version: 'v2' })}>
            save
          </button>
        );
      },
    });
    harness.renderEditor(
      <RunJSEditorField
        locatorFactory="flowModel.step"
        value={{ code: 'return 1;', version: 'v2' }}
        {...unsafeProps}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    expect(capturedLocator).toBeUndefined();
    expect(setStepParams).not.toHaveBeenCalled();
  });

  it('syncs a server-persisted RunJS Studio save locally without saving the FlowModel again', async () => {
    const harness = createFlowModelHarness({
      uid: 'fm_1',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("remote");',
            sourceBinding: { type: 'light-extension-entry' },
            sourceMode: 'light-extension',
            version: 'v2',
          },
        },
      },
    });
    const { flowContext, model } = harness;
    flowContext.defineMethod('getStepFormValues', () => ({
      code: 'ctx.render("remote");',
      sourceBinding: { type: 'light-extension-entry' },
      sourceMode: 'inline',
      sourceRef: {
        type: 'vsc-file',
        repoId: 'repo_old',
        commitId: 'commit_old',
        entry: 'src/client/index.tsx',
      },
      version: 'v2',
    }));
    const saveStepParams = vi.spyOn(model, 'saveStepParams').mockResolvedValue(undefined);
    const rerender = vi.spyOn(model, 'rerender').mockResolvedValue(undefined);

    RunJSEditorRegistry.registerProvider({
      key: 'flow-model-step-provider',
      canHandle: (props) => props.locator?.kind === 'flowModel.step',
      renderEditor: (props) => (
        <button
          type="button"
          onClick={() => {
            const nextValue = {
              code: 'ctx.render(1111);',
              sourceRef: {
                type: 'vsc-file',
                repoId: 'repo_new',
                commitId: 'commit_new',
                entry: 'src/client/index.tsx',
              },
              version: 'v2',
            };
            props.onPersistedChange?.(nextValue);
          }}
        >
          save
        </button>
      ),
    });

    harness.renderEditor(
      <RunJSEditorField locatorFactory="flowModel.step" surfaceStyle="render" value="ctx.render(1111);" />,
      {
        code: 'ctx.render("remote");',
        sourceBinding: { type: 'light-extension-entry' },
        sourceMode: 'light-extension',
        sourceRef: {
          type: 'vsc-file',
          repoId: 'repo_old',
          commitId: 'commit_old',
          entry: 'src/client/index.tsx',
        },
        version: 'v2',
      },
    );

    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      code: 'ctx.render(1111);',
      sourceBinding: { type: 'light-extension-entry' },
      sourceMode: 'inline',
      sourceRef: {
        type: 'vsc-file',
        repoId: 'repo_new',
        commitId: 'commit_new',
        entry: 'src/client/index.tsx',
      },
      version: 'v2',
    });
    expect(rerender).toHaveBeenCalledTimes(1);
    expect(saveStepParams).not.toHaveBeenCalled();
  });

  it('syncs a server-persisted external binding into FlowModel step params', async () => {
    const harness = createFlowModelHarness({
      uid: 'fm_move_source',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("inline fallback");',
            version: 'v2',
          },
        },
      },
    });
    const { flowContext, model } = harness;
    flowContext.defineMethod('getStepFormValues', () => ({
      code: 'ctx.render(1111);',
      version: 'v2',
    }));
    const saveStepParams = vi.spyOn(model, 'saveStepParams').mockResolvedValue(undefined);

    RunJSEditorRegistry.registerProvider({
      key: 'external-binding-provider',
      canHandle: (props) => props.locator?.kind === 'flowModel.step',
      renderEditor: (props) => (
        <button
          type="button"
          onClick={() =>
            props.onPersistedChange?.({
              ...props.value,
              sourceMode: 'light-extension',
              sourceBinding: {
                type: 'light-extension-entry',
                repoId: 'ler_1',
                entryId: 'lee_1',
              },
              settings: { color: 'blue' },
            })
          }
        >
          move
        </button>
      ),
    });

    harness.renderEditor(
      <RunJSEditorField locatorFactory="flowModel.step" surfaceStyle="render" value="ctx.render(1111);" />,
      {
        code: 'ctx.render("inline fallback");',
        version: 'v2',
      },
    );

    fireEvent.click(screen.getByRole('button', { name: 'move' }));

    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      code: 'ctx.render(1111);',
      version: 'v2',
      sourceMode: 'light-extension',
      sourceBinding: {
        type: 'light-extension-entry',
        repoId: 'ler_1',
        entryId: 'lee_1',
      },
      settings: { color: 'blue' },
    });
    expect(saveStepParams).not.toHaveBeenCalled();
  });

  it('refreshes every loaded RunJS host that shares the persisted external source binding', async () => {
    const engine = new FlowEngine();
    const persistedValue = {
      code: 'ctx.render("remote");',
      sourceBinding: {
        type: 'light-extension-entry',
        repoId: 'ler_1',
        entryId: 'lee_1',
        kind: 'js-block',
      },
      sourceMode: 'light-extension',
      settings: { color: 'blue' },
      version: 'v2',
    };
    const model = engine.createModel<FlowModel>({
      use: 'FlowModel',
      uid: 'fm_external_source_refresh',
      stepParams: {
        jsSettings: {
          runJs: persistedValue,
        },
      },
    });
    const siblingModel = engine.createModel<FlowModel>({
      use: 'FlowModel',
      uid: 'fm_external_source_sibling',
      stepParams: {
        clickSettings: {
          runJs: {
            ...persistedValue,
            sourceBinding: {
              ...persistedValue.sourceBinding,
              entryTitle: 'Display metadata does not affect identity',
            },
          },
        },
      },
    });
    const unrelatedModel = engine.createModel<FlowModel>({
      use: 'FlowModel',
      uid: 'fm_external_source_unrelated',
      stepParams: {
        jsSettings: {
          runJs: {
            ...persistedValue,
            sourceBinding: {
              ...persistedValue.sourceBinding,
              entryId: 'lee_2',
            },
          },
        },
      },
    });
    const flowContext = new FlowRuntimeContext(model, 'jsSettings', 'settings');
    flowContext.defineMethod('getStepFormValues', () => persistedValue);
    const emit = vi.spyOn(model.emitter, 'emit');
    const siblingEmit = vi.spyOn(siblingModel.emitter, 'emit');
    const modelRerender = vi.spyOn(model, 'rerender').mockResolvedValue(undefined);
    const siblingRerender = vi.spyOn(siblingModel, 'rerender').mockResolvedValue(undefined);
    const unrelatedRerender = vi.spyOn(unrelatedModel, 'rerender').mockResolvedValue(undefined);

    RunJSEditorRegistry.registerProvider({
      key: 'external-source-refresh-provider',
      canHandle: (props) => props.locator?.kind === 'flowModel.step',
      renderEditor: (props) => (
        <button type="button" onClick={() => props.onPersistedChange?.(props.value)}>
          save source
        </button>
      ),
    });

    render(
      <FlowContextProvider context={flowContext}>
        <FlowStepContext.Provider
          value={{
            params: persistedValue,
            path: 'fm_external_source_refresh_jsSettings_runJs',
          }}
        >
          <RunJSEditorField locatorFactory="flowModel.step" surfaceStyle="action" value={persistedValue} />
        </FlowStepContext.Provider>
      </FlowContextProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'save source' }));

    await waitFor(() => expect(modelRerender).toHaveBeenCalledTimes(1));
    expect(siblingRerender).toHaveBeenCalledTimes(1);
    expect(unrelatedRerender).not.toHaveBeenCalled();
    expect(emit.mock.calls.filter(([event]) => event === 'onStepParamsChanged')).toHaveLength(1);
    expect(siblingEmit.mock.calls.filter(([event]) => event === 'onStepParamsChanged')).toHaveLength(1);
    expect(model.getStepParams('jsSettings', 'runJs')).toEqual(persistedValue);
  });

  it('keeps inline fallback edits in the form without mutating model params', () => {
    const harness = createFlowModelHarness();
    const onChange = vi.fn();
    const setStepParams = vi.spyOn(harness.model, 'setStepParams');

    harness.renderEditor(
      <RunJSEditorField
        locatorFactory="flowModel.step"
        surfaceStyle="render"
        value={{ code: 'return 1;', version: 'v2' }}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText('// Use return to output value'), {
      target: {
        value: 'return 3;',
      },
    });

    expect(onChange).toHaveBeenCalledWith({ code: 'return 3;', version: 'v2' });
    expect(setStepParams).not.toHaveBeenCalled();
  });

  it('preserves string-valued code field changes while syncing saved model params', () => {
    const harness = createFlowModelHarness({
      uid: 'fm_1',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return 1;',
            version: 'v2',
          },
        },
      },
    });
    const { model } = harness;
    const onChange = vi.fn();
    vi.spyOn(model, 'saveStepParams').mockResolvedValue(undefined);

    RunJSEditorRegistry.registerProvider({
      key: 'flow-model-step-provider',
      canHandle: (props) => props.locator?.kind === 'flowModel.step',
      renderEditor: (props) => (
        <button type="button" onClick={() => props.onChange?.({ code: 'return 4;', version: 'v2' })}>
          {props.value.code}
        </button>
      ),
    });

    harness.renderEditor(
      <RunJSEditorField locatorFactory="flowModel.step" surfaceStyle="action" value="return 1;" onChange={onChange} />,
      { code: 'return 1;', version: 'v2' },
    );

    fireEvent.click(screen.getByRole('button', { name: 'return 1;' }));

    expect(onChange).toHaveBeenCalledWith('return 4;');
    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      code: 'return 4;',
      version: 'v2',
    });
  });
});
