import { Args, Flags } from '@oclif/core';
import type { Command, Interfaces } from '@oclif/core';
import { createHash } from 'node:crypto';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import {
  createCliPluginsEditor,
  readCliPlugins,
} from '../../lib/cli-plugins.ts';
import {
  createClientPluginsEditor,
  readClientPlugins,
} from '../../lib/client-plugins.ts';
import { installedPluginDirectory } from '../../lib/plugin-install.ts';
import {
  hasCliPluginEntry,
  hasClientPluginEntry,
  hasServerPluginEntry,
  pluginPackageName,
} from '../../lib/plugin-registration.ts';
import { classifyPluginError } from '../../lib/plugin-json.ts';
import {
  createServerPluginsEditor,
  readServerPlugins,
} from '../../lib/server-plugins.ts';
import { collectPluginSkills } from '../../lib/skills-sync.ts';
import { resolveAppRoot } from '../../lib/workspace-app.ts';
import { AppCommand } from '../../context.ts';

/** An inconsistency between the plugin's package and how the App records and wires it. */
export interface PluginInspectIssue {
  readonly code: string;
  readonly message: string;
  readonly severity: 'error' | 'warning';
}

/** A command that repairs an issue, as an executable and its arguments. */
export interface PluginInspectSuggestion {
  readonly command: string;
  readonly args: readonly string[];
}

/** Whether a composition root registers the plugin, and at which position. */
export interface PluginInspectComposition {
  readonly registered: boolean;
  readonly order?: number;
}

/** How the App's synchronized Skills compare with the ones the installed plugin ships. */
export interface PluginInspectSkills {
  readonly checked: boolean;
  /** Why the Skills were not compared, when `checked` is false. */
  readonly reason?: 'plugin-not-installed';
  readonly source: readonly string[];
  readonly synchronized: readonly string[];
  readonly missing: readonly string[];
  readonly stale: readonly string[];
  readonly contentMatches: boolean;
}

export interface PluginInspectResult {
  readonly app: { readonly packageName: string; readonly appRoot: string };
  readonly plugin: {
    readonly packageName: string;
    readonly installed: boolean;
    readonly pluginDirectory: string | undefined;
    readonly exports: {
      readonly client: boolean;
      readonly serverPlugin: boolean;
      readonly cli: boolean;
    };
  };
  readonly dependency: {
    readonly field: 'dependencies' | 'devDependencies' | undefined;
    readonly range: string | undefined;
  };
  readonly registration: { readonly enabled: boolean };
  readonly composition: {
    readonly client: PluginInspectComposition;
    readonly server: PluginInspectComposition;
    readonly cli: PluginInspectComposition;
  };
  readonly skills: PluginInspectSkills;
  readonly consistent: boolean;
  readonly issues: readonly PluginInspectIssue[];
  /** Commands that repair the issues. An inconsistency is a finding, not a failure, so these live in the result. */
  readonly suggestions: readonly PluginInspectSuggestion[];
}

export default class PluginInspect extends AppCommand {
  static override summary = "Inspect a plugin's static registration state.";
  static override description =
    'Reads the installed package, dependency records, Client and Server composition roots, and synchronized Skills without modifying the App.';
  static override examples: Command.Example[] = [
    '<%= config.bin %> <%= command.id %> audit-log --json',
    '<%= config.bin %> <%= command.id %> audit-log --workspace-root . --app app-template-default --json',
  ];
  static override args: {
    name: Interfaces.Arg<string>;
  } = {
    name: Args.string({
      description:
        'Plugin short name or full scoped app-plugin-* or app-module-* name.',
      required: true,
    }),
  };
  static override flags: {
    dir: Interfaces.OptionFlag<string | undefined>;
    app: Interfaces.OptionFlag<string | undefined>;
    'workspace-root': Interfaces.OptionFlag<string | undefined>;
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
  };

  public async run(): Promise<PluginInspectResult> {
    const { args, flags } = await this.parse(PluginInspect);
    let result: PluginInspectResult;
    try {
      const appRoot = await resolveAppRoot({
        app: flags.app,
        dir: flags.dir,
        workspaceRoot: flags['workspace-root'],
      });
      result = await inspectPlugin(
        appRoot,
        pluginPackageName(args.name),
        targetArgs(flags),
      );
    } catch (error) {
      throw classifyPluginError(error);
    }
    const { issues, plugin } = result;
    this.log(
      `${plugin.packageName}: ${issues.length === 0 ? 'registration state is consistent' : `${issues.length} issue(s) found`}`,
    );
    for (const issue of issues) {
      this.log(`  ${issue.severity}: ${issue.message}`);
    }
    return result;
  }
}

