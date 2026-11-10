import { Args, Flags } from '@oclif/core';
import type { Command, Interfaces } from '@oclif/core';
import path from 'node:path';

import { AppCommand } from '../../context.ts';
import {
  addDependencyCommand,
  appPackageManager,
  declaredDependencyRange,
  installedPluginDirectory,
  installedPluginVersion,
} from '../../lib/plugin-install.ts';
import type { ManualCliPluginEdit } from '../../lib/cli-plugins.ts';
import type { ManualClientPluginEdit } from '../../lib/client-plugins.ts';
import type { ManualServerPluginEdit } from '../../lib/server-plugins.ts';
import {
  applyPluginRegistration,
  planPluginRegistration,
  pluginPackageName,
  type PluginRegistrationPlan,
} from '../../lib/plugin-registration.ts';
import {
  classifyPluginError,
  pluginCommandIssue,
  pluginError,
  pluginPlanForJson,
  type PluginCommandInvocation,
  type PluginCommandIssue,
  type PluginPlanJson,
} from '../../lib/plugin-json.ts';
import { runAttached, runCommand } from '../../lib/run-command.ts';
import { resolveAppRoot } from '../../lib/workspace-app.ts';
import {
  applySkillsSync,
  formatSkillsSyncSummary,
  planSkillsSync,
  type SkillsSyncPlan,
} from '../../lib/skills-sync.ts';

/** The plugin was already registered exactly as asked; status `success-noop`. */
export interface PluginRegisterNoopResult {
  readonly appRoot: string;
  readonly packageName: string;
  readonly checked: readonly string[];
  readonly notChecked: readonly string[];
}

/**
 * A dry run for a plugin that is not installed yet. Its exports decide the registration plan, so the preview stops at
 * the install command; status `partial-success`.
 */
export interface PluginRegisterInstallRequiredResult {
  readonly appRoot: string;
  readonly packageName: string;
  readonly state: 'requires-installation';
  readonly commands: readonly PluginCommandInvocation[];
  readonly nextSteps: readonly string[];
}

/** Why the plugin's Skills were not copied. */
export interface PluginRegisterSkillsSkipped {
  readonly skipped: true;
  readonly reason: '--no-skills';
}

/**
 * What a registration did, or with `mode: 'dry-run'` would do. Status `partial-success` when a composition root has to
 * be edited by hand, or when the registration stands but its Skills could not be copied (`issues`).
 */
export interface PluginRegisterPlanResult {
  readonly mode: 'dry-run' | 'register';
  readonly appRoot: string;
  readonly packageName: string;
  readonly plan: PluginPlanJson<PluginRegistrationPlan>;
  /** The Skills copied, or planned in a dry run; absent when copying them failed. */
  readonly skills?: SkillsSyncPlan | PluginRegisterSkillsSkipped;
  /** Commands a dry run would still run; always empty, because the plugin is already installed. */
  readonly commands?: readonly PluginCommandInvocation[];
  readonly issues?: readonly PluginCommandIssue[];
}

export type PluginRegisterResult =
  | PluginRegisterNoopResult
  | PluginRegisterInstallRequiredResult
  | PluginRegisterPlanResult;

