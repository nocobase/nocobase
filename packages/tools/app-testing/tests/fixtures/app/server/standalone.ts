import path from 'node:path';

import type { Application } from '@nocobase/app-server/application';
import {
  defineStandaloneServer,
  type StandaloneServer,
  type StandaloneServerOptions,
} from '@nocobase/app-server/node';
import {
  resolveAppRuntime,
  startApplicationInScope,
  type AppScope,
} from '@nocobase/app-server/runtime';

import { createApp } from './app.js';
import appRuntime from './runtime.js';

async function createServer(scope: AppScope): Promise<Application> {
  const runtime = await resolveAppRuntime(appRuntime, scope);
  return startApplicationInScope(scope, createApp(runtime));
}

const standalone = defineStandaloneServer({
  rootDir: path.resolve(import.meta.dirname, '..'),
  appRuntime,
  createServer,
});

export const createStandaloneServer: (
  options?: StandaloneServerOptions,
) => Promise<StandaloneServer> = standalone.create;
