import { EXIT_INVALID, InstallerError } from './errors.ts';
import { rebuildCommand } from './prechecks.ts';

/** A mount path as the server spells it: `/crm`, `/apps/crm`, or `''` for the origin root. */
export function normalizeMountPath(value: string): string {
  const trimmed = value.trim().replace(/^\/+|\/+$/gu, '');
  return trimmed ? `/${trimmed}` : '';
}

/** `--base-path`, checked and normalized; `undefined` when it was not given. */
export function parseBasePathFlag(
  value: string | undefined,
): string | undefined {
  if (value === undefined) return undefined;
  if (/[\s?#\\]/u.test(value) || value.split('/').includes('..')) {
    throw new InstallerError(
      'INVALID_USAGE',
      `--base-path ${JSON.stringify(value)} is not a URL path; give one such as /crm, or / for the origin root.`,
      { exitCode: EXIT_INVALID },
    );
  }
  return normalizeMountPath(value);
}

/**
 * A release built before relocatable builds has its mount path compiled into its client, and serves pages whose asset
 * URLs all miss anywhere else. It runs only where it was built for.
 */
export function assertFixedMountPath(
  subject: string,
  builtFor: string,
  mountedAt: string,
): void {
  if (normalizeMountPath(builtFor) === normalizeMountPath(mountedAt)) return;
  throw new InstallerError(
    'BASE_PATH_MISMATCH',
    `${subject} was built for the base path ${normalizeMountPath(builtFor) || '/'} and cannot be mounted at ${normalizeMountPath(mountedAt) || '/'}.`,
    {
      exitCode: EXIT_INVALID,
      suggestions: [
        {
          message:
            'Upgrade @nocobase/app-cli in the application project and build the archive again; a current build runs at any path:',
          run: rebuildCommand(),
        },
      ],
    },
  );
}