export default class PluginRegister extends AppCommand {
  static override summary =
    'Install a plugin and wire it into this application.';
  static override description =
    'Adds the plugin package to dependencies, wires its exported client and server entries into the explicit application composition roots, and copies the skills it ships into .agents/skills.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %> audit-log',
    '<%= config.bin %> <%= command.id %> @nocobase/app-plugin-audit-log',
    '<%= config.bin %> <%= command.id %> audit-log --version 1.2.0',
    '<%= config.bin %> <%= command.id %> audit-log --dry-run',
    '<%= config.bin %> <%= command.id %> audit-log --workspace-root . --app app-template-default',
  ];

  static override args: {
    name: Interfaces.Arg<string>;
  } = {
    name: Args.string({
      description:
        'Plugin to register: a short name such as audit-log, or a full scoped app-plugin-* or app-module-* package name.',
      required: true,
    }),
  };

  static override flags: {
    dir: Interfaces.OptionFlag<string | undefined>;
    app: Interfaces.OptionFlag<string | undefined>;
    'workspace-root': Interfaces.OptionFlag<string | undefined>;
    version: Interfaces.OptionFlag<string | undefined>;
    disabled: Interfaces.BooleanFlag<boolean>;
    'no-install': Interfaces.BooleanFlag<boolean>;
    'no-skills': Interfaces.BooleanFlag<boolean>;
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
    version: Flags.string({
      description:
        'Version range to install. Defaults to workspace:^ in workspace mode, otherwise the declared range or the latest published version for a new plugin.',
    }),
    disabled: Flags.boolean({
      default: false,
      description:
        'Install the plugin without adding client or server entries.',
    }),
    'no-install': Flags.boolean({
      default: false,
      description:
        'Do not run the package manager; the plugin must already be installed.',
    }),
    'no-skills': Flags.boolean({
      default: false,
      description: "Do not copy the plugin's skills into this app.",
    }),
    'dry-run': Flags.boolean({
      default: false,
      description: 'Print what would change without writing anything.',
    }),
  };

  public async run(): Promise<PluginRegisterResult> {
    const { args, flags } = await this.parse(PluginRegister);
    try {
      return await this.register(args.name, flags);
    } catch (error) {
      throw classifyPluginError(error);
    }
  }

  private async register(
    name: string,
    flags: {
      readonly dir?: string;
      readonly app?: string;
      readonly 'workspace-root'?: string;
      readonly version?: string;
      readonly disabled: boolean;
      readonly 'no-install': boolean;
      readonly 'no-skills': boolean;
      readonly 'dry-run': boolean;
    },
  ): Promise<PluginRegisterResult> {
    const appRoot = await resolveAppRoot({
      app: flags.app,
      dir: flags.dir,
      workspaceRoot: flags['workspace-root'],
    });
    const dryRun = flags['dry-run'];
    const packageName = pluginPackageName(name);

    const installed = await this.install({
      appRoot,
      dryRun,
      packageName,
      skipInstall: flags['no-install'],
      version:
        flags.version ??
        (flags['workspace-root'] === undefined ? undefined : 'workspace:^'),
    });
    if (typeof installed !== 'string') {
      // Only a dry run stops here, and a dry run changes nothing.
      this.setStatus('success-noop');
      return installed;
    }

    const plan = await planPluginRegistration({
      appRoot,
      dependencyRange: await this.dependencyRange(appRoot, packageName),
      enabled: !flags.disabled,
      packageName,
      pluginDirectory: installed,
    });

    if (!plan.changed) {
      this.setStatus('success-noop');
      this.log(`${packageName} is already registered.`);
      return {
        appRoot,
        packageName,
        checked: [
          'dependency',
          'client/plugins.ts',
          'server/plugins.ts',
          'cli/plugins.ts',
        ],
        notChecked: ['skills-content', 'runtime-behavior'],
      };
    }
    if (plan.manualClientEdit || plan.manualServerEdit || plan.manualCliEdit) {
      this.setStatus('partial-success');
    }
    const skillsPlan = flags['no-skills']
      ? undefined
      : await planSkillsSync({
          appPackageName: packageName,
          appRoot,
          plugins: [{ packageName, pluginDirectory: installed }],
        });
    const skipped: PluginRegisterSkillsSkipped = {
      skipped: true,
      reason: '--no-skills',
    };
    if (dryRun) {
      // A dry run changes nothing, whatever it would do; a plan that needs manual edits says so in `plan`.
      this.setStatus('success-noop');
      this.log(this.describe(plan, appRoot, true));
      return {
        mode: 'dry-run',
        appRoot,
        packageName,
        plan: pluginPlanForJson(plan),
        skills: skillsPlan ?? skipped,
        commands: [],
      };
    }

    await applyPluginRegistration(appRoot, plan);
    this.log(this.describe(plan, appRoot, false));
    const registered = {
      mode: 'register',
      appRoot,
      packageName,
      plan: pluginPlanForJson(plan),
    } as const;

    if (skillsPlan === undefined) {
      return { ...registered, skills: skipped };
    }
    // Skills are documentation: a failure here is reported but never undoes a registration that already succeeded.
    try {
      const synced = await applySkillsSync(skillsPlan);
      if (synced.copies.length > 0 || synced.removals.length > 0) {
        this.log(formatSkillsSyncSummary(synced));
      }
      return { ...registered, skills: synced };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.warn(
        `${packageName} was registered, but its skills were not copied: ${reason}`,
      );
      this.setStatus('partial-success');
      return { ...registered, issues: [pluginCommandIssue(error)] };
    }
  }

  /**
   * The range to record in the manifest. After an install the package manager has already written one, so it wins;
   * otherwise the installed version supplies a caret range. A package with no readable version records `*`, which is
   * honest about not knowing rather than inventing a range the registry would reject.
   */
  private async dependencyRange(
    appRoot: string,
    packageName: string,
  ): Promise<string> {
    const declared = await declaredDependencyRange(appRoot, packageName);
    if (declared !== undefined) {
      return declared;
    }
    const version = await installedPluginVersion(appRoot, packageName);
    return version === undefined ? '*' : `^${version}`;
  }

  /**
   * Ensures the package is present and returns where it lives. A dry run for a package that is not installed returns
   * the result that reports the install instead, because without the package there is nothing to plan from.
   */
  private async install({
    appRoot,
    dryRun,
    packageName,
    skipInstall,
    version,
  }: {
    appRoot: string;
    dryRun: boolean;
    packageName: string;
    skipInstall: boolean;
    version?: string;
  }): Promise<string | PluginRegisterInstallRequiredResult> {
    const existing = await installedPluginDirectory(appRoot, packageName);
    if (skipInstall) {
      if (existing === undefined) {
        throw pluginError(
          `${packageName} is not installed in ${appRoot} and --no-install was given.`,
        );
      }
      return existing;
    }

    const range =
      version ?? (await declaredDependencyRange(appRoot, packageName));
    const specifier =
      range === undefined ? packageName : `${packageName}@${range}`;
    const { args, packageManager } = addDependencyCommand(
      await appPackageManager(appRoot),
      specifier,
    );

    if (dryRun) {
      // Without the package there is nothing to inspect, so a dry run reports the install and stops rather than
      // guessing at edits it cannot compute.
      if (existing === undefined) {
        this.log(
          `Would run: ${packageManager} ${args.join(' ')}\nThen register ${packageName}.`,
        );
        return {
          appRoot,
          packageName,
          state: 'requires-installation',
          commands: [{ command: packageManager, args, cwd: appRoot }],
          nextSteps: [
            'Install the plugin.',
            'Run nocobase plugin register again to inspect exports and compute the registration plan.',
          ],
        };
      }
      return existing;
    }

    this.log(`${packageManager} ${args.join(' ')}`);
    // Under --json the package manager's own output would corrupt the one document on stdout, so it is collected
    // instead of shown; a failure then surfaces as the error the run fails with.
    if (this.jsonEnabled()) {
      await runCommand(packageManager, [...args], { cwd: appRoot });
    } else {
      const exitCode = await runAttached(packageManager, [...args], {
        cwd: appRoot,
      });
      if (exitCode !== 0) {
        throw pluginError(
          `${packageManager} exited with code ${exitCode}. Nothing was registered.`,
          { exit: exitCode },
        );
      }
    }

    const directory = await installedPluginDirectory(appRoot, packageName);
    if (directory === undefined) {
      throw pluginError(
        `${packageManager} reported success but ${packageName} is not in node_modules.`,
      );
    }
    return directory;
  }

  private describe(
    plan: PluginRegistrationPlan,
    appRoot: string,
    dryRun: boolean,
  ): string {
    const lines = [
      `${dryRun ? 'Would register' : 'Registered'} ${plan.packageName} as ${plan.enabled ? 'enabled' : 'disabled'}`,
    ];
    if (plan.manifestChanged) {
      lines.push('  package.json: dependency');
    }
    if (plan.clientPluginsChanged) {
      lines.push(
        `  ${path.relative(appRoot, plan.clientPluginsPath)}: import and registration`,
      );
    }
    if (plan.serverPluginsChanged) {
      lines.push(
        `  ${path.relative(appRoot, plan.serverPluginsPath)}: import and registration`,
      );
    }
    if (plan.cliPluginsChanged) {
      lines.push(
        `  ${path.relative(appRoot, plan.cliPluginsPath)}: import and registration`,
      );
    }
    if (plan.skippedClientEntry === 'no-client-entry') {
      lines.push(
        '  client/plugins.ts: skipped, this plugin ships no client entry',
      );
    }
    if (plan.skippedClientEntry === 'disabled') {
      lines.push('  client/plugins.ts: skipped, the plugin is disabled');
    }
    if (plan.skippedServerEntry === 'no-server-entry') {
      lines.push(
        '  server/plugins.ts: skipped, this plugin ships no server entry',
      );
    }
    if (plan.skippedServerEntry === 'disabled') {
      lines.push('  server/plugins.ts: skipped, the plugin is disabled');
    }
    if (plan.skippedCliEntry === 'no-cli-entry') {
      lines.push('  cli/plugins.ts: skipped, this plugin ships no CLI entry');
    }
    if (plan.skippedCliEntry === 'disabled') {
      lines.push('  cli/plugins.ts: skipped, the plugin is disabled');
    }
    if (plan.manualClientEdit) {
      lines.push(
        ...manualEditInstructions(plan.manualClientEdit, appRoot, dryRun),
      );
    }
    if (plan.manualServerEdit) {
      lines.push(
        ...manualEditInstructions(plan.manualServerEdit, appRoot, dryRun),
      );
    }
    if (plan.manualCliEdit) {
      lines.push(
        ...manualEditInstructions(plan.manualCliEdit, appRoot, dryRun),
      );
    }
    return lines.join('\n');
  }
}

/**
 * Spells out the edit that could not be applied. The wording is deliberately literal — file, both lines, and where
 * each one goes — because the reader may be an agent with no view of the file, and "add the plugin to your client
 * entry" is not something it can act on.
 */
function manualEditInstructions(
  edit: ManualClientPluginEdit | ManualServerPluginEdit | ManualCliPluginEdit,
  appRoot: string,
  dryRun: boolean,
): string[] {
  const relativePath = path.relative(appRoot, edit.filePath);
  const registerCallName = relativePath.startsWith(`server${path.sep}`)
    ? 'defineServerPlugins'
    : relativePath.startsWith(`cli${path.sep}`)
      ? 'defineCliPlugins'
      : 'defineClientPlugins';
  return [
    `  ${relativePath}: not edited, TypeScript is not installed in this app`,
    '',
    dryRun
      ? `Everything else would be done. ${relativePath} would need two lines added by hand:`
      : `Everything else is done. Add these two lines to ${relativePath} by hand:`,
    `  1. after the existing imports:  ${edit.importStatement}`,
    `  2. inside ${registerCallName}([...]):  ${edit.entry}`,
    '',
    'Or install TypeScript and re-run this command to have it written for you:',
    '  pnpm add -D typescript',
  ];
}
