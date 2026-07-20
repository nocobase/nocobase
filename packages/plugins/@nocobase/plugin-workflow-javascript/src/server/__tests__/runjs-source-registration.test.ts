/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type { RunJSSourceAdapter } from '@nocobase/server';
import { describe, expect, it, vi } from 'vitest';

import { registerWorkflowJavaScriptRunJSSourceAdapter } from '../runjs-sources';

describe('workflow JavaScript RunJS source registration', () => {
  it('uses the loaded Light Extension host and cleans up repeated owner loads', () => {
    const lightHost = createRegistrar();
    const legacyHost = createRegistrar();
    const get = vi.fn((name: string) => {
      if (name === '@nocobase/plugin-light-extension') {
        return lightHost;
      }
      if (name === '@nocobase/plugin-vsc-file') {
        return legacyHost;
      }
      return null;
    });
    const plugin = createPlugin({ get });

    let cleanup = registerWorkflowJavaScriptRunJSSourceAdapter(plugin);
    expect(lightHost.adapters.map((adapter) => adapter.kind)).toEqual(['workflow.javascript']);
    expect(legacyHost.adapters).toEqual([]);

    cleanup();
    cleanup = registerWorkflowJavaScriptRunJSSourceAdapter(plugin);
    expect(lightHost.adapters.map((adapter) => adapter.kind)).toEqual(['workflow.javascript']);

    cleanup();
    cleanup();
    expect(lightHost.adapters).toEqual([]);
    expect(lightHost.registerRunJSSourceAdapter).toHaveBeenCalledTimes(2);
  });

  it('registers once when the host loads after the owner and removes pending work on cleanup', () => {
    const listeners = new Set<(plugin: unknown) => void>();
    const host = createRegistrar();
    const plugins = new Map<unknown, unknown>();
    const get = vi.fn((name: string) => plugins.get(name));
    const plugin = createPlugin({
      get,
      getPlugins: () => plugins,
      on: (_eventName, listener) => listeners.add(listener),
      off: (_eventName, listener) => listeners.delete(listener),
    });

    const cleanup = registerWorkflowJavaScriptRunJSSourceAdapter(plugin);
    expect(listeners.size).toBe(1);

    plugins.set('@nocobase/plugin-light-extension', host);
    const [onAfterLoadPlugin] = listeners;
    onAfterLoadPlugin(host);
    onAfterLoadPlugin(host);

    expect(host.adapters.map((adapter) => adapter.kind)).toEqual(['workflow.javascript']);
    expect(host.registerRunJSSourceAdapter).toHaveBeenCalledTimes(1);
    expect(listeners.size).toBe(0);

    cleanup();
    expect(host.adapters).toEqual([]);
  });

  it('falls back to capability scanning and removes an unresolved listener on cleanup', () => {
    const listeners = new Set<(plugin: unknown) => void>();
    const scannedHost = createRegistrar();
    const legacyHost = createRegistrar();
    const plugin = createPlugin({
      get: (name) => (name === '@nocobase/plugin-vsc-file' ? legacyHost : null),
      getPlugins: () => new Map([['custom-runjs-host', scannedHost]]),
      on: (_eventName, listener) => listeners.add(listener),
      off: (_eventName, listener) => listeners.delete(listener),
    });

    const cleanupScanned = registerWorkflowJavaScriptRunJSSourceAdapter(plugin);
    expect(scannedHost.adapters.map((adapter) => adapter.kind)).toEqual(['workflow.javascript']);
    expect(legacyHost.adapters).toEqual([]);
    cleanupScanned();
    expect(scannedHost.adapters).toEqual([]);

    const cleanupLegacy = registerWorkflowJavaScriptRunJSSourceAdapter(
      createPlugin({
        get: (name) => (name === '@nocobase/plugin-vsc-file' ? legacyHost : null),
      }),
    );
    expect(legacyHost.adapters.map((adapter) => adapter.kind)).toEqual(['workflow.javascript']);
    cleanupLegacy();
    expect(legacyHost.adapters).toEqual([]);

    const unresolvedPlugin = createPlugin({
      get: () => null,
      on: (_eventName, listener) => listeners.add(listener),
      off: (_eventName, listener) => listeners.delete(listener),
    });
    const cleanupUnresolved = registerWorkflowJavaScriptRunJSSourceAdapter(unresolvedPlugin);
    expect(listeners.size).toBe(1);
    cleanupUnresolved();
    expect(listeners.size).toBe(0);
  });
});

type FakeRegistrar = {
  adapters: RunJSSourceAdapter[];
  registerRunJSSourceAdapter: ReturnType<typeof vi.fn<(adapter: RunJSSourceAdapter) => () => void>>;
};

function createRegistrar(): FakeRegistrar {
  const registrar: FakeRegistrar = {
    adapters: [],
    registerRunJSSourceAdapter: vi.fn((adapter: RunJSSourceAdapter) => {
      registrar.adapters.push(adapter);
      return () => {
        registrar.adapters = registrar.adapters.filter((item) => item !== adapter);
      };
    }),
  };
  return registrar;
}

function createPlugin(options: {
  get: (name: string) => unknown;
  getPlugins?: () => Map<unknown, unknown>;
  on?: (eventName: 'afterLoadPlugin', listener: (plugin: unknown) => void) => unknown;
  off?: (eventName: 'afterLoadPlugin', listener: (plugin: unknown) => void) => unknown;
}) {
  return {
    db: {} as Database,
    app: {
      pm: {
        get: options.get,
        getPlugins: options.getPlugins,
      },
      on: options.on,
      off: options.off,
    },
  };
}
