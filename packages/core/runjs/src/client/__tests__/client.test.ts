/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it, vi } from 'vitest';

import { createRunJSClientHosts, installRunJSClientHosts } from '..';

function createHosts() {
  return createRunJSClientHosts<
    { key: string; priority?: number },
    {
      key: string;
      priority?: number;
      getSettingsDescriptor(): Promise<undefined>;
    },
    {
      sourceMode: string;
      resolve(): Promise<{ code: string; version?: string }>;
    }
  >({
    flowContext: {
      createRuntimeContext(baseContext, resolved) {
        return { ...(baseContext as Record<string, unknown>), settings: resolved.settings };
      },
    },
  });
}

describe('@nocobase/runjs/client', () => {
  it('creates isolated registries with deterministic priority and identity-safe disposal', () => {
    const first = createHosts();
    const second = createHosts();
    const original = { key: 'editor', priority: 1 };
    const replacement = { key: 'editor', priority: 2 };
    const disposeOriginal = first.registryHost.editors.registerProvider(original);
    first.registryHost.editors.registerProvider(replacement);

    expect(first.registryHost.editors.getProviders()).toEqual([replacement]);
    expect(second.registryHost.editors.getProviders()).toEqual([]);

    disposeOriginal();
    expect(first.registryHost.editors.getProviders()).toEqual([replacement]);
  });

  it('resolves registered sources and evaluates them through the injected context adapter', async () => {
    const hosts = createHosts();
    hosts.registryHost.sourceResolvers.registerResolver({
      sourceMode: 'project',
      async resolve() {
        return { code: 'return settings.answer', version: 'v2' };
      },
    });
    const resolved = await hosts.runtimeHost.resolveRuntime({
      sourceMode: 'project',
      sourceBinding: { projectId: 'one' },
      settings: { answer: 42 },
    });
    const runjs = vi.fn().mockResolvedValue({ success: true, value: 42 });

    await expect(hosts.runtimeHost.evaluateResolvedValue({ ctx: { runjs }, resolved })).resolves.toBe(42);
    expect(runjs).toHaveBeenCalledWith('return settings.answer', undefined, { version: 'v2' });
  });

  it('installs both hosts once and disposes them in reverse order', () => {
    const hosts = createHosts();
    const events: string[] = [];
    const dispose = installRunJSClientHosts(hosts, {
      registerRegistryHost() {
        events.push('install registry');
        return () => events.push('dispose registry');
      },
      registerRuntimeHost() {
        events.push('install runtime');
        return () => events.push('dispose runtime');
      },
    });

    dispose();
    dispose();

    expect(events).toEqual(['install registry', 'install runtime', 'dispose runtime', 'dispose registry']);
  });
});
