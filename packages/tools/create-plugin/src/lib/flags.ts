import {
  ALL_PLUGIN_CAPABILITIES,
  isPluginCapability,
  PLUGIN_CAPABILITIES,
  type PluginCapability,
} from './capabilities.ts';

export interface CreatePluginFlags {
  readonly capabilities: readonly PluginCapability[];
  readonly description?: string;
  readonly directory?: string;
  readonly displayName?: string;
  readonly dryRun: boolean;
  readonly empty: boolean;
  readonly help: boolean;
  readonly install: boolean;
  readonly json: boolean;
  readonly version: boolean;
}

export interface ParsedCreatePluginInput {
  readonly flags: CreatePluginFlags;
  readonly name?: string;
}

export function parseCreatePluginArgs(
  args: readonly string[],
): ParsedCreatePluginInput {
  let description: string | undefined;
  let directory: string | undefined;
  let displayName: string | undefined;
  let dryRun = false;
  let empty = false;
  let help = false;
  let install = true;
  let json = false;
  let version = false;
  const capabilities: PluginCapability[] = [];
  const positionals: string[] = [];

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];

    if (argument === '--help' || argument === '-h') {
      help = true;
      continue;
    }
    if (argument === '--version') {
      version = true;
      continue;
    }
    if (argument === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (argument === '--json') {
      json = true;
      continue;
    }
    if (argument === '--empty') {
      empty = true;
      continue;
    }
    if (argument === '--with') {
      const value = args[index + 1];
      if (value === undefined || value.startsWith('-')) {
        throw new Error('--with requires a capability value.');
      }
      // `all` selects everything rather than naming one capability, so it expands here instead of being carried
      // through as a value nothing downstream would recognize.
      if (value === ALL_PLUGIN_CAPABILITIES) {
        for (const capability of PLUGIN_CAPABILITIES) {
          if (!capabilities.includes(capability)) {
            capabilities.push(capability);
          }
        }
        index += 1;
        continue;
      }
      if (!isPluginCapability(value)) {
        throw new Error(
          `Unknown plugin capability: ${value}. Supported capabilities: ${ALL_PLUGIN_CAPABILITIES}, ${PLUGIN_CAPABILITIES.join(', ')}.`,
        );
      }
      if (!capabilities.includes(value)) {
        capabilities.push(value);
      }
      index += 1;
      continue;
    }
    if (argument === '--no-install') {
      install = false;
      continue;
    }
    if (
      argument === '--dir' ||
      argument === '--display-name' ||
      argument === '--description'
    ) {
      const value = args[index + 1];
      if (value === undefined || value.startsWith('-')) {
        throw new Error(`${argument} requires a value.`);
      }
      if (argument === '--dir') {
        directory = value;
      } else if (argument === '--display-name') {
        displayName = value;
      } else {
        description = value;
      }
      index += 1;
      continue;
    }
    if (argument.startsWith('-')) {
      throw new Error(`Unknown option: ${argument}`);
    }

    positionals.push(argument);
  }

  if (positionals.length > 1) {
    throw new Error('Expected exactly one plugin name.');
  }
  if (!help && !version && positionals[0] === undefined) {
    throw new Error('A plugin name is required.');
  }
  if (!help && !version && empty && capabilities.length > 0) {
    throw new Error('--empty cannot be combined with --with.');
  }
  if (!help && !version && !empty && capabilities.length === 0) {
    throw new Error(
      'No plugin capabilities were selected. Add --with <capability> or use --empty.',
    );
  }

  return {
    flags: {
      capabilities,
      description,
      directory,
      displayName,
      dryRun,
      empty,
      help,
      install,
      json,
      version,
    },
    name: positionals[0],
  };
}

export function formatHelp(binary: string): string {
  return [
    "Create a plugin in an application's packages/ directory or a NocoBase source workspace.",
    '',
    'USAGE',
    `  ${binary} <name> (--with <capability>... | --empty) [options]`,
    '',
    'ARGUMENTS',
    '  <name>                       Short kebab-case name, for example audit-log',
    '                               (full @scope/app-plugin-* names also work)',
    '',
    'OPTIONS',
    '  --dir <directory>         Select the application or source workspace',
    '  --with <capability>          Add a capability; may be repeated',
    `                               ${ALL_PLUGIN_CAPABILITIES} selects every one of:`,
    `                               ${PLUGIN_CAPABILITIES.join(', ')}`,
    '  --empty                      Create only the package foundation',
    '  --display-name <name>        Human-readable package display name',
    '  --description <description>  Package description',
    '  --no-install                 Do not synchronize pnpm-lock.yaml',
    '  --dry-run                    Validate and print the generation plan without writing',
    '  --json                       Print a stable JSON result for tools and Agents',
    '  --version                    Show the version',
    '  -h, --help                   Show this help',
    '',
    'The generated plugin contains only the explicitly selected capabilities.',
    'Registering or enabling the plugin remains an explicit step.',
  ].join('\n');
}
