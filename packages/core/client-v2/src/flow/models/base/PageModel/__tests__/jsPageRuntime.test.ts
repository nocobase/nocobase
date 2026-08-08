/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, describe, expect, it, vi } from 'vitest';
import { JSPageRuntimeController, type JSPageRuntimeRunContext } from '../jsPageRuntime';

type TestRunJSRootEntry = {
  root?: { unmount?: () => void };
  disposeTheme?: () => void;
};

type TestRunJSGlobal = typeof globalThis & {
  __nbRunjsRoots?: WeakMap<object, TestRunJSRootEntry>;
};

const runJSGlobal = globalThis as TestRunJSGlobal;

function deferred<T>() {
  let resolvePromise!: (value: T | PromiseLike<T>) => void;
  let rejectPromise!: (reason?: unknown) => void;
  const promise = new Promise<T>((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });
  return { promise, resolve: resolvePromise, reject: rejectPromise };
}

function createController(input: {
  active?: () => boolean;
  resolve?: (context: JSPageRuntimeRunContext) => Promise<string>;
  execute?: (resolved: string, context: JSPageRuntimeRunContext) => Promise<void>;
  setDocumentTitle?: (title: string) => void;
}) {
  const host = document.createElement('div');
  const controller = new JSPageRuntimeController({
    uid: 'page-1',
    isActive: input.active || (() => true),
    resolve: input.resolve || (async () => 'resolved'),
    execute:
      input.execute ||
      (async (resolved, context) => {
        context.element.textContent = resolved;
      }),
    setDocumentTitle: input.setDocumentTitle || (() => undefined),
  });
  controller.setElement(host);
  return { controller, host };
}

afterEach(() => {
  delete runJSGlobal.__nbRunjsRoots;
});

