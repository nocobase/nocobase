/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { RunJSStudioToolbarRegistry, type RunJSStudioToolbarContext } from '../RunJSStudioToolbarRegistry';

const context = {
  locator: {
    kind: 'flowModel.nestedRunJS',
    modelUid: 'fm_1',
    containerFlowKey: 'settings',
    containerStepKey: 'configure',
    valuePath: ['runJs'],
    scene: 'field-linkage',
  },
  workspace: {
    permissions: { canRead: true, canWrite: true, canSave: true },
  },
  files: [],
  entryPath: 'src/main.ts',
  version: 'v2',
  readOnly: false,
  onExternalBindingPersisted: async () => undefined,
} as unknown as RunJSStudioToolbarContext;

describe('RunJSStudioToolbarRegistry', () => {
  it('orders visible contributions and unregisters safely', () => {
    const registry = new RunJSStudioToolbarRegistry();
    const Component: React.FC = () => null;
    const unregisterLater = registry.register({ key: 'later', order: 20, component: Component });
    registry.register({ key: 'hidden', order: 0, component: Component, isVisible: () => false });
    registry.register({ key: 'first', order: 10, component: Component });

    expect(registry.list(context).map((item) => item.key)).toEqual(['first', 'later']);

    unregisterLater();
    expect(registry.list(context).map((item) => item.key)).toEqual(['first']);
  });

  it('shares the toolbar registry across separately loaded client bundles', async () => {
    vi.resetModules();
    const firstBundle = await import('../RunJSStudioToolbarRegistry');
    vi.resetModules();
    const secondBundle = await import('../RunJSStudioToolbarRegistry');

    expect(secondBundle.runJSStudioToolbarRegistry).toBe(firstBundle.runJSStudioToolbarRegistry);
  });
});
