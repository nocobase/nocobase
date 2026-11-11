import { createAppViteConfig } from '@nocobase/dev-config/vite/app';
import { loadAppVitePlugins } from '@nocobase/dev-config/vite/plugins';
import path from 'path';
import {
  createDevClientConfigPlugin,
  createDevProxy,
} from '@nocobase/app-cli/dev/proxy';

const numberFromEnv = (value: string | undefined): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

// https://vite.dev/config/
export default createAppViteConfig(async (environment) => {
  const command = environment.command;
  // Configuration is loaded by the application runtime. Vite should only
  // consume the environment explicitly supplied by the invoking process;
  // reading .env here would make the client and server use different paths.
  const env = process.env;
  // `pnpm dev` passes the mount path it resolved; the preset serves from it, and a build does not depend on one.
  const appBase = env.APP_BASE_PATH ?? '';
  const devClientConfig =
    command === 'serve'
      ? createDevClientConfigPlugin(appBase, env.PROXY_TARGET_URL)
      : undefined;
  const viteHmrHost = env.APP_VITE_HMR_HOST;
  const viteDevPort = numberFromEnv(env.APP_VITE_DEV_PORT) ?? 5173;

  return {
    root: __dirname,
    ...(command === 'build' ? { base: env.CDN_BASE_URL?.trim() || './' } : {}),
    plugins: [
      ...(await loadAppVitePlugins({ appRoot: __dirname, environment })),
      ...(devClientConfig ? [devClientConfig] : []),
    ],
    server: {
      proxy:
        command === 'serve'
          ? createDevProxy(appBase, env.PROXY_TARGET_URL)
          : undefined,
      watch: {
        ignored: [
          '**/storage/**',
          // Vite only excludes dist/client automatically. The server build and
          // vendored packages also live in dist and can exhaust file watchers.
          // Scope this to the app so linked dependencies still receive HMR.
          (filePath: string) => {
            const relativePath = path.relative(__dirname, filePath);
            return (
              relativePath === 'dist' ||
              relativePath.startsWith(`dist${path.sep}`)
            );
          },
        ],
      },
      ...(command === 'serve'
        ? {
            hmr: {
              ...(viteHmrHost ? { host: viteHmrHost } : {}),
              clientPort: viteDevPort,
            },
          }
        : {}),
    },
    resolve: {
      dedupe: ['react', 'react-dom', 'react-router'],
    },
  };
});
