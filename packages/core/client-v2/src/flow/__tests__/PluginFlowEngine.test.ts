/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { createMockClient, PluginFlowEngine } from '@nocobase/client-v2';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
