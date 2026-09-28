import { appPath } from '@nocobase/app-cli';
import { type Command, Flags, type Interfaces } from '@oclif/core';

import {
  DEFAULT_ARTIFACT,
  publishRelease,
  type PublishedRelease,
  type PublishingOptions,
  type ReleaseUploadResult,
} from '../hub-publishing.ts';
import { HubCommand } from './hub-command.ts';

export default class HubUpload extends HubCommand<ReleaseUploadResult> {
  static override summary =
    'Upload an application release to the Hub without deploying it.';
  static override description =
    'Uploads the archive `nocobase build --tar` writes, storage/exports/dist.tar.gz, as a new Release of the App on the Hub, and reports its Release ID. The Release is immutable: uploading the same archive again returns the existing Release instead of creating another. Deploy it later with `hub deploy --release-id`, or upload and deploy in one step with `hub deploy`.\n\nThe Hub, App ID and API key come from the flags, then HUB_URL, HUB_APP_ID and HUB_API_KEY in the environment, then the App root .env. Retrying with the same --idempotency-key is safe when a run could not confirm its result.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --json',
    '<%= config.bin %> <%= command.id %> --file ./artifacts/dist.tar.gz',
  ];

  static override flags: {
    hub: Interfaces.OptionFlag<string | undefined>;
    'app-id': Interfaces.OptionFlag<string | undefined>;
    'api-key': Interfaces.OptionFlag<string | undefined>;
    file: Interfaces.OptionFlag<string>;
    'idempotency-key': Interfaces.OptionFlag<string | undefined>;
    timeout: Interfaces.OptionFlag<number>;
  } = {
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
      description: 'Archive to upload, relative to the current directory.',
    }),
    'idempotency-key': Flags.string({
      description: 'Retry identity. Defaults to the archive SHA-256.',
    }),
    timeout: Flags.integer({
      default: 600,
      description: 'Request deadline in seconds.',
    }),
  };

  protected readonly failureCode = 'UPLOAD_FAILED';
  protected readonly failureMessage = 'Upload failed.';

  protected async parseFlags(): Promise<PublishingOptions> {
    return (await this.parse(HubUpload)).flags;
  }

  protected publish(
    flags: PublishingOptions,
    root: string,
  ): Promise<PublishedRelease<ReleaseUploadResult>> {
    return publishRelease('upload', flags, root);
  }

  protected describe(result: ReleaseUploadResult): string {
    return `Release ${result.releaseId} uploaded${result.reused ? ' (reused)' : ''}. Deploy it with hub deploy --release-id ${result.releaseId}.`;
  }
}
