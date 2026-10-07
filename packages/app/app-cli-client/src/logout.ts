import type { Command } from '@oclif/core';

import { authRouteOf, type AppCliConfig } from './config.ts';
import { serverPath } from './dynamic/session.ts';
import { AppCommand, UsageError } from './lib/command.ts';
import {
  envValue,
  readUserConfig,
  removeProfile,
  userClient,
} from './lib/credentials.ts';
import { globalFlags } from './lib/globals.ts';
import { AppApiError } from './lib/http.ts';

/** What `logout` answers. */
export interface LogoutResult {
  readonly profile: string;
  readonly server: string;
  /** Whether the server signed the session out; false for an API key, or when the server could not be reached. */
  readonly revoked: boolean;
  readonly dryRun?: boolean;
}

/** `<bin> logout`: forgets a profile's credential here and, for a session a browser sign-in gave, signs it out there. */
export function logoutCommand(app: AppCliConfig): Command.Class {
  return class Logout extends AppCommand {
    static override summary =
      'Sign out: forget the credential here and end the session on the server.';
    static override description =
      'Removes the profile (the current one, or --profile) and its credential from the keychain or config.json. The ' +
      `session \`${app.bin} login\` received in the browser is signed out on the server too; an API key passed with ` +
      '--api-key-stdin stays valid there, to be revoked where it was created.';
    static override supportsDryRun = true;
    static override examples = [
      '<%= config.bin %> logout',
      '<%= config.bin %> logout --profile staging --dry-run',
    ];

    async run(): Promise<LogoutResult> {
      await this.parse(Logout);
      if (envValue(app, process.env, 'API_KEY') !== undefined)
        throw new UsageError(
          `${app.envPrefix}_API_KEY is set: the CLI acts with it, not with a profile. Unset it to sign out.`,
        );
      const user = await readUserConfig({
        paths: this.paths,
        config: app,
        profile: globalFlags().profile,
      }).catch(() => undefined);
      const profile = user?.profile ?? globalFlags().profile;
      if (user === undefined || profile === undefined)
        throw new UsageError(
          `Not signed in${profile ? ` as profile ${profile}` : ''}; nothing to sign out of.`,
        );
      const session = user.kind === 'session';
      if (this.dryRun) {
        this.log(
          `Would forget profile ${profile} (${user.server})${session ? ' and sign its session out on the server' : ''}.`,
        );
        return { profile, server: user.server, revoked: false, dryRun: true };
      }
      let revoked = false;
      if (session)
        try {
          await userClient(user).request(
            'POST',
            serverPath(user.server, authRouteOf(app.auth, '/sign-out')),
            {},
          );
          revoked = true;
        } catch (error) {
          // 401 or 403: the session is no longer valid there anyway.
          if (
            !(error instanceof AppApiError) ||
            (error.status !== 401 && error.status !== 403)
          )
            this.warn(
              `Could not sign the session out on ${user.server} (${error instanceof Error ? error.message : String(error)}); forgot it here.`,
            );
        }
      else
        this.warn(
          `The API key stays valid on ${user.server}: revoke it where it was created.`,
        );
      await removeProfile(profile, { paths: this.paths, config: app });
      this.log(
        `Signed out of ${user.server} (profile ${profile})${revoked ? '; the session is ended' : ''}.`,
      );
      return { profile, server: user.server, revoked };
    }
  };
}
