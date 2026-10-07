// `<bin> profile list|use|remove`: the servers the CLI is signed in to, one profile each (`lib/credentials.ts`).
import { createInterface } from 'node:readline/promises';

import { Args, type Command } from '@oclif/core';

import { EXIT_CODES } from '@nocobase/agent-protocol';

import type { AppCliConfig } from './config.ts';
import { AppCommand, UsageError } from './lib/command.ts';
import {
  checkProfileName,
  listProfiles,
  removeProfile,
  useProfile,
  type ProfileSummary,
} from './lib/credentials.ts';
import { CliCommandError } from './lib/envelope.ts';
import { describeStorage } from './lib/secrets/index.ts';

export function profileCommands(
  app: AppCliConfig,
): Record<string, Command.Class> {
  class List extends AppCommand {
    static override summary = 'List the profiles: one per server signed in to.';

    async run(): Promise<{ profiles: ProfileSummary[] }> {
      await this.parse(List);
      const profiles = await listProfiles({ paths: this.paths, config: app });
      if (profiles.length === 0)
        this.log(`No profiles. Sign in with \`${app.bin} login\`.`);
      for (const profile of profiles)
        this.log(
          `${profile.current ? '*' : ' '} ${profile.name.padEnd(12)} ${profile.server}  ${profile.keyName ? `"${profile.keyName}", ` : ''}${describeStorage(profile.storage, 'config.json')}`,
        );
      return { profiles };
    }
  }

  class Use extends AppCommand {
    static override summary = 'Make a profile the current one.';
    static override args = {
      name: Args.string({ description: 'The profile.', required: true }),
    };
    static override examples = ['<%= config.bin %> profile use staging'];

    async run(): Promise<{ current: string }> {
      const { args } = await this.parse(Use);
      await useProfile(checkProfileName(args.name), {
        paths: this.paths,
        config: app,
      });
      this.log(`Using profile ${args.name}.`);
      return { current: args.name };
    }
  }

  class Remove extends AppCommand {
    static override summary =
      'Forget a profile and its key here, leaving the key valid on the server.';
    static override description = `To revoke the key too, run \`${app.bin} logout --profile <name>\` instead.`;
    static override supportsDryRun = true;
    static override args = {
      name: Args.string({ description: 'The profile.', required: true }),
    };

    async run(): Promise<{
      removed: string;
      server: string;
      dryRun?: boolean;
    }> {
      const { args } = await this.parse(Remove);
      const name = checkProfileName(args.name);
      const known = (
        await listProfiles({ paths: this.paths, config: app })
      ).find((profile) => profile.name === name);
      if (!known)
        throw new UsageError(
          `There is no profile ${name}.`,
          EXIT_CODES.notFound,
        );
      if (this.dryRun) {
        this.log(`Would forget profile ${name} (${known.server}).`);
        return { removed: name, server: known.server, dryRun: true };
      }
      if (!this.yes) {
        if (!process.stdin.isTTY || !process.stderr.isTTY)
          throw new CliCommandError(
            'CONFIRMATION_REQUIRED',
            `Forget profile ${name} (${known.server})? Nothing was done without a terminal to ask in.`,
            {
              exit: EXIT_CODES.validation,
              suggestions: [
                { message: 'Pass --yes to go ahead without asking.' },
              ],
            },
          );
        const lines = createInterface({
          input: process.stdin,
          output: process.stderr,
        });
        const answer = await lines
          .question(`Forget profile ${name} (${known.server})? [y/N] `)
          .finally(() => lines.close());
        if (!/^y(es)?$/iu.test(answer.trim()))
          throw new UsageError('Not done.', EXIT_CODES.general);
      }
      await removeProfile(name, { paths: this.paths, config: app });
      this.log(`Forgot profile ${name}.`);
      return { removed: name, server: known.server };
    }
  }

  return { 'profile:list': List, 'profile:use': Use, 'profile:remove': Remove };
}
