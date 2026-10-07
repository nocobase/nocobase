// The static command map oclif reads (`commands.strategy: 'explicit'`). `runAppCli` fills it before oclif loads it:
// `login`, `logout`, `whoami`, `profile …`, `docs`, `completion`, `update` for a CLI that updates itself, and whatever static commands the application CLI
// adds. Business commands are not here: they come from the server's command manifest (src/dynamic/) through the
// `command_not_found` hook.
import type { Command } from '@oclif/core';

import { completionCommands } from './completion.ts';
import type { AppCliConfig } from './config.ts';
import { docsCommand } from './docs.ts';
import { loginCommand } from './login.ts';
import { logoutCommand } from './logout.ts';
import { profileCommands } from './profile.ts';
import { updateCommand } from './update.ts';
import { whoamiCommand } from './whoami.ts';

export const COMMANDS: Record<string, Command.Class> = {};

/** The topics of the static commands, for help. */
export const STATIC_TOPICS: Readonly<Record<string, { description: string }>> =
  {
    profile: {
      description: 'The servers you are signed in to, one profile each.',
    },
  };

export function defineCommands(
  config: AppCliConfig,
  extra: Readonly<Record<string, Command.Class>> = {},
): void {
  for (const key of Object.keys(COMMANDS)) delete COMMANDS[key];
  Object.assign(
    COMMANDS,
    {
      login: loginCommand(config),
      logout: logoutCommand(config),
      whoami: whoamiCommand(config),
      docs: docsCommand(config),
      ...profileCommands(config),
      ...completionCommands(config),
      ...(config.selfUpdate === undefined
        ? {}
        : { update: updateCommand(config) }),
    },
    extra,
  );
}
