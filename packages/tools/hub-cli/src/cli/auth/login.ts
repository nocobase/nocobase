import { type Command, Flags, type Interfaces } from '@oclif/core';

import { credentialsPath, saveKey } from '../../credentials.ts';
import { HubCliError } from '../../errors.ts';
import { HubClient } from '../../hub-client.ts';
import { HubCommand, remoteFlag, timeoutFlag } from '../hub-command.ts';
import { promptHidden, readStdin } from './input.ts';

export interface AuthLoginResult {
  remote: string;
  url: string;
  appId: string;
  credentialsFile: string;
}

export default class HubAuthLogin extends HubCommand {
  static override summary = "Save the API key for a remote's App.";
  static override description =
    "Asks for an API key created on the Hub's API Keys page, checks with the Hub that it opens the remote's App, and saves it in the user's configuration directory, never in the project. A Hub API key is bound to its Apps when it is created, so each remote is logged in once. --with-token reads the key from standard input instead, for CI.";

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --remote production',
    'echo "$HUB_KEY" | <%= config.bin %> <%= command.id %> --remote production --with-token',
  ];

  static override flags: {
    remote: Interfaces.OptionFlag<string | undefined>;
    'with-token': Interfaces.BooleanFlag<boolean>;
    timeout: Interfaces.OptionFlag<number>;
  } = {
    remote: remoteFlag,
    'with-token': Flags.boolean({
      default: false,
      description:
        'Read the API key from standard input instead of asking for it.',
    }),
    timeout: timeoutFlag,
  };

  protected readonly failureCode = 'LOGIN_FAILED';
  protected readonly failureMessage = 'The API key could not be saved.';

  override async run(): Promise<AuthLoginResult> {
    const { flags } = await this.parse(HubAuthLogin);
    return await this.report(async () => {
      const remote = await this.remote(flags.remote);
      let apiKey: string;
      if (flags['with-token']) {
        apiKey = (await readStdin()).trim();
      } else if (process.stdin.isTTY) {
        apiKey = (
          await promptHidden(`API key for ${remote.name} (${remote.url}): `)
        ).trim();
      } else {
        throw new HubCliError(
          'MISSING_TOKEN',
          'No terminal to ask for the API key. Pipe it to --with-token.',
          2,
        );
      }
      if (!apiKey || /[\s]/.test(apiKey))
        throw new HubCliError(
          'MISSING_TOKEN',
          'No API key was read. Paste the key the Hub showed when it was created.',
          2,
        );
      // Reading the App proves the key opens it, whichever of upload and deploy it was created with.
      await new HubClient({
        target: remote,
        apiKey,
        timeout: flags.timeout,
      }).getApp();
      await saveKey(remote.url, apiKey);
      const credentialsFile = credentialsPath();
      this.log(`API key for ${remote.name} saved in ${credentialsFile}.`);
      return {
        remote: remote.name,
        url: remote.url,
        appId: remote.appId,
        credentialsFile,
      };
    });
  }
}
