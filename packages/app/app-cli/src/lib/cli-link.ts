// `nocobase cli link`: the application's CLI as a local command, without packing it. A small package under
// `node_modules/.cache/nocobase-cli/link/<bin>/` (its `nocobase.cli`, the entry and a copy of the skills it ships) runs
// `@nocobase/app-cli-client` as the application resolves it, from its sources in a source checkout; the command is a
// link to its entry in `node_modules/.bin`, or in the directory `--bin-dir` names. A runner started from the checkout
// uses it with `register --cli <bin>=<the link>`, and gets the skills the packaged CLI would ship.
import { chmod, lstat, mkdir, rm, symlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { CommandError } from '../command/errors.ts';
import {
  cliEntry,
  runtimeBrand,
  type CliApplication,
  type CliBrand,
} from './cli-brand.ts';
import { copySkills, findPackageDir } from './cli-pack.ts';

export interface CliLinkResult {
  readonly bin: string;
  readonly version: string;
  /** The command: the link that was made. */
  readonly command: string;
  /** The package the link runs. */
  readonly packageDir: string;
  readonly skills: readonly string[];
}

/** Links the application's CLI `brand` as a command in `binDir`. */
export async function linkCli(
  application: CliApplication,
  brand: CliBrand,
  binDir: string,
): Promise<CliLinkResult> {
  if (
    findPackageDir(application.root, '@nocobase/app-cli-client') === undefined
  )
    throw new CommandError(
      '@nocobase/app-cli-client is not installed in this application.',
      {
        code: 'CLI_PACKAGE_MISSING',
        suggestions: [
          'Add @nocobase/app-cli-client to devDependencies and install, then link again.',
        ],
      },
    );
  const packageDir = path.join(
    application.root,
    'node_modules',
    '.cache',
    'nocobase-cli',
    'link',
    brand.bin,
  );
  await rm(packageDir, { recursive: true, force: true });
  await mkdir(path.join(packageDir, 'bin'), { recursive: true });
  const version = brand.version ?? application.version;
  const entry = path.join(packageDir, 'bin', 'run.js');
  await writeFile(entry, cliEntry(brand.bin, true));
  await chmod(entry, 0o755);
  let skills: string[] = [];
  if (brand.skills !== undefined && brand.skills.length > 0) {
    await mkdir(path.join(packageDir, 'skills'), { recursive: true });
    skills = await copySkills(
      application.root,
      brand.skills,
      path.join(packageDir, 'skills'),
    );
  }
  await writeFile(
    path.join(packageDir, 'package.json'),
    `${JSON.stringify(
      {
        name: `${brand.bin}-cli`,
        version,
        private: true,
        type: 'module',
        bin: { [brand.bin]: './bin/run.js' },
        nocobase: { cli: runtimeBrand(brand) },
      },
      null,
      2,
    )}\n`,
  );
  const command = path.join(path.resolve(binDir), brand.bin);
  await mkdir(path.dirname(command), { recursive: true });
  // A link is replaced, as a link made before; anything else there is someone else's.
  const existing = await lstat(command).catch(() => undefined);
  if (existing !== undefined && !existing.isSymbolicLink())
    throw new CommandError(`${command} exists and is not a link.`, {
      code: 'CLI_LINK_EXISTS',
      suggestions: [
        'Remove it, or link into another directory with --bin-dir.',
      ],
    });
  if (existing !== undefined) await rm(command);
  await symlink(entry, command);
  return { bin: brand.bin, version, command, packageDir, skills };
}
