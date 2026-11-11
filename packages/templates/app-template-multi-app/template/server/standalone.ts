import { releasesHostToken } from '@nocobase/app-plugin-releases/server';
import path from 'node:path';

import {
  defineStandaloneServer,
  type StandaloneServer as CoreStandaloneServer,
  type StandaloneServerOptions as CoreStandaloneServerOptions,
} from '@nocobase/app-server/node';

import { createServer } from './embedded.js';
import appRuntime from './runtime.js';

const standalone = defineStandaloneServer({
  rootDir: path.resolve(import.meta.dirname, '..'),
  appRuntime,
  createServer,
  proxy: ({ application }) => ({
    match: (pathname) =>
      pathname !== '/main' &&
      !pathname.startsWith('/main/') &&
      pathname !== '/',
    target: () =>
      application.container.resolve(releasesHostToken).proxyTarget(),
  }),
});

export type StandaloneServer = CoreStandaloneServer;

export type StandaloneServerOptions = CoreStandaloneServerOptions;

export const createStandaloneServer: (
  options?: StandaloneServerOptions,
) => Promise<StandaloneServer> = standalone.create;

export const startServer: (options?: StandaloneServerOptions) => void =
  standalone.start;

if (import.meta.main) startServer();
