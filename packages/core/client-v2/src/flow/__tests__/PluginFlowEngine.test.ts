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
import { RunJSEditorRegistry } from '../components/runjs-studio';
import { RunJSSettingsDescriptorProviderRegistry } from '../components/runjs-source';
import { PluginFlowEngine } from '../index';

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
    RunJSEditorRegistry.clear();
    RunJSSettingsDescriptorProviderRegistry.clear();
    vi.restoreAllMocks();
  });

  it('keeps the RunJS workspace client available across reload and dispose cycles', async () => {
    const app = createMockClient();
    const plugin = new PluginFlowEngine({}, app);

    await plugin.load();
    expect(RunJSEditorRegistry.getProviders().map((provider) => provider.key)).toEqual([
      '@nocobase/runjs-workspace/runjs-studio',
    ]);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders().map((provider) => provider.key)).toEqual([
      '@nocobase/runjs-workspace/inline-settings-descriptor',
    ]);

    plugin.dispose();
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(0);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(0);

    await plugin.load();
    expect(RunJSEditorRegistry.getProviders()).toHaveLength(1);
    expect(RunJSSettingsDescriptorProviderRegistry.getProviders()).toHaveLength(1);
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
});
