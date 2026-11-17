import { Args, Flags } from '@oclif/core';
import type { Command, Interfaces } from '@oclif/core';
import path from 'node:path';

import { AppCommand } from '../../context.ts';
import {
  appPackageManager,
  removeDependencyCommand,
} from '../../lib/plugin-install.ts';
import {
  applyPluginRegistration,
  planPluginUnregistration,
  planPluginSkillRemovals,
  pluginPackageName,
  removePluginSkills,
  type PluginUnregistrationPlan,
} from '../../lib/plugin-registration.ts';
import {
  classifyPluginError,
  pluginPlanForJson,
  type PluginCommandInvocation,
  type PluginCommandIssue,
  type PluginPlanJson,
} from '../../lib/plugin-json.ts';
import {
  CommandFailedError,
  runAttached,
  runCommand,
} from '../../lib/run-command.ts';
import { resolveAppRoot } from '../../lib/workspace-app.ts';

export interface PluginUnregisterOptions {
  readonly app?: string;
  readonly dependencySections?: readonly string[];
  readonly dir?: string;
  readonly dryRun: boolean;
  readonly noInstall: boolean;
  readonly workspaceRoot?: string;
}

/** The plugin was neither registered, declared, nor had Skills in the App; status `success-noop`. */
export interface PluginUnregisterNoopResult {
  readonly appRoot: string;
  readonly packageName: string;
  readonly removedFrom: readonly string[];
  readonly skillRemovals: readonly string[];
}

/** What an unregistration would do. Status `partial-success` when a composition root has to be edited by hand. */
export interface PluginUnregisterDryRunResult {
  readonly mode: 'dry-run';
  readonly appRoot: string;
  readonly packageName: string;
  readonly plan: PluginPlanJson<PluginUnregistrationPlan>;
  readonly skillRemovals: readonly string[];
  readonly commands: readonly PluginCommandInvocation[];
}

/**
 * What an unregistration did. Status `partial-success` when a composition root has to be edited by hand, or when the
 * package manager did not remove the dependency (`issues`).
 */
export interface PluginUnregisterRemovedResult {
  readonly mode: 'unregister';
  readonly appRoot: string;
  readonly packageName: string;
  readonly removedFrom: readonly string[];
  readonly removedSkills: readonly string[];
  readonly plan: PluginPlanJson<PluginUnregistrationPlan>;
  readonly issues?: readonly PluginCommandIssue[];
}

export type PluginUnregisterResult =
  | PluginUnregisterNoopResult
  | PluginUnregisterDryRunResult
  | PluginUnregisterRemovedResult;

/** Removing a plugin from an application, shared by `plugin unregister` and `package remove`. */
export abstract class PluginUnregistrationCommand extends AppCommand {
  protected async unregisterPlugin(
    packageName: string,
    options: PluginUnregisterOptions,
  ): Promise<PluginUnregisterResult> {
    const appRoot = await resolveAppRoot({
      app: options.app,
      dir: options.dir,
      workspaceRoot: options.workspaceRoot,
    });
    const dryRun = options.dryRun;

    const plan = await planPluginUnregistration({ appRoot, packageName });
    const skillRemovals = await planPluginSkillRemovals(appRoot, packageName);
    const dependencySections = options.dependencySections ?? [];
    const shouldRemoveDependency =
      !options.noInstall && (dependencySections.length > 0 || plan.changed);
    if (
      !plan.changed &&
      skillRemovals.length === 0 &&
      dependencySections.length === 0
    ) {
      this.setStatus('success-noop');
      this.log(`${packageName} is not registered in this app.`);
      return { appRoot, packageName, removedFrom: [], skillRemovals };
    }
    if (dryRun) {
      // A dry run changes nothing, whatever it would do; a plan that needs manual edits says so in `plan`.
      this.setStatus('success-noop');
      const invocation = shouldRemoveDependency
        ? removeDependencyCommand(await appPackageManager(appRoot), packageName)
        : undefined;
      this.log(
        `Would unregister ${packageName} (${plan.removedFrom.join(', ')})`,
      );
      if (invocation !== undefined) {
        this.log(`  ${invocation.packageManager} ${invocation.args.join(' ')}`);
      }
      for (const skill of skillRemovals) {
        this.log(`  would remove skill ${skill}`);
      }
      return {
        mode: 'dry-run',
        appRoot,
        packageName,
        plan: pluginPlanForJson(plan),
        skillRemovals,
        commands:
          invocation === undefined
            ? []
            : [
                {
                  command: invocation.packageManager,
                  args: invocation.args,
                  cwd: appRoot,
                },
              ],
      };
    }

    // Preserve the compatibility command's established behavior: its registration and copied skills are removed even
    // when the package manager later reports a partial uninstall. The generic package:remove command uses stricter
    // ordering for non-plugin packages and keeps their skills when uninstalling fails.
    const removedSkills = await removePluginSkills(appRoot, packageName);

    const issues: PluginCommandIssue[] = [];
    if (shouldRemoveDependency) {
      const { args: commandArgs, packageManager } = removeDependencyCommand(
        await appPackageManager(appRoot),
        packageName,
      );
      this.log(`${packageManager} ${commandArgs.join(' ')}`);
      const exitCode = await this.removeDependency(
        packageManager,
        commandArgs,
        appRoot,
      );
      if (exitCode !== 0) {
        this.warn(
          `${packageManager} exited with code ${exitCode}; the package may still be installed. Continuing to unregister it.`,
        );
        issues.push({
          code: 'PACKAGE_MANAGER_FAILED',
          message:
            'The plugin was unregistered, but the package manager did not remove the installed dependency.',
          suggestions: [
            {
              message:
                'Remove the package dependency manually and reinstall dependencies.',
            },
          ],
        });
      }
    }

    // The package manager rewrites package.json itself, so the plan is recomputed against what it left behind rather
    // than overwriting that file with a manifest read before the removal.
    const finalPlan = await planPluginUnregistration({ appRoot, packageName });
    await applyPluginRegistration(appRoot, finalPlan);

    const removedFrom = [
      ...new Set([
        ...finalPlan.removedFrom,
        ...plan.removedFrom,
        ...dependencySections,
      ]),
    ];
    if (
      issues.length > 0 ||
      finalPlan.manualClientEdit ||
      finalPlan.manualServerEdit ||
      finalPlan.manualCliEdit
    ) {
      this.setStatus('partial-success');
    }
    this.log(`Unregistered ${packageName} (${removedFrom.join(', ')})`);
    for (const skill of removedSkills) {
      this.log(`  removed skill ${skill}`);
    }
    for (const edit of [
      finalPlan.manualClientEdit,
      finalPlan.manualServerEdit,
      finalPlan.manualCliEdit,
    ]) {
      if (edit === undefined) continue;
      this.log(
        `\n${path.relative(appRoot, edit.filePath)} still imports this plugin and could not be edited: TypeScript is not installed in this app.`,
      );
      this.log('Remove these two lines by hand:');
      this.log(`  1. ${edit.importStatement}`);
      this.log(`  2. ${edit.entry}`);
    }
    return {
      mode: 'unregister',
      appRoot,
      packageName,
      removedFrom,
      removedSkills,
      plan: pluginPlanForJson(finalPlan),
      ...(issues.length > 0 ? { issues } : {}),
    };
  }

