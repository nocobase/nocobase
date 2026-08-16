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
import { PluginFlowEngine } from '../index';
import { clearRunJSRegistryHosts, getRunJSRegistryHost } from '../components/runjs-source/RunJSRegistryHost';
import { clearRunJSRuntimeHosts, getRunJSRuntimeHost } from '../components/runjs-source/RunJSRuntimeHost';
import { RunJSEditorRegistry } from '../components/runjs-studio/RunJSEditorRegistry';

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
    clearRunJSRegistryHosts();
    clearRunJSRuntimeHosts();
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
  });

  it('should normalize the browser device type to computer', async () => {
    detectedDeviceType.value = 'browser';
    const app = createMockClient();
    const plugin = new PluginFlowEngine({}, app);

    await plugin.load();

    expect(app.flowEngine.context.deviceType).toBe('computer');
  });

  it('installs the default RunJS hosts idempotently and releases them on dispose', async () => {
    const app = createMockClient();
    const plugin = new PluginFlowEngine({}, app);

    await plugin.beforeLoad();
    const registryHost = getRunJSRegistryHost();
    const runtimeHost = getRunJSRuntimeHost();
    await plugin.beforeLoad();
    await plugin.load();

    expect(getRunJSRegistryHost()).toBe(registryHost);
    expect(getRunJSRuntimeHost()).toBe(runtimeHost);

    plugin.dispose();
    expect(getRunJSRegistryHost()).toBeUndefined();
    expect(() => getRunJSRuntimeHost()).toThrow('RunJS client runtime is not installed');
  });

  it('lets the latest application take over and restores the preceding hosts when released', async () => {
    const first = new PluginFlowEngine({}, createMockClient());
    const second = new PluginFlowEngine({}, createMockClient());

    await first.beforeLoad();
    const firstRegistryHost = getRunJSRegistryHost();
    const firstRuntimeHost = getRunJSRuntimeHost();
    await second.beforeLoad();

    expect(getRunJSRegistryHost()).not.toBe(firstRegistryHost);
    expect(getRunJSRuntimeHost()).not.toBe(firstRuntimeHost);

    second.dispose();
    expect(getRunJSRegistryHost()).toBe(firstRegistryHost);
    expect(getRunJSRuntimeHost()).toBe(firstRuntimeHost);

    first.dispose();
    expect(getRunJSRegistryHost()).toBeUndefined();
  });

  it('adopts contributions registered before the default host is installed', async () => {
    const disposeEditor = RunJSEditorRegistry.registerProvider({
      key: 'early-editor',
      renderEditor: () => null,
    });
    const plugin = new PluginFlowEngine({}, createMockClient());

    expect(RunJSEditorRegistry.getProviders().map(({ key }) => key)).toEqual(['early-editor']);

    await plugin.beforeLoad();
    expect(RunJSEditorRegistry.getProviders().map(({ key }) => key)).toEqual(['early-editor']);

    disposeEditor();
    expect(RunJSEditorRegistry.getProviders()).toEqual([]);
    plugin.dispose();
  });
});
