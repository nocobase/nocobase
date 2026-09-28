import { appPath } from '@nocobase/app-cli';
import { type Command, Flags, type Interfaces } from '@oclif/core';

import {
  DEFAULT_ARTIFACT,
  publishRelease,
  type PublishedRelease,
  type PublishingOptions,
  type ReleaseDeployResult,
  type ReleaseUploadResult,
} from '../hub-publishing.ts';
import { HubCommand } from './hub-command.ts';

/** What `hub deploy` reports: the uploaded Release and its deployment, or the deployment of an existing Release. */
export type HubDeployResult = ReleaseUploadResult | ReleaseDeployResult;

export default class HubDeploy extends HubCommand<HubDeployResult> {
  static override summary = 'Deploy this application to the Hub.';
  static override description =
    'Without --release-id, uploads the archive `nocobase build --tar` writes, storage/exports/dist.tar.gz, as a new Release of the App and deploys it in one request. With --release-id, deploys a Release already on the Hub instead: one `hub upload` created, or an earlier Release to roll back to. Either way it waits for the deployment to finish unless --no-wait is given.\n\nThe Hub, App ID and API key come from the flags, then HUB_URL, HUB_APP_ID and HUB_API_KEY in the environment, then the App root .env. Retrying with the same --idempotency-key is safe when a run could not confirm its result; deploying the same Release again needs a new key.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
    '<%= config.bin %> <%= command.id %> --config ./runtime.yml',
    '<%= config.bin %> <%= command.id %> --release-id <release-id>',
    '<%= config.bin %> <%= command.id %> --release-id <release-id> --no-wait --json',
  ];

  static override flags: {
    config: Interfaces.OptionFlag<string | undefined>;
    hub: Interfaces.OptionFlag<string | undefined>;
    'app-id': Interfaces.OptionFlag<string | undefined>;
    'api-key': Interfaces.OptionFlag<string | undefined>;
    file: Interfaces.OptionFlag<string>;
    'release-id': Interfaces.OptionFlag<string | undefined>;
    'idempotency-key': Interfaces.OptionFlag<string | undefined>;
    wait: Interfaces.BooleanFlag<boolean>;
    timeout: Interfaces.OptionFlag<number>;
  } = {
    config: appPath({
      description:
        'Runtime YAML configuration to deploy with, relative to the current directory. Omit to reuse the current Hub configuration.',
    }),
    hub: Flags.string({
      description:
        'Hub application URL, including its base path. Defaults to HUB_URL in the environment or App root .env.',
    }),
    'app-id': Flags.string({
      description:
        'Target App ID. Defaults to HUB_APP_ID in the environment or App root .env.',
    }),
    'api-key': Flags.string({
      description:
        'Publishing API key. Defaults to HUB_API_KEY in the environment or App root .env.',
    }),
    file: appPath({
      default: DEFAULT_ARTIFACT,
      description:
        'Archive to upload and deploy, relative to the current directory.',
    }),
    'release-id': Flags.string({
      exclusive: ['file'],
      description:
        'Deploy this Release, already on the Hub, instead of uploading the archive.',
    }),
    'idempotency-key': Flags.string({
      description:
        'Retry identity. Defaults to the archive SHA-256, or with --release-id to a digest of the App and Release IDs and the --config content. Use a new key to deploy the same Release again.',
    }),
    wait: Flags.boolean({
      default: true,
      allowNo: true,
      description:
        'Wait for deployment success (default). Use --no-wait to return after acceptance.',
    }),
    timeout: Flags.integer({
      default: 600,
      description: 'Request and wait deadline in seconds.',
    }),
  };

  protected readonly failureCode = 'DEPLOY_FAILED';
  protected readonly failureMessage = 'Deployment failed.';

  protected async parseFlags(): Promise<PublishingOptions> {
    return (await this.parse(HubDeploy)).flags;
  }

  protected publish(
    flags: PublishingOptions,
    root: string,
  ): Promise<PublishedRelease<HubDeployResult>> {
    if (flags['release-id'] !== undefined) {
      return publishRelease('deploy', flags, root);
    }
    return publishRelease('upload', { ...flags, deploy: true }, root);
  }

  protected describe(result: HubDeployResult): string {
    const deployment = `Deployment ${String(result.operationId)}: ${result.operationStatus ?? 'accepted'}. Retry key: ${result.idempotencyKey}.`;
    return 'checksum' in result
      ? `Release ${result.releaseId} uploaded${result.reused ? ' (reused)' : ''}. ${deployment}`
      : deployment;
  }
}
