/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createMockClient } from '../../MockApplication';
import {
  clearRunJSRegistryHosts,
  clearRunJSRuntimeHosts,
  evaluateInlineRunJSValue,
  getRunJSRegistryHost,
  getRunJSRuntimeHost,
  PluginFlowEngine,
  resolveRuntimeRunJS,
} from '../index';

const { detectedDeviceType } = vi.hoisted(() => ({
  detectedDeviceType: { value: 'mobile' },
}));

vi.mock('react-device-detect', () => ({
  get deviceType() {
    return detectedDeviceType.value;
  },
}));

describe('PluginFlowEngine', () => {
  beforeEach(() => {
    detectedDeviceType.value = 'mobile';
  });

  afterEach(() => {
    clearRunJSRegistryHosts();
    clearRunJSRuntimeHosts();
    vi.restoreAllMocks();
  });

  it('does not re-register actions when the same app loads twice', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const app = createMockClient({
      plugins: [
        [
          PluginFlowEngine,
          {
            name: 'flow-engine',
          },
        ],
      ],
    });

    await app.load();
    await app.load();

    expect(app.flowEngine.getAction('openView')).toBeTruthy();
    expect(warn.mock.calls.flat().join('\n')).not.toContain("Action 'openView' is already registered");
    (app.pm.get(PluginFlowEngine) as PluginFlowEngine).dispose();
  });

  it('installs the default RunJS hosts from core', async () => {
    const app = createMockClient();
    const plugin = new PluginFlowEngine({}, app);

    await plugin.beforeLoad();
    await expect(resolveRuntimeRunJS({ runJs: { code: 'return 1;' } })).resolves.toMatchObject({
      code: 'return 1;',
      version: 'v1',
      sourceMode: 'inline',
      settings: {},
    });
    await expect(
      evaluateInlineRunJSValue({
        ctx: app.flowEngine.context,
        runJs: {
          code: 'return [ctx.settings.region, ctx.runJsSource.sourceMode, typeof window];',
          version: 'v2',
          settings: { region: 'APAC' },
        },
      }),
    ).resolves.toEqual(['APAC', 'inline', 'object']);

    plugin.dispose();
    expect(getRunJSRegistryHost()).toBeUndefined();
    expect(() => getRunJSRuntimeHost()).toThrow('RunJS client runtime is not installed');
  });

  it('hands the global RunJS hosts to the newest core plugin instance', async () => {
    const first = new PluginFlowEngine({}, createMockClient());
    const second = new PluginFlowEngine({}, createMockClient());
    const activeOwnerKey = Symbol.for('nocobase.client-v2.plugin-flow-engine.runjs-client');
    const activeOwnerState = globalThis as typeof globalThis & { [activeOwnerKey]?: PluginFlowEngine };

    await first.beforeLoad();
    expect(activeOwnerState[activeOwnerKey]).toBe(first);
    const firstRegistryHost = getRunJSRegistryHost();
    const firstRuntimeHost = getRunJSRuntimeHost();

    await second.beforeLoad();
    const secondRegistryHost = getRunJSRegistryHost();
    const secondRuntimeHost = getRunJSRuntimeHost();
    expect(activeOwnerState[activeOwnerKey]).toBe(second);
    expect(secondRegistryHost).not.toBe(firstRegistryHost);
    expect(secondRuntimeHost).not.toBe(firstRuntimeHost);

    first.dispose();
    expect(activeOwnerState[activeOwnerKey]).toBe(second);
    expect(getRunJSRegistryHost()).toBe(secondRegistryHost);
    expect(getRunJSRuntimeHost()).toBe(secondRuntimeHost);

    second.dispose();
    expect(activeOwnerState[activeOwnerKey]).toBeUndefined();
    expect(getRunJSRegistryHost()).toBeUndefined();
    expect(() => getRunJSRuntimeHost()).toThrow('RunJS client runtime is not installed');
  });

  it('should register the current device type before shared flow components', async () => {
    const app = createMockClient({
      router: {
        type: 'memory',
        initialEntries: ['/'],
      },
    });
    const plugin = new PluginFlowEngine({}, app);
    const addComponents = app.addComponents.bind(app);
    const deviceTypesBeforeComponentRegistration: string[] = [];
    vi.spyOn(app, 'addComponents').mockImplementation((components) => {
      deviceTypesBeforeComponentRegistration.push(app.flowEngine.context.deviceType);
      return addComponents(components);
    });

    await plugin.load();

    expect(app.flowEngine.context.deviceType).toBe('mobile');
    expect(deviceTypesBeforeComponentRegistration).toEqual(['mobile']);
    plugin.dispose();
  });

  it('should normalize the browser device type to computer', async () => {
    detectedDeviceType.value = 'browser';
    const app = createMockClient();
    const plugin = new PluginFlowEngine({}, app);

    await plugin.load();

    expect(app.flowEngine.context.deviceType).toBe('computer');
    plugin.dispose();
  });
});
