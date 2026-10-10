import { Args, Flags } from '@oclif/core';
import type { Command, Interfaces } from '@oclif/core';
import path from 'node:path';

import { AppCommand } from '../../context.ts';
import {
  planPluginUpdate,
  type PluginUpdatePlan,
} from '../../lib/plugin-update.ts';
import { runAttached, runCommand } from '../../lib/run-command.ts';
import {
  classifyPluginError,
  pluginCommandIssue,
  pluginError,
  type PluginCommandInvocation,
  type PluginCommandIssue,
} from '../../lib/plugin-json.ts';
import {
  applySkillsSync,
  formatSkillsSyncSummary,
  planSkillsSync,
  resolveInstalledPlugins,
  type SkillsSyncPlan,
} from '../../lib/skills-sync.ts';

/** No plugin is registered, so there is nothing to upgrade; status `success-noop`. */
export interface PluginUpdateNoopResult {
  readonly appRoot: string;
  readonly packageNames: readonly string[];
  readonly commands: readonly PluginCommandInvocation[];
}

/** The upgrade a run would perform, and whose Skills it would then synchronize. */
export interface PluginUpdateDryRunResult extends PluginUpdatePlan {
  readonly mode: 'dry-run';
  readonly appRoot: string;
  readonly commands: readonly PluginCommandInvocation[];
  readonly synchronizeSkills: readonly string[];
}

/**
 * The upgrade that ran and the Skills it synchronized. Status `partial-success` when the upgrade succeeded but the
 * Skills could not be synchronized (`issues`, and no `skills`).
 */
export interface PluginUpdateUpdatedResult extends PluginUpdatePlan {
  readonly mode: 'update';
  readonly appRoot: string;
  readonly skills?: SkillsSyncPlan;
  readonly issues?: readonly PluginCommandIssue[];
}

export type PluginUpdateResult =
  PluginUpdateNoopResult | PluginUpdateDryRunResult | PluginUpdateUpdatedResult;

export default class PluginUpdate extends AppCommand {
  static override summary = 'Upgrade plugins and re-synchronize their Skills.';
  static override description =
    "Upgrades the plugin packages through the package manager the app already uses, then re-synchronizes all registered plugins' skills into .agents/skills. Specify a full package name or a short name. Without a name every registered plugin is upgraded. The skills copy is the reason to prefer this over upgrading by hand: skills live in the app, so an upgrade leaves a stale copy behind until something re-runs the sync.";

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %>',
    '<%= config.bin %> <%= command.id %> @nocobase/app-plugin-scheduler',
    '<%= config.bin %> <%= command.id %> scheduler',
    '<%= config.bin %> <%= command.id %> --dry-run',
  ];

  static override args: {
    name: Interfaces.Arg<string | undefined>;
  } = {
    name: Args.string({
      description:
        'Plugin to upgrade: a full @nocobase/app-plugin-* package name or a short name such as scheduler. Omit to upgrade every registered plugin.',
      required: false,
    }),
  };

  static override flags: {
    dir: Interfaces.OptionFlag<string | undefined>;
    'dry-run': Interfaces.BooleanFlag<boolean>;
  } = {
    dir: Flags.string({
      description: 'App directory. Defaults to the current directory.',
    }),
    'dry-run': Flags.boolean({
      default: false,
      description: 'Print what would run without upgrading anything.',
    }),
  };

  public async run(): Promise<PluginUpdateResult> {
    const { args, flags } = await this.parse(PluginUpdate);
    try {
      return await this.update(args.name, flags);
    } catch (error) {
      throw classifyPluginError(error);
    }
  }

  private async update(
    name: string | undefined,
    flags: { readonly dir?: string; readonly 'dry-run': boolean },
  ): Promise<PluginUpdateResult> {
    const appRoot = path.resolve(flags.dir ?? process.cwd());
    const dryRun = flags['dry-run'];

    const plan = await planPluginUpdate({
      appRoot,
      plugins: name === undefined ? [] : [name],
    });
    if (plan.packageNames.length === 0) {
      this.setStatus('success-noop');
      this.log('No plugins are registered in this app.');
      return { appRoot, packageNames: [], commands: [] };
    }

    if (dryRun) {
      // A dry run changes nothing, whatever it would do.
      this.setStatus('success-noop');
      this.log(
        `Would run: ${plan.packageManager} ${plan.args.join(' ')}\nThen synchronize the skills of: ${plan.packageNames.join(', ')}`,
      );
      return {
        mode: 'dry-run',
        appRoot,
        ...plan,
        commands: [
          {
            command: plan.packageManager,
            args: plan.args,
            cwd: appRoot,
          },
        ],
        synchronizeSkills: plan.packageNames,
      };
    }

    this.log(`${plan.packageManager} ${plan.args.join(' ')}`);
    // Under --json the package manager's own output would corrupt the one document on stdout, so it is collected
    // instead of shown; a failure then surfaces as the error the run fails with.
    if (this.jsonEnabled()) {
      await runCommand(plan.packageManager, [...plan.args], { cwd: appRoot });
    } else {
      const exitCode = await runAttached(plan.packageManager, [...plan.args], {
        cwd: appRoot,
      });
      if (exitCode !== 0) {
        throw pluginError(
          `${plan.packageManager} exited with code ${exitCode}. The skills were left untouched.`,
          { exit: exitCode },
        );
      }
    }

    // The upgrade already succeeded, so a sync failure must not read as an
    // upgrade failure.
    try {
      const { appPackageName, plugins } = await resolveInstalledPlugins({
        appRoot,
      });
      const synced = await applySkillsSync(
        await planSkillsSync({
          appPackageName,
          appRoot,
          plugins,
          pruneMissingPackages: true,
        }),
      );
      this.log(formatSkillsSyncSummary(synced));
      return { mode: 'update', appRoot, ...plan, skills: synced };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.warn(
        `Plugins were upgraded, but their skills were not synchronized: ${reason}`,
      );
      this.setStatus('partial-success');
      return {
        mode: 'update',
        appRoot,
        ...plan,
        issues: [pluginCommandIssue(error)],
      };
    }
  }
}
