import { appPath } from '@nocobase/app-cli';
import { type Command, Flags, type Interfaces } from '@oclif/core';

import { runBuild } from '../build.ts';
import { HubCliError } from '../errors.ts';
import { publish, type DeployResult } from '../publish.ts';
import { HubCommand, remoteFlag, timeoutFlag } from './hub-command.ts';

export default class HubDeploy extends HubCommand {
  static override summary = 'Deploy this application to the Hub.';
  static override description =
    "Builds the application for the platform the Hub runs Apps on, uploads the archive as a Release of the remote's App and deploys it, then waits for the deployment to finish. With --release-id, deploys a Release already on the Hub instead: one hub upload created, or an earlier Release to roll back to. When the Hub already has the archive, its Release is deployed.\n\nThe remote comes from --remote or the default remote in .nocobase/hub.json; the API key is the one hub auth login saved for it. Retrying with the same --idempotency-key is safe when a run could not confirm its result; deploying again what the App's latest deployment already deploys needs a new key.";

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --remote production --json',
    '<%= config.bin %> <%= command.id %> --config ./runtime.yml',
    '<%= config.bin %> <%= command.id %> --release-id <release-id>',
    '<%= config.bin %> <%= command.id %> --no-build',
  ];

  static override flags: {
    remote: Interfaces.OptionFlag<string | undefined>;
    build: Interfaces.BooleanFlag<boolean | undefined>;
    file: Interfaces.OptionFlag<string | undefined>;
    'release-id': Interfaces.OptionFlag<string | undefined>;
    config: Interfaces.OptionFlag<string | undefined>;
    wait: Interfaces.BooleanFlag<boolean>;
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
    'release-id': Flags.string({
      exclusive: ['file'],
      description:
        'Deploy this Release, already on the Hub, instead of building and uploading.',
    }),
    config: appPath({
      description:
        'Runtime YAML configuration to deploy with, relative to the current directory. Omit to reuse the current Hub configuration.',
    }),
    wait: Flags.boolean({
      default: true,
      allowNo: true,
      description:
        'Wait for deployment success (default). Use --no-wait to return after acceptance.',
    }),
    'idempotency-key': Flags.string({
      description:
        'Retry identity of the deployment. Defaults to a digest of the App and Release IDs and the --config content, moved on past earlier deployments of them the App has since replaced. Use a new key to deploy again what the App already runs.',
    }),
    timeout: timeoutFlag,
  };

  protected readonly failureCode = 'DEPLOY_FAILED';
  protected readonly failureMessage = 'Deployment failed.';

  override async run(): Promise<DeployResult> {
    const { flags } = await this.parse(HubDeploy);
    return await this.report(async () => {
      const skipsBuild =
        flags.file !== undefined || flags['release-id'] !== undefined;
      if (flags.build === true && skipsBuild)
        throw new HubCliError(
          'CONFLICTING_FLAGS',
          '--build cannot be combined with --file or --release-id, which deploy an archive or Release that already exists.',
          2,
        );
      const remote = await this.remote(flags.remote);
      const apiKey = await this.apiKey(remote);
      const { result, warning } = await publish({
        target: remote,
        apiKey,
        root: this.rootDir,
        deploy: true,
        wait: flags.wait,
        timeout: flags.timeout,
        onProgress: (message) => {
          this.logToStderr(message);
        },
        ...(flags.build === false || skipsBuild
          ? {}
          : {
              build: (args: readonly string[]) =>
                runBuild(this.cliCommand(['build', ...args]), this.rootDir),
            }),
        ...(flags.file === undefined ? {} : { file: flags.file }),
        ...(flags['release-id'] === undefined
          ? {}
          : { releaseId: flags['release-id'] }),
        ...(flags.config === undefined ? {} : { config: flags.config }),
        ...(flags['idempotency-key'] === undefined
          ? {}
          : { idempotencyKey: flags['idempotency-key'] }),
      });
      this.log(
        `Deployment ${result.operationId} of Release ${result.releaseId} to ${remote.name}: ${result.operationStatus}.`,
      );
      if (warning !== undefined) this.warn(warning);
      if (result.reused) this.setStatus('success-noop');
      return result;
    });
  }
}
