// An application's own command line, as its `package.json` declares it under `nocobase.cli`. `nocobase cli build`
// packages it with `@nocobase/app-cli-client` into standalone tarballs the application serves, and `nocobase cli link`
// makes it a local command; the packaged CLI reads the same object back from its own `package.json`
// (`runAppCliPackage` of `@nocobase/app-cli-client`). An application without `nocobase.cli` has no CLI of its own.
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { CommandError } from '../command/errors.ts';

/** `nocobase.cli` in an application's `package.json`. The shape is `AppCliBrand` of `@nocobase/app-cli-client`. */
export interface CliBrand {
  /** The command, such as `acme`: also the product the application serves it as, and so a lowercase name. */
  readonly bin: string;
  readonly displayName?: string;
  readonly description?: string;
  /** `.<bin>` when left out. */
  readonly stateDir?: string;
  readonly homeEnv?: string;
  readonly envPrefix?: string;
  readonly keychainEnv?: string;
  readonly keychainService?: string;
  /** `<stateDir>/run.json` when left out. */
  readonly runCredentialsFile?: string;
  readonly exampleServer?: string;
  readonly auth?: { readonly clientId?: string; readonly basePath?: string };
  readonly manifestPath?: string;
  /** Skill directories, relative to the application, the packaged CLI ships in `skills/`. */
  readonly skills?: readonly string[];
  /** The packaged CLI's version; the application's when left out. */
  readonly version?: string;
}

/** The application's manifest, as far as packaging its CLI reads it. */
export interface CliApplication {
  readonly root: string;
  readonly name: string;
  readonly version: string;
  /** Undefined when the application declares no CLI. */
  readonly brand: CliBrand | undefined;
}

/** What a command name may be: what the application's distribution accepts as a product. */
const COMMAND_NAME = /^[a-z][a-z0-9-]{0,63}$/u;

/** Names a CLI of an application cannot take. */
const RESERVED_COMMANDS: readonly string[] = ['nocobase', 'nocobase-runner'];

const STRING_FIELDS = [
  'displayName',
  'description',
  'stateDir',
  'homeEnv',
  'envPrefix',
  'keychainEnv',
  'keychainService',
  'runCredentialsFile',
  'exampleServer',
  'manifestPath',
  'version',
] as const;

function invalid(message: string): CommandError {
  return new CommandError(message, {
    code: 'CLI_CONFIG_INVALID',
    suggestions: [
      'Fix nocobase.cli in package.json; packages/app/app-cli/README.md lists its fields.',
    ],
  });
}

/** Checks `value` as a `nocobase.cli` object, and returns it typed. */
export function parseCliBrand(value: unknown): CliBrand {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalid('nocobase.cli in package.json must be an object.');
  const record = value as Record<string, unknown>;
  const bin = record['bin'];
  if (typeof bin !== 'string' || !COMMAND_NAME.test(bin))
    throw invalid(
      'nocobase.cli.bin must be a lowercase command name, such as "acme".',
    );
  if (RESERVED_COMMANDS.includes(bin))
    throw invalid(`nocobase.cli.bin cannot be ${bin}: NocoBase uses it.`);
  for (const field of STRING_FIELDS) {
    const entry = record[field];
    if (entry !== undefined && (typeof entry !== 'string' || entry === ''))
      throw invalid(`nocobase.cli.${field} must be a non-empty string.`);
  }
  for (const field of ['stateDir', 'runCredentialsFile'] as const) {
    const entry = record[field];
    if (
      typeof entry === 'string' &&
      (path.isAbsolute(entry) || entry.split(/[\\/]/u).includes('..'))
    )
      throw invalid(`nocobase.cli.${field} must be a relative path.`);
  }
  const auth = record['auth'];
  if (auth !== undefined) {
    if (typeof auth !== 'object' || auth === null || Array.isArray(auth))
      throw invalid('nocobase.cli.auth must be an object.');
    for (const [key, entry] of Object.entries(auth)) {
      if (key !== 'clientId' && key !== 'basePath')
        throw invalid(`nocobase.cli.auth has no field ${key}.`);
      if (typeof entry !== 'string' || entry === '')
        throw invalid(`nocobase.cli.auth.${key} must be a non-empty string.`);
    }
  }
  const skills = record['skills'];
  if (
    skills !== undefined &&
    (!Array.isArray(skills) ||
      skills.some(
        (entry) =>
          typeof entry !== 'string' ||
          entry === '' ||
          path.isAbsolute(entry) ||
          entry.split(/[\\/]/u).includes('..'),
      ))
  )
    throw invalid(
      'nocobase.cli.skills must list directories relative to the application.',
    );
  return value as CliBrand;
}

