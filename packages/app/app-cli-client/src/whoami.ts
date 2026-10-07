import { Flags, type Command } from '@oclif/core';

import { EXIT_CODES } from '@nocobase/agent-protocol';

import { z } from 'zod';

import { authRouteOf, type AppCliConfig } from './config.ts';
import { loadManifest, type CliManifest } from './dynamic/manifest.ts';
import { currentSession, serverPath } from './dynamic/session.ts';
import { AppCommand, UsageError } from './lib/command.ts';
import { readUserConfig, userClient } from './lib/credentials.ts';
import { globalFlags } from './lib/globals.ts';

/** What `whoami` answers. */
export interface WhoamiResult {
  readonly server: string;
  readonly kind: 'person' | 'run';
  readonly userId: string;
  readonly displayName: string;
  readonly runId?: string;
  /** Where the credential comes from: a run's file, the environment, or a profile. */
  readonly source: 'run' | 'env' | 'profile';
  readonly profile?: string;
  /** What the profile holds: the session a browser sign-in received, or an API key. */
  readonly credential?: 'session' | 'apiKey';
  /** For a session, when it expires unless used again; the server renews it while the CLI is in use. */
  readonly expiresAt?: string;
  readonly key?: {
    readonly id?: string;
    readonly name?: string;
  };
  readonly actions: readonly string[];
  readonly commands: number;
  /** The commands that need an action the caller does not hold, with that action. */
  readonly missing: readonly {
    readonly command: string;
    readonly action: string;
  }[];
}

/** Better Auth's `GET /get-session`, as far as `whoami` reads it. */
const BetterAuthSessionSchema = z
  .object({
    session: z.object({ expiresAt: z.union([z.string(), z.date()]) }),
  })
  .nullable();

/** `<bin> whoami`: the identity the CLI acts as, as the server sees it, and what it may and may not do. */
export function whoamiCommand(app: AppCliConfig): Command.Class {
  return class Whoami extends AppCommand {
    static override summary = 'Show who the CLI acts as, and what it may do.';
    static override description =
      "Inside a run's working directory the CLI acts as the run, with the token from the run's credentials file; " +
      (app.envPrefix === undefined
        ? ''
        : `with ${app.envPrefix}_API_KEY set it acts with that key; `) +
      `anywhere else it acts as the profile \`${app.bin} login\` signed in. Shows the server, the user, when the ` +
      "session expires (or the key's name), the business actions held, and how many commands need an action you " +
      'lack (--missing lists them).';
    static override flags = {
      missing: Flags.boolean({
        description:
          'List the commands that need an action you do not hold, by that action.',
      }),
    };

    async run(): Promise<WhoamiResult> {
      const { flags } = await this.parse(Whoami);
      const session = await currentSession();
      if (!session)
        throw new UsageError(
          `Not signed in. Run \`${app.bin} login\` first${app.envPrefix ? `, or set ${app.envPrefix}_SERVER and ${app.envPrefix}_API_KEY` : ''}.`,
          EXIT_CODES.auth,
        );
      const manifest: CliManifest = await loadManifest(session);
      const { identity } = manifest;
      const user =
        session.kind === 'user'
          ? await readUserConfig({
              paths: this.paths,
              config: app,
              profile: globalFlags().profile,
            })
          : undefined;
      let expiresAt: string | undefined;
      if (user?.kind === 'session')
        expiresAt = await userClient(user)
          .request(
            'GET',
            serverPath(user.server, authRouteOf(app.auth, '/get-session')),
            undefined,
          )
          .then((answer) => {
            const at = BetterAuthSessionSchema.parse(answer)?.session.expiresAt;
            return at === undefined ? undefined : new Date(at).toISOString();
          })
          .catch(() => undefined);
      const keyName = user?.keyName;
      const missing = (manifest.withheld ?? [])
        .filter((command) => command.reason === 'action' && command.action)
        .map((command) => ({
          command: command.id.split(':').join(' '),
          action: command.action!,
        }));
      const actions = identity.actions ?? [];
      const source: WhoamiResult['source'] =
        session.kind === 'run'
          ? 'run'
          : user?.storage === 'env'
            ? 'env'
            : 'profile';

      this.log(
        identity.kind === 'run'
          ? `Run ${identity.runId ?? ''} acting for ${identity.displayName} (${identity.userId}) on ${session.server}`
          : `${identity.displayName} (${identity.userId}) on ${session.server}`,
      );
      if (source === 'env') this.log(`Key      from ${app.envPrefix}_API_KEY`);
      if (source === 'profile')
        this.log(
          `Profile  ${user?.profile ?? ''}` +
            (user?.kind === 'session'
              ? `, signed in through the browser${expiresAt ? `, session expires ${expiresAt}` : ''}`
              : `, API key${keyName ? ` "${keyName}"` : ''}`),
        );
      this.log(
        `Actions  ${actions.length === 0 ? '(none)' : actions.join(', ')}`,
      );
      this.log(
        `Commands ${manifest.commands.length} offered` +
          (missing.length > 0
            ? `; ${missing.length} need an action you do not hold${flags.missing ? ':' : ` (\`${app.bin} whoami --missing\` lists them)`}`
            : ''),
      );
      if (flags.missing) {
        const byAction = new Map<string, string[]>();
        for (const entry of missing)
          byAction.set(entry.action, [
            ...(byAction.get(entry.action) ?? []),
            entry.command,
          ]);
        for (const [action, commands] of [...byAction].sort(([a], [b]) =>
          a.localeCompare(b),
        ))
          this.log(`  ${action}: ${commands.join(', ')}`);
      }
      return {
        server: session.server,
        kind: identity.kind,
        userId: identity.userId,
        displayName: identity.displayName,
        ...(identity.runId ? { runId: identity.runId } : {}),
        source,
        ...(user?.profile ? { profile: user.profile } : {}),
        ...(user && source === 'profile' ? { credential: user.kind } : {}),
        ...(expiresAt ? { expiresAt } : {}),
        ...(keyName || user?.keyId
          ? {
              key: {
                ...(user?.keyId ? { id: user.keyId } : {}),
                ...(keyName ? { name: keyName } : {}),
              },
            }
          : {}),
        actions,
        commands: manifest.commands.length,
        missing,
      };
    }
  };
}
