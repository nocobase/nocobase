// `--pass-env NAME` on `start` and `service install`: names the runner always passes from its environment to every run,
// and provides to a run that asks for them by name. Given names are added to the ones remembered in the settings;
// `nocobase-runner env unset NAME` forgets one.
import { Flags, type Interfaces } from '@oclif/core';

import { ENV_NAME_PATTERN, forbidden } from '../agent/env.ts';
import { UsageError } from './command.ts';
import { writeSettings, type RunnerSettings } from './config.ts';
import type { RunnerPaths } from './home.ts';

export const passEnvFlag: Interfaces.OptionFlag<string[] | undefined> =
  Flags.string({
    description:
      'A variable to pass from this environment to every run, and to provide to a run that asks for it by name ' +
      '(repeatable). Remembered for later starts.',
    multiple: true,
  });

/** Checks a variable name the runner's owner gives. */
export function checkEnvName(name: string): string {
  if (!ENV_NAME_PATTERN.test(name))
    throw new UsageError(
      `Not a variable name: ${name}. Use letters, digits and underscores, not starting with a digit.`,
    );
  if (forbidden(name))
    throw new UsageError(
      `${name} is set by the runner itself and cannot be passed.`,
    );
  return name;
}

/** Adds the given names to the remembered ones and saves the settings when that changed them. */
export async function rememberPassEnv(
  settings: RunnerSettings,
  names: readonly string[] | undefined,
  paths: RunnerPaths,
): Promise<RunnerSettings> {
  if (names === undefined || names.length === 0) return settings;
  const current = settings.passEnv ?? [];
  const added = names
    .map(checkEnvName)
    .filter((name, index, all) => all.indexOf(name) === index)
    .filter((name) => !current.includes(name));
  if (added.length === 0) return settings;
  const next = { ...settings, passEnv: [...current, ...added] };
  await writeSettings(next, paths);
  return next;
}
