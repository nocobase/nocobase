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

  it('generates flowModel.step locators from flow settings context and syncs published values locally', async () => {
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

  it('uses current settings form values when a RunJS Studio publish syncs the model', async () => {
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
        publishedCommitId: 'commit_old',
        entry: 'src/client/index.tsx',
      },
      version: 'v2',
    }));
    const saveStepParams = vi.spyOn(model, 'saveStepParams').mockResolvedValue(undefined);
    vi.spyOn(model, 'rerender').mockResolvedValue(undefined);

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
                publishedCommitId: 'commit_new',
                entry: 'src/client/index.tsx',
              },
              version: 'v2',
            };
            props.onChange?.(nextValue);
          }}
        >
          publish
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
                publishedCommitId: 'commit_old',
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

    fireEvent.click(screen.getByRole('button', { name: 'publish' }));

    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      code: 'ctx.render(1111);',
      sourceBinding: { type: 'light-extension-entry' },
      sourceMode: 'inline',
      sourceRef: {
        type: 'vsc-file',
        repoId: 'repo_new',
        publishedCommitId: 'commit_new',
        entry: 'src/client/index.tsx',
      },
      version: 'v2',
    });
    await waitFor(() => {
      expect(saveStepParams).toHaveBeenCalledTimes(1);
    });
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

  it('preserves string-valued code field changes while syncing published model params', () => {
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