  /**
   * Runs the package manager and returns its exit code. Under --json its output is collected rather than shown, because
   * it would corrupt the one document on stdout.
   */
  private async removeDependency(
    packageManager: string,
    args: readonly string[],
    cwd: string,
  ): Promise<number> {
    if (!this.jsonEnabled()) {
      return runAttached(packageManager, [...args], { cwd });
    }
    try {
      await runCommand(packageManager, [...args], { cwd });
      return 0;
    } catch (error) {
      return error instanceof CommandFailedError && error.exitCode !== null
        ? error.exitCode
        : 1;
    }
  }
}

export default class PluginUnregister extends PluginUnregistrationCommand {
  static override summary = 'Remove a plugin from this application.';
  static override description =
    'Undoes what register did: drops the imports and entries from the client and server composition roots, removes the dependency, deletes installed skills, and uninstalls the package.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %> audit-log',
    '<%= config.bin %> <%= command.id %> @nocobase/app-plugin-audit-log',
    '<%= config.bin %> <%= command.id %> audit-log --dry-run',
    '<%= config.bin %> <%= command.id %> audit-log --workspace-root . --app app-template-default',
  ];

  static override args: {
    name: Interfaces.Arg<string>;
  } = {
    name: Args.string({
      description:
        'Plugin to remove: a short name such as audit-log, or a full scoped app-plugin-* or app-portal-* package name.',
      required: true,
    }),
  };

  static override flags: {
    dir: Interfaces.OptionFlag<string | undefined>;
    app: Interfaces.OptionFlag<string | undefined>;
    'workspace-root': Interfaces.OptionFlag<string | undefined>;
    'no-install': Interfaces.BooleanFlag<boolean>;
    'dry-run': Interfaces.BooleanFlag<boolean>;
  } = {
    dir: Flags.string({
      description: 'App directory. Defaults to the current directory.',
    }),
    app: Flags.string({
      description:
        'Workspace app directory or package name. Requires --workspace-root.',
    }),
    'workspace-root': Flags.string({
      description:
        'Monorepo root. Selects app-template-default unless --app is provided.',
    }),
    'no-install': Flags.boolean({
      default: false,
      description:
        'Do not run the package manager; leave the package installed.',
    }),
    'dry-run': Flags.boolean({
      default: false,
      description: 'Print what would change without writing anything.',
    }),
  };

  public async run(): Promise<PluginUnregisterResult> {
    const { args, flags } = await this.parse(PluginUnregister);
    try {
      return await this.unregisterPlugin(pluginPackageName(args.name), {
        app: flags.app,
        dir: flags.dir,
        dryRun: flags['dry-run'],
        noInstall: flags['no-install'],
        workspaceRoot: flags['workspace-root'],
      });
    } catch (error) {
      throw classifyPluginError(error);
    }
  }
}
