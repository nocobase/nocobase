/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import { DATA_SOURCE_DIRTY_EVENT, FlowEngine, FlowEngineProvider, type FlowModel } from '@nocobase/flow-engine';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RunJSSettingsDescriptorProviderRegistry } from '../../../../components/runjs-source';
import { DEFAULT_JS_PAGE_CODE, JSPageModel } from '../JSPageModel';

function createEngine() {
  const engine = new FlowEngine();
  engine.registerModels({ JSPageModel });
  engine.context.defineProperty('t', {
    value: (key: string) => key,
  });
  engine.context.defineProperty('themeToken', {
    value: {
      marginBlock: 16,
      paddingLG: 24,
      paddingSM: 12,
    },
  });
  engine.context.defineProperty('view', {
    value: {
      active: true,
      inputArgs: {},
    },
  });
  engine.context.defineProperty('pageActive', {
    value: { value: true },
  });
  engine.context.defineProperty('routeRepository', {
    value: {
      getRouteBySchemaUid: () => undefined,
    },
  });
  return engine;
}

function createModel(engine: FlowEngine, stepParams?: Record<string, Record<string, Record<string, unknown>>>) {
  return engine.createModel<JSPageModel>({
    uid: 'js-page',
    use: 'JSPageModel',
    stepParams,
  });
}

function renderModel(engine: FlowEngine, model: FlowModel) {
  return render(<FlowEngineProvider engine={engine}>{model.render()}</FlowEngineProvider>);
}

