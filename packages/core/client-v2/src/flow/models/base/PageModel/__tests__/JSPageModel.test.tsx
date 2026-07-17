/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { act, render, screen, waitFor } from '@testing-library/react';
import { FlowEngine, FlowEngineProvider, type FlowModel } from '@nocobase/flow-engine';
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

    act(() => rendered.unmount());
    await waitFor(() => expect(host.childElementCount).toBe(0));
  });
});
