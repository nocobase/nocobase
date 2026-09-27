import { createRequire } from 'node:module';
import { defaultRegistry, normalizeRegistry } from './registry.ts';

export const INSTALLER_PACKAGE = '@nocobase/app-installer';

/** This installer's own version; `src/lib` and `dist/lib` both sit two levels below the package root. */
export const INSTALLER_VERSION: string = (
  createRequire(import.meta.url)('../../package.json') as { version: string }
).version;

/** Quotes a value for a POSIX shell when it holds anything but plain path characters, so a suggestion runs as printed. */
export function shellQuote(value: string): string {
  return /^[\w@%+=:,./-]+$/u.test(value)
    ? value
    : `'${value.replaceAll("'", "'\\''")}'`;
}

export interface InstallerCommandOptions {
  /** Registry to fetch the installer from; the installation's own registry where one is known. */
  registry?: string;
  /** A version or dist-tag to run; this installer's own version by default. */
  version?: string;
}

/**
 * An app-installer command as a suggestion prints it, so it runs as-is: through npx, because nothing installs an
 * `app-installer` binary on PATH, and with the registry named, because NocoBase 3 packages are not on the public npm
 * registry. `--yes` answers npx's own install prompt, which would otherwise block an agent. The version is pinned to
 * this installer's, so a recovery runs the same code that wrote the state it recovers from.
 */
export function installerCommand(
  args: string,
  options: InstallerCommandOptions = {},
): string {
  const registry = normalizeRegistry(options.registry ?? defaultRegistry());
  const version = options.version ?? INSTALLER_VERSION;
  return `npx --yes --registry=${registry} ${INSTALLER_PACKAGE}@${version} ${args}`;
}
