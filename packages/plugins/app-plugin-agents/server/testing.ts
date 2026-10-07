/**
 * For an application's tests of what it builds on this plugin: the services assembled against a database the test
 * opens, this plugin's migrations, the run and runner routes to mount on a test server with the test's own
 * authentication, the run token as a credential of the application's authentication and the plugin's part of the
 * command manifest, and the online executor to run over a scripted model gateway. Not for production code: the plugin's
 * providers and routes assemble and mount these there.
 */
import path from 'node:path';

export { createAgents, type AgentsDeps } from './composition.js';
export { runCredentialResolver } from './cli/run-credential.js';
export {
  bindCliSurface,
  type CliSurface,
  type CliSurfaceOptions,
} from './cli/surface.js';
export {
  cliCommand,
  createServerExecutor,
  onlineTools,
  type CommandSurface,
} from './online/index.js';
export {
  scriptedModels,
  scriptedSteps,
  type ScriptedModels,
  type Step as ScriptedStep,
} from './online/scripted.js';
export { createRunRoutes, type RunEnv } from './routes/run.js';
export { createRosterRoutes } from './routes/roster.js';
export {
  createAdminRoutes as createRunnersAdminRoutes,
  type AdminCaller as RunnersAdminCaller,
  type AdminEnv as RunnersAdminEnv,
} from './routes/runners/admin.js';
export {
  createDistRoutes,
  type DistRoutesOptions,
} from './routes/runners/dist.js';
export { createInstallRoutes } from './routes/runners/install.js';
export {
  createRunnerRoutes,
  type RunnerRoutesOptions,
} from './routes/runners/runner.js';

/** This plugin's migrations, for `createMigrator({ directory, packageName: AGENTS_PACKAGE })`. */
export const AGENTS_MIGRATIONS: string = path.resolve(
  import.meta.dirname,
  '../database/migrations',
);

/** The package name the migrations are recorded under. */
export const AGENTS_PACKAGE = '@nocobase/app-plugin-agents';
