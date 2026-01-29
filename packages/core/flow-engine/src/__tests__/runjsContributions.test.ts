/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, it, expect, vi } from 'vitest';

describe('RunJS context contributions', () => {
  it('should apply contribution during setupRunJSContexts()', async () => {
    vi.resetModules();
    const mod: any = await import('..');
    const {
      registerRunJSContextContribution,
      setupRunJSContexts,
      RunJSContextRegistry,
      getRunJSDocFor,
      FlowRunJSContext,
    } = mod;

    registerRunJSContextContribution(({ version, RunJSContextRegistry: Registry, FlowRunJSContext: BaseCtx }: any) => {
      if (version !== 'v1') return;
      class PluginTestRunJSContext extends BaseCtx {}
      PluginTestRunJSContext.define({
        properties: {
          plugin: { description: 'plugin namespace', detail: 'object' },
        },
      });
      Registry.register('v1', 'PluginTestModel', PluginTestRunJSContext, { scenes: ['block'] });
    });

    await setupRunJSContexts();

    const ctor = RunJSContextRegistry.resolve('v1', 'PluginTestModel');
    expect(ctor).toBeTruthy();
    expect((ctor as any).name).toBe('PluginTestRunJSContext');

    const ctx: any = { model: { constructor: { name: 'PluginTestModel' } } };
    const doc = getRunJSDocFor(ctx, { version: 'v1' });
    expect(doc?.properties?.plugin).toBeTruthy();

    // Ensure FlowRunJSContext stays usable
    expect(typeof FlowRunJSContext.getDoc).toBe('function');
  });

  it('should apply late contribution immediately after setup', async () => {
    vi.resetModules();
    const mod: any = await import('..');
    const { registerRunJSContextContribution, setupRunJSContexts, getRunJSDocFor, FlowContext } = mod;

    await setupRunJSContexts();

    registerRunJSContextContribution(({ version, FlowRunJSContext }: any) => {
      if (version !== 'v1') return;
      FlowRunJSContext.define({
        properties: {
          pluginLate: { description: 'late-added', detail: 'string' },
        },
      });
    });

    const ctx = new FlowContext();
    const doc = getRunJSDocFor(ctx as any, { version: 'v1' });
    expect(doc?.properties?.pluginLate).toBeTruthy();
  });

  it('should run each contribution at most once per version', async () => {
    vi.resetModules();
    const mod: any = await import('..');
    const { registerRunJSContextContribution, setupRunJSContexts } = mod;

    let count = 0;
    const fn = ({ version }: any) => {
      if (version !== 'v1') return;
      count += 1;
    };

    registerRunJSContextContribution(fn);
    registerRunJSContextContribution(fn); // duplicate registration should be ignored

    await setupRunJSContexts();
    await setupRunJSContexts();

    expect(count).toBe(1);
  });
});
