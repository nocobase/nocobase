// `<bin> acp start`: connects this computer to the signed-in person's agent sessions and keeps it connected until it
// is stopped. The bridge itself is `@nocobase/acp-bridge`; this command hands it the server, the person's credentials
// and the file that remembers this computer for the profile.
import { createHash } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

import { Flags, type Command } from '@oclif/core';

import { BridgeStopped, runBridge } from '@nocobase/acp-bridge';
import { EXIT_CODES } from '@nocobase/agent-protocol';

import type { AppCliConfig } from './config.ts';
import { currentSession } from './dynamic/session.ts';
import { AppCommand, UsageError } from './lib/command.ts';

export function acpCommands(app: AppCliConfig): Record<string, Command.Class> {
  return {
    'acp:start': class AcpStart extends AppCommand {
      static override summary = 'Run your agent sessions on this computer.';
      static override description =
        `Connects this computer to ${app.displayName} as the signed-in person, so the sessions you start there run ` +
        'here with Codex or OpenCode, in the directories you allow. It stays connected until you stop it with Ctrl+C; ' +
        'stopping it stops the agents it started.';
      static override examples = [
        `${app.bin} acp start`,
        `${app.bin} acp start --name "Work laptop" --root ~/code`,
      ];
      static override flags = {
        name: Flags.string({
          description:
            "The computer's name in the application; its host name by default.",
        }),
        root: Flags.string({
          description:
            'A directory sessions may work in; repeat for several. Your home directory by default.',
          multiple: true,
        }),
      };

      async run(): Promise<void> {
        const { flags } = await this.parse(AcpStart);
        const session = await currentSession();
        if (session?.kind !== 'user') {
          throw new UsageError(
            session
              ? "An agent's run cannot connect a computer. Run this outside the run's working directory."
              : `Not signed in. Run \`${app.bin} login\` first.`,
            EXIT_CODES.auth,
          );
        }
        const stop = new AbortController();
        const onSignal = (): void => stop.abort();
        process.once('SIGINT', onSignal);
        process.once('SIGTERM', onSignal);
        try {
          await runBridge({
            server: session.server,
            headers: session.headers,
            client: { name: app.bin, version: this.config.version },
            stateFile: path.join(
              this.paths.home,
              'acp',
              `${createHash('sha256').update(session.cacheKey).update(session.server).digest('hex').slice(0, 16)}.json`,
            ),
            ...(flags.name ? { name: flags.name } : {}),
            ...(flags.root
              ? {
                  roots: flags.root.map((root) =>
                    path.resolve(expandHome(root)),
                  ),
                }
              : {}),
            signal: stop.signal,
            log: (message) => this.log(message),
          });
          this.log('Disconnected.');
        } catch (error) {
          if (error instanceof BridgeStopped)
            throw new UsageError(error.message, EXIT_CODES.auth);
          throw error;
        } finally {
          process.off('SIGINT', onSignal);
          process.off('SIGTERM', onSignal);
        }
      }
    },
  };
}

function expandHome(dir: string): string {
  return dir === '~' || dir.startsWith('~/')
    ? path.join(os.homedir(), dir.slice(1))
    : dir;
}
