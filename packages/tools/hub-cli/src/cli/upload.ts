import { appPath } from '@nocobase/app-cli';
import { type Command, Flags, type Interfaces } from '@oclif/core';

import { runBuild } from '../build.ts';
import { HubCliError } from '../errors.ts';
import { publish, type UploadResult } from '../publish.ts';
import { HubCommand, remoteFlag, timeoutFlag } from './hub-command.ts';

export default class HubUpload extends HubCommand {
  static override summary =
    'Upload this application to the Hub as a Release, without deploying it.';
  static override description =
    "Builds the application for the platform the Hub runs Apps on and uploads the archive as a new Release of the remote's App, then reports its Release ID. The Release is immutable: uploading the same archive again returns the existing Release. Deploy it later with hub deploy --release-id. Use it when a key may only upload, such as in CI that hands deployment to a person; otherwise hub deploy uploads and deploys in one step.\n\nThe remote comes from --remote or the default remote in .nocobase/hub.json; the API key is the one hub auth login saved for it.";

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --remote production --json',
    '<%= config.bin %> <%= command.id %> --file ./artifacts/dist.tar.gz',
  ];

  static override flags: {
    remote: Interfaces.OptionFlag<string | undefined>;
    build: Interfaces.BooleanFlag<boolean | undefined>;
    file: Interfaces.OptionFlag<string | undefined>;
    'idempotency-key': Interfaces.OptionFlag<string | undefined>;
    timeout: Interfaces.OptionFlag<number>;
  } = {
    remote: remoteFlag,
    build: Flags.boolean({
      allowNo: true,
      description:
        'Build for the Hub before uploading (the default). Use --no-build to upload the archive storage/exports/dist.tar.gz as it is.',
    }),
    file: appPath({
      description:
        'Archive to upload instead of building, relative to the current directory.',
    }),
    'idempotency-key': Flags.string({
      description:
        'Retry identity of the upload. Defaults to the archive SHA-256.',
    }),
    timeout: timeoutFlag,
  };

  protected readonly failureCode = 'UPLOAD_FAILED';
  protected readonly failureMessage = 'Upload failed.';

  override async run(): Promise<UploadResult> {
    const { flags } = await this.parse(HubUpload);
    return await this.report(async () => {
      if (flags.build === true && flags.file !== undefined)
        throw new HubCliError(
          'CONFLICTING_FLAGS',
          '--build cannot be combined with --file, which uploads an archive that already exists.',
          2,
        );
      const remote = await this.remote(flags.remote);
      const apiKey = await this.apiKey(remote);
      const { result } = await publish({
        target: remote,
        apiKey,
        root: this.rootDir,
        deploy: false,
        timeout: flags.timeout,
        onProgress: (message) => {
          this.logToStderr(message);
        },
        ...(flags.build === false || flags.file !== undefined
          ? {}
          : {
              build: (args: readonly string[]) =>
                runBuild(this.cliCommand(['build', ...args]), this.rootDir),
            }),
        ...(flags.file === undefined ? {} : { file: flags.file }),
        ...(flags['idempotency-key'] === undefined
          ? {}
          : { idempotencyKey: flags['idempotency-key'] }),
      });
      this.log(
        `Release ${result.releaseId} uploaded to ${remote.name}${result.reused ? ' (the Hub already had it)' : ''}. Deploy it with hub deploy --release-id ${result.releaseId}.`,
      );
      if (result.reused) this.setStatus('success-noop');
      return result;
    });
  }
}