/** The application at `root`, with its `nocobase.cli` if it declares one. */
export async function readCliApplication(
  root: string,
): Promise<CliApplication> {
  const manifest = JSON.parse(
    await readFile(path.join(root, 'package.json'), 'utf8'),
  ) as { name?: unknown; version?: unknown; nocobase?: { cli?: unknown } };
  const declared = manifest.nocobase?.cli;
  return {
    root,
    name: typeof manifest.name === 'string' ? manifest.name : 'app',
    version: typeof manifest.version === 'string' ? manifest.version : '0.0.0',
    brand: declared === undefined ? undefined : parseCliBrand(declared),
  };
}

/** The application's CLI, or a failure saying how to declare one. */
export function requireCliBrand(application: CliApplication): CliBrand {
  if (application.brand !== undefined) return application.brand;
  throw new CommandError(
    'This application declares no command line of its own: package.json has no nocobase.cli.',
    {
      code: 'CLI_NOT_DECLARED',
      suggestions: [
        'Add "nocobase": { "cli": { "bin": "<command>", "displayName": "<Name>" } } to package.json, and @nocobase/app-cli-client to its devDependencies.',
      ],
    },
  );
}

/** The brand the packaged CLI carries: what it reads at run time, without what only packaging uses. */
export function runtimeBrand(brand: CliBrand): CliBrand {
  const { skills: _skills, version: _version, ...runtime } = brand;
  return runtime;
}

/**
 * The entry of a packaged or linked CLI, `bin/run.js`: it runs `@nocobase/app-cli-client` with the `nocobase.cli` of
 * the package it sits in. `sourceHooks` lets it run workspace packages from their TypeScript sources, which import their
 * siblings by the compiled name (`./x.js`), as a link inside a source checkout does.
 */
export function cliEntry(bin: string, sourceHooks: boolean): string {
  return [
    '#!/usr/bin/env node',
    "// Generated by `nocobase cli build` or `nocobase cli link`: runs the CLI this package's nocobase.cli declares.",
    "import path from 'node:path';",
    "import { fileURLToPath } from 'node:url';",
    ...(sourceHooks ? ["import { registerHooks } from 'node:module';"] : []),
    '',
    "if (Number(process.versions.node.split('.')[0]) < 24) {",
    `  process.stderr.write(\`${bin} needs Node.js 24 or newer; this is \${process.version}.\\n\`);`,
    '  process.exit(1);',
    '}',
    ...(sourceHooks
      ? [
          '',
          'registerHooks({',
          '  resolve(specifier, context, nextResolve) {',
          '    try {',
          '      return nextResolve(specifier, context);',
          '    } catch (error) {',
          "      const parent = context.parentURL ?? '';",
          "      if (specifier.startsWith('.') && specifier.endsWith('.js') && parent.endsWith('.ts') && !parent.includes('/node_modules/'))",
          '        return nextResolve(`${specifier.slice(0, -3)}.ts`, context);',
          '      throw error;',
          '    }',
          '  },',
          '});',
        ]
      : []),
    '',
    "const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');",
    "const { runAppCliPackage } = await import('@nocobase/app-cli-client');",
    'await runAppCliPackage(root, process.argv.slice(2));',
    '',
  ].join('\n');
}
