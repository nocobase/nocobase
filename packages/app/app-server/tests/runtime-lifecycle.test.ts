import { describe, expect, it, vi } from 'vitest';

import {
  AppScopeLifecycle,
  createAppDisposerRegistry,
  onceAsync,
  startApplicationInScope,
} from '../src/runtime/index.js';
import { Application } from '../src/application/index.js';
import { AppConfig, createAppPaths } from '../src/config/index.js';

describe('application resource disposal', () => {
  it('runs registered disposers once in reverse registration order', async () => {
    const events: string[] = [];
    const registry = createAppDisposerRegistry();
    registry.registerDisposer('first', () => events.push('first'));
    registry.registerDisposer('second', async () => {
      events.push('second');
    });

    const firstDisposal = registry.disposeAll();
    const secondDisposal = registry.disposeAll();

    expect(secondDisposal).toBe(firstDisposal);
    await firstDisposal;
    expect(events).toEqual(['second', 'first']);
  });

  it('collects disposer errors without skipping remaining resources', async () => {
    const events: string[] = [];
    const firstError = new Error('first failed');
    const secondError = new Error('second failed');
    const registry = createAppDisposerRegistry();
    registry.registerDisposer('first', () => {
      events.push('first');
      throw firstError;
    });
    registry.registerDisposer('second', () => {
      events.push('second');
      throw secondError;
    });

    const result = registry.disposeAll();

    await expect(result).rejects.toMatchObject({
      message: 'Failed to dispose application resources.',
      errors: [
        expect.objectContaining({ cause: secondError }),
        expect.objectContaining({ cause: firstError }),
      ],
    });
    expect(events).toEqual(['second', 'first']);
  });

  it('rejects resource registration after disposal starts', async () => {
    const registry = createAppDisposerRegistry();
    const disposal = registry.disposeAll();

    expect(() => registry.registerDisposer('late', () => undefined)).toThrow(
      'Cannot register disposer "late" after application resource disposal.',
    );
    await disposal;
  });

  it('memoizes asynchronous operations', async () => {
    const operation = vi.fn(async () => undefined);
    const runOnce = onceAsync(operation);

    const first = runOnce();
    const second = runOnce();

    expect(second).toBe(first);
    await first;
    expect(operation).toHaveBeenCalledOnce();
  });
});

describe('application scope lifecycle', () => {
  it('starts an application and binds shutdown to the scope', async () => {
    const lifecycle = new AppScopeLifecycle();
    const config = new AppConfig();
    await config.loadAll();
    const app = new Application({
      config,
      appName: 'test',
      publicBasePath: '',
      paths: createAppPaths({ rootDir: '/test/app' }),
    });
    const start = vi.spyOn(app, 'start');
    const shutdown = vi.spyOn(app, 'shutdown');

    await expect(startApplicationInScope(lifecycle, app)).resolves.toBe(app);
    expect(start).toHaveBeenCalledOnce();

    await lifecycle.destroy();
    expect(shutdown).toHaveBeenCalledOnce();
  });

  it('aborts first, runs before-destroy handlers, then disposes resources in reverse order', async () => {
    const events: string[] = [];
    const abortReason = new Error('test scope closed');
    const lifecycle = new AppScopeLifecycle({ abortReason });
    lifecycle.onBeforeDestroy(() => {
      expect(lifecycle.signal.aborted).toBe(true);
      expect(lifecycle.signal.reason).toBe(abortReason);
      events.push('before-destroy');
    });
    lifecycle.registerDisposer('first', () => events.push('first'));
    lifecycle.registerDisposer('second', () => events.push('second'));

    const firstDestroy = lifecycle.destroy();
    const secondDestroy = lifecycle.destroy();

    expect(secondDestroy).toBe(firstDestroy);
    await firstDestroy;
    expect(events).toEqual(['before-destroy', 'second', 'first']);
  });

  it('allows a before-destroy handler to be unregistered', async () => {
    const handler = vi.fn();
    const lifecycle = new AppScopeLifecycle();
    const unregister = lifecycle.onBeforeDestroy(handler);

    unregister();
    unregister();
    await lifecycle.destroy();

    expect(handler).not.toHaveBeenCalled();
  });

  it('continues cleanup and reports failures from hooks and resources together', async () => {
    const hookError = new Error('hook failed');
    const disposerError = new Error('disposer failed');
    const lifecycle = new AppScopeLifecycle();
    lifecycle.onBeforeDestroy(() => {
      throw hookError;
    });
    lifecycle.registerDisposer('database', () => {
      throw disposerError;
    });

    await expect(lifecycle.destroy()).rejects.toMatchObject({
      message: 'Failed to destroy application scope.',
      errors: [
        hookError,
        expect.objectContaining({
          message: 'Failed to dispose application resource "database".',
          cause: disposerError,
        }),
      ],
    });
  });

  it('rejects new hooks and resources after destruction starts', async () => {
    const lifecycle = new AppScopeLifecycle();
    const destruction = lifecycle.destroy();

    expect(() => lifecycle.onBeforeDestroy(() => undefined)).toThrow(
      'Cannot register a before-destroy handler after application scope destruction.',
    );
    expect(() => lifecycle.registerDisposer('late', () => undefined)).toThrow(
      'Cannot register disposer "late" after application scope destruction.',
    );
    await destruction;
  });
});
