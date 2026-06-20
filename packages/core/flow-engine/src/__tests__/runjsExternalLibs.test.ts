/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { observable } from '@formily/reactive';

vi.mock('../utils/runjsModuleLoader', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../utils/runjsModuleLoader')>();
  return {
    ...actual,
    runjsImportAsync: vi.fn(),
    runjsRequireAsync: vi.fn(),
  };
});

import { runjsImportAsync } from '../utils/runjsModuleLoader';
import { FlowEngine, FlowRunJSContext } from '..';
import { externalReactRender } from '../runjsLibs';

function newEngine(): FlowEngine {
  const engine = new FlowEngine();
  // 提供最小 api，避免 ctx.auth getter 在打印对象时抛错
  engine.context.defineProperty('api', { value: { auth: { role: 'guest', locale: 'zh-CN', token: '' } } });
  return engine;
}

beforeEach(() => {
  (globalThis as any).__nocobaseImportAsyncCache = undefined;
  (globalThis as any).__nbRunjsRoots = undefined;
  (runjsImportAsync as any).mockReset();

  if (typeof window !== 'undefined') {
    (window as any).__esm_cdn_base_url__ = 'https://esm.sh';
    (window as any).__esm_cdn_suffix__ = '';
  }
});

describe('RunJS external libs', () => {
  it('should override ctx.React/ReactDOM when importing external react', async () => {
    const engine = newEngine();
    const ctx = new FlowRunJSContext(engine.context);

    const fakeReact = { createElement: vi.fn(), Fragment: Symbol('Fragment') };
    const fakeReactDOM = { createRoot: vi.fn(() => ({ render: vi.fn(), unmount: vi.fn() })) };

    (runjsImportAsync as any).mockImplementation(async (url: string) => {
      if (url === 'https://esm.sh/react@18.2.0') return fakeReact;
      if (url === 'https://esm.sh/react-dom@18.2.0/client') return fakeReactDOM;
      throw new Error(`unexpected import url: ${url}`);
    });

    await ctx.importAsync('react@18.2.0');

    expect(ctx.React).toBe(fakeReact);
    expect(ctx.libs.React).toBe(fakeReact);
    expect(ctx.ReactDOM).toBe(fakeReactDOM);
    expect(ctx.libs.ReactDOM).toBe(fakeReactDOM);

    expect(runjsImportAsync).toHaveBeenNthCalledWith(1, 'https://esm.sh/react@18.2.0');
    expect(runjsImportAsync).toHaveBeenNthCalledWith(2, 'https://esm.sh/react-dom@18.2.0/client');
  });

  it('should override ctx.antd and ctx.libs.antd when importing antd', async () => {
    const engine = newEngine();
    const ctx = new FlowRunJSContext(engine.context);

    const fakeAntd = { Button: 'Button' };

    (runjsImportAsync as any).mockImplementation(async (url: string) => {
      if (url === 'https://esm.sh/antd@5.29.3?bundle=1') return fakeAntd;
      throw new Error(`unexpected import url: ${url}`);
    });

    await ctx.importAsync('antd@5.29.3');

    expect(ctx.antd).toBe(fakeAntd);
    expect(ctx.libs.antd).toBe(fakeAntd);
  });

  it('should isolate roots by rendererKey and unmount on ReactDOM switch', () => {
    const engine = newEngine();
    const ctx = new FlowRunJSContext(engine.context);

    const root1 = { render: vi.fn(), unmount: vi.fn() };
    const root2 = { render: vi.fn(), unmount: vi.fn() };

    const renderer1 = { createRoot: vi.fn(() => root1) };
    const renderer2 = { createRoot: vi.fn(() => root2) };

    ctx.defineProperty('ReactDOM', { value: renderer1 });

    const container = document.createElement('div');

    ctx.render({ step: 1 }, container);
    ctx.render({ step: 2 }, container);

    expect(renderer1.createRoot).toHaveBeenCalledTimes(1);
    expect(root1.render).toHaveBeenCalledTimes(2);

    ctx.defineProperty('ReactDOM', { value: renderer2 });
    ctx.render({ step: 3 }, container);

    expect(root1.unmount).toHaveBeenCalledTimes(1);
    expect(renderer2.createRoot).toHaveBeenCalledTimes(1);
    expect(root2.render).toHaveBeenCalledTimes(1);
  });

  it('should not reuse roots across different ctx owners when rendererKey is the same', () => {
    const engine1 = newEngine();
    const ctx1 = new FlowRunJSContext(engine1.context);

    const engine2 = newEngine();
    const ctx2 = new FlowRunJSContext(engine2.context);

    const root1 = { render: vi.fn(), unmount: vi.fn() };
    const root2 = { render: vi.fn(), unmount: vi.fn() };

    // 两个 ctx 共享同一个 ReactDOM 实例引用（rendererKey 相同），但 owner 不同；
    // 若错误复用 entry，会导致旧 ctx 的 autorun 闭包继续持有并驱动新渲染，进而泄漏。
    const renderer = {
      createRoot: vi.fn(() => root1),
    };
    (renderer.createRoot as any).mockImplementationOnce(() => root1).mockImplementationOnce(() => root2);

    ctx1.defineProperty('ReactDOM', { value: renderer });
    ctx2.defineProperty('ReactDOM', { value: renderer });

    const container = document.createElement('div');

    ctx1.render({ step: 1 } as any, container);
    ctx2.render({ step: 2 } as any, container);

    expect(renderer.createRoot).toHaveBeenCalledTimes(2);
    expect(root1.unmount).toHaveBeenCalledTimes(1);
    expect(root2.render).toHaveBeenCalledTimes(1);
  });

  it('should wrap external antd ConfigProvider and rerender on themeToken change', async () => {
    const engine = newEngine();

    const themeState = observable.shallow({ token: { colorPrimary: 'red' } });
    engine.context.defineProperty('themeToken', {
      get: () => themeState.token,
      cache: false,
    });
    engine.context.defineProperty('antdConfig', {
      value: {
        theme: { token: { colorPrimary: 'red' } },
        prefixCls: 'ant',
      },
    });

    const ctx = new FlowRunJSContext(engine.context);

    const createElement = vi.fn((type: any, props: any, ...children: any[]) => ({ type, props, children }));
    const fakeReact = { createElement };
    const fakeAntdConfigProvider = function ConfigProvider() {};
    const fakeAntdApp = function App() {};
    const fakeAntd = { ConfigProvider: fakeAntdConfigProvider, App: fakeAntdApp };

    const root = { render: vi.fn(), unmount: vi.fn() };
    const fakeReactDOM = { createRoot: vi.fn(() => root) };

    ctx.defineProperty('React', { value: fakeReact });
    ctx.defineProperty('ReactDOM', { value: fakeReactDOM });
    ctx.defineProperty('antd', { value: fakeAntd });

    const container = document.createElement('div');
    const vnode = { v: 1 };

    ctx.render(vnode as any, container);

    expect(root.render).toHaveBeenCalledTimes(1);
    // createElement is called twice: App first, then ConfigProvider
    expect(createElement).toHaveBeenNthCalledWith(
      2,
      fakeAntdConfigProvider,
      expect.objectContaining({ prefixCls: 'ant' }),
      expect.anything(),
    );

    themeState.token = { colorPrimary: 'blue' };
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(root.render).toHaveBeenCalledTimes(2);

    // cleanup (dispose autorun + unmount root)
    ctx.render('', container);
  });

  it('should enhance hooks dispatcher-null TypeError with a helpful hint', () => {
    const original = new TypeError(`Cannot read properties of null (reading 'useMemo')`);
    // Mimic a real browser stack from ESM CDN where a dependency brings its own React.
    (original as any).stack = [
      `TypeError: Cannot read properties of null (reading 'useMemo')`,
      `    at u.useMemo (https://esm.sh/react@19.2.4/es2022/react.mjs:2:7636)`,
      `    at to (https://esm.sh/@dnd-kit/core@6.1.0/es2022/core.mjs:6:1574)`,
    ].join('\n');

    const root = {
      render: vi.fn(() => {
        throw original;
      }),
      unmount: vi.fn(),
    };

    const internalReact = {};
    const internalAntd = {};
    const ctx: any = {
      React: internalReact,
      ReactDOM: { __nbRunjsInternalShim: true },
      antd: internalAntd,
    };

    const entry: any = { root };
    const containerEl = document.createElement('div');

    try {
      externalReactRender({
        ctx,
        entry,
        vnode: { v: 1 },
        containerEl,
        rootMap: new WeakMap(),
        unmountContainerRoot: vi.fn(),
        internalReact,
        internalAntd,
      });
      expect.fail('expected externalReactRender to throw');
    } catch (e: any) {
      expect(String(e?.message || '')).toContain('[RunJS Hint]');
      expect(String(e?.message || '')).toContain('await ctx.importAsync("react@19.2.4")');
      expect(e?.cause).toBe(original);
    }
  });
});