describe('JSPageRuntimeController', () => {
  it('runs an idle refresh and settles after that run', async () => {
    const pendingExecute = deferred<void>();
    const { controller } = createController({
      execute: async () => pendingExecute.promise,
    });
    let settled = false;

    const refresh = controller.refresh().then(() => {
      settled = true;
    });
    await Promise.resolve();

    expect(settled).toBe(false);
    pendingExecute.resolve();
    await refresh;
    expect(settled).toBe(true);
  });

  it('owns the runtime element and disposes its root once', async () => {
    const disposeTheme = vi.fn();
    const unmount = vi.fn();
    const roots = new WeakMap<object, TestRunJSRootEntry>();
    runJSGlobal.__nbRunjsRoots = roots;
    const { controller, host } = createController({
      execute: async (_resolved, context) => {
        roots.set(context.element, { disposeTheme, root: { unmount } });
        context.element.textContent = 'content';
      },
    });

    await controller.run();
    controller.setElement(null);
    controller.dispose();
    controller.dispose();

    expect(disposeTheme).toHaveBeenCalledOnce();
    expect(unmount).toHaveBeenCalledOnce();
    expect(host.innerHTML).toBe('');
  });

  it('ignores stale resolve success', async () => {
    const firstResolve = deferred<string>();
    let resolveCount = 0;
    const execute = vi.fn(async (resolved: string, context: JSPageRuntimeRunContext) => {
      context.element.textContent = resolved;
    });
    const { controller, host } = createController({
      resolve: async () => {
        resolveCount += 1;
        return resolveCount === 1 ? firstResolve.promise : 'new';
      },
      execute,
    });

    const firstRun = controller.run();
    const secondRun = controller.run();
    await secondRun;
    firstResolve.resolve('old');
    await firstRun;

    expect(execute).toHaveBeenCalledOnce();
    expect(host.textContent).toBe('new');
    expect(controller.state.error).toBeNull();
  });

  it('ignores stale execute errors without clearing the current content', async () => {
    const firstExecute = deferred<void>();
    let executeCount = 0;
    const { controller, host } = createController({
      execute: async (resolved, context) => {
        executeCount += 1;
        context.element.textContent = resolved;
        if (executeCount === 1) {
          await firstExecute.promise;
        }
      },
    });

    const firstRun = controller.run();
    await Promise.resolve();
    const secondRun = controller.run();
    await secondRun;
    firstExecute.reject(new Error('old failure'));
    await firstRun;

    expect(host.textContent).toBe('resolved');
    expect(controller.state.error).toBeNull();
  });

  it('coalesces refreshes into one follow-up and does not loop from the follow-up', async () => {
    const followUpDone = deferred<void>();
    let executeCount = 0;
    const { controller } = createController({
      execute: async (_resolved, context) => {
        executeCount += 1;
        await context.page.refresh();
        await context.page.refresh();
        if (executeCount === 2) {
          followUpDone.resolve();
        }
      },
    });

    await controller.run();
    await followUpDone.promise;
    await Promise.resolve();

    expect(executeCount).toBe(2);
    expect(controller.state.running).toBe(false);
  });

  it('settles the current run without waiting for its queued follow-up', async () => {
    const followUpStarted = deferred<void>();
    const releaseFollowUp = deferred<void>();
    const followUpDone = deferred<void>();
    let executeCount = 0;
    const { controller } = createController({
      execute: async (_resolved, context) => {
        executeCount += 1;
        if (executeCount === 1) {
          await context.page.refresh();
          return;
        }
        followUpStarted.resolve();
        await releaseFollowUp.promise;
        followUpDone.resolve();
      },
    });

    await controller.run();
    await followUpStarted.promise;

    expect(controller.state.running).toBe(true);

    releaseFollowUp.resolve();
    await followUpDone.promise;
    await Promise.resolve();
    expect(controller.state.running).toBe(false);
  });

  it('drops pending results and queued refreshes after dispose', async () => {
    const pendingResolve = deferred<string>();
    const execute = vi.fn(async () => undefined);
    const { controller, host } = createController({
      resolve: () => pendingResolve.promise,
      execute,
    });

    const run = controller.run();
    await controller.refresh();
    controller.dispose();
    pendingResolve.resolve('late');
    await run;

    expect(execute).not.toHaveBeenCalled();
    expect(host.innerHTML).toBe('');
    expect(controller.state.running).toBe(false);
  });

  it('ignores and cleans an execute result that arrives after dispose', async () => {
    const executeStarted = deferred<void>();
    const pendingExecute = deferred<void>();
    const unmount = vi.fn();
    const roots = new WeakMap<object, TestRunJSRootEntry>();
    runJSGlobal.__nbRunjsRoots = roots;
    const { controller, host } = createController({
      execute: async (_resolved, context) => {
        executeStarted.resolve();
        await pendingExecute.promise;
        roots.set(context.element, { root: { unmount } });
        context.element.textContent = 'late';
      },
    });

    const run = controller.run();
    await executeStarted.promise;
    controller.dispose();
    pendingExecute.resolve();
    await run;

    expect(unmount).toHaveBeenCalledOnce();
    expect(host.innerHTML).toBe('');
    expect(controller.state.running).toBe(false);
  });

  it('drops pending results after the page becomes inactive', async () => {
    let active = true;
    const pendingResolve = deferred<string>();
    const execute = vi.fn(async () => undefined);
    const { controller } = createController({
      active: () => active,
      resolve: () => pendingResolve.promise,
      execute,
    });

    const run = controller.run();
    active = false;
    controller.deactivate();
    pendingResolve.resolve('late');
    await run;

    expect(execute).not.toHaveBeenCalled();
    expect(controller.state.running).toBe(false);
  });

  it('keeps the page facade active value live and rejects stale document title writes', async () => {
    let active = true;
    const firstExecute = deferred<void>();
    const titles: string[] = [];
    let firstContext: JSPageRuntimeRunContext | undefined;
    let executeCount = 0;
    const { controller } = createController({
      active: () => active,
      setDocumentTitle: (title) => titles.push(title),
      execute: async (_resolved, context) => {
        executeCount += 1;
        if (executeCount === 1) {
          firstContext = context;
          await firstExecute.promise;
          return;
        }
        context.page.setDocumentTitle('new');
        context.page.setDocumentTitle('');
      },
    });

    const firstRun = controller.run();
    await Promise.resolve();
    active = false;
    expect(firstContext?.page.active).toBe(false);
    active = true;
    await controller.run();
    firstContext?.page.setDocumentTitle('old');
    firstExecute.resolve();
    await firstRun;

    expect(firstContext?.page.uid).toBe('page-1');
    expect(titles).toEqual(['new']);
  });

  it('cleans a failed current run and exposes a normalized error', async () => {
    const disposeTheme = vi.fn();
    const unmount = vi.fn();
    const roots = new WeakMap<object, TestRunJSRootEntry>();
    runJSGlobal.__nbRunjsRoots = roots;
    const { controller, host } = createController({
      execute: async (_resolved, context) => {
        roots.set(context.element, { disposeTheme, root: { unmount } });
        context.element.textContent = 'partial';
        throw new Error('failed');
      },
    });

    await expect(controller.run()).rejects.toEqual({ message: 'failed' });

    expect(disposeTheme).toHaveBeenCalledOnce();
    expect(unmount).toHaveBeenCalledOnce();
    expect(host.innerHTML).toBe('');
    expect(controller.state).toMatchObject({ running: false, error: { message: 'failed' } });
  });
});
