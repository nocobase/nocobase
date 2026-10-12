import type { Application } from '@nocobase/app-server/application';
import {
  resolveAppRuntime,
  startApplicationInScope,
  type AppDisposer,
  type AppScope,
} from '@nocobase/app-server/runtime';

import { createApp } from './app.js';
import appRuntime from './runtime.js';

export type { AppDisposer, AppScope };

export type EmbeddedServer = Application;

export async function createServer(scope: AppScope): Promise<EmbeddedServer> {
  const runtime = await resolveAppRuntime(appRuntime, scope);
  const app = createApp(runtime);

  return startApplicationInScope(scope, app);
}

export default createServer;
