// Reads the hooks the registered plugins declare, so `nocobase build` and `nocobase dev` can run them.
//
// The scripts are plain Node and cannot read `cli/plugins.ts`, which is TypeScript and imports each plugin's CLI
// entry. The `build` and `dev` commands run inside the assembled CLI, which already holds those plugins, so they
// collect the hooks there and hand them to the script in `NOCOBASE_CLI_HOOKS`. Nothing is asked of a second process.

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

export const CLI_HOOKS_ENV = 'NOCOBASE_CLI_HOOKS';

const EMPTY = {
  build: {
    beforeBuild: [],
    afterClientBuild: [],
    afterServerBuild: [],
    afterBuild: [],
  },
  dev: { beforeDev: [] },
};

/**
 * The hooks the parent command handed over.
 *
 * A missing variable fails the caller rather than being treated as "no hooks". It means the script was started some
 * other way than through the CLI, and continuing would produce a build that looks successful while silently missing
 * whatever the plugins' hooks contribute — the omission would surface only where the artifact is used.
 *
 * Declaring no hooks is not that case, and is not an error: the variable is then present with four empty stages.
 */
export const readCliHooks = (env = process.env) => {
  const serialized = env[CLI_HOOKS_ENV];
  if (serialized === undefined) {
    throw new Error(
      `${CLI_HOOKS_ENV} is not set. Run this through \`nocobase build\` or \`nocobase dev\`, which pass the plugins' hooks.`,
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (cause) {
    throw new Error(`${CLI_HOOKS_ENV} does not hold JSON.`, { cause });
  }

  return {
    build: { ...EMPTY.build, ...parsed.build },
    dev: { ...EMPTY.dev, ...parsed.dev },
  };
};

/** Runs one stage's hooks in order, through the caller's own step runner so they look like every other step. */
export const runHookStage = (hooks, stage, run) => {
  for (const hook of hooks[stage] ?? []) {
    run(hook.label, hook.command[0], hook.command.slice(1));
  }
};

export const CLI_PLUGIN_REGISTRATIONS_ENV = 'NOCOBASE_CLI_PLUGIN_REGISTRATIONS';

/**
 * The packages `cli/plugins.ts` registers, as `nocobase build` read them with the application's TypeScript, which the
 * build writes to `dist/cli/plugins.json`. Missing fails the build for the same reason missing hooks do: a deployment
 * built without it would show every CLI-only plugin as not enabled.
 */
export const readCliPluginRegistrations = (env = process.env) => {
  const serialized = env[CLI_PLUGIN_REGISTRATIONS_ENV];
  if (serialized === undefined) {
    throw new Error(
      `${CLI_PLUGIN_REGISTRATIONS_ENV} is not set. Run this through \`nocobase build\`, which passes the CLI plugins it registers.`,
    );
  }
  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (cause) {
    throw new Error(`${CLI_PLUGIN_REGISTRATIONS_ENV} does not hold JSON.`, {
      cause,
    });
  }
  if (
    !Array.isArray(parsed?.plugins) ||
    !parsed.plugins.every((name) => typeof name === 'string')
  ) {
    throw new Error(
      `${CLI_PLUGIN_REGISTRATIONS_ENV} must hold { "plugins": [package names] }.`,
    );
  }
  if (
    parsed.sourceHash !== undefined &&
    parsed.sourceHash !== null &&
    typeof parsed.sourceHash !== 'string'
  ) {
    throw new Error(
      `${CLI_PLUGIN_REGISTRATIONS_ENV} sourceHash must be a string or null.`,
    );
  }
  return { plugins: parsed.plugins, sourceHash: parsed.sourceHash ?? null };
};

/**
 * Fails when `cli/plugins.ts` no longer holds what the list was read from: a hook rewrote it during the build, so the
 * compiled CLI and the list written beside it would disagree. The list cannot be read again here, since that needs
 * the application's TypeScript compiler and the build script runs without loading it.
 */
export const assertCliPluginRegistrationsCurrent = (registrations, rootDir) => {
  const source = path.join(rootDir, 'cli', 'plugins.ts');
  const current = fs.existsSync(source)
    ? createHash('sha256').update(fs.readFileSync(source)).digest('hex')
    : null;
  if (current !== (registrations.sourceHash ?? null)) {
    throw new Error(
      'cli/plugins.ts changed during the build, after `nocobase build` read the CLI plugins it registers. Generate or edit it before running the build, then build again.',
    );
  }
};
