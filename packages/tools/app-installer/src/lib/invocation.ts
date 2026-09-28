import { formatCommandLine, type CommandLine } from '@nocobase/cli-envelope';
import { createRequire } from 'node:module';
import { defaultRegistry, normalizeRegistry } from './registry.ts';

export const INSTALLER_PACKAGE = '@nocobase/app-installer';

/** This installer's own version; `src/lib` and `dist/lib` both sit two levels below the package root. */
export const INSTALLER_VERSION: string = (
  createRequire(import.meta.url)('../../package.json') as { version: string }
).version;

export interface InstallerCommandOptions {
  /** Registry to fetch the installer from; the installation's own registry where one is known. */
  registry?: string;
  /** A version or dist-tag to run; this installer's own version by default. */
  version?: string;
}

/**
 * An app-installer command as a suggestion's `run` names it: through npx, because nothing installs an `app-installer`
 * binary on PATH, and with the registry named, because NocoBase 3 packages are not on the public npm registry. `--yes`
 * answers npx's own install prompt, which would otherwise block an agent. The version is pinned to this installer's, so
 * a recovery runs the same code that wrote the state it recovers from.
 */
export function installerCommandLine(
  args: readonly string[],
  options: InstallerCommandOptions = {},
): CommandLine {
  const registry = normalizeRegistry(options.registry ?? defaultRegistry());
  const version = options.version ?? INSTALLER_VERSION;
  return {
    command: 'npx',
    args: [
      '--yes',
      `--registry=${registry}`,
      `${INSTALLER_PACKAGE}@${version}`,
      ...args,
    ],
  };
}

/**
 * The same command written into prose or help, where it is read rather than run: `args` is inserted as given, so it may
 * hold a placeholder such as `<the copied archive>`, and anything a shell would split must already be quoted.
 */
export function installerCommand(
  args: string,
  options: InstallerCommandOptions = {},
): string {
  return `${formatCommandLine(installerCommandLine([], options))} ${args}`;
}
