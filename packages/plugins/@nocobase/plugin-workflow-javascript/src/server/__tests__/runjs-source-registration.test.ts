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
  it('registers after the optional VSC plugin loads and cleans up the listener and adapter', () => {
    const listeners = new Set<(plugin: unknown) => void>();
    const adapters: RunJSSourceAdapter[] = [];
    const registrar = {
      registerRunJSSourceAdapter: vi.fn((adapter: RunJSSourceAdapter) => {
        adapters.push(adapter);
        return () => {
          const index = adapters.indexOf(adapter);
          if (index >= 0) {
            adapters.splice(index, 1);
          }
        };
      }),
    };
    let loaded = false;
    const plugin = {
      db: {} as Database,
      app: {
        pm: {
          get: vi.fn(() => (loaded ? registrar : null)),
        },
        on: vi.fn((_eventName: string, listener: (plugin: unknown) => void) => listeners.add(listener)),
        off: vi.fn((_eventName: string, listener: (plugin: unknown) => void) => listeners.delete(listener)),
      },
    };

    const cleanup = registerWorkflowJavaScriptRunJSSourceAdapter(plugin);

    expect(adapters).toEqual([]);
    expect(listeners.size).toBe(1);

    loaded = true;
    for (const listener of listeners) {
      listener(registrar);
    }

    expect(adapters.map((adapter) => adapter.kind)).toEqual(['workflow.javascript']);
    expect(listeners.size).toBe(0);

    cleanup();
    expect(adapters).toEqual([]);
  });
});
