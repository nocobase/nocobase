import { loggingToken } from '@nocobase/app-server/logging';
import { createWorkflowLogger } from './engine/logger.js';
import { queueManagerToken } from '@nocobase/app-server/queue';
import type { AppPluginApplication } from '@nocobase/app-server/plugins';
import { databaseManagerToken } from '@nocobase/db';
import type { AppDriveConfig, FsDriveDiskConfig } from '@nocobase/drive';
import { ServiceProvider } from '@nocobase/service-provider';
import type { ScheduleTargetHandle } from '@nocobase/app-plugin-scheduler/server';
import {
  WorkflowScheduleTarget,
  workflowCompletion,
} from './schedule-target.js';

import { type WorkflowRuntimeConfig } from './config.js';
import { WorkflowService } from './service.js';
import {
  internalWorkflowServiceToken,
  workflowServiceToken,
} from './tokens.js';

export interface WorkflowProviderConfig {
  readonly app: {
    readonly publicBasePath: string;
  };
  readonly drive: AppDriveConfig;
  readonly workflow: {
    readonly sourceRoot: string;
    readonly distRoot: string;
    readonly artifactDisk: string;
    readonly production: boolean;
  };
}

export type WorkflowProviderApplication =
  AppPluginApplication<WorkflowProviderConfig>;

export class WorkflowProvider<
  TApplication extends WorkflowProviderApplication =
    WorkflowProviderApplication,
> extends ServiceProvider<TApplication> {
  public readonly name: string = '@nocobase/app-plugin-workflow';
  // Held from boot() rather than re-derived: reporting a completion is a
  // capability the scheduler grants to whoever registered the target, and it
  // is absent when the scheduler plugin is not installed at all.
  private scheduleTarget: ScheduleTargetHandle | undefined;

  public override register(): void {
    if (!this.app.container.has(databaseManagerToken)) return;
    const workflow = this.app.config.get<WorkflowRuntimeConfig>('workflow')!;
    const drive = this.app.config.get<AppDriveConfig>('drive')!;

    this.app.container.singleton(
      internalWorkflowServiceToken,
      (container) =>
        new WorkflowService({
          logger: createWorkflowLogger(
            container.resolve(loggingToken).getLogger('workflow'),
          ),
          database: container.resolve(databaseManagerToken),
          queue: container.resolve(queueManagerToken),
          queueName: `workflow:${this.app.appName}`,
          services: this.app.container,
          sourceRoot: workflow.sourceRoot,
          distRoot: workflow.distRoot,
          clientDir: this.app.paths.clientDir,
          artifactDisk: resolveWorkflowArtifactDisk(workflow, drive),
          production: workflow.production,
          terminalObserver: async (event) => {
            const scheduleTarget = this.scheduleTarget;
            if (
              event.sourceType !== 'schedule' ||
              !event.sourceId ||
              !scheduleTarget
            )
              return;
            const reference = {
              type: 'workflow-run',
              id: String(event.runId),
            };
            await scheduleTarget
              .reportCompletion(
                event.sourceId,
                reference,
                workflowCompletion(
                  event.status,
                  event.reason,
                  new Date(event.finishedAt),
                ),
              )
              .catch((error: unknown) => {
                console.error(
                  'Workflow schedule completion notification failed',
                  {
                    occurrenceId: event.sourceId,
                    reference,
                    targetType: 'workflow',
                    error,
                  },
                );
              });
          },
        }),
    );
    this.app.container.singleton(workflowServiceToken, (container) =>
      container.resolve(internalWorkflowServiceToken),
    );
  }

  public override async boot(): Promise<void> {
    await this.app.container
      .resolve(internalWorkflowServiceToken)
      .synchronizeDeploymentArtifacts();
    let schedulerTokens: typeof import('@nocobase/app-plugin-scheduler/server/tokens');
    try {
      schedulerTokens =
        await import('@nocobase/app-plugin-scheduler/server/tokens');
    } catch (error) {
      if (isMissingSchedulerPackage(error)) return;
      throw error;
    }
    const { schedulerServiceToken } = schedulerTokens;
    // The scheduler registers its service during register; only resolve it
    // when the scheduler plugin is actually present.
    if (!this.app.container.has(schedulerServiceToken)) return;
    this.scheduleTarget = this.app.container
      .resolve(schedulerServiceToken)
      .registerTarget(
        new WorkflowScheduleTarget(
          this.app.container.resolve(databaseManagerToken),
          this.app.container.resolve(workflowServiceToken),
        ),
      );
  }

  public override async shutdown(): Promise<void> {
    await this.app.container
      .resolveIfCreated(internalWorkflowServiceToken)
      ?.dispose();
  }
}

function isMissingSchedulerPackage(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'ERR_MODULE_NOT_FOUND' &&
    error instanceof Error &&
    error.message.includes('@nocobase/app-plugin-scheduler')
  );
}

function resolveWorkflowArtifactDisk(
  workflow: WorkflowProviderConfig['workflow'],
  drive: AppDriveConfig,
): FsDriveDiskConfig {
  const name = workflow.artifactDisk ?? drive.default;
  const disk = drive.disks[name];
  if (!disk) {
    throw new Error(`Workflow Artifact disk "${name}" is not configured`);
  }
  if (disk.driver !== 'fs') {
    throw new Error(
      `Workflow Artifact disk "${name}" must use the fs/local driver`,
    );
  }
  if (disk.visibility !== 'private') {
    throw new Error(
      `Workflow Artifact disk "${name}" must have private visibility`,
    );
  }
  return disk;
}
