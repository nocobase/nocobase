/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react-hooks';
import { render, waitFor } from '@testing-library/react';
import { App, ConfigProvider } from 'antd';
import { useCodeRunner } from '../hooks/useCodeRunner';
import {
  FlowEngine,
  FlowModel,
  FlowEngineProvider,
  FlowModelRenderer,
  ElementProxy,
  createSafeWindow,
  createSafeDocument,
} from '@nocobase/flow-engine';
import { JSEditableFieldModel } from '../../../models/fields/JSEditableFieldModel';

// Minimal beforeRender event model that executes preview code
class DummyJsAutoModel extends FlowModel {
  render() {
    return <span data-testid={`dummy-${this.uid}`} ref={this.context.ref as any} />;
  }
}

describe('useCodeRunner (beforeRender)', () => {
  it('logs success and captures console output', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ DummyJsAutoModel });
    const model = engine.createModel<DummyJsAutoModel>({ use: 'DummyJsAutoModel', uid: 'm-run' });
    model.registerFlow('jsSettings', {
      steps: {
        runJs: {
          useRawParams: true,
          async handler(ctx) {
            const code = ctx?.inputArgs?.preview?.code || '';
            return ctx.runjs(code, undefined, { preprocessTemplates: true });
          },
        },
      },
    });

    const { result } = renderHook(() => useCodeRunner(model.context, 'v1'));

    await act(async () => {
      await result.current.run('console.log("hello"); return 1');
    });

    expect(result.current.logs.some((l) => l.msg?.includes('Execution succeeded'))).toBe(true);
    expect(result.current.logs.some((l) => l.level === 'log' && l.msg.includes('hello'))).toBe(true);
    expect(result.current.running).toBe(false);
  });

  it('captures ctx.logger output into logs panel', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ DummyJsAutoModel });
    const model = engine.createModel<DummyJsAutoModel>({ use: 'DummyJsAutoModel', uid: 'm-logger' });
    model.registerFlow('jsSettings', {
      steps: {
        runJs: {
          useRawParams: true,
          async handler(ctx) {
            const code = ctx?.inputArgs?.preview?.code || '';
            return ctx.runjs(code, undefined, { preprocessTemplates: true });
          },
        },
      },
    });

    const { result } = renderHook(() => useCodeRunner(model.context, 'v1'));

    await act(async () => {
      await result.current.run('ctx.logger.info("hello-logger"); return 1');
    });

    expect(result.current.logs.some((l) => l.level === 'info' && l.msg.includes('hello-logger'))).toBe(true);
  });

  it('logs error message on failure', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ DummyJsAutoModel });
    const model = engine.createModel<DummyJsAutoModel>({ use: 'DummyJsAutoModel', uid: 'm-err' });
    model.registerFlow('jsSettings', {
      steps: {
        runJs: {
          useRawParams: true,
          async handler(ctx) {
            const code = ctx?.inputArgs?.preview?.code || '';
            return ctx.runjs(code, undefined, { preprocessTemplates: true });
          },
        },
      },
    });

    const { result } = renderHook(() => useCodeRunner(model.context, 'v1'));
    await act(async () => {
      await result.current.run('throw new Error("boom")');
    });

    expect(result.current.logs.some((l) => l.level === 'error' && /boom/i.test(l.msg))).toBe(true);
    expect(result.current.running).toBe(false);
  });

  it('previews and updates DOM for JSEditable (beforeRender)', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ JSEditableFieldModel });
    const field = engine.createModel<JSEditableFieldModel>({ use: 'JSEditableFieldModel', uid: 'f1' });
    field.setProps('value', 'INIT');

    render(
      <ConfigProvider>
        <App>
          <FlowEngineProvider engine={engine}>
            <FlowModelRenderer model={field} />
          </FlowEngineProvider>
        </App>
      </ConfigProvider>,
    );

    const { result } = renderHook(() => useCodeRunner(field.context, 'v1'));
    await act(async () => {
      await result.current.run(
        'ctx.element.innerHTML = `<span id="out">${ctx.getValue ? ctx.getValue() : "NO"}</span>`; ctx.setValue && ctx.setValue("NEW");',
      );
    });

    await waitFor(() => {
      const text = document.querySelector('#out')?.textContent;
      expect(text === 'INIT' || text === 'NEW').toBe(true);
    });
    expect(field.getProps().value).toBe('NEW');
  });

  it('previews on a forked view updates the fork DOM', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ DummyJsAutoModel });
    const master = engine.createModel<DummyJsAutoModel>({ use: 'DummyJsAutoModel', uid: 'm2' });
    master.registerFlow('jsSettings', {
      steps: {
        runJs: {
          useRawParams: true,
          async handler(ctx) {
            const code = ctx?.inputArgs?.preview?.code || '';
            ctx.onRefReady(ctx.ref, async (el) => {
              ctx.defineProperty('element', { get: () => new ElementProxy(el as any) });
              await ctx.runjs(
                code,
                { window: createSafeWindow(), document: createSafeDocument() },
                { preprocessTemplates: true },
              );
            });
          },
        },
      },
    });
    const fork = master.createFork({}, 'row-1');

    render(
      <ConfigProvider>
        <App>
          <FlowEngineProvider engine={engine}>
            <>
              <FlowModelRenderer model={master} />
              <FlowModelRenderer model={fork as any} />
            </>
          </FlowEngineProvider>
        </App>
      </ConfigProvider>,
    );

    // ensure both master and fork containers are mounted
    await waitFor(() => {
      const nodes = document.querySelectorAll('[data-testid="dummy-m2"]');
      expect(nodes.length).toBeGreaterThanOrEqual(2);
    });
    const { result } = renderHook(() => useCodeRunner(master.context, 'v1'));
    await act(async () => {
      await result.current.run('ctx.element.setAttribute("data-preview", "FORKED")');
    });

    await waitFor(() => {
      const nodes = Array.from(document.querySelectorAll('[data-testid="dummy-m2"]')) as HTMLElement[];
      expect(nodes.some((el) => el.getAttribute('data-preview') === 'FORKED')).toBe(true);
    });
  });

  it('compiles JSX in preview and renders antd Input without syntax error', async () => {
    const engine = new FlowEngine();
    engine.registerModels({ DummyJsAutoModel });
    const model = engine.createModel<DummyJsAutoModel>({ use: 'DummyJsAutoModel', uid: 'm-jsx' });
    // beforeRender-like flow that binds ctx.element and runs preview code
    model.registerFlow('jsSettings', {
      steps: {
        runJs: {
          useRawParams: true,
          async handler(ctx) {
            const code = ctx?.inputArgs?.preview?.code || '';
            ctx.onRefReady(ctx.ref, async (el) => {
              ctx.defineProperty('element', { get: () => new ElementProxy(el as any) });
              const navigator = { userAgent: 'test' } as any;
              await ctx.runjs(
                code,
                {
                  window: createSafeWindow({ navigator }),
                  document: createSafeDocument(),
                  navigator,
                },
                { preprocessTemplates: true },
              );
            });
          },
        },
      },
    });

    render(
      <ConfigProvider>
        <App>
          <FlowEngineProvider engine={engine}>
            <FlowModelRenderer model={model} />
          </FlowEngineProvider>
        </App>
      </ConfigProvider>,
    );

    const { result } = renderHook(() => useCodeRunner(model.context, 'v1'));

    const jsxCode = `
function JsReadonlyField() {
  const React = ctx.React;
  const { Input } = ctx.antd;
  return (
    <Input
      value={String(ctx.value ?? '')}
      disabled
      readOnly
      style={{ width: '100%' }}
    />
  );
}
ctx.render(<JsReadonlyField />);
`;

    await act(async () => {
      // Simulate settings form: step params store user's original source (JSX)
      model.setStepParams('jsSettings', 'runJs', { code: jsxCode, version: 'v1' });
      await result.current.run(jsxCode);
    });

    // Should not rewrite user's source code into compiled output (e.g. ctx.React.createElement)
    const saved = model.getStepParams('jsSettings', 'runJs')?.code;
    expect(saved).toContain('<Input');
    expect(saved).not.toContain('ctx.React.createElement');

    // Should succeed and render antd input into the model container
    await waitFor(() => {
      expect(result.current.logs.some((l) => l.msg?.includes('Execution succeeded'))).toBe(true);
    });
    await waitFor(() => {
      // Antd input element should be present
      const el = document.querySelector('.ant-input');
      expect(el).toBeTruthy();
    });
  });
});