async function inspectPlugin(
  appRoot: string,
  packageName: string,
  target: readonly string[],
): Promise<PluginInspectResult> {
  const manifest = JSON.parse(
    await readFile(path.join(appRoot, 'package.json'), 'utf8'),
  ) as {
    name?: string;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const pluginDirectory = await installedPluginDirectory(appRoot, packageName);
  const dependencyField = manifest.dependencies?.[packageName]
    ? 'dependencies'
    : manifest.devDependencies?.[packageName]
      ? 'devDependencies'
      : undefined;
  const dependencyRange =
    manifest.dependencies?.[packageName] ??
    manifest.devDependencies?.[packageName];
  const clientExport = pluginDirectory
    ? await hasClientPluginEntry(pluginDirectory)
    : false;
  const serverExport = pluginDirectory
    ? await hasServerPluginEntry(pluginDirectory)
    : false;
  const cliExport = pluginDirectory
    ? await hasCliPluginEntry(pluginDirectory)
    : false;
  const issues: PluginInspectIssue[] = [];

  if (!pluginDirectory)
    issues.push({
      code: 'PLUGIN_NOT_INSTALLED',
      message: `${packageName} is not installed in the App.`,
      severity: 'error',
    });
  if (!dependencyRange)
    issues.push({
      code: 'DEPENDENCY_MISSING',
      message: `${packageName} is not declared as an App dependency.`,
      severity: 'error',
    });
  const client = await inspectComposition(appRoot, packageName, 'client');
  const server = await inspectComposition(appRoot, packageName, 'server');
  const cli = await inspectComposition(appRoot, packageName, 'cli');
  const enabled = client.registered || server.registered || cli.registered;
  if (client.registered && !clientExport)
    issues.push({
      code: 'CLIENT_ENTRY_UNEXPECTED',
      message: 'Client registration has no matching package export.',
      severity: 'error',
    });
  if (server.registered && !serverExport)
    issues.push({
      code: 'SERVER_ENTRY_UNEXPECTED',
      message: 'Server registration has no matching package export.',
      severity: 'error',
    });
  if (cli.registered && !cliExport)
    issues.push({
      code: 'CLI_ENTRY_UNEXPECTED',
      message: 'CLI registration has no matching package export.',
      severity: 'error',
    });

  const skills: PluginInspectSkills = pluginDirectory
    ? await inspectSkills(appRoot, packageName, pluginDirectory)
    : {
        checked: false,
        reason: 'plugin-not-installed',
        source: [],
        synchronized: [],
        missing: [],
        stale: [],
        contentMatches: false,
      };
  if (
    skills.checked &&
    (skills.missing.length > 0 ||
      skills.stale.length > 0 ||
      !skills.contentMatches)
  )
    issues.push({
      code: 'SKILLS_OUT_OF_DATE',
      message: `Synchronized Skills do not match ${packageName}.`,
      severity: 'warning',
    });

  return {
    app: { packageName: manifest.name ?? appRoot, appRoot },
    plugin: {
      packageName,
      installed: pluginDirectory !== undefined,
      pluginDirectory,
      exports: {
        client: clientExport,
        serverPlugin: serverExport,
        cli: cliExport,
      },
    },
    dependency: { field: dependencyField, range: dependencyRange },
    registration: { enabled },
    composition: {
      client,
      server,
      cli,
    },
    skills,
    consistent: issues.length === 0,
    issues,
    suggestions: suggestionsFor(issues, packageName, target),
  };
}

async function inspectComposition(
  appRoot: string,
  packageName: string,
  kind: 'client' | 'server' | 'cli',
): Promise<PluginInspectComposition> {
  const file =
    kind === 'client'
      ? await readClientPlugins(appRoot)
      : kind === 'server'
        ? await readServerPlugins(appRoot)
        : await readCliPlugins(appRoot);
  if (!file.exists) return { registered: false };
  const editor =
    kind === 'client'
      ? await createClientPluginsEditor(appRoot)
      : kind === 'server'
        ? await createServerPluginsEditor(appRoot)
        : await createCliPluginsEditor(appRoot);
  const entries = editor.list(file.sourceText);
  const order = entries.findIndex((entry) => entry.packageName === packageName);
  return order === -1
    ? { registered: false }
    : { registered: true, order: order + 1 };
}

async function inspectSkills(
  appRoot: string,
  packageName: string,
  pluginDirectory: string,
): Promise<PluginInspectSkills> {
  const source = await collectPluginSkills({ packageName, pluginDirectory });
  const targetRoot = path.join(appRoot, '.agents', 'skills');
  const synchronized = await safeDirectoryNames(targetRoot);
  const owned = synchronized.filter(
    (name) => name === source.prefix || name.startsWith(`${source.prefix}-`),
  );
  const sourceNames = source.skills.map((skill) => skill.name);
  const missing = sourceNames.filter((name) => !owned.includes(name));
  const stale = owned.filter((name) => !sourceNames.includes(name));
  let contentMatches = missing.length === 0 && stale.length === 0;
  if (contentMatches) {
    for (const skill of source.skills) {
      if (
        (await hashDirectory(skill.sourcePath)) !==
        (await hashDirectory(path.join(targetRoot, skill.name)))
      ) {
        contentMatches = false;
        break;
      }
    }
  }
  return {
    checked: true,
    source: sourceNames,
    synchronized: owned,
    missing,
    stale,
    contentMatches,
  };
}

async function safeDirectoryNames(directory: string): Promise<string[]> {
  try {
    return (await readdir(directory, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'ENOTDIR') return [];
    throw error;
  }
}

async function hashDirectory(directory: string): Promise<string> {
  const hash = createHash('sha256');
  const visit = async (current: string, relative = ''): Promise<void> => {
    const entries = await readdir(current, { withFileTypes: true });
    for (const entry of entries.sort((left, right) =>
      left.name.localeCompare(right.name),
    )) {
      const childRelative = path.join(relative, entry.name);
      const child = path.join(current, entry.name);
      if (entry.isDirectory()) await visit(child, childRelative);
      else if (entry.isFile()) {
        hash.update(childRelative);
        hash.update(await readFile(child));
      }
    }
  };
  await visit(directory);
  return hash.digest('hex');
}

/**
 * The flags that located the application, repeated on every suggestion so it acts on the same App from the same
 * working directory.
 */
function targetArgs(flags: {
  readonly dir?: string;
  readonly app?: string;
  readonly 'workspace-root'?: string;
}): string[] {
  if (flags['workspace-root'] !== undefined) {
    return [
      '--workspace-root',
      flags['workspace-root'],
      ...(flags.app === undefined ? [] : ['--app', flags.app]),
    ];
  }
  return flags.dir === undefined ? [] : ['--dir', flags.dir];
}

function suggestionFor(
  code: string,
  packageName: string,
  target: readonly string[],
): PluginInspectSuggestion {
  const shortName = packageName.replace('@nocobase/app-plugin-', '');
  if (code === 'PLUGIN_NOT_INSTALLED')
    return {
      command: 'pnpm',
      args: ['nocobase', 'plugin', 'register', shortName, ...target],
    };
  if (code === 'SKILLS_OUT_OF_DATE')
    return {
      command: 'pnpm',
      // `--package` with the full name, not the compatibility `--plugin`: agents copy suggested commands as they are.
      args: ['nocobase', 'skills', 'sync', '--package', packageName, ...target],
    };
  return {
    command: 'pnpm',
    args: [
      'nocobase',
      'plugin',
      'register',
      shortName,
      '--no-install',
      ...target,
    ],
  };
}

function suggestionsFor(
  issues: readonly PluginInspectIssue[],
  packageName: string,
  target: readonly string[],
): PluginInspectSuggestion[] {
  const notInstalled = issues.find(
    ({ code }) => code === 'PLUGIN_NOT_INSTALLED',
  );
  const actionableIssues = notInstalled ? [notInstalled] : issues;
  return uniqueSuggestions(
    actionableIssues.map((issue) =>
      suggestionFor(issue.code, packageName, target),
    ),
  );
}

function uniqueSuggestions(
  suggestions: readonly PluginInspectSuggestion[],
): PluginInspectSuggestion[] {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    const key = JSON.stringify([suggestion.command, suggestion.args]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
