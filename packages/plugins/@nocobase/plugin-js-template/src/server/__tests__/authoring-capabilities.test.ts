/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Database } from '@nocobase/database';
import type { Application } from '@nocobase/server';
import {
  getOrCreateRunJSWorkspaceServerModule,
  RUNJS_EXTERNALIZATION_DESTINATION_TYPES,
  RUNJS_EXTERNALIZATION_ENTRY_KINDS,
} from '@nocobase/runjs-workspace/server';
import { describe, expect, it, vi } from 'vitest';

import { jsTemplateExternalizationCapabilities } from '../externalizationCapabilities';
import PluginJsTemplateServer from '../plugin';

describe('JS Template authoring capability contribution', () => {
  it('tracks plugin availability and remains identity-safe across reloads', async () => {
    const app = createApp();
    const plugin = new PluginJsTemplateServer(app, {
      name: 'js-template',
      packageName: '@nocobase/plugin-js-template',
    });
    const workspaceModule = getOrCreateRunJSWorkspaceServerModule(app, app.db);

    await plugin.load();
    expect(workspaceModule.getRunJSAuthoringCapabilityRegistry().getExternalization()).toBe(
      jsTemplateExternalizationCapabilities,
    );
    expect(jsTemplateExternalizationCapabilities).toEqual({
      id: 'js-template',
      entryKinds: RUNJS_EXTERNALIZATION_ENTRY_KINDS,
      destinationTypes: RUNJS_EXTERNALIZATION_DESTINATION_TYPES,
      supportsIdempotency: true,
      supportsMoveToInline: true,
    });
    expect(jsTemplateExternalizationCapabilities.destinationTypes).toEqual(['existing', 'new']);

    await plugin.load();
    expect(workspaceModule.getRunJSAuthoringCapabilityRegistry().getExternalization()).toBe(
      jsTemplateExternalizationCapabilities,
    );

    await plugin.afterDisable();
    expect(workspaceModule.getRunJSAuthoringCapabilityRegistry().getExternalization()).toBeUndefined();

    await plugin.load();
    expect(workspaceModule.getRunJSAuthoringCapabilityRegistry().getExternalization()).toBe(
      jsTemplateExternalizationCapabilities,
    );

    await plugin.remove();
    expect(workspaceModule.getRunJSAuthoringCapabilityRegistry().getExternalization()).toBeUndefined();
  });
});

function createApp(): Application {
  return {
    db: {} as Database,
    environment: { getVariables: vi.fn(() => ({})) },
    acl: { allow: vi.fn(), registerSnippet: vi.fn() },
    resourceManager: { define: vi.fn(), options: {} },
    auditManager: { registerActions: vi.fn(), log: vi.fn() },
    use: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  } as unknown as Application;
}
