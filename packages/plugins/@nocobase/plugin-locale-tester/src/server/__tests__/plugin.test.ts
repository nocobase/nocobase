/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import { PluginLocaleTesterServer } from '../plugin';

type LocaleTesterContext = {
  action: {
    resourceName: string;
    actionName: string;
  };
  app: {
    localeManager: {
      get: (lang: string) => Promise<{
        resources: Record<string, unknown>;
        cronstrue: unknown;
        cron: unknown;
      }>;
    };
  };
  body: unknown;
  db: {
    getRepository: (name: string) => {
      findOne: () => Promise<{
        get: (field: string) => string[];
      }>;
    };
  };
  request: {
    query: Record<string, string>;
  };
  state: {
    currentUser?: {
      appLang?: string;
    };
  };
};

type LocaleTesterMiddleware = (ctx: LocaleTesterContext, next: () => Promise<void>) => Promise<void>;

describe('PluginLocaleTesterServer', () => {
  it('returns the base locale when no locale tester record exists', async () => {
    let middleware: LocaleTesterMiddleware | undefined;
    const plugin = {
      app: {
        resourceManager: {
          use: (handler: LocaleTesterMiddleware) => {
            middleware = handler;
          },
        },
      },
    };

    await PluginLocaleTesterServer.prototype.load.call(plugin as unknown as PluginLocaleTesterServer);

    const ctx: LocaleTesterContext = {
      action: {
        resourceName: 'localeTester',
        actionName: 'get',
      },
      app: {
        localeManager: {
          get: async () => ({
            resources: {
              '@nocobase/plugin-demo': {
                Hello: 'Hello',
              },
            },
            cronstrue: {
              every: 'every',
            },
            cron: {
              day: 'day',
            },
          }),
        },
      },
      body: null,
      db: {
        getRepository: () => ({
          findOne: async () => ({
            get: () => ['en-US'],
          }),
        }),
      },
      request: {
        query: {},
      },
      state: {},
    };

    if (!middleware) {
      throw new Error('Locale tester middleware was not registered');
    }
    await middleware(ctx, async () => {});

    expect(ctx.body).toEqual({
      locale: {
        '@nocobase/plugin-demo': {
          Hello: 'Hello',
        },
        cronstrue: {
          every: 'every',
        },
        'react-js-cron': {
          day: 'day',
        },
      },
    });
  });
});
