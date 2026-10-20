import type { AppRuntimeContext } from './definition.js';
import { Application, type ApplicationConfig } from '../application/index.js';
import { onceAsync } from './lifecycle.js';
import type { AppLifecycle } from './types.js';

/** Starts an application and binds its shutdown to the host-owned scope. */
export async function startApplicationInScope(
  scope: AppLifecycle,
  app: Application,
): Promise<Application> {
  scope.registerDisposer(
    'application',
    onceAsync(() => app.shutdown()),
  );
  await app.start();
  return app;
}

/** Create the application without starting services or registering contributions. */
export function createAppFromRuntime(runtime: AppRuntimeContext): Application {
  const app = new Application<ApplicationConfig>({
    config: runtime.config,
    mode: runtime.mode,
    nodeEnv: runtime.env.NODE_ENV,
    strictStartup: runtime.env.NOCOBASE_STRICT_STARTUP === 'true',
    paths: runtime.paths,
    runtimeLogging: runtime.scope.logging,
    consoleLogStream: runtime.scope.consoleLogStream,
  });
  runtime.app = app;
  return app;
}