describe('JSPageModel', () => {
  afterEach(() => {
    RunJSSettingsDescriptorProviderRegistry.clear();
    vi.restoreAllMocks();
  });

  it('fills missing defaults synchronously and idempotently', () => {
    const model = createModel(createEngine());

    expect(model.stepParams).toMatchObject({
      pageSettings: {
        general: {
          displayTitle: false,
          enableTabs: false,
        },
      },
      jsSettings: {
        runJs: {
          code: DEFAULT_JS_PAGE_CODE,
          version: 'v2',
          sourceMode: 'inline',
          settings: {},
        },
      },
    });

    const snapshot = JSON.parse(JSON.stringify(model.stepParams)) as typeof model.stepParams;
    model.onInit({});
    expect(model.stepParams).toEqual(snapshot);
    expect(model.supportsPageTabs()).toBe(false);
  });

  it('preserves empty code, external binding, settings and unknown siblings', () => {
    const sourceBinding = { entryId: 'entry-1' };
    const model = createModel(createEngine(), {
      pageSettings: {
        general: {
          displayTitle: true,
          customPageOption: 'keep',
        },
      },
      jsSettings: {
        runJs: {
          code: '',
          version: 'v1',
          sourceMode: 'light-extension',
          sourceBinding,
          sourceRef: 'snapshot-1',
          settings: { color: 'blue' },
          customRunOption: 'keep',
        },
      },
    });

    expect(model.getStepParams('pageSettings', 'general')).toEqual({
      displayTitle: true,
      enableTabs: false,
      customPageOption: 'keep',
    });
    expect(model.getStepParams('jsSettings', 'runJs')).toEqual({
      code: '',
      version: 'v1',
      sourceMode: 'light-extension',
      sourceBinding,
      sourceRef: 'snapshot-1',
      settings: { color: 'blue' },
      customRunOption: 'keep',
    });
  });

  it('runs after the host mounts with page, settings and source metadata', async () => {
    const engine = createEngine();
    const model = createModel(engine, {
      jsSettings: {
        runJs: {
          code: `ctx.render(JSON.stringify({
            uid: ctx.page.uid,
            active: ctx.page.active,
            settings: ctx.settings,
            sourceMode: ctx.runJsSource.sourceMode,
            sourceRef: ctx.runJsSource.sourceRef,
          }))`,
          version: 'v2',
          sourceMode: 'inline',
          sourceRef: 'source-1',
          settings: { color: 'blue' },
        },
      },
    });

    renderModel(engine, model);

    const host = screen.getByLabelText('JavaScript page content');
    await waitFor(() => expect(host.textContent).toContain('source-1'));
    expect(JSON.parse(host.textContent || '{}')).toEqual({
      uid: 'js-page',
      active: true,
      settings: { color: 'blue' },
      sourceMode: 'inline',
      sourceRef: 'source-1',
    });
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
    expect(screen.queryByText('Add tab')).not.toBeInTheDocument();
  });

  it('merges inline descriptor defaults into ctx.settings without replacing falsy overrides', async () => {
    RunJSSettingsDescriptorProviderRegistry.registerProvider({
      key: 'inline-page-settings-test',
      canHandle: () => true,
      getSettingsDescriptor: async () => ({
        entryId: 'inline:repo-page:settings',
        settingsSchemaHash: 'schema-1',
        defaults: { enabled: true, count: 5, label: 'Default', tone: 'blue' },
        schema: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean' },
            count: { type: 'integer' },
            label: { type: 'string' },
            tone: { type: 'string' },
          },
        },
      }),
    });
    const engine = createEngine();
    const model = createModel(engine, {
      jsSettings: {
        runJs: {
          code: 'ctx.render(JSON.stringify(ctx.settings));',
          version: 'v2',
          sourceMode: 'inline',
          sourceRef: { type: 'vsc-file', repoId: 'repo-page', commitId: 'commit-1' },
          settings: { enabled: false, count: 0, label: '' },
        },
      },
    });

    renderModel(engine, model);

    const host = screen.getByLabelText('JavaScript page content');
    await waitFor(() => expect(host.textContent).toContain('tone'));
    expect(JSON.parse(host.textContent || '{}')).toEqual({ enabled: false, count: 0, label: '', tone: 'blue' });
  });

  it('renders actionable inline settings diagnostics with invalid field paths', async () => {
    RunJSSettingsDescriptorProviderRegistry.registerProvider({
      key: 'inline-page-invalid-settings-test',
      canHandle: () => true,
      getSettingsDescriptor: async () => ({
        entryId: 'inline:repo-page:invalid-settings',
        settingsSchemaHash: 'schema-invalid',
        defaults: { count: 5 },
        schema: {
          type: 'object',
          properties: {
            count: { type: 'integer' },
          },
        },
      }),
    });
    const engine = createEngine();
    const model = createModel(engine, {
      jsSettings: {
        runJs: {
          code: 'ctx.render(String(ctx.settings.count));',
          version: 'v2',
          sourceMode: 'inline',
          sourceRef: { type: 'vsc-file', repoId: 'repo-page', commitId: 'commit-1' },
          settings: { count: 'invalid' },
        },
      },
    });

    renderModel(engine, model);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Light extension settings are invalid');
    expect(alert).toHaveTextContent('Open the page settings and fix the light extension settings.');
    expect(alert).toHaveTextContent('Fields: count');
  });

  it('clears stale content on failure and disposes the runtime root on unmount', async () => {
    const engine = createEngine();
    const model = createModel(engine, {
      jsSettings: {
        runJs: {
          code: 'ctx.render("old")',
        },
      },
    });
    const rendered = renderModel(engine, model);

    const host = screen.getByLabelText('JavaScript page content');
    await waitFor(() => expect(host).toHaveTextContent('old'));
    model.setStepParams('jsSettings', 'runJs', { code: 'throw new Error("broken page")' });
    await act(async () => {
      await model.rerender();
    });

    expect(await screen.findByRole('alert')).toHaveTextContent('broken page');
    expect(host).not.toHaveTextContent('old');

    const openSettings = vi.spyOn(engine.flowSettings, 'open').mockResolvedValue(undefined);
    await model.openFlowSettings({ flowKey: 'jsSettings', stepKey: 'runJs' });
    expect(openSettings).toHaveBeenCalledWith({ model, flowKey: 'jsSettings', stepKey: 'runJs' });

    act(() => rendered.unmount());
    await waitFor(() => expect(host.childElementCount).toBe(0));
  });

  it('reruns on activation and dirty events while preserving inactive content', async () => {
    const engine = createEngine();
    const model = createModel(engine, { jsSettings: { runJs: { code: 'ctx.render("first")' } } });
    renderModel(engine, model);
    const host = screen.getByLabelText('JavaScript page content');
    await waitFor(() => expect(host).toHaveTextContent('first'));

    model.setStepParams('jsSettings', 'runJs', { code: 'ctx.render("activated")' });
    await act(async () => {
      model.activateCurrentTab();
      await Promise.resolve();
    });
    await waitFor(() => expect(host).toHaveTextContent('activated'));

    model.setStepParams('jsSettings', 'runJs', { code: 'ctx.render("dirty")' });
    act(() => engine.emitter.emit(DATA_SOURCE_DIRTY_EVENT, { dataSourceKey: 'main', resourceNames: ['posts'] }));
    await waitFor(() => expect(host).toHaveTextContent('dirty'));

    act(() => {
      model.context.pageActive.value = false;
      model.deactivateCurrentTab();
    });
    expect(host).toHaveTextContent('dirty');
    model.setStepParams('jsSettings', 'runJs', { code: 'ctx.render("inactive")' });
    await act(async () => {
      model.activateCurrentTab();
      await Promise.resolve();
    });
    expect(host).toHaveTextContent('dirty');

    await act(async () => {
      model.context.pageActive.value = true;
      model.activateCurrentTab();
      await Promise.resolve();
    });
    await waitFor(() => expect(host).toHaveTextContent('inactive'));
  });
});
