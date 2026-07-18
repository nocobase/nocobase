/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';
import type { FlowContext } from '../flowContext';

class MinimalRunJSContext {
  libs?: Record<string, unknown>;

  defineProperty(name: string, descriptor: PropertyDescriptor): void {
    Object.defineProperty(this, name, descriptor);
  }

  defineMethod(name: string, method: unknown): void {
    Object.defineProperty(this, name, { configurable: true, value: method });
  }
}

describe('RunJS client SDK runtime module', () => {
  it('exposes the shared client SDK without browser globals', async () => {
    const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const documentDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'document');

    Reflect.deleteProperty(globalThis, 'window');
    Reflect.deleteProperty(globalThis, 'document');
    vi.resetModules();

    try {
      expect(typeof window).toBe('undefined');
      expect(typeof document).toBe('undefined');

      const [clientSdk, { setupRunJSLibs }] = await Promise.all([
        import('@nocobase/sdk/client'),
        import('../runjsLibs'),
      ]);

      const ctx = new MinimalRunJSContext();
      setupRunJSLibs(ctx as unknown as FlowContext);

      expect(ctx.libs?.clientSdk).toBe(clientSdk);

      const runtimeClientSdk = ctx.libs?.clientSdk as typeof clientSdk;
      expect(runtimeClientSdk.createClient).toBe(clientSdk.createClient);

      const client = runtimeClientSdk.createClient();
      expect(client.axios.defaults.baseURL).toBe('/api/');
      expect(client.axios.defaults.withCredentials).toBe(true);
      expect(client.appName).toBe('main');
      expect(client.storage).toBeInstanceOf(clientSdk.MemoryStorage);
    } finally {
      if (windowDescriptor) Object.defineProperty(globalThis, 'window', windowDescriptor);
      if (documentDescriptor) Object.defineProperty(globalThis, 'document', documentDescriptor);
      vi.resetModules();
    }
  });
});
