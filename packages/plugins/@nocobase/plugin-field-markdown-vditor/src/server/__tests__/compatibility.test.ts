/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { describe, expect, it } from 'vitest';
import { PluginFieldMarkdownVditorServer } from '../plugin';

type VditorContext = {
  action: {
    params: {
      fileCollectionName?: string;
    };
  };
  body?: {
    isSupportToUploadFiles: boolean;
    storage: {
      id: number;
      name: string;
      rules: Record<string, unknown>;
      title: string | null;
      type: string;
    };
  };
  throw: (status: number, message: string) => never;
  t: (key: string, options?: Record<string, unknown>) => string;
};

type VditorResourceDefinition = {
  name: string;
  actions: {
    check: (context: VditorContext, next: () => Promise<void>) => Promise<void>;
  };
};

describe('PluginFieldMarkdownVditorServer compatibility entry', () => {
  it('should keep vditor:check available when only the deprecated field plugin is enabled', async () => {
    const resources: VditorResourceDefinition[] = [];
    const aclRules: unknown[][] = [];
    const storage = {
      id: 1,
      name: 'default-storage',
      title: null,
      type: 'local',
      rules: {},
    };
    const app = {
      db: {
        getCollection: () => undefined,
        getRepository: () => ({
          findOne: async () => storage,
        }),
      },
      resourceManager: {
        define(resource: VditorResourceDefinition) {
          resources.push(resource);
        },
      },
      acl: {
        allow(...args: unknown[]) {
          aclRules.push(args);
        },
      },
    };
    const plugin = Object.assign(Object.create(PluginFieldMarkdownVditorServer.prototype), {
      app,
      copyVditorDist: async () => {},
    }) as PluginFieldMarkdownVditorServer;

    await plugin.load();

    expect(resources[0]?.name).toBe('vditor');
    expect(aclRules).toContainEqual(['vditor', 'check', 'loggedIn']);

    const context: VditorContext = {
      action: {
        params: {},
      },
      throw(status, message) {
        throw new Error(`${status}: ${message}`);
      },
      t: (key) => key,
    };
    await resources[0].actions.check(context, async () => {});

    expect(context.body).toEqual({
      isSupportToUploadFiles: true,
      storage,
    });
  });
});
