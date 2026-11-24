import path from 'node:path';

import type { AuditService } from '@nocobase/app-server/audit';
import { auditServiceToken } from '@nocobase/app-server/audit';
import {
  defineStandaloneServer,
  type StandaloneServer,
  type StandaloneServerOptions,
} from '@nocobase/app-server/node';
import {
  resolveAppRuntime,
  startApplicationInScope,
} from '@nocobase/app-server/runtime';

import { createApp } from './app.js';
import appRuntime from './runtime.js';

export function resetServerFactory(
  audit?: AuditService,
): (options?: StandaloneServerOptions) => Promise<StandaloneServer> {
  return defineStandaloneServer({
    rootDir: path.resolve(import.meta.dirname, '..'),
    appRuntime,
    async createServer(scope) {
      const runtime = await resolveAppRuntime(appRuntime, scope);
      const app = createApp(runtime);
      if (audit) app.container.instance(auditServiceToken, audit);
      return startApplicationInScope(scope, app);
    },
  }).create;
}

export const createStandaloneServer: (
  options?: StandaloneServerOptions,
) => Promise<StandaloneServer> = resetServerFactory();
