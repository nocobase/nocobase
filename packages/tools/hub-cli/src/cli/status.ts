import { type Command, Flags, type Interfaces } from '@oclif/core';

import { describeTarget } from '../build.ts';
import type { DeploymentStatus } from '../errors.ts';
import {
  HubClient,
  type BuildTarget,
  type DeploymentInfo,
} from '../hub-client.ts';
import { HubCommand, remoteFlag, timeoutFlag } from './hub-command.ts';

export interface StatusConnection {
  remote: string;
  hub: string;
  appId: string;
}

export interface StatusResult {
  connection: StatusConnection;
  /** The platform the Hub builds this App for; `null` when the Hub could not tell. */
  buildTarget?: BuildTarget | null;
  /** What the App runs now; `null` before its first deployment. */
  running?: {
    releaseId: string | null;
    version: string | null;
    state: string | null;
  } | null;
  lastDeployment?: DeploymentInfo | null;
  /** The one deployment `--deployment` names. */
  deployment?: { operationId: string; status: DeploymentStatus };
}

export default class HubStatus extends HubCommand {
  static override summary =
    "Show what this application's App on the Hub runs now.";
  static override description =
    "Reports the remote, the platform the Hub builds the App for, the version it runs and its last deployment. With --deployment, reports only that deployment's status. This is the App on the Hub, not the Hub itself; for the saved API keys, see hub auth status.";

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --remote production --json',
    '<%= config.bin %> <%= command.id %> --deployment <deployment-id>',
  ];

  static override flags: {
    remote: Interfaces.OptionFlag<string | undefined>;
    deployment: Interfaces.OptionFlag<string | undefined>;
    timeout: Interfaces.OptionFlag<number>;
  } = {
    remote: remoteFlag,
    deployment: Flags.string({
      description: 'Report only this deployment.',
    }),
    timeout: timeoutFlag,
  };

  protected readonly failureCode = 'STATUS_FAILED';
  protected readonly failureMessage = 'The App status could not be read.';

  override async run(): Promise<StatusResult> {
    const { flags } = await this.parse(HubStatus);
    return await this.report(async () => {
      const remote = await this.remote(flags.remote);
      const client = new HubClient({
        target: remote,
        apiKey: await this.apiKey(remote),
        timeout: flags.timeout,
      });
      const connection: StatusConnection = {
        remote: remote.name,
        hub: remote.hub,
        appId: remote.appId,
      };
      this.log(`${remote.name}: App ${remote.appId} on ${remote.hub}`);
      if (flags.deployment !== undefined) {
        const status = await client.deploymentStatus(flags.deployment);
        this.log(`Deployment ${flags.deployment}: ${status}`);
        return {
          connection,
          deployment: { operationId: flags.deployment, status },
        };
      }
      const [app, deployments] = await Promise.all([
        client.getApp(),
        client.listDeployments(1),
      ]);
      const running =
        app.currentVersion === null && app.runningReleaseId === null
          ? null
          : {
              releaseId: app.runningReleaseId,
              version: app.currentVersion,
              state: app.state,
            };
      const lastDeployment = deployments[0] ?? null;
      this.log(
        `Build target: ${app.buildTarget === null ? 'unknown' : describeTarget(app.buildTarget)}`,
      );
      this.log(
        running === null
          ? 'Running: nothing deployed yet'
          : `Running: ${running.version ?? 'unknown version'}${running.releaseId === null ? '' : ` (Release ${running.releaseId})`}${running.state === null ? '' : `, ${running.state}`}`,
      );
      if (lastDeployment !== null)
        this.log(
          `Last deployment: ${lastDeployment.operationId} of ${lastDeployment.version ?? lastDeployment.releaseId}, ${lastDeployment.status}, ${lastDeployment.createdAt}`,
        );
      return {
        connection,
        buildTarget: app.buildTarget,
        running,
        lastDeployment,
      };
    });
  }
}
