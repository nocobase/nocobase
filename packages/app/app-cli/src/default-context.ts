import { stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import type { AppRuntimeDefinition } from '@nocobase/app-server/runtime';
import type { AppCommandContext } from './context.ts';
import { trackOpenRuntime } from './runtime/command-store.ts';

export interface AppCommandContextOptions {
  readonly rootDir: string;
  /**
   * The configuration file the application loads instead of its default, handed to the application the way
   * `APP_CONFIG_FILE` is; the application resolves a relative path against its root. Tests use it to point a command at
   * a configuration of their own, such as one naming a test database.
   */
  readonly configPath?: string;
  readonly loadRuntime?: AppCommandContext['loadRuntime'];
  readonly createApp?: AppCommandContext['createApp'];
}

/** Load by convention only when a command actually needs the application. */
export function createDefaultCommandContext(
  options: AppCommandContextOptions,
): AppCommandContext {
  const rootDir = path.resolve(options.rootDir);
  return {
    rootDir,
    loadRuntime:
      options.loadRuntime ??
      (async () => {
        const url = await resolveServerModule(rootDir, 'runtime');
        const module = (await import(url)) as {
          default?: AppRuntimeDefinition;
        };
        if (!module.default || typeof module.default !== 'object') {
          throw new Error(
            `Application runtime module "${url}" must have a default runtime export.`,
          );
        }
        // Imported here, not at module top level: every AppCommand reaches this file, and a command that only needs
        // `rootDir` should not load the server runtime to get it.
        const { resolveStandaloneAppRuntime } =
          await import('@nocobase/app-server/node');
        const runtime = await resolveStandaloneAppRuntime(module.default, {
          rootDir,
          ...(options.configPath === undefined
            ? {}
            : { configPath: options.configPath }),
          // The command's result owns stdout; what the application logs while it runs goes to stderr.
          consoleLogStream: 'stderr',
        });
        const release = trackOpenRuntime({
          // The scope is destroyed even when shutdown fails: it holds what keeps the process from exiting.
          close: async () => {
            try {
              await runtime.app?.shutdown();
            } finally {
              await runtime.scope.destroy();
            }
          },
        });
        runtime.scope.onBeforeDestroy(async () => {
          release();
        });
        return runtime;
      }),
    createApp:
      options.createApp ??
      (async (runtime) => {
        const url = await resolveServerModule(rootDir, 'app');
        const module = (await import(url)) as {
          createApp?: AppCommandContext['createApp'];
        };
        if (typeof module.createApp !== 'function') {
          throw new Error(
            `Application module "${url}" must export createApp(runtime).`,
          );
        }
        return module.createApp(runtime);
      }),
  };
}

async function resolveServerModule(
  rootDir: string,
  name: string,
): Promise<string> {
  // Source checkouts prefer TypeScript; deployment roots contain JavaScript only.
  for (const extension of ['ts', 'js']) {
    const filename = path.join(rootDir, 'server', `${name}.${extension}`);
    try {
      if ((await stat(filename)).isFile()) return pathToFileURL(filename).href;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
  }
  throw new Error(
    `Application module not found: ${path.join(rootDir, 'server', name)}.{ts,js}`,
  );
}
