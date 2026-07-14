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

describe('RunJSEditorRegistry', () => {
  afterEach(() => {
    RunJSEditorRegistry.clear();
  });

  it('falls back to the inline RunJS editor when no provider is registered', () => {
    const onChange = vi.fn();

    render(<RunJSEditorField value={{ code: 'return 1;', version: 'v2' }} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText('// Use return to output value'), {
      target: {
        value: 'return 2;',
      },
    });

    expect(onChange).toHaveBeenCalledWith({
      code: 'return 2;',
      version: 'v2',
    });
  });

  it('uses the latest registered provider that can handle the source locator', () => {
    RunJSEditorRegistry.registerProvider({
      key: 'fallback-provider',
      renderEditor: () => <div>fallback provider</div>,
    });
    RunJSEditorRegistry.registerProvider({
      key: 'flow-step-provider',
      canHandle: (props) => props.locator?.kind === 'flowModel.step',
      renderEditor: (props) => <button type="button">{props.label || props.locator?.kind}</button>,
    });

    render(
      <RunJSEditorField
        label="Write JavaScript"
        locator={{
          kind: 'flowModel.step',
          modelUid: 'fm_1',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        }}
        value={{ code: 'return ctx;', version: 'v2' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Write JavaScript' })).toBeInTheDocument();
    expect(screen.queryByText('fallback provider')).toBeNull();
  });

  it('uses provider priority before registration order', () => {
    RunJSEditorRegistry.registerProvider({
      key: 'specialized-provider',
      priority: 100,
      canHandle: (props) => props.locator?.kind === 'flowModel.nestedRunJS',
      renderEditor: () => <div>specialized provider</div>,
    });
    RunJSEditorRegistry.registerProvider({
      key: 'generic-provider',
      canHandle: (props) => Boolean(props.locator),
      renderEditor: () => <div>generic provider</div>,
    });

    expect(RunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      'specialized-provider',
      'generic-provider',
    ]);

    render(
      <RunJSEditorField
        locator={{
          kind: 'flowModel.nestedRunJS',
          modelUid: 'fm_1',
          containerFlowKey: 'settings',
          containerStepKey: 'rules',
          valuePath: ['value', 'rule_1', 'value'],
          scene: 'formValue',
        }}
        value={{ code: 'return ctx;', version: 'v2' }}
      />,
    );

    expect(screen.getByText('specialized provider')).toBeInTheDocument();
    expect(screen.queryByText('generic provider')).toBeNull();
  });

  it('lets a specialized provider compose the next matching provider', () => {
    RunJSEditorRegistry.registerProvider({
      key: 'wrapper-provider',
      priority: 100,
      canHandle: (props) => props.locator?.kind === 'flowModel.nestedRunJS',
      renderEditor: (props) => (
        <section aria-label="wrapper provider">
          <span>wrapper provider</span>
          {props.renderNext?.()}
        </section>
      ),
    });
    RunJSEditorRegistry.registerProvider({
      key: 'workspace-provider',
      canHandle: (props) => Boolean(props.locator),
      renderEditor: () => <div>workspace provider</div>,
    });

    render(
      <RunJSEditorField
        locator={{
          kind: 'flowModel.nestedRunJS',
          modelUid: 'fm_1',
          containerFlowKey: 'settings',
          containerStepKey: 'rules',
          valuePath: ['value', 'rule_1', 'value'],
          scene: 'formValue',
        }}
        value={{ code: 'return ctx;', version: 'v2' }}
      />,
    );

    expect(screen.getByText('wrapper provider')).toBeInTheDocument();
    expect(screen.getByText('workspace provider')).toBeInTheDocument();
  });

  it('re-evaluates downstream providers after renderNext overrides', () => {
    RunJSEditorRegistry.registerProvider({
      key: 'locator-wrapper',
      priority: 100,
      canHandle: (props) => props.locator?.kind === 'flowModel.step',
      renderEditor: (props) => (
        <section aria-label="locator wrapper">
          locator wrapper
          {props.renderNext?.({
            locator: {
              kind: 'chart.option',
              modelUid: 'chart_1',
            },
          })}
        </section>
      ),
    });
    RunJSEditorRegistry.registerProvider({
      key: 'step-provider',
      canHandle: (props) => props.locator?.kind === 'flowModel.step',
      renderEditor: () => <div>step provider</div>,
    });

    render(
      <RunJSEditorField
        locator={{
          kind: 'flowModel.step',
          modelUid: 'fm_1',
          flowKey: 'settings',
          stepKey: 'runjs',
          paramPath: ['code'],
        }}
        value={{ code: 'return ctx;', version: 'v2' }}
      />,
    );

    expect(screen.getByLabelText('locator wrapper')).toBeInTheDocument();
    expect(screen.queryByText('step provider')).toBeNull();
    expect(screen.getByLabelText('// Use return to output value')).toBeInTheDocument();
  });

  it('normalizes sourceLocator and sourceLabel aliases before provider selection', () => {
    RunJSEditorRegistry.registerProvider({
      key: 'source-locator-provider',
      canHandle: (props) => props.locator?.kind === 'flowModel.nestedRunJS',
      renderEditor: (props) => <button type="button">{props.label || props.locator?.kind}</button>,
    });

    render(
      <RunJSEditorField
        sourceLabel="Rule value"
        sourceLocator={{
          kind: 'flowModel.nestedRunJS',
          modelUid: 'fm_1',
          containerFlowKey: 'settings',
          containerStepKey: 'rules',
          valuePath: ['value', 'rule_1', 'value'],
          scene: 'formValue',
        }}
        value={{ code: 'return ctx;', version: 'v2' }}
      />,
    );

    expect(screen.getByRole('button', { name: 'Rule value' })).toBeInTheDocument();
  });

  it('removes a provider with the unregister callback', () => {
    const unregister = RunJSEditorRegistry.registerProvider({
      key: 'temporary',
      renderEditor: () => <div>temporary provider</div>,
    });

    unregister();

    render(<RunJSEditorField value={{ code: '', version: 'v2' }} />);

    expect(screen.queryByText('temporary provider')).toBeNull();
    expect(screen.getByLabelText('// Use return to output value')).toBeInTheDocument();
  });

  it('generates flowModel.step locators from flow settings context and syncs saved values locally', async () => {
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'fm_1', flowEngine: engine });
    const flowContext = new FlowRuntimeContext(model, 'jsSettings', 'settings');
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

    render(
      <FlowContextProvider context={flowContext}>
        <FlowStepContext.Provider value={{ params: {}, path: 'fm_1_jsSettings_runJs' }}>
          <RunJSEditorField
            locatorFactory="flowModel.step"
            surfaceStyle="render"
            value={{ code: 'return 1;', version: 'v2' }}
            onChange={onChange}
          />
        </FlowStepContext.Provider>
      </FlowContextProvider>,
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

  it('passes sibling light extension binding params to flowModel step editor providers', () => {
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'fm_1', flowEngine: engine });
    const flowContext = new FlowRuntimeContext(model, 'jsSettings', 'settings');
    let capturedValue: unknown;

    RunJSEditorRegistry.registerProvider({
      key: 'light-extension-provider',
      canHandle: (props) => props.value.sourceMode === 'light-extension',
      renderEditor: (props) => {
        capturedValue = props.value;
        return <div>light extension workspace</div>;
      },
    });

    render(
      <FlowContextProvider context={flowContext}>
        <FlowStepContext.Provider
          value={{
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
            path: 'fm_1_jsSettings_runJs',
          }}
        >
          <RunJSEditorField locatorFactory="flowModel.step" surfaceStyle="render" value="ctx.render(<div />);" />
        </FlowStepContext.Provider>
      </FlowContextProvider>,
    );

    expect(screen.getByText('light extension workspace')).toBeInTheDocument();
    expect(capturedValue).toMatchObject({
      sourceMode: 'light-extension',
      sourceBinding: {
        repoId: 'ler_example',
        entryId: 'lee_example',
      },
      settings: { title: 'Example' },
    });
  });

  it('does not generate or sync unsafe FlowModel step paths', () => {
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'fm_1', flowEngine: engine });
    const flowContext = new FlowRuntimeContext(model, 'jsSettings', 'settings');
    const setStepParams = vi.spyOn(model, 'setStepParams');
    let capturedLocator: unknown;

    RunJSEditorRegistry.registerProvider({
      key: 'unsafe-path-provider',
      renderEditor: (props) => {
        capturedLocator = props.locator;
        return (
          <button type="button" onClick={() => props.onChange?.({ code: 'polluted', version: 'v2' })}>
            save
          </button>
        );
      },
    });

    render(
      <FlowContextProvider context={flowContext}>
        <FlowStepContext.Provider value={{ params: {}, path: 'fm_1_jsSettings_runJs' }}>
          <RunJSEditorField
            locatorFactory="flowModel.step"
            paramPath={['__proto__', 'polluted']}
            value={{ code: 'return 1;', version: 'v2' }}
          />
        </FlowStepContext.Provider>
      </FlowContextProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    expect(capturedLocator).toBeUndefined();
    expect(setStepParams).not.toHaveBeenCalled();
  });

  it.each([
    ['flow key', { flowKey: '__proto__' }],
    ['step key', { stepKey: 'constructor' }],
  ] as const)('does not generate locators with an unsafe %s', (_label, unsafeProps) => {
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'fm_1', flowEngine: engine });
    const flowContext = new FlowRuntimeContext(model, 'jsSettings', 'settings');
    const setStepParams = vi.spyOn(model, 'setStepParams');
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

    render(
      <FlowContextProvider context={flowContext}>
        <FlowStepContext.Provider value={{ params: {}, path: 'fm_1_jsSettings_runJs' }}>
          <RunJSEditorField
            locatorFactory="flowModel.step"
            value={{ code: 'return 1;', version: 'v2' }}
            {...unsafeProps}
          />
        </FlowStepContext.Provider>
      </FlowContextProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'save' }));

    expect(capturedLocator).toBeUndefined();
    expect(setStepParams).not.toHaveBeenCalled();
  });

  it('syncs a server-persisted RunJS Studio save locally without saving the FlowModel again', async () => {
    const engine = new FlowEngine();
    const model = new FlowModel({
      uid: 'fm_1',
      flowEngine: engine,
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
    const flowContext = new FlowRuntimeContext(model, 'jsSettings', 'settings');
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

    render(
      <FlowContextProvider context={flowContext}>
        <FlowStepContext.Provider
          value={{
            params: {
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
            path: 'fm_1_jsSettings_runJs',
          }}
        >
          <RunJSEditorField locatorFactory="flowModel.step" surfaceStyle="render" value="ctx.render(1111);" />
        </FlowStepContext.Provider>
      </FlowContextProvider>,
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
    await waitFor(() => {
      expect(rerender).toHaveBeenCalledTimes(1);
    });
    expect(saveStepParams).not.toHaveBeenCalled();
  });

  it('syncs a server-persisted external binding into FlowModel step params', async () => {
    const engine = new FlowEngine();
    const model = new FlowModel({
      uid: 'fm_move_source',
      flowEngine: engine,
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("inline fallback");',
            version: 'v2',
          },
        },
      },
    });
    const flowContext = new FlowRuntimeContext(model, 'jsSettings', 'settings');
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

    render(
      <FlowContextProvider context={flowContext}>
        <FlowStepContext.Provider
          value={{
            params: {
              code: 'ctx.render("inline fallback");',
              version: 'v2',
            },
            path: 'fm_move_source_jsSettings_runJs',
          }}
        >
          <RunJSEditorField locatorFactory="flowModel.step" surfaceStyle="render" value="ctx.render(1111);" />
        </FlowStepContext.Provider>
      </FlowContextProvider>,
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

  it('notifies settings surfaces when an external source save keeps the same binding', () => {
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
    const siblingModel = engine.createModel<FlowModel>({ use: 'FlowModel', uid: 'fm_external_source_sibling' });
    const flowContext = new FlowRuntimeContext(model, 'jsSettings', 'settings');
    flowContext.defineMethod('getStepFormValues', () => persistedValue);
    const emit = vi.spyOn(model.emitter, 'emit');
    const siblingEmit = vi.spyOn(siblingModel.emitter, 'emit');

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

    expect(emit.mock.calls.filter(([event]) => event === 'onStepParamsChanged')).toHaveLength(1);
    expect(siblingEmit.mock.calls.filter(([event]) => event === 'onStepParamsChanged')).toHaveLength(1);
    expect(model.getStepParams('jsSettings', 'runJs')).toEqual(persistedValue);
  });

  it('keeps inline fallback edits in the form without mutating model params', () => {
    const engine = new FlowEngine();
    const model = new FlowModel({ uid: 'fm_1', flowEngine: engine });
    const flowContext = new FlowRuntimeContext(model, 'jsSettings', 'settings');
    const onChange = vi.fn();
    const setStepParams = vi.spyOn(model, 'setStepParams');

    render(
      <FlowContextProvider context={flowContext}>
        <FlowStepContext.Provider value={{ params: {}, path: 'fm_1_jsSettings_runJs' }}>
          <RunJSEditorField
            locatorFactory="flowModel.step"
            surfaceStyle="render"
            value={{ code: 'return 1;', version: 'v2' }}
            onChange={onChange}
          />
        </FlowStepContext.Provider>
      </FlowContextProvider>,
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
    const engine = new FlowEngine();
    const model = new FlowModel({
      uid: 'fm_1',
      flowEngine: engine,
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'return 1;',
            version: 'v2',
          },
        },
      },
    });
    const flowContext = new FlowRuntimeContext(model, 'jsSettings', 'settings');
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

    render(
      <FlowContextProvider context={flowContext}>
        <FlowStepContext.Provider
          value={{ params: { code: 'return 1;', version: 'v2' }, path: 'fm_1_jsSettings_runJs' }}
        >
          <RunJSEditorField
            locatorFactory="flowModel.step"
            surfaceStyle="action"
            value="return 1;"
            onChange={onChange}
          />
        </FlowStepContext.Provider>
      </FlowContextProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'return 1;' }));

    expect(onChange).toHaveBeenCalledWith('return 4;');
    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      code: 'return 4;',
      version: 'v2',
    });
  });
});
