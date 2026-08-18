/**
 * This file is part of the NocoBase (R) project.
 * Copyright (c) 2020-2024 NocoBase Co., Ltd.
 * Authors: NocoBase Team.
 *
 * This project is dual-licensed under AGPL-3.0 and NocoBase Commercial License.
 * For more information, please refer to: https://www.nocobase.com/agreement.
 */

import type { Application } from '@nocobase/server';

const JS_TEMPLATE_DOMAIN_ROUTE =
  /\/(?:js-templates(?:\/|$)|js-template-runtime(?:\/|$)|jsTemplates:|jsTemplate(?:Runtime|Usages|Projects|Files|Capabilities|Sync|CreateJobs):)/u;

export function registerJsTemplateDomainAvailabilityGuard(
  app: Application,
  isAvailable: () => boolean | Promise<boolean>,
  tag: string,
) {
  app.use(
    async (ctx, next) => {
      const isDomainRoute = JS_TEMPLATE_DOMAIN_ROUTE.test(ctx.path);
      if (!isDomainRoute || (await isAvailable())) {
        await next();
        return;
      }
      ctx.status = 503;
      ctx.type = 'application/json';
      ctx.body = {
        errors: [
          {
            code: 'JS_TEMPLATE_RUNTIME_UNAVAILABLE',
            message: 'JS Template is disabled',
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
