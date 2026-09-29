import { AppCommand, CommandError, appPath } from '@nocobase/app-cli';
import type { Command, Interfaces } from '@oclif/core';

import type { WorkflowSourceIssue } from '../build/index.js';

/** What `workflow build` returns, and the `result` of its `--json` document. */
export interface WorkflowBuildResult {
  /** How many workflow packages were built. */
  readonly packages: number;
  /** The absolute directory the Artifacts were written to. */
  readonly distRoot: string;
}

/** The `error.details` of a failed build. */
export interface WorkflowBuildFailureDetails {
  readonly sourceRoot: string;
  /** The source issues of the package that failed, when validation is what failed. */
  readonly issues?: readonly WorkflowSourceIssue[];
}

export default class WorkflowBuild extends AppCommand {
  static override summary = 'Build application workflow artifacts.';
  static override description =
    'Validates every workflow package in the source root and writes its deployable Artifact to the distribution root.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> --source-root workflows --dist-root dist/workflows',
    '<%= config.bin %> <%= command.id %> --resource-root dist/workflows --json',
  ];

  static override flags: {
    'source-root': Interfaces.OptionFlag<string>;
    'dist-root': Interfaces.OptionFlag<string>;
    'resource-root': Interfaces.OptionFlag<string | undefined>;
  } = {
    'source-root': appPath({
      default: 'workflows',
      description: 'Workflow source directory.',
    }),
    'dist-root': appPath({
      default: 'dist/workflows',
      description: 'Artifact output directory.',
    }),
    'resource-root': appPath({
      description:
        'Compiled workflow resource directory. Defaults to the source root.',
    }),
  };

  public async run(): Promise<WorkflowBuildResult> {
    const { flags } = await this.parse(WorkflowBuild);
    const sourceRoot = flags['source-root'];
    const distRoot = flags['dist-root'];
    const { buildApplicationWorkflows, WorkflowSourceCheckError } =
      await import('../build/index.js');
    let packages: number;
    try {
      ({ packages } = await buildApplicationWorkflows({
        sourceRoot,
        distRoot,
        ...(flags['resource-root'] === undefined
          ? {}
          : { resourceRoot: flags['resource-root'] }),
      }));
    } catch (error) {
      const cause = error instanceof Error ? error.cause : undefined;
      const details: WorkflowBuildFailureDetails = {
        sourceRoot,
        ...(cause instanceof WorkflowSourceCheckError
          ? { issues: cause.issues }
          : {}),
      };
      throw new CommandError(
        error instanceof Error ? error.message : String(error),
        { code: 'WORKFLOW_BUILD_FAILED', details, cause: error },
      );
    }

    this.log(`Workflow build generated ${packages} Artifact(s) in ${distRoot}`);
    return { packages, distRoot };
  }
}
