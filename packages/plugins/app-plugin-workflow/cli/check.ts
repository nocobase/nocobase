import { AppCommand, CommandError } from '@nocobase/app-cli';
import { Args, Flags } from '@oclif/core';
import type { Command, Interfaces } from '@oclif/core';
import path from 'node:path';

import type { WorkflowSourceIssue } from '../build/index.js';
import type { WorkflowFlatIr } from '../dsl/definition.js';

/** What `workflow check` returns, and the `result` of its `--json` document. */
export interface WorkflowCheckResult {
  /** The `workflow.ts` that was checked. */
  readonly file: string;
  readonly nodes: number;
  /** The compiled flat IR, only with `--ir`. */
  readonly ir?: WorkflowFlatIr;
}

/** The `error.details` of a failed check. */
export interface WorkflowCheckFailureDetails {
  readonly issues: readonly WorkflowSourceIssue[];
}

export default class WorkflowCheck extends AppCommand {
  static override summary = 'Validate a source-managed workflow package.';
  static override description =
    'Runs the Workflow typecheck, evaluation, schema, semantic, and compile validation phases without loading or running the workflow.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %> workflows/order-fulfillment',
    '<%= config.bin %> <%= command.id %> workflows/order-fulfillment/workflow.ts --json',
    '<%= config.bin %> <%= command.id %> workflows/order-fulfillment --ir',
  ];

  static override args: {
    package: Interfaces.Arg<string, Interfaces.CustomOptions>;
  } = {
    package: Args.string({
      description:
        'Workflow package directory or workflow.ts file to validate.',
      required: true,
    }),
  };

  static override flags: {
    ir: Interfaces.BooleanFlag<boolean>;
  } = {
    ir: Flags.boolean({
      default: false,
      description:
        'Print the compiled flat IR, the definition an Artifact would carry.',
    }),
  };

  public async run(): Promise<WorkflowCheckResult> {
    const { args, flags } = await this.parse(WorkflowCheck);
    const { checkWorkflowPackage, WorkflowSourceCheckError } =
      await import('../build/index.js');
    // A path typed on the command line resolves from the current directory, as with any command line.
    const packagePath = path.resolve(args.package);
    let checked: Awaited<ReturnType<typeof checkWorkflowPackage>>;
    try {
      checked = await checkWorkflowPackage(packagePath);
    } catch (error) {
      if (error instanceof WorkflowSourceCheckError) {
        const details: WorkflowCheckFailureDetails = { issues: error.issues };
        throw new CommandError(error.message, {
          code: 'WORKFLOW_CHECK_FAILED',
          details,
          cause: error,
        });
      }
      if (isMissing(error, packagePath)) {
        throw new CommandError(`Workflow package not found: ${packagePath}`, {
          code: 'WORKFLOW_PACKAGE_NOT_FOUND',
          suggestions: [
            'Pass a workflow package directory or its workflow.ts, relative to the current directory.',
          ],
          cause: error,
        });
      }
      throw error;
    }
    const result: WorkflowCheckResult = {
      file: checked.file,
      nodes: checked.ir.nodes.length,
      ...(flags.ir ? { ir: checked.ir } : {}),
    };

    if (flags.ir) {
      this.log(JSON.stringify(checked.ir, null, 2));
      return result;
    }
    this.log(`Workflow check passed: ${result.file} (${result.nodes} nodes)`);
    return result;
  }
}

function isMissing(error: unknown, target: string): boolean {
  const failure = error as NodeJS.ErrnoException | undefined;
  return failure?.code === 'ENOENT' && failure.path === target;
}
