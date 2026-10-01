import { type Command, Flags, type Interfaces } from '@oclif/core';

import { describeTarget } from '../build.ts';
import { HubCliError } from '../errors.ts';
import { HubClient, type ReleaseInfo } from '../hub-client.ts';
import { HubCommand, remoteFlag, timeoutFlag } from './hub-command.ts';

export interface ReleasesResult {
  releases: ReleaseInfo[];
}

export default class HubReleases extends HubCommand {
  static override summary =
    "List this application's Releases on the Hub, newest first.";
  static override description =
    "Reports each Release of the remote's App: its ID, version, archive checksum and size, when it was uploaded, the platform it was built for, whether it is what the App runs now and whether it was ever deployed successfully. Deploy one with hub deploy --release-id, such as to roll back. The API key may hold either publishing permission.";

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --remote production --limit 5 --json',
    '<%= config.bin %> <%= command.id %> --release-id <release-id>',
  ];

  static override flags: {
    remote: Interfaces.OptionFlag<string | undefined>;
    'release-id': Interfaces.OptionFlag<string | undefined>;
    limit: Interfaces.OptionFlag<number>;
    timeout: Interfaces.OptionFlag<number>;
  } = {
    remote: remoteFlag,
    'release-id': Flags.string({
      description: 'Report only this Release.',
    }),
    limit: Flags.integer({
      default: 20,
      description: 'How many Releases to list, 1–100.',
    }),
    timeout: timeoutFlag,
  };

  protected readonly failureCode = 'RELEASES_FAILED';
  protected readonly failureMessage = 'The Releases could not be read.';

  override async run(): Promise<ReleasesResult> {
    const { flags } = await this.parse(HubReleases);
    return await this.report(async () => {
      if (flags.limit < 1 || flags.limit > 100)
        throw new HubCliError(
          'INVALID_LIMIT',
          '--limit must be between 1 and 100.',
          2,
        );
      const remote = await this.remote(flags.remote);
      const client = new HubClient({
        target: remote,
        apiKey: await this.apiKey(remote),
        timeout: flags.timeout,
      });
      const releases =
        flags['release-id'] === undefined
          ? await client.listReleases(flags.limit)
          : [await client.getRelease(flags['release-id'])];
      if (releases.length === 0)
        this.log(
          `${remote.name} has no Releases yet. Publish one with hub deploy.`,
        );
      for (const release of releases)
        this.log(
          [
            release.running ? '*' : ' ',
            release.releaseId,
            release.version,
            release.uploadedAt,
            release.buildTarget === null
              ? 'unknown target'
              : describeTarget(release.buildTarget),
            release.running
              ? 'running'
              : release.everDeployed
                ? 'deployed before'
                : 'never deployed',
          ].join('\t'),
        );
      return { releases };
    });
  }
}
