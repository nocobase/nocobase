import { Args, Flags } from '@oclif/core';
import { parse } from '@oclif/core/parser';
import {
  DEFAULT_TEMPLATE,
  DEFAULT_TEMPLATE_TAG,
  TEMPLATE_ALIASES,
  TEMPLATE_TAGS,
} from './template.ts';

/**
 * `pnpm create @nocobase/app crm --template=examples` passes every argument after the package name through verbatim, so
 * this parses the same argv shape a direct `npx @nocobase/create-app` invocation would produce.
 */
export const CREATE_ARGS = {
  directory: Args.string({
    description:
      'Directory to create the app in, relative to the current directory. Prompted for when omitted.',
    required: false,
  }),
};

export const CREATE_FLAGS = {
  json: Flags.boolean({
    default: false,
    description:
      'Output a final JSON result without interactive prompts. Requires DIRECTORY.',
  }),
  install: Flags.boolean({
    allowNo: true,
    default: true,
    description: 'Install dependencies after scaffolding.',
  }),
  template: Flags.string({
    default: DEFAULT_TEMPLATE,
    description: `Template to scaffold from: a name (${Object.keys(TEMPLATE_ALIASES).join(', ')}), a published package, or a path to a local package directory.`,
  }),
  'template-tag': Flags.string({
    default: DEFAULT_TEMPLATE_TAG,
    options: [...TEMPLATE_TAGS],
    description: `Channel to fetch a named template from: ${TEMPLATE_TAGS.join(', ')}. Ignored when --template names a package or a path, which already say which version to use.`,
  }),
  'nocobase-registry': Flags.string({
    description:
      'Registry for @nocobase packages only. Overrides NOCOBASE_REGISTRY.',
  }),
  help: Flags.boolean({
    char: 'h',
    default: false,
    description: 'Show this help.',
  }),
  version: Flags.boolean({
    default: false,
    description: 'Show the version.',
  }),
};

export interface ParsedInput {
  directory?: string;
  flags: {
    json: boolean;
    install: boolean;
    template: string;
    'template-tag': string;
    'nocobase-registry'?: string;
    help: boolean;
    version: boolean;
  };
}

export async function parseInput(argv: string[]): Promise<ParsedInput> {
  const parsed = await parse(argv, {
    args: CREATE_ARGS,
    flags: CREATE_FLAGS,
    strict: true,
  });

  return {
    directory: parsed.args.directory,
    flags: parsed.flags as ParsedInput['flags'],
  };
}

export function formatHelp(binary: string): string {
  return [
    'Create a NocoBase 3 application.',
    '',
    'USAGE',
    `  $ ${binary} [DIRECTORY] [FLAGS]`,
    '',
    'ARGUMENTS',
    '  DIRECTORY  Directory to create the app in. Prompted for when omitted.',
    '',
    'FLAGS',
    ...Object.entries(CREATE_FLAGS).map(([name, flag]) => {
      const label =
        'allowNo' in flag && flag.allowNo ? `--[no-]${name}` : `--${name}`;
      return `  ${label.padEnd(18)} ${flag.description ?? ''}`;
    }),
    '',
    'EXAMPLES',
    `  $ ${binary} crm`,
    `  $ ${binary} crm --no-install`,
    `  $ ${binary} crm --json`,
    `  $ ${binary} crm --template=examples`,
    `  $ ${binary} crm --template-tag=beta`,
    '',
    'NOTES',
    '  Registry selection follows your npm/pnpm configuration.',
    '  Set NOCOBASE_REGISTRY or --nocobase-registry to override @nocobase packages only.',
    '  multi-portal is commercial: log in to https://pkg-v3.nocobase.com/ first and select that registry.',
    '  multi-app is a commercial Main application template; licensed registry access is required.',
    '  It creates Main only. Add and configure independent child applications when needed.',
    '',
    '  The generated app is not configured yet. Configure it inside the app directory with:',
    '    pnpm nocobase config init',
    '',
    '  That writes config.yml with generated secrets for SQLite, whose driver the app already has.',
    '  For another database, install its driver and name the dialect:',
    '    pnpm add @nocobase/db-postgres',
    '    pnpm nocobase config init --dialect postgres',
  ].join('\n');
}
