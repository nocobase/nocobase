import { Args, Flags } from '@oclif/core';
import type { Command, Interfaces } from '@oclif/core';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { CommandError, isCommandError } from '../../command/errors.ts';
import {
  PluginUnregistrationCommand,
  type PluginUnregisterResult,
} from '../plugin/unregister.ts';
import {
  appPackageManager,
  removeDependencyCommand,
} from '../../lib/plugin-install.ts';
import {
  classifyPluginError,
  type PluginCommandInvocation,
} from '../../lib/plugin-json.ts';
import {
  CommandFailedError,
  runAttached,
  runCommand,
} from '../../lib/run-command.ts';
import {
  planPackageSkillRemovals,
  removePackageSkills,
} from '../../lib/skills-sync.ts';
import { resolveAppRoot } from '../../lib/workspace-app.ts';

const NOCOBASE_PACKAGE_PATTERN = /^@nocobase\/[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const PLUGIN_PACKAGE_PREFIX = '@nocobase/app-plugin-';
const DEPENDENCY_SECTIONS = [
  'dependencies',
  'devDependencies',
  'optionalDependencies',
  'peerDependencies',
] as const;

type DependencySection = (typeof DEPENDENCY_SECTIONS)[number];

/** What removing a package that is not a plugin would do; status `success-noop` when there is nothing to remove. */
export interface PackageRemoveDryRunResult {
  readonly mode: 'dry-run';
  readonly appRoot: string;
  readonly packageName: string;
  readonly dependencySections: readonly DependencySection[];
  readonly skillRemovals: readonly string[];
  readonly commands: readonly PluginCommandInvocation[];
}

/** What removing a package that is not a plugin did; status `success-noop` when there was nothing to remove. */
export interface PackageRemoveRemovedResult {
  readonly mode: 'remove';
  readonly appRoot: string;
  readonly packageName: string;
  readonly removedFrom: readonly DependencySection[];
  readonly removedSkills: readonly string[];
  readonly commands: readonly PluginCommandInvocation[];
}

/** A plugin package is unregistered, so it answers with `plugin unregister`'s result. */
export type PackageRemoveResult =
  | PackageRemoveDryRunResult
  | PackageRemoveRemovedResult
  | PluginUnregisterResult;

function packageManagerRemovalError(
  packageManager: string,
  packageName: string,
  cause?: unknown,
): CommandError {
  const detail =
    cause instanceof CommandFailedError && cause.stderr.length > 0
      ? ` ${cause.stderr}`
      : '';
  return new CommandError(
    `${packageManager} could not remove ${packageName}.${detail}`,
    {
      code: 'PACKAGE_MANAGER_FAILED',
      suggestions: [
        'Fix the package manager error, then run nocobase package remove again.',
      ],
      cause,
    },
  );
}

export default class PackageRemove extends PluginUnregistrationCommand {
  static override summary =
    'Remove a direct NocoBase package dependency and its synchronized Skills.';
  static override description =
    'Removes a directly declared @nocobase/* dependency with the App package manager, then deletes only the skills recorded as belonging to that package. A package already absent from package.json still has stale recorded skills cleaned. Plugin packages also unregister their Client, Server, and CLI contributions.';

  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %> @nocobase/app-skills',
    '<%= config.bin %> <%= command.id %> @nocobase/app-plugin-scheduler',
    '<%= config.bin %> <%= command.id %> @nocobase/app-skills --dry-run',
    '<%= config.bin %> <%= command.id %> @nocobase/app-skills --workspace-root . --app app-template-default',
  ];

  static override args: {
    name: Interfaces.Arg<string>;
  } = {
    name: Args.string({
      description: 'Full @nocobase/* package name to remove.',
      required: true,
    }),
  };

  static override flags: {
    dir: Interfaces.OptionFlag<string | undefined>;
    app: Interfaces.OptionFlag<string | undefined>;
    'workspace-root': Interfaces.OptionFlag<string | undefined>;
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
    'dry-run': Flags.boolean({
      default: false,
      description: 'Print what would change without writing anything.',
    }),
  };

  public async run(): Promise<PackageRemoveResult> {
    const { args, flags } = await this.parse(PackageRemove);
    try {
      return await this.remove(args.name, flags);
    } catch (error) {
      throw classifyPluginError(error);
    }
  }

  private async remove(
    name: string,
    flags: {
      readonly dir?: string;
      readonly app?: string;
      readonly 'workspace-root'?: string;
      readonly 'dry-run': boolean;
    },
  ): Promise<PackageRemoveResult> {
    const packageName = normalizePackageName(name);
    const appRoot = await resolveAppRoot({
      app: flags.app,
      dir: flags.dir,
      workspaceRoot: flags['workspace-root'],
    });
    const dependencySections = await readDependencySections(
      appRoot,
      packageName,
    );

    if (packageName.startsWith(PLUGIN_PACKAGE_PREFIX)) {
      return this.unregisterPlugin(packageName, {
        app: flags.app,
        dependencySections,
        dir: flags.dir,
        dryRun: flags['dry-run'],
        noInstall: dependencySections.length === 0,
        workspaceRoot: flags['workspace-root'],
      });
    }

    const skillRemovals = await planPackageSkillRemovals(appRoot, packageName);
    const packageManager =
      dependencySections.length === 0
        ? undefined
        : await appPackageManager(appRoot);
    const invocation =
      packageManager === undefined
        ? undefined
        : removeDependencyCommand(packageManager, packageName);
    const commands: PluginCommandInvocation[] =
      invocation === undefined
        ? []
        : [
            {
              command: invocation.packageManager,
              args: invocation.args,
              cwd: appRoot,
            },
          ];

    if (flags['dry-run']) {
      // A dry run changes nothing, whatever it would do.
      this.setStatus('success-noop');
      if (dependencySections.length === 0 && skillRemovals.length === 0) {
        this.log(
          `${packageName} is not declared in this app and has no synchronized skills.`,
        );
      } else {
        this.log(`Would remove ${packageName}.`);
        for (const command of commands) {
          this.log(`  ${command.command} ${command.args.join(' ')}`);
        }
        for (const skill of skillRemovals) {
          this.log(`  would remove skill ${skill}`);
        }
      }
      return {
        mode: 'dry-run',
        appRoot,
        packageName,
        dependencySections,
        skillRemovals,
        commands,
      };
    }

    if (invocation !== undefined) {
      this.log(`${invocation.packageManager} ${invocation.args.join(' ')}`);
      // Under --json the package manager's output is collected rather than shown: it would corrupt the one document
      // on stdout.
      try {
        if (this.jsonEnabled()) {
          await runCommand(invocation.packageManager, [...invocation.args], {
            cwd: appRoot,
          });
        } else {
          const exitCode = await runAttached(
            invocation.packageManager,
            [...invocation.args],
            { cwd: appRoot },
          );
          if (exitCode !== 0) {
            throw packageManagerRemovalError(
              invocation.packageManager,
              packageName,
            );
          }
        }
      } catch (error) {
        if (isCommandError(error)) throw error;
        throw packageManagerRemovalError(
          invocation.packageManager,
          packageName,
          error,
        );
      }

      const remainingSections = await readDependencySections(
        appRoot,
        packageName,
      );
      if (remainingSections.length > 0) {
        throw packageManagerRemovalError(
          invocation.packageManager,
          packageName,
        );
      }
    }

    const removedSkills = await removePackageSkills(appRoot, packageName);
    if (dependencySections.length === 0 && removedSkills.length === 0) {
      this.setStatus('success-noop');
      this.log(
        `${packageName} is not declared in this app and has no synchronized skills.`,
      );
    } else {
      this.log(`Removed ${packageName}.`);
      for (const skill of removedSkills) {
        this.log(`  removed skill ${skill}`);
      }
    }
    return {
      mode: 'remove',
      appRoot,
      packageName,
      removedFrom: dependencySections,
      removedSkills,
      commands,
    };
  }
}

function normalizePackageName(packageName: string): string {
  const normalized = packageName.trim();
  if (!NOCOBASE_PACKAGE_PATTERN.test(normalized)) {
    throw new Error(
      `Package name must be a full @nocobase/* package name, found ${packageName}.`,
    );
  }
  return normalized;
}

async function readDependencySections(
  appRoot: string,
  packageName: string,
): Promise<DependencySection[]> {
  const manifestPath = path.join(appRoot, 'package.json');
  let manifest: unknown;
  try {
    manifest = JSON.parse(await readFile(manifestPath, 'utf8')) as unknown;
  } catch (error) {
    throw new Error(`Invalid package manifest: ${manifestPath}`, {
      cause: error,
    });
  }
  if (!isRecord(manifest)) {
    throw new Error(`${manifestPath} must contain a JSON object.`);
  }

  const sections: DependencySection[] = [];
  for (const section of DEPENDENCY_SECTIONS) {
    const dependencies = manifest[section];
    if (dependencies === undefined) continue;
    if (!isRecord(dependencies)) {
      throw new Error(`${manifestPath} must define ${section} as an object.`);
    }
    if (Object.prototype.hasOwnProperty.call(dependencies, packageName)) {
      sections.push(section);
    }
  }
  return sections;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
