/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';

const LIGHT_EXTENSION_DOMAIN_ROUTE =
  /\/(?:light-extensions(?:\/|$)|lightExtension(?:s|Runtime|References|Repos|Files|Entries|Capabilities|Sync):)/u;

export function registerLightExtensionDomainAvailabilityGuard(
  app: Application,
  isAvailable: () => boolean | Promise<boolean>,
  tag: string,
) {
  app.use(
    async (ctx, next) => {
      if (!LIGHT_EXTENSION_DOMAIN_ROUTE.test(ctx.path) || (await isAvailable())) {
        await next();
        return;
      }
      ctx.status = 503;
      ctx.type = 'application/json';
      ctx.body = {
        errors: [
          {
            code: 'LIGHT_EXTENSION_RUNTIME_UNAVAILABLE',
            message: 'Light Extension is disabled',
            status: 503,
          },
        ],
      };
    },
    {
      tag,
      before: 'dataSource',
    },
  );
}
