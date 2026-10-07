// A branded command line for a NocoBase application. It ships no business commands: `login`, `logout`, `whoami`,
// `profile`, `docs` and `completion` are its own, and every other command comes from the command manifest the
// application publishes for the caller (`GET /api/cli/manifest`), each a request to one API route.
//
// An application declares its CLI under `nocobase.cli` in its `package.json` (`AppCliBrand`), and `nocobase cli build`
// of `@nocobase/app-cli` packages it with an entry that calls `runAppCliPackage`. A CLI may also call `runAppCli` with
// an `AppCliConfig` of its own and add static commands. A CLI the application's install script installs names
// `selfUpdate` and gets `<bin> update`; the installation layout is `@nocobase/app-cli-client/install`.
export { runAppCli, type RunAppCliOptions } from './run.ts';
export {
  appCliConfigOf,
  readAppCliPackage,
  runAppCliPackage,
  type AppCliBrand,
  type AppCliPackageInfo,
} from './brand.ts';
export type {
  AppCliAuth,
  AppCliConfig,
  AppCliSelfUpdate,
  AppCliSession,
} from './config.ts';
export {
  HINT_INTERVAL_MS,
  updateCli,
  updatedBy,
  updateHint,
  type CliUpdateResult,
  type UpdatedBy,
  type UpdateEnvironment,
} from './update.ts';
export { currentSession, type Session } from './dynamic/session.ts';
export type {
  CliCommand,
  CliManifest,
  CliParameter,
  CliWithheldCommand,
} from './dynamic/manifest.ts';
export {
  fillRequest,
  requestText,
  type FilledRequest,
  type RequestCommand,
  type RequestParameter,
} from './request.ts';
