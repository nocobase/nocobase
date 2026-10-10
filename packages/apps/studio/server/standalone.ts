import path from 'node:path';

import { releasesHostToken } from '@nocobase/app-plugin-releases/server/tokens';

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
  // Release management's local App Host serves the Apps of the Preview environment at `/<appId>/`, beside Studio's own
  // mount: forward every request outside the mount to it, before application routing can answer 404. With the Host
  // disabled or not ready there is no target and nothing is forwarded. In production, previews get an origin of their
  // own (`studio.releases.previewPublicUrl`, a reverse proxy to the Host port), so code under preview never shares
  // Studio's origin and cookies. While the Host is not running nothing matches, and such paths answer 404 as before.
  proxy: ({ application }) => {
    const basePath = application.publicBasePath;
    const host = application.container.has(releasesHostToken)
      ? application.container.resolve(releasesHostToken)
      : null;
    return {
      match: (pathname) =>
        Boolean(basePath) &&
        // The root keeps redirecting to Studio.
        pathname !== '/' &&
        pathname !== basePath &&
        !pathname.startsWith(`${basePath}/`) &&
        Boolean(host?.proxyTarget()),
      target: () => host?.proxyTarget() ?? null,
    };
  },
});

export type StandaloneServer = CoreStandaloneServer;

export type StandaloneServerOptions = CoreStandaloneServerOptions;

export const createStandaloneServer: (
  options?: StandaloneServerOptions,
) => Promise<StandaloneServer> = standalone.create;

export const startServer: (options?: StandaloneServerOptions) => void =
  standalone.start;

if (import.meta.main) startServer();
