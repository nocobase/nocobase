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
import { setupRunJSTestHosts } from '@nocobase/test/client-v2';
import {
  createViewScopedEngine,
  FlowContextProvider,
  FlowEngine,
  FlowModel,
  FlowRuntimeContext,
  FlowStepContext,
} from '@nocobase/flow-engine';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RunJSEditorField, RunJSEditorRegistry, type RunJSSourceLocator } from '../runjs-studio';

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

setupRunJSTestHosts();

describe('RunJSEditorField FlowModel integration', () => {
  afterEach(() => {
    RunJSEditorRegistry.clear();
    vi.useRealTimers();
  });

  it('generates flowModel.step locators from flow settings context and syncs saved values locally', async () => {
    const harness = createFlowModelHarness();
    const { model } = harness;
    const onChange = vi.fn();
    const saveStepParams = vi.spyOn(model, 'saveStepParams').mockResolvedValue(undefined);
    let capturedLocator: unknown;

    RunJSEditorRegistry.registerProvider({
      key: 'flow-model-step-provider',
      canHandle: (props) => props.locator?.kind === 'flowModel.step',
      renderEditor: (props) => {
        capturedLocator = props.locator;
        return (
          <button
            type="button"
            onClick={() =>
              props.onChange?.({
                code: 'return 2;',
                version: 'v2',
                sourceRef: {
                  type: 'vsc-file',
                  repoId: 'repo-2',
                  commitId: 'commit-2',
                  entry: 'src/client/index.tsx',
                },
              })
            }
          >
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

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'return 2;',
        version: 'v2',
        sourceRef: expect.objectContaining({ repoId: 'repo-2', commitId: 'commit-2' }),
      }),
    );
    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      code: 'return 2;',
      version: 'v2',
      sourceRef: { repoId: 'repo-2', commitId: 'commit-2' },
    });
    await waitFor(() => {
      expect(saveStepParams).toHaveBeenCalled();
    });
  });

  it('syncs a server-persisted RunJS Studio save locally without saving the FlowModel again', async () => {
    const harness = createFlowModelHarness({
      uid: 'fm_1',
      stepParams: {
        jsSettings: {
          runJs: {
            code: 'ctx.render("remote");',
            sourceBinding: {
              type: 'js-template-entry',
              projectId: 'jtp_1',
              templateId: 'jtt_1',
              kind: 'js-block',
            },
            sourceMode: 'js-template',
            version: 'v2',
          },
        },
      },
    });
    const { flowContext, model } = harness;
    flowContext.defineMethod('getStepFormValues', () => ({
      code: 'ctx.render("remote");',
      sourceBinding: {
        type: 'js-template-entry',
        projectId: 'jtp_1',
        templateId: 'jtt_1',
        kind: 'js-block',
      },
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
        sourceBinding: {
          type: 'js-template-entry',
          projectId: 'jtp_1',
          templateId: 'jtt_1',
          kind: 'js-block',
        },
        sourceMode: 'js-template',
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
      sourceBinding: {
        type: 'js-template-entry',
        projectId: 'jtp_1',
        templateId: 'jtt_1',
        kind: 'js-block',
      },
      sourceMode: 'inline',
      sourceRef: {
        type: 'vsc-file',
        repoId: 'repo_new',
        commitId: 'commit_new',
        entry: 'src/client/index.tsx',
      },
      version: 'v2',
    });
    expect(saveStepParams).not.toHaveBeenCalled();
  });

  it('syncs a server-persisted source transition to the page model behind a settings view', async () => {
    const rootEngine = new FlowEngine();
    const settingsEngine = createViewScopedEngine(rootEngine);
    const initialValue = {
      code: 'ctx.render("remote");',
      sourceBinding: {
        type: 'js-template-entry',
        projectId: 'jtp_1',
        templateId: 'jtt_1',
        kind: 'js-block',
      },
      sourceMode: 'js-template',
      version: 'v2',
    };
    const pageModel = rootEngine.createModel<FlowModel>({
      use: 'FlowModel',
      uid: 'fm_scoped_detach_inline',
      stepParams: { jsSettings: { runJs: initialValue } },
    });
    const settingsModel = settingsEngine.createModel<FlowModel>({
      use: 'FlowModel',
      uid: pageModel.uid,
      stepParams: { jsSettings: { runJs: initialValue } },
    });
    const flowContext = new FlowRuntimeContext(settingsModel, 'jsSettings', 'settings');
    flowContext.defineMethod('getStepFormValues', () => initialValue);
    let persistedChange: Promise<void> | undefined;

    RunJSEditorRegistry.registerProvider({
      key: 'scoped-detach-inline-provider',
      canHandle: (props) => props.locator?.kind === 'flowModel.step',
      renderEditor: (props) => (
        <button
          type="button"
          onClick={() => {
            persistedChange = Promise.resolve(
              props.onPersistedChange?.({
                code: 'ctx.render("inline");',
                sourceMode: 'inline',
                sourceBinding: undefined,
                sourceRef: {
                  type: 'vsc-file',
                  repoId: 'runjs_repo_1',
                  commitId: 'runjs_commit_1',
                  entry: 'src/client/index.tsx',
                },
                version: 'v2',
              }),
            );
          }}
        >
          detach inline
        </button>
      ),
    });

    render(
      <FlowContextProvider context={flowContext}>
        <FlowStepContext.Provider value={{ params: initialValue, path: `${settingsModel.uid}_jsSettings_runJs` }}>
          <RunJSEditorField locatorFactory="flowModel.step" surfaceStyle="render" value={initialValue.code} />
        </FlowStepContext.Provider>
      </FlowContextProvider>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'detach inline' }));
    await persistedChange;

    expect(pageModel.getStepParams('jsSettings', 'runJs')).toMatchObject({
      code: 'ctx.render("inline");',
      sourceMode: 'inline',
      sourceRef: {
        repoId: 'runjs_repo_1',
        commitId: 'runjs_commit_1',
      },
    });
    expect(pageModel.getStepParams('jsSettings', 'runJs').sourceBinding).toBeUndefined();
  });

  it('syncs a server-persisted external binding into FlowModel step params', async () => {
    const harness = createFlowModelHarness({
      uid: 'fm_save_as_js_template',
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
              sourceMode: 'js-template',
              sourceBinding: {
                type: 'js-template-entry',
                projectId: 'jtp_1',
                templateId: 'jtt_1',
                kind: 'js-block',
              },
              settings: { color: 'blue' },
            })
          }
        >
          save as JS template
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

    fireEvent.click(screen.getByRole('button', { name: 'save as JS template' }));

    expect(model.getStepParams('jsSettings', 'runJs')).toMatchObject({
      code: 'ctx.render(1111);',
      version: 'v2',
      sourceMode: 'js-template',
      sourceBinding: {
        type: 'js-template-entry',
        projectId: 'jtp_1',
        templateId: 'jtt_1',
        kind: 'js-block',
      },
      settings: { color: 'blue' },
    });
    expect(saveStepParams).not.toHaveBeenCalled();
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

  it('passes the explicit Dynamic Flow locator and runtime version to the Studio provider', () => {
    const harness = createFlowModelHarness('fm_dynamic');
    const dynamicLocator: RunJSSourceLocator = {
      kind: 'flowModel.flowRegistry.runjs',
      modelUid: 'fm_dynamic',
      flowKey: 'eventFlow',
      stepKey: 'runJs',
      sourcePath: ['defaultParams', 'code'],
    };
    let received: { locator?: RunJSSourceLocator; version?: string } = {};

    RunJSEditorRegistry.registerProvider({
      key: 'dynamic-flow-provider',
      canHandle: (props) => props.locator?.kind === 'flowModel.flowRegistry.runjs',
      renderEditor: (props) => {
        received = { locator: props.locator, version: props.value.version };
        return <div>Dynamic Flow Studio</div>;
      },
    });

    harness.renderEditor(
      <RunJSEditorField
        sourceLocator={dynamicLocator}
        surfaceStyle="value"
        value={{ code: 'return dynamic;', version: 'v3' }}
      />,
    );

    expect(screen.getByText('Dynamic Flow Studio')).toBeInTheDocument();
    expect(received).toEqual({ locator: dynamicLocator, version: 'v3' });
  });
});
