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
import {
  createRunJSHostPreviewSession,
  getActiveRunJSHostPreviewSessionCount,
} from '../../../../components/runjs-source';
import { DEFAULT_JS_PAGE_CODE, JSPageModel } from '../JSPageModel';

const HOST_PREVIEW_SOURCE_MAP = JSON.stringify({
  version: 1,
  kind: 'runjs-line-map',
  sourceURL: 'nocobase-runjs://bundle/js-page-host-preview.js',
  entryPath: 'src/client/js-pages/example/index.tsx',
  generatedCodeLineOffset: 2,
  mappings: [
    {
      generatedLine: 1,
      source: 'src/client/js-pages/example/index.tsx',
      sourceLine: 1,
    },
  ],
});

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

  it('propagates one host preview execution reporter to the JS Page runtime', async () => {
    const report = vi.fn();
    const session = createRunJSHostPreviewSession({
      artifactHash: 'b'.repeat(64),
      snapshotId: 'snapshot-js-page',
      sourceMap: HOST_PREVIEW_SOURCE_MAP,
      reporter: { report },
    });
    const engine = createEngine();
    const model = createModel(engine, {
      jsSettings: {
        runJs: {
          code: 'throw new Error("js page preview failed")',
          version: 'v2',
          sourceMode: 'inline',
          sourceRef: session.sourceRef,
        },
      },
    });

    renderModel(engine, model);

    await waitFor(() => expect(report).toHaveBeenCalledTimes(1));
    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({
        identity: expect.objectContaining({
          executionId: session.sourceRef.executionId,
          artifactHash: session.sourceRef.artifactHash,
          sourceURL: session.sourceRef.sourceURL,
        }),
        issue: expect.objectContaining({ ruleId: 'promise-rejection' }),
      }),
    );
    session.close();
    expect(getActiveRunJSHostPreviewSessionCount()).toBe(0);
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
